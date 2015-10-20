$(document).ready(function () {
  if (detectIE()) { // IE doesn't do animated SVG's
    $('#LoadingInfo').html('Loading ...');
  }
  // The delay function that prevents immediate requests
  var delay = (function(){var timer = 0;return function(callback, ms){clearTimeout (timer);timer = setTimeout(callback, ms);};})();

  var searchDelay = 500; // millisecond delay before searching

  //+ Jonas Raoni Soares Silva @ http://jsfromhell.com/array/shuffle [v1.0]
  shuffle = function(v){for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);return v;};
  
  // Global variables
  LoadingSum = 0; // Initialize the loading sum. If != 0, the loading indicator will be displayed

  var colorPalette;
  if (sessionStorage.colorPalette) { // If we recently changed the palette
    colorPalette = JSON.parse(sessionStorage.colorPalette);
  } else {
    colorPalette  = ['#1abc9c','#e74c3c','#f1c40f','#3498db','#9b59b6','#e67e22','#2ecc71','#95a5a6','#FF73FD','#73F1FF','#CA75FF','#ecf0f1','#F64747'];
    sessionStorage.colorPalette = JSON.stringify(colorPalette);
  }

  $('a[rel*=leanModal]').leanModal({ top : 70, closeButton: ".modal_close" }); // Define modal close button

  var schedURL = "/Sched?addRem=pull"; // Make the initial schedule list request. Returns the list of schedules and the first schedule's classes
  SendReq(schedURL, ListScheds, 0);
  var starURL = "/Star?addRem=show"; // Make initial star list request. Returns the list of starred classes
  SendReq(starURL, 'sessionStorage', 'starList');
 
  ClickTriggers(); // This defines all of the click handlers (see below)
  MenuTriggers(); // This provides functionality to the "Schedule" dropdown
  OtherTriggers();

  if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) { // Doesn't look good on mobile, so tell the user
    setTimeout(function(){
      sweetAlert({
        title: 'PCS Alert',
        text: "Your device seems to be too small. PCS does not currently support mobile viewing, but we're looking to add it soon!",
        type: 'warning'
      });
    }, 300);
  } else {
    var statusMessage = $('#StatusMessage').text();
    if (statusMessage != 'hakol beseder') { // If there is a status message from the server, it will be passed in the #StatusMessage block
      setTimeout(function(){
        sweetAlert({
          title: 'PCS Alert', 
          html: true,
          text: statusMessage, 
          type: 'warning'
        });
      }, 300);
      console.log(statusMessage);
    }
  }

  $('#CSearch').on('input', function(){ // When the search terms change
    delay(function(){ // Don't check instantaneously
      initiateSearch();
    }, searchDelay);
  });
});

function SendReq(url, fun, passVar) {
  // Special request wrapper that updates the Loading spinner and automatically passes results to a function
  // This may seem unnecessary, and it does lead to some short functions. However, it prevents the code from becoming cluttered and repetitive.
  // url: the request url sent to the server
  // fun: the keyword or function to which the data is passed
  // passVar: any extra information that needs to be sent in

  try {
    LoadingSum += 1; // Add to the sum of requests
    LoadingIndicate(); // Update the spinning logo
    $.get(url) // Make the request
    .success(function(data) {
      if (fun == 'localStorage') {
        // In this case passVar is the name of the key to store the data with
        localStorage[passVar] = JSON.stringify(data);
      } else if (fun == 'sessionStorage') {
        sessionStorage[passVar] = JSON.stringify(data);
      } else {
        fun(data, passVar); // Pass the data to another function
      }
    })
    .error(function(err) {
      console.log(err);
      sweetAlert({
        title: '#awkward', 
        html: true,
        text: 'An error occured. Refresh or email <a href="mailto:bernsb@seas.upenn.edu?Subject=PCS%20IS%20BROKEN!!!!">Ben</a>', 
        type: 'error'
      });
    })
    .complete(function() {
      LoadingSum -= 1; // Remove from the sum of requests
      LoadingIndicate();
    });
  } catch(err) {
    console.log(err);
    sweetAlert({
      title: '#awkward', 
      html: true,
      text: 'An error occured. Refresh or email <a href="mailto:bernsb@seas.upenn.edu?Subject=PCS%20IS%20BROKEN!!!!">Ben</a>', 
      type: 'error'
    });
  }
}
 
function LoadingIndicate() { // Displays the loading icon if there are requests that haven't come back yet
  if (LoadingSum > 0) { // Reads the global variable
    $('#LoadingInfo').css('display', 'inline-block'); // Display the loading indicator
  } else {
    $('#LoadingInfo').css('display', 'none'); // Hide the loading indicator
  }
}

