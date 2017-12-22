var parse = {};
var r = require('./reqFunctions.js'); // Functions that help determine which req rules apply to a class

function RecordRegistrar(parsedRes) {
    console.log('catch')
}

function GetRevData (dept, num, inst) {
    var allRevs = require('./loadRevs.js');
    // Given a department, course number, and instructor (optional), get back the three rating values
    var deptData = allRevs[dept]; // Get dept level ratings
    var thisRevData = {"cQ": 0, "cD": 0, "cI": 0};
    if (deptData) {
        var revData = deptData[num]; // Get course level ratings
        if (revData) {
            // Try to get instructor specific reviews, but fallback to general course reviews
            thisRevData = (revData[(inst || '').trim().toUpperCase()] || (revData.Recent));
        }
    }
    return thisRevData;
}

function getTimeInfo(JSONObj) { // A function to retrieve and format meeting times
    var OCStatus = JSONObj.course_status; // Is the section open or closed
    var isOpen;
    if (OCStatus === "O") {
        isOpen = true;
    } else {
        isOpen = false;
    }
    var TimeInfo = []; // TimeInfo is textual e.g. '10:00 to 11:00 on MWF'
    try { // Not all sections have time info
        for(var meeting in JSONObj.meetings) { if (JSONObj.meetings.hasOwnProperty(meeting)) {
            // Some sections have multiple meeting forms (I'm looking at you PHYS151)
            var thisMeet = JSONObj.meetings[meeting];
            var StartTime= thisMeet.start_time.split(" ")[0]; // Get start time
            var EndTime  = thisMeet.end_time.split(" ")[0]; // Get end time

            if (StartTime[0] === '0') {
                StartTime = StartTime.slice(1);
            } // If it's 08:00, make it 8:00
            if (EndTime[0] === '0') {
                EndTime = EndTime.slice(1);
            }

            var MeetDays = thisMeet.meeting_days; // Output like MWF or TR
            var meetListInfo = StartTime+" to "+EndTime+" on "+MeetDays;
            TimeInfo.push(meetListInfo);
        }}
    }
    catch (err) {
        console.log(("Error getting times" + JSONObj.section_id));
        TimeInfo = '';
    }
    return [isOpen, TimeInfo];
}

function SectionMeeting(sec) {
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

parse.SchedInfo = function(entry) { // Get the properties required to schedule the section
    if (entry.result_data) {entry = entry.result_data[0]} else {entry = entry[0]}
    try {
        var idDashed     = entry.section_id_normalized.replace(/ /g, ""); // Format ID
        var idSpaced = idDashed.replace(/-/g, ' ');
        var resJSON  = [];
        try { // Not all sections have time info
            for(var meeti in entry.meetings) { if (entry.meetings.hasOwnProperty(meeti)) { // Some sections have multiple meetings
                var thisMeet   = entry.meetings[meeti];
                var StartTime  = (thisMeet.start_hour_24) + (thisMeet.start_minutes)/60;
                var EndTime    = (thisMeet.end_hour_24)   + (thisMeet.end_minutes)/60;
                var hourLength = EndTime - StartTime;
                var MeetDays   = thisMeet.meeting_days;
                var Building, Room;
                try {
                 Building    = thisMeet.building_code;
                 Room        = thisMeet.room_number;
                } catch (err) {
                 Building    = "";
                 Room        = "";
                }
                var SchedAsscSecs = [];
                if (entry.lectures.length) {
                    for (var thisAssc in entry.lectures) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
                        SchedAsscSecs.push(entry.lectures[thisAssc].subject + '-' + entry.lectures[thisAssc].course_id + '-' + entry.lectures[thisAssc].section_id);
                    }}
                } else {
                    if (entry.recitations.length) {
                        for (var thisAssc in entry.recitations) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
                            SchedAsscSecs.push(entry.recitations[thisAssc].subject + '-' + entry.recitations[thisAssc].course_id + '-' + entry.recitations[thisAssc].section_id);
                        }}
                    } else if (entry.labs.length) {
                        for (var thisAssc in entry.labs) {  if (entry.lectures.hasOwnProperty(thisAssc)) {
                            SchedAsscSecs.push(entry.labs[thisAssc].subject + '-' + entry.labs[thisAssc].course_id + '-' + entry.labs[thisAssc].section_id);
                        }}
                    }
                }

                // Full ID will have sectionID+MeetDays+StartTime
                // This is necessary for classes like PHYS151, which has times: M@13, TR@9, AND R@18
                var FullID = idDashed+'-'+MeetDays+StartTime.toString().replace(".", "");

                resJSON.push({
                    'fullID':       FullID,
                    'idDashed':     idDashed,
                    'idSpaced':     idSpaced,
                    'hourLength':   hourLength,
                    'meetDay':      MeetDays,
                    'meetHour':     StartTime,
                    'meetLoc':      Building+' '+Room,
                    'SchedAsscSecs':    SchedAsscSecs
                });
            }}
        }
        catch (err) {
            console.log("Error getting times: "+err);
        }
        // console.log(JSON.stringify(resJSON))
        return resJSON;
    }
    catch (err) {
        return 'No Results';
    }
}

