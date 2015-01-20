$(document).ready(function () {
    $('#clearTool').tooltipster({
        trigger: 'click',
        position: 'bottom',
        interactive: 'true',
        content: $('<span onclick="clearSched()">Confirm</span>')
    });
 
    // The delay function that prevents immediate requests
    var delay = (function(){
        var timer = 0;
        return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
        };
    })();
 
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    function shuffle(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };
 
    LoadingSum = 0; // Initialize the loading sum. If != 0, the loading indicator will be displayed
 
    var schedURL = "/Sched?addRem=blank&courseID=blank&schedName=Sched1"; // Make the request
    SendReq(schedURL, SpitSched, [])
 
    TitleHidden = true; // Are the titles of courses in #Courselist hidden or not
    colorPalette = ['#1abc9c','#e74c3c','#f1c40f','#3498db','#9b59b6','#ecf0f1','#2ecc71','#95a5a6','#FF73FD','#e67e22','#73F1FF','#CA75FF'];
 
    $('#Top span').click(function() { // If the user clicks a top button
        if ($(this).html() == 'Toggle course titles') {
            $('.CourseTitle').toggle();
            TitleHidden = !TitleHidden;
        }
        if ($(this).html() == 'Download Schedule') {
            html2canvas($('#SchedGraph'), { // Convert the div to a canvas
                onrendered: function(canvas) {
                    var image = new Image();
                    image.src = canvas.toDataURL("image/png"); // Convert the canvas to png
                    window.open(image.src, '_blank'); // Open in new tab
                }
            }); 
        };
        if ($(this).html() == 'Recolor') {
            newcolorPalette = shuffle(colorPalette); // Randomly reorder the colorPalette
            var schedURL = "/Sched?addRem=blank&courseID=blank&schedName=Sched1"; // Make the request
    		SendReq(schedURL, SpitSched, [])
        }
        if ($(this).html() == 'Show Stars') {
            Stars('show', 'blank')
        }
    });
 
    ClickTriggers() // This defines all of the click handlers (see below)
 
    $('#searchSelect').change(function () { // If the user changes from one type of search to another, search again with the new method
        initiateSearch();
    });
 
    $('#CSearch').on('input', function(){ // When the search terms change
        delay(function(){ // Don't check instantaneously
            initiateSearch();
        }, 600);
    });
 
});
 
function initiateSearch() {
    var searchTerms = $('#CSearch').val(); // Get raw search
    try {
        if (searchTerms != "" && searchTerms != 'favicon.ico' && searchTerms != 'blank') { // Initial filtering
             
            var searchSelect = $('#searchSelect').val();
            if (searchSelect == 'courseIDSearch') {
                // Format search terms for server request
                var splitTerms = formatCourseID(searchTerms);
                // By now the search terms should be 'DEPT/NUM/SEC/' although NUM/ and SEC/ may not be included
                var deptSearch = splitTerms.split("/")[0]; // Get deptartment
                var numbSearch = splitTerms.split("/")[1]; // Get course number
                var sectSearch = splitTerms.split("/")[2]; // Get section number
                if(typeof numbSearch === 'undefined'){var numbSearch = '';};
                if(typeof sectSearch === 'undefined'){var sectSearch = '';};
            } else {
                var deptSearch = searchTerms;
                var numbSearch = ''; // Get course number
                var sectSearch = ''; // Get section number
            }
             
            getCourseNumbers(deptSearch, TitleHidden);
            if (numbSearch.length == 3) {
                getSectionNumbers(deptSearch+numbSearch, 'all')
            } else { // If there is no course number, clear the section list and info panel
	            $('#SectionTitle').empty();
                $('#SectionList').empty();
            };
            if (sectSearch.length == 3) {
                getSectionInfo(deptSearch+numbSearch+sectSearch)
            } else { // If there is no course number, clear the section list and info panel
                $('#SectionInfo').empty();
            };
             
             
        } else if (searchTerms != "" ) { // If there are no good search terms, clear everything
            $('#CourseList').empty();
            $('#SectionTitle').empty();
            $('#SectionList').empty();
            $('#SectionInfo').empty();
        }
    } 
    catch(err) {console.log('No Results '+ err);}
}
 
function formatCourseID(searchTerms) {
    splitTerms = searchTerms.replace(/ /g, "").replace(/-/g, "").replace(/:/g, ""); // Remove spaces, dashes, and colons
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
    return splitTerms;
}
 