function ClickTriggers() {
  $(document.body)
  .on('click', '#CourseList li', function() { // If a course is clicked in CourseList
    $('#SectionInfo').empty();
    var courseName = formatID($(this).attr('id')).join(""); // Format the course name for searching

    var searchSelect = $('#searchSelect').val(); // Will we need to have an instructor filter
    var instFilter = 'all';
    if (searchSelect == 'instSearch') {instFilter = $('#CSearch').val();}
    
    getSectionNumbers(courseName, instFilter); // Search for sections
  })
  .on('click', 'li > i:nth-child(1)', function() { // If a section's add/drop button is clicked in SectionList
    var secname = $(this).parent().attr('id'); // Format the section name for searching
    var schedName = $('#schedSelect').val(); // Which schedule are we changing

    var whichClass = $(this).attr('class');
    if (whichClass == 'fa fa-plus') { // If the plus is clicked
      addToSched(secname, schedName);
    } else if (whichClass == 'fa fa-times') { // If the x is clicked
      removeFromSched(secname, schedName);
    }
  })
  .on('click', '#SectionList span:nth-child(4)', function() { // If a section name is clicked
    var secname = formatID($(this).parent().attr('id')).join("");
    getSectionInfo(secname); // Search for section info
    if ($('#CourseTitle').html() == 'Starred Sections') {
      var dept = secname.slice(0,-6);
      getCourseNumbers(dept, 'courseIDSearch');
      getSectionNumbers(courseName, 'all');
    }
  })
  .on('click', '#SectionList i:nth-child(5)', function() { // If the user clicks a star in SectionList
    var isStarred = $(this).attr('class'); // Determine whether the section is starred
    if (isStarred == 'fa fa-star-o') {addRem = 'add';} 
    else if (isStarred == 'fa fa-star') {addRem = 'rem';}
    var secname = formatID($(this).parent().attr('id')).join("");

    Stars(addRem, secname); // Add/rem the section

    $(this).toggleClass('fa-star').toggleClass('fa-star-o'); // Change the star icon
    if (addRem == 'rem' && $(this).parent().attr('class') == 'starredSec') { // If it was removed from the Show Stars list
      $(this).parent().remove();
      if ($('#SectionList > ul').is(':empty')){
          $('#CourseTitle').html('No Starred Sections');
      }
    }
  })
  .on('click', '.AsscSec', function() { // If an Assc Sec is clicked
    var courseName = formatID($(this).attr('id')).join(""); // Format the course name for searching
    getSectionInfo(courseName); // Search for sections
  })
  .on('click', '.CloseX', function(e) { // If an X is clicked
    var schedName = $('#schedSelect').val();
    removeFromSched($(this).parent().attr('id'), schedName); // Get rid of the section

    e.stopPropagation();
  })
  .on('mouseover', '.SchedBlock', function() {
    $(this).find('.CloseX').css('opacity', '1'); // Show the X
  })
  .on('mouseout', '.SchedBlock', function() {
    $(this).find('.CloseX').css('opacity', '0'); // Hide the X
  })
  .on('click', '.SchedBlock', function() { // If a course is clicked
    sec = $(this).attr('id');
    // Determine the secname by checking when a character is no longer a number (which means the character is the meetDay of the block id)
    secname = formatID(sec);
    var dept = secname[0];
    var cnum = dept + secname[1];
    var secnum = cnum + secname[2];
    getCourseNumbers(dept, 'courseIDSearch');
    getSectionNumbers(cnum, 'all', 'suppress'); // Suppress the SectionInfo stuff from this requests because it would overwrite the response from getSectionInfo()
    getSectionInfo(secnum);
  });
}

