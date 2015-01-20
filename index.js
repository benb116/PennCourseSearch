// Initial configuration
var path 		= require('path');
var express 	= require('express')
var stormpath 	= require('express-stormpath');
var request 	= require("request");
var mongojs 	= require("mongojs");
var colors 		= require('colors');
var fs 			= require('fs');

try {
	var config = require('./config.js');
} catch(err) { // If there is no config file
	var config = {};
	config['requestAB'] = process.env.REQUESTAB;
	config['requestAT'] = process.env.REQUESTAT;
	config['PCRToken'] 	= process.env.PCRTOKEN;
	config['MongoUser'] = process.env.MONGOUSER;
	config['MongoPass'] = process.env.MONGOPASS;
	config['MongoURI'] 	= process.env.MONGOURI;
	config['STORMPATH_API_KEY_ID'] 		= process.env.STORMPATH_API_KEY_ID;
	config['STORMPATH_API_KEY_SECRET'] 	= process.env.STORMPATH_API_KEY_SECRET;
	config['STORMPATH_SECRET_KEY'] 		= process.env.STORMPATH_SECRET_KEY;
	config['STORMPATH_URL'] 			= process.env.STORMPATH_URL;
}

var app = express();

// Set paths
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'public')));
process.env.PWD = process.cwd()

// Set up stormpath
app.use(stormpath.init(app, {
  apiKeyId:     config.STORMPATH_API_KEY_ID,
  apiKeySecret: config.STORMPATH_API_KEY_SECRET,
  secretKey:    config.STORMPATH_SECRET_KEY,
  application:  config.STORMPATH_URL,
  enableAccountVerification: 	true,
  enableForgotPassword: 		true,
  sessionDuration: 1000 * 60 * 60 * 24, // Make sessions expire after one day
}));

// Connect to database
var uri = 'mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1',
		db = mongojs.connect(uri, ["Students"]);

// Start the server
app.listen(process.env.PORT || 3000, function(){
	console.log("Node app is running. Better go catch it.".green)
	console.log("Search ".yellow + "Sched ".magenta + "Spit ".blue + "Error ".red + "Star ".cyan)
})

// Rotating subtitles
subtitles = [	"Cause PennInTouch sucks.", 
				"You can press the back button, but you don't even need to.",
				"Invented by Benjamin Franklin in 1793.",
				"Focus on your classes, not your schedule.",
				"Faster than you can say 'Wawa run.'",
				"Classes sine PennCourseSearch vanae."];

// Handle main page requests
app.get('/', stormpath.loginRequired, function(req, res) {
	console.log('Page Request: '+ req.user.email.split('@')[0])
	thissub = subtitles[Math.floor(Math.random() * subtitles.length)]; // Get random subtitle
	return res.render('index', { // Send page
		title: 'PennCourseSearch',
		subtitle: thissub,
		user: req.user.email.split('@')[0]
	});
})

// This request manager is for spitting the department lists. They are saved for faster responses
app.get('/Spit', stormpath.groupsRequired(['admins']), function(req, res) {
	var thedept = req.query.dept;
	console.log(('List Spit: '+thedept).blue)
	request({
		uri: 'http://localhost:3000/Search?searchType=courseIDSearch&resultType=deptSearch&searchParam='+thedept // Get preformatted results
	}, function(error, response, body) {

		var out = parseJSONList(body)
		fs.writeFile('./New/'+thedept+'.json', JSON.stringify(out), function (err) {
			if (err) throw err;
			console.log('It\'s saved!');
		});
		return res.send('done')
	});
});

function parseJSONList(JSONString) {
	var inJSON = JSON.parse(JSONString); // Convert to JSON object
	var lastKey = inJSON[Object.keys(inJSON).pop()].courseListName;
	console.log(lastKey)
	for(var key in inJSON) {
		var dashedName 	= inJSON[key].courseListName.replace(/ /g, "-");
		PCRRev = 0;

		request({
			uri: 'http://localhost:3000/PCRSpitID?courseID=' + dashedName // Get preformatted results
		}, function(error, response, body) {
			if (body != '0000') {
				request({
					uri: 'http://localhost:3000/PCRSpitRev?courseID=' + body // Get preformatted results
				}, function(error, response, body) {
					PCRRev = body;
					inJSON[key].PCRVal = PCRRev;
					console.log(PCRRev)
					if (key == lastKey) {
						console.log(inJSON)
						return inJSON;
					}
				});
			}
		});
	}
}

