var fs 			= require('fs');
var request 	= require("request");
var mongojs 	= require("mongojs");
try {
	var config = require('./config.js');
} catch (err) { // If there is no config file
	var config = {};
	config.requestAB 				= process.env.REQUESTAB;
	config.requestAT 				= process.env.REQUESTAT;
	config.PCRToken 				= process.env.PCRTOKEN;
	config.MongoUser 				= process.env.MONGOUSER;
	config.MongoPass 				= process.env.MONGOPASS;
	config.MongoURI 				= process.env.MONGOURI;
}

// Connect to database
var uri = 'mongodb://'+config.MongoUser+':'+config.MongoPass+'@'+config.MongoURI+'/pcs1',
		db = mongojs.connect(uri, ["Students", "Courses2015C", "Reviews"]);

var currentTerm = '2015C';
var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BE", "BENG", "BEPP", "BFMD", "BIBB", "BIOE", "BIOL", "BMB", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CINE", "CIS", "CIT", "CLST", "COGS", "COLL", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "FRSM", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTR", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LGIC", "LGST", "LING", "LSMP", "MAPP", "MATH", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NURS", "OPIM", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TCOM", "TELU", "THAR", "TURK", "URBS", "URDU", "VIPR", "VLST", "WH", "WHCP", "WRIT", "YDSH"];

// Get Reviews by dept
// for (var deptnum in deptList) { if (deptnum < 3) {
var index = 0;
PullRegistrar(index);
// PullReview(index);

function PullRegistrar(index) {
	var thedept = deptList[index];
	var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;

    request({
		uri: baseURL,
		method: "GET",headers: {"Authorization-Bearer": config.requestAB, "Authorization-Token": config.requestAT},
		}, function(error, response, body) {
			console.log('Received');
			var inJSON = JSON.parse(body).result_data; // Convert to JSON object
		
			var resp = {};
			for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) { // For each section that comes up

				var spacedName = inJSON[key].section_id_normalized.replace('-', " ").split('-')[0].replace(/   /g, ' ').replace(/  /g, ' '); // Get course name (e.g. CIS 120)
				var thetitle = inJSON[key].course_title; // Get title
				resp[spacedName] = {'courseListName': spacedName, 'courseTitle': thetitle};
				if (key == inJSON.length - 1) { // At the end of the list
					fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(resp), function (err) { // Write JSON to file
						console.log(('List Spit: '+thedept));
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
		uri: 'http://api.penncoursereview.com/v1/depts/'+thedept+'/reviews?token='+config.PCRToken // Get raw data
	}, function(error, response, body) {
		console.log('Received');
		var deptReviews = JSON.parse(body).result.values;
		var resp = {};
		for(var rev in deptReviews) { // Iterate through each review
			var sectionIDs = deptReviews[rev].section.aliases;
			for(var alias in sectionIDs) {
				if (sectionIDs[alias].split('-')[0] == thedept) { // 
					var course = sectionIDs[alias].replace('-', " ").split('-')[0];
					var reviewID = deptReviews[rev].section.id.split('-')[0];
					var instructorID = deptReviews[rev].instructor.id;
					var PCRRating = deptReviews[rev].ratings.rCourseQuality;
					
					// Put the data in the 'resp' JSON Object
					if (!(resp.hasOwnProperty(course))) {
						resp[course] = [{'revID': 0}];
					}
					oldestID = Number(resp[course][0].revID);
					if (reviewID > oldestID) { // We only want the most recent reviews, so a new review ID should overwrite all previous review values
						resp[course] = [{
							'InstID': instructorID,
							'revID': reviewID,
							'Rating': PCRRating
						}];
					} else if (reviewID == oldestID) { // If there are multiple values from the same review ID, we want to keep them all to average later
						resp[course].push({
							'InstID': instructorID,
							'revID': reviewID,
							'Rating': PCRRating
						});
					}
				}
			}
			if (rev == Object.keys(deptReviews).length - 1) {
				// fs.writeFile('./2015ARev/'+thedept+'.json', JSON.stringify(resp), function (err) {
				// 	if (err) throw err;
				// 	console.log('It\'s saved!');
					
				// });

				db.collection('Reviews').find({Dept: thedept}, function(err, doc) { // Try to access the database
					if (doc.length === 0) {
						db.collection('Reviews').save({'Dept': thedept, 'Courses': {}});
					}
					db.collection('Reviews').update({Dept: thedept}, { $set: {Courses: resp}, $currentDate: { lastModified: true }}, function(err, doc) {
						console.log('It\'s saved!' + thedept);
						index++;
						PullReview(index);
					}); // Add a schedules block if there is none
				});
			}
		}
	});
}

function Match(index) {
	var thedept = deptList[index];
	var dept = JSON.parse(fs.readFileSync('./'+currentTerm+'/'+thedept+'.json', 'utf8')); // Get spit data
	var deptrev = JSON.parse(fs.readFileSync('./2015ARev/'+thedept+'.json', 'utf8')); // Get PCR data
	for (var course in dept) { // Go through each course
		if (typeof deptrev[course] !== 'undefined') {
			sum = 0;
			for (var i = 0; i < deptrev[course].length; i++) { // Go through each section in the courses PCR data and sum the values
				sum += Number(deptrev[course][i].Rating);
			}
			if (deptrev[course].length !== 0) {
				dept[course].PCR = Math.floor(100*sum/deptrev[course].length)/100; // Average the values and add to the spit data
			}
		}
	}
	db.collection('Courses'+currentTerm).find({Dept: thedept}, function(err, doc) { // Try to access the database
		if (doc.length === 0) {
			db.collection('Courses'+currentTerm).save({'Dept': thedept});
		}
		db.collection('Courses'+currentTerm).update({Dept: thedept}, { $set: {Courses: dept}, $currentDate: { lastModified: true }}); // Add a schedules block if there is none
		index++;
		PullReview(index);
	});

	// fs.writeFile('./'+currentTerm+'/'+thedept+'.json', JSON.stringify(dept), function (err) { // Overwrite the old spit data with the new spit data
	// 	console.log('Matched: '+thedept);
	// });

}