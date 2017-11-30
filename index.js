console.time('Modules loaded');
// Initial configuration
var path        = require('path');
var express     = require('express');
var compression = require('compression');
var request     = require('request');
var Keen        = require('keen-js');
var git         = require('git-rev');

require('log-timestamp')(function() { return new Date().toISOString() + ' %s'; });

console.timeEnd('Modules loaded');

// I don't want to host a config file on Github. When running locally, the app has access to a local config file.
// In production, there is no config file so I use environment variables instead
var config;
try {
	config = require('./config.js');
} catch (err) { // If there is no config file
	config = {};
	config.requestAB      = process.env.REQUESTAB;
	config.requestAT      = process.env.REQUESTAT;
	config.PCRToken	      = process.env.PCRTOKEN;
	config.KeenIOID	      = process.env.KEEN_PROJECT_ID;
	config.KeenIOWriteKey = process.env.KEEN_WRITE_KEY;
	config.autotestKey    = process.env.AUTOTESTKEY;
}

var app = express();

// Set express settings
app.use(compression());
app.use('/js/plugins', express.static(path.join(__dirname, 'public/js/plugins'), { maxAge: 2628000000 }));
app.use('/js', express.static(path.join(__dirname, 'public/js'), { maxAge: 0 }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 2628000000 }));

console.log('Express initialized');

// Set up Keen Analytics
var client;
var keenEnable = true;
if (process.env.KEEN_WRITE_KEY && keenEnable) { // Only log from production
	console.log('KeenIO logging enabled');
	client = new Keen({
		projectId: config.KeenIOID,	// String (required always)
		writeKey: config.KeenIOWriteKey	 // String (required for sending data)
	});
}

var logEvent = function (eventName, eventData) {
	if (client) {
		client.addEvent(eventName, eventData, function (err) {
			if (err) {
				console.log("KEENIOERROR: " + err);
			}
		});
	}
};

var IFTTTMaker = require('iftttmaker')(config.IFTTTKey);

function SendError(errmsg) {
	IFTTTMaker.send('PCSError', errmsg).then(function () {
	  console.log('Request was sent');
	}).catch(function (error) {
	  console.log('The request could not be sent:', error);
	});
}

console.log('Plugins initialized');

// Pull in course and review information
console.time('Info loaded');
var allRevs		= require('./loadRevs.js');
var allCourses	= require('./loadCourses.js');
var r = require('./reqFunctions.js'); // Functions that help determine which req rules apply to a class
console.timeEnd('Info loaded');

git.short(function (str) {
	console.log('Current git commit:', str); // log the current commit we are running
});

// Start the server
app.listen(process.env.PORT || 3000, function(){
	console.log("Node app is running. Better go catch it.");
});

var currentTerm = '2018A'; // Which term is currently active

// Handle main page requests
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname+'/views/index.html'));
});
// Handle status requests. This lets the admin disseminate info if necessary
app.get('/Status', function(req, res) {
	var statustext = 'hakol beseder'; // Means "everything is ok" in Hebrew
	// Penn InTouch often is refreshing data between 1:00 AM and 5:00 AM, which renders the API useless.
	// This is just letting the user know.
	var now = new Date();
	var hour = now.getHours();
	if (hour >= 5 && hour < 9) {
		statustext = "Penn InTouch sometimes screws up around this time of night, which can cause problems with PennCourseSearch. <br> Sorry in advance.";
	}
	res.send(statustext);
});

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
	var searchParam    = req.query.searchParam;	// The search terms
	var searchType     = req.query.searchType;	 // Course ID, Keyword, or Instructor
	var resultType     = req.query.resultType;	 // Course numbers, section numbers, section info
	var instructFilter = req.query.instFilter;	 // Is there an instructor filter?

	// Keen.io logging
	var searchEvent = {searchParam: searchParam};
	if (searchParam) {
		logEvent('Search', searchEvent);
	}

	if (searchType === 'courseIDSearch' && resultType === 'deptSearch' &&!req.query.proParam) { // If we can return results from cached data
		var returnCourses = allCourses;

		if (searchParam) { // Filter by department
			var returnCourses = returnCourses.filter(function(obj) {return (obj.idDashed.split('-')[0] === searchParam.toUpperCase());})
		}
		if (req.query.reqParam) { // Filter by requirement
			var returnCourses = returnCourses.filter(function(obj) {return ((obj.courseReqs.indexOf(req.query.reqParam) > -1))})
		}

		retC = ParseDeptList(returnCourses)
		return res.send(returnCourses)

	} else { // Otherwise, ask the API
		// Building the request URI
		var reqSearch = buildURI("", 'reqFilter');
		// Don't try to ask API about Wharton and Engineering requirements
		if (!(req.query.reqParam && (req.query.reqParam.charAt(0) === "W" || req.query.reqParam.charAt(0) === "E"))) {

			// For some reason, these two req codes need extra characters at the end when searching the API
			if (req.query.reqParam === 'MDO' || req.query.reqParam === 'MDN') {
				req.query.reqParam += ',MDB';
			}
			reqSearch = buildURI(req.query.reqParam, 'reqFilter');
		}

		var proSearch   = buildURI(req.query.proParam, 'proFilter');
		var actSearch   = buildURI(req.query.actParam, 'actFilter');
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

		SendPennReq(baseURL, resultType, res);

	}
});

