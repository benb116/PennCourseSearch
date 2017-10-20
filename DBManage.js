var fs = require('fs');
var request = require("request");

var config;
try {
	config = require('./config.js');
} catch (err) { // If there is no config file
	config = {};
	config.requestAB 	= process.env.REQUESTAB;
	config.requestAT 	= process.env.REQUESTAT;
	config.PCRToken 	= process.env.PCRTOKEN;
}

var currentTerm = '2018A';
var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BDS", "BE", "BENF", "BENG", "BEPP", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BMIN", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CIMS", "CIS", "CIT", "CLST", "COGS", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DPED", "DPRD", "DRST", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCIN", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LAWM", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OIDD", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "VPTH", "WH", "WHCP", "WHG", "WRIT", "YDSH"];
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
	Cultural: "MC2",
	WGLO: "Global Environment",
	WSST: "Social Structures",
	WSAT: "Science and Technology",
	WLAC: "Language, Arts & Culture",
	EMAT: "SEAS - Math",
	ESCI: "SEAS - Natural Science",
	EENG: "SEAS - Engineering",
	ESSC: "SEAS - Social Sciences",
	EHUM: "SEAS - Humanities",
	ETBS: "SEAS - Technology, Business, and Society",
	EWRT: "SEAS - Writing",
	ENOC: "SEAS - No Credit"
};

var WhartonReq = require('./wharreq.json');
var EngineerReq = require('./engreq.json');

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
} else if (source === "wharton") {
	CollectWharton();
}
return "done";

function PullRegistrar(index) {
	var thedept = deptList[index];
	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;
	if (!thedept) {return;}
	request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT}
	}, function(error, response, body) {
		console.log('Received', thedept);
		console.time('go');
		if (!error && body) {
			var inJSON = JSON.parse(body).result_data; // Convert to JSON object

			var resp = {};
			for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) {
				// For each section that comes up
				// Get course name (e.g. CIS 120)
				var thisKey = inJSON[key];
				var idSpaced = thisKey.course_department + ' ' + thisKey.course_number;
				var numCred = Number(thisKey.credits.split(" ")[0]);

				if (!thisKey.is_cancelled) {
					if (!resp[idSpaced]) {
						var reqCodesList = GetRequirements(thisKey)[0];
						var idDashed = idSpaced.replace(' ', '-');
						resp[idSpaced] = {
							'idDashed': idDashed,
							'idSpaced': idSpaced,
							'courseTitle': thisKey.course_title,
							'courseReqs': reqCodesList,
							'courseCred': numCred
						};
					} else if (resp[idSpaced].courseCred < numCred) {
						resp[idSpaced].courseCred = numCred
					}
				}
			}}
			var arrResp = [];
			for (key in resp) { if (resp.hasOwnProperty(key)) {
				arrResp.push(resp[key]);
			}}
			// At the end of the list
			fs.writeFile('./Data/'+currentTerm+'/'+thedept+'.json', JSON.stringify(arrResp), function (err) {
				// Write JSON to file
				if (err) {
					console.log(index+' '+thedept+' '+err);
				} else {
					console.log(('List Spit: '+index+' '+thedept));
				}
			});
		} else {
			console.log('request error: ' + thedept);
		}
	});
}