// This request manager is for spitting the PCR Course ID's. They are saved for faster responses
app.get('/PCRSpitID', stormpath.groupsRequired(['admins']), function(req, res) {
	var courseID = req.query.courseID;
	// console.log(('PCR ID Spit: '+courseID).blue)
	request({
		uri: 'http://api.penncoursereview.com/v1/coursehistories/'+courseID+'?token='+config.PCRToken // Get preformatted results
	}, function(error, response, body) {
		try {
			var Res = JSON.parse(body); // Convert to JSON object
			return res.send((Res.result.courses[Res.result.courses.length - 1].id).toString())
		} catch(err) {
			return res.send('0000')
		}
	});
});
// This request manager is for spitting the PCR reviews. They are saved for faster responses
app.get('/PCRSpitRev', stormpath.groupsRequired(['admins']), function(req, res) {
	var courseID = req.query.courseID;
	// console.log(('PCR Rev Spit: '+courseID).blue)
	request({
		uri: 'http://api.penncoursereview.com/v1/courses/'+courseID+'/reviews?token='+config.PCRToken // Get preformatted results
	}, function(error, response, body) {
		try {
			var Res = JSON.parse(body); // Convert to JSON object
			cQ = Res.result.values[Res.result.values.length - 1].ratings.rCourseQuality
			return res.send(cQ.toString())
		} catch(err) {
			return res.send(err)
		}
	});
});

// Manage search requests
app.get('/Search', stormpath.loginRequired, function(req, res) {
	var searchParam 	= req.query.searchParam; // The search terms
	var searchType 		= req.query.searchType; // Course ID, Keyword, or Instructor
	var resultType 		= req.query.resultType; // Course numbers, section numbers, section info
	var instructFilter 	= req.query.instFilter; // Is there an instructor filter?
	console.log((searchType + ': ' + searchParam).yellow);

	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=200'

	if (searchType == 'courseIDSearch') {var baseURL = baseURL + '&course_id='+searchParam};
	if (searchType == 'keywordSearch') 	{var baseURL = baseURL + '&description='+searchParam};
	if (searchType == 'instSearch') 	{var baseURL = baseURL + '&instructor='+searchParam};
	// If we are checking a course and only want to see the sections taught by a specific instructore:
	if (instructFilter != 'all' && typeof instructFilter !== 'undefined') {var baseURL = baseURL + '&instructor='+instructFilter};

	if (searchType == 'courseIDSearch' && resultType == 'deptSearch') {
		fs.readFile('./New/'+searchParam.toUpperCase()+'.json', function (err, data) {
			if (err) {
				return res.send({})
			}
			return res.send(JSON.parse(data))
		});
	} else {
		console.time('  Request Time'); // Start the timer
	    request({
			uri: baseURL,
			method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			if (error) {
				return console.error('Request failed:', error);
			}
			console.timeEnd('  Request Time');
			if 			(resultType == 'deptSearch'){ // This will only receive requests if we are checking the API
				var searchResponse = parseDeptList(body) // Parse the dept response
			} else if 	(resultType == 'numbSearch') {
				var searchResponse = parseCourseList(body) // Parse the numb response
			} else if 	(resultType == 'sectSearch') {
				var searchResponse = parseSectionList(body) // Parse the sect response
			} else if 	(resultType == 'spitSearch') {
				var searchResponse = parseJSONList(body) // Parse the sect response
			} else {var searchResponse = ''};
			return res.send(searchResponse); // return correct info
		});
	}
});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var coursesList = {};
	for(var key in Res.result_data) { // Iterate through each course
		var courseListName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number; // Get course dept and number
		var courseTitle = Res.result_data[key].course_title;
		coursesList[courseListName] = {'courseListName': courseListName, 'courseTitle': courseTitle}
	}
	return coursesList;
}
function getTimeInfo(JSONObj) { // A function to retrieve and format meeting times
	OCStatus = JSONObj.course_status;
	if (OCStatus == "O") {
		var StatusClass = 'OpenSec' // If section is open, add class open
	} else if (OCStatus == "C") {
		var StatusClass = 'ClosedSec' // If section is closed, add class closed
	} else {
		var StatusClass = 'ErrorSec' // Otherwise make it gray
	};
	var TimeInfo = [];
	try { // Not all sections have time info
		for(var meeting in JSONObj.meetings) { // Some sections have multiple meeting forms (I'm looking at you PHYS151)
			var StartTime = JSONObj.meetings[meeting].start_time.split(" ")[0]; // Get start time
			if (StartTime[0] == '0') {StartTime = StartTime.slice(1)}; // If it's 08:00, make it 8:00
			var EndTime = JSONObj.meetings[meeting].end_time.split(" ")[0];
			if (EndTime[0] == '0') {EndTime = EndTime.slice(1)};
			var MeetDays = JSONObj.meetings[meeting].meeting_days; // Output like MWF or TR
			meetListInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays;
			TimeInfo.push(meetListInfo);
		}
	}
	catch(err) {
		console.log(("Error getting times" + JSONObj.section_id).red)
		var TimeInfo = '';
	}
	return [StatusClass, TimeInfo];
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var sectionsList = {};
	for(var key in Res.result_data) {
		var SectionName = Res.result_data[key].section_id_normalized.replace(/-/g, " ");
		var sectionNameNoSpace = Res.result_data[key].section_id;
		var TimeInfoArray = getTimeInfo(Res.result_data[key]); // Get meeting times for a section
		var StatusClass = TimeInfoArray[0];
		var TimeInfo = TimeInfoArray[1][0]; // Get the first meeting slot
		if(typeof TimeInfoArray[1][1] !== 'undefined'){TimeInfo += ' ...';}; // If there are multiple meeting times
		if(typeof TimeInfo === 'undefined'){TimeInfo = '';};

		sectionsList[sectionNameNoSpace] = {'SectionName': SectionName, 'StatusClass': StatusClass, 'TimeInfo': TimeInfo, 'NoSpace': sectionNameNoSpace, 'CourseTitle': Res.result_data[0].course_title}
	}
	return sectionsList;
}

