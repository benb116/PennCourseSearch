// Initial configuration
var path 		= require('path');
var express 	= require('express');
var stormpath 	= require('express-stormpath');
var request 	= require("request");
var mongojs 	= require("mongojs");
var colors 		= require('colors');
var fs 			= require('fs');
var Keen 		= require('keen-js');

// I don't want to host a config file on github. When running locally, the app has access to a local config file.
// On Heroku, there is no config file so I use environment variables instead
try {
	var config = require('./config.js');
} catch (err) { // If there is no config file
	var config = {};
	config.requestAB 				= process.env.REQUESTAB;
	config.requestAT 				= process.env.REQUESTAT;
	config.PCRToken 				= process.env.PCRTOKEN;
	config.MongoUser 				= process.env.MONGOUSER;
	config.MongoPass 				= process.env.MONGOPASS;
	config.MongoURI 				= process.env.MONGOURI;
	config.STORMPATH_API_KEY_ID 	= process.env.STORMPATH_API_KEY_ID;
	config.STORMPATH_API_KEY_SECRET = process.env.STORMPATH_API_KEY_SECRET;
	config.STORMPATH_SECRET_KEY 	= process.env.STORMPATH_SECRET_KEY;
	config.STORMPATH_URL 			= process.env.STORMPATH_URL;
	config.KeenIOID					= process.env.KEEN_PROJECT_ID;
	config.KeenIOWriteKey			= process.env.KEEN_WRITE_KEY;
}

var app = express();

// Set paths
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'public')));
process.env.PWD = process.cwd();
// Handle 404
// app.use(function(req, res) {res.status(400);res.render('404.hjs');});

// Set up stormpath
app.use(stormpath.init(app, {
	apiKeyId:     config.STORMPATH_API_KEY_ID,
	apiKeySecret: config.STORMPATH_API_KEY_SECRET,
	secretKey:    config.STORMPATH_SECRET_KEY,
	application:  config.STORMPATH_URL,
	enableAccountVerification: 	true,
	enableForgotPassword: 		true,
	sessionDuration: 			1000 * 60 * 60 * 24 * 7, // Make sessions expire after one week
}));

// Connect to database
var uri = 'mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1',
		db = mongojs.connect(uri, ["Students", "Courses2015C"]);

// Set up Keen Analytics
var client = new Keen({
    projectId: config.KeenIOID,   // String (required always)
    writeKey: config.KeenIOWriteKey     // String (required for sending data)
});

// Start the server
app.listen(process.env.PORT || 3000, function(){
	console.log("Node app is running. Better go catch it.".green);
	console.log("Search ".yellow + "Sched ".magenta + "Spit ".blue + "Error ".red + "Star ".cyan);
});

// Rotating subtitles
var subtitles = ["Cause PennInTouch sucks", 
				"You can press the back button, but you don't even need to.",
				"Invented by Benjamin Franklin in 1793",
				"Focus on your classes, not your schedule.",
				"Faster than you can say 'Wawa run'",
				"Classes sine PennCourseSearch vanae."];

var paymentNoteBase = "https://venmo.com/?txn=pay&recipients=BenBernstein&amount=1&share=f&audience=friends&note=";
var paymentNotes = ["PennCourseSearch%20rocks%20my%20socks!",
					"Donation%20to%20PennInTouch%20Sucks,%20Inc.",
					"For%20your%20next%20trip%20to%20Wawa"];

var currentTerm = '2015C';

// Handle main page requests
app.get('/', function(req, res) {
	if (!req.user) { // If the user is not logged in
		return res.render('welcome');
	} else {
		// console.log(req.user.email.split('@')[0] + ' Page Request');
		thissub = subtitles[Math.floor(Math.random() * subtitles.length)]; // Get random subtitle
		fullPaymentNote = paymentNoteBase + paymentNotes[Math.floor(Math.random() * paymentNotes.length)]; // Get random payment note
		
		return res.render('index', { // Send page
			title: 'PennCourseSearch',
			subtitle: thissub,
			user: req.user.email.split('@')[0],
			paymentNote: fullPaymentNote
		});
	}
});