function GetRequirements(section) {
	var idDashed = (section.course_department + '-' + section.course_number);

	var reqList = section.fulfills_college_requirements; // Pull standard college requirements
	var reqCodesList = []; 
	try {
		reqCodesList[0] = reqCodes[reqList[0].split(" ")[0]];  // Generate the req codes
		reqCodesList[1] = reqCodes[reqList[1].split(" ")[0]];
	} catch(err) {}

	var extraReq = section.important_notes; // Sometimes there are extra college requirements cause why not
	var extraReqCode;
	for (var i = 0; i < extraReq.length; i++) { // Run through each one
		extraReqCode = reqCodes[extraReq[i].split(" ")[0]];
		if (extraReqCode === 'MDO' || extraReqCode === 'MDN') { // If it matches humanities or natural science
		  // reqList.push(extraReq[i]);
		 	reqCodesList.push(extraReqCode);
		} else if (section.requirements[0]) {
			if (section.requirements[0].registration_control_code === 'MDB') { // Both?
				reqCodesList.push('MDO');
				reqCodesList.push('MDN');
			}
		}
		if (extraReq[i].split(" ")[0] !== "Registration") { // Other notes that are not about "registration for associated"
		  reqList.push(extraReq[i]);
		}
	}

	try {
		var this_GED = WhartonReq[idDashed].GED; // Pull the courses wharton requirement if it has one
		reqCodesList.push(this_GED);
		reqList.push(reqCodes[this_GED]);
	} catch (err) {}
	try {
		if (WhartonReq[idDashed].global) { // Check if it also applies to wharton global requirement
			reqCodesList.push("WGLO");
		reqList.push(reqCodes.WGLO);
		}
	} catch (err) {}

	engReturn = EngReqRules(section.course_department, section.course_number);
	reqCodesList = reqCodesList.concat(engReturn[0]);
	reqList = reqList.concat(engReturn[1]);
	return [reqCodesList, reqList];
}

