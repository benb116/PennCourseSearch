console.time('Modules loaded');
// Initial configuration
var path        = require('path');
var express     = require('express');
var compression = require('compression');
// var stormpath   = require('express-stormpath');
var request     = require("request");
var colors      = require('colors');
var fs          = require('fs');
var Keen        = require('keen-js');
var PushBullet  = require('pushbullet');
var git         = require('git-rev');

require('log-timestamp')(function() { return new Date().toISOString() + ' %s'; });

console.timeEnd('Modules loaded');

// I don't want to host a config file on Github. When running locally, the app has access to a local config file.
// On Heroku/DigitalOcean, there is no config file so I use environment variables instead
var config;
try {
  config = require('./config.js');
} catch (err) { // If there is no config file
  config = {};
  config.requestAB =  process.env.REQUESTAB;
  config.requestAT =  process.env.REQUESTAT;
  config.PCRToken =   process.env.PCRTOKEN;
  config.STORMPATH_API_KEY_ID =     process.env.STORMPATH_API_KEY_ID;
  config.STORMPATH_API_KEY_SECRET = process.env.STORMPATH_API_KEY_SECRET;
  config.STORMPATH_SECRET_KEY =     process.env.STORMPATH_SECRET_KEY;
  config.STORMPATH_URL =            process.env.STORMPATH_URL;
  config.KeenIOID =       process.env.KEEN_PROJECT_ID;
  config.KeenIOWriteKey = process.env.KEEN_WRITE_KEY;
  config.PushBulletAuth = process.env.PUSHBULLETAUTH;
  config.autotestKey =    process.env.AUTOTESTKEY;
}

var app = express();

// Set express settings
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31536000000 }));

console.log('Express initialized');

// Set up Keen Analytics
var client = new Keen({
  projectId: config.KeenIOID,  // String (required always)
  writeKey: config.KeenIOWriteKey   // String (required for sending data)
});

var logEvent = function (eventName, eventData) {
  client.addEvent(eventName, eventData, function (err, res) {
    if (err) {
      console.log("KEENIOERROR: " + err);
    }
  });
};

// Initialize PushBullet
var pusher = new PushBullet(config.PushBulletAuth);
// Get first deviceID
var pushDeviceID;
pusher.devices(function(error, response) {
  pushDeviceID = response.devices[0].iden; 
});

console.log('Plugins initialized');
console.time('Reviews loaded');
var allRevs     = require('./loadRevs.js');
console.timeEnd('Reviews loaded');

git.short(function (str) {
  console.log('Current git commit:', str);
});

// Start the server
app.listen(process.env.PORT || 3000, function(){
  console.log("Node app is running. Better go catch it.".green);
  if (typeof process.env.PUSHBULLETAUTH !== 'undefined') {
    // Don't send notifications when testing locally
    pusher.note(pushDeviceID, 'Server Restart');
  }
});

var currentTerm = '2016A';
var latestRev = '2015C';

// Handle main page requests
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname+'/views/index.html'));
});

app.get('/Status', function(req, res) {
  res.send('hakol beseder');
});

// For use below when sending JSON files
var sendRevOpts     = {root: __dirname + '/'+latestRev+'Rev/', dotfiles: 'deny'};
var sendCourseOpts  = {root: __dirname + '/'+currentTerm+'/',       dotfiles: 'deny'};

var searchTypes = {
  courseIDSearch: '&course_id=',
  keywordSearch: '&description=',
  instSearch: '&instructor='
};

var filterURI = {
  reqFilter: '&fulfills_requirement=',
  proFilter: '&program=',
  actFilter: '&activity=',
  includeOpen: '&open=true'
};

var buildURI = function (filter, type) {
  if (typeof filter === 'undefined') {
    return '';
  } else {
    if (type === 'includeOpen') {
      return filterURI[type];
    } else {
      return filterURI[type] + filter;
    }
  }
};

var resultTypes = {
  deptSearch: parseCourseList,
  numbSearch: parseSectionList,
  sectSearch: parseSectionInfo
};

var BASE_URL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=500&term=';

