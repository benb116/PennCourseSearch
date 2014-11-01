var CurrentCourses = {};

$(document).ready(function() {
	var delay = (function(){
	  var timer = 0;
	  return function(callback, ms){
	    clearTimeout (timer);
	    timer = setTimeout(callback, ms);
	  };})();

   	$('#CSearch').on('input', function(){ // When the search terms change
		delay(function(){ // Don't check instantaneously
		  	var searchTerms = $('#CSearch').val(); // Get raw search

			try {
				if (searchTerms != "" && searchTerms != 'favicon.ico') { // Initial filtering
					// Format search terms for server request
					searchTerms = searchTerms.replace(/ /g, "").replace(/-/g, ""); // Replace spaces and dashes with slashes

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
					getCourseNumbers(deptSearch);
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
				} else { // If there are no good search terms, clear everything
					$('#CourseList').empty();
					$('#SectionList').empty();
					$('#LoadingInfo').css('opacity', '0'); // Turn off loading indicator
				}
			} 
			catch(err) {console.log('No Results');}

		}, 400);
	});

	

});

function getCourseNumbers(dept) { // Getting info about courses in a department
	$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	$.get("/Search?searchType=deptSearch&courseID="+dept) // Make the request
	.done(function(data) {
		$('#CourseList').html(data); // Put the course number list in #CourseList
		$('#LoadingInfo').css('opacity', '0'); // Turn off loading indicator
		$('#CourseList li').click(function() { // If a course is clicked
			$('#CSearch').val($(this).html()); // Change the search box to match
			$('#SectionInfo').empty();
			var courseName = $(this).html().replace(/ /g, " "); // Format the course name for searching
			$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
			getSectionNumbers(courseName); // Search for sections
		});
	});
}
function getSectionNumbers(cnum) { // Getting info about sections in a department
	$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	$.get("/Search?searchType=numbSearch&courseID="+cnum) // Make the request
	.done(function(data) {
		$('#LoadingInfo').css('opacity', '0'); // Turn off loading indicator
		$('#SectionList').html(data); // Put the section list in #SectionList
		$('#SectionList span:nth-child(1)').click(function() { // If a section is clicked
			
			// console.log($(this).html())
			var secname = $(this).next().next().html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
			// if ($(this).html() == '&nbsp; + &nbsp;') {
				addToSched(secname); // Search for section info
			// 	console.log('1')
			// 	$(this).html('&nbsp; - &nbsp;');
			// } else if ($(this).html() == '&nbsp; - &nbsp;') {
			// 	removeFromSched(secname); // Search for section info
			// 	$(this).html('&nbsp; + &nbsp;');
			// }
			
		});
		$('#SectionList span:nth-child(3)').click(function() { // If a section is clicked
			$('#CSearch').val($(this).html().split("-")[0]);
			var secname = $(this).html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
			getSectionInfo(secname); // Search for section info
		});
	});
}
function getSectionInfo(sec) {
	$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	$.get("/Search?searchType=sectSearch&courseID="+sec) // Make the request
	.done(function(data) {
		$('#LoadingInfo').css('opacity', '0'); // Turn off loading indicator
		$('#SectionInfo').html(data);
		$('#SectionInfo li').click(function() { // If a course is clicked
			$('#CSearch').val($(this).html()); // Change the search box to match
			var courseName = $(this).html().replace(/ /g, " "); // Format the course name for searching
			$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
			getSectionInfo(courseName); // Search for sections
		});
	});
}
function addToSched(sec) { // Getting info about a section
	$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	$.get("/Sched?addRem=add&courseID="+sec) // Make the request
	.done(function(data) {
		$('#LoadingInfo').css('opacity', '0'); // Display the loading indicator
		SpitSched(data)
	});
}
function removeFromSched(sec) {
	console.log(sec)
	
	for (var i = 7; i < sec.length; i++) {
		if (parseFloat(sec[i]) != sec[i]) {
			secname = sec.substr(0, i);
			{ break }
		}
	};

	$('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
	$.get("/Sched?addRem=rem&courseID="+secname) // Make the request
	.done(function(data) {
		SpitSched(data)
		$('#LoadingInfo').css('opacity', '0'); // Display the loading indicator
		
	});
}
function SpitSched(ScheduledCourses) {
	$('#TestDiv').empty();
	var weekdays = ['M', 'T', 'W', 'R', 'F'];
   	var startHour = 16;
   	var endHour = 36;
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
	   		var blockheight = ScheduledCourses[sec].halfHourLength * halfScale;
	   		var blockname = ScheduledCourses[sec].fullCourseName
	   		$('#TestDiv').append('<div class="SchedBlock" id="'+sec+'" style="top:'+blocktop+'%;left:'+blockleft+'%;height:'+blockheight+'%;">'+blockname+'</div>');
   		}
   	}
   	$('.SchedBlock').click(function() { // If a course is clicked
		console.log('test')
		removeFromSched($(this).attr('id'));
	});
}