function EngReqRules(dept, num) {
	// If the course has it's own definition
	var engreqCodesList = [];
	var engreqList = [];
	var thisEngObj = {};
	// Get the departmental rules first
	if (EngineerReq[dept]) {
		// Check math
		if (EngineerReq[dept].math) {
			if (dept != 'MATH' || (dept == 'MATH' && Number(num) >= 104)) { // Only math classes >= 104 count
				thisEngObj.math = true;
			}
		}
		// Check natsci
		if (EngineerReq[dept].natsci) {
			if ((['BIOL', 'GEOL', 'PHYS'].indexOf(dept) < 0)||
				(dept == 'BIOL' && Number(num) > 100)		|| 	// Only Biol classes > 100
				(dept == 'GEOL' && Number(num) > 200)		|| 	// Only Geol classes > 200
				(dept == 'PHYS' && Number(num) >=150)) {		// Only Phys classes >=150
				thisEngObj.natsci = true;
			}
		}
		// Check Engineering
		if (EngineerReq[dept].eng) {
			if (num != '296' && num != '297') { // No engineering classes with num 296 or 297
				thisEngObj.eng = true;
			}
		}
		if (EngineerReq[dept].ss) {
			if (Number(num) < 500) { // No 500-level ss classes count
				thisEngObj.ss = true;
			}
		}
		if (EngineerReq[dept].hum) {
			if (Number(num) < 500) { // No 500-level ss classes count
				thisEngObj.hum = true;
			}
		}
		if (EngineerReq[dept].tbs) {
			thisEngObj.tbs = true;
		}
		if (EngineerReq[dept].nocred) {
			if ((dept == 'PHYS' && Number(num) < 140) || (dept == 'STAT' && Number(num) < 430)) {
				thisEngObj.nocred = true;
			}
		}
	}
	specificReq = (EngineerReq[dept+'-'+num] || {});
	if (EngineerReq[dept+'-'+num]) {
		if (specificReq.hasOwnProperty('math'))	{thisEngObj.math 	= specificReq.math;}
		if (specificReq.hasOwnProperty('natsci'))	{thisEngObj.natsci 	= specificReq.natsci;}
		if (specificReq.hasOwnProperty('eng'))	{thisEngObj.eng 	= specificReq.eng}
		if (specificReq.hasOwnProperty('ss'))		{thisEngObj.ss 		= specificReq.ss;}
		if (specificReq.hasOwnProperty('hum')) 	{thisEngObj.hum 	= specificReq.hum;}
		if (specificReq.hasOwnProperty('tbs')) 	{thisEngObj.tbs 	= specificReq.tbs;}
		if (specificReq.hasOwnProperty('writ')) 	{thisEngObj.writ 	= true;}
		if (specificReq.hasOwnProperty('nocred'))	{thisEngObj.nocred 	= specificReq.nocred;}
	}
	// tbs classes don't count for engineering
	if (thisEngObj.tbs) {thisEngObj.eng = false;}

	if (thisEngObj.math) 	{engreqCodesList.push('EMAT'); engreqList.push(reqCodes['EMAT']);}
	if (thisEngObj.natsci) 	{engreqCodesList.push('ESCI'); engreqList.push(reqCodes['ESCI']);}
	if (thisEngObj.eng) 	{engreqCodesList.push('EENG'); engreqList.push(reqCodes['EENG']);}
	if (thisEngObj.ss) 		{engreqCodesList.push('ESSC'); engreqList.push(reqCodes['ESSC']);}
	if (thisEngObj.hum) 	{engreqCodesList.push('EHUM'); engreqList.push(reqCodes['EHUM']);}
	if (thisEngObj.tbs) 	{engreqCodesList.push('ETBS'); engreqList.push(reqCodes['ETBS']);}
	if (thisEngObj.writ) 	{engreqCodesList.push('EWRT'); engreqList.push(reqCodes['EWRT']);}
	if (thisEngObj.nocred) 	{engreqCodesList.push('ENOC'); engreqList.push(reqCodes['ENOC']);}

	return [engreqCodesList, engreqList];
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
				if (sectionIDs[alias].split('-')[0] === thedept) { // Only create an entry for the course in this department
					// Get data
					var courseNum = sectionIDs[alias].split('-')[1];
					var instID    = deptReviews[rev].instructor.id.replace('-', ' ').split(' ')[1].replace(/--/g, '. ').replace(/-/g, ' ');
					// var instName = deptReviews[rev].instructor.name;
					var courseQual = Number(deptReviews[rev].ratings.rCourseQuality);
					var courseDiff = Number(deptReviews[rev].ratings.rDifficulty);
					var courseInst = Number(deptReviews[rev].ratings.rInstructorQuality);

					var revID = Number(deptReviews[rev].id.split("-")[0]);

					if (typeof resp[courseNum] === 'undefined') {resp[courseNum] = {};}
					if (typeof resp[courseNum][instID] === 'undefined') {resp[courseNum][instID] = [];}
					var entry = resp[courseNum][instID];
					entry.push({
						'cQ': (courseQual || 0),
						'cD': (courseDiff || 0),
						'cI': (courseInst || 0)
					});
					if (typeof resp[courseNum].Recent === 'undefined') {resp[courseNum].Recent = {'lastrev': 0, 'revs': []};}
					if (resp[courseNum].Recent.lastrev < revID) {
						resp[courseNum].Recent.lastrev = revID;
						resp[courseNum].Recent.revs = [];
					}
					if (resp[courseNum].Recent.lastrev <= revID) {
						resp[courseNum].Recent.revs.push({
							'cQ': (courseQual || 0),
							'cD': (courseDiff || 0),
							'cI': (courseInst || 0)
						});
					}
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
			var recentQ = 0;
			var recentD = 0;
			var recentI = 0;
			var recentrevcount = 0;
			for (var inst in resp[course]) { if (resp[course].hasOwnProperty(inst)) {
				if (inst !== 'Recent') {
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
				} else {
					for (var review in resp[course].Recent.revs) {
						var thisrev = resp[course].Recent.revs[review];
						recentQ += thisrev.cQ;
						recentD += thisrev.cD;
						recentI += thisrev.cI;
						recentrevcount++;
					}
				}
			}}
			if (!revcount) {revcount = 1;}
			if (!recentrevcount) {recentrevcount = 1;}
			// Get average of average instructor ratings for a given class
			var courseAvgQual = Math.round(100 * courseSumQ / revcount) /100;
			var courseAvgDiff = Math.round(100 * courseSumD / revcount) /100;
			var courseAvgInst = Math.round(100 * courseSumI / revcount) /100;
			resp[course].Total  = {
				'cQ': courseAvgQual,
				'cD': courseAvgDiff,
				'cI': courseAvgInst
			};
			var recentAvgQual = Math.round(100 * recentQ / recentrevcount) /100;
			var recentAvgDiff = Math.round(100 * recentD / recentrevcount) /100;
			var recentAvgInst = Math.round(100 * recentI / recentrevcount) /100;
			resp[course].Recent  = {
				'cQ': recentAvgQual,
				'cD': recentAvgDiff,
				'cI': recentAvgInst
			};
		}}

		fs.writeFile('./Data/2016CRev/'+thedept+'.json', JSON.stringify(resp), function (err) {
			if (err) {
				console.log(index+' '+thedept+' '+err);
			} else {
				console.log('It\'s saved! '+ index + ' ' + thedept);
			}
		});
	});
	return 0;
}

