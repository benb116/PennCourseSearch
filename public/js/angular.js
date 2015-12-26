var PCS = angular.module('PCSApp', []);

PCS.controller('CourseController', function ($scope, $http, PCR, UpdateCourseList, UpdateSectionList){
	$scope.courses, $scope.sections, $scope.schedSections, $scope.starSections = [];
	$scope.currentCourse, $scope.currentSection = {};


	$scope.searchChange = function() {
		UpdateCourseList.getDeptCourses($scope.search).then(function(resp) {
			$scope.courses = resp.data;
		});
	};
	$scope.courseClick = function(cID) {
		$scope.currentCourse = cID;
		UpdateSectionList.getCourseSections(cID).then(function(resp) {
			$scope.sections = resp.data;
		});
	};

	$scope.$watch('courses', function(newValue, oldValue) {
		PCR($scope.courses);
	});
	$scope.$watch('sections', function(newValue, oldValue) {
		PCR($scope.sections);
		UpdateSectionList.updatePlusCross($scope.sections, $scope.schedSections);
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
			console.log(data)
			return data;
		});
	};
	retObj.updatePlusCross = function(sections) {

	};
	return retObj;
}]);