function ClickTriggers() {
    $('body').on('click', '#CourseList li', function() { // If a course is clicked in CourseList
        $('#SectionInfo').empty();
        var courseName = $(this).html().split("<")[0].replace(/ /g, " "); // Format the course name for searching
	    var searchSelect = $('#searchSelect').val();
        var instFilter = 'all'
        if (searchSelect == 'instSearch') {var instFilter = $('#CSearch').val()}
        getSectionNumbers(courseName, instFilter); // Search for sections
    });

    $('body').on('click', '#SectionList span:nth-child(1)', function() { // If a section is clicked in SectionList
        var secname = $(this).next().next().html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
        schedURL = "/Sched?addRem=add&courseID="+secname
        SendReq(schedURL, SpitSched, [])        
    });

    $('body').on('click', '#SectionList span:nth-child(3)', function() { // If a section is clicked
        var secname = $(this).html().split("-")[0].replace(/ /g, ""); // Format the section name for searching
        getSectionInfo(secname); // Search for section info
        var dept = secname.slice(0,-6);
        getCourseNumbers(dept, TitleHidden)
    });

    $('body').on('click', '#SectionList i', function() { // If the user clicks a star in SectionList
        var isStarred = $(this).attr('class'); // Determine whether the section is starred
        if (isStarred == 'fa fa-star-o') {addRem = 'add';} 
        else if (isStarred == 'fa fa-star') {addRem = 'rem';}
         
        Stars(addRem, $(this).prev().html().split("-")[0].replace(/ /g, "")); // Add/rem the section

        $(this).toggleClass('fa-star'); // Change the star icon
        $(this).toggleClass('fa-star-o');
        if (addRem == 'rem' && $(this).parent().attr('class') == 'starredSec') { // If it was removed from the Show Stars list
        	$(this).parent().remove();
        }
    });

    $('body').on('click', '.DescBlock', function() { // If a course is clicked
        $('#SectionInfo p').toggle();
    });

    $('body').on('click', '#SectionInfo span:nth-child(1)', function() { // If the section is added
        var secname = $(this).next().html().replace(/ /g, ""); // Format the section name for scheduling
        addToSched(secname); // Search for section info         
    });

    $('body').on('click', '.AsscText span:nth-child(2)', function() { // If an Assc Sec is clicked
        var courseName = $(this).html().replace(/ /g, " "); // Format the course name for searching
        getSectionInfo(courseName); // Search for sections
    });

    $('body').on('click', '.CloseX', function(e) { // If an X is clicked
        removeFromSched($(this).parent().attr('id')); // Get rid of the section
        e.stopPropagation();
    });
    $('body').on('mouseover', '.SchedBlock', function() {
        $(this).find('.CloseX').css('opacity', '1'); // Show the X
    })
    $('body').on('mouseout', '.SchedBlock', function() {
        $(this).find('.CloseX').css('opacity', '0'); // Hide the X
    })
    $('body').on('click', '.SchedBlock', function() { // If a course is clicked
        sec = $(this).attr('id');
        // Determine the secname by checking when a character is no longer a number (which means the character is the meetDay of the block id)
        for (var i = 7; i < sec.length; i++) {
            if (parseFloat(sec[i]) != sec[i]) {
                secname = sec.substr(0, i);
                { break }
            }
        };
        var cnum = secname.slice(0,-3);
        var dept = secname.slice(0,-6);
        getSectionInfo(secname);
        getSectionNumbers(cnum, 'all');
        getCourseNumbers(dept, TitleHidden)
    });
}

// Special request wrapper that updates the Loading spinner and automatically passes results to a function
// This may seem unnecessary, and it does lead to some short functions. However, it prevents the code from becoming cluttered and repetitive.
function SendReq(url, fun, passVar) {
    LoadingSum += 1; 
    LoadingIndicate()
    console.time('Request - ' + url)
    $.get(url) // Make the request
    .done(function(data) {
        fun(data, passVar) // Process the response and display the sched
    })
    .always(function() {
		console.timeEnd('Request - ' + url)
        LoadingSum -= 1;
        LoadingIndicate()
    });
}
 
function LoadingIndicate() {
    if (LoadingSum > 0) {
        $('#LoadingInfo').css('opacity', '1'); // Display the loading indicator
    } else {
        $('#LoadingInfo').css('opacity', '0'); // Display the loading indicator
    };
}
 
