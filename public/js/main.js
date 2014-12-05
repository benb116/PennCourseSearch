var CurrentCourses = {};

$(document).ready(function() {
	var delay = (function(){
	  var timer = 0;
	  return function(callback, ms){
	    clearTimeout (timer);
	    timer = setTimeout(callback, ms);
	  };})();

	LoadingSum = 0;

	LoadingSum += 1;
	LoadingIndicate()
	$.get("/Sched?addRem=blank&courseID=blank") // Make the request
	.done(function(data) {
		SpitSched(data)
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});

	var TitleHidden = true;
	$('#InfoPanel span').click(function() {
		if ($(this).html() == 'Toggle course titles') {
			$('.CourseTitle').toggle();
			TitleHidden = !TitleHidden;
		}
		if ($(this).html() == 'Clear All') {
			LoadingSum += 1;
			$.get("/Sched?addRem=clear")
			.always(function() {
				LoadingSum -= 1;
				LoadingIndicate()
			});
			SpitSched()
		}
	});


   	$('#CSearch').on('input', function(){ // When the search terms change
		delay(function(){ // Don't check instantaneously
		  	var searchTerms = $('#CSearch').val(); // Get raw search

			try {
				if (searchTerms != "" && searchTerms != 'favicon.ico' && searchTerms != 'blank') { // Initial filtering
					// Format search terms for server request
					splitTerms = searchTerms.replace(/ /g, "").replace(/-/g, ""); // Replace spaces and dashes

					//If the user enters everything without spaces or dashes
					if (parseFloat(splitTerms[2]) == splitTerms[2]) { // If the third character is a number (e.g. BE100)
						splitTerms = splitTerms.substr(0, 2)+'/'+splitTerms.substr(2); // Splice the search query with a slash after the deptartment

						if (parseFloat(splitTerms[6]) == splitTerms[6]) { // Then, if the sixth character is a number (e.g. BE100001)
							splitTerms = splitTerms.substr(0, 6)+'/'+splitTerms.substr(6); // Splice the search query with a slash after the course number
						}
					} else if (parseFloat(splitTerms[3]) == splitTerms[3]) { // If the fourth character is a number (e.g. CIS110)
						splitTerms = splitTerms.substr(0, 3)+'/'+splitTerms.substr(3); // Splice the search query with a slash after the deptartment

						if (parseFloat(splitTerms[7]) == splitTerms[7]) { // Then, if the seventh character is a number (e.g. CIS110001)
							splitTerms = splitTerms.substr(0, 7)+'/'+splitTerms.substr(7); // Splice the search query with a slash after the course number
						}
					} else if (parseFloat(splitTerms[4]) == splitTerms[4]) { // If the fifth character is a number (e.g. MEAM110)
						splitTerms = splitTerms.substr(0, 4)+'/'+splitTerms.substr(4); // Splice the search query with a slash after the deptartment

						if (parseFloat(splitTerms[8]) == splitTerms[8]) { // Then, if the eighth character is a number (e.g. MEAM110001)
							splitTerms = splitTerms.substr(0, 8)+'/'+splitTerms.substr(8); // Splice the search query with a slash after the course number
						}
					};
					// By now the search terms should be 'DEPT/NUM/SEC/' although NUM/ and SEC/ may not be included
					var deptSearch = splitTerms.split("/")[0]; // Get deptartment
					var numbSearch = splitTerms.split("/")[1]; // Get course number
					var sectSearch = splitTerms.split("/")[2]; // Get section number
					if(typeof numbSearch === 'undefined'){var numbSearch = '';};
					if(typeof sectSearch === 'undefined'){var sectSearch = '';};

					getCourseNumbers(splitTerms, searchTerms, TitleHidden);
					if (numbSearch.length == 3) {
						getSectionNumbers(deptSearch+numbSearch)
					} else { // If there is no course number, clear the section list and info panel
						$('#SectionList').empty();
					};
					if (sectSearch.length == 3) {
						getSectionInfo(deptSearch+numbSearch+sectSearch)
					} else { // If there is no course number, clear the section list and info panel
						$('#SectionInfo').empty();
					};
					
				} else if (searchTerms != "" ) { // If there are no good search terms, clear everything
					$('#CourseList').empty();
					$('#SectionList').empty();
					$('#SectionInfo').empty();
				}
			} 
			catch(err) {console.log('No Results '+ err);}

		}, 600);
	});

});

