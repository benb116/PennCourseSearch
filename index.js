var config = require('./config')
var path = require('path');
var express = require('express')
var app = express();
var request = require("request");
var currentTerm = '2015A'

SchedCourses = {};
if (__dirname == '/app') {
	RequestDept = true;
} else {
	RequestDept = false;
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(function(error, req, res, next) {
    res.status(500);
    res.render('500.hjs');
  });
process.env.PWD = process.cwd()

subtitles = ["Cause PennInTouch sucks.", "You can press the back button, but you don't even need to.", "This site was invented by Benjamin Franklin in 1793."];

app.get('/', function(req, res) {
  thissub = subtitles[Math.floor(Math.random() * subtitles.length)];
  return res.render('index', {
    title: 'Penn Course Search',
    currentTerm: currentTerm,
    subtitle: thissub
  });
})

app.listen(process.env.PORT || 3000, function(){
  console.log("Node app is running. Better go catch it")
})

// This request manager is for spitting the department lists. They are saved for faster responses
app.get('/Spit', function(req, res) {
	var thedept = req.query.dept;
	console.log(thedept)
	request({
		uri: 'http://localhost:3000/Search?searchType=deptSearch&courseID=' + thedept
	}, function(error, response, body) {
		return res.render('new', {
			text: body
		});
	});
});

// Manage search requests
app.get('/Search', function(req, res) {
	var courseIDSearch = req.query.courseID;
	console.log(courseIDSearch);
	var searchType = req.query.searchType;
	if (courseIDSearch != 'favicon.ico') {
		if (searchType == 'deptSearch' && RequestDept == false) { // If it's a dept search and we aren't rechecking the API
			
			return res.sendfile(process.env.PWD+'/public/DeptListings/'+courseIDSearch+'.txt'); // Send the premade text
		
		} else if (searchType == 'descSearch') { // If it's a desc search and we aren't rechecking the API
			console.time('  Request Time'); // Start the timer
			request({
			  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?description='+courseIDSearch+'&number_of_results_per_page=200',
			  method: "GET",headers: {"Authorization-Bearer": config.requestAB,"Authorization-Token": config.requestAT},
			}, function(error, response, body) {
				console.timeEnd('  Request Time');
				var searchResponse = parseDeptList(body) // Parse the dept response
				return res.send(searchResponse); // return correct info
			});
		} else {
			console.time('  Request Time'); // Start the timer
			request({
			  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+courseIDSearch+'&number_of_results_per_page=200',
			  method: "GET",headers: {"Authorization-Bearer": config.requestAB,"Authorization-Token": config.requestAT},
			}, function(error, response, body) {
				console.timeEnd('  Request Time');
				try {
					if (searchType == 'deptSearch' && RequestDept == true){ // If we are checking the API
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
	};
});

// Manage scheduling requests
app.get('/Sched', function(req, res) {
	var addRem = req.query.addRem; // Are we adding, removing, or clearing?
	var courseID = req.query.courseID;

	if (addRem == 'add') { // If we need to add, then we get time info for the section
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+courseID,
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			resJSON = getSchedInfo(body); // Format the response
			console.log('Added: ')
			for (var i = 0; i < Object.keys(resJSON).length; i++) { // Compile a list of courses
				var JSONSecID = Object.keys(resJSON)[i]
				SchedCourses[JSONSecID] = resJSON[JSONSecID];
				console.log(JSONSecID)
			};
			return res.send(SchedCourses);
		});
	} else if (addRem == 'rem') { // If we need to remove
		console.log('Removed: ')
		for (meetsec in SchedCourses) {
			if (SchedCourses[meetsec].fullCourseName.replace(/ /g, "") == courseID) { // Find all meeting times of a given course
				delete SchedCourses[meetsec];
				console.log(courseID)
			}
		}
		return res.send(SchedCourses);
	} else if (addRem == 'clear') { // Clear all
		SchedCourses = {};
		console.log('Cleared')
	}
	else {
		return res.send(SchedCourses);
	}

});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
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

function getTimeInfo(JSONObj) {
	OCStatus = JSONObj.course_status;
  	if (OCStatus == "O") {
  		var StatusClass = 'OpenSec' // If it's open, add class open
  	} else if (OCStatus == "C") {
  		var StatusClass = 'ClosedSec' // If it's closed, add class closed
  	} else {
  		var StatusClass = 'ErrorSec' // Otherwise make it gray
  	};
  	var TimeInfo = [];
	try { // Not all sections have time info
		for(var meetList in JSONObj.meetings) {
			var StartTime = JSONObj.meetings[meetList].start_time.split(" ")[0];
			if (StartTime[0] == '0') {StartTime = StartTime.slice(1)};
			var EndTime = JSONObj.meetings[meetList].end_time.split(" ")[0];
			if (EndTime[0] == '0') {EndTime = EndTime.slice(1)};
			var MeetDays = JSONObj.meetings[meetList].meeting_days;
			meetListInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays;
			TimeInfo.push(meetListInfo);
		}
	}
	catch(err) {
		console.log("Error getting times")
		console.log('catch')
		var TimeInfo = '';
	}
	return [StatusClass, TimeInfo];
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var courseTitle = Res.result_data[0].course_title;
	var sectionsList = '<span>'+courseTitle+'</span>'
	for(var key in Res.result_data) {
      	var tempName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number+' '+Res.result_data[key].section_number;
      	var TimeInfoArray = getTimeInfo(Res.result_data[key]);
      	var StatusClass = TimeInfoArray[0];
      	var TimeInfo = TimeInfoArray[1][0];
      	if(typeof TimeInfoArray[1][1] !== 'undefined'){TimeInfo += ' ...';};
      	if(typeof TimeInfo === 'undefined'){TimeInfo = '';};
		if (sectionsList.indexOf(tempName) == -1) { // If it's not already in the list
      		sectionsList += '<li><span>&nbsp + &nbsp</span><span class="'+StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;<span>'+tempName+TimeInfo+'</span></li>'; // Add and format
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
      	for(var listing in meetArray) {
      		TimeInfo += meetArray[listing].split("-")[1] + '<br>';
      	}

      	if (StatusClass == "OpenSec") {var OpenClose = 'Open'} else {var OpenClose = 'Closed'};

		if (entry['recitations'] != false) { // If it has recitations
			var AsscList = '<br>Associated Recitations: <ul>';
			for(var key in entry.recitations) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else if (entry['labs'] != false) { // If it has labs
			var AsscList = '<br>Associated Labs: <ul>';
			for(var key in entry.labs) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else if (entry['lectures'] != false) { // If it has lectures
			var AsscList = '<br>Associated Lectures: <ul>';
			for(var key in entry.lectures) {
				AsscList += '<li><span>&nbsp + &nbsp</span><span>'+entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id+'</span></li>'
			};
			AsscList += '</ul>';

		} else {
			AsscList = '';
		};

		return "<span>&nbsp + &nbsp</span><span>" + FullID + "</span> - " + Title + Instructor +  "<br><br><span class='DescButton'>Description</span><br><p class='DescText'>" + Desc + "</p><br>Status: " + OpenClose + "<br><br>Prerequisites: " + prereq + "<br><br>" + TimeInfo + AsscList; // Format the whole response
	}
 	catch(err) {
		return 'No Results';
	}
}

function getSchedInfo(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON Object
	var entry = Res.result_data[0];
	try {
		var SectionName = entry.section_id_normalized.replace(/-/g, " "); // Format name
		var SectionID = entry.section_id_normalized.replace(/-/g, ""); // Format name
		var resJSON = { };
		try { // Not all sections have time info
			for (var meeti in entry.meetings) {
				var StartTime = (entry.meetings[meeti].start_hour_24) + (entry.meetings[meeti].start_minutes)/60;
				var EndTime = (entry.meetings[meeti].end_hour_24) + (entry.meetings[meeti].end_minutes)/60;
				var halfLength = EndTime - StartTime;
				var MeetDays = entry.meetings[meeti].meeting_days;
				var OpenClose = entry.course_status_normalized;

				resJSON[SectionID.replace(/ /g, "")+MeetDays+StartTime] = {'fullCourseName': SectionName,
		    		'HourLength': halfLength,
		    		'meetDay': MeetDays,
		    		'meetHour': StartTime};
	    	}
		}
		catch(err) {
			console.log("Error getting times")
			var TimeInfo = '';
		}
		return resJSON;
	}
 	catch(err) {
		return 'No Results';
	}
}