// This request manager is for spitting the department lists. They are saved for faster responses.
app.get('/Spit', function(req, res) {
	var thedept = req.query.dept;
	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;

    request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			var inJSON = JSON.parse(body).result_data; // Convert to JSON object
		
			var resp = {};
			for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) { // For each section that comes up

				var spacedName = inJSON[key].section_id_normalized.replace('-', " ").split('-')[0].replace(/   /g, ' ').replace(/  /g, ' '); // Get course name (e.g. CIS 120)
				var thetitle = inJSON[key].course_title; // Get title
				resp[spacedName] = {'courseListName': spacedName, 'courseTitle': thetitle};
				if (key == inJSON.length - 1) { // At the end of the list
					fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(resp), function (err) { // Write JSON to file
						console.log(('List Spit: '+thedept).blue);
					});
				}
			}}			
		return res.send('Spat');
	});
	
});

// This request manager is for spitting the PCR reviews. They are saved for faster responses
app.get('/PCRSpitRev', function(req, res) { 
	var thedept = req.query.dept;
	console.log(('PCR Rev Spit: '+thedept).blue);
	request({
		uri: 'http://api.penncoursereview.com/v1/depts/'+thedept+'/reviews?token='+config.PCRToken // Get raw data
	}, function(error, response, body) {
		console.log('Received'.blue);
		var deptReviews = JSON.parse(body).result.values;

		var resp = {};
		for(var rev in deptReviews) { // Iterate through each review
			var sectionIDs = deptReviews[rev].section.aliases;
			for(var alias in sectionIDs) {
				if (sectionIDs[alias].split('-')[0] == thedept) { // 
					var course = sectionIDs[alias].replace('-', " ").split('-')[0];
					var reviewID = deptReviews[rev].section.id.split('-')[0];
					var instructorID = deptReviews[rev].instructor.id;
					var PCRRating = deptReviews[rev].ratings.rCourseQuality;
					
					// Put the data in the 'resp' JSON Object
					if (!(resp.hasOwnProperty(course))) {
						resp[course] = [{'revID': 0}];
					}
					oldestID = Number(resp[course][0].revID);
					if (reviewID > oldestID) { // We only want the most recent reviews, so a new review ID should overwrite all previous review values
						resp[course] = [{
							'InstID': instructorID,
							'revID': reviewID,
							'Rating': PCRRating
						}];
					} else if (reviewID == oldestID) { // If there are multiple values from the same review ID, we want to keep them all to average later
						resp[course].push({
							'InstID': instructorID,
							'revID': reviewID,
							'Rating': PCRRating
						});
					}
				}
			}
			if (rev == Object.keys(deptReviews).length - 1) {
				fs.writeFile('./2015ARev/'+thedept+'.json', JSON.stringify(resp), function (err) {
					// if (err) throw err;
					console.log('It\'s saved!');
				});
			}
		}

		return res.send('done');
	});
});

