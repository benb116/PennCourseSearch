console.time('Modules loaded');
// Initial configuration
var path = require('path');
var express = require('express');
var compression = require('compression');
var stormpath = require('express-stormpath');
var request = require("request");
var colors = require('colors');
var fs = require('fs');
var Keen = require('keen-js');
var PushBullet = require('pushbullet');
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
  config.MongoUser =  process.env.MONGOUSER;
  config.MongoPass =  process.env.MONGOPASS;
  config.MongoURI =   process.env.MONGOURI;
  config.STORMPATH_API_KEY_ID =     process.env.STORMPATH_API_KEY_ID;
  config.STORMPATH_API_KEY_SECRET = process.env.STORMPATH_API_KEY_SECRET;
  config.STORMPATH_SECRET_KEY =     process.env.STORMPATH_SECRET_KEY;
  config.STORMPATH_URL =            process.env.STORMPATH_URL;
  config.KeenIOID	=       process.env.KEEN_PROJECT_ID;
  config.KeenIOWriteKey	= process.env.KEEN_WRITE_KEY;
  config.PushBulletAuth	= process.env.PUSHBULLETAUTH;
}

var app = express();

// Set paths
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31536000000 }));

console.log('Express initialized');

app.use(stormpath.init(app, {
  apiKeyId:     config.STORMPATH_API_KEY_ID,
  apiKeySecret: config.STORMPATH_API_KEY_SECRET,
  secretKey:    config.STORMPATH_SECRET_KEY,
  application:  config.STORMPATH_URL,
  enableAccountVerification: true,
  enableForgotPassword: 		 true,
  expandCustomData:          true,
  // Make sessions expire after one week
  sessionDuration: 			1000 * 60 * 60 * 24 * 7
}));

// Set up Keen Analytics
var client = new Keen({
  projectId: config.KeenIOID,  // String (required always)
  writeKey: config.KeenIOWriteKey   // String (required for sending data)
});

// Initialize PushBullet
var pusher = new PushBullet(config.PushBulletAuth);
// Get first deviceID
var pushDeviceID;
pusher.devices(function(error, response) {
  pushDeviceID = response.devices[0].iden; 
});

console.log('Plugins initialized');

// Start the server
app.listen(process.env.PORT || 3000, function(){
  console.log("Node app is running. Better go catch it.".green);
  if (typeof process.env.PUSHBULLETAUTH !== 'undefined') {
    // Don't send notifications when testing locally
    pusher.note(pushDeviceID, 'Server Restart');
  }
});

// Rotating subtitles
var subtitles = [
  "Cause PennInTouch sucks", 
  "You can press the back button, but you don't even need to.",
  "Invented by Benjamin Franklin in 1793",
  "Focus on your classes, not your schedule.",
  "Faster than you can say 'Wawa run'",
  "Classes sine PennCourseSearch vanae.",
  "On PennCourseSearch, no one knows you're Amy G.",
  "Designed by Ben in Speakman. Assembled in China.",
  "Help! I'm trapped in a NodeJS server! Bring Chipotle!"];

var paymentNoteBase = "https://venmo.com/?txn=pay&recipients=BenBernstein&amount=1&share=f&audience=friends&note=";
var paymentNotes = [
  "PennCourseSearch%20rocks%20my%20socks!",
  "Donation%20to%20PennInTouch%20Sucks,%20Inc.",
  "For%20your%20next%20trip%20to%20Wawa"];

var currentTerm = '2015C';

// Handle main page requests
app.get('/', function(req, res) {
  var pennkey;
  if (req.user) {
    pennkey = req.user.email.split('@')[0];
  } else {
    pennkey = 'other';
  }
  var thissub = subtitles[Math.floor(Math.random() * subtitles.length)]; // Get random subtitle
  var fullPaymentNote = paymentNoteBase + paymentNotes[Math.floor(Math.random() * paymentNotes.length)]; // Get random payment note
  return res.render('index', { // Send page
    title: 'PennCourseSearch',
    subtitle: thissub,
    user: pennkey,
    paymentNote: fullPaymentNote,
    status: "hakol beseder" // Everything's OK in hebrew
  });
});

