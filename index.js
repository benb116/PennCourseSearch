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
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_info/'+dept,
		  method: "GET",
		  headers: { 
		    "Authorization-Bearer": "***REMOVED***",
		    "Authorization-Token": "***REMOVED***" 
		  },
		}, function(error, response, body) {
			return res.send(body);
		});
	}
});

app.get('/:deptId/:courseId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, "")
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec+'&term=2014C',
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
		return Title+"<br>"+Desc+"<br><br>"+StartTime+" - "+EndTime;
	}
	catch(err) {}
}