// This request manager adds the PCR data from PCRSpitRev to the data from Spit
app.get('/Match', function(req, res) {
	var thedept = req.query.dept;
	var dept = JSON.parse(fs.readFileSync('./'+currentTerm+'/'+thedept+'.json', 'utf8')); // Get spit data
	var deptrev = JSON.parse(fs.readFileSync('./2015ARev/'+thedept+'.json', 'utf8')); // Get PCR data
	for (var course in dept) { // Go through each course
		if (typeof deptrev[course] !== 'undefined') {
			sum = 0;
			for (var i = 0; i < deptrev[course].length; i++) { // Go through each section in the courses PCR data and sum the values
				sum += Number(deptrev[course][i].Rating);
			}
			if (deptrev[course].length !== 0) {
				dept[course].PCR = Math.floor(100*sum/deptrev[course].length)/100; // Average the values and add to the spit data
			}
		}
	}
	db.collection('Courses'+currentTerm).find({Dept: thedept}, function(err, doc) { // Try to access the database
		if (doc.length === 0) {
			db.collection('Courses'+currentTerm).save({'Dept': thedept});
		}
		db.collection('Courses'+currentTerm).update({Dept: thedept}, { $set: {Courses: dept}, $currentDate: { lastModified: true }}); // Add a schedules block if there is none
	});

	// fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(dept), function (err) { // Overwrite the old spit data with the new spit data
	// 	console.log('Matched: '+thedept);
	// });
	return res.send('Matched');
});

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

	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=200&term='+currentTerm+reqFilter+proFilter+actFilter+includeOpen;

	if (searchType == 'courseIDSearch') {var baseURL = baseURL + '&course_id='	+ searchParam;}
	if (searchType == 'keywordSearch') 	{var baseURL = baseURL + '&description='+ searchParam;}
	if (searchType == 'instSearch') 	{var baseURL = baseURL + '&instructor='	+ searchParam;}

	// If we are searching by a certain instructor, the course numbers will be filtered because of searchType 'instSearch'. 
	// However, clicking on one of those courses will show all sections, including those not taught by the instructor.
	// instructFilter is an extra parameter that allows further filtering of section results by instructor.
	if (instructFilter != 'all' && typeof instructFilter !== 'undefined') {var baseURL = baseURL + '&instructor='+instructFilter;}
	
	// Keen.io logging
	var searchEvent = {
		searchType: searchType,  
		searchParam: searchParam,
		user: myPennkey,
		keen: {
			timestamp: new Date().toISOString()
		}
	};
	client.addEvent('Search', searchEvent, function(err, res) {if (err) {console.log(err);}});

	// Instead of searching the API for department-wide queries (which are very slow), get the preloaded results from the DB
	if (searchType 	== 'courseIDSearch' && 
		resultType 	== 'deptSearch' && 
		reqFilter 	=== '' && 
		proFilter 	=== '' && 
		actFilter 	=== '' && 
		includeOpen === '') {

		console.time(('DB: ' + searchType + ': ' + searchParam+'  Request Time').yellow); // Start the timer
		db.Courses2015C.find({Dept: searchParam.toUpperCase()}, function(err, doc) {
			console.timeEnd(('DB: ' + searchType + ': ' + searchParam+'  Request Time').yellow);
			try {
				return res.send(doc[0].Courses);
			} catch (err) {
				return res.send({});
			}
		});
		
	} else {
		console.time(('API: ' + searchType + ': ' + searchParam+'  Request Time').yellow); // Start the timer
	    request({
			uri: baseURL,
			method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			if (error) {
				console.error('Request failed:', error);
				return res.send('PCSERROR: request failed');
			}
			console.timeEnd(('API: ' + searchType + ': ' + searchParam+'  Request Time').yellow);

			// Send the raw data to the appropriate formatting function
			if 			(resultType == 'deptSearch'){
				var searchResponse = parseDeptList(body); // Parse the dept response
			} else if 	(resultType == 'numbSearch') {
				var searchResponse = parseCourseList(body); // Parse the numb response
			} else if 	(resultType == 'sectSearch') {
				var searchResponse = parseSectionList(body); // Parse the sect response
			} else {var searchResponse = {};}
			return res.send(searchResponse); // return correct info
		});
	}
});

// This function spits out the list of courses that goes in #CourseList
function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var coursesList = {};
	for(var key in Res.result_data) { if (Res.result_data.hasOwnProperty(key)) { // Iterate through each course
		var courseListName 	= Res.result_data[key].course_department+' '+Res.result_data[key].course_number; // Get course dept and number
		var courseTitle 	= Res.result_data[key].course_title;
		coursesList[courseListName] = {'courseListName': courseListName, 'courseTitle': courseTitle};
	}}
	return coursesList;
}

function getTimeInfo(JSONObj) { // A function to retrieve and format meeting times
	OCStatus = JSONObj.course_status;
	if (OCStatus == "O") {
		var StatusClass = 'OpenSec'; // If section is open, add class open
	} else if (OCStatus == "C") {
		var StatusClass = 'ClosedSec'; // If section is closed, add class closed
	} else {
		var StatusClass = 'ErrorSec'; // Otherwise make it gray
	}
	var TimeInfo = [];
	try { // Not all sections have time info
		for(var meeting in JSONObj.meetings) { if (JSONObj.meetings.hasOwnProperty(meeting)) { // Some sections have multiple meeting forms (I'm looking at you PHYS151)
			var StartTime 		= JSONObj.meetings[meeting].start_time.split(" ")[0]; // Get start time
			var EndTime 		= JSONObj.meetings[meeting].end_time.split(" ")[0];

			if (StartTime[0] 	== '0') {StartTime = StartTime.slice(1);} // If it's 08:00, make it 8:00
			if (EndTime[0] 		== '0')	{EndTime = EndTime.slice(1);}

			var MeetDays = JSONObj.meetings[meeting].meeting_days; // Output like MWF or TR
			meetListInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays;
			TimeInfo.push(meetListInfo);
		}}
	}
	catch (err) {
		// console.log(("Error getting times" + JSONObj.section_id).red);
		var TimeInfo = '';
	}
	return [StatusClass, TimeInfo];
}