parse.DeptList = function(res) {
    for (var course in res) { if (res.hasOwnProperty(course)) {
        var courData     = res[course].idSpaced.split(' ');
        var courDept     = courData[0];
        var courNum      = courData[1];
        res[course].revs = GetRevData(courDept, courNum); // Append PCR data to courses
    }}
    return res;
}

// This function spits out the array of courses that goes in #CourseList
// Takes in data from the API
parse.CourseList = function(Res) {
    var coursesList = {};
    for(var key in Res) { if (Res.hasOwnProperty(key)) {
        var thisKey  = Res[key];

        if (Res.hasOwnProperty(key) && !thisKey.is_cancelled) { // Iterate through each course that isn't cancelled
            var thisDept       = thisKey.course_department.toUpperCase();
            var thisNum        = thisKey.course_number.toString();
            var courseListName = thisDept+' '+thisNum; // Get course dept and number
            var numCred        = Number(thisKey.credits.split(" ")[0]); // How many credits does this section count for

            if (!coursesList[courseListName]) { // If there's no entry, make a new one
                var courseTitle  = thisKey.course_title;
                var reqCodesList = r.GetRequirements(thisKey); // Check which requirements are fulfilled by this course
                var revData      = GetRevData(thisDept, thisNum); // Get review information
                coursesList[courseListName] = {
                    'idSpaced': courseListName,
                    'idDashed': courseListName.replace(/ /g,'-'),
                    'courseTitle': courseTitle,
                    'courseReqs': reqCodesList[0],
                    'courseCred': numCred,
                    'revs': revData
                };
            } else if (coursesList[courseListName].courseCred < numCred) { // If there is an entry, choose the higher of the two numcred values
                coursesList[courseListName].courseCred = numCred
            }
        }
    }}
    var arrResp = [];
    for (var course in coursesList) { if (coursesList.hasOwnProperty(course)) {
        arrResp.push(coursesList[course]); // Convert from object to array
    }}
    return arrResp;
}

// This function spits out section-specific info
parse.SectionInfo = function(Res) {
    var entry = Res[0];
    var sectionInfo = {};
    // try {
    if (entry && !entry.is_cancelled) { // Don't return cancelled sections
        var Title         = entry.course_title;
        var FullID        = entry.section_id_normalized.replace(/-/g, " "); // Format name
        var CourseID      = entry.section_id_normalized.split('-')[0] + ' ' + entry.section_id_normalized.split('-')[1];
        var Instructor    = '';
        if (entry.instructors[0]) {
            Instructor    = entry.instructors[0].name;
        }
        var Desc          = entry.course_description;
        var TimeInfoArray = getTimeInfo(entry);
        var StatusClass   = TimeInfoArray[0];
        var meetArray     = TimeInfoArray[1];
        var prereq        = (entry.prerequisite_notes[0] || 'none');
        var termsOffered  = entry.course_terms_offered;

        var OpenClose;
        if (StatusClass) {
            OpenClose = 'Open';
        } else {
            OpenClose = 'Closed';
        }
        var secCred = Number(entry.credits.split(" ")[0]);

        var asscType = '';
        var asscList = [];
        var key;
        if (entry.recitations.length !== 0) { // If it has recitations
            asscType = "recitation";
            for(key in entry.recitations) { if (entry.recitations.hasOwnProperty(key)) {
                    asscList.push(entry.recitations[key].subject+' '+entry.recitations[key].course_id+' '+entry.recitations[key].section_id);
            }}

        } else if (entry.labs.length !== 0) { // If it has labs
            asscType = "lab";
            for(key in entry.labs) { if (entry.labs.hasOwnProperty(key)) {
                    asscList.push(entry.labs[key].subject+' '+entry.labs[key].course_id+' '+entry.labs[key].section_id);
            }}

        } else if (entry.lectures.length !== 0) { // If it has lectures
            asscType = "lecture";
            for(key in entry.lectures) { if (entry.lectures.hasOwnProperty(key)) {
                    asscList.push(entry.lectures[key].subject+' '+entry.lectures[key].course_id+' '+entry.lectures[key].section_id);
            }}
        }

        var reqsArray = r.GetRequirements(entry)[1];

        sectionInfo = {
            'fullID': FullID,
            'CourseID': CourseID,
            'title': Title,
            'instructor': Instructor,
            'description': Desc,
            'openClose': OpenClose,
            'termsOffered': termsOffered,
            'prereqs': prereq,
            'timeInfo': meetArray,
            'associatedType': asscType,
            'associatedSections': asscList,
            'sectionCred': secCred,
            'reqsFilled': reqsArray
        };
        return sectionInfo;
    } else {
        return 'No Results';
    }
}