function SendPennReq (url, resultType, res) {
	request({
		uri: url,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT}, // Send authorization headers
	}, function(error, response, body) {
		if (error) {
			console.log(response)
			console.log('OpenData Request failed:', error);
			SendError('OpenData Request failed');
			res.statusCode = 512;
			return res.send('PCSERROR: request failed');
		}

		var parsedRes, rawResp = {};
		try { // Try to make into valid JSON
			rawResp = JSON.parse(body);
			if (rawResp.statusCode) {
				SendError('Status Code');
				res.statusCode = 512; // Reserved error code to tell front end that its a Penn InTouch problem, not a PCS problem
				return res.send('status code error');
			}
		} catch(err) {
			console.log('Resp parse error ' + err);
			SendError('Parse Error!!!');
			console.log(response);
			console.log(JSON.stringify(response));
			return res.send({});
		}

		try {
			if (rawResp.service_meta.error_text) { // If the API returned an error
				console.log('Resp Err: ' + rawResp.service_meta.error_text);
				SendError('Error Text');
				res.statusCode = 513; // Reserved error code to tell front end that its a Penn InTouch problem, not a PCS problem
				return res.send(rawResp.service_meta.error_text);
			}
			parsedRes = rawResp.result_data;
		} catch(err) {
			console.log(err);
			SendError('Other Error!!!');
			res.statusCode = 500;
			return res.send(err);
		}

		// Send the raw data to the appropriate formatting function
		var searchResponse;
		if (resultType in resultTypes) {
			searchResponse = resultTypes[resultType](parsedRes);
		} else {
			searchResponse = {};
		}
		return res.send(JSON.stringify(searchResponse)); // return correct info
	});
}

function GetRevData (dept, num, inst) {
	// Given a department, course number, and instructor (optional), get back the three rating values
	var deptData = allRevs[dept]; // Get dept level ratings
	var thisRevData = {"cQ": 0, "cD": 0, "cI": 0};
	if (deptData) {
		var revData = deptData[num]; // Get course level ratings
		if (revData) {
			// Try to get instructor specific reviews, but fallback to general course reviews
			thisRevData = (revData[(inst || '').trim().toUpperCase()] || (revData.Recent));
		}
	}
	return thisRevData;
}

function ParseDeptList (res) {
	for (var course in res) { if (res.hasOwnProperty(course)) {
		var courData     = res[course].idSpaced.split(' ');
		var courDept     = courData[0];
		var courNum      = courData[1];
		res[course].revs = GetRevData(courDept, courNum); // Append PCR data to courses
	}}
	return res;
}

// This function spits out the array of courses that goes in #CourseList
function parseCourseList(Res) {
	var coursesList = {};
	for(var key in Res) { if (Res.hasOwnProperty(key)) {
		var thisKey	 = Res[key];

		if (Res.hasOwnProperty(key) && !thisKey.is_cancelled) { // Iterate through each course that isn't cancelled
			var thisDept       = thisKey.course_department.toUpperCase();
			var thisNum	       = thisKey.course_number.toString();
			var courseListName = thisDept+' '+thisNum; // Get course dept and number
			var numCred        = Number(thisKey.credits.split(" ")[0]); // How many credits does this section count for

			if (!coursesList[courseListName]) { // If there's no entry, make a new one
				var courseTitle  = thisKey.course_title;
				var reqCodesList = r.GetRequirements(thisKey); // Check which requirements are fulfilled by this course
				var revData      = GetRevData(thisDept, thisNum); // Get review information
				coursesList[courseListName] = {
					'idSpaced': courseListName,
					'idDashed': courseListName.replace(/ /g,'-'),
					'courseTitle': courseTitle,
					'courseReqs': reqCodesList[0],
					'courseCred': numCred,
					'revs': revData
				};
			} else if (coursesList[courseListName].courseCred < numCred) { // If there is an entry, choose the higher of the two numcred values
				coursesList[courseListName].courseCred = numCred
			}
		}
	}}
	var arrResp = [];
	for (var course in coursesList) { if (coursesList.hasOwnProperty(course)) {
		arrResp.push(coursesList[course]); // Convert from object to array
	}}
	return arrResp;
}

