var PCS = angular.module('PCSApp', ['LocalStorageModule', '720kb.tooltips']);

/*
	I know this is scope soup. I'm still learning. 
*/

PCS.controller('CourseController', function ($scope, $http, localStorageService, PCR, UpdateCourseList, UpdateSectionList, UpdateSectionInfo, UpdateSchedules){
	// Initial values that reset all of the search information
	$scope.clearSearch = function() {
		$scope.search = ''; // value of the search bar
		$scope.courses = []; // array of course objects
		$scope.sections = []; // array of section objects
		$scope.sectionInfo = {}; // object with section information
		$scope.currentDept = ''; // current parameter used to get list of courses
		$scope.currentCourse = ''; // current parameter used to get list of sections
		$scope.currentSection = ''; // current parameter used to get section information
		$scope.schedSections = []; // array of section idDashed's as strings
		$scope.searchType = "courseIDSearch"; // value of Search By select menu
		$scope.loading = ($http.pendingRequests.length !== 0); // Are there outstanding HTTP requests
		$scope.courseSort = 'idDashed'; // how are courses being sorted right now (defaults to course number)
		$scope.showClosed = true; // filter list of sections to exclude closed sections
		$scope.showAct = 'noFilter'; // value of activity filter select menu
		$scope.showPro = 'noFilter'; // value of program filter select menu
		$scope.check = {}; // Object of requirement filters (added as true or false like "MFR": true)
		$scope.checkArr = []; // Array of enabled requirement filter codes (as strings)
	};
	$scope.clearSearch();

	// Schedule and star data should be synced with localStorage. This makes it dead simple to do that
	localStorageService.bind($scope, 'schedData');
	localStorageService.bind($scope, 'starSections');

	// If there's no schedule data
	if (!$scope.schedData || !Object.keys($scope.schedData).length) {
		$scope.schedData = {};
		$scope.schedData.Schedule = new Schedule('2016A'); // see functions.js for the Schedule constructor
	}

	$scope.starSections = ($scope.starSections || []);
	$scope.schedules = Object.keys($scope.schedData); // Used in the schedule select dropdown
	$scope.currentSched = $scope.schedules[0];

	$scope.searchChange = function() {
		// This prevents requests from being sent out immediately
		delay(function() {
			$scope.initiateSearch($scope.search);
		}, 500);
	};
	$scope.initiateSearch = function(param, courseType) {
		// Used for typed searches and schedBlock clicks
		var terms = FormatID(param);
		if(terms[0]) {
			$scope.get.Courses(terms[0], courseType); // if (!courseType) then the get.Courses function will default to the searchType value
		} else {
			$scope.currentDept = '';
		}
		if(terms[1].length === 3) {
			$scope.get.Sections(terms[0], terms[1], terms[2]);
			$scope.get.SectionInfo(terms[0], terms[1], terms[2]);
		} else {
			$scope.currentCourse = '000';
			$scope.sections = [];
			$scope.currentSection = '000';
			$scope.sectionInfo = {};
		}
		
	};
	$scope.get = {
		Courses: function(param, type, req, pro) {
			if (!param) {param = '';}
			if (!type) {type = $scope.searchType;}
			if (!req) {reqText = '';} else {reqText = req;}
			if (!pro) {pro = $scope.showPro;}
			$scope.currentDept = param;
			UpdateCourseList.getDeptCourses(param, type, reqText, pro).then(function(resp) {
				$scope.courses = resp.data;
			});
		},
		Sections: function(dept, num, sec) {
			if (!num) {
				terms = FormatID(dept);
				dept = terms[0];
				num = terms[1];
				sec = '';
			}
			var cID = dept+num;
			$scope.currentCourse = cID;
			UpdateSectionList.getCourseSections(cID).then(function(resp) {
				$scope.sections = resp.data[0];
				if (sec.length < 3) { // If we are not searching for a specific section, show some course information
					$scope.sectionInfo = resp.data[1];
					delete $scope.sectionInfo.instructor;
		            delete $scope.sectionInfo.openClose;
		            delete $scope.sectionInfo.timeInfo;
		            delete $scope.sectionInfo.associatedType;
		            delete $scope.sectionInfo.associatedSections;
		       }
			});
		},
		SectionInfo: function(dept, num, sec) {
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
		},
		Show: function() {
			$scope.currentCourse = false;
			$scope.sections = [];
			// Send section requests for each section and add the responses to the array
			for (var sec in $scope.starSections) {
				UpdateSectionList.getCourseSections($scope.starSections[sec]).then(function(resp) {
					PCR(resp.data[0]);
					$scope.sections.push(resp.data[0][0]);
				});
			}
		}
	};
	$scope.sched = {
		AddRem: function(secID) {
			// schedSections is a continually updated array of sections in the current schedule
			if ($scope.schedSections.indexOf(secID) === -1) { // If the requested section is not scheduled
				UpdateSchedules.getSchedData(secID).then(function(resp) {
						var oldData = $scope.schedData[$scope.currentSched].meetings;
						newData = oldData.concat(resp.data); // Combine old meetings and new meetings
						$scope.schedData[$scope.currentSched].meetings = newData;
					});
			} else {
				// Filter out meeting objects whose corresponding sectionID is the requested section
				$scope.schedData[$scope.currentSched].meetings = $scope.schedData[$scope.currentSched].meetings.filter(function(item) {
					if (item.idDashed === secID) {
						return false;
					} else {
						return true;
					}
				});
			}
		},
		Download: function() {
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
			sweetAlert({
                title: "Please name your new schedule",
                type: "input",
                inputPlaceholder: "Spring 2016",
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
                	$scope.schedData[inputValue] = new Schedule('2016A');
                	$scope.currentSched = inputValue;
                    sweetAlert.close();
                }
                $scope.$apply();
            });
		},
		Duplicate: function() {
			var uniqueName = Uniquify($scope.currentSched, $scope.schedules);
			$scope.schedData[uniqueName] = $scope.schedData[$scope.currentSched];
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
                	$scope.schedData[inputValue] = $scope.schedData[$scope.currentSched];
					delete $scope.schedData[$scope.currentSched];
					$scope.currentSched = inputValue;
                    sweetAlert.close();
                }
                $scope.$apply();
            });
		},
		Clear: function() {
			sweetAlert({
                title: "Are you sure you want to clear your whole schedule?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: false
            }, function() {
                $scope.schedData[$scope.currentSched] = new Schedule('2016A');
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
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: false
            }, function() {
                delete $scope.schedData[$scope.currentSched];
                if (!Object.keys($scope.schedData).length) { // If there are no schedules, create a blank one.
                	$scope.schedData.Schedule = new Schedule('2016');
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
			// var schedName = Uniquify('Imported', $scope.schedules);
			$scope.schedData['Import'] = new Schedule('2016A');
        	$scope.currentSched = 'Import';
			$('#secsToImport > input:checked').each(function() {
				console.log($(this).attr('name'));
				$scope.sched.AddRem($(this).attr('name'));
			});
		}
	};
	$scope.Notify = function (secID) {
		// See functions for Notification code
		promptNotify(secID);
	};

	$scope.$watch('courses', function(val, old) {
		PCR($scope.courses); // Calculate and add extra PCR info
	});
	$scope.$watch('sections', function(val, old) {
		PCR($scope.sections);
	});
	$scope.$watch('schedData', function(val, old) { // When schedData changes
		SpitSched($scope.schedData[$scope.currentSched]); // Render new schedule
		$scope.schedSections = $scope.schedData[$scope.currentSched].meetings.map(function(value, index) { // Update schedSections list with currently scheduled sections
			return $scope.schedData[$scope.currentSched].meetings[index].idDashed;
		});
		$scope.schedules = Object.keys($scope.schedData); // Update list of schedules
	}, true);
	$scope.$watch('currentSched', function(val, old) {
		SpitSched($scope.schedData[$scope.currentSched]);
		$scope.schedSections = $scope.schedData[$scope.currentSched].meetings.map(function(value, index) {
			return $scope.schedData[$scope.currentSched].meetings[index].idDashed;
		});
		$scope.schedules = Object.keys($scope.schedData);
	}, true);
	$scope.$watch('check', function(val, old){ // When a requirement checkbox is changed
		$scope.checkArr = [];
		for (var req in $scope.check) { // Build an array of all checked boxes (length <= 2)
			if ($scope.check[req]) {$scope.checkArr.push(req);}
		}
		// If there are no courses in the list and no currentDept search, the user probably just wants to see all classes that satisfy a given requirement
		if (!($scope.courses.length && $scope.currentDept !== '') && $scope.checkArr.length == 1) {
			$scope.get.Courses($scope.currentDept, null, $scope.checkArr[0]);
		}
		// Otherwise the filtering in the view will take care of hiding and showing the corrent courses
	}, true);
	$scope.$watch('showPro', function(val, old) {
		$scope.get.Courses($scope.currentDept, null, $scope.checkArr[0]);
	});
	$scope.$watch(function() { // If there are any unresolved HTTP requests, show the loading spinner
	    return $http.pendingRequests.length;
	}, function() {
    	$scope.loading = ($http.pendingRequests.length !== 0);
	});
});

