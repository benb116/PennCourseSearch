var path = require('path');
var express = require('express')
var app = express();
var request = require("request");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.set('port', process.env.PORT || 3000)
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  return res.render('index', {
    title: 'PennCourseScheduler'
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
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+'&number_of_results_per_page=400',
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			return res.send(parseDeptList(body));
		});
	}
});

app.get('/:deptId/:courseId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, "")
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+'&term=2014C&number_of_results_per_page=100',
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			return res.send(parseCourseList(body));
		});
	}
});

app.get('/:deptId/:courseId/:secId', function(req, res) {
	requestPage(req.params.deptId, req.params.courseId, req.params.secId)
	function requestPage(dept, num, sec) {
		console.log('course_id='+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec,
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			return res.send(parseSectionList(body));
		});
	}
});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString);
	var coursesList = ''
	for(var key in Res.result_data) {
      for(var nkey in key) {
      	tempName = Res.result_data[key].section_id_normalized.slice(0, -4);
      	tempName = tempName.replace('-', " ");
      	if (coursesList.indexOf(tempName) == -1) {
      		coursesList += '<li>'+tempName+'</li>';
      	};
      }
    }

	return coursesList;
}

function parseCourseList(JSONString) {
	var Res = JSON.parse(JSONString);
	var sectionsList = ''
	for(var key in Res.result_data) {
      for(var nkey in key) {
      	tempName = Res.result_data[key].section_id_normalized;
      	tempName = tempName.replace('-', " ").replace('-', " ");
      	if (sectionsList.indexOf(tempName) == -1) {
      		sectionsList += '<li>'+tempName+'</li>';
      	};
      }
    }
    return sectionsList;
}

function parseSectionList(JSONString) {
	var Res = JSON.parse(JSONString);
	var entry = Res.result_data[0];
	try {
		var Title = entry.course_title;
		var Desc = entry.course_description;
		var StartTime = entry.meetings[0].start_time;
		var EndTime = entry.meetings[0].end_time;
		var MeetDays = entry.meetings[0].meeting_days;
		if (entry['recitations'] != false) {
			var AsscList = '<br><br>Associated Recitations: <ul>';
			for(var key in entry.recitations) {
				AsscList += '<li>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</li>'
			};
			AsscList += '</ul>';
		} else if (entry['labs'] != false) {
			var AsscList = '<br><br>Associated Labs: <ul>';
			for(var key in entry.labs) {
				AsscList += '<li>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</li>'
			};
			AsscList += '</ul>';
		} else if (entry['lectures'] != false) {
			var AsscList = '<br><br>Associated Lectures: <ul>';
			for(var key in entry.lectures) {
				AsscList += '<li>'+entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id+'</li>'
			};
			AsscList += '</ul>';
		} else {
			AsscList = '';
		};

		return Title+"<br>"+Desc+"<br><br>"+StartTime+" - "+EndTime+" on "+MeetDays + AsscList;		
	}
	catch(err) {
		return 'No Results'
	}
}