function parseSectionList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	var sectionInfo = {};
	try {
		var Title 	= entry.course_title;
		var FullID 	= entry.section_id_normalized.replace(/-/g, " "); // Format name
		try {
			var Instructor = entry.instructors[0].name;
		} catch(err) {
			var Instructor = "";
		}
		var Desc 			= entry.course_description;
		var TimeInfoArray 	= getTimeInfo(entry);
		var StatusClass 	= TimeInfoArray[0];
		var meetArray 		= TimeInfoArray[1];
		var TimeInfo 		= '';
		var prereq 			= entry.prerequisite_notes;
		if (prereq == "") {prereq = "none"}
		var termsOffered 	= entry.course_terms_offered;

		for(var listing in meetArray) {
			TimeInfo 		+= meetArray[listing].split("-")[1] + '<br>';
		}
		if (StatusClass == "OpenSec") {var OpenClose = 'Open'} else {var OpenClose = 'Closed'};

		if (entry['recitations'] != false) { // If it has recitations
			var AsscList = '<br><span class="AsscButton">Associated Recitations</span><ul class="AsscText">';
			for(var key in entry.recitations) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else if (entry['labs'] != false) { // If it has labs
			var AsscList = '<br><span class="AsscButton">Associated Labs</span><ul class="AsscText">';
			for(var key in entry.labs) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else if (entry['lectures'] != false) { // If it has lectures
			var AsscList = '<br><span class="AsscButton">Associated Lectures</span><ul class="AsscText">';
			for(var key in entry.lectures) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else {
			AsscList = '';
		};

		sectionInfo = {
			'FullID': FullID, 
			'Title': Title, 
			'Instructor': Instructor, 
			'Description': Desc, 
			'OpenClose': OpenClose, 
			'termsOffered': termsOffered, 
			'Prerequisites': prereq, 
			'TimeInfo': TimeInfo, 
			'AssociatedSections': AsscList
		}
		return sectionInfo
	}
 	catch(err) {
		return 'No Results';
	}
}

// Manage requests regarding starred courses
app.get('/Star', stormpath.loginRequired, function(req, res) {
	var StarredCourses = {};
	var myPennkey = req.user.email.split('@')[0]; // Get Pennkey
	// console.time('DB Time')
	db.Students.find({Pennkey: myPennkey}, { StarList: 1}, function(err, doc) { // Try to access the database
		try {
			StarredCourses = doc[0].StarList; // Get previously starred courses
		} catch(error) { // If there is no previous starlist
			db.Students.update({Pennkey: myPennkey}, { $set: {StarList: StarredCourses}, $currentDate: { lastModified: true }}); // Update the database	
		}

		var addRem = req.query.addRem; // Are we adding, removing, or clearing?
		var courseID = req.query.courseID;

		if (addRem == 'add') { 
			console.log(('Star: '+ courseID).cyan)
			var index = StarredCourses.indexOf(courseID);
			if (index == -1) {StarredCourses.push(courseID);} // If the section is not already in the list
			console.log(courseID.cyan)

		} else if (addRem == 'rem') { // If we need to remove
			console.log(('Unstar: '+ courseID).cyan)
			var index = StarredCourses.indexOf(courseID);
			if (index > -1) {StarredCourses.splice(index, 1);}

		} else if (addRem == 'clear') { // Clear all
			console.log(('Clear star: '+ courseID).cyan)
			var StarredCourses = [];
		}

		db.Students.update({Pennkey: myPennkey}, { $set: {StarList: StarredCourses}, $currentDate: { lastModified: true }}); // Update the database

		return res.send(StarredCourses)
	});
});

// Manage scheduling requests
app.get('/Sched', stormpath.loginRequired, function(req, res) {

	var SchedCourses = {};
	var schedName = req.query.schedName;
	var myPennkey = req.user.email.split('@')[0]; // Get Pennkey
	// console.time('DB Time')
	db.Students.find({Pennkey: myPennkey}, { Sched1: 1}, function(err, doc) { // Try to access the database
		try {
			SchedCourses = doc[0].Sched1; // Get previously scheduled courses
		} catch(error) { // If there is no previous schedule
			db.Students.insert({Pennkey: myPennkey});
			db.Students.update({Pennkey: myPennkey}, { $set: {Sched1: SchedCourses}, $currentDate: { lastModified: true }}); // Update the database	
		}
		// console.timeEnd('DB Time')

		var addRem = req.query.addRem; // Are we adding, removing, or clearing?
		var courseID = req.query.courseID;
		if (addRem == 'add') { // If we need to add, then we get meeting info for the section
			request({
				uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+courseID,
				method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
			}, function(error, response, body) {

				resJSON = getSchedInfo(body); // Format the response
				console.log('Sched Added: '.magenta)
				for (var JSONSecID in resJSON) { // Compile a list of courses
					SchedCourses[JSONSecID] = resJSON[JSONSecID];
					console.log(JSONSecID.magenta)
				};

				db.Students.update({Pennkey: myPennkey}, { $set: {Sched1: SchedCourses}, $currentDate: { lastModified: true }}); // Update the database
				return res.send(SchedCourses);
			});

		} else if (addRem == 'rem') { // If we need to remove
			console.log('Sched Removed: '.magenta)
			for (meetsec in SchedCourses) {
				if (SchedCourses[meetsec].fullCourseName.replace(/ /g, "") == courseID) { // Find all meeting times of a given course
					delete SchedCourses[meetsec];
					console.log(courseID.magenta)
				}
			}

			db.Students.update({Pennkey: myPennkey}, { $set: {Sched1: SchedCourses}, $currentDate: { lastModified: true }}); // Update the database
			return res.send(SchedCourses);
			
		} else if (addRem == 'clear') { // Clear all
			SchedCourses = {};
			db.Students.update({Pennkey: myPennkey}, { $set: {Sched1: SchedCourses}, $currentDate: { lastModified: true }}); // Update the database
			console.log('Sched Cleared'.magenta)
			return res.send(SchedCourses)
		}
		else {
			return res.send(SchedCourses); // On a blank request
		}

	});
});

function getSchedInfo(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	try {
		var SectionName = entry.section_id_normalized.replace(/ /g, "").replace(/-/g, " "); // Format name
		console.log(SectionName)
		var SectionID 	= entry.section_id_normalized.replace(/-/g, ""); // Format name
		var resJSON 	= { };
		try { // Not all sections have time info
			for(var meeti in entry.meetings) {
				var StartTime 	= (entry.meetings[meeti].start_hour_24) + (entry.meetings[meeti].start_minutes)/60;
				var EndTime 	= (entry.meetings[meeti].end_hour_24) + (entry.meetings[meeti].end_minutes)/60;
				var halfLength 	= EndTime - StartTime;
				var MeetDays 	= entry.meetings[meeti].meeting_days;
				var OpenClose 	= entry.course_status_normalized;
				try {
					var Building 	= entry.meetings[meeti].building_code;
					var Room 		= entry.meetings[meeti].room_number;
				} catch(err) {
					var Building 	= "";
					var Room 		= "";
				}
				var FullID = SectionID.replace(/ /g, "")+MeetDays+StartTime.toString().replace(/\./g, "");
				resJSON[FullID] = {'fullCourseName': SectionName,
						'HourLength': halfLength,
						'meetDay': MeetDays,
						'meetHour': StartTime,
						'meetRoom': Building+' '+Room
					};
				}
		}
		catch(err) {
			console.log(("Error getting times: "+err).red)
			var TimeInfo = '';
		}
		return resJSON;
	}
 	catch(err) {
		return 'No Results';
	}
}