function getCourseNumbers(search, TitleHidden) { // Getting info about courses in a department
    var searchSelect = $('#searchSelect').val();
    var searchURL = '/Search?searchType='+searchSelect+'&resultType=deptSearch&searchParam='+search;
    SendReq(searchURL, CourseFormat, []) // Send results to CourseFormat
}
 
function CourseFormat(JSONRes, passVar) {
    if (typeof JSONRes === 'string') {JSONRes = JSON.parse(JSONRes);}
    var allHTML = '';
    if (!($.isEmptyObject(JSONRes))){
	    for(var course in JSONRes) {
	        allHTML += '<li>'+JSONRes[course].courseListName+'<span class="CourseTitle"> - '+JSONRes[course].courseTitle+'</span></li>';
	    }
	} else {
		allHTML = '&nbsp&nbsp&nbsp&nbsp&nbspNo Results';
	}
    $('#CourseList').html(allHTML); // Put the course number list in #CourseList
    if (TitleHidden == false) {$('.CourseTitle').toggle();}
    $( "#CourseList li" ).each(function( index ) {
        PCR = $(this).data('pcr');
        pcrFrac = PCR / 4;
        $(this).css('background-color', 'rgba(45, 160, 240, '+pcrFrac*pcrFrac+')')
    });
}
 
function getSectionNumbers(cnum, instFilter) { // Getting info about sections in a department
    searchURL = "/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam="+cnum+"&instFilter="+instFilter;
    SendReq(searchURL, SectionStars, [])
}
 
function SectionStars(sections, passvar) { // Getting info about starred sections
    searchURL = "/Star?addRem=blank&courseID=blank";
    SendReq(searchURL, FormatSectionsList, sections)
}
 
function FormatSectionsList(stars, sections) {
	// console.time('Sections')
	console.log(sections)
    var allHTML = '';
    // $('#SectionTitle').html(sections.CourseTitle)
    for(var section in sections) {
		var starClass = 'fa fa-star-o';
        var index = stars.indexOf(sections[section].NoSpace);
        if (index > -1) {var starClass = 'fa fa-star'} // If the section is a starred section, add the filled star
        allHTML += '<li><span>&nbsp + &nbsp</span><span class="'+sections[section].StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;<span>'+sections[section].SectionName+sections[section].TimeInfo+'</span><i class="'+starClass+'" style="float:right;"></i></li>'
    }
	$('#SectionTitle').html(sections[section].CourseTitle);
    $('#SectionList').html(allHTML); // Put the course number list in  #SectionList
    // console.timeEnd('Sections')
}
 
function getSectionInfo(sec) { // Get info about the specific section
    searchURL = "/Search?searchType=courseIDSearch&resultType=sectSearch&searchParam="+sec;
    SendReq(searchURL, SectionInfoFormat, [])
}
 
function SectionInfoFormat(data, passvar) {
    var HTMLinfo = "<span>&nbsp + &nbsp</span><span>" + data.FullID + "</span> - " + data.Title + "<br><br>Instructor: " + data.Instructor + "<br><br>Description:<br><p class='DescText'>" + data.Description + "</p><br>Status: " + data.OpenClose + "<br><br>"+data.termsOffered+"<br><br>Prerequisites: " + data.Prerequisites + "<br><br>" + data.TimeInfo + data.AssociatedSections; // Format the whole response
    $('#SectionInfo').html(HTMLinfo);
}
 
function Stars(addRem, CID) {
    var searchURL = "/Star?addRem="+addRem+"&courseID="+CID;
    SendReq(searchURL, StarHandle, addRem)
}
 
function StarHandle(data, addRem) {
    if (addRem == 'show') { // If the user clicked "Show Stars"
        $('#SectionList').empty();
        for(sec in data) {
            var searchURL = "/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam="+data[sec]+"&instFilter=all";
            SendReq(searchURL, StarFormat, [])
        }
    } else {
        return data
    }
}
 
function StarFormat(sections) {
    var starClass = 'fa fa-star'
    for(var section in sections) {
    	console.log(sections[section])
    	var allHTML = '<li class="starredSec"><span>&nbsp + &nbsp</span><span class="'+sections[section].StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;<span>'+sections[section].SectionName+sections[section].TimeInfo+'</span><i class="'+starClass+'" style="float:right;"></i></li>'
    }
	$('#SectionTitle').html('Starred Sections');
    $('#SectionList').append(allHTML); // Put the course number list in  #SectionList       
}
 