// This function spits out the list of sections that goes in #SectionList
function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var sectionsList = {};
	for(var key in Res.result_data) { if (Res.result_data.hasOwnProperty(key)) { 
		var SectionName 		= Res.result_data[key].section_id_normalized.replace(/-/g, " ");
		var sectionNameNoSpace 	= Res.result_data[key].section_id;
		var TimeInfoArray 		= getTimeInfo(Res.result_data[key]); // Get meeting times for a section
		var StatusClass 		= TimeInfoArray[0];
		var TimeInfo 			= TimeInfoArray[1][0]; // Get the first meeting slot
		
		if(typeof TimeInfoArray[1][1] !== 'undefined')	{TimeInfo += ' ...';} // If there are multiple meeting times
		if(typeof TimeInfo === 'undefined')				{TimeInfo = '';}

		sectionsList[sectionNameNoSpace] = {'SectionName': SectionName, 'StatusClass': StatusClass, 'TimeInfo': TimeInfo, 'NoSpace': sectionNameNoSpace, 'CourseTitle': Res.result_data[0].course_title};
	}}
	courseInfo = parseSectionList(JSONString);

	return [sectionsList, courseInfo];
}

// This function spits out section-specific info
function parseSectionList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	var sectionInfo = {};
	try {
		var Title 			= entry.course_title;
		var FullID 			= entry.section_id_normalized.replace(/-/g, " "); // Format name
		var CourseID 		= entry.section_id_normalized.split('-')[0] + ' ' + entry.section_id_normalized.split('-')[1];
		try {
			var Instructor 	= entry.instructors[0].name;
		} catch (err) {
			var Instructor 	= "";
		}
		var Desc 			= entry.course_description;
		var TimeInfoArray 	= getTimeInfo(entry);
		var StatusClass 	= TimeInfoArray[0];
		var meetArray 		= TimeInfoArray[1];
		var TimeInfo 		= '';
		var prereq 			= entry.prerequisite_notes[0];
		if (typeof prereq === 'undefined') {prereq = "none";}
		var termsOffered 	= entry.course_terms_offered;

		for(var listing in meetArray) {
			TimeInfo 		+= meetArray[listing].split("-")[1] + '<br>';
		}
		if (StatusClass == "OpenSec") {var OpenClose = 'Open';} else {var OpenClose = 'Closed';}

		if (entry.recitations.length !== 0) { // If it has recitations
			var AsscList = '<br>Associated Recitations<ul class="AsscText">';
			for(var key in entry.recitations) { if (entry.recitations.hasOwnProperty(key)) { 
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</span></li>';
			}}
			AsscList += '</ul>';

		} else if (entry.labs.length !== 0) { // If it has labs
			var AsscList = '<br>Associated Labs<ul class="AsscText">';
			for(var key in entry.labs) { if (entry.labs.hasOwnProperty(key)) { 
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</span></li>';
			}}
			AsscList += '</ul>';

		} else if (entry.lectures.length !== 0) { // If it has lectures
			var AsscList = '<br>Associated Lectures<ul class="AsscText">';
			for(var key in entry.lectures) { if (entry.lectures.hasOwnProperty(key)) { 
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id+'</span></li>';
			}}
			AsscList += '</ul>';

		} else {
			AsscList = '';
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
			'AssociatedSections': AsscList
		};
		return sectionInfo;
	}
 	catch (err) {
		return 'No Results';
	}
}

