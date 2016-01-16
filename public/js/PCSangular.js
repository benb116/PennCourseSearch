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

	$scope.sched = schedFuncObj;

	$scope.Notify = promptNotify;

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