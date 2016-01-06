$(document).ready(function() {

	$('a[rel*=leanModal]').leanModal({
	    top: 70,
	    closeButton: ".modal_close"
	}); // Define modal close button

	var subtitles = [
		"Cause PennInTouch sucks", 
		"You can press the back button, but you don't even need to.",
		"Invented by Benjamin Franklin in 1793",
		"Focus on your classes, not your schedule.",
		"Faster than you can say 'Wawa run'",
		"Classes sine PennCourseSearch vanae.",
		"On PennCourseSearch, no one knows you're Amy G.",
		"Designed by Ben in Speakman. Assembled in China.",
		"Help! I'm trapped in a NodeJS server! Bring Chipotle!",
		"Actually in touch."
	];
	var paymentNoteBase = "https://venmo.com/?txn=pay&recipients=BenBernstein&amount=1&share=f&audience=friends&note=";
	var paymentNotes = [
		"PennCourseSearch%20rocks%20my%20socks!",
		"Donation%20to%20PennInTouch%20Sucks,%20Inc.",
		"For%20your%20next%20trip%20to%20Wawa"
	];
	$('#subtitle').html(subtitles[Math.floor(Math.random() * subtitles.length)]);
	$('#paymentNote').attr('href', paymentNoteBase + paymentNotes[Math.floor(Math.random() * paymentNotes.length)]);

	if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) { // Doesn't look good on mobile, so tell the user
        setTimeout(function() {
            sweetAlert({
                title: 'PCS Alert',
                text: "Your device seems to be too small. PCS does not currently support mobile viewing, but we're looking to add it soon!",
                type: 'warning'
            });
        }, 300);
    } else {
    	$.get('/Status').done(function(statusMessage) {
    		if (statusMessage !== 'hakol beseder') { // If there is a status message from the server, it will be passed in the #StatusMessage block
	            setTimeout(function() {
	                sweetAlert({
	                    title: 'PCS Alert',
	                    html: true,
	                    text: statusMessage,
	                    type: 'warning'
	                });
	            }, 300);
	            console.log(statusMessage);
        	}
    	});
    }
});

function ErrorAlert(err) {
    console.log(err);
    sweetAlert({
        title: '#awkward',
        html: true,
        text: 'An error occured. Refresh or email <a href="mailto:bernsb@seas.upenn.edu?Subject=PCS%20IS%20BROKEN!!!!&body='+encodeURIComponent(JSON.stringify(err))+'">Ben</a>',
        type: 'error'
    });
}

function Schedule(term) {
	this.term = term;
	this.meetings = [];
	this.colorPalette = ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#e67e22", "#2ecc71", "#95a5a6", "#FF73FD", "#73F1FF", "#CA75FF", "#1abc9c", "#F64747", "#ecf0f1"];
}

function Uniquify (name, arr) {
	if (arr.indexOf(name) === -1) {
		return name;
	} else {
		var lastchar = name[name.length - 1];
		if (isNaN(lastchar) || name[name.length - 2] !== ' ') { // e.g. 'schedule' or 'ABC123'
			name += ' 2';
		} else { // e.g. 'MEAM 101 2'
			name = name.slice(0, -2) + ' ' + (parseInt(lastchar) + 1);
		}
		return Uniquify(name, arr);
	}
}

var delay = (function() {var timer = 0;return function(callback, ms) {clearTimeout(timer);timer = setTimeout(callback, ms);};})();

shuffle = function(v) {
    for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
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

function validEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function promptNotify (secID) {
	secID = secID.replace(/-/g, ' ');
	var email;
	if (localStorage.email) {
		email = localStorage.email;
	} else {
		email = '';
	}
	sweetAlert({
		title: "PennCourseNotify",
		text: "Please enter your email for notifications for "+secID,
        type: "input",
        inputPlaceholder: "bfrank@sas.upenn.edu",
        inputValue: email,
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top"
	}, function(inputValue) {
        if (inputValue === false) {
            return false;
        } else if (inputValue === "") {
            sweetAlert.showInputError("Please enter an email address");
            return false;
        } else if (!validEmail(inputValue)) { // If the user put in a name that already exists
            sweetAlert.showInputError('Please enter a valid email');
        } else {
        	email = inputValue;
        	localStorage.email = email;
            registerNotify(secID, email);
        }
    });
}

function registerNotify(secID, email) {
	sweetAlert({title: 'Requesting'});
	$.post('/Notify?secID='+secID+'&email='+email).done(function(res, one, two) {
		var stat;
		if (two.status === 200) {
			stat = 'success';
		} else {
			stat = 'error';
		}
		sweetAlert({
			text: res,
			title: 'PennCourseNotify',
			type: stat,
			timer: 3000
		});
	});
}

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
    var retArr = splitTerms.split('/');
    retArr[0] = (retArr[0] || '');
    retArr[1] = (retArr[1] || '');
    retArr[2] = (retArr[2] || '');
    return retArr;
}