// This function spits out the list of sections that goes in #SectionList
parse.SectionList = function(Res) {
    // Convert to JSON object
    var sectionsList = [];
    // var courseInfo = {};
    for(var key in Res) {
        if (Res.hasOwnProperty(key)) {
            var thisEntry = Res[key];
            if (!thisEntry.is_cancelled) {
                var idDashed      = thisEntry.section_id_normalized.replace(/ /g, "");
                var idSpaced      = idDashed.replace(/-/g, ' ');
                var timeInfoArray = getTimeInfo(thisEntry); // Get meeting times for a section
                var isOpen        = timeInfoArray[0];
                var timeInfo      = timeInfoArray[1][0]; // Get the first meeting slot
                if (timeInfoArray[1][1]) { // Cut off extra text
                    timeInfo += ' ...';
                }
                var actType       = thisEntry.activity;
                var SectionInst; // Get the instructor for this section
                try {
                    SectionInst = thisEntry.instructors[0].name;
                } catch(err) {
                    SectionInst = '';
                }

                var revData = GetRevData(thisEntry.course_department, thisEntry.course_number, SectionInst); // Get inst-specific reviews

                if (typeof timeInfo === 'undefined') {
                    timeInfo = '';
                }

                var schedInfo = parse.SchedInfo(thisEntry);

                sectionsList.push({
                    'idDashed': idDashed,
                    'idSpaced': idSpaced,
                    'isOpen': isOpen,
                    'timeInfo': timeInfo,
                    'courseTitle': Res[0].course_title,
                    'SectionInst': SectionInst,
                    'actType': actType,
                    'revs': revData,
                    'fullSchedInfo': schedInfo
                });
            }
        }
    }
    var sectionInfo = parse.SectionInfo(Res);

    return [sectionsList, sectionInfo];
}

parse.RecordRegistrar = function(inJSON) {
    var fs = require('fs');

    var resp = {};
    var meetresp = {};
    for(var key in inJSON) { if (inJSON.hasOwnProperty(key)) {
        // For each section that comes up
        // Get course name (e.g. CIS 120)
        var thisKey = inJSON[key];
        var idSpaced = thisKey.course_department + ' ' + thisKey.course_number;
        var secID = thisKey.course_department + '-' + thisKey.course_number + '-' + thisKey.section_number;
        var numCred = Number(thisKey.credits.split(" ")[0]);

        if (!thisKey.is_cancelled) { // Don't include cancelled sections
            var idDashed = idSpaced.replace(' ', '-');
            if (!resp[idSpaced]) { // If there is no existing record for the course, make a new record
                var reqCodesList = r.GetRequirements(thisKey)[0];
                resp[idSpaced] = {
                    'idDashed': idDashed,
                    'idSpaced': idSpaced,
                    'courseTitle': thisKey.course_title,
                    'courseReqs': reqCodesList,
                    'courseCred': numCred
                };
            } else if (resp[idSpaced].courseCred < numCred) { // If there is, make the numCred value the max 
                resp[idSpaced].courseCred = numCred
            }
            var meetingInfo = SectionMeeting(thisKey);
            meetresp[secID] = meetingInfo;
        }
    }}
    var arrResp = [];
    for (key in resp) { if (resp.hasOwnProperty(key)) {
        arrResp.push(resp[key]);
    }}
    if (inJSON.length) {
        var thedept = thisKey.course_department;
        var currentTerm = thisKey.term
        // At the end of the list
        fs.writeFile('../Data/'+currentTerm+'/'+thedept+'.json', JSON.stringify(arrResp), function (err) {
            // Write JSON to file
            if (err) {
                console.log(thedept+' '+err);
            } else {
                console.log(('Reg Spit: '+thedept));
            }
        });
        fs.writeFile('../Data/'+currentTerm+'Meet/'+thedept+'.json', JSON.stringify(meetresp), function (err) {
            // Write JSON to file
            if (err) {
                console.log(thedept+' '+err);
            } else {
                console.log(('Meet Spit: '+thedept));
            }
        });
    }
}

module.exports = parse;