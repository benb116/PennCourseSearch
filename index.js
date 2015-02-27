// Initial configuration
var path 		= require('path');
var express 	= require('express');
var stormpath 	= require('express-stormpath');
var request 	= require("request");
var mongojs 	= require("mongojs");
var colors 		= require('colors');
var fs 			= require('fs');

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
}

var app = express();

// Set paths
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'public')));
process.env.PWD = process.cwd();

// Set up stormpath
app.use(stormpath.init(app, {
  apiKeyId:     config.STORMPATH_API_KEY_ID,
  apiKeySecret: config.STORMPATH_API_KEY_SECRET,
  secretKey:    config.STORMPATH_SECRET_KEY,
  application:  config.STORMPATH_URL,
  enableAccountVerification: 	true,
  enableForgotPassword: 		true,
  sessionDuration: 				1000 * 60 * 60 * 24 * 7, // Make sessions expire after one week
}));

// Connect to database
var uri = 'mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1',
		db = mongojs.connect(uri, ["Students", "Cours"]);

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
					"That%20high%20quality%20PCS%20jawn",
					"The%20power%20of%20Christ%20compelled%20me.",
					"Donation%20to%20PennInTouch%20Sucks,%20Inc.",
					"For%20your%20next%20trip%20to%20Wawa"];

var currentTerm = '2015C';

// Handle main page requests
app.get('/', stormpath.loginRequired, function(req, res) {
	console.log(req.user.email.split('@')[0] + ': Page Request');
	thissub = subtitles[Math.floor(Math.random() * subtitles.length)]; // Get random subtitle
	fullPaymentNote = paymentNoteBase + paymentNotes[Math.floor(Math.random() * paymentNotes.length)]

	return res.render('index', { // Send page
		title: 'PennCourseSearch',
		subtitle: thissub,
		user: req.user.email.split('@')[0],
		paymentNote: fullPaymentNote
	});
});

// This request manager is for spitting the department lists. They are saved for faster responses
app.get('/Spit', function(req, res) {
	var thedept = req.query.dept;
	console.log(('List Spit: '+thedept).blue);

	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=200&term='+currentTerm+'&course_id='+thedept
	// If we are checking a course and only want to see the sections taught by a specific instructore:

    request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			// console.log(body)
			var inJSON = JSON.parse(body).result_data; // Convert to JSON object
			// console.log(inJSON)
			// var lastKey = inJSON[Object.keys(inJSON).pop()].courseListName;
			// console.log(lastKey);
			var resp = {};
			for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) {
				// console.log(inJSON[key])
				var spacedName = inJSON[key].section_id_normalized.replace('-', " ").split('-')[0];
				var thetitle = inJSON[key].course_title;
				resp[spacedName] = {'courseListName': spacedName, 'courseTitle': thetitle};
				if (key == inJSON.length - 1) {

					// db.Courses2015A.find({Dept: thedept}, function(err, doc) { // Try to access the database
					// 	if (doc == []) {
					// 		db.Courses2015A.save({'Dept': thedept});
					// 	}
					// 	db.Courses2015A.update({Dept: thedept}, { $set: {Courses: resp}, $currentDate: { lastModified: true }}); // Add a schedules block if there is none
					// });

					fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(resp), function (err) {
						// if (err) throw err;
						console.log('It\'s saved!');
					});
				}
			}}			
		return res.send('done');
	});
	
});


app.get('/Match', function(req, res) {
	var thedept = req.query.dept;
	var dept = JSON.parse(fs.readFileSync('./'+currentTerm+'/'+thedept+'.json', 'utf8'));
	var deptrev = JSON.parse(fs.readFileSync('./2015ARev/'+thedept+'.json', 'utf8'));
	for (var course in dept) {
		if (typeof deptrev[course] !== 'undefined') {
			sum = 0;
			for (var i = 0; i < deptrev[course].length; i++) {
				sum += Number(deptrev[course][i].Rating)
			};
			if (deptrev[course].length != 0) {
				dept[course].PCR = Math.floor(100*sum/deptrev[course].length)/100;
			}
		}
	}
	// console.log(dept)
	fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(dept), function (err) {
		console.log('Matched: '+thedept);
	});
	return res.send('')
	
});


