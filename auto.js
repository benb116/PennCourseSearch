var request     = require('request');
var config;
try {
	config = require('./config.js');
} catch (err) { // If there is no config file
	config = {};
	config.requestAB      = process.env.REQUESTAB;
	config.requestAT      = process.env.REQUESTAT;
	config.PCRToken	      = process.env.PCRTOKEN;
	config.KeenIOID	      = process.env.KEEN_PROJECT_ID;
	config.KeenIOWriteKey = process.env.KEEN_WRITE_KEY;
	config.autotestKey    = process.env.AUTOTESTKEY;
}

var args = process.argv;
var courses = [];

for (var i = 2; i < args.length; i++) {
	var thisc = FormatID(args[i]);
	courses[i-2] = thisc[0] + '-' + thisc[1];
}

console.log(courses)
var urls = []
var BASE_URL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=500&course_id=';
courses.forEach(function(x) {
	urls.push(requestAsync(BASE_URL+x))
});


Promise.all(urls).then(function(allData) {
	console.time('test')
	var datasched = {};
	allData.forEach(function(response) {
		var resp = JSON.parse(response[0].body)
		var arra = resp.result_data;
		// var lastact = '';
		for (var i = 0; i < arra.length; i++) {
			var thissect = SchedClean(arra[i]);
		// 	if (thissect.actType !== lastact) {
		// 		datasched.push([]);
		// 		var lastact = thissect.actType;
		// 	}
		// 	datasched[datasched.length-1].push(thissect);
			var thiscourseact = thissect.course + '-' + thissect.actType
			if (!datasched[thiscourseact]) {
				datasched[thiscourseact] = []
			}
			datasched[thiscourseact].push(thissect);
		}

	})
	// console.log(datasched)
	var d, twodarr
	d = regenData(datasched);
	twodarr = d[0];
	datasched = d[1];

	types = twodarr.map(function(a) {
		return a[0];
	})	
	console.log(twodarr)


	var typekey = ['LEC', 'LAB', 'REC'];
	for (var h = 0; h < types.length; h++) {

		var anchor = datasched[types[h]][0];
		console.log('anchor', anchor.idDashed)

		var all_anchor_assc = [anchor.assclec, anchor.assclab, anchor.asscrec];
		for (var g = 0; g < 3; g++) {
			var thisassc = all_anchor_assc[g];
			if (thisassc.length) {
				thisassclist = thisassc.map(function(a) {
					return a.subject + '-' + a.course_id + '-' + a.section_id;
				})
				var thisassctype = anchor.course + '-' + typekey[g];
				var dataschedassc = datasched[thisassctype].map(function(a) {
					return a.idDashed;
				})

				datasched[thisassctype] = datasched[thisassctype].filter(function(a,e) {
					return (thisassclist.indexOf(dataschedassc[e]) > -1);
				})
			}
		}

		d = regenData(datasched);
		twodarr = d[0];
		datasched = d[1];

		for (var i = h+1; i < twodarr.length; i++) {
			var indtorem = []
			var numoftype = twodarr[i][1];
			for (var j = 0; j < numoftype; j++) {
				var ameet = datasched[twodarr[i][0]][j];
				if (anchor.course !== ameet.course) {
					var isover = Overlap(ameet, anchor)
					if (isover) {
						console.log(j)
						console.log('conflict', ameet.idDashed)
						indtorem.push(j);
					}
				}
			}

			var typeToRem = twodarr[i][0];
			datasched[typeToRem] = datasched[typeToRem].filter(function(a,e) {
				return !(indtorem.indexOf(e) > -1)
			})

			d = regenData(datasched);
			twodarr = d[0];
			datasched = d[1];
		}
		console.log(h, 'done')
	}
	console.timeEnd('test')
});

function regenData(datasched) {
	var types = Object.keys(datasched);
	var nums = [];
	for (var i = 0; i < types.length; i++) {
		nums[i] = datasched[types[i]].length
	}

	var twodarr = [];
	for (var i = 0; i < types.length; i++) {
		twodarr[i] = [types[i], nums[i]];
	}
	twodarr.sort(function(a,b) {
		return a[1] - b[1];
	})
	return [twodarr, datasched, types];
}

function Overlap(block1, block2) {
	// console.log(block1)
	var meet1 = block1.meetblk;
	var meet2 = block2.meetblk;
	var over = false;
	for (var i = 0; i < meet1.length; i++) {
		for (var j = 0; j < meet2.length; j++) {
			if (meet1[i].meetday === meet2[j].meetday) {
				var over = check(meet1[i], meet2[j]);
			}
		}
	}
	return over;
}

function check(block1, block2) {
	// Thank you to Stack Overflow user BC. for the function this is based on.
	// http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
	var y1 = block1.starthr;
	var b1 = block1.endhr;

	var y2 = block2.starthr;
	var b2 = block2.endhr;

	// This checks if the top of block 2 is lower down (higher value) than the bottom of block 1...
	// or if the top of block 1 is lower down (higher value) than the bottom of block 2.
	// In this case, they are not overlapping, so return false
	if (b1 <= y2 || b2 <= y1) {
		return false;
	} else {
		return true;
	}
}

function requestAsync(url) {
    return new Promise(function(resolve, reject) {
        request({
			uri: url,
			method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT}, // Send authorization headers
		}, function(err, res, body) {
            if (err) { return reject(err); }
            return resolve([res, body]);
        });
    });
}

function SchedClean(sec) {
	var thisInfo = {
		'idDashed': sec.course_department + '-' + sec.course_number + '-' + sec.section_number,
		'course': sec.course_department + '-' + sec.course_number,
		'actType': sec.activity,
		'assclec': sec.lectures,
		'assclab': sec.labs,
		'asscrec': sec.recitations,
		'meetblk': []
	};
	sec.meetings.forEach(function(meeting) {
		for (i = 0; i < meeting.meeting_days.length; i++) {
			thisInfo.meetblk.push({
				'meetday': meeting.meeting_days[i],
				'starthr': meeting.start_hour_24 + (meeting.start_minutes)/60,
				'endhr': meeting.end_hour_24 + (meeting.end_minutes)/60
			})
		}
	})
	return thisInfo;
}

function TwoOverlap(block1, block2) {
	// Thank you to Stack Overflow user BC. for the function this is based on.
	// http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
	var y1 = block1.top;
	var h1 = block1.height;
	var b1 = y1 + h1;

	var y2 = block2.top;
	var h2 = block2.height;
	var b2 = y2 + h2;

	// This checks if the top of block 2 is lower down (higher value) than the bottom of block 1...
	// or if the top of block 1 is lower down (higher value) than the bottom of block 2.
	// In this case, they are not overlapping, so return false
	if (b1 <= y2 || b2 <= y1) {
		return false;
	} else {
		return true;
	}
}
function FormatID(rawParam) {
	var searchParam = rawParam.replace(/ /g, "").replace(/-/g, "").replace(/:/g, ""); // Remove spaces, dashes, and colons
	var retArr = ['', '', ''];

	if (isFinite(searchParam[2])) {  // If the third character is a number (e.g. BE100)
		splitTerms(2);
	} else if (isFinite(searchParam[3])) {  // If the fourth character is a number (e.g. CIS110)
		splitTerms(3);
	} else if (isFinite(searchParam[4])) {  // If the fifth character is a number (e.g. MEAM110)
		splitTerms(4);
	} else {
		retArr[0] = searchParam;
	}

	function splitTerms(n) {
		retArr[0] = searchParam.substr(0, n);
		retArr[1] = searchParam.substr(n, 3);
		retArr[2] = searchParam.substr(n+3, 3);
	}
	
	return retArr;
}