// For use below when sending JSON files
var sendRevOpts     = {root: __dirname + '/2015ARevRaw/', dotfiles: 'deny'};
var sendCourseOpts  = {root: __dirname + '/'+currentTerm+'/',       dotfiles: 'deny'};

// Manage search requests
app.get('/Search', stormpath.loginRequired, function(req, res) {
  var searchParam 	= req.query.searchParam; 	// The search terms
  var searchType 		= req.query.searchType; 	// Course ID, Keyword, or Instructor
  var resultType 		= req.query.resultType; 	// Course numbers, section numbers, section info
  var instructFilter 	= req.query.instFilter; 	// Is there an instructor filter?
  var reqFilter 		= req.query.reqParam;		// Is there a requirement filter?
  var proFilter		= req.query.proParam;		// So on ...
  var actFilter		= req.query.actParam;
  var includeOpen		= req.query.openAllow;
  var includeClosed	= req.query.closedAllow;
  var myPennkey 		= req.user.email.split('@')[0]; // Get Pennkey

  // Building the request URI
  if (typeof reqFilter 	=== 'undefined') {reqFilter 	= '';} else {reqFilter 	= '&fulfills_requirement='+reqFilter;}
  if (typeof proFilter 	=== 'undefined') {proFilter 	= '';} else {proFilter 	= '&program='+proFilter;}
  if (typeof actFilter 	=== 'undefined') {actFilter 	= '';} else {actFilter 	= '&activity='+actFilter;}
  if (typeof includeOpen	=== 'undefined') {includeOpen 	= '';} else {includeOpen = '&open=true';}

  var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=500&term='+currentTerm+reqFilter+proFilter+actFilter+includeOpen;

  if (searchType == 'courseIDSearch') {baseURL = baseURL + '&course_id='	+ searchParam;}
  if (searchType == 'keywordSearch')  {baseURL = baseURL + '&description='+ searchParam;}
  if (searchType == 'instSearch')     {baseURL = baseURL + '&instructor='	+ searchParam;}
  // If we are searching by a certain instructor, the course numbers will be filtered because of searchType 'instSearch'. 
  // However, clicking on one of those courses will show all sections, including those not taught by the instructor.
  // instructFilter is an extra parameter that allows further filtering of section results by instructor.
  if (instructFilter != 'all' && typeof instructFilter !== 'undefined') {baseURL = baseURL + '&instructor='+instructFilter;}

  // Keen.io logging
  var searchEvent = {
    searchType: searchType, 
    searchParam: searchParam,
    user: myPennkey
  };
  client.addEvent('Search', searchEvent, function(err, res) {if (err) {console.log(err);}});

  // Instead of searching the API for department-wide queries (which are very slow), get the preloaded results from the DB
  if (searchType 	== 'courseIDSearch' && 
      resultType 	== 'deptSearch' && 
      reqFilter 	=== '' && 
      proFilter 	=== '' && 
      actFilter 	=== '' && 
      includeOpen === '') {

    try {
      res.sendFile(searchParam.toUpperCase()+'.json', sendCourseOpts, function (err) {
        if (err) {
          // console.log(err);
          return res.send({});
        }
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
      	console.error('Request failed:', error);
      	return res.send('PCSERROR: request failed');
      }

      // Send the raw data to the appropriate formatting function
      var searchResponse;
      if (resultType == 'deptSearch'){
	       searchResponse = parseDeptList(body);
      } else if (resultType == 'numbSearch') {
	       searchResponse = parseCourseList(body); // Parse the numb response
      } else if (resultType == 'sectSearch') {
	       searchResponse = parseSectionList(body); // Parse the sect response
      } else {searchResponse = {};}
      return res.send(JSON.stringify(searchResponse)); // return correct info
    });
  }
});

