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

app.get('/Search/:deptId', function(req, res) {
	if (req.params.deptId != 'favicon.ico') {
		requestPage(req.params.deptId, "", "")
		function requestPage(dept, num, sec) {
			console.log('Search Terms: '+dept+num+sec)
			request({
			  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_info/'+dept+'?number_of_results_per_page=200',
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
		console.log('Search Terms: '+dept+num+sec)
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
		console.log('Search Terms: '+dept+num+sec)
		request({
		  uri: 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?course_id='+dept+num+sec,
		  method: "GET",headers: {"Authorization-Bearer": "***REMOVED***","Authorization-Token": "***REMOVED***"},
		}, function(error, response, body) {
			return res.send(parseSectionList(body));
		});
	}
});

function parseDeptList(JSONString) {
	var Res = JSON.parse(JSONString); // Convert to JSON object
	var coursesList = [];
	for(var key in Res.result_data) { // Iterate through each course
      	var courseListName = Res.result_data[key].department+' '+Res.result_data[key].course_number; // Get course dept and number
      	var termsOffered = Res.result_data[key].terms_offered_code;
      	if ((coursesList.indexOf(courseListName) == -1) && (termsOffered == "A" || termsOffered == "B" || termsOffered == "C")) { // If it's not in the list already and it is not available 'M'
      		coursesList.push(courseListName);
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
      	tempName = Res.result_data[key].section_id_normalized;
      	OCStatus = Res.result_data[key].course_status;
      	if (OCStatus == "O") {
      		var StatusClass = 'OpenSec' // If it's open, add class open
      	} else {
      		var StatusClass = 'ClosedSec' // If it's closed, add class closed
      	};
      	tempName = tempName.replace('-', " ").replace('-', " ");
      	if (sectionsList.indexOf(tempName) == -1) { // If it's not already in the list
      		sectionsList += '<li class="'+StatusClass+'">'+tempName+'</li>'; // Add and format
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
		var FullID = entry.section_id_normalized.replace('-', " ").replace('-', " "); // Format name
		var Desc = entry.course_description;
		try { // Not all sections have time info
			var StartTime = entry.meetings[0].start_time;
			var EndTime = entry.meetings[0].end_time;
			var MeetDays = entry.meetings[0].meeting_days;
			var OpenClose = entry.course_status_normalized;
			TimeInfo = "<br><br>"+StartTime+" - "+EndTime+" on "+MeetDays 
		}
		catch(err) {
			console.log("Error getting times")
			var TimeInfo = '';
		}
		if (entry['recitations'] != false) { // If it has recitations
			var AsscList = '<br><br>Associated Recitations: <ul>';
			for(var key in entry.recitations) {
				AsscList += '<li>'+entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id+'</li>'
			};
			AsscList += '</ul>';

		} else if (entry['labs'] != false) { // If it has labs
			var AsscList = '<br><br>Associated Labs: <ul>';
			for(var key in entry.labs) {
				AsscList += '<li>'+entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id+'</li>'
			};
			AsscList += '</ul>';

		} else if (entry['lectures'] != false) { // If it has lectures
			var AsscList = '<br><br>Associated Lectures: <ul>';
			for(var key in entry.lectures) {
				AsscList += '<li>'+entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id+'</li>'
			};
			AsscList += '</ul>';

		} else {
			AsscList = '';
		};

		return FullID + ' - ' + Title + "<br>"+ OpenClose+ "<br>" + Desc + TimeInfo + AsscList; // Format the whole response
	}
 	catch(err) {
		return 'No Results';
	}
}
