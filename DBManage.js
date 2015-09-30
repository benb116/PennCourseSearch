var fs = require('fs');
var request = require("request");
var mongojs = require("mongojs");
var config;
try {
	config = require('./config.js');
} catch (err) { // If there is no config file
	config = {};
	config.requestAB 	= process.env.REQUESTAB;
	config.requestAT 	= process.env.REQUESTAT;
	config.PCRToken 	= process.env.PCRTOKEN;
	// config.MongoUser 	= process.env.MONGOUSER;
	// config.MongoPass 	= process.env.MONGOPASS;
	// config.MongoURI 	= process.env.MONGOURI;
}

// Connect to database
// var db = mongojs('mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1', ["Students", "Courses2015C", "NewReviews"]);

var currentTerm = '2015C';
var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BE", "BENF", "BENG", "BEPP", "BFMD", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CINE", "CIS", "CIT", "CLST", "COGS", "COLL", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DOSP", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDCE", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEND", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OPIM", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PSYS", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VANB", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "WH", "WHCP", "WHG", "WRIT", "YDSH"];

var index = Number(process.argv[2]);
PullReview(index);
console.log('Done');

function PullRegistrar(index) {
	var thedept = deptList[index];
	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;

  request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT}
	}, function(error, response, body) {
		console.log('Received');
		var inJSON = JSON.parse(body).result_data; // Convert to JSON object

		var resp = {};
		for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) {
	    	// For each section that comes up
	    	// Get course name (e.g. CIS 120)

	    	if (!inJSON[key].is_cancelled) {
				var spacedName = inJSON[key].section_id_normalized
	            .replace('-', " ")
	            .split('-')[0]
	            .replace(/   /g, ' ')
	            .replace(/  /g, ' ');
				resp[spacedName] = {
					'courseListName': spacedName,
					'courseTitle': inJSON[key].course_title
				};
			}
			if (key == inJSON.length - 1) {
				// At the end of the list
				fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(resp), function (err) {
					// Write JSON to file
					// console.log(err)
					console.log(('List Spit: '+index+' '+thedept));
				});
			}
		}}
		index++;
		PullRegistrar(index);
	});
}

function PullReview(index) {
	var thedept = deptList[index];
	console.log(('PCR Rev Spit: '+thedept));
	request({
    // Get raw data
		uri: 'http://api.penncoursereview.com/v1/depts/'+thedept+'/reviews?token='+config.PCRToken 
	}, function(error, response, body) {
		console.log('Received');
		var deptReviews = JSON.parse(body).result.values;
		var resp = {};
		for(var rev in deptReviews) {
      // Iterate through each review
			var sectionIDs = deptReviews[rev].section.aliases;
			for(var alias in sectionIDs) {
				if (sectionIDs[alias].split('-')[0] == thedept) {
          // Only create an entry for the course in this department
					// Get data
					var courseID = sectionIDs[alias].split('-')[0] + ' ' + sectionIDs[alias].split('-')[1];
					var instID = deptReviews[rev].instructor.id;
					// var instName = deptReviews[rev].instructor.name;
					var courseQual = Number(deptReviews[rev].ratings.rCourseQuality);
					var courseDiff = Number(deptReviews[rev].ratings.rDifficulty);
					var courseInst = Number(deptReviews[rev].ratings.rInstructorQuality);

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

					if (typeof resp[courseID] === 'undefined') {resp[courseID] = {};}
					if (typeof resp[courseID][instID] === 'undefined') {resp[courseID][instID] = [];}
					var entry = resp[courseID][instID];
					entry.push({
						'cQ': courseQual,
						'cD': courseDiff,
						'cI': courseInst
					});
				}
			}
		}
		// This part computes average values and replaces the full data
		for (var course in resp) {
			var courseSumQ = 0;
			var courseSumD = 0;
			var courseSumI = 0;
			for (var inst in resp[course]) {
				var instSumQ = 0;
				var instSumD = 0;
				var instSumI = 0;
				for (var review in resp[course][inst]) {
					instSumQ += resp[course][inst][review].cQ;
					instSumD += resp[course][inst][review].cD;
					instSumI += resp[course][inst][review].cI;
				}
				// Get average ratings for each instructor for a given class
				var instAvgQual = Math.round(100 * instSumQ / resp[course][inst].length)/100;
				var instAvgDiff = Math.round(100 * instSumD / resp[course][inst].length)/100;
				var instAvgInst = Math.round(100 * instSumI / resp[course][inst].length)/100;
				resp[course][inst] = {
					'cQ': instAvgQual,
					'cD': instAvgDiff,
					'cI': instAvgInst
				};
				courseSumQ += instAvgQual;
				courseSumD += instAvgDiff;
				courseSumI += instAvgInst;
			}
			// Get average of average instructor ratings for a given class
			var courseAvgQual = Math.round(100 * courseSumQ / Object.keys(resp[course]).length)/100;
			var courseAvgDiff = Math.round(100 * courseSumD / Object.keys(resp[course]).length)/100;
			var courseAvgInst = Math.round(100 * courseSumI / Object.keys(resp[course]).length)/100;
			resp[course].Total  = {
				'cQ': courseAvgQual,
				'cD': courseAvgDiff,
				'cI': courseAvgInst
			};
		}
		fs.writeFile('./2015ARevRaw/'+thedept+'.json', JSON.stringify(resp), function (err) {
			console.log('It\'s saved! '+ index + ' ' + thedept);
			// UploadToDB('2015ARevRaw', 'NewReviews', index);
			index++;
			PullReview(index);
		});
	});
	return 0;
}