PCS.factory('PCR', function(){
	return function PCR(data){
		angular.forEach(data, function(item, index) {
			var qFrac = item.revs.cQ / 4;
			var dFrac = item.revs.cD / 4;
			var iFrac = item.revs.cI / 4;
			item.pcrQShade = Math.pow(qFrac, 3)*2; // This is the opacity of the PCR block
			item.pcrDShade = Math.pow(dFrac, 3)*2;
			item.pcrIShade = Math.pow(iFrac, 3)*2;
			if (qFrac < 0.35) {item.pcrQColor = 'black';} else {item.pcrQColor = 'white';} // It's hard to see white text on a light background
			if (dFrac < 0.35) {item.pcrDColor = 'black';} else {item.pcrDColor = 'white';}
			item.revs.QDratio = item.revs.cQ - item.revs.cD; // This is my way of calculating if a class is "good and easy." R > 1 means good and easy, < 1 means bad and hard
			if (isNaN(item.revs.QDratio) || !isFinite(item.revs.QDratio)) {item.revs.QDratio = 0;} // Cleanup to keep incomplete data on the bottom;
		});
		return data;
	};
});
PCS.factory('UpdateCourseList', ['$http', function($http, PCR){
	var retObj = {};
	retObj.getDeptCourses = function(dept, searchType, reqFilter, proFilter) {
		// Build the request URL
		var url = '/Search?searchType='+searchType+'&resultType=deptSearch&searchParam='+dept;
		if (reqFilter) {url += '&reqParam='+reqFilter;}
		if (proFilter && proFilter !== 'noFilter') {url += '&proParam='+proFilter;}
		return $http.get(url).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err); //  If there's an error, show an error dialog
		});
	};
	return retObj;
}]);
PCS.factory('UpdateSectionList', ['$http', function($http){
	var retObj = {};
	retObj.getCourseSections = function(course) {
		return $http.get('/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam='+course).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err);
		});
	};
	return retObj;
}]);
PCS.factory('UpdateSectionInfo', ['$http', function($http){
	var retObj = {};
	retObj.getSectionInfo = function(section) {
		return $http.get('/Search?searchType=courseIDSearch&resultType=sectSearch&searchParam='+section).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err);
		});
	};
	return retObj;
}]);
PCS.factory('UpdateSchedules', ['$http', function($http) {
	var retObj = {};
	retObj.getSchedData = function(secID) {
		return $http.get('/Sched?courseID='+secID).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err);
		});
	};
	return retObj;
}]);