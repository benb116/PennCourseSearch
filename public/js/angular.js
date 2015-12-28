var PCS = angular.module('PCSApp', []);

PCS.controller('CourseController', function ($scope, PCR, UpdateCourseList, UpdateSectionList, UpdateSectionInfo){
	$scope.courses = [];
	$scope.sections = [];
	$scope.schedSections = [];
	$scope.starSections = [];
	$scope.currentCourse = {};
	$scope.currentSection = {};


	$scope.searchChange = function() {
		var terms = FormatID($scope.search);
		UpdateCourseList.getDeptCourses(terms[0]).then(function(resp) {
			$scope.courses = resp.data;
		});
		UpdateSectionList.getCourseSections(terms[0]+terms[1]).then(function(resp) {
			$scope.sections = resp.data;
		});
		UpdateSectionInfo.getSectionInfo(terms[0]+terms[1]+terms[2]).then(function(resp) {
			$scope.sectionInfo = resp.data;
		});
	};
	$scope.courseClick = function(cID) {
		$scope.currentCourse = cID;
		UpdateSectionList.getCourseSections(cID).then(function(resp) {
			$scope.sections = resp.data;
		});
	};
	$scope.sectionClick = function(secID) {
		$scope.currentSection = secID;
		UpdateSectionInfo.getSectionInfo(secID).then(function(resp) {
			$scope.sectionInfo = resp.data;
		});
	};
	$scope.sched = function(secID) {
		$scope.schedSections = addrem(secID, $scope.schedSections);
		UpdateSectionList.updateSchedStatus($scope.sections, $scope.schedSections);
	};
	$scope.star = function(secID) {
		addrem(secID, $scope.starSections);
		UpdateSectionList.updateStarStatus($scope.sections, $scope.starSections);
	};

	function addrem (item, array) {
		var index = array.indexOf(item);
		if (index === -1) {
			array.push(item);
		} else {
			array.splice(index, 1);
		}
		return array;
	}

	$scope.$watch('courses', function(val, old) {
		PCR($scope.courses);
	});
	$scope.$watch('sections', function(val, old) {
		PCR($scope.sections);
		UpdateSectionList.updateSchedStatus($scope.sections, $scope.schedSections);
		UpdateSectionList.updateStarStatus($scope.sections, $scope.starSections);
	});
});

PCS.factory('PCR', function(){
	return function PCR(data){
		angular.forEach(data, function(item, index) {
			var qFrac = item.revs.cQ / 4;
			var dFrac = item.revs.cD / 4;
			item.pcrQShade = Math.pow(qFrac, 2);
			item.pcrDShade = Math.pow(dFrac, 2);
			if (qFrac < 0.35) {item.pcrQColor = 'black';} else {item.pcrQColor = 'white';}
			if (dFrac < 0.35) {item.pcrDColor = 'black';} else {item.pcrDColor = 'white';}
		});
		return data;
	};
});

PCS.factory('UpdateCourseList', ['$http', function($http){
	var retObj = {};
	retObj.getDeptCourses = function(dept) {
		return $http.get('/Search?searchType=courseIDSearch&resultType=deptSearch&searchParam='+dept).success(function(data) {
			return data;
		});
	};
	return retObj;
}]);

PCS.factory('UpdateSectionList', ['$http', function($http){
	var retObj = {};
	retObj.getCourseSections = function(course) {
		return $http.get('/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam='+course).success(function(data) {
			return data;
		});
	};
	retObj.updateSchedStatus = function(sections, schedSections) {
		angular.forEach(sections, function(section, index) {
			section.isScheduled = (schedSections.indexOf(section.idDashed) > -1);
		});
	};
	retObj.updateStarStatus = function(sections, starSections) {
		angular.forEach(sections, function(section, index) {
			section.isStarred = (starSections.indexOf(section.idDashed) > -1);
		});
	};
	return retObj;
}]);
PCS.factory('UpdateSectionInfo', ['$http', function($http){
	var retObj = {};
	retObj.getSectionInfo = function(section) {
		return $http.get('/Search?searchType=courseIDSearch&resultType=sectsearch&searchParam='+section).success(function(data) {
			return data;
		});
	};
	return retObj;
}]);

function FormatID(searchTerms) {
    var splitTerms = searchTerms.replace(/ /g, "").replace(/-/g, "").replace(/:/g, ""); // Remove spaces, dashes, and colons

    if (parseFloat(splitTerms[2]) == splitTerms[2]) { // If the third character is a number (e.g. BE100)
        splitTerms = splitTerms.substr(0, 2) + '/' + splitTerms.substr(2); // Splice the search query with a slash after the deptartment
        if (parseFloat(splitTerms[6]) == splitTerms[6]) { // Then, if the sixth character is a number (e.g. BE100001)
            splitTerms = splitTerms.substr(0, 6) + '/' + splitTerms.substr(6, 3); // Splice the search query with a slash after the course number
        }
    } else if (parseFloat(splitTerms[3]) == splitTerms[3]) { // If the fourth character is a number (e.g. CIS110)
        splitTerms = splitTerms.substr(0, 3) + '/' + splitTerms.substr(3); // Splice the search query with a slash after the deptartment 
        if (parseFloat(splitTerms[7]) == splitTerms[7]) { // Then, if the seventh character is a number (e.g. CIS110001)
            splitTerms = splitTerms.substr(0, 7) + '/' + splitTerms.substr(7, 3); // Splice the search query with a slash after the course number
        }
    } else if (parseFloat(splitTerms[4]) == splitTerms[4]) { // If the fifth character is a number (e.g. MEAM110)
        splitTerms = splitTerms.substr(0, 4) + '/' + splitTerms.substr(4); // Splice the search query with a slash after the deptartment
        if (parseFloat(splitTerms[8]) == splitTerms[8]) { // Then, if the eighth character is a number (e.g. MEAM110001)
            splitTerms = splitTerms.substr(0, 8) + '/' + splitTerms.substr(8, 3); // Splice the search query with a slash after the course number
        }
    }
    // At this point the format should be "dept/num/sec"
    // Return as a list
    return splitTerms.split('/');
}