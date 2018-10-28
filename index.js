console.time('Modules loaded');
// Initial configuration
var path        = require('path');
var express     = require('express');
var compression = require('compression');
var request     = require('request');
var Keen        = require('keen-js');
var git         = require('git-rev');
var helmet      = require('helmet');
require('log-timestamp')(function() { return new Date().toISOString() + ' %s'; });

console.timeEnd('Modules loaded');

// I don't want to host a config file on Github. When running locally, the app has access to a local config file.
// In production, there is no config file so I use environment variables instead
var config;
try {
    config = require('./config.js');
} catch (err) { // If there is no config file
    config = {};
    config.requestAB      = process.env.REQUESTAB;
    config.requestAT      = process.env.REQUESTAT;
    config.PCRToken       = process.env.PCRTOKEN;
    config.KeenIOID       = process.env.KEEN_PROJECT_ID;
    config.KeenIOWriteKey = process.env.KEEN_WRITE_KEY;
    config.autotestKey    = process.env.AUTOTESTKEY;
}

// Set express settings
var app = express();
app.use(compression());
app.use(helmet()); // Hides certain HTTP headers, supposedly more secure?

if (process.env.NODE_ENV !== 'production') {
    // I want this to have the client always pull the newest JS, since uodates happen very often.
    // IDK if this is the best way to do that.
    app.use('/js/plugins', express.static(path.join(__dirname, 'public/js/plugins'), { maxAge: 2628000000 }));
    app.use('/js', express.static(path.join(__dirname, 'public/js'), { maxAge: 0 }));
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: 2628000000 }));
}

console.log('Express initialized');

// Set up Keen Analytics
var client;
var keenEnable = true;
if (process.env.NODE_ENV === 'production' && keenEnable) { // Only log from production
    console.log('KeenIO logging enabled');
    client = new Keen({
        projectId: config.KeenIOID,    // String (required always)
        writeKey: config.KeenIOWriteKey     // String (required for sending data)
    });
}
function logEvent(eventName, eventData) {
    if (client) {
        client.addEvent(eventName, eventData, function (err) {
            if (err) {
                console.log("KEENIOERROR: " + err);
            }
        });
    }
}

console.log('Plugins initialized');

git.short(function (str) {
    console.log('Current git commit:', str); // log the current commit we are running
});

var currentTerm = '2018C'; // Which term is currently active
var LRTimes = [0, 0]; // Timestamps of latest requests using each OpenData key (see OpenData.js)
var ODkeyInd = 0; // Which key to use next

// Pull in external data and functions
var allCourses = require('./loadCourses.js')(currentTerm); // Get array of all courses
var parse = require('./parse.js'); // Load the parsing functions
var opendata = require('./opendata.js')(95);

var listenPort = 3000;
if (process.argv[1].includes('beta')) { // If running in the staging environment, run on a different port
    listenPort = 3001;
}

// Start the server
app.listen(listenPort, function(){
    console.log("Node app is running on port "+listenPort+". Better go catch it.");
});

// Handle main page requests
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname+'/public/index.html'));
});

// Handle status requests. This lets the admin disseminate info if necessary
app.get('/Status', function(req, res) {
    var statustext = 'hakol beseder'; // Means "everything is ok" in Hebrew
    // statustext = 'Penn InTouch is being MERT\'ed right now, so PennCourseSearch may not work correctly. Please try again later if you run into issues.'
    
    // Penn InTouch often is refreshing data between 1:00 AM and 5:00 AM, which renders the API useless.
    // This is just letting the user know.
    var now = new Date();
    var hour = now.getHours();
    if (hour >= 1 && hour < 5) {
        statustext = "Penn InTouch sometimes screws up around this time of night, which can cause problems with PennCourseSearch. <br> Sorry in advance.";
    }
    return res.send(statustext);
});

var searchTypes = {
    courseIDSearch: '&course_id=',
    keywordSearch: '&description=',
    instSearch: '&instructor='
};

var filterURI = {
    reqFilter: '&fulfills_requirement=',
    proFilter: '&program=',
    actFilter: '&activity=',
    includeOpen: '&open=true'
};

var buildURI = function (filter, type) { // Build the request URI given certain filters and requirements
    if (typeof filter === 'undefined') {
        return '';
    } else {
        if (type === 'includeOpen') {
            return filterURI[type];
        } else {
            return filterURI[type] + filter;
        }
    }
};

var BASE_URL = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?number_of_results_per_page=500&term=';