function MenuTriggers() {
  $('li ul li', '#MenuButtons').click(function() { // If the user clicks a Schedule button
    var schedName, schedURL;

    if ($(this).html() == 'Download') {
      html2canvas($('#SchedGraph'), { // Convert the div to a canvas
        onrendered: function(canvas) {
          var image = new Image();
          image.src = canvas.toDataURL("image/png"); // Convert the canvas to png
          // window.open(image.src, '_blank'); // Open in new tab
          $('#SchedImage').attr('src', image.src).attr('title', 'My Schedule');
        }
      }); 
    }

    if ($(this).html() == 'New') {
      sweetAlert({
        title: "Please name your new schedule",
        type: "input",
        inputPlaceholder: "Spring 2016",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
      }, function(inputValue) {
        if (inputValue === false) return false;
        else if (inputValue === "") {
            sweetAlert.showInputError("Your schedule needs a name, silly!");
            return false;
        }
        else if (JSON.parse(sessionStorage.schedList).indexOf(inputValue) != -1) { // If the user put in a name that already exists
          sweetAlert.showInputError('Your schedule needs a unique name (e.g. "Seven")');
        }
        else {
          schedURL = "/Sched?addRem=cre&courseID=blank&schedName="+inputValue; // Make the request
          SendReq(schedURL, ListScheds, 1);
          sweetAlert.close();
        }
      });
    }

    if ($(this).html() == 'Duplicate') {
      schedName = $("#schedSelect").val();
      schedURL = "/Sched?addRem=dup&courseID=blank&schedName="+schedName; // Make the request
      SendReq(schedURL, ListScheds, 1);
      sweetAlert({
        title: "Schedule duplicated.",   
        type: "success",   
        timer: 1000
      });
    }

    if ($(this).html() == 'Rename') {
      sweetAlert({
        title: "Please enter a new name.",
        type: "input",
        inputPlaceholder: "Schedule 2: Book of Secrets",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
      }, function(inputValue) {
        if (inputValue === false) return false;
        else if (inputValue === "") {
            sweetAlert.showInputError("Your schedule needs a name, silly!");
            return false;
        }
        else if (JSON.parse(sessionStorage.schedList).indexOf(inputValue) != -1) {
          sweetAlert.showInputError('Your schedule needs a unique name (e.g. "Seven")');
        }
        else {
          schedName = $("#schedSelect").val();
          schedURL = "/Sched?addRem=ren&courseID=blank&schedName="+schedName+"&schedRename="+inputValue; // Make the request
          SendReq(schedURL, ListScheds, 1);
          sweetAlert.close();
        }
      });
    }

    if ($(this).html() == 'Clear') {
      sweetAlert({title: "Are you sure you want to clear your whole schedule?", type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: "Yes", closeOnConfirm: false }, 
      function(){
        var schedName = $("#schedSelect").val();
        schedURL = "/Sched?addRem=clr&schedName="+schedName;
        SendReq(schedURL, SpitSched, []);
        sweetAlert({title: "Your schedule has been cleared.", type: "success", timer: 1000}); 
      });
    }

    if ($(this).html() == 'Delete') {
      sweetAlert({title: "Are you sure you want to delete this schedule?", type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: "Yes", closeOnConfirm: false }, 
      function(){
        var schedName = $("#schedSelect").val();
        schedURL = "/Sched?addRem=del&schedName="+schedName;
        SendReq(schedURL, ListScheds, 1);
        sweetAlert({title: "Your schedule has been deleted.", type: "success", timer: 1000}); 
      });
    }
    if ($(this).html() == 'Recolor') {
      colorPalette = JSON.parse(sessionStorage.colorPalette);
      newcolorPalette = shuffle(colorPalette); // Randomly reorder the colorPalette
      sessionStorage.colorPalette = JSON.stringify(colorPalette);
      SpitSched(JSON.parse(sessionStorage.currentSched));
    }
  });
}

function OtherTriggers() {
  $('#schedSelect').change(function () { // If the user changes the active schedule
    var schedName = $('#schedSelect').val();
    // var schedURL = "/Sched?addRem=blank&courseID=blank&schedName="+schedName;
    // SendReq(schedURL, SpitSched, []);
    SpitSched(JSON.parse(sessionStorage.schedInfo)[schedName]);
  });

  $('#reqFilter, #proFilter').change(function () { // If the user changes any filters
    var lastreq = JSON.parse(sessionStorage.lastCourseSearch);
    getCourseNumbers(lastreq[0], lastreq[1]);
  });

  $('#closedCheck, #actFilter').change(function () { // If the user changes any filters
    UpdateFilters();
  });

  $('#searchSelect').change(function () { // If the user changes the type of search
    var searchTerms = $('#CSearch').val(); // Get raw search
    if (searchTerms !== '') {
      initiateSearch();
    }
  });
}

function ListScheds(schedInfo, theindex) { // Deal with the list of schedules
  // Receives all schedule data, makes a list of schedules, chooses the "active" schedule and renders it.
  var schedList = Object.keys(schedInfo);
  var schedSelect = $('#schedSelect');
  schedSelect.empty();
  for(var schedName in schedList) { if (schedList.hasOwnProperty(schedName)) {
    schedSelect.append('<option value="'+schedList[schedName]+'">'+schedList[schedName]+'</option>'); // Populate the schedSelect dropdown
  }}

  var visibleSched;
  if (theindex === 0) { // If this is a simple listing, set the first option as selected
    visibleSched = schedList[0];
  } else { // If we want to show a specific schedule
    visibleSched = schedList[schedList.length - theindex];
  }
  $('#schedSelect').find('option[value="'+visibleSched+'"]').attr("selected","selected");
  SpitSched(schedInfo[visibleSched]);

  sessionStorage.schedList = JSON.stringify(schedList);
  sessionStorage.schedInfo = JSON.stringify(schedInfo);
}
 
