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
            
            // Cleanup to keep incomplete data on the bottom;
            if (isNaN(item.revs.QDratio) || !isFinite(item.revs.QDratio)) {item.revs.QDratio = 0;} 
            // the rating as a string - let's us make the actual rating something else and still show the correct number
            item.revs.cQT = item.revs.cQ.toFixed(2);
            if (item.revs.cQ === 0) {item.revs.cQT = '';}
            item.revs.cDT = item.revs.cD.toFixed(2);
            if (item.revs.cD === 0) {item.revs.cDT = ''; item.revs.QDratio = -100; item.revs.cD = 100}
        });
        return data;
    };
});
PCS.factory('UpdateCourseList', ['httpService', function(httpService){
    var retObj = {};
    retObj.getDeptCourses = function(dept, searchType, reqFilter, proFilter) {
        // Build the request URL
        var url = '/Search?searchType='+searchType+'&resultType=deptSearch&searchParam='+dept;
        if (reqFilter) {url += '&reqParam='+reqFilter;}
        if (proFilter && proFilter !== 'noFilter') {url += '&proParam='+proFilter;}
        ga('send', 'event', 'Search', 'deptSearch', dept);
        return httpService.get(url).then(function(data) {
            return data;
        }, function(err) {
            if (!err.config.timeout.$$state.value) {
                ErrorAlert(err); //  If there's an error, show an error dialog
            } else {
                return [];
            }
        });
    };
    return retObj;
}]);
PCS.factory('UpdateSectionList', ['httpService', function(httpService){
    var retObj = {};
    retObj.getCourseSections = function(course) {
        ga('send', 'event', 'Search', 'numbSearch', course);
        return httpService.get('/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam='+course).then(function(data) {
            return data;
        }, function(err) {
            if (!err.config.timeout.$$state.value) {
                ErrorAlert(err); //  If there's an error, show an error dialog
            } else {
                return [];
            }
        });
    };
    return retObj;
}]);
PCS.factory('UpdateSectionInfo', ['httpService', function(httpService){
    var retObj = {};
    retObj.getSectionInfo = function(section) {
        ga('send', 'event', 'Search', 'sectSearch', section);
        return httpService.get('/Search?searchType=courseIDSearch&resultType=sectSearch&searchParam='+section).then(function(data) {
            return data;
        }, function(err) {
            if (!err.config.timeout.$$state.value) {
                ErrorAlert(err); //  If there's an error, show an error dialog
            } else {
                return {};
            }
        });
    };
    return retObj;
}]);
PCS.factory('UpdateSchedules', ['httpService', function(httpService) {
    var retObj = {};
    retObj.getSchedData = function(secID, needLoc) {
        var url = '/Sched?courseID='+secID;
        if (needLoc) {url += '&needLoc=1';}
        return httpService.get(url).then(function(data) {
            return data;
        }, function(err) {
            if (!err.config.timeout.$$state.value) {
                ErrorAlert(err); //  If there's an error, show an error dialog
            } else {
                return {};
            }
        });
    };
    return retObj;
}]);
// This service keeps track of pending requests
PCS.service('pendingRequests', function() {
  var pending = [];
  this.get = function() {
    return pending;
  };
  this.add = function(request) {
    pending.push(request);
  };
  this.remove = function(request) {
    pending = pending.filter(function(p) {
      return p.url !== request;
    });
  };
  this.cancelAll = function() {
    angular.forEach(pending, function(p) {
      p.canceller.resolve('cancelled');
    });
    pending.length = 0;
  };
});
// This service wraps $http to make sure pending requests are tracked 
PCS.service('httpService', ['$http', '$q', 'pendingRequests', function($http, $q, pendingRequests) {
  this.get = function(url) {
    var canceller = $q.defer();
    pendingRequests.add({
      url: url,
      canceller: canceller
    });
    //Request gets cancelled if the timeout-promise is resolved
    var requestPromise = $http.get(url, { timeout: canceller.promise });
    //Once a request has failed or succeeded, remove it from the pending list
    requestPromise.finally(function() {
      pendingRequests.remove(url);
    });
    return requestPromise;
  }
}]);