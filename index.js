var path = require('path');
var express = require('express')
var app = express();
var request = require("request");
var currentTerm = '2015A'

SchedCourses = {};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.set('port', process.env.PORT || 3000)
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  return res.render('index', {
    title: 'PennCourseScheduler',
    currentTerm: currentTerm
  });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

app.get('/Search/:deptId', function(req, res) {
	if (req.params.deptId != 'favicon.ico') {
		requestPage(req.params.deptId, "", "")
		function requestPage(dept, num, sec) {
			// console.log('Search Terms: '+dept+num+sec)
			request({
			  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+'&number_of_results_per_page=200',
			  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
			}, function(error, response, body) {
				return res.send(parseDeptList(body));
			});
		}
	};
});

app.get('/Search/:deptId/:courseId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, "")
	function requestPage(dept, num, sec) {
		// console.log('Search Terms: '+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+'&number_of_results_per_page=100',
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			return res.send(parseCourseList(body));
		});
	}
});

app.get('/Search/:deptId/:courseId/:secId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, req.params.secId)
	function requestPage(dept, num, sec) {
		// console.log('Search Terms: '+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec,
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			resJSON = parseSectionList(body);
			for (var i = 0; i < Object.keys(resJSON).length; i++) {
				var JSONSecID = Object.keys(resJSON)[i]
				SchedCourses[JSONSecID] = resJSON[JSONSecID];
			};
			console.log(SchedCourses);
			return res.send(resJSON);
		});
	}
});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var coursesList = [];
	for(var key in Res.result_data) { // Iterate through each course
      	var courseListName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number; // Get course dept and number
      	if (coursesList.indexOf(courseListName) == -1) { // If it's not already in the list
      		coursesList.push(courseListName); // Add and format
      	};
    }
    coursesList.sort()
    for (var i = 0; i < coursesList.length; i++) {
    	coursesList[i] = '<li>'+coursesList[i]+'</li>' // Format as HTML list
    };
	return coursesList;
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var sectionsList = ''
	for(var key in Res.result_data) {
      	tempName = Res.result_data[key].course_department+' '+Res.result_data[key].course_number+' '+Res.result_data[key].section_number;
      	OCStatus = Res.result_data[key].course_status;
      	if (OCStatus == "O") {
      		var StatusClass = 'OpenSec' // If it's open, add class open
      	} else {
      		var StatusClass = 'ClosedSec' // If it's closed, add class closed
      	};

		try { // Not all sections have time info
			var StartTime = Res.result_data[key].meetings[0].start_time.split(" ")[0];
			if (StartTime[0] == '0') {StartTime = StartTime.slice(1)};
			var EndTime = Res.result_data[key].meetings[0].end_time.split(" ")[0];
			if (EndTime[0] == '0') {EndTime = EndTime.slice(1)};
			var MeetDays = Res.result_data[key].meetings[0].meeting_days;
			TimeInfo = ' - '+StartTime+" to "+EndTime+" on "+MeetDays ;
		}
		catch(err) {
			console.log("Error getting times")
			var TimeInfo = '';
		}
		if (sectionsList.indexOf(tempName) == -1) { // If it's not already in the list
      		sectionsList += '<li><span>&nbsp + &nbsp</span><span class="'+StatusClass+'">&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;<span>'+tempName+TimeInfo+'</span></li>'; // Add and format
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
		var SectionName = entry.section_id_normalized.replace('-', ' ').replace('-', ' '); // Format name
		var SectionID = entry.section_id_normalized.replace('-', '').replace('-', ''); // Format name
		var Desc = entry.course_description;
		var resJSON = { };
		try { // Not all sections have time info
			for (var meeti in entry.meetings) {
				var StartTime = (entry.meetings[meeti].start_hour_24)*2 + (entry.meetings[meeti].start_minutes)/30;
				var EndTime = (entry.meetings[meeti].end_hour_24)*2 + (entry.meetings[meeti].end_minutes)/30;
				var halfLength = EndTime - StartTime;
				var MeetDays = entry.meetings[meeti].meeting_days;
				var OpenClose = entry.course_status_normalized;

				resJSON[SectionID+MeetDays+StartTime] = {'fullCourseName': SectionName,
		    		'halfHourLength': halfLength,
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
