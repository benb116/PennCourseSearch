var path        = require('path');
var request     = require('request');
var express     = require('express');
var compression = require('compression');

var config;
try {
    config = require('./config.js');
} catch (err) { // If there is no config file
    config = {};
    config.requestAB      = process.env.REQUESTAB;
    config.requestAT      = process.env.REQUESTAT;
    config.PCRToken          = process.env.PCRTOKEN;
    config.KeenIOID          = process.env.KEEN_PROJECT_ID;
    config.KeenIOWriteKey = process.env.KEEN_WRITE_KEY;
    config.autotestKey    = process.env.AUTOTESTKEY;
}


var app = express();

// Set express settings
app.use(compression());
app.use('/js/plugins', express.static(path.join(__dirname, 'public/js/plugins'), { maxAge: 2628000000 }));
app.use('/js', express.static(path.join(__dirname, 'public/js'), { maxAge: 0 }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 2628000000 }));

console.log('Express initialized');

// Start the server
app.listen(process.env.PORT || 3001, function(){
    console.log("Node app is running. Better go catch it.");
});

// Handle main page requests
app.get('/auto/', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/auto.html'));
});

// Handle main page requests
app.get('/auto/request', function(req, res) {
    console.log(req.query.course)
    var courses = req.query.course;
    // console.log();
    return res.send(autoSched(courses, res));
});

var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BDS", "BE", "BENF", "BENG", "BEPP", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BMIN", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CIMS", "CIS", "CIT", "CLST", "COGS", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DPED", "DPRD", "DRST", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCIN", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LAWM", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OIDD", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "VPTH", "WH", "WHCP", "WHG", "WRIT", "YDSH"];

var meetData = [];
for (var dept in deptList) { if (deptList.hasOwnProperty(dept)) {
    try {
        var thedept = deptList[dept];
        var meetData = meetData.concat(Object.values(require('./Data/2018AMeet/'+thedept+'.json')));
    } catch(err) {
        
    }
}}
var toAdd = meetData.filter(function(sec) {
    return sec.course === 'MEAM-101';
});

// var args = process.argv;
var courses = ['cis-110', 'meam-348','cis-120', 'math114', 'econ001', 'chem102', 'meam545', 'meam101', 'meam201', 'psyc001'];

// autoSched(courses)

function autoSched(courses, res) {
    var allData = [];
    for (var i = 0; i < courses.length; i++) {
        var thisc = FormatID(courses[i]);
        courses[i] = thisc[0] + '-' + thisc[1];
        var toAdd = meetData.filter(function(sec) {
            return sec.course === courses[i];
        });
        allData = allData.concat(toAdd)
    }
    return run(allData)
}

function run(allData) {
    var coursesAdded = [];
    var datasched = {};
    allData.forEach(function(thissect) {
        if (thissect.open) {
            var thiscourseact = thissect.course + '-' + thissect.actType
            // console.log(thiscourseact)
            if (!datasched[thiscourseact]) {
                datasched[thiscourseact] = []
            }
            datasched[thiscourseact].push(thissect);
        }
    })
    var d, twodarr
    d = regenData(datasched);
    raw_twodarr = d[0];
    raw_datasched = d[1];

    raw_types = raw_twodarr.map(function(a) {
        return a[0];
    })    

    var typekey = ['LEC', 'LAB', 'REC'];

    datasched = raw_datasched;
    twodarr = raw_twodarr;
    types = raw_types;

    for (var h = 0; h < raw_types.length; h++) {
        

        var anchor = datasched[types[h]][0];
        if (!anchor) {
            console.log('noanch', types[h])
        }
        console.log(types[h])

        d = regenData(datasched);
        twodarr = d[0];
        datasched = d[1];
        typeNumObj = d[2];
        var hold; 

        for (var i = h+1; i < twodarr.length; i++) {
            indtorem = CompareAnchorToType(i);

            if (indtorem.length === twodarr[i][1]) { // No sections work with this anchor, move to next anchor index and try again.
                // anchorind++;
                console.log('full', types[h])
                datasched[types[h]].splice(0, 1);
                i = twodarr.length;
                h--;
                hold = true;
            } else {


                var typeToRem = raw_twodarr[i][0];
                datasched[typeToRem] = datasched[typeToRem].filter(function(a,e) {
                    return !(indtorem.indexOf(e) > -1)
                })
                RemoveNonAsscSections(anchor);

                d = regenData(datasched);
                twodarr = d[0];
                datasched = d[1];
            }

        }
        if (hold) {
            hold = false;
        } else {
            coursesAdded.push(anchor.idDashed)
        }
    }
    console.log(coursesAdded)
    return coursesAdded

    function CompareAnchorToType(i) {
        var indtorem = []
        var type = raw_twodarr[i][0];
        var numoftype = typeNumObj[type];
        for (var j = 0; j < numoftype; j++) {
            var ameet = datasched[type][j];
            if (ameet) {
                if (anchor.course !== ameet.course) {
                    var isover = Overlap(ameet, anchor)
                    if (isover) {
                        console.log('conflict', ameet.idDashed)
                        indtorem.push(j);
                    }
                }
            }
        }
        return indtorem;
    }

    function RemoveNonAsscSections(anchor) {
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
    }
}

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
    });

    typeNumObj = {};
    for (var i = 0; i < twodarr.length; i++) {
        typeNumObj[twodarr[i][0]] = twodarr[i][1];
    }
    return [twodarr, datasched, typeNumObj];
}

function Overlap(block1, block2) {
    // console.log(block1)
    var meet1 = block1.meetblk;
    var meet2 = block2.meetblk;
    var over = false;
    for (var i = 0; i < meet1.length; i++) {
        for (var j = 0; j < meet2.length; j++) {
            // console.log(1, meet1[i])
            // console.log(2, meet2[j])
            if (meet1[i].meetday === meet2[j].meetday) {
                var over = check(meet1[i], meet2[j]);
                if (over) {return over;}
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
            method: "GET",headers: {"Authorization-Bearer": config.requestAB2, "Authorization-Token": config.requestAT2}, // Send authorization headers
        }, function(err, res, body) {
            if (err) { return reject(err); }
            return resolve([res, body]);
        });
    });
}

function SchedClean(sec) {
    var isOpen = (sec.course_status !== 'X') && (Number(sec.course_number) < 600);
    var thisInfo = {
        'idDashed': sec.course_department + '-' + sec.course_number + '-' + sec.section_number,
        'course': sec.course_department + '-' + sec.course_number,
        'actType': sec.activity,
        'assclec': sec.lectures,
        'assclab': sec.labs,
        'asscrec': sec.recitations,
        'meetblk': [],
        'open': isOpen
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
        retArr[0] = searchParam.substr(0, n).toUpperCase();
        retArr[1] = searchParam.substr(n, 3);
        retArr[2] = searchParam.substr(n+3, 3);
    }
    
    return retArr;
}