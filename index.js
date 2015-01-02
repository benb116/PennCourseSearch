// Initial configuration
var config = require('./config')
var path = require('path');
var express = require('express')
var app = express();
var request = require("request");
var mongojs = require("mongojs");
var colors = require('colors');

// Set paths and errors
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.static(path.join(__dirname, 'public')));
process.env.PWD = process.cwd()

// Connect to database
var uri = 'mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1',
		db = mongojs.connect(uri, ["Students"]);

// Start the server
app.listen(process.env.PORT || 3000, function(){
	console.log("Node app is running. Better go catch it.".green)
	console.log("Search ".yellow + "Add ".cyan + "Remove ".magenta + "Spit ".blue + "Error ".red)
})

// Rotating subtitles
subtitles = [	"Cause PennInTouch sucks.", 
				"You can press the back button, but you don't even need to.",
				"Invented by Benjamin Franklin in 1793.",
				"Multi-page functionality. One page simplicity.",
				"Focus on your classes, not your schedule.",
				"Faster than you can say 'Wawa run.'"];
// Handle main page requests
app.get('/', function(req, res) {
	thissub = subtitles[Math.floor(Math.random() * subtitles.length)]; // Get random subtitle
	console.log(thissub)
	return res.render('index', { // Send page
		title: 'Penn Course Search',
		subtitle: thissub
	});
})

// This request manager is for spitting the department lists. They are saved for faster responses
app.get('/Spit', function(req, res) {
	var thedept = req.query.dept;
	request({
		uri: 'http://localhost:3000/Search?searchType=deptSearch&courseID=' + thedept // Get preformatted results
	}, function(error, response, body) {
		return res.render('new', {text: body});
		console.log(('List Spit: '+thedept).blue)
	});
});
// This request manager is for spitting the PCR Course ID's. They are saved for faster responses
app.get('/PCRSpitID', function(req, res) {
	var courseID = req.query.courseID;
	request({
		uri: 'http://api.penncoursereview.com/v1/coursehistories/'+courseID+'?token='+config.PCRToken // Get preformatted results
	}, function(error, response, body) {
		try {
			var Res = JSON.parse(body); // Convert to JSON object
			console.log(('PCR ID Spit: '+courseID).blue)
			return res.send((Res.result.courses[Res.result.courses.length - 1].id).toString())
		} catch(err) {
			return res.send('0000')
		}
	});
});
// This request manager is for spitting the PCR reviews. They are saved for faster responses
app.get('/PCRSpitRev', function(req, res) {
	var courseID = req.query.courseID;
	request({
		uri: 'http://api.penncoursereview.com/v1/courses/'+courseID+'/reviews?token='+config.PCRToken // Get preformatted results
	}, function(error, response, body) {
		try {
			var Res = JSON.parse(body); // Convert to JSON object
			cQ = Res.result.values[Res.result.values.length - 1].ratings.rCourseQuality
			console.log(('PCR Rev Spit: '+courseID).blue)
			return res.send(cQ.toString())
		} catch(err) {
			return res.send(err)
		}
	});
});