// This function spits out the list of courses that goes in #CourseList
function parseDeptList(JSONString) {
  var Res = JSON.parse(JSONString); // Convert to JSON object
  var coursesList = {};
  for(var key in Res.result_data) {
    if (Res.result_data.hasOwnProperty(key)) { // Iterate through each course
      var courseListName 	= Res.result_data[key].course_department+' '+Res.result_data[key].course_number; // Get course dept and number
      var courseTitle 	= Res.result_data[key].course_title;
      coursesList[courseListName] = {'courseListName': courseListName, 'courseTitle': courseTitle};
    }
  }
  return coursesList;
}

function getTimeInfo(JSONObj) { // A function to retrieve and format meeting times
  OCStatus = JSONObj.course_status;
  var StatusClass;
  if (OCStatus == "O") {
    StatusClass = 'OpenSec'; // If section is open, add class open
  } else if (OCStatus == "C") {
    StatusClass = 'ClosedSec'; // If section is closed, add class closed
  } else {
    StatusClass = 'ErrorSec'; // Otherwise make it gray
  }
  var TimeInfo = [];
  try { // Not all sections have time info
    for(var meeting in JSONObj.meetings) {
      if (JSONObj.meetings.hasOwnProperty(meeting)) {
        // Some sections have multiple meeting forms (I'm looking at you PHYS151)
        var thisMeet = JSONObj.meetings[meeting];
        var StartTime 		= thisMeet.start_time.split(" ")[0]; // Get start time
        var EndTime 		= thisMeet.end_time.split(" ")[0];

        if (StartTime[0] == '0') {
          StartTime = StartTime.slice(1);
        } // If it's 08:00, make it 8:00
        if (EndTime[0] == '0') {
          EndTime = EndTime.slice(1);
        }

        var MeetDays = thisMeet.meeting_days; // Output like MWF or TR
        meetListInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays;
        TimeInfo.push(meetListInfo);
      }
    }
  }
  catch (err) {
    // console.log(("Error getting times" + JSONObj.section_id).red);
    var TimeInfo = '';
  }
  return [StatusClass, TimeInfo];
}

// This function spits out the list of sections that goes in #SectionList
function parseCourseList(JSONString) {
  // Convert to JSON object
  var Res = JSON.parse(JSONString);
  var sectionsList = {};
  for(var key in Res.result_data) {
    if (Res.result_data.hasOwnProperty(key)) { 
      var SectionName = Res.result_data[key].section_id_normalized.replace(/ /g, "").replace(/-/g, " ");
      var sectionNameNoSpace = Res.result_data[key].section_id;
      var TimeInfoArray = getTimeInfo(Res.result_data[key]); // Get meeting times for a section
      var StatusClass = TimeInfoArray[0];
      var TimeInfo = TimeInfoArray[1][0]; // Get the first meeting slot
      var actType = Res.result_data[key].activity;
      var SectionInst;
      try {
        SectionInst	= Res.result_data[key].instructors[0].name;
      } catch(err) {
        SectionInst = '';
      }
      
      // If there are multiple meeting times
      if (typeof TimeInfoArray[1][1] !== 'undefined') {
        TimeInfo += ' ...';
      }
      if (typeof TimeInfo === 'undefined') {
        TimeInfo = '';
      }

      sectionsList[sectionNameNoSpace] = {
        'SectionName': SectionName, 
        'StatusClass': StatusClass, 
        'TimeInfo': TimeInfo, 
        'NoSpace': sectionNameNoSpace, 
        'CourseTitle': Res.result_data[0].course_title,
        'SectionInst': SectionInst,
        'ActType': actType
      };
    }
  }
  courseInfo = parseSectionList(JSONString);

  return [sectionsList, courseInfo];
}