function initiateSearch() { // Deal with course search terms
  var searchTerms = $('#CSearch').val(); // Get raw search
  try {
    if (searchTerms != 'favicon.ico' && searchTerms != 'blank' && searchTerms !== '') { // Initial filtering
      var searchSelect = $('#searchSelect').val(); // What type of search is this
      var deptSearch, numbSearch, sectSearch;
      if (searchSelect == 'courseIDSearch') {
        // Format search terms for server request
        var splitTerms = formatID(searchTerms);

        // By now the search terms should be 'DEPT/NUM/SEC/' although NUM/ and SEC/ may not be included
        deptSearch = splitTerms[0]; // Get deptartment
        numbSearch = (splitTerms[1] || ''); // Get course number
        sectSearch = (splitTerms[2] || ''); // Get section number
        // if(!numbSearch){numbSearch = '';}
        // if(!sectSearch){sectSearch = '';}

      } else {
        deptSearch = searchTerms; // Not really a department search but it will go to getCourseNumbers
        numbSearch = ''; // Get course number
        sectSearch = ''; // Get section number
      }

      getCourseNumbers(deptSearch, searchSelect);

      if (numbSearch.length == 3) {
        getSectionNumbers(deptSearch+numbSearch, 'all', sectSearch.length);

        if (sectSearch.length == 3) {
          getSectionInfo(deptSearch+numbSearch+sectSearch);
        } else {
          $('#SectionInfo').empty();
        }
      } else { // If there is no course number, clear the section list and info panel
        $('#SectionTitle').empty();
        $('#CourseTitle').empty();
        $('#SectionList > ul').empty();
        $('#SectionInfo').empty();
      }
    } else if (searchTerms !== '' ) { // If there are no good search terms, clear everything
      $('#CourseList').empty();
      $('#CourseTitle').empty();
      $('#SectionList > ul').empty();
      $('#SectionInfo').empty();
    }
  } 
  catch(err) {console.log('No Results '+ err);}
}
 
function formatID(searchTerms) {
  splitTerms = searchTerms.replace(/ /g, "").replace(/-/g, "").replace(/:/g, ""); // Remove spaces, dashes, and colons

  if (parseFloat(splitTerms[2]) == splitTerms[2]) { // If the third character is a number (e.g. BE100)
    splitTerms = splitTerms.substr(0, 2)+'/'+splitTerms.substr(2); // Splice the search query with a slash after the deptartment
    if (parseFloat(splitTerms[6]) == splitTerms[6]) { // Then, if the sixth character is a number (e.g. BE100001)
      splitTerms = splitTerms.substr(0, 6)+'/'+splitTerms.substr(6, 3); // Splice the search query with a slash after the course number
    }
  } else if (parseFloat(splitTerms[3]) == splitTerms[3]) { // If the fourth character is a number (e.g. CIS110)
    splitTerms = splitTerms.substr(0, 3)+'/'+splitTerms.substr(3); // Splice the search query with a slash after the deptartment 
    if (parseFloat(splitTerms[7]) == splitTerms[7]) { // Then, if the seventh character is a number (e.g. CIS110001)
      splitTerms = splitTerms.substr(0, 7)+'/'+splitTerms.substr(7, 3); // Splice the search query with a slash after the course number
    }
  } else if (parseFloat(splitTerms[4]) == splitTerms[4]) { // If the fifth character is a number (e.g. MEAM110)
    splitTerms = splitTerms.substr(0, 4)+'/'+splitTerms.substr(4); // Splice the search query with a slash after the deptartment
    if (parseFloat(splitTerms[8]) == splitTerms[8]) { // Then, if the eighth character is a number (e.g. MEAM110001)
      splitTerms = splitTerms.substr(0, 8)+'/'+splitTerms.substr(8, 3); // Splice the search query with a slash after the course number
    }
  }
  // At this point the format should be "dept/num/sec"
  // Return as a list
  return splitTerms.split('/');
}

function getCourseNumbers(search, searchSelect) { // Getting info about courses in a department
  // Which filters are activated?
  var requireFilter   = '&reqParam=' + $('#reqFilter').val();
  var programFilter   = '&proParam=' + $('#proFilter').val();
  var activityFilter  = '&actParam=' + $('#actFilter').val();
  if (requireFilter   == '&reqParam=noFilter')  {requireFilter = '';}
  if (programFilter   == '&proParam=noFilter')  {programFilter = '';}
  if (activityFilter  == '&actParam=noFilter')  {activityFilter = '';}

  sessionStorage.lastCourseSearch = JSON.stringify([search, searchSelect]);

  var searchURL = '/Search?searchType='+searchSelect+'&resultType=deptSearch&searchParam='+search+requireFilter+programFilter+activityFilter;
  SendReq(searchURL, CourseFormat); // Send results to CourseFormat
}
 