function CollectWharton() {
	var wharResp = {};
	for (var i = 0; i < deptList.length; i++) {
		// console.log(i)
		var thisdept = deptList[i];
		fs.readFile('./Data/' + currentTerm + '/' + thisdept + '.json', 'utf8', function(err, contents) {
			if (!err) {
				var deptJSON = JSON.parse(contents);
				// var deptJSON = deptJSON[0];
				for (var key in deptJSON) {
					var thisCourse = deptJSON[key];
					if (thisCourse.courseReqs) {
						var lastreq = thisCourse.courseReqs[thisCourse.courseReqs.length-1];
						if (lastreq && lastreq.charAt(0) === "W") {
							wharResp[thisCourse.idSpaced] = {
								'idDashed': thisCourse.idDashed,
								'idSpaced': thisCourse.idSpaced,
								'courseTitle': thisCourse.courseTitle,
								'courseReqs': thisCourse.courseReqs,
								'courseCred': thisCourse.courseCred
							};
							index++;
						}
					}
					if (thisCourse.idDashed.split('-')[0] === deptList[deptList.length-1]) {
						var arrResp = [];
						for (key in wharResp) { if (wharResp.hasOwnProperty(key)) {
							arrResp.push(wharResp[key]);
						}}
						fs.writeFile('./Data/'+currentTerm+'/WHAR.json', JSON.stringify(arrResp), function (err) {
							if (err) {
								console.log("Wharton error: " + err);
							}
						});
					}
				}
			}
		});
	}
}

function CollectEngineering() {
	var engResp = {};
	for (var i = 0; i < deptList.length; i++) {
		var thisdept = deptList[i];
		fs.readFile('./Data/' + currentTerm + '/' + thisdept + '.json', 'utf8', function(err, contents) {
			if (!err) {
				var deptJSON = JSON.parse(contents);
				for (var key in deptJSON) {
					var thisCourse = deptJSON[key];
					if (thisCourse.courseReqs) {
						var lastreq = thisCourse.courseReqs[thisCourse.courseReqs.length-1];
						if (lastreq && lastreq.charAt(0) === "W") {
							wharResp[thisCourse.idSpaced] = {
								'idDashed': thisCourse.idDashed,
								'idSpaced': thisCourse.idSpaced,
								'courseTitle': thisCourse.courseTitle,
								'courseReqs': thisCourse.courseReqs,
								'courseCred': thisCourse.courseCred
							};
							index++;
						}
					}
					if (thisCourse.idDashed.split('-')[0] === deptList[deptList.length-1]) {
						var arrResp = [];
						for (key in wharResp) { if (wharResp.hasOwnProperty(key)) {
							arrResp.push(wharResp[key]);
						}}
						fs.writeFile('./Data/'+currentTerm+'/WHAR.json', JSON.stringify(arrResp), function (err) {
							if (err) {
								console.log("Wharton error: " + err);
							}
						});
					}
				}
			}
		});
	}
}