/*
    Main script for automating data scraping.
    Used with the OpenData API for registrar requests (in conjunction with opendata.js),
    as well as with the PCR API.

    Run as a script like so:

    node DBManage.js registrar MEAM // Run for a single department
    node DBManage.js registrar 0 30 // Run for a set of depts by index
    node DBManage.js registrar 50 // Run for all depts starting at index
    node DBManage.js review CIS
*/

var request = require("request");
var fs = require("fs");

var config;
try {
    config = require('../config.js');
} catch (err) { // If there is no config file
    config = {};
    config.requestAB2 = process.env.REQUESTAB2;
    config.requestAT2 = process.env.REQUESTAT2;
    config.PCRToken   = process.env.PCRTOKEN;
}

var currentTerm = '2018A';
var currentRev = '2016CRev';
var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BDS", "BE", "BENF", "BENG", "BEPP", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BMIN", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CIMS", "CIS", "CIT", "CLST", "COGS", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DPED", "DPRD", "DRST", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCIN", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LAWM", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OIDD", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "VPTH", "WH", "WHCP", "WHG", "WRIT", "YDSH"];
var maxIndex = deptList.length;

var parse = require('../parse.js');
var opendata = require('../opendata.js')(config.requestAB2, config.requestAT2, config.IFTTTKey);
var lastRequestTime = 0;

var source = process.argv[2].toLowerCase(); // registrar or review
var index = Number(process.argv[3]); // Can be a number or a dept code
var endindex;
try {
    endindex = Number(process.argv[4]) + 1; // If there's a second number, end at that number
} catch(err) {}
var limit = false;
if (isNaN(index)) { // If we're doing a specific department (not a number, but rather a deptcode)
    limit = 1;
    index = deptList.indexOf(process.argv[3].toUpperCase());
}
if (isNaN(endindex)) { // If there is a first number but not a second, run to the end
    endindex = maxIndex;
}

var thedept
if (source === 'registrar') {
    if (limit) {
        thedept = deptList[index];
        PullRegistrar(thedept); // Single dept
    } else {
        for (var i = index; i < endindex; i++) {
            thedept = deptList[i];
            PullRegistrar(thedept);
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

function PullRegistrar(thedept) {
    console.log('Start', thedept)
    // Send the request
    var baseURL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=400&term='+currentTerm+'&course_id='+thedept;
    if (!thedept) {return;}

    lastRequestTime = opendata.RateLimitReq(baseURL, 'registrar', null, lastRequestTime, 1);
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
                    for (var review in resp[course].Recent.revs) {if (resp[course].Recent.revs.hasOwnProperty(review)) {
                        var thisrev = resp[course].Recent.revs[review];
                        recentQ += thisrev.cQ;
                        recentD += thisrev.cD;
                        recentI += thisrev.cI;
                        recentrevcount++;
                    }}
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

        fs.writeFile('../Data/'+currentRev+'/'+thedept+'.json', JSON.stringify(resp), function (err) {
            if (err) {
                console.log(index+' '+thedept+' '+err);
            } else {
                console.log('It\'s saved! '+ index + ' ' + thedept);
            }
        });
    });
    return 0;
}