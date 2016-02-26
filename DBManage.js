var fs = require('fs');
var request = require("request");
// var mongojs = require("mongojs");
var config;
try {
	config = require('./config.js');
} catch (err) { // If there is no config file
	config = {};
	config.requestAB 	= process.env.REQUESTAB;
	config.requestAT 	= process.env.REQUESTAT;
	config.PCRToken 	= process.env.PCRTOKEN;
}

// Connect to database
// var db = mongojs('mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1', ["Students", "Courses2015C", "NewReviews"]);

var currentTerm = '2016C';
var deptList = ['AAMW', 'ACCT', 'AFRC', 'AFST', 'ALAN', 'AMCS', 'ANCH', 'ANEL', 'ANTH', 'ARAB', 'ARCH', 'ARTH', 'ASAM', 'ASTR', 'BCHE', 'BE', 'BENG', 'BEPP', 'BFMD', 'BIBB', 'BIOE', 'BIOL', 'BIOM', 'BMB', 'BSTA', 'CAMB', 'CBE', 'CHEM', 'CHIN', 'CINE', 'CIS', 'CIT', 'CLST', 'COLL', 'COML', 'COMM', 'CPLN', 'CRIM', 'DCOH', 'DEMG', 'DEND', 'DENT', 'DOMD', 'DORT', 'DOSP', 'DPED', 'DPRD', 'DPTH', 'DRAD', 'DRST', 'DTCH', 'DYNM', 'EALC', 'EAS', 'ECON', 'EDCE', 'EDUC', 'EEUR', 'ENGL', 'ENGR', 'ENM', 'ENMG', 'ENVS', 'EPID', 'ESE', 'FNAR', 'FNCE', 'FOLK', 'FREN', 'GAFL', 'GAS', 'GCB', 'GEOL', 'GREK', 'GRMN', 'GSWS', 'GUJR', 'HCMG', 'HEBR', 'HIND', 'HIST', 'HPR', 'HSOC', 'HSPV', 'HSSC', 'IMUN', 'INTG', 'INTL', 'INTR', 'INTS', 'IPD', 'ITAL', 'JPAN', 'JWST', 'KORN', 'LALS', 'LARP', 'LATN', 'LAW', 'LGIC', 'LGST', 'LING', 'LSMP', 'MATH', 'MCS', 'MEAM', 'MED', 'MGMT', 'MKTG', 'MLA', 'MLYM', 'MMP', 'MSCI', 'MSE', 'MSSP', 'MTR', 'MUSA', 'MUSC', 'NANO', 'NELC', 'NETS', 'NGG', 'NPLD', 'NSCI', 'NURS', 'OIDD', 'PERS', 'PHIL', 'PHRM', 'PHYS', 'PPE', 'PREC', 'PRTG', 'PSCI', 'PSYC', 'PSYS', 'PUBH', 'PUNJ', 'REAL', 'REG', 'RELS', 'ROML', 'RUSS', 'SAST', 'SCND', 'SKRT', 'SLAV', 'SOCI', 'SPAN', 'STAT', 'STSC', 'SWRK', 'TAML', 'TELU', 'THAR', 'TURK', 'URBS', 'URDU', 'VBMS', 'VCSN', 'VCSP', 'VIPR', 'VISR', 'VLST', 'VMED', 'VPTH', 'WH', 'WHCP', 'WHG', 'WRIT', 'YDSH'];
var maxIndex = deptList.length;

// The requirement name -> code map
var reqCodes = {
	Society: "MDS",
	History: "MDH",
	Arts: "MDA",
	Humanities: "MDO",
	Living: "MDL",
	Physical: "MDP",
	Natural: "MDN",
	Writing: "MWC",
	College: "MQS",
	Formal: "MFR",
	Cross: "MC1",
	Cultural: "MC2"
};

