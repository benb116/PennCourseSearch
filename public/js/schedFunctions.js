function Schedule(term) {
	// This is a blank schedule object constructor
	this.term = term; // e.g. "2016A"
	this.meetings = [];
	this.colorPalette = ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#e67e22", "#2ecc71", "#95a5a6", "#FF73FD", "#73F1FF", "#CA75FF", "#1abc9c", "#F64747", "#ecf0f1"]; // Standard colorPalette
}

function SpitSched(schedData) {
	var courseSched = schedData.meetings;

	var schedElement = $('#Schedule');
	var timeColElement = $('#TimeCol');
	// schedElement.empty(); // Clear
	// timeColElement.empty();

	// Set initial values
	var weekdays     = ['M', 'T', 'W', 'R', 'F'];
	var fullWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	var startHour    = 10; // start at 10
	var endHour      = 15; // end at 3pm
	var percentWidth = 20; // five day default
	var incSun       = 0; // no weekends
	var incSat       = 0;

	var sec, day;

	for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
		var secMeetHour = courseSched[sec].meetHour;
		if (secMeetHour <= startHour) { // If there are classes earlier than the default start
			startHour = Math.floor(secMeetHour); // push back the earliest hour
		}
		if (secMeetHour + courseSched[sec].hourLength >= endHour) { // Push back latest hour if necessary
			endHour = Math.ceil(secMeetHour + courseSched[sec].hourLength);
		}
		for (day in courseSched[sec].meetDay) { if (courseSched[sec].meetDay.hasOwnProperty(day)) {
			var letterDay = courseSched[sec].meetDay[day];
			if (letterDay === 'U') { // If there are sunday classes
				incSun = 1;
			}
			if (letterDay === 'S') { // If there are saturday classes
				incSat = 1;
			}
		}}
	}}

	if (incSun === 1) {
		weekdays.unshift('U');
		fullWeekdays.unshift('Sunday');
	} // Update weekdays array if necessary
	if (incSat === 1) {
		weekdays.push('S');
		fullWeekdays.push('Saturday');
	}

	percentWidth = 100 / weekdays.length; // Update the block width if necessary
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
		for (var daynum in weekdays) { if (weekdays.hasOwnProperty(daynum)) {
			schedHTML += '<div class="DayName" style="width:' + percentWidth + '%;">' + fullWeekdays[daynum] + '</div>';
		}}
		schedElement.html(schedHTML);
		timeColElement.html(timeColHTML);
	} else {
		schedElement.html('<p style="font-size:1.5em;margin-top:7em;display:block;margin-right:45px;">Search for courses above <br>then click a section\'s + icon to add it to the schedule.</p><p style="font-size:1em;margin-right:45px;">These are mock schedules.<br> You still need to register for your classes on Penn InTouch.</p>'); // Clear
		timeColElement.empty();
	}

	// Define the color map
	var colorMap = {};
	var colorinc = 0;
	var colorPal = schedData.colorPalette;
	for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
		var secID = courseSched[sec].idDashed;
		if (!colorMap[secID]) {
			colorMap[secID] = colorPal[colorinc];
			colorinc++;
		}
	}}

	var secArray = courseSched.map(function(meeting) {
		return meeting.idDashed;
	});
	// Add the blocks
	for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
		for (day in courseSched[sec].meetDay) { if (courseSched[sec].meetDay.hasOwnProperty(day)) {
			var meetLetterDay   = courseSched[sec].meetDay[day]; // On which day does this meeting take place?
			var blockleft       = weekdays.indexOf(meetLetterDay) * percentWidth;
			var blocktop        = (courseSched[sec].meetHour - startHour) * halfScale + 9; // determine top spacing based on time from startHour (offset for prettiness)
			var blockheight     = courseSched[sec].hourLength * halfScale;
			var blockname       = courseSched[sec].idSpaced;
			var meetRoom        = courseSched[sec].meetLoc;
			var thiscol         = (colorMap[courseSched[sec].idDashed] || "#E6E6E6"); // Get the color
			var newid           = courseSched[sec].idDashed+'-'+meetLetterDay+courseSched[sec].meetHour.toString().replace(".", "");

			schedElement.append('<div class="SchedBlock ' + courseSched[sec].idDashed + ' ' + meetLetterDay + '" id="' + newid + // Each block has three classes: SchedBlock, The courseSched entry, and the weekday. Each block has a unique ID
				'" style="top:' + blocktop +
				'%;left:' + blockleft +
				'%;width:' + percentWidth +
				'%;height:' + blockheight +
				'%;background-color:' + thiscol +
				'"><div class="CloseX">x</div><span class="SecName">' + blockname + '</span><br><span class="LocName">' + meetRoom + '</span></div>');

			$('#'+newid).click(function() {
				angular.element(this).scope().initiateSearch($(this).attr('id'), 'courseIDSearch');
			});
			$('#'+newid+'> .CloseX').click(function(e) {
				e.stopPropagation();
				angular.element(this).scope().sched.AddRem($(this).parent().attr('id'));
			});

			$('.SchedBlock').each(function() { // Check through each previously added meettime
				var thisBlock   = $(this);
				var oldClasses  = thisBlock.attr('class').split(' ');
				var oldMeetFull = oldClasses[1]; // Get the courseSched key (so we can get the meetHour and hourLength values)
				var oldMeetDay  = oldClasses[2]; // Don't compare blocks on different days cause they can't overlap anyway
				if (oldMeetFull !== courseSched[sec].idDashed && oldMeetDay === meetLetterDay) { // If we aren't comparing a section to itself & if the two meetings are on the same day
					var oldMeetData = courseSched[secArray.indexOf(oldMeetFull)];
					if (TwoOverlap(oldMeetData, courseSched[sec])) { // Check if they overlap
						var oldBlockWidth = thisBlock.outerWidth() * 100 / $('#Schedule').outerWidth();
						thisBlock.css('width', (oldBlockWidth / 2) + '%'); // Resize old block
						var newElement = $('#' + newid);
						var newleft = (newElement.offset().left - schedElement.offset().left) * 100 / schedElement.outerWidth(); // Get shift in terms of percentage, not pixels
						// If a block overlaps with two different blocks, then we only want to shift it over once.
						// The TwoOverlap function only checks vertical overlap
						var plusOffset;
						if (thisBlock.offset().left === newElement.offset().left) { // If we haven't shifted the new block yet
							plusOffset = oldBlockWidth / 2;
						} else { //
							plusOffset = 0;
						}
						newElement.css('left', newleft + plusOffset + '%').css('width', (oldBlockWidth / 2) + '%'); // Shift and resize new block
					}
				}
			});
		}}
	}
	// $('.SchedBlock').click(function(e, elem) {
	// 	console.log('33')
	// 	console.log(this);
	// });
	// $('.CloseX').click(function(e) {
	// 	e.stopPropagation();
	// 	console.log('t')
	// })
}

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
		if (b1 <= y2 || b2 <= y1) {
			return false;
		} else {
			return true;
		}
	}
}