// This function spits out section-specific info
function parseSectionList(JSONString) {
  var Res = JSON.parse(JSONString); // Convert to JSON Object
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
    var termsOffered 	= entry.course_terms_offered;

    for(var listing in meetArray) {
      TimeInfo 		+= meetArray[listing].split("-")[1] + '<br>';
    }
    var OpenClose;
    if (StatusClass == "OpenSec") {
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

    sectionInfo = {
      'FullID': FullID, 
      'CourseID': CourseID,
      'Title': Title, 
      'Instructor': Instructor, 
      'Description': Desc, 
      'OpenClose': OpenClose, 
      'termsOffered': termsOffered, 
      'Prerequisites': prereq, 
      'TimeInfo': TimeInfo,
      'AssociatedType': asscType, 
      'AssociatedSections': asscList
    };
    return sectionInfo;
  }
  catch (err) {
    //console.log(err);
    return 'No Results';
  }
}

app.get('/NewReview', stormpath.loginRequired, function(req, res) {
  var thedept = req.query.dept;
  try {
    res.sendFile(thedept+'.json', sendRevOpts, function (err) {
      if (err) {
        // console.log(err);
        res.status(err.status).end();
      }
    });
  } catch(err) {
    return res.send('');
  }
});

// Manage requests regarding starred courses
app.get('/Star', stormpath.loginRequired, function(req, res) {
  var StarredCourses = [];
  var myPennkey = req.user.email.split('@')[0]; // Get Pennkey

  if(!req.user.customData.Starlist) {req.user.customData.Starlist = [];}
  StarredCourses = req.user.customData.Starlist;
  var addRem = req.query.addRem; // Are we adding, removing, or clearing?
  var courseID = req.query.courseID;

  var index;
  if (addRem == 'add') { 
    index = StarredCourses.indexOf(courseID);
    if (index == -1) { // If the section is not already in the list
      StarredCourses.push(courseID);
      var starEvent = {
        starCourse: courseID,
        user: myPennkey,
        keen: {timestamp: new Date().toISOString()}
      };
      client.addEvent('Star', starEvent, function(err, res) {
        if (err) {console.log(err);}
      });
    } 
    

  } else if (addRem == 'rem') { // If we need to remove
    index = StarredCourses.indexOf(courseID);
    if (index > -1) {StarredCourses.splice(index, 1);}

  } else if (addRem == 'clear') { // Clear all
    StarredCourses = [];
  }
  return res.send(StarredCourses);
});