// This request manager is for spitting the PCR reviews. They are saved for faster responses
app.get('/PCRSpitRev', function(req, res) { 
	var thedept = req.query.dept;
	console.log(('PCR Rev Spit: '+thedept).blue)
	request({
		uri: 'http://api.penncoursereview.com/v1/depts/'+thedept+'/reviews?token='+config.PCRToken // Get preformatted results
	}, function(error, response, body) {
		console.log('Received'.blue)
		var deptReviews = JSON.parse(body).result.values;

		var resp = {};
		for(var rev in deptReviews) {
			var sectionIDs = deptReviews[rev].section.aliases;
				for(var alias in sectionIDs) {
					if (sectionIDs[alias].split('-')[0] == thedept) {
						var course = sectionIDs[alias].replace('-', " ").split('-')[0];
						var reviewID = deptReviews[rev].section.id.split('-')[0];
						var instructorID = deptReviews[rev].instructor.id;
						var PCRRating = deptReviews[rev].ratings.rCourseQuality;
						
						if (!(resp.hasOwnProperty(course))) {
							resp[course] = [{'revID': 0}];
						}
						oldestID = Number(resp[course][0].revID);
						if (reviewID > oldestID) {
							resp[course] = [{
								'InstID': instructorID,
								'revID': reviewID,
								'Rating': PCRRating
							}];
						} else if (reviewID == oldestID) {
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

// Manage search requests
app.get('/Search', stormpath.loginRequired, function(req, res) {
	var searchParam 	= req.query.searchParam; // The search terms
	var searchType 		= req.query.searchType; // Course ID, Keyword, or Instructor
	var resultType 		= req.query.resultType; // Course numbers, section numbers, section info
	var instructFilter 	= req.query.instFilter; // Is there an instructor filter?
	var reqFilter 		= req.query.reqParam;
	var proFilter		= req.query.proParam;
	var actFilter		= req.query.actParam;
	var includeOpen		= req.query.openAllow;
	var includeClosed	= req.query.closedAllow;

	if (typeof reqFilter 	=== 'undefined') {reqFilter 	= ''} else {reqFilter 	= '&fulfills_requirement='+reqFilter}
	if (typeof proFilter 	=== 'undefined') {proFilter 	= ''} else {proFilter 	= '&program='+proFilter}
	if (typeof actFilter 	=== 'undefined') {actFilter 	= ''} else {actFilter 	= '&activity='+actFilter}
	if (typeof includeOpen	=== 'undefined') {includeOpen 	= ''} else {includeOpen = '&open=true'}

	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=200&term='+currentTerm+reqFilter+proFilter+actFilter+includeOpen;

	if (searchType == 'courseIDSearch') {var baseURL = baseURL + '&course_id='	+ searchParam;}
	if (searchType == 'keywordSearch') 	{var baseURL = baseURL + '&description='+ searchParam;}
	if (searchType == 'instSearch') 	{var baseURL = baseURL + '&instructor='	+ searchParam;}

	// If we are checking a course and only want to see the sections taught by a specific instructore:
	if (instructFilter != 'all' && typeof instructFilter !== 'undefined') {var baseURL = baseURL + '&instructor='+instructFilter;}

	if (searchType == 'courseIDSearch' && resultType == 'deptSearch' && reqFilter == '' && proFilter == '' && actFilter == '' && includeOpen == '') {
		fs.readFile('./'+currentTerm+'/'+searchParam.toUpperCase()+'.json', function (err, data) {
			if (err) {return res.send({});}
			else {return res.send(JSON.parse(data));}
		});
	} else {
		console.time((req.user.email.split('@')[0] + ' ' + searchType + ': ' + searchParam+'  Request Time').yellow); // Start the timer
	    request({
			uri: baseURL,
			method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			if (error) {
				console.error('Request failed:', error);
				return res.send('PCSERROR: request failed');
			}
			console.timeEnd((req.user.email.split('@')[0] + ' ' + searchType + ': ' + searchParam+'  Request Time').yellow);
			if 			(resultType == 'deptSearch'){ // This will only receive requests if we are checking the API
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

			if (StartTime[0] == '0') 	{StartTime = StartTime.slice(1);} // If it's 08:00, make it 8:00
			if (EndTime[0] == '0')		{EndTime = EndTime.slice(1);}

			var MeetDays = JSONObj.meetings[meeting].meeting_days; // Output like MWF or TR
			meetListInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays;
			TimeInfo.push(meetListInfo);
		}}
	}
	catch (err) {
		console.log(("Error getting times" + JSONObj.section_id).red);
		var TimeInfo = '';
	}
	return [StatusClass, TimeInfo];
}

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
		var prereq 			= entry.prerequisite_notes;
		if (prereq == "") {prereq = "none";}
		var termsOffered 	= entry.course_terms_offered;

		for(var listing in meetArray) {
			TimeInfo 		+= meetArray[listing].split("-")[1] + '<br>';
		}
		if (StatusClass == "OpenSec") {var OpenClose = 'Open';} else {var OpenClose = 'Closed';}

		if (entry.recitations != false) { // If it has recitations
			var AsscList = '<br>Associated Recitations<ul class="AsscText">';
			for(var key in entry.recitations) { if (entry.recitations.hasOwnProperty(key)) { 
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</span></li>';
			}}
			AsscList += '</ul>';

		} else if (entry.labs != false) { // If it has labs
			var AsscList = '<br>Associated Labs<ul class="AsscText">';
			for(var key in entry.labs) { if (entry.labs.hasOwnProperty(key)) { 
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</span></li>';
			}}
			AsscList += '</ul>';

		} else if (entry.lectures != false) { // If it has lectures
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
			console.log((myPennkey + ' Star: '+ courseID).cyan);
			var index = StarredCourses.indexOf(courseID);
			if (index == -1) {StarredCourses.push(courseID);} // If the section is not already in the list

		} else if (addRem == 'rem') { // If we need to remove
			console.log((myPennkey + ' Unstar: '+ courseID).cyan);
			var index = StarredCourses.indexOf(courseID);
			if (index > -1) {StarredCourses.splice(index, 1);}

		} else if (addRem == 'clear') { // Clear all
			console.log((myPennkey + ' Clear star: '+ courseID).cyan);
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
	var myPennkey 		= req.user.email.split('@')[0]; // Get Pennkey

	db.Students.find({Pennkey: myPennkey}, { Schedules: 1}, function(err, doc) { // Try to access the database
		if (typeof doc === 'undefined' || typeof doc === null || err != null || doc.length == 0) {
			db.Students.save({'Pennkey': myPennkey, 'StarList': []});
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

		// console.log(doc[0].Schedules)
		// console.log(schedName)
		// console.log(SchedCourses)

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
					console.log((myPennkey + ' Sched Added: ' + JSONSecID).magenta);
				}}
				var placeholder = {};
				placeholder['Schedules.' + schedName] = SchedCourses;
				db.Students.update({Pennkey: myPennkey}, { $set: placeholder, $currentDate: { lastModified: true }}); // Update the database
				return res.send(SchedCourses);
			});

		} else if (addRem == 'rem') { // If we need to remove
			for (var meetsec in SchedCourses) { if (SchedCourses.hasOwnProperty(meetsec)) {
				if (SchedCourses[meetsec].fullCourseName.replace(/ /g, "") == courseID) { // Find all meeting times of a given course
					delete SchedCourses[meetsec];
					console.log((myPennkey + ' Sched Removed: ' + courseID).magenta);
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
			console.log((myPennkey + ' Sched Cleared').magenta);
			return res.send(SchedCourses);
		
		} else if (addRem == 'del') { // Clear all
			delete doc[0].Schedules[schedName];
			if(Object.getOwnPropertyNames(doc[0].Schedules).length === 0){
				doc[0].Schedules['Schedule'] = {};
			}
			db.Students.update({Pennkey: myPennkey}, { $set: {'Schedules': doc[0].Schedules}, $currentDate: { lastModified: true }}); // Update the database
			schedList = Object.keys(doc[0].Schedules);
			return res.send(schedList);
		
		} else if (addRem == 'name') { // If we're getting a list of the schedules
			schedList = Object.keys(doc[0].Schedules);
			if (schedList.length == 0) {
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