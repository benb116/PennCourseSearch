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
			$.get("/Sched?addRem=clear")
			$('#Schedule').empty();
		}
	});


   	$('#CSearch').on('input', function(){ // When the search terms change
		delay(function(){ // Don't check instantaneously
		  	var searchTerms = $('#CSearch').val(); // Get raw search

			try {
				if (searchTerms != "" && searchTerms != 'favicon.ico' && searchTerms != 'blank') { // Initial filtering
					// Format search terms for server request
					searchTerms = searchTerms.replace(/ /g, "").replace(/-/g, ""); // Replace spaces and dashes

					//If the user enters everything without spaces or dashes
					if (parseFloat(searchTerms[2]) == searchTerms[2]) { // If the third character is a number (e.g. BE100)
						searchTerms = searchTerms.substr(0, 2)+'/'+searchTerms.substr(2); // Splice the search query with a slash after the deptartment

						if (parseFloat(searchTerms[6]) == searchTerms[6]) { // Then, if the sixth character is a number (e.g. BE100001)
							searchTerms = searchTerms.substr(0, 6)+'/'+searchTerms.substr(6); // Splice the search query with a slash after the course number
						}
					} else if (parseFloat(searchTerms[3]) == searchTerms[3]) { // If the fourth character is a number (e.g. CIS110)
						searchTerms = searchTerms.substr(0, 3)+'/'+searchTerms.substr(3); // Splice the search query with a slash after the deptartment

						if (parseFloat(searchTerms[7]) == searchTerms[7]) { // Then, if the seventh character is a number (e.g. CIS110001)
							searchTerms = searchTerms.substr(0, 7)+'/'+searchTerms.substr(7); // Splice the search query with a slash after the course number
						}
					} else if (parseFloat(searchTerms[4]) == searchTerms[4]) { // If the fifth character is a number (e.g. MEAM110)
						searchTerms = searchTerms.substr(0, 4)+'/'+searchTerms.substr(4); // Splice the search query with a slash after the deptartment

						if (parseFloat(searchTerms[8]) == searchTerms[8]) { // Then, if the eighth character is a number (e.g. MEAM110001)
							searchTerms = searchTerms.substr(0, 8)+'/'+searchTerms.substr(8); // Splice the search query with a slash after the course number
						}
					};
					// By now the search terms should be 'DEPT/NUM/SEC/' although NUM/ and SEC/ may not be included
					var deptSearch = searchTerms.split("/")[0]; // Get deptartment
					var numbSearch = searchTerms.split("/")[1]; // Get course number
					var sectSearch = searchTerms.split("/")[2]; // Get section number
					if(typeof numbSearch === 'undefined'){var numbSearch = '';};
					if(typeof sectSearch === 'undefined'){var sectSearch = '';};

					getCourseNumbers(deptSearch, TitleHidden);
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

		}, 400);
	});

});

function getCourseNumbers(dept, TitleHidden) { // Getting info about courses in a department
	LoadingSum += 1;
	$.get("/Search?searchType=deptSearch&courseID="+dept) // Make the request
	.done(function(data) {
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
		$('#CourseList').html('No results :(');
	})
	.always(function() {
		LoadingSum -= 1;
		LoadingIndicate()
	});
}
function getSectionNumbers(cnum) { // Getting info about sections in a department
	LoadingSum += 1;
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
	$.get("/Search?searchType=sectSearch&courseID="+sec) // Make the request
	.done(function(data) {
		$('#SectionInfo').html(data);
		$('#SectionInfo li').click(function() { // If a course is clicked
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
	var weekdays = ['M', 'T', 'W', 'R', 'F'];

   	var startHour = 10;
   	var endHour = 18;

   	for (var sec in ScheduledCourses) {
   		if (ScheduledCourses[sec].meetHour <= startHour + 0.5) {
   			startHour = ScheduledCourses[sec].meetHour - 0.5
   		}
   		if (ScheduledCourses[sec].meetHour+ScheduledCourses[sec].HourLength >= endHour - 0.5) {
   			endHour = ScheduledCourses[sec].meetHour+ScheduledCourses[sec].HourLength + 0.5
   		}
   	}

 	var halfScale = 100 / (endHour - startHour);
   	for (var sec in ScheduledCourses) {
   		for (var day in ScheduledCourses[sec].meetDay) {
   			var letterDay = ScheduledCourses[sec].meetDay[day]
   			for (var possDay in weekdays) {
   				if (weekdays[possDay] == letterDay) {
   					var blockleft = possDay*20; { break }
   				}
   			}
	   		var blocktop = (ScheduledCourses[sec].meetHour - startHour) * halfScale;
	   		var blockheight = ScheduledCourses[sec].HourLength * halfScale;
	   		var blockname = ScheduledCourses[sec].fullCourseName
	   		$('#Schedule').append('<div class="SchedBlock" id="'+sec+'" style="top:'+blocktop+'%;left:'+blockleft+'%;height:'+blockheight+'%;"><div class="CloseX">x</div>'+blockname+'</div>');
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
		var secname = $(this).html().split(">")[2]
		var cnum = secname.split(" ").slice(0,2).join(' ');
		console.log(cnum)
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