function getTimeInfo (JSONObj) { // A function to retrieve and format meeting times
	var OCStatus = JSONObj.course_status; // Is the section open or closed
	var isOpen;
	if (OCStatus === "O") {
		isOpen = true;
	} else {
		isOpen = false;
	}
	var TimeInfo = []; // Timeinfo is textual e.g. '10:00 to 11:00 on MWF'
	try { // Not all sections have time info
		for(var meeting in JSONObj.meetings) { if (JSONObj.meetings.hasOwnProperty(meeting)) {
			// Some sections have multiple meeting forms (I'm looking at you PHYS151)
			var thisMeet = JSONObj.meetings[meeting];
			var StartTime= thisMeet.start_time.split(" ")[0]; // Get start time
			var EndTime	 = thisMeet.end_time.split(" ")[0]; // Get end time

			if (StartTime[0] === '0') {
				StartTime = StartTime.slice(1);
			} // If it's 08:00, make it 8:00
			if (EndTime[0] === '0') {
				EndTime = EndTime.slice(1);
			}

			var MeetDays = thisMeet.meeting_days; // Output like MWF or TR
			var meetListInfo = StartTime+" to "+EndTime+" on "+MeetDays;
			TimeInfo.push(meetListInfo);
		}}
	}
	catch (err) {
		console.log(("Error getting times" + JSONObj.section_id));
		TimeInfo = '';
	}
	return [isOpen, TimeInfo];
}

// This function spits out the list of sections that goes in #SectionList
function parseSectionList(Res) {
	// Convert to JSON object
	var sectionsList = [];
	// var courseInfo = {};
	for(var key in Res) {
		if (Res.hasOwnProperty(key)) {
			var thisEntry = Res[key];
			if (!thisEntry.is_cancelled) {
				var idDashed      = thisEntry.section_id_normalized.replace(/ /g, "");
				var idSpaced      = idDashed.replace(/-/g, ' ');
				var timeInfoArray = getTimeInfo(thisEntry); // Get meeting times for a section
				var isOpen        = timeInfoArray[0];
				var timeInfo      = timeInfoArray[1][0]; // Get the first meeting slot
				if (timeInfoArray[1][1]) { // Cut off extra text
					timeInfo += ' ...';
				}
				var actType       = thisEntry.activity;
				var SectionInst; // Get the instructor for this section
				try {
					SectionInst = thisEntry.instructors[0].name;
				} catch(err) {
					SectionInst = '';
				}

				var revData = GetRevData(thisEntry.course_department, thisEntry.course_number, SectionInst); // Get inst-specific reviews

				if (typeof timeInfo === 'undefined') {
					timeInfo = '';
				}

				var schedInfo = getSchedInfo(thisEntry);

				sectionsList.push({
					'idDashed': idDashed,
					'idSpaced': idSpaced,
					'isOpen': isOpen,
					'timeInfo': timeInfo,
					'courseTitle': Res[0].course_title,
					'SectionInst': SectionInst,
					'actType': actType,
					'revs': revData,
					'fullSchedInfo': schedInfo
				});
			}
		}
	}
	var sectionInfo = parseSectionInfo(Res);

	return [sectionsList, sectionInfo];
}

// This function spits out section-specific info
function parseSectionInfo(Res) {
	var entry = Res[0];
	var sectionInfo = {};
	// try {
	if (entry) {
		var Title         = entry.course_title;
		var FullID        = entry.section_id_normalized.replace(/-/g, " "); // Format name
		var CourseID      = entry.section_id_normalized.split('-')[0] + ' ' + entry.section_id_normalized.split('-')[1];
		var Instructor    = '';
		if (entry.instructors[0]) {
			Instructor    = entry.instructors[0].name;
		}
		var Desc          = entry.course_description;
		var TimeInfoArray = getTimeInfo(entry);
		var StatusClass   = TimeInfoArray[0];
		var meetArray     = TimeInfoArray[1];
		var prereq        = (entry.prerequisite_notes[0] || 'none');
		var termsOffered  = entry.course_terms_offered;

		var OpenClose;
		if (StatusClass) {
			OpenClose = 'Open';
		} else {
			OpenClose = 'Closed';
		}
		var secCred = Number(entry.credits.split(" ")[0]);

		var asscType = '';
		var asscList = [];
		var key;
		if (entry.recitations.length !== 0) { // If it has recitations
			asscType = "recitation";
			for(key in entry.recitations) { if (entry.recitations.hasOwnProperty(key)) {
					asscList.push(entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id);
			}}

		} else if (entry.labs.length !== 0) { // If it has labs
			asscType = "lab";
			for(key in entry.labs) { if (entry.labs.hasOwnProperty(key)) {
					asscList.push(entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id);
			}}

		} else if (entry.lectures.length !== 0) { // If it has lectures
			asscType = "lecture";
			for(key in entry.lectures) { if (entry.lectures.hasOwnProperty(key)) {
					asscList.push(entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id);
			}}
		}

		var reqsArray = r.GetRequirements(entry)[1];

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
			'sectionCred': secCred,
			'reqsFilled': reqsArray
		};
		return sectionInfo;
	} else {
		return 'No Results';
	}
}