// Manage search requests
app.get('/Search', function(req, res) {
  var searchParam     = req.query.searchParam;  // The search terms
  var searchType      = req.query.searchType;   // Course ID, Keyword, or Instructor
  var resultType      = req.query.resultType;   // Course numbers, section numbers, section info
  var instructFilter  = req.query.instFilter;   // Is there an instructor filter?

  if (req.query.reqParam == 'MDO' || req.query.reqParam == 'MDN') {req.query.reqParam += ',MDB';}
  // Building the request URI
  var reqSearch = buildURI(req.query.reqParam, 'reqFilter');
  var proSearch = buildURI(req.query.proParam, 'proFilter');
  var actSearch = buildURI(req.query.actParam, 'actFilter');
  var includeOpen = buildURI(req.query.openAllow, 'includeOpen');

  var baseURL = BASE_URL + currentTerm + reqSearch + proSearch + actSearch + includeOpen;

  if (searchType) {
    baseURL += searchTypes[searchType] + searchParam;
  }
  // If we are searching by a certain instructor, the course numbers will be filtered because of searchType 'instSearch'. 
  // However, clicking on one of those courses will show all sections, including those not taught by the instructor.
  // instructFilter is an extra parameter that allows further filtering of section results by instructor.
  if (instructFilter !== 'all' && typeof instructFilter !== 'undefined') {
    baseURL += '&instructor=' + instructFilter;
  }
  // Keen.io logging
  var searchEvent;

  // Instead of searching the API for department-wide queries (which are very slow), get the preloaded results from the DB
  if (searchType  === 'courseIDSearch' && 
      resultType  === 'deptSearch' && 
      !reqSearch && !proSearch && !actSearch && !includeOpen ) {
    try {
      fs.readFile('./2016A/'+searchParam.toUpperCase()+'.json', function (err, data) {
        if (err) {return res.send([]);}
        searchEvent = {
          searchType: searchType, 
          searchParam: searchParam
        };
        // logEvent('Search', searchEvent);
        return res.send(ParseDeptList(JSON.parse(data)));
      });
    } catch(err) {
      return res.send('');
    }
  } else {
    request({
      uri: baseURL,
      method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
    }, function(error, response, body) {

      if (error) {
        console.log('OpenData Request failed:', error);
        return res.send('PCSERROR: request failed');
      }

      var parsedRes = {};
      try {
        parsedRes = JSON.parse(body);
      } catch(err) {
        return res.send("Can't parse JSON response");
      }
      // Send the raw data to the appropriate formatting function
      var searchResponse;
      if (resultType in resultTypes) {
        searchResponse = resultTypes[resultType](parsedRes);
      } else {
        searchEvent = {};
      }
      searchEvent = {
        searchType: searchType, 
        searchParam: searchParam
      };

      // logEvent('Search', searchEvent);
      return res.send(JSON.stringify(searchResponse)); // return correct info
    });
  }
});

var reqCodes = {
  Society: "MDS",
  History: "MDH",
  Arts: "MDA",
  Humanities: "MDO",
  Living: "MDL",
  Physical: "MDP",
  Natural: "MDN",
  Writing: "MWC",
  College: "MQS",
  Formal: "MFR",
  Cross: "MC1",
  Cultural: "MC2"
};

function GetRevData (dept, num, inst) {
  var revData = allRevs[dept][num];
  var thisRevData = {};
  if (revData) {
    thisRevData = (revData[(inst || '').toUpperCase()] || revData.Total);
  } else {
    thisRevData = {"cQ": 0, "cD": 0, "cI": 0};
  }
  return thisRevData;
}

function ParseDeptList (res) {
  for (var course in res) {
    var courData = res[course].idSpaced.split(' ');
    var courDept = courData[0];
    var courNum = courData[1];
    res[course].revs = GetRevData(courDept, courNum);
  }
  return res;
}

// This function spits out the list of courses that goes in #CourseList
function parseCourseList(Res) {
  var coursesList = {};
  for(var key in Res.result_data) { if (Res.result_data.hasOwnProperty(key)) {
    var thisKey   = Res.result_data[key];
    var thisDept  = thisKey.course_department.toUpperCase();
    var thisNum   = thisKey.course_number.toString();
    var courseListName  = thisDept+' '+thisNum; // Get course dept and number
    if (Res.result_data.hasOwnProperty(key) && !coursesList[courseListName] && !thisKey.is_cancelled) { // Iterate through each course
      var courseTitle   = thisKey.course_title;
      var reqList       = thisKey.fulfills_college_requirements;
      var reqCodesList  = [];
      try {
        reqCodesList[0] = reqCodes[reqList[0].split(" ")[0]];
        reqCodesList[1] = reqCodes[reqList[1].split(" ")[0]];
      } catch(err) {}
      var revData = GetRevData(thisDept, thisNum);
      coursesList[courseListName] = {
        'idSpaced': courseListName, 
        'idDashed': courseListName.replace(/ /g,'-'),
        'courseTitle': courseTitle,
        'courseReqs': reqCodesList,
        'revs': revData
      };
    }
  }}
  var arrResp = [];
  for (var course in coursesList) {
    arrResp.push(coursesList[course]);
  }
  return arrResp;
}