function SpitSched(schedData) {
    var courseSched = schedData.meetings;

    var schedElement = $('#Schedule');
    var timeColElement = $('#TimeCol');
    // schedElement.empty(); // Clear
    // timeColElement.empty();

    // Set initial values
    var weekdays = ['M', 'T', 'W', 'R', 'F'];
    var fullWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    var startHour = 10; // start at 10
    var endHour = 15; // end at 3pm
    var percentWidth = 20; // five day default
    var incSun = 0; // no weekends
    var incSat = 0;

    var sec, day;

    for (sec in courseSched) {
        if (courseSched.hasOwnProperty(sec)) {
            var secMeetHour = courseSched[sec].meetHour;
            if (secMeetHour <= startHour) { // If there are classes earlier than the default start
                startHour = Math.floor(secMeetHour); // push back the earliest hour
            }
            if (secMeetHour + courseSched[sec].hourLength >= endHour) { // Push back latest hour if necessary
                endHour = Math.ceil(secMeetHour + courseSched[sec].hourLength);
            }
            for (day in courseSched[sec].meetDay) {
                var letterDay = courseSched[sec].meetDay[day];
                if (letterDay === 'U') { // If there are sunday classes
                    incSun = 1;
                }
                if (letterDay === 'S') { // If there are saturday classes
                    incSat = 1;
                }
            }
        }
    }

    if (incSun === 1) {
        weekdays.unshift('U');
        fullWeekdays.unshift('Sunday');
    } // Update weekdays array if necessary
    if (incSat === 1) {
        weekdays.push('S');
        fullWeekdays.push('Saturday');
    }

    percentWidth = 100 / (5 + incSun + incSat); // Update the block width if necessary
    var halfScale = 95 / (endHour - startHour + 1); // This defines the scale to be used throughout the scheduling process
    // + 1 keeps the height inside the box

    // Make the lines and time labels
    var schedHTML = '';
    var timeColHTML = '';
    if (!($.isEmptyObject(courseSched))) {
        for (var i = 0; i <= (endHour - startHour); i++) { // for each hour
            var toppos = (i) * halfScale + 7.5; // each height value is linearly spaced with an offset
            var hourtext = Math.round(i + startHour); // If startHour is not an integer, make it pretty
            if (hourtext > 12) {
                hourtext -= 12;
            } // no 24-hour time
            timeColHTML += '<div class="TimeBlock" style="top:' + toppos + '%">' + hourtext + ':00</div>'; // add time label
            schedHTML += '<hr width="99.7%"style="top:' + toppos + '%" >'; // add time line
        }
        for (var daynum in weekdays) {
            schedHTML += '<div class="DayName" style="width:' + percentWidth + '%;">' + fullWeekdays[daynum] + '</div>';
        }
        schedElement.html(schedHTML);
        timeColElement.html(timeColHTML);
    } else {
        schedElement.html('<p style="font-size:1.5em;margin-top:7em;display:block;margin-right:45px;">Click a section\'s + icon to add it to the schedule.</p><p style="font-size:1em;margin-right:45px;">These are mock schedules.<br> You still need to register for your classes on Penn InTouch.</p>'); // Clear
        timeColElement.empty();
    }

    // Define the color map
    var colorMap = {};
    var colorinc = 0;
    var colorPal = schedData.colorPalette;
    for (sec in courseSched) {
    	var secID = courseSched[sec].idDashed;
    	if (!colorMap[secID]) {
    		colorMap[secID] = colorPal[colorinc];
    		colorinc++;
    	}
    }

    // Add the blocks
    for (sec in courseSched) {
        // if (courseSched.hasOwnProperty(sec)) {
            for (day in courseSched[sec].meetDay) {
                // if (courseSched[sec].meetDay.hasOwnProperty(day)) { // some sections have multiple meeting times and days

                    var meetLetterDay   = courseSched[sec].meetDay[day]; // On which day does this meeting take place?
                    var blockleft       = weekdays.indexOf(meetLetterDay) * percentWidth;
                    var blocktop        = (courseSched[sec].meetHour - startHour) * halfScale + 9; // determine top spacing based on time from startHour (offset for prettiness)
                    var blockheight     = courseSched[sec].hourLength * halfScale;
                    var blockname       = courseSched[sec].idSpaced;
                    var meetRoom        = courseSched[sec].meetLoc;
                    var thiscol         = (colorMap[courseSched[sec].idDashed] || "#E6E6E6"); // Get the color
                    var newid 			= courseSched[sec].fullID.replace(".", "");

                    schedElement.append('<div onclick="angular.element(this).scope().initiateSearch(\''+courseSched[sec].idDashed+'\', \'courseIDSearch\')" class="SchedBlock ' + courseSched[sec].idDashed + ' ' + meetLetterDay + '" id="' + newid + // Each block has three classes: SchedBlock, The courseSched entry, and the weekday. Each block has a unique ID
                        '" style="top:' + blocktop +
                        '%;left:' + blockleft +
                        '%;width:' + percentWidth +
                        '%;height:' + blockheight +
                        '%;background-color:' + thiscol +
                        '"><div class="CloseX" onclick="angular.element(this).scope().sched.AddRem(\''+courseSched[sec].idDashed+'\')">x</div><span class="SecName">' + blockname + '</span><br><span class="LocName">' + meetRoom + '</span></div>');

                    // $('.SchedBlock').each(function(i) { // Check through each previously added meettime
                    //     var thisBlock = $(this);
                    //     var oldClasses = thisBlock.attr('class').split(' ');
                    //     var oldMeetFull = oldClasses[1]; // Get the courseSched key (so we can get the meetHour and hourLength values)
                    //     var oldMeetDay = oldClasses[2]; // Don't compare blocks on different days cause they can't overlap anyway
                    //     console.log(oldClasses)
                    //     if (oldMeetFull !== courseSched[sec].idDashed && oldMeetDay === meetLetterDay) { // If we aren't comparing a section to itself & if the two meetings are on the same day
                    //         if (TwoOverlap(courseSched[oldMeetFull], courseSched[sec])) { // Check if they overlap
                    //             var oldBlockWidth = thisBlock.outerWidth() * 100 / $('#Schedule').outerWidth();
                    //             thisBlock.css('width', (oldBlockWidth / 2) + '%'); // Resize old block
                    //             var newElement = $('#' + newid);
                    //             var newleft = (newElement.offset().left - schedElement.offset().left) * 100 / schedElement.outerWidth(); // Get shift in terms of percentage, not pixels
                    //             // If a block overlaps with two different blocks, then we only want to shift it over once.
                    //             // The TwoOverlap function only checks vertical overlap
                    //             var plusOffset;
                    //             if (thisBlock.offset().left === newElement.offset().left) { // If we haven't shifted the new block yet
                    //                 plusOffset = oldBlockWidth / 2;
                    //             } else { //
                    //                 plusOffset = 0;
                    //             }
                    //             newElement.css('left', newleft + plusOffset + '%').css('width', (oldBlockWidth / 2) + '%'); // Shift and resize new block
                    //         }
                    //     }
                    // });
                // }
            }
        // }
    }

    // sessionStorage.currentSched = schedName;
    // UpdatePlusCancel();

    function TwoOverlap(block1, block2) {
	    // Thank you to Stack Overflow user BC. for the function this is based on.
	    // http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
	    var y1 = block1.meetHour;
	    var h1 = block1.hourLength;
	    var b1 = y1 + h1;

	    var y2 = block2.meetHour;
	    var h2 = block2.hourLength;
	    var b2 = y2 + h2;

	    // This checks if the top of block 2 is lower down (higher value) than the bottom of block 1...
	    // or if the top of block 1 is lower down (higher value) than the bottom of block 2.
	    // In this case, they are not overlapping, so return false
	    if (b1 <= y2 || y1 >= b2)
	        return false;
	    return true;
	}
}