function addToSched(sec) { // Getting info about a section
    var schedURL = "/Sched?addRem=add&courseID="+sec // Make the request
    SendReq(schedURL, SpitSched, [])
}
 
function removeFromSched(sec) {
    // Determine the secname by checking when a character is no longer a number (which means the character is the meetDay of the block id)
    for (var i = 7; i < sec.length; i++) {
        if (parseFloat(sec[i]) != sec[i]) {
            secname = sec.substr(0, i);
            { break }
        }
    };
    var schedURL = "/Sched?addRem=rem&courseID="+secname
    SendReq(schedURL, SpitSched, [])
}
 
function clearSched () {
    schedURL = "/Sched?addRem=clear"
    SendReq(schedURL, SpitSched, [])
    $('.tooltip').tooltipster('hide');
}
 
function SpitSched(courseSched) {
    $('#Schedule').empty(); // Clear
    $('#TimeCol').empty();
 
    // Set initial values
    var weekdays = ['M', 'T', 'W', 'R', 'F'];
        var startHour = 10; // start at 10
        var endHour = 18; // end at 6pm
        var percentWidth = 20; // five day default
    incSun = 0; // no weekends
    incSat = 0;
 
    for (var sec in courseSched) {
        if (courseSched[sec].meetHour <= startHour) { // If there are classes earlier than the default start
            startHour = courseSched[sec].meetHour // push back the earliest hour
        }
        if (courseSched[sec].meetHour+courseSched[sec].HourLength >= endHour) { // Push back latest hour if necessary
            endHour = courseSched[sec].meetHour+courseSched[sec].HourLength
        }
        for (var day in courseSched[sec].meetDay) {
            var letterDay = courseSched[sec].meetDay[day]
            if (letterDay == 'U') { // If there are sunday classes
                incSun = 1;
            }
            if (letterDay == 'S') { // If there are saturday classes
                incSat = 1; 
            }
        }
    }
 
    if (incSun == 1) {weekdays.unshift('U')} // Update weekdays array if necessary
    if (incSat == 1) {weekdays.push('S')}
 
    var percentWidth = 100 / (5 + incSun + incSat) // Update the block width if necessary
    var halfScale = 100 / (endHour - startHour + 1); // This defines the scale to be used throughout the scheduling process
    // + 1 keeps the height inside the box
 
    // Make the lines and time labels
    if (!($.isEmptyObject(courseSched))){
        for (var i = 0; i <= (endHour - startHour); i++) { // for each hour
            toppos = (i) * halfScale + 2.5; // each height value is linearly spaced with an offset
            hourtext = Math.round(i+startHour) // If startHour is not an integer, make it pretty
            if (hourtext > 12) {hourtext -= 12} // no 24-hour time
            $('#TimeCol').append('<div class="TimeBlock" style="top:'+toppos+'%">'+hourtext+':00</div>'); // add time label
            $('#Schedule').append('<hr width="100%"style="top:'+toppos+'%" >') // add time line
        };
    }
 
    // Define the color map
    var colorMap = {};
    var colorinc = 0;
    for (var sec in courseSched) {
        colorMap[courseSched[sec].fullCourseName] = colorPalette[colorinc]; // assign each section a color
        colorinc += 1;
    }
 
    // Add the blocks
    for (var sec in courseSched) {
        for (var day in courseSched[sec].meetDay) { // some sections have multiple meeting times and days
            var letterDay = courseSched[sec].meetDay[day] // On which day does this meeting take place?
            for (var possDay in weekdays) {
                if (weekdays[possDay] == letterDay) {
                    var blockleft = possDay*percentWidth; { break } // determine left spacing
                }
            }
            var blocktop    = (courseSched[sec].meetHour - startHour) * halfScale + 4; // determine top spacing based on time from startHour (offset for prettiness)
            var blockheight = courseSched[sec].HourLength * halfScale;
            var blockname   = courseSched[sec].fullCourseName
            var meetRoom    = courseSched[sec].meetRoom;
            var thiscol     = colorMap[courseSched[sec].fullCourseName]; // Get the color
            if(typeof thiscol === 'undefined'){thiscol = '#E6E6E6';};
     
            $('#Schedule').append('<div class="SchedBlock" id="'+sec+'" style="top:'+blocktop+'%;left:'+blockleft+'%;width:'+percentWidth+'%;height:'+blockheight+'%;background-color:'+thiscol+'"><div class="CloseX">x</div>'+blockname+'<br>'+meetRoom+'</div>');
        }
    }
}