function getTimeInfo (JSONObj) { // A function to retrieve and format meeting times
  var OCStatus = JSONObj.course_status;
  var isOpen;
  if (OCStatus === "O") {
    isOpen = true; // If section is open, add class open
  } else {
    isOpen = false; // Otherwise make it gray
  }
  var TimeInfo = [];
  try { // Not all sections have time info
    for(var meeting in JSONObj.meetings) {
      if (JSONObj.meetings.hasOwnProperty(meeting)) {
        // Some sections have multiple meeting forms (I'm looking at you PHYS151)
        var thisMeet = JSONObj.meetings[meeting];
        var StartTime     = thisMeet.start_time.split(" ")[0]; // Get start time
        var EndTime     = thisMeet.end_time.split(" ")[0];

        if (StartTime[0] === '0') {
          StartTime = StartTime.slice(1);
        } // If it's 08:00, make it 8:00
        if (EndTime[0] === '0') {
          EndTime = EndTime.slice(1);
        }

        var MeetDays = thisMeet.meeting_days; // Output like MWF or TR
        var meetListInfo = StartTime+" to "+EndTime+" on "+MeetDays;
        TimeInfo.push(meetListInfo);
      }
    }
  }
  catch (err) {
    // console.log(("Error getting times" + JSONObj.section_id).red);
    TimeInfo = '';
  }
  return [isOpen, TimeInfo];
}

// This function spits out the list of sections that goes in #SectionList
function parseSectionList(Res) {
  // Convert to JSON object
  var sectionsList = [];
  // var courseInfo = {};
  for(var key in Res.result_data) {
    if (Res.result_data.hasOwnProperty(key)) {
      var thisEntry = Res.result_data[key];
      if (!thisEntry.is_cancelled) {
        var idDashed = thisEntry.section_id_normalized.replace(/ /g, "");
        var idSpaced = idDashed.replace(/-/g, ' ');
        var timeInfoArray = getTimeInfo(thisEntry); // Get meeting times for a section
        var isOpen = timeInfoArray[0];
        var timeInfo = timeInfoArray[1][0]; // Get the first meeting slot
        var actType = thisEntry.activity;
        var SectionInst;
        try {
          SectionInst = thisEntry.instructors[0].name;
        } catch(err) {
          SectionInst = '';
        }

        var revData = GetRevData(thisEntry.course_department, thisEntry.course_number, SectionInst);
        
        // If there are multiple meeting times
        if (typeof timeInfoArray[1][1] !== 'undefined') {
          timeInfo += ' ...';
        }
        if (typeof timeInfo === 'undefined') {
          timeInfo = '';
        }

        sectionsList.push({
          'idDashed': idDashed, 
          'idSpaced': idSpaced,
          'isOpen': isOpen, 
          'timeInfo': timeInfo, 
          'courseTitle': Res.result_data[0].course_title,
          'SectionInst': SectionInst,
          'actType': actType,
          'revs': revData,
          'isScheduled': false
        });
      }
    }
  }
  sectionInfo = parseSectionInfo(Res);

  return [sectionsList, sectionInfo];
}

// This function spits out section-specific info
function parseSectionInfo(Res) {
  var entry = Res.result_data[0];
  var sectionInfo = {};
  try {
    var Title = entry.course_title;
    var FullID = entry.section_id_normalized.replace(/-/g, " "); // Format name
    var CourseID = entry.section_id_normalized.split('-')[0] + ' ' + entry.section_id_normalized.split('-')[1];
    var Instructor;
    try {
      Instructor = entry.instructors[0].name;
    } catch (err) {
      Instructor = "";
    }
    var Desc = entry.course_description;
    var TimeInfoArray = getTimeInfo(entry);
    var StatusClass = TimeInfoArray[0];
    var meetArray = TimeInfoArray[1];
    var TimeInfo = '';
    var prereq = entry.prerequisite_notes[0];
    if (typeof prereq === 'undefined') {
      prereq = "none";
    }
    var termsOffered  = entry.course_terms_offered;

    var OpenClose;
    if (StatusClass === "OpenSec") {
      OpenClose = 'Open';
    } else {
      OpenClose = 'Closed';
    }

    var asscType = '';
    var asscList = [];
    var key;
    if (entry.recitations.length !== 0) { // If it has recitations
      asscType = "Recitations";
      for(key in entry.recitations) {
        if (entry.recitations.hasOwnProperty(key)) { 
          asscList.push(entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id);
        }
      }
    } else if (entry.labs.length !== 0) { // If it has labs
      asscType = "Labs";
      for(key in entry.labs) {
        if (entry.labs.hasOwnProperty(key)) { 
          asscList.push(entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id);
        }
      }
    } else if (entry.lectures.length !== 0) { // If it has lectures
      asscType = "Lectures";
      for(key in entry.lectures) {
        if (entry.lectures.hasOwnProperty(key)) { 
          asscList.push(entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id);
        }
      }
    }

    var reqsArray = entry.fulfills_college_requirements;

    sectionInfo = {
      'fullID': FullID, 
      'CourseID': CourseID,
      'title': Title, 
      'instructor': Instructor, 
      'description': Desc, 
      'openClose': OpenClose, 
      'termsOffered': termsOffered, 
      'prereqs': prereq, 
      'timeInfo': meetArray,
      'associatedType': asscType, 
      'associatedSections': asscList,
      'reqsFilled': reqsArray
    };
    return sectionInfo;
  }
  catch (err) {
    //console.log(err);
    return 'No Results';
  }
}