function getCourseNumbers(dept, desc, TitleHidden) { // Getting info about courses in a department
	var deptSearch = dept.split("/")[0]; // Get deptartment
	LoadingSum += 1;
	LoadingIndicate();
	$.get("/Search?searchType=deptSearch&courseID="+deptSearch) // Make the request
	.done(function(data) {
		LoadingSum -= 1;
		LoadingIndicate()
		$('#CourseList').html(data); // Put the course number list in #CourseList
		if (TitleHidden == false) {$('.CourseTitle').toggle();}
		$('#CourseList li').click(function() { // If a course is clicked
			$('#CSearch').val($(this).html().split("<")[0]); // Change the search box to match
			$('#SectionInfo').empty();
			var courseName = $(this).html().split("<")[0].replace(/ /g, " "); // Format the course name for searching
			$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
			getSectionNumbers(courseName); // Search for sections

		});
	})
	.fail(function() {
		$.get("/Search?searchType=descSearch&courseID="+desc) // Make the request
		.done(function(data) {
			$('#CourseList').html(data); // Put the course number list in #CourseList
			$('#CourseList li').click(function() { // If a course is clicked
				$('#CSearch').val($(this).html().split("<")[0]); // Change the search box to match
				$('#SectionInfo').empty();
				var courseName = $(this).html().split("<")[0].replace(/ /g, " "); // Format the course name for searching
				$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
				getSectionNumbers(courseName); // Search for sections
			});
		})
		.fail(function() {
			$('#CourseList').html('No results :(');
		})
		.always(function() {
			LoadingSum -= 1;
			LoadingIndicate()
		});
	})
}
function getSectionNumbers(cnum) { // Getting info about sections in a department
	LoadingSum += 1;
	LoadingIndicate();
	$.get("/Search?searchType=numbSearch&courseID="+cnum) // Make the request
	.done(function(data) {
		$('#SectionList').html(data); // Put the section list in #SectionList
		$('#SectionList span:nth-child(1)').click(function() { // If a section is clicked
			var secname = $(this).next().next().html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
			addToSched(secname); // Search for section info			
		});
		$('#SectionList span:nth-child(3)').click(function() { // If a section is clicked
			$('#CSearch').val($(this).html().split("-")[0]);
			var secname = $(this).html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
			getSectionInfo(secname); // Search for section info
		});
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});
}
function getSectionInfo(sec) {
	LoadingSum += 1;
	LoadingIndicate();
	$.get("/Search?searchType=sectSearch&courseID="+sec) // Make the request
	.done(function(data) {
		$('#SectionInfo').html(data);
		$('.DescButton').click(function() { // If a course is clicked
			$('#SectionInfo p').toggle();
		});
		$('#SectionInfo span:nth-child(1)').click(function() { // If a section is clicked
			
			var secname = $(this).next().html().replace(/ /g, ""); // Format the section name for searching
			addToSched(secname); // Search for section info			
		});
		$('#SectionInfo span:nth-child(2)').click(function() { // If a course is clicked
			$('#CSearch').val($(this).html()); // Change the search box to match
			var courseName = $(this).html().replace(/ /g, " "); // Format the course name for searching
			$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
			getSectionInfo(courseName); // Search for sections
		});
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});
}
function addToSched(sec) { // Getting info about a section
	LoadingSum += 1;
	LoadingIndicate();
	$.get("/Sched?addRem=add&courseID="+sec) // Make the request
	.done(function(data) {
		SpitSched(data)
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});
}
function removeFromSched(sec) {
	for (var i = 7; i < sec.length; i++) {
		if (parseFloat(sec[i]) != sec[i]) {
			secname = sec.substr(0, i);
			{ break }
		}
	};
	LoadingSum += 1;
	LoadingIndicate();
	$.get("/Sched?addRem=rem&courseID="+secname) // Make the request
	.done(function(data) {
		SpitSched(data)
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});
}
function SpitSched(ScheduledCourses) {
	$('#Schedule').empty();
	$('#TimeCol').empty();

	var weekdays = ['M', 'T', 'W', 'R', 'F'];

   	var startHour = 10;
   	var endHour = 18;
   	var percentWidth = 20;
	incSun = 0
	incSat = 0

   	for (var sec in ScheduledCourses) {
   		if (ScheduledCourses[sec].meetHour <= startHour) {
   			startHour = ScheduledCourses[sec].meetHour
   		}
   		if (ScheduledCourses[sec].meetHour+ScheduledCourses[sec].HourLength >= endHour) {
   			endHour = ScheduledCourses[sec].meetHour+ScheduledCourses[sec].HourLength
   		}
   		for (var day in ScheduledCourses[sec].meetDay) {
   			var letterDay = ScheduledCourses[sec].meetDay[day]
   			if (letterDay == 'U') {
   				incSun = 1;
   			}
   			if (letterDay == 'S') {
   				incSat = 1;	
   			}
   		}
   	}

   	if (incSun == 1) {weekdays.unshift('U')}
	if (incSat == 1) {weekdays.push('S')}

   	var percentWidth = 100 / (5 + incSun + incSat)

 	var halfScale = 100 / (endHour - startHour + 1);

   	for (var i = 0; i <= (endHour - startHour); i++) {
   		toppos = (i) * halfScale + 2.5;
   		hourtext = Math.round(i+startHour)
   		if (hourtext > 12) {hourtext -= 12}
	   	$('#TimeCol').append('<div class="TimeBlock" style="top:'+toppos+'%">'+hourtext+':00</div>');
	   	$('#Schedule').append('<hr width="100%"style="top:'+toppos+'%" >')
   	};
   	for (var sec in ScheduledCourses) {
   		for (var day in ScheduledCourses[sec].meetDay) {
   			var letterDay = ScheduledCourses[sec].meetDay[day]
   			for (var possDay in weekdays) {
   				if (weekdays[possDay] == letterDay) {
   					var blockleft = possDay*percentWidth; { break }
   				}
   			}
	   		var blocktop = (ScheduledCourses[sec].meetHour - startHour) * halfScale + 4;
	   		var blockheight = ScheduledCourses[sec].HourLength * halfScale;
	   		var blockname = ScheduledCourses[sec].fullCourseName
	   		$('#Schedule').append('<div class="SchedBlock" id="'+sec+'" style="top:'+blocktop+'%;left:'+blockleft+'%;width:'+percentWidth+'%;height:'+blockheight+'%;"><div class="CloseX">x</div>'+blockname+'</div>');
   		}
   	}

   	$('.CloseX').click(function(e) { // If a course is clicked
		removeFromSched($(this).parent().attr('id'));
		e.stopPropagation();
	});
	$('.SchedBlock')
	.mouseover(function() {
		$(this).find('.CloseX').css('opacity', '1');
	})
	.mouseout(function() {
		$(this).find('.CloseX').css('opacity', '0');
	})
  	.click(function() { // If a course is clicked
		sec = $(this).attr('id');
		for (var i = 7; i < sec.length; i++) {
			if (parseFloat(sec[i]) != sec[i]) {
				secname = sec.substr(0, i);
				{ break }
			}
		};
		var secname = $(this).attr('id').slice(0,10)
		var cnum = secname.slice(0,7);
		$('#CSearch').val(secname); // Change the search box to match
		getSectionInfo(secname);
		getSectionNumbers(cnum);
	});
}

function LoadingIndicate() {
	if (LoadingSum > 0) {
		$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	} else {
		$('#LoadingInfo').css('opacity', '0'); // Display the loading indicator
	};
}