function CourseFormat(JSONRes, passVar) { // Get course number info and display it
  if (typeof JSONRes === 'string') {JSONRes = JSON.parse(JSONRes);} // JSONify the input
  var allHTML = '';
  if ($.isEmptyObject(JSONRes)) { // If it's empty
    allHTML = '&nbsp&nbsp&nbsp&nbsp&nbspNo Results';
  } else {
    allHTML = '<ul>';
    for(var course in JSONRes) { if (JSONRes.hasOwnProperty(course)) { // Add a line for each course
      pcrFrac = 0;
      allHTML += '<li id="'+JSONRes[course].courseListName.replace(' ', '-')+'">'+'<span class="PCR tooltip" style="background-color:rgba(45, 160, 240, '+pcrFrac*pcrFrac+')">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;&nbsp;'+
        '<span class="courseNumber">'+JSONRes[course].courseListName+'</span>'+
        '<span class="CourseTitle"> - '+JSONRes[course].courseTitle+'</span></li>';

    }}
    allHTML += '</ul>';
  }
  $('#CourseList').html(allHTML); // Put the course number list in #CourseList
  for (var courseID in JSONRes) { // Add PCR data
    var fullID = JSONRes[courseID].courseListName;
    RetrievePCR(fullID);
  }
  $('.tooltip', '#CourseList').tooltipster({
    position: 'right'
  });
}
 
function getSectionNumbers(cnum, instFilter, suppress) { // Getting info about sections in a department
  searchURL = "/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam="+cnum+"&instFilter="+instFilter;
  SendReq(searchURL, FormatSectionsList, suppress); // Pass it to SectionStars to determine if each section is starred
}
 
function FormatSectionsList(courseInfo, suppress) { // Receive section and star info and display them
  if (typeof courseInfo === 'string') {courseInfo = JSON.parse(courseInfo);} // JSONify the input
  if (courseInfo[1] == 'No Results') {
    $('#CourseTitle').html('No Results');
    $('#SectionList > ul').empty();
  } else {
    var allHTML = '';
    var stars = sessionStorage.starList;
    var sections = courseInfo[0];

    for(var section in sections) { if (sections.hasOwnProperty(section)) { // Loop through the sections
      var starClass = 'fa-star-o';
      var index = stars.indexOf(sections[section].NoSpace);
      if (index > -1) {starClass = 'fa-star';} // If the section is a starred section, add the filled star

      allHTML += '<li id="' + sections[section].SectionName.replace(/ /g,'-') + '" class="' + sections[section].ActType + '">'+
        '<i class="fa fa-plus"></i>&nbsp&nbsp'+
        '<span class="'+sections[section].StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;'+
        '<span class="PCR tooltip">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;'+
        '<span>'+sections[section].SectionName + sections[section].TimeInfo+'</span>'+
        '<i class="fa '+starClass+'"></i></li>';
    }}
    $('#CourseTitle').html(sections[section].CourseTitle);
    $('#SectionList > ul').html(allHTML); // Put the course number list in  #SectionList
    UpdateFilters();
    for (var sec in sections) {
      RetrievePCR(sections[sec].SectionName, sections[sec].SectionInst.toUpperCase().replace(/ /g, '-').replace(/\./, '-'));
    }
    UpdatePlusCancel();
    $('.tooltip', '#SectionList').tooltipster({
      position: 'right'
    });
    if (!suppress) { // We do this if we also sent out a getSectionInfo request so that this data doesn't overwrite that data
      courseInfo[1].FullID = courseInfo[1].CourseID;
      delete courseInfo[1].Instructor;
      delete courseInfo[1].OpenClose;
      delete courseInfo[1].TimeInfo;
      delete courseInfo[1].AssociatedType;
      delete courseInfo[1].AssociatedSections;
      SectionInfoFormat(courseInfo[1]);
    }
  }
}
 
function getSectionInfo(sec) { // Get info about the specific section
  searchURL = "/Search?searchType=courseIDSearch&resultType=sectSearch&searchParam="+sec;
  SendReq(searchURL, SectionInfoFormat, []);
}
 
function SectionInfoFormat(data, passvar) { // Receive section specific info and display
  if (typeof data === 'string') {data = JSON.parse(data);} // JSONify the input
  if (data == "No Results") {
    $('#SectionInfo').html('No Results'); 
  } else {
    var HTMLinfo = "";
    // if (data.Instructor)  {HTMLinfo += "<span>&nbsp + &nbsp</span>";}
    if (data.FullID)        {HTMLinfo += "<span>" + data.FullID + "</span>";} // Format the whole response
    if (data.Title)         {HTMLinfo += " - " + data.Title + "<br><br>";}
    if (data.Instructor)    {HTMLinfo += "Instructor: " + data.Instructor + "<br><br>";}
    if (data.TimeInfo)      {HTMLinfo += data.TimeInfo + "<br>";}
    if (data.Description)   {HTMLinfo += "Description:<br>" + data.Description + "<br>";}
    if (data.OpenClose)     {HTMLinfo += "Status: " + data.OpenClose + "<br><br>";}
    if (data.termsOffered)  {HTMLinfo += data.termsOffered + "<br><br>";}
    if (data.Prerequisites) {HTMLinfo += "Prerequisites: " + data.Prerequisites + "<br><br>";}
    if (data.AssociatedType){
      HTMLinfo += 'Associated ' + data.AssociatedType + '<br><br><ul>';
      for (var assc in data.AssociatedSections) {
        HTMLinfo += '<li class="AsscSec" id="' + data.AssociatedSections[assc].replace(/ /g, ' ') + '"><span>' + data.AssociatedSections[assc] + '</span></li>';
      }
      HTMLinfo += '</ul>';
    }
    $('#SectionInfo').html(HTMLinfo);
  }
}