// Manage requests regarding starred courses
app.get('/Star', stormpath.loginRequired, function(req, res) {
	var StarredCourses 	= {};
	var myPennkey 		= req.user.email.split('@')[0]; // Get Pennkey
	// console.time('DB Time')
	db.Students.find({Pennkey: myPennkey}, {StarList: 1}, function(err, doc) { // Try to access the database
		try {
			StarredCourses = doc[0].StarList; // Get previously starred courses
		} catch (error) { // If there is no previous starlist
			db.Students.update({Pennkey: myPennkey}, { $set: {StarList: StarredCourses}, $currentDate: { lastModified: true }}); // Update the database	
		}

		var addRem = req.query.addRem; // Are we adding, removing, or clearing?
		var courseID = req.query.courseID;

		if (addRem == 'add') { 
			// console.log((myPennkey + ' Star: '+ courseID).cyan);
			var index = StarredCourses.indexOf(courseID);
			if (index == -1) {StarredCourses.push(courseID);} // If the section is not already in the list
				var starEvent = {
					starCourse: courseID,
					user: myPennkey,
					keen: {
						timestamp: new Date().toISOString()
					}
				};
				client.addEvent('Star', starEvent, function(err, res) {
					if (err) {console.log(err);}
				});

		} else if (addRem == 'rem') { // If we need to remove
			// console.log((myPennkey + ' Unstar: '+ courseID).cyan);
			var index = StarredCourses.indexOf(courseID);
			if (index > -1) {StarredCourses.splice(index, 1);}

		} else if (addRem == 'clear') { // Clear all
			// console.log((myPennkey + ' Clear star: '+ courseID).cyan);
			var StarredCourses = [];
		}

		db.Students.update({Pennkey: myPennkey}, { $set: {StarList: StarredCourses}, $currentDate: { lastModified: true }}); // Update the database
		return res.send(StarredCourses);
	});
});

// Manage scheduling requests
app.get('/Sched', stormpath.loginRequired, function(req, res) {

	var SchedCourses 	= {};
	var schedName 		= req.query.schedName;
	var schedRename		= req.query.schedRename;
	var myPennkey 		= req.user.email.split('@')[0]; // Get Pennkey

	db.Students.find({Pennkey: myPennkey}, { Schedules: 1}, function(err, doc) { // Try to access the database
		if (typeof doc === 'undefined' || typeof doc === null || err !== null || doc.length === 0) { // If there is no entry or something else went wrong
			db.Students.save({'Pennkey': myPennkey, 'StarList': []}); // Make an entry
			doc[0] = {};
		}
		if (typeof doc[0].Schedules === 'undefined') {
			db.Students.update({Pennkey: myPennkey}, { $set: {Schedules: {}}, $currentDate: { lastModified: true }}); // Add a schedules block if there is none
			doc[0].Schedules = {};
		}
		if (typeof schedName !== 'undefined') {
			SchedCourses = doc[0].Schedules[schedName]; // Get previously scheduled courses
		}
		if (typeof SchedCourses === 'undefined') { // If there is no schedule of that name
			var placeholder = {};
			placeholder['Schedules.' + schedName] = {}; // Make one
			db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
			SchedCourses = {};
		}

		var addRem = req.query.addRem; // Are we adding, removing, or clearing?
		var courseID = req.query.courseID;
		if (addRem == 'add') { // If we need to add, then we get meeting info for the section
			request({
				uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?term='+currentTerm+'&course_id='+courseID,
				method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
			}, function(error, response, body) {

				resJSON = getSchedInfo(body); // Format the response
				for (var JSONSecID in resJSON) { if (resJSON.hasOwnProperty(JSONSecID)) { // Compile a list of courses
					SchedCourses[JSONSecID] = resJSON[JSONSecID];
					// console.log((myPennkey + ' Sched Added: ' + JSONSecID).magenta);
				}}
				var schedEvent = {
					schedCourse: courseID,
					user: myPennkey,
					keen: {
						timestamp: new Date().toISOString()
					}
				};
				client.addEvent('Sched', schedEvent, function(err, res) {
					if (err) {console.log(err);}
				});
				var placeholder = {};
				placeholder['Schedules.' + schedName] = SchedCourses;
				db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
				return res.send(SchedCourses);
			});

		} else if (addRem == 'rem') { // If we need to remove
			for (var meetsec in SchedCourses) { if (SchedCourses.hasOwnProperty(meetsec)) {
				if (SchedCourses[meetsec].fullCourseName.replace(/ /g, "") == courseID) { // Find all meeting times of a given course
					delete SchedCourses[meetsec];
					// console.log((myPennkey + ' Sched Removed: ' + courseID).magenta);
				}}
			}
			var placeholder = {};
			placeholder['Schedules.' + schedName] = SchedCourses;
			db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
			return res.send(SchedCourses);
			
		} else if (addRem == 'clear') { // Clear all
			SchedCourses = {};
			var placeholder = {};
			placeholder['Schedules.' + schedName] = SchedCourses;
			db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
			// console.log((myPennkey + ' Sched Cleared').magenta);
			return res.send(SchedCourses);

		} else if (addRem == 'dup') { // Duplicate a schedule
			while (Object.keys(doc[0].Schedules).indexOf(schedName) != -1) {
				var lastchar = schedName[schedName.length - 1];
				if (isNaN(lastchar) || schedName[schedName.length - 2] != ' ') { // e.g. 'schedule' or 'ABC123'
					schedName += ' 2';
				} else { // e.g. 'MEAM 101 2'
					schedName = schedName.slice(0, -2) + ' ' + (parseInt(lastchar) + 1);
				}
			}
			var placeholder = {};
			placeholder['Schedules.' + schedName] = SchedCourses;
			db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }});

			schedList = Object.keys(doc[0].Schedules);
			schedList.push(schedName);
			// console.log((myPennkey + ' Sched duplicated').magenta);
			return res.send(schedList);

		} else if (addRem == 'ren') { // Delete
			doc[0].Schedules[schedRename] = doc[0].Schedules[schedName];
			delete doc[0].Schedules[schedName];
			db.Students.update({Pennkey: myPennkey}, { $set: {'Schedules': doc[0].Schedules}, $currentDate: { lastModified: true }}); // Update the database
			schedList = Object.keys(doc[0].Schedules);
			// console.log((myPennkey + ' Sched renamed.'));
			return res.send(schedList);
		
		} else if (addRem == 'del') { // Delete
			delete doc[0].Schedules[schedName];
			if(Object.getOwnPropertyNames(doc[0].Schedules).length === 0){
				doc[0].Schedules['Schedule'] = {};
			}
			db.Students.update({Pennkey: myPennkey}, { $set: {'Schedules': doc[0].Schedules}, $currentDate: { lastModified: true }}); // Update the database
			schedList = Object.keys(doc[0].Schedules);
			// console.log((myPennkey + ' Sched deleted.'));
			return res.send(schedList);
		
		} else if (addRem == 'name') { // If we're getting a list of the schedules
			schedList = Object.keys(doc[0].Schedules);
			if (schedList.length === 0) {
				var placeholder = {};
				placeholder['Schedules.Schedule'] = {};
				db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
				schedList.push('Schedule');
			}
			if (typeof schedName !== 'undefined' && schedList.indexOf(schedName) == -1 && schedName != 'null') {schedList.push(schedName);}
			return res.send(schedList);
		} else {
			return res.send(SchedCourses); // On a blank request
		}

	});
});

