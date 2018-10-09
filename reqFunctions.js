var requirements = {};

var WhartonReq = require('./DB/wharreq.json');
var EngineerReq = require('./DB/engreq.json');

var collegeCodes = {
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

// The requirement code -> name map
var reqCodes = {
    MDS: "Society Sector",
    MDH: "History & Tradition Sector",
    MDA: "Arts & Letters Sector",
    MDO: "Humanities & Social Science Sector",
    MDL: "Living World Sector",
    MDP: "Physical World Sector",
    MDN: "Natural Science & Math Sector",
    MWC: "Writing Requirement",
    MQS: "College Quantitative Data Analysis Req.",
    MFR: "Formal Reasoning Course",
    MC1: "Cross Cultural Analysis",
    MC2: "Cultural Diversity in the US",
    WGLO: "Wharton - Global Environment",
    WSST: "Wharton - Social Structures",
    WSAT: "Wharton - Science and Technology",
    WLAC: "Wharton - Language, Arts & Culture",
    WNHR: "Wharton 2017 - Humanities",
    WNNS: "Wharton 2017 - Natural Science",
    WNSS: "Wharton 2017 - Social Structures",
    WNFR: "Wharton 2017 - Flexible",
    WURE: "Wharton 2017 - Unrestricted Elective",
    WNSA: "Wharton 2017 - See Advisor",
    WCCY: "Wharton 2017 - Cross-Cultural Perspectives",
    WCCS: "Wharton 2017 - CCP See Advisor",
    WCCC: "Wharton 2017 - CCP CDUS",
    EMAT: "SEAS - Math",
    ESCI: "SEAS - Natural Science",
    EENG: "SEAS - Engineering",
    ESSC: "SEAS - Social Sciences",
    EHUM: "SEAS - Humanities",
    ETBS: "SEAS - Technology, Business, and Society",
    EWRT: "SEAS - Writing",
    ENOC: "SEAS - No Credit"
};

requirements.GetRequirements = function(section) {
    var idDashed = (section.course_department + '-' + section.course_number);

    var reqList = section.fulfills_college_requirements; // Pull standard college requirements
    var reqCodesList = []; 
    if (reqList[0]) {
        reqCodesList[0] = collegeCodes[reqList[0].split(" ")[0]];  // Generate the req codes
    }
    if (reqList[1]) {
        reqCodesList[1] = collegeCodes[reqList[1].split(" ")[0]];
    }

    var extraReq = section.important_notes; // Sometimes there are extra college requirements cause why not
    var extraReqCode;
    for (var i = 0; i < extraReq.length; i++) { // Run through each one
        extraReqCode = collegeCodes[extraReq[i].split(" ")[0]];
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

    if (WhartonReq[idDashed]) {
        var rules = Object.keys(WhartonReq[idDashed]);
        for (var r in rules) {
            if (WhartonReq[idDashed][rules[r]]) {
                var thisval = WhartonReq[idDashed][rules[r]]; // Pull the course's wharton requirement if it has one
                reqCodesList.push(thisval);
                reqList.push(reqCodes[thisval]);
            }
        }
    }

    engReturn = EngReqRules(section.course_department, section.course_number, section.crosslistings[0]);
    reqCodesList = reqCodesList.concat(engReturn[0]);
    reqList = reqList.concat(engReturn[1]);
    return [reqCodesList, reqList];
};

function EngReqRules(dept, num, cross) {
    var engreqCodesList = [];
    var engreqList = [];
    var thisEngObj = {};
    // Get the departmental rules first
    if (EngineerReq[dept]) {
        // Check math
        if (EngineerReq[dept].math) {
            if (dept !== 'MATH' || (dept === 'MATH' && Number(num) >= 104)) { // Only math classes >= 104 count
                thisEngObj.math = true;
            }
        }
        // Check natsci
        if (EngineerReq[dept].natsci) {
            if ((['BIOL', 'GEOL', 'PHYS'].indexOf(dept) < 0) ||     // No restrictions on other departments
                (dept === 'BIOL' && Number(num) > 100)       ||     // Only Biol classes > 100
                (dept === 'GEOL' && Number(num) > 200)       ||     // Only Geol classes > 200
                (dept === 'PHYS' && Number(num) >=150)) {           // Only Phys classes >=150
                thisEngObj.natsci = true;
            }
        }
        // Check Engineering
        if (EngineerReq[dept].eng) {
            if (num !== '296' && num !== '297' && num < 600) { // No engineering classes with num 296 or 297 and not necessarily 600 level
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
            if ((dept === 'PHYS' && Number(num) < 140) || (dept === 'STAT' && Number(num) < 430)) {
                thisEngObj.nocred = true;
            }
        }
    }
    specificReq = (EngineerReq[dept+'-'+num] || {});
    thisEngObj = Object.assign(thisEngObj, specificReq);

    // tbs classes don't count for engineering
    if (thisEngObj.tbs) {thisEngObj.eng = false;}

    if (dept === 'IPD' && cross) { // IPD Rule
        if (cross.subject === 'ARCH' || cross.subject === 'EAS' || cross.subject === 'FNAR') {
            thisEngObj.eng = false;
        }
    }

    if (thisEngObj.math)   {engreqCodesList.push('EMAT'); engreqList.push(reqCodes.EMAT);}
    if (thisEngObj.natsci) {engreqCodesList.push('ESCI'); engreqList.push(reqCodes.ESCI);}
    if (thisEngObj.eng)    {engreqCodesList.push('EENG'); engreqList.push(reqCodes.EENG);}
    if (thisEngObj.ss)     {engreqCodesList.push('ESSC'); engreqList.push(reqCodes.ESSC);}
    if (thisEngObj.hum)    {engreqCodesList.push('EHUM'); engreqList.push(reqCodes.EHUM);}
    if (thisEngObj.tbs)    {engreqCodesList.push('ETBS'); engreqList.push(reqCodes.ETBS);}
    if (thisEngObj.writ)   {engreqCodesList.push('EWRT'); engreqList.push(reqCodes.EWRT);}
    if (thisEngObj.nocred) {engreqCodesList.push('ENOC'); engreqList.push(reqCodes.ENOC);}

    var listCross = ['AFST', 'ASAM', 'AFRC', 'AAMW', 'CINE', 'GSWS'];

    if (listCross.indexOf(dept) > -1 && cross) {
        engReturn = EngReqRules(cross.subject, cross.course_id);
        engreqCodesList = engReturn[0];
        engreqList = engReturn[1];
    }

    return [engreqCodesList, engreqList];
}

module.exports = requirements;