// Manage search requests
app.get('/Search', function(req, res) {
    var searchParam    = req.query.searchParam;    // The search terms
    var searchType     = req.query.searchType;     // Course ID, Keyword, or Instructor
    console.log("Search type "+searchType);
    var resultType     = req.query.resultType;     // Course numbers, section numbers, section info
    var instructFilter = req.query.instFilter;     // Is there an instructor filter?

    // Keen.io logging
    if (searchParam) {
        var searchEvent = {searchParam: searchParam};
        logEvent('Search', searchEvent);
    }

    if (searchType === 'courseIDSearch' && resultType === 'deptSearch' && !req.query.proParam) { // If we can return results from cached data
        var returnCourses = allCourses;

        if (searchParam) { // Filter by department
            returnCourses = returnCourses.filter(function(obj) {return (obj.idDashed.split('-')[0] === searchParam.toUpperCase());});
        }
        if (req.query.reqParam) { // Filter by requirement
            returnCourses = returnCourses.filter(function(obj) {return ((obj.courseReqs.indexOf(req.query.reqParam) > -1));});
        }

        retC = parse.DeptList(returnCourses);
        return res.send(returnCourses);

    } else { // Otherwise, ask the API
        // Building the request URI
        var reqSearch = buildURI("", 'reqFilter');
        // Don't try to ask API about Wharton and Engineering requirements
        if (!(req.query.reqParam && (req.query.reqParam.charAt(0) === "W" || req.query.reqParam.charAt(0) === "E"))) {

            // For some reason, these two req codes need extra characters at the end when searching the API
            if (req.query.reqParam === 'MDO' || req.query.reqParam === 'MDN') {
                req.query.reqParam += ',MDB';
            }
            reqSearch = buildURI(req.query.reqParam, 'reqFilter');
        }

        var proSearch   = buildURI(req.query.proParam, 'proFilter');
        var actSearch   = buildURI(req.query.actParam, 'actFilter');
        var includeOpen = buildURI(req.query.openAllow, 'includeOpen');

        var baseURL = BASE_URL + currentTerm + reqSearch + proSearch + actSearch + includeOpen;
        if (searchType) {
            baseURL += searchTypes[searchType] + searchParam;
        }
        // If we are searching by a certain instructor, the course numbers will be filtered because of searchType 'instSearch'.
        // However, clicking on one of those courses will show all sections, including those not taught by the instructor.
        // instructFilter is an extra parameter that allows further filtering of section results by instructor.
        if (instructFilter !== 'all' && typeof instructFilter !== 'undefined') {
            baseURL += '&instructor=' + instructFilter;
        }

        // Send request to OpenData and record the timestamp of the request. Arguments:
            // requestURL
            // parse function to send result
            // res function to send response to client
            // Latest timestamp
            // Auth key to use
        LRTimes[ODkeyInd] = opendata.RateLimitReq(baseURL, resultType, res, LRTimes[ODkeyInd], ODkeyInd);
        ODkeyInd = 1 - ODkeyInd; // Use the other auth key next time
    }
});

// Manage scheduling requests
app.get('/Sched', function(req, res) {
    var courseID = req.query.courseID;
    var needLoc = req.query.needLoc;
    var uri = 'https://esb.isc-seo.upenn.edu/8091/open_data/course_section_search?term='+currentTerm+'&course_id='+courseID;
    var schedEvent = {schedCourse: courseID};
    if (!needLoc) {logEvent('Sched', schedEvent);}
    LRTimes[ODkeyInd] = opendata.RateLimitReq(uri, 'schedInfo', res, LRTimes[ODkeyInd], ODkeyInd);
    ODkeyInd = 1 - ODkeyInd;
});

// Handle requests with penncoursenotify
app.post('/Notify', function(req, res) {
    var secID = req.query.secID;
    // var formatSecID = secID.replace(/-/g, ' ');
    var userEmail = req.query.email;

    logEvent('Notify', {notifySec: secID});
    request({
            uri: 'http://www.penncoursenotify.com/',
            method: "POST",
            form: {'course': secID, 'email': userEmail}
        }, function(error, response, body) {
            var returnText = "Sorry, there was an error while trying set up notifications.";
            res.statusCode = 201;
            if (error) {
                console.log('PCN req error:', error);
            } else {
                try {
                    if (response.statusCode === 406) {
                        returnText = "Notifications already requested.";
                        res.statusCode = 200;
                    } else if (body.split('<h3>')[1].split('</h3>')[0] === "Success!") {
                        returnText = "Great! You'll be notified if "+secID+" opens up.";
                        res.statusCode = 200;
                    }
                } catch(err) {
                    console.log('Notify Error:', err);
                }
            }
            return res.send(returnText);
    });
});