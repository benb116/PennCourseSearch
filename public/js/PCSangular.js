var PCS = angular.module('PCSApp', ['LocalStorageModule', 'tooltips']);

/*
    I know this is scope soup. If you'd like to fix it (or give me advice about Angular), let me know.
*/

PCS.controller('CourseController', function ($scope, $http, localStorageService, PCR, UpdateCourseList, UpdateSectionList, UpdateSectionInfo, UpdateSchedules, pendingRequests){

    var currentTerm = '2018A';
    var placeholderMap = {
        'courseIDSearch': 'Search for a department, course, or section',
        'keywordSearch': 'Search by course title or description',
        'instSearch': 'Search for a specific instructor'
    };
    // Initial values that reset all of the search information
    $scope.clearSearch = function() {
        $scope.search = ''; // value of the search bar
        $scope.courses = []; // array of course objects
        $scope.sections = []; // array of section objects
        $scope.sectionInfo = {}; // object with section information
        $scope.currentDept = ''; // current parameter used to get list of courses
        $scope.currentCourse = ''; // current parameter used to get list of sections
        $scope.currentSection = ''; // current parameter used to get section information
        $scope.secListTitle = ''; // What text is shown over the seclist
        $scope.searchType = "courseIDSearch"; // value of Search By select menu
        $scope.searchPlaceholder = placeholderMap[$scope.searchType];
        $scope.loading = ($http.pendingRequests.length !== 0); // Are there outstanding HTTP requests
        $scope.courseSort = 'idDashed'; // how are courses being sorted right now (defaults to course number)
        $scope.showClosed = true; // filter list of sections to exclude closed sections
        $scope.showAct = 'noFilter'; // value of activity filter select menu
        $scope.showPro = 'noFilter'; // value of program filter select menu
        $scope.credFilter = 'noFilter'; // value of credit filter select menu
        $scope.check = {}; // Object of requirement filters (added as true or false like "MFR": true)
        $scope.checkArr = []; // Array of enabled requirement filter codes (as strings)
        $scope.reqShow = 'CAS';
    };
    $scope.clearSearch();

    // Schedule and star data should be synced with localStorage. This makes it dead simple to do that
    localStorageService.bind($scope, 'schedData');
    localStorageService.bind($scope, 'starSections');

    // If there's no schedule data
    if (!$scope.schedData || !Object.keys($scope.schedData).length) {
        $scope.schedData = {};
        $scope.schedData.Schedule = new Schedule(currentTerm); // see functions.js for the Schedule constructor
    }
    for (var schedObj in $scope.schedData) {
        if ($scope.schedData[schedObj].term !== currentTerm) {
            delete $scope.schedData[schedObj]; // Delete schedules that are not for the current term
        }
    }
    if (!$scope.schedData || !Object.keys($scope.schedData).length) {
        $scope.schedData = {};
        $scope.schedData.Schedule = new Schedule(currentTerm); // see functions.js for the Schedule constructor
    }

    $scope.starSections = ($scope.starSections || []);
    $scope.schedules = Object.keys($scope.schedData); // Used in the schedule select dropdown
    $scope.currentSched = $scope.schedules[0];

    $scope.searchChange = function() {
        // ga('send', 'event', 'UI interaction', 'searchChange', $scope.searchType);        
        $scope.currentDept = '';
        // $scope.courses = [];
        $scope.initiateSearch($scope.search);
        $scope.searchPlaceholder = placeholderMap[$scope.searchType];
    };
    $scope.delaySearch = function() {
        // This prevents requests from being sent out immediately
        delay(function() {
            $scope.initiateSearch($scope.search);
        }, 400);
    }
    $scope.initiateSearch = function(param, courseType) {
        // Used for typed searches and schedBlock clicks
        var terms = FormatID(param);
        if(terms[0] && terms[0] !== '') {
            pendingRequests.cancelAll();
            if (terms[0] !== $scope.currentDept) {
                $scope.get.Courses(terms[0], courseType); // if (!courseType) then the get.Courses function will default to the searchType value
            }
        } else {
            $scope.currentDept = '';
            $scope.courses = [];
        }
        if(terms[1].length === 3) {
            $scope.get.Sections(terms[0], terms[1], terms[2]);
        } else {
            $scope.secListTitle = '';
            $scope.currentCourse = '000';
            $scope.sections = [];
            $scope.currentSection = '000';
            $scope.sectionInfo = {};
        }
        if (terms[2].length === 3) {
            $scope.get.SectionInfo(terms[0], terms[1], terms[2]);
        }
    };
    $scope.schedChange = function() {
        $scope.sched.Render($scope.schedData[$scope.currentSched]);
        $scope.schedSections = $scope.schedData[$scope.currentSched].meetings.map(function(value, index) {
            return $scope.schedData[$scope.currentSched].meetings[index].idDashed;
        });
        $scope.schedules = Object.keys($scope.schedData);
    };
    $scope.get = {
        Courses: function(param, type, req, pro) {
            if (!param) {param = '';}
            if (!type) {type = $scope.searchType;}
            var reqText;
            if (!req) {reqText = '';} else {reqText = req;}
            if (!pro) {pro = $scope.showPro;}
            $scope.currentDept = param;
            UpdateCourseList.getDeptCourses(param, type, reqText, pro).then(function(resp) {
                $scope.courses = PCR(resp.data);
                if (!$scope.courses.length) {
                    $scope.courses = [{'courseTitle': 'No Results'}];
                }
            });
        },
        Sections: function(dept, num, sec) {
            if (!num) {
                var terms = FormatID(dept);
                dept = terms[0];
                num = terms[1];
                sec = '';
            }
            var cID = dept+num;
            $scope.currentCourse = cID;
            UpdateSectionList.getCourseSections(cID).then(function(resp) {
                $scope.sections = PCR(resp.data[0]);
                if ($scope.sections[0]) {
                    $scope.secListTitle = $scope.sections[0].courseTitle;
                } else {
                    $scope.secListTitle = 'No Results';
                }
                if (sec.length < 3) { // If we are not searching for a specific section, show some course information
                    $scope.sectionInfo = resp.data[1];
                    if ($scope.sections.length > 1) {
                        $scope.sectionInfo.fullID = $scope.sectionInfo.fullID.slice(0,-4);
                        delete $scope.sectionInfo.instructor;
                        delete $scope.sectionInfo.openClose;
                        delete $scope.sectionInfo.timeInfo;
                        delete $scope.sectionInfo.associatedType;
                        delete $scope.sectionInfo.associatedSections;
                    }
               }
            });
        },
        SectionInfo: function(dept, num, sec) {
            var terms;
            if (!num) {
                terms = FormatID(dept);
                dept = terms[0];
                num = terms[1];
                sec = terms[2];
            }
            var secID = dept+num+sec;
            $scope.currentSection = secID;
            UpdateSectionInfo.getSectionInfo(secID).then(function(resp) {
                $scope.sectionInfo = resp.data;
            });
        }
    };

    $scope.star = {
        AddRem: function(secID) {
            addrem(secID, $scope.starSections);
            this.Title();
        },
        Show: function() {
            ga('send', 'event', 'UI interaction', 'show-stars');
            $scope.currentCourse = false;
            $scope.sections = [];
            $scope.sectionInfo = {};
            // Send section requests for each section and add the responses to the array
            for (var sec in $scope.starSections) { if ($scope.starSections.hasOwnProperty(sec)) {
                UpdateSectionList.getCourseSections($scope.starSections[sec]).then(function(resp) {
                    PCR(resp.data[0]);
                    $scope.sections.push(resp.data[0][0]);
                });
            }}
            this.Title();
        },
        Title: function() {
            if ($scope.currentCourse === false) {
                if ($scope.starSections.length) {
                    $scope.secListTitle = "Starred sections";
                } else {
                    $scope.secListTitle = "No starred sections";
                }
            }
        }
    };

    $scope.sched = {
        AddRem: function(secID, schedname, needloc) {
            secID = FormatID(secID).join('-');

            // schedSections is a continually updated array of sections in the current schedule
            if ($scope.schedSections.indexOf(secID) === -1) { // If the requested section is not scheduled
                ga('send', 'event', 'Sched', 'addSect', secID);
                UpdateSchedules.getSchedData(secID, needloc).then(function(resp) {
                    if (resp.data) {
                        var oldData = $scope.schedData[(schedname || $scope.currentSched)].meetings;
                        var newData = oldData.concat(resp.data); // Combine old meetings and new meetings
                        $scope.schedData[(schedname || $scope.currentSched)].meetings = newData;
                        localStorageService.set('schedData', $scope.schedData);
                    }
                });
            } else if (needloc) {
                UpdateSchedules.getSchedData(secID, needloc).then(function(resp) {
                    if (resp.data) {
                        if (resp.data[0].meetLoc !== '') {
                            localStorage.setItem(currentTerm+'Loc', 'true');
                        }
                        // resp.data[0].meetLoc = "";
                        // console.log(resp.data)
                        var oldData = $scope.schedData[(schedname || $scope.currentSched)].meetings;
                        var otherData = oldData.filter(function(meet) {
                            return (meet.idDashed !== secID);
                        });
                        var newData = otherData.concat(resp.data); // Combine old meetings and new meetings
                        $scope.schedData[(schedname || $scope.currentSched)].meetings = newData;
                        localStorageService.set('schedData', $scope.schedData);
                    }
                });
            } else {
                // Filter out meeting objects whose corresponding sectionID is the requested section
                ga('send', 'event', 'Sched', 'remSect', secID);
                var oldData = $scope.schedData[$scope.currentSched].meetings;
                var newData = oldData.filter(function(item) {
                    return (item.idDashed !== secID)
                });
                $scope.schedData[$scope.currentSched].meetings = newData;
            }
        },
        Download: function() {
            ga('send', 'event', 'Sched', 'downSched');
            html2canvas($('#SchedGraph'), { // Convert the div to a canvas
                onrendered: function(canvas) {
                    var image = new Image();
                    image.src = canvas.toDataURL("image/png"); // Convert the canvas to png
                    // window.open(image.src, '_blank'); // Open in new tab
                    $('#SchedImage').attr('src', image.src).attr('title', 'My Schedule');
                }
            });
        },
        New: function() {
            ga('send', 'event', 'Sched', 'newSched');
            sweetAlert({
                title: "Please name your new schedule",
                type: "input",
                inputPlaceholder: "Spring 2018",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
            }, function(inputValue) {
                if (inputValue === false) {
                    return false;
                } else if (inputValue === "") {
                    sweetAlert.showInputError("Your schedule needs a name, silly!");
                    return false;
                } else if (inputValue !== Uniquify(inputValue, $scope.schedules)) { // If the user put in a name that already exists
                    sweetAlert.showInputError('Your schedule needs a unique name (e.g. "Seven")');
                } else {
                    $scope.schedData[inputValue] = new Schedule(currentTerm);
                    $scope.currentSched = inputValue;
                    sweetAlert.close();
                }
                $scope.$apply();
            });
        },
        Duplicate: function() {
            var uniqueName = Uniquify($scope.currentSched, $scope.schedules);
            $scope.schedData[uniqueName] = angular.copy($scope.schedData[$scope.currentSched]);
            $scope.currentSched = uniqueName;
            sweetAlert({
                title: "Schedule duplicated.",
                type: "success",
                timer: 1000
            });
        },
        Rename: function() {
            sweetAlert({
                title: "Please enter a new name",
                type: "input",
                inputPlaceholder: "Schedule 2: Book of Secrets",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
            }, function(inputValue) {
                if (inputValue === false) {
                    return false;
                } else if (inputValue === "") {
                    sweetAlert.showInputError("Your schedule needs a name, silly!");
                    return false;
                } else if (inputValue !== Uniquify(inputValue, $scope.schedules)) { // If the user put in a name that already exists
                    sweetAlert.showInputError('Your schedule needs a unique name (e.g. "Seven")');
                } else {
                    $scope.schedData[inputValue] = angular.copy($scope.schedData[$scope.currentSched]);
                    delete $scope.schedData[$scope.currentSched];
                    $scope.currentSched = inputValue;
                    $scope.$apply();
                    sweetAlert({
                        title: "Your schedule has been renamed.",
                        type: "success",
                        timer: 1000
                    });
                }
            });
        },
        Clear: function() {
            sweetAlert({
                title: "Are you sure you want to clear your whole schedule?",
                text: "You can't undo this, it will be gone forever.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: false
            }, function() {
                $scope.schedData[$scope.currentSched] = new Schedule(currentTerm);
                $scope.$apply();
                sweetAlert({
                    title: "Your schedule has been cleared.",
                    type: "success",
                    timer: 1000
                });
            });
        },
        Delete: function() {
            sweetAlert({
                title: "Are you sure you want to delete this schedule?",
                text: "You can't undo this, it will be gone forever.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: false
            }, function() {
                delete $scope.schedData[$scope.currentSched];
                if (!Object.keys($scope.schedData).length) { // If there are no schedules, create a blank one.
                    $scope.schedData.Schedule = new Schedule(currentTerm);
                }
                $scope.currentSched = Object.keys($scope.schedData)[Object.keys($scope.schedData).length-1]; // Set currentSched to the last schedule in the list
                $scope.$apply();
                sweetAlert({
                    title: "Your schedule has been deleted.",
                    type: "success",
                    timer: 1000
                });
            });
        },
        Recolor: function() {
            shuffle($scope.schedData[$scope.currentSched].colorPalette);
        },
        Import: function() {
            ga('send', 'event', 'Sched', 'importSched');
            var schedName = Uniquify('Imported', $scope.schedules);
            $scope.schedData[schedName] = new Schedule(currentTerm);
            $scope.currentSched = schedName;
            $scope.schedSections = [];
            $('#secsToImport > input:checked').each(function() {
                $scope.sched.AddRem($(this).attr('name'));
            });
            $('#secsToImport').empty();
            $('#schedInput').val('');
            $('#importSubmit').prop('disabled', true);
        },
        AddLoc: function() {
            for (var thisSched in $scope.schedData) { if ($scope.schedData.hasOwnProperty(thisSched)) {
                for (var thissec in $scope.schedData[thisSched].meetings) { if ($scope.schedData[thisSched].meetings.hasOwnProperty(thissec)) {
                    var thisID = $scope.schedData[thisSched].meetings[thissec].idDashed;
                    $scope.sched.AddRem(thisID, thisSched, true);
                }}
            }}
        },
        Render: function(thisschedData) {
            var courseSched = thisschedData.meetings;
            var weekdays     = ['M', 'T', 'W', 'R', 'F'];
            $scope.fullWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            var startHour    = 10; // start at 10
            var endHour      = 15; // end at 3pm
            var incSun       = 0; // no weekends
            var incSat       = 0;

            for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
                var secMeetHour = courseSched[sec].meetHour;
                if (secMeetHour <= startHour) { // If there are classes earlier than the default start
                    startHour = Math.floor(secMeetHour); // push back the earliest hour
                }
                if (secMeetHour + courseSched[sec].hourLength >= endHour) { // Push back latest hour if necessary
                    endHour = Math.ceil(secMeetHour + courseSched[sec].hourLength);
                }
                for (day in courseSched[sec].meetDay) { if (courseSched[sec].meetDay.hasOwnProperty(day)) {
                    var topLetterDay = courseSched[sec].meetDay[day];
                    if (topLetterDay === 'U') { // If there are sunday classes
                        incSun = 1;
                    }
                    if (topLetterDay === 'S') { // If there are saturday classes
                        incSat = 1;
                    }
                }}
            }}

            if (incSun === 1) {
                weekdays.unshift('U');
                $scope.fullWeekdays.unshift('Sunday');
            } // Update weekdays array if necessary
            if (incSat === 1) {
                weekdays.push('S');
                $scope.fullWeekdays.push('Saturday');
            }
            $scope.percentWidth = 100 / weekdays.length; // Update the block width if necessary
            var halfScale = 95 / (endHour - startHour + 1); // This defines the scale to be used throughout the scheduling process
            
            $scope.timeblocks = [];
            $scope.schedlines = [];
            if (courseSched.length) {
                for (var i = 0; i <= (endHour - startHour); i++) { // for each hour
                    var toppos = (i) * halfScale + 7.5; // each height value is linearly spaced with an offset
                    var hourtext = Math.round(i + startHour); // If startHour is not an integer, make it pretty
                    if (hourtext > 12) {
                        hourtext -= 12;
                    } // no 24-hour time

                    $scope.schedlines.push(toppos);
                    $scope.timeblocks.push(hourtext);
                }
            }

            // Define the color map
            var colorMap = {};
            var colorinc = 0;
            var colorPal = thisschedData.colorPalette;
            for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
                var secID = courseSched[sec].idDashed;
                if (!colorMap[secID]) {
                    colorMap[secID] = colorPal[colorinc];
                    colorinc++;
                }
            }}

            var meetBlocks = [];
            $scope.schedBlocks = [];
            // Add the blocks
            for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
                meetBlocks = meetBlocks.concat(GenMeetBlocks(courseSched[sec]));
            }}

            for (b in meetBlocks) { if (meetBlocks.hasOwnProperty(b)) {
                $scope.schedBlocks[b] = AddSchedAttr(meetBlocks[b]);
            }}

            for (var weekday in weekdays) { if (weekdays.hasOwnProperty(weekday)) {
                var dayblocks = $scope.schedBlocks.filter(function(n) {return n.letterday === weekdays[weekday];});
                for (var i = 0; i < dayblocks.length-1; i++) {
                    for (var j = i+1; j < dayblocks.length; j++) {
                        if (TwoOverlap(dayblocks[i], dayblocks[j])) {
                            dayblocks[i].width = dayblocks[i].width / 2;
                            dayblocks[j].width = dayblocks[j].width / 2;
                            dayblocks[j].left = dayblocks[j].left + dayblocks[i].width;
                        }
                    }
                }
                $scope.schedBlocks.filter(function(n) {return n.letterday !== weekdays[weekday];});
                $scope.schedBlocks.concat(dayblocks);
            }}

            function AddSchedAttr(block) {
                block.left   = weekdays.indexOf(block.letterday) * $scope.percentWidth;
                block.top    = (block.startHr - startHour) * halfScale + 9; // determine top spacing based on time from startHour (offset for prettiness)
                block.height = block.duration * halfScale;
                block.color  = (colorMap[block.class] || "#E6E6E6"); // Get the color
                block.width  = $scope.percentWidth;
                return block;
            }
        },
        CrossCheck: function(asscarray) {
            var filt = asscarray.filter(function(n) {return $scope.schedSections.indexOf(n) !== -1;});
            return (filt.length || !asscarray.length);
        },
        SecOverlap: function(secMeet) {
            var blocks = [];
            for (i in secMeet.fullSchedInfo) { if (secMeet.fullSchedInfo.hasOwnProperty(i)) {
                blocks = GenMeetBlocks(secMeet.fullSchedInfo[i]);
            }}
            var isFit = true;
            for (b in blocks) { if (blocks.hasOwnProperty(b)) {
                var thisDay = blocks[b].letterday;
                var dayblocks = $scope.schedBlocks.filter(function(n) {return n.letterday === thisDay;});
                for (db in dayblocks) { if (blocks.hasOwnProperty(b)) {
                    if (TwoOverlap(dayblocks[db], blocks[b])) {
                        isFit = false;
                        break;
                    }
                }}
                if (!isFit) {break;}
            }}
            return isFit;
        }
    };
    
    $scope.reqChange = function () {
        var oldarr = $scope.checkArr;
        $scope.checkArr = [];
        for (var req in $scope.check) { // Build an array of all checked boxes (length <= 2)
            if ($scope.check[req]) {$scope.checkArr.push(req);}
        }
        var diffreqs = $scope.checkArr.filter(function(i) {return oldarr.indexOf(i) < 0;})
        if (diffreqs[0]) {
            ga('send', 'event', 'UI interaction', 'requirement', diffreqs[0]);
        }

        // If there are no courses in the list and no currentDept search, the user probably just wants to see all classes that satisfy a given requirement
        if (!($scope.courses.length && $scope.currentDept !== '') && $scope.checkArr.length === 1 && $scope.showPro === 'noFilter') {
            $scope.get.Courses($scope.currentDept, null, $scope.checkArr[0]);
        }
        // Otherwise the filtering in the view will take care of hiding and showing the corrent courses
    };

    $scope.Notify = promptNotify;
    $scope.$watch('schedData', function() { // When schedData changes
        $scope.schedChange();
    }, true);
    $scope.$watch('courseSort', function() {
        if ($scope.courseSort !== 'idDashed') {
            ga('send', 'event', 'UI interaction', 'sort', $scope.courseSort);
        }
        $('#CourseList>ul').scrollTop(0);
    });
    $scope.$watch(function() { // If there are any unresolved HTTP requests, show the loading spinner
        return $http.pendingRequests.length;
    }, function() {
        $scope.loading = ($http.pendingRequests.length !== 0);
    });
});