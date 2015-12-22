var PCS = angular.module('PCSApp', []);

PCS.controller('CourseController', function ($scope, $http){
	$scope.change = function() {
		$http.get('/Search?searchType=courseIDSearch&resultType=deptSearch&searchParam='+$scope.search).success(function(data) {
			console.log(data);
			$scope.courses = data;

			angular.forEach($scope.courses, function(course, index) {
				var qFrac = course.courseRevs.cQ / 4;
				var dFrac = course.courseRevs.cD / 4;
				course.pcrQShade = Math.pow(qFrac, 2);
				course.pcrDShade = Math.pow(dFrac, 2);
				if (qFrac < 0.35) {course.pcrQColor = 'black';} else {course.pcrQColor = 'white';}
				if (dFrac < 0.35) {course.pcrDColor = 'black';} else {course.pcrDColor = 'white';}
			});

			console.log($scope)
		});
	}
});