function UpdateFilters() { // When a filter value changes, hide and show the relevant sections
  $('#SectionList li').show();
  var filterVal = $('#actFilter').val();
  if (!$('#closedCheck').is(':checked')) {
    $('.ClosedSec').parent().hide();
  }
  if ($('#actFilter').val() != 'noFilter') {
    $('#SectionList li').not('.'+filterVal).hide();
  }
}

function UpdatePlusCancel() { // When a course is added or removed, update the plus-x icon of the course
  var schedSecList = $.map(JSON.parse(sessionStorage.currentSched), function(el) { 
    return el.fullCourseName.replace(/ /g, ''); 
  }); // Return a list of scheduled sections in the correct format
  $('#SectionList li').each(function(i) {
    if (schedSecList.indexOf($(this).attr('id').replace(/-/g, '')) != -1) {
      $(this).find('i').first().removeClass('fa-plus').addClass('fa-times');
    } else {
      $(this).find('i').first().removeClass('fa-times').addClass('fa-plus');
    }
  });
}
 
function Stars(addRem, CID) { // Manage star requests
  var searchURL = "/Star?addRem="+addRem+"&courseID="+CID;
  SendReq(searchURL, StarHandle, addRem);
}
 
function StarHandle(data, addRem) {
  if (typeof data === 'string') {data = JSON.parse(data);} // JSONify the input
  if (addRem == 'show') { // If the user clicked "Show Stars"
    $('#SectionList > ul').empty();
    for(var sec in data) { if (data.hasOwnProperty(sec)) { // Request section and time info for each star
      var searchURL = "/Search?searchType=courseIDSearch&resultType=numbSearch&searchParam="+data[sec]+"&instFilter=all";
      SendReq(searchURL, StarFormat, []);
    }}
    if (typeof sec === 'undefined') {
      $('#CourseTitle').html('No starred sections');
      $('#SectionList > ul').empty();
    }
  } else { // Otherwise, pass through
    sessionStorage.starList = JSON.stringify(data);
    return data;
  }
}
 
function StarFormat(sections) { // Format starred section list
  if (typeof sections === 'string') {sections = JSON.parse(sections);} // JSONify the input
  var starClass = 'fa-star';
  var HTML = '';
  for(var section in sections[0]) { if (sections[0].hasOwnProperty(section)) {    
    HTML += '<li id="' + sections[0][section].SectionName.replace(/ /g,'-') + '" class="starredSec">'+
      '<i class="fa fa-plus"></i>&nbsp&nbsp'+
      '<span class="'+sections[0][section].StatusClass+'">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;'+
      '<span class="PCR tooltip">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp;&nbsp;'+
      '<span>'+sections[0][section].SectionName + sections[0][section].TimeInfo+'</span>'+
      '<i class="fa '+starClass+'"></i></li>';
  }}
  if (sections[0]) {
    $('#CourseTitle').html('Starred Sections');
  } else {
    $('#CourseTitle').html('No Starred Sections');
  }
  $('#SectionList > ul').append(HTML); // Put the course number list in  #SectionList  
  UpdatePlusCancel();
  for (var sec in sections[0]) {
    RetrievePCR(sections[0][sec].SectionName);
  }
  $('.tooltip', '#SectionList').tooltipster({
    position: 'right'
  });
}

function RetrievePCR(courseID, instName) {
  var dept = courseID.split(' ')[0];
  if (!localStorage['Review'+dept]) { // If we don't have the dept reviews cached
    LoadingSum += 1; 
    LoadingIndicate();
    baseURL = '/NewReview?dept=' + dept; // Get them
    try {
      $.ajax({
        url: baseURL,
        dataType: "json",
        async: false // Yeah it's asynchronous, but otherwise the function runs ahead of itself
      }) // Make the request
      .done(function(data) {
        localStorage['Review'+dept] = JSON.stringify(data); // Cache that jawn
        ApplyPCR(courseID, instName);
        return 'done';
      })
      .complete(function() {
        LoadingSum -= 1;
        LoadingIndicate();
      });
    } catch(error) {
      console.log(error);
    }
  } else {
    ApplyPCR(courseID, instName);
    return 'done';
  }
}