// Manage search requests
app.get('/Search', function(req, res) {
	var searchParam = req.query.searchParam;
	console.log(searchParam.yellow);
	var searchType = req.query.searchType;
	var termSelect = req.query.term;
	if (searchType == 'descSearch') { // If it's a description search
		console.time('  Request Time'); // Start the timer
	    request({
			uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?description='+searchParam+'&number_of_results_per_page=200',
			method: "GET",headers: {"Authorization-Bearer": config.requestAB,"Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			console.timeEnd('  Request Time');
			var searchResponse = parseDeptList(body) // Parse the coursenumber response
			return res.send(searchResponse); // return correct info
		});
	} else if (searchType == 'instSearch') { // If it's a description search
		console.time('  Request Time'); // Start the timer
	    request({
			uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?instructor='+searchParam+'&number_of_results_per_page=200',
			method: "GET",headers: {"Authorization-Bearer": config.requestAB,"Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			console.timeEnd('  Request Time');
			var searchResponse = parseDeptList(body) // Parse the coursenumber response
			return res.send(searchResponse); // return correct info
		});
	} else {
		console.time('  Request Time'); // Start the timer
	    request({
			uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+searchParam+'&number_of_results_per_page=200',
			method: "GET",headers: {"Authorization-Bearer": config.requestAB,"Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			console.timeEnd('  Request Time');
			try {
				if (searchType == 'deptSearch'){ // This will only receive requests if we are checking the API
					var searchResponse = parseDeptList(body) // Parse the dept response
				} else if (searchType == 'numbSearch') {
					var searchResponse = parseCourseList(body) // Parse the num response
				} else if (searchType == 'sectSearch') {
					var searchResponse = parseSectionList(body) // Parse the sec response
				} else {var searchResponse = ''}
			} catch(err) {var searchResponse = 'No results :('}
			return res.send(searchResponse); // return correct info
		});
	};
});

// Get previously scheduled sections
SchedCourses = {};
myPennkey = config.Pennkey;
console.time('DB Time')
db.Students.find({Pennkey: myPennkey}, { Sched1: 1}, function(err, doc) {
	try {
		SchedCourses = doc[0].Sched1;
	} catch(error) {
		db.Students.insert({Pennkey: myPennkey});
		db.Students.update({Pennkey: myPennkey}, { $set: {Sched1: SchedCourses}, $currentDate: { lastModified: true }}); // Update the database	
	}
	console.timeEnd('DB Time')
});

// Manage scheduling requests
app.get('/Sched', function(req, res) {
	var addRem = req.query.addRem; // Are we adding, removing, or clearing?
	var courseID = req.query.courseID;
	var termSelect = req.query.term;
	if (addRem == 'add') { // If we need to add, then we get meeting info for the section
	  request({
			uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+courseID+"&term="+termSelect,
			method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			resJSON = getSchedInfo(body); // Format the response
			console.log('Sched Added: '.cyan)
			for (var i = 0; i < Object.keys(resJSON).length; i++) { // Compile a list of courses
				var JSONSecID = Object.keys(resJSON)[i]
				SchedCourses[JSONSecID] = resJSON[JSONSecID];
				console.log(JSONSecID.cyan)
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
	}
	else {
		return res.send(SchedCourses); // On a blank request
	}

});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	console.log(Res)
	var coursesList = [];
	for(var key in Res.result_data) { // Iterate through each course
		var courseListName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number; // Get course dept and number
		if (coursesList.indexOf('<li>'+courseListName+'<span class="CourseTitle"> - '+courseTitle+'</span></li>') == -1) { // If it's not already in the list
			var courseTitle = Res.result_data[key].course_title;
			coursesList.push('<li>'+courseListName+'<span class="CourseTitle"> - '+courseTitle+'</span></li>'); // Add and format
		};
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
		console.log("Error getting times".red)
		var TimeInfo = '';
	}
	return [StatusClass, TimeInfo];
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var courseTitle = Res.result_data[0].course_title;
	var sectionsList = '<span>'+courseTitle+'</span>' // Give the list a title
	for(var key in Res.result_data) {
		var SectionName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number+' '+Res.result_data[key].section_number;
		var TimeInfoArray = getTimeInfo(Res.result_data[key]); // Get meeting times for a section
		var StatusClass = TimeInfoArray[0];
		var TimeInfo = TimeInfoArray[1][0]; // Get the first meeting slot
		if(typeof TimeInfoArray[1][1] !== 'undefined'){TimeInfo += ' ...';}; // If there are multiple meeting times
		if(typeof TimeInfo === 'undefined'){TimeInfo = '';};
		if (sectionsList.indexOf(SectionName) == -1) { // If it's not already in the list
			sectionsList += '<li><span>&nbsp + &nbsp</span><span class="'+StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;<span>'+SectionName+TimeInfo+'</span></li>'; // Add and format
		};
	}
	if (sectionsList == "") {sectionsList = "No results"}; // If there's nothing, return 'No results'
	return sectionsList;
}

function parseSectionList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	try {
		var Title = entry.course_title;
		var FullID = entry.section_id_normalized.replace(/-/g, " "); // Format name
		try {
			var Instructor = "<br><br>Instructor: " + entry.instructors[0].name;
		} catch(err) {
			var Instructor = "";
		}
		var Desc = entry.course_description;
		var TimeInfoArray = getTimeInfo(entry);
		var StatusClass = TimeInfoArray[0];
		var meetArray = TimeInfoArray[1];
		var TimeInfo = '';
		var prereq = entry.prerequisite_notes;
		if (prereq == "") {prereq = "none"}

		var termsOffered = entry.course_terms_offered;
		for(var listing in meetArray) {
			TimeInfo += meetArray[listing].split("-")[1] + '<br>';
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

		return "<span>&nbsp + &nbsp</span><span>" + FullID + "</span> - " + Title + Instructor +	"<br><br><span class='DescButton'>Description</span><br><p class='DescText'>" + Desc + "</p><br>Status: " + OpenClose + "<br><br>"+termsOffered+"<br><br>Prerequisites: " + prereq + "<br><br>" + TimeInfo + AsscList; // Format the whole response
	}
 	catch(err) {
		return 'No Results';
	}
}

function getSchedInfo(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	try {
		var SectionName = entry.section_id_normalized.replace(/ /g, "").replace(/-/g, " "); // Format name
		console.log(SectionName)
		var SectionID = entry.section_id_normalized.replace(/-/g, ""); // Format name
		var resJSON = { };
		try { // Not all sections have time info
			for (var meeti in entry.meetings) {
				var StartTime = (entry.meetings[meeti].start_hour_24) + (entry.meetings[meeti].start_minutes)/60;
				var EndTime = (entry.meetings[meeti].end_hour_24) + (entry.meetings[meeti].end_minutes)/60;
				var halfLength = EndTime - StartTime;
				var MeetDays = entry.meetings[meeti].meeting_days;
				var OpenClose = entry.course_status_normalized;
				try {
					var Building = entry.meetings[meeti].building_code;
					var Room = entry.meetings[meeti].room_number;
				} catch(err) {
					var Building = "";
					var Room = "";
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
