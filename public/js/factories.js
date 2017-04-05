PCS.factory('PCR', function(){
	return function PCR(data){
		angular.forEach(data, function(item) {
			var qFrac = item.revs.cQ / 4;
			var dFrac = item.revs.cD / 4;
			var iFrac = item.revs.cI / 4;
			item.pcrQShade = Math.pow(qFrac, 3)*2; // This is the opacity of the PCR block
			item.pcrDShade = Math.pow(dFrac, 3)*2;
			item.pcrIShade = Math.pow(iFrac, 3)*2;
			if (qFrac < 0.50) {item.pcrQColor = 'black';} else {item.pcrQColor = 'white';} // It's hard to see white text on a light background
			if (dFrac < 0.50) {item.pcrDColor = 'black';} else {item.pcrDColor = 'white';}
			if (iFrac < 0.50) {item.pcrIColor = 'black';} else {item.pcrIColor = 'white';}
			item.revs.QDratio = item.revs.cQ - item.revs.cD; // This is my way of calculating if a class is "good and easy." R > 1 means good and easy, < 1 means bad and hard
			if (isNaN(item.revs.QDratio) || !isFinite(item.revs.QDratio)) {item.revs.QDratio = 0;} // Cleanup to keep incomplete data on the bottom;
		});
		return data;
	};
});
PCS.factory('UpdateCourseList', ['$http', function($http){
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
	retObj.getSchedData = function(secID, needLoc) {
		var url = '/Sched?courseID='+secID;
		if (needLoc) {url += '&needLoc=1';}
		return $http.get(url).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err);
		});
	};
	return retObj;
}]);