function UploadToDB(folder, thedb, index) {
	var thedept = deptList[index];
  // Get split data
	var rawJSON = JSON.parse(fs.readFileSync('./'+folder+'/'+thedept+'.json', 'utf8'));
	db.collection(thedb).find({Dept: thedept}, function(err, doc) {
    // Try to access the database
		if (doc.length === 0) {
			db.collection(thedb).save({'Dept': thedept, 'Reviews': {}});
		}
    // Add a schedules block if there is none
		db.collection(thedb).update({Dept: thedept}, { $set: {Reviews: rawJSON}, $currentDate: { lastModified: true }}, function(err, doc) {
			console.log('It\'s saved! ' + thedept);
		});
	});
	return 0;
}

function Match(index) {
	var thedept = deptList[index];
  // Get split data
	var dept = JSON.parse(fs.readFileSync('./'+currentTerm+'/'+thedept+'.json', 'utf8'));
  // Get PCR data
	var deptrev = JSON.parse(fs.readFileSync('./2015ARev/'+thedept+'.json', 'utf8'));
	for (var course in dept) {
    // Go through each course
		if (typeof deptrev[course] !== 'undefined') {
			var sum = 0;
			for (var i = 0; i < deptrev[course].length; i++) {
        // Go through each section in the courses PCR data and sum the values
				sum += Number(deptrev[course][i].Rating);
			}
			if (deptrev[course].length !== 0) {
        // Average the values and add to the spit data
				dept[course].PCR = Math.floor(100*sum/deptrev[course].length)/100;
			}
		}
	}
	fs.writeFile('./'+currentTerm+'Full/'+thedept+'.json', JSON.stringify(dept), function (err) {
		console.log('It\'s saved! '+ index + ' ' + thedept);
		// UploadToDB('2015ARevRaw', 'NewReviews', index);
		index++;
		PullReview(index);
	});
	// db.collection('Courses'+currentTerm).find({Dept: thedept}, function(err, doc) {
 //    // Try to access the database
	// 	if (doc.length === 0) {
	// 		db.collection('Courses'+currentTerm).save({'Dept': thedept});
	// 	}
 //    // Add a schedules block if there is none
	// 	db.collection('Courses'+currentTerm).update({Dept: thedept}, { $set: {Courses: dept}, $currentDate: { lastModified: true }});
	// 	index++;
	// 	PullReview(index);
	// });
}
