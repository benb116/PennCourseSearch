var path = require('path');
var express = require('express')
var app = express();
var request = require("request");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.set('port', 3000)
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  return res.render('index', {
    title: 'Kite and Key'
  });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

app.get('/:deptId', function(req, res) {
	requestPage(req.params.deptId, "", "")
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+'&number_of_results_per_page=100&activity=LEC&activity=LAB&activity=SEM',
		  method: "GET",
		  headers: { 
		    "Authorization-Bearer": "***REMOVED***",
		    "Authorization-Token": "***REMOVED***" 
		  },
		}, function(error, response, body) {
			return res.send(parseCourseList(body));
		});
	}
});

app.get('/:deptId/:courseId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, "")
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec+'&term=2014C&number_of_results_per_page=100&activity=LEC&activity=LAB&activity=SEM',
		  method: "GET",
		  headers: { 
		    "Authorization-Bearer": "***REMOVED***",
		    "Authorization-Token": "***REMOVED***" 
		  },
		}, function(error, response, body) {
			return res.send(parseCourseResponse(body));
		});
	}
});

app.get('/:deptId/:courseId/:secId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, req.params.secId)
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec,
		  method: "GET",
		  headers: { 
		    "Authorization-Bearer": "***REMOVED***",
		    "Authorization-Token": "***REMOVED***" 
		  },
		}, function(error, response, body) {
			return res.send(parseCourseResponse(body));
		});
	}
});

function parseCourseResponse(JSONString) {
	var Res = JSON.parse(JSONString);
	try {
		var entry = Res.result_data[0];

		var Title = entry.course_title;
		var Desc = entry.course_description;
		var StartTime = entry.meetings[0].start_time;
		var EndTime = entry.meetings[0].end_time;
		var MeetDays = entry.meetings[0].meeting_days;

		return Title+"<br>"+Desc+"<br><br>"+StartTime+" - "+EndTime+" on "+MeetDays;
	}
	catch(err) {}
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString);
	var coursesList = ''
	for(var key in Res.result_data) {
      for(var nkey in key) {
      	tempName = Res.result_data[key].section_id_normalized.slice(0, -4);
      	tempName = tempName.replace('-', " ");
      	if (coursesList.indexOf(tempName) == -1) {
      		coursesList += '<li>'+tempName+'</li>';
      		console.log(coursesList)
      	};
      }
    }

	return coursesList;
}