// Manage scheduling requests
app.get('/Sched', stormpath.loginRequired, function(req, res) {
  var addRem      = req.query.addRem; // Are we adding, removing, or clearing?
  var courseID    = req.query.courseID;
  var schedName 	= req.query.schedName;
  var schedRename	= req.query.schedRename;
  var myPennkey 	= req.user.email.split('@')[0]; // Get Pennkey
  var userScheds  = req.user.customData.Schedules;

  if(!userScheds) {  // If there are no schedules defined
    userScheds = {'Schedule': {}};
  }
  if(!userScheds[schedName] && typeof schedName != 'undefined') {
    userScheds[schedName] = {}; // Create a schedule if the name doesn't exist
  }
  var SchedCourses = userScheds[schedName];

  if (addRem == 'add') { // If we need to add, then we get meeting info for the section
    request({
      uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?term='+currentTerm+'&course_id='+courseID,
      method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
    }, function(error, response, body) {
      resJSON = getSchedInfo(body); // Format the response
      for (var JSONSecID in resJSON) { if (resJSON.hasOwnProperty(JSONSecID)) { // Compile a list of courses
        SchedCourses[JSONSecID] = resJSON[JSONSecID];
      }}
      var schedEvent = {schedCourse: courseID,user: myPennkey,keen: {timestamp: new Date().toISOString()}};
      client.addEvent('Sched', schedEvent, function(err, res) {if (err) {console.log(err);}});

      userScheds[schedName] = SchedCourses;
      req.user.customData.Schedules = userScheds;
      req.user.customData.save(function(err, updatedUser) {if (err) {console.log('ERR: '+err);}});
      return res.send(SchedCourses);
    });

  } else if (addRem == 'rem') { // If we need to remove
    for (var meetsec in SchedCourses) { if (SchedCourses.hasOwnProperty(meetsec)) {
      if (SchedCourses[meetsec].fullCourseName.replace(/ /g, "") == courseID) { // Find all meeting times of a given course
        delete SchedCourses[meetsec];
      }}
    }
    userScheds[schedName] = SchedCourses;

  } else if (addRem == 'dup') { // Duplicate a schedule
    while (Object.keys(userScheds).indexOf(schedName) != -1) {
      var lastchar = schedName[schedName.length - 1];
      if (isNaN(lastchar) || schedName[schedName.length - 2] != ' ') { // e.g. 'schedule' or 'ABC123'
        schedName += ' 2';
      } else { // e.g. 'MEAM 101 2'
        schedName = schedName.slice(0, -2) + ' ' + (parseInt(lastchar) + 1);
      }
    }
    userScheds[schedName] = SchedCourses;

  } else if (addRem == 'ren') { // Delete
    userScheds[schedRename] = userScheds[schedName];
    delete userScheds[schedName];
    
  } else if (addRem == 'clr') { // Clear all
    SchedCourses = {};
    userScheds[schedName] = SchedCourses;

  } else if (addRem == 'del') { // Delete
    delete userScheds[schedName];
    if(Object.getOwnPropertyNames(userScheds).length === 0){
      userScheds.Schedule = {};
    } 
  }

  req.user.customData.Schedules = userScheds;
  req.user.customData.save(function(err, updatedUser) {if (err) {console.log('ERR: '+err);}});

 if (addRem == 'rem' || addRem == 'clr') {
    return res.send(userScheds[schedName]);
  } else if (addRem != 'add') {
    return res.send(userScheds);
  }
});

function getSchedInfo(JSONString) { // Get the properties required to schedule the section
  var Res = JSON.parse(JSONString); // Convert to JSON Object
  var entry = Res.result_data[0];
  try {
    var SectionName = entry.section_id_normalized.replace(/ /g, "-").replace(/-/g, " "); // Format name
    var SectionID 	= entry.section_id_normalized.replace(/ /g, ""); // Format ID
    var resJSON 	= {};
    try { // Not all sections have time info
      for(var meeti in entry.meetings) { if (entry.meetings.hasOwnProperty(meeti)) { // Some sections have multiple meetings
      	var thisMeet = entry.meetings[meeti];
        var StartTime 	= (thisMeet.start_hour_24) + (thisMeet.start_minutes)/60; 
      	var EndTime 	= (thisMeet.end_hour_24) 	+ (thisMeet.end_minutes)/60;
      	var hourLength 	= EndTime - StartTime;
      	var MeetDays 	= thisMeet.meeting_days;
      	var OpenClose 	= entry.course_status_normalized;
      	var Building, Room;
        try {
      	 Building 	= thisMeet.building_code;
      	 Room 		= thisMeet.room_number;
      	} catch (err) {
      	 Building 	= "";
      	 Room 		= "";
      	}

      	// Full ID will have sectionID+MeetDays+StartTime
      	// This is necessary for classes like PHYS151, which has times: M@13, TR@9, AND R@18
      	var FullID = SectionID+'-'+MeetDays+StartTime.toString().replace(".", "");

      	resJSON[FullID] = {	
          'fullCourseName': 	SectionName,
  				'HourLength': 		hourLength,
  				'meetDay': 			MeetDays,
  				'meetHour': 		StartTime,
  				'meetRoom': 		Building+' '+Room
  		  };
      }}
    }
    catch (err) {
      console.log("Error getting times: "+err);
      var TimeInfo = '';
    }
    return resJSON;
  }
  catch (err) {
    return 'No Results';
  }
}