var source = process.argv[2].toLowerCase(); // registrar or review
var index = Number(process.argv[3]); // Can be a number or a dept code
var endindex;
try {
	endindex = Number(process.argv[4]) + 1; // If there's a second number, end at that number
} catch(err) {}
var limit = false;
if (isNaN(index)) { // If we're doing a specific department
	limit = 1;
	index = deptList.indexOf(process.argv[3].toUpperCase());
}
if (isNaN(endindex)) {
	endindex = maxIndex;
}
if (source === 'registrar') {
	if (limit) {
		PullRegistrar(index);
	} else {
		for (var i = index; i < endindex; i++) {
			PullRegistrar(i);
		}
	}
} else if (source === "review") {
	if (limit) {
		PullReview(index);
	} else {
		for (var i = index; i < endindex; i++) {
			PullReview(i);
		}
	}
}
return "done";

function PullRegistrar(index) {
	var thedept = deptList[index];
	console.log(thedept, index);
	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;
	if (!thedept) {return;}
	request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT}
	}, function(error, response, body) {
		console.log('Received', thedept);
		var inJSON = JSON.parse(body).result_data; // Convert to JSON object

		var resp = {};
		for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) {
			// For each section that comes up
			// Get course name (e.g. CIS 120)
			var thisKey = inJSON[key];
			// var spacedName = thisKey.section_id_normalized.replace('-', " ").split('-')[0].replace(/   /g, ' ').replace(/  /g, ' ');
			var idSpaced = thisKey.course_department + ' ' + thisKey.course_number;
			var idDashed = idSpaced.replace(' ', '-');
			if (!thisKey.is_cancelled && !resp[idSpaced]) {
				var reqCodesList = GetRequirements(thisKey)[0];
				
				resp[idSpaced] = {
					'idDashed': idDashed,
					'idSpaced': idSpaced,
					'courseTitle': thisKey.course_title,
					'courseReqs': reqCodesList
				};
			}
			if (key === inJSON.length - 1) {

				
			}
		}}
		var arrResp = [];
		for (key in resp) { if (resp.hasOwnProperty(key)) {
			arrResp.push(resp[key]);
		}}
		// At the end of the list
		fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(arrResp), function (err) {
			// Write JSON to file
			if (err) {
				console.log(index+' '+thedept+' '+err);
			} else {
				console.log(('List Spit: '+index+' '+thedept));
			}
		});
	});
}

function GetRequirements(section) {
  var reqList = section.fulfills_college_requirements;
  var reqCodesList = []; 
  try {
	reqCodesList[0] = reqCodes[reqList[0].split(" ")[0]];
	reqCodesList[1] = reqCodes[reqList[1].split(" ")[0]];
  } catch(err) {}
  var extraReq = section.important_notes;
  var extraReqCode;
  for (var i = 0; i < extraReq.length; i++) {
	extraReqCode = reqCodes[extraReq[i].split(" ")[0]];
	if (extraReqCode === 'MDO' || extraReqCode === 'MDN') {
	  // reqList.push(extraReq[i]);
	  reqCodesList.push(extraReqCode);
	} else if (section.requirements[0]) {
		if (section.requirements[0].registration_control_code === 'MDB') {
			reqCodesList.push('MDO');
			reqCodesList.push('MDN');
		}
	}
	if (extraReq[i].split(" ")[0] !== "Registration") {
	  reqList.push(extraReq[i]);
	}
  }
  return [reqCodesList, reqList];
}