function ApplyPCR(courseID, instName) {
  var dept = courseID.split(' ')[0];
  var searchID = dept + ' ' + courseID.split(' ')[1];
  var allReviews = JSON.parse(localStorage['Review'+dept]); // Search the cache for reviews
  var thisReview = allReviews[searchID]; // Find relevant course info
  var result;
  if (typeof thisReview === 'undefined') {
    result = {};
  }
  else if (typeof instName === 'undefined') { // If we aren't getting reviews for a specific instructor
    if (typeof thisReview !== 'undefined') {
      result = thisReview.Total;
    }
  } else {
    result = thisReview.Total;
    for (var inst in thisReview) {
      if (inst.indexOf(instName.toUpperCase()) > -1) { // Go by specific instructor
        result = thisReview[inst];
        break;
      }
    }
  }
  var thisElement = $('#'+courseID.replace(/ /g, '-'));
  var thisPCR = thisElement.find('.PCR');
  try {
    pcrFrac = result.cQ / 4;
    if(!isNaN(result.cQ)) {
      cQStr = result.cQ.toString();
      if (cQStr.length == 1) {cQStr += '.';} // Format it correctly as '3.00' or '2.50'
      while (cQStr.length < 4) {
        cQStr += '0';
      }
      thisPCR.html(cQStr);
    } else {
      thisPCR.html('0.00'); // Set it to 0.00 on weird error
    }
  } catch(err) {
    pcrFrac = 0;
  }
  thisPCR.css('background-color', 'rgba(45, 160, 240, '+Math.pow(pcrFrac, 5)*5+')'); // Correct PCR shading
  if (result) {
    thisPCR.prop('title', 'Diff: '+ (result.cD || '0.00') + ' Instructor: ' + (result.cI || '0.00')); // Add the title for tooltipster
  }
}

function addToSched(sec, schedName) { // Getting info about a section
  var formattedSec = formatID(sec).join('-');
  var schedURL = "/Sched?addRem=add&schedName="+schedName+"&courseID="+formattedSec; // Make the request
  SendReq(schedURL, SpitSched, []);
  try {
    $('#'+formattedSec+' i:nth-child(1)').toggleClass('fa-plus').toggleClass('fa-times');
  } catch(err) {
    console.log(err);
  }
}
 
function removeFromSched(sec, schedName) {
  // Determine the secname by checking when a character is no longer a number (which means the character is the meetDay of the block id)
  // This gets all meet times of a section, including if there are more than one
  var secarray = formatID(sec);
  var secname = secarray.join("");
  if (!secname.length) {secname = formattedSec;}
  var schedURL = "/Sched?addRem=rem&schedName="+schedName+"&courseID="+secname;
  SendReq(schedURL, SpitSched, []);
  try {
    $('#'+secarray.join("-")+' i:nth-child(1)').toggleClass('fa-plus').toggleClass('fa-times');
  } catch(err) {
    console.log(err);
  }
}

