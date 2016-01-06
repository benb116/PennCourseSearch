var PCS = angular.module('PCSApp', ['LocalStorageModule']);

PCS.controller('CourseController', function ($scope, $http, $filter, localStorageService, PCR, UpdateCourseList, UpdateSectionList, UpdateSectionInfo, UpdateSchedules){
	$scope.clearSearch = function() {
		$scope.search = '';
		$scope.courses = [];
		$scope.sections = [];
		$scope.sectionInfo = {};
		$scope.currentDept = '';
		$scope.currentCourse = '';
		$scope.currentSection = '';
		$scope.schedSections = [];
		$scope.searchType = "courseIDSearch";
		$scope.loading = ($http.pendingRequests.length !== 0);
		$scope.courseSort = 'idDashed';
		$scope.showClosed = true;
		$scope.showAct = 'noFilter';
		$scope.showReq = ['noFilter'];
		$scope.showPro = 'noFilter';
		$scope.check = {};
		$scope.checkArr = [];
	};
	$scope.clearSearch();

	localStorageService.bind($scope, 'schedData');
	localStorageService.bind($scope, 'starSections');

	if (!$scope.schedData || !Object.keys($scope.schedData).length) {
		$scope.schedData = {};
		$scope.schedData.Schedule = new Schedule('2016A');
	}

	$scope.starSections = ($scope.starSections || []);
	$scope.schedules = Object.keys($scope.schedData);
	$scope.currentSched = $scope.schedules[0];
	$scope.currentSchedData = $scope.schedules[$scope.currentSched];

	$scope.searchChange = function() {
		delay(function() {
			$scope.initiateSearch($scope.search);
		}, 500);
	};
	$scope.initiateSearch = function(param, courseType) {
		var terms = FormatID(param);
		if(terms[0]) {
			$scope.get.Courses(terms[0], courseType);
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
				if (sec.length < 3) {
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
			if ($scope.schedSections.indexOf(secID) === -1) {
				UpdateSchedules.getSchedData(secID).then(function(resp) {
						var oldData = $scope.schedData[$scope.currentSched].meetings;
						newData = oldData.concat(resp.data);
						$scope.schedData[$scope.currentSched].meetings = newData;
					});
			} else {
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
                if (!Object.keys($scope.schedData).length) {
                	$scope.schedData.Schedule = new Schedule('2016');
                }
                $scope.currentSched = Object.keys($scope.schedData)[Object.keys($scope.schedData).length-1];
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
		}
	};
	$scope.Notify = function (secID) {
		promptNotify(secID);
	};

	$scope.$watch('courses', function(val, old) {
		PCR($scope.courses);
	});
	$scope.$watch('sections', function(val, old) {
		PCR($scope.sections);
	});
	$scope.$watch('schedData', function(val, old) {
		SpitSched($scope.schedData[$scope.currentSched]);
		$scope.schedSections = $scope.schedData[$scope.currentSched].meetings.map(function(value, index) {
			return $scope.schedData[$scope.currentSched].meetings[index].idDashed;
		});
		$scope.schedules = Object.keys($scope.schedData);
	}, true);
	$scope.$watch('currentSched', function(val, old) {
		SpitSched($scope.schedData[$scope.currentSched]);
		$scope.schedSections = $scope.schedData[$scope.currentSched].meetings.map(function(value, index) {
			return $scope.schedData[$scope.currentSched].meetings[index].idDashed;
		});
		$scope.schedules = Object.keys($scope.schedData);
	}, true);
	$scope.$watch('check', function(val, old){
		$scope.checkArr = [];
		for (var req in $scope.check) {
			if ($scope.check[req]) {$scope.checkArr.push(req);}
		}
		if (!($scope.courses.length && $scope.currentDept !== '') && $scope.checkArr.length == 1) {
			$scope.get.Courses($scope.currentDept, null, $scope.checkArr[0]);
		}
	}, true);
	$scope.$watch('showPro', function(val, old) {
		$scope.get.Courses($scope.currentDept, null, $scope.checkArr[0]);
	});
	$scope.$watch(function() {
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
			item.pcrQShade = Math.pow(qFrac, 3)*2;
			item.pcrDShade = Math.pow(dFrac, 3)*2;
			if (qFrac < 0.35) {item.pcrQColor = 'black';} else {item.pcrQColor = 'white';}
			if (dFrac < 0.35) {item.pcrDColor = 'black';} else {item.pcrDColor = 'white';}
			item.revs.QDratio = item.revs.cQ / item.revs.cD;
			if (isNaN(item.revs.QDratio) || !isFinite(item.revs.QDratio)) {item.revs.QDratio = 0;}
		});
		return data;
	};
});
PCS.factory('UpdateCourseList', ['$http', function($http, PCR){
	var retObj = {};
	retObj.getDeptCourses = function(dept, searchType, reqFilter, proFilter) {
		var url = '/Search?searchType='+searchType+'&resultType=deptSearch&searchParam='+dept;
		if (reqFilter) {url += '&reqParam='+reqFilter;}
		if (proFilter && proFilter !== 'noFilter') {url += '&proParam='+proFilter;}
		return $http.get(url).then(function(data) {
			return data;
		}, function(err) {
			ErrorAlert(err);
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