// Manage scheduling requests
app.get('/Sched', function(req, res) {
	var courseID = req.query.courseID;
	var needLoc = req.query.needLoc;
	request({
		uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?term='+currentTerm+'&course_id='+courseID,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
	}, function(error, response, body) {
		if (error) {
			console.log('OpenData Request failed:', error);
			return res.send('PCSERROR: request failed');
		}

		var parsedRes, rawResp = {};
		try {
			rawResp = JSON.parse(body);
		} catch(err) {
			console.log('Resp parse error - ' + err);
			return res.send(undefined);
		}

		try {
			if (rawResp.service_meta.error_text) {
				console.log('Resp Err:' + rawResp.service_meta.error_text);
				res.statusCode = 512; // Reserved error code to tell front end that its a Penn InTouch problem, not a PCS problem
				return res.send(rawResp.service_meta.error_text);
			}
			parsedRes = rawResp;
		} catch(err) {
			console.log(err);
			res.statusCode = 500;
			return res.send(err);
		}
		var resJSON = getSchedInfo(parsedRes.result_data[0]); // Format the response
		// for (var JSONSecID in resJSON) { if (resJSON.hasOwnProperty(JSONSecID)) { // Compile a list of courses
		//	 SchedCourses[JSONSecID] = resJSON[JSONSecID];
		// }}
		var schedEvent = {schedCourse: courseID};
		if (!needLoc) {logEvent('Sched', schedEvent);}
		return res.send(resJSON);
	});
	// }
});

function getSchedInfo(entry) { // Get the properties required to schedule the section
	try {
		var idDashed	 = entry.section_id_normalized.replace(/ /g, ""); // Format ID
		var idSpaced = idDashed.replace(/-/g, ' ');
		var resJSON	 = [];
		try { // Not all sections have time info
			for(var meeti in entry.meetings) { if (entry.meetings.hasOwnProperty(meeti)) { // Some sections have multiple meetings
				var thisMeet   = entry.meetings[meeti];
				var StartTime  = (thisMeet.start_hour_24) + (thisMeet.start_minutes)/60;
				var EndTime    = (thisMeet.end_hour_24)   + (thisMeet.end_minutes)/60;
				var hourLength = EndTime - StartTime;
				var MeetDays   = thisMeet.meeting_days;
				var Building, Room;
				try {
				 Building	 = thisMeet.building_code;
				 Room		 = thisMeet.room_number;
				} catch (err) {
				 Building	 = "";
				 Room		 = "";
				}
				var SchedAsscSecs = [];
				if (entry.lectures.length) {
					for (var thisAssc in entry.lectures) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
						SchedAsscSecs.push(entry.lectures[thisAssc].subject + '-' + entry.lectures[thisAssc].course_id + '-' + entry.lectures[thisAssc].section_id);
					}}
				} else {
					if (entry.recitations.length) {
						for (var thisAssc in entry.recitations) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
							SchedAsscSecs.push(entry.recitations[thisAssc].subject + '-' + entry.recitations[thisAssc].course_id + '-' + entry.recitations[thisAssc].section_id);
						}}
					} else if (entry.labs.length) {
						for (var thisAssc in entry.labs) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
							SchedAsscSecs.push(entry.labs[thisAssc].subject + '-' + entry.labs[thisAssc].course_id + '-' + entry.labs[thisAssc].section_id);
						}}
					}
				}

				// Full ID will have sectionID+MeetDays+StartTime
				// This is necessary for classes like PHYS151, which has times: M@13, TR@9, AND R@18
				var FullID = idDashed+'-'+MeetDays+StartTime.toString().replace(".", "");

				resJSON.push({
					'fullID': 		FullID,
					'idDashed':	 	idDashed,
					'idSpaced': 	idSpaced,
					'hourLength': 	hourLength,
					'meetDay':		MeetDays,
					'meetHour': 	StartTime,
					'meetLoc':		Building+' '+Room,
					'SchedAsscSecs': 	SchedAsscSecs
				});
			}}
		}
		catch (err) {
			console.log("Error getting times: "+err);
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

	var schedEvent = {notifySec: secID};
	logEvent('Notify', schedEvent);
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