function PullReview(index) {
	var thedept = deptList[index];
	console.log(('PCR Rev Spit: '+thedept));
	if (!thedept) {return;}
	request({
	// Get raw data
		uri: 'http://api.penncoursereview.com/v1/depts/'+thedept+'/reviews?token='+config.PCRToken 
	}, function(error, response, body) {
		console.log('Received');
		var deptReviews = JSON.parse(body).result.values;
		var resp = {};
		for(var rev in deptReviews) { if(deptReviews.hasOwnProperty(rev)) {
	  // Iterate through each review
			var sectionIDs = deptReviews[rev].section.aliases;
			for(var alias in sectionIDs) {
				if (sectionIDs[alias].split('-')[0] === thedept) {
		  // Only create an entry for the course in this department
					// Get data
					var courseNum = sectionIDs[alias].split('-')[1];
					var instID    = deptReviews[rev].instructor.id.replace('-', ' ').split(' ')[1].replace(/--/g, '. ').replace(/-/g, ' ');
					// var instName = deptReviews[rev].instructor.name;
					var courseQual = Number(deptReviews[rev].ratings.rCourseQuality);
					var courseDiff = Number(deptReviews[rev].ratings.rDifficulty);
					var courseInst = Number(deptReviews[rev].ratings.rInstructorQuality);

					if (typeof resp[courseNum] === 'undefined') {resp[courseNum] = {};}
					if (typeof resp[courseNum][instID] === 'undefined') {resp[courseNum][instID] = [];}
					var entry = resp[courseNum][instID];
					entry.push({
						'cQ': (courseQual || 0),
						'cD': (courseDiff || 0),
						'cI': (courseInst || 0)
					});
				}
			}
		}}
		/* This JSON has the following form (using MEAM 101 as an example)
		{
		   "MEAM 101": {
			 "1234-Fiene": [
			   {"cQ": 4, "cD": 3.9, "cI": 4},
			   {"cQ": 3.9, "cD": 4, "cI": 3.9}
			 ],
			 "4321-Wabiszewski": [
			   {"cQ": 4, "cD": 3.9, "cI": 4}
			 ]
		   }
		}
		*/
		// This part computes average values and replaces the full data
		for (var course in resp) { if (resp.hasOwnProperty(course)) {
			var courseSumQ = 0;
			var courseSumD = 0;
			var courseSumI = 0;
			var revcount = 0;
			for (var inst in resp[course]) { if (resp[course].hasOwnProperty(inst)) {
				var instSumQ = 0;
				var instSumD = 0;
				var instSumI = 0;
				for (var review in resp[course][inst]) { if (resp[course][inst].hasOwnProperty(review)) {
					var thisrev = resp[course][inst][review];
					instSumQ += thisrev.cQ;
					instSumD += thisrev.cD;
					instSumI += thisrev.cI;
					revcount++;
				}}
				// Get average ratings for each instructor for a given class
				var instAvgQual = Math.round(100 * instSumQ / resp[course][inst].length)/100;
				var instAvgDiff = Math.round(100 * instSumD / resp[course][inst].length)/100;
				var instAvgInst = Math.round(100 * instSumI / resp[course][inst].length)/100;
				resp[course][inst] = {
					'cQ': instAvgQual,
					'cD': instAvgDiff,
					'cI': instAvgInst
				};
				courseSumQ += instSumQ;
				courseSumD += instSumD;
				courseSumI += instSumI;
			}}
			if (!revcount) {revcount = 1;}
			// Get average of average instructor ratings for a given class
			var courseAvgQual = Math.round(100 * courseSumQ / revcount) /100;
			var courseAvgDiff = Math.round(100 * courseSumD / revcount) /100;
			var courseAvgInst = Math.round(100 * courseSumI / revcount) /100;
			resp[course].Total  = {
				'cQ': courseAvgQual,
				'cD': courseAvgDiff,
				'cI': courseAvgInst
			};
		}}
		// var finalResp = {};
		// finalResp[thedept] = resp;
		fs.writeFile('./2015CRev/'+thedept+'.json', JSON.stringify(resp), function (err) {
			if (err) {
				console.log(index+' '+thedept+' '+err);
			} else {
				console.log('It\'s saved! '+ index + ' ' + thedept);
			}
			// UploadToDB('2015ARevRaw', 'NewReviews', index);
			index++;
			if (index <= deptList.length && !limit) {
				PullReview(index);
			}
		});
	});
	return 0;
}