function getSchedInfo(JSONString) { // Get the properties required to schedule the section
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	try {
		var SectionName = entry.section_id_normalized.replace(/ /g, "").replace(/-/g, " "); // Format name
		var SectionID 	= entry.section_id_normalized.replace(/-/g, ""); // Format name
		var resJSON 	= {};
		try { // Not all sections have time info
			for(var meeti in entry.meetings) { if (entry.meetings.hasOwnProperty(meeti)) { // Some sections have multiple meetings
				var StartTime 	= (entry.meetings[meeti].start_hour_24) + (entry.meetings[meeti].start_minutes)/60; 
				var EndTime 	= (entry.meetings[meeti].end_hour_24) 	+ (entry.meetings[meeti].end_minutes)/60;
				var hourLength 	= EndTime - StartTime;
				var MeetDays 	= entry.meetings[meeti].meeting_days;
				var OpenClose 	= entry.course_status_normalized;
				try {
					var Building 	= entry.meetings[meeti].building_code;
					var Room 		= entry.meetings[meeti].room_number;
				} catch (err) {
					var Building 	= "";
					var Room 		= "";
				}

				// Full ID will have sectionID+MeetDays+StartTime
				// This is necessary for classes like PHYS151, which has times: M@13, TR@9, AND R@18
				var FullID = SectionID.replace(/ /g, "")+MeetDays+StartTime.toString().replace(".", "");

				resJSON[FullID] = {	'fullCourseName': 	SectionName,
									'HourLength': 		hourLength,
									'meetDay': 			MeetDays,
									'meetHour': 		StartTime,
									'meetRoom': 		Building+' '+Room
				};
			}}
		}
		catch (err) {
			console.log(("Error getting times: "+err).red);
			var TimeInfo = '';
		}
		return resJSON;
	}
 	catch (err) {
		return 'No Results';
	}
}