// Manage scheduling requests
app.get('/Sched', function(req, res) {
  var courseID    = req.query.courseID;
  var SchedCourses = [];
  request({
    uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?term='+currentTerm+'&course_id='+courseID,
    method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
  }, function(error, response, body) {
    var resJSON = getSchedInfo(body); // Format the response
    // for (var JSONSecID in resJSON) { if (resJSON.hasOwnProperty(JSONSecID)) { // Compile a list of courses
    //   SchedCourses[JSONSecID] = resJSON[JSONSecID];
    // }}
    var schedEvent = {schedCourse: courseID};
    // logEvent('Sched', schedEvent);
    return res.send(resJSON);
  });
  // }
});

function getSchedInfo(JSONString) { // Get the properties required to schedule the section
  var Res = JSON.parse(JSONString); // Convert to JSON Object
  var entry = Res.result_data[0];
  try {
    var idDashed   = entry.section_id_normalized.replace(/ /g, ""); // Format ID
    var idSpaced = idDashed.replace(/-/g, ' ');
    var resJSON   = [];
    try { // Not all sections have time info
      for(var meeti in entry.meetings) { if (entry.meetings.hasOwnProperty(meeti)) { // Some sections have multiple meetings
        var thisMeet = entry.meetings[meeti];
        var StartTime   = (thisMeet.start_hour_24) + (thisMeet.start_minutes)/60; 
        var EndTime   = (thisMeet.end_hour_24)  + (thisMeet.end_minutes)/60;
        var hourLength  = EndTime - StartTime;
        var MeetDays  = thisMeet.meeting_days;
        var OpenClose   = entry.course_status_normalized;
        var Building, Room;
        try {
         Building   = thisMeet.building_code;
         Room     = thisMeet.room_number;
        } catch (err) {
         Building   = "";
         Room     = "";
        }

        // Full ID will have sectionID+MeetDays+StartTime
        // This is necessary for classes like PHYS151, which has times: M@13, TR@9, AND R@18
        var FullID = idDashed+'-'+MeetDays+StartTime.toString().replace(".", "");

        resJSON.push({ 
          'fullID': FullID,
          'idDashed':   idDashed,
          'idSpaced': idSpaced,
          'hourLength':     hourLength,
          'meetDay':      MeetDays,
          'meetHour':     StartTime,
          'meetLoc':     Building+' '+Room
        });
      }}
    }
    catch (err) {
      console.log("Error getting times: "+err);
      var TimeInfo = '';
    }
    // console.log(JSON.stringify(resJSON))
    return resJSON;
  }
  catch (err) {
    return 'No Results';
  }
}

app.post('/Notify', function(req, res) {
  var secID = req.query.secID;
  // var formatSecID = secID.replace(/-/g, ' ');
  var userEmail = req.query.email;

  request({
      uri: 'http://www.penncoursenotify.com/',
      method: "POST",
      form: {'course': secID, 'email': userEmail}
    }, function(error, response, body) {
      var returnText = "Sorry, there was an error while trying set up notifications.";
      res.statusCode = 201;
      try {
        if (response.statusCode === 406) {
          returnText = "Notifications already requested.";
          res.statusCode = 200;
        } else if (body.split('<h3>')[1].split('</h3>')[0] === "Success!") {
          returnText = "Great! You'll be notified if "+secID+" opens up.";
          res.statusCode = 200;
        }
      } catch(err) {
        // console.log(err);
      }
      // logEvent('Notify', {user: userEmail.split("@")[0], secID: secID});
      return res.send(returnText);
  });
});