function SpitSched(courseSched) {
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
  incSun = 0; // no weekends
  incSat = 0;
 
  var sec, day;

  for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
    var secMeetHour = courseSched[sec].meetHour;
    if (secMeetHour <= startHour) { // If there are classes earlier than the default start
      startHour = Math.floor(secMeetHour); // push back the earliest hour
    }
    if (secMeetHour+courseSched[sec].HourLength >= endHour) { // Push back latest hour if necessary
      endHour = Math.ceil(secMeetHour+courseSched[sec].HourLength);
    }
    for (day in courseSched[sec].meetDay) {
      var letterDay = courseSched[sec].meetDay[day];
      if (letterDay == 'U') { // If there are sunday classes
        incSun = 1;
      }
      if (letterDay == 'S') { // If there are saturday classes
        incSat = 1; 
      }
    }
  }}
 
  if (incSun == 1) {weekdays.unshift('U'); fullWeekdays.unshift('Sunday');} // Update weekdays array if necessary
  if (incSat == 1) {weekdays.push('S'); fullWeekdays.push('Saturday');}
 
  percentWidth = 100 / (5 + incSun + incSat); // Update the block width if necessary
  var halfScale = 95 / (endHour - startHour + 1); // This defines the scale to be used throughout the scheduling process
  // + 1 keeps the height inside the box
 
  // Make the lines and time labels
  var schedHTML = '';
  var timeColHTML = '';
  if (!($.isEmptyObject(courseSched))){
    for (var i = 0; i <= (endHour - startHour); i++) { // for each hour
      toppos = (i) * halfScale + 7.5; // each height value is linearly spaced with an offset
      hourtext = Math.round(i+startHour); // If startHour is not an integer, make it pretty
      if (hourtext > 12) {hourtext -= 12;} // no 24-hour time
      timeColHTML += '<div class="TimeBlock" style="top:'+toppos+'%">'+hourtext+':00</div>'; // add time label
      schedHTML += '<hr width="100%"style="top:'+toppos+'%" >'; // add time line
    } 
    for (var daynum in weekdays) {
      schedHTML += '<div class="DayName" style="width:'+ percentWidth +'%;">'+fullWeekdays[daynum]+'</div>';
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
  var colorPal = JSON.parse(sessionStorage.colorPalette);
  for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
    colorMap[courseSched[sec].fullCourseName] = colorPal[colorinc]; // assign each section a color
    colorinc += 1;
  }}

  // Add the blocks
  for (sec in courseSched) { if (courseSched.hasOwnProperty(sec)) {
    for (day in courseSched[sec].meetDay) {  if (courseSched[sec].meetDay.hasOwnProperty(day)) { // some sections have multiple meeting times and days
      var meetLetterDay = courseSched[sec].meetDay[day]; // On which day does this meeting take place?
      var blockleft;
      for (var possDay in weekdays) { 
        if (weekdays[possDay] == meetLetterDay) {
          blockleft = possDay*percentWidth; { break; } // determine left spacing
        }
      }
      var blocktop  = (courseSched[sec].meetHour - startHour) * halfScale + 9; // determine top spacing based on time from startHour (offset for prettiness)
      var blockheight = courseSched[sec].HourLength * halfScale;
      var blockname   = courseSched[sec].fullCourseName;
      var meetRoom  = courseSched[sec].meetRoom;
      var thiscol  = colorMap[courseSched[sec].fullCourseName]; // Get the color
      if(typeof thiscol === 'undefined'){thiscol = '#E6E6E6';}
      var newid = (courseSched[sec].fullCourseName.replace(/ /g, "-") + '-' + weekdays[possDay]+ courseSched[sec].meetHour).replace(".", "");

      schedElement.append('<div class="SchedBlock ' + sec + ' ' + weekdays[possDay] + '" id="'+ newid + // Each block has three classes: SchedBlock, The courseSched entry, and the weekday. Each block has a unique ID
        '" style="top:'+blocktop+
        '%;left:'+blockleft+
        '%;width:'+percentWidth+
        '%;height:'+blockheight+
        '%;background-color:'+thiscol+
        '"><div class="CloseX">x</div><span class="SecName">'+blockname+'</span><br><span class="LocName">'+meetRoom+'</span></div>');

      $('.SchedBlock').each(function(i) { // Check through each previously added meettime
        var thisBlock = $(this);
        var oldClasses = thisBlock.attr('class').split(' ');
        var oldMeetFull = oldClasses[1]; // Get the courseSched key (so we can get the meetHour and HourLength values)
        var oldMeetDay = oldClasses[2]; // Don't compare blocks on different days cause they can't overlap anyway
        if (oldMeetFull != sec && oldMeetDay == weekdays[possDay]) { // If we aren't comparing a section to itself & if the two meetings are on the same day
          if (twoOverlap(courseSched[oldMeetFull], courseSched[sec])) { // Check if they overlap
            var oldBlockWidth = thisBlock.outerWidth() * 100 / $('#Schedule').outerWidth();
            thisBlock.css('width', (oldBlockWidth / 2) + '%'); // Resize old block
            var newElement = $('#'+newid);
            var newleft = (newElement.offset().left - schedElement.offset().left) * 100 / schedElement.outerWidth(); // Get shift in terms of percentage, not pixels
            // If a block overlaps with two different blocks, then we only want to shift it over once.
            // The twoOverlap function only checks vertical overlap
            var plusOffset;
            if (thisBlock.offset().left == newElement.offset().left) { // If we haven't shifted the new block yet
              plusOffset = oldBlockWidth / 2;
            } else { //
              plusOffset = 0;
            }
            newElement.css('left', newleft + plusOffset + '%').css('width', (oldBlockWidth / 2) + '%');  // Shift and resize new block
          }
        }
      });
    }}
  }}

  sessionStorage.currentSched = JSON.stringify(courseSched);
  UpdatePlusCancel();
}

function twoOverlap (block1, block2) {
  // Thank you to Stack Overflow user BC. for the function this is based on.
  // http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
  var y1 = block1.meetHour;
  var h1 = block1.HourLength;
  var b1 = y1 + h1;
  
  var y2 = block2.meetHour;
  var h2 = block2.HourLength;
  var b2 = y2 + h2;

  // This checks if the top of block 2 is lower down (higher value) than the bottom of block 1...
  // or if the top of block 1 is lower down (higher value) than the bottom of block 2.
  // In this case, they are not overlapping, so return false
  if (b1 <= y2 || y1 >= b2) return false;
  return true;
}

function detectIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  var trident = ua.indexOf('Trident/');

  if (msie > 0 || trident > 0) {
    return true;
  } else {
    return false;
  }
}