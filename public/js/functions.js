$(document).ready(function() {
    $('a[rel*=leanModal]').leanModal({
        top: 70,
        closeButton: ".modal_close"
    }); // Define modal close button

    var subtitles = [
        "Free shipping on all items in your course cart",
        "You can press the back button, but you don't even need to.",
        "Invented by Benjamin Franklin in 1793",
        "Faster than you can say 'Wawa run'",
        "Classes sine PennCourseSearch vanae",
        // "On PennCourseSearch, no one knows you're Amy G.",
        "Designed by Ben in Speakman. Assembled in China.",
        "Help! I'm trapped in a NodeJS server! Bring Chipotle!",
        "With white sauce AND hot sauce",
        "Now 3.9% faster",
        "Number of squirrels online: 6",
        "Handling the business side since 2014",
        "Actually in touch"
    ];
    var paymentNoteBase = "https://venmo.com/?txn=pay&recipients=BenBernstein&amount=1&share=f&audience=friends&note=";
    var paymentNotes = [
        "PennCourseSearch%20rocks%20my%20socks!",
        "Donation%20to%20PennInTouch%20Sucks,%20Inc.",
        "For%20your%20next%20trip%20to%20Wawa",
        "Offsetting%20the%20increased%20price%20of%20chicken%20over%20rice"
    ];
    $('#subtitle').html(subtitles[Math.floor(Math.random() * subtitles.length)]); // Show a random subtitle
    $('#paymentNote').attr('href', paymentNoteBase + paymentNotes[Math.floor(Math.random() * paymentNotes.length)]); // Use a random payment note

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
            } else {
                if (localStorage.getItem('secondvisit')) {
                    // if (!localStorage.getItem('survey2017C')) {
                    //     localStorage.setItem('survey2017C', 'true');
                    //     sweetAlert({
                    //         title: 'PCS Alert',
                    //         html: true,
                    //         confirmButtonText: "Close",
                    //         text: 'Love PCS? Hate it? Want to vent about your life?<br>Take a quick <a target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSegplgiZsgEZDtIPlYeWN0QwJMj4iqqphS3m7Wp_HFYgqcYNQ/viewform">survey!</a>',
                    //         type: 'warning'
                    //     });
                    // }
                } else {
                    localStorage.setItem('secondvisit', 'true');
                }
            }
        });
    }
    var today = new Date();
    if (today.getMonth() === 3 && today.getDate() === 0) {
        $('.fa-volume-off').css("visibility", "visible");
        $('body').append('<iframe style="visibility:hidden;display:none" width="0" height="0" src="https://www.youtube.com/embed/64vJoGcokVE?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>')
    }
    // GA Tracking
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-49014722-4', 'auto');
    ga('send', 'pageview');

    if (!window.File) {
        $('#ImportButton').hide();
    }
});

function ErrorAlert(err) {
    // Shows an error dialog and logs the error to the console
    // Also includes the error report in an email that can be sent to Ben
    var errtext = 'An error occurred. Refresh or <a href="mailto:bernsb@seas.upenn.edu?Subject=PCS%20IS%20BROKEN!!!!&body=Error%20message:%20' + encodeURIComponent(JSON.stringify(err)) + '">email Ben</a>';

    if (err.status === 512) {
        errtext = "PennInTouch just crapped out on us. Please try again.";
    } else if (err.status === 513) {
        errtext = "PennInTouch is refreshing, so we can't access class info :( <br> Please frustratedly wait about half an hour before trying again.";
    }
    sweetAlert({
        title: '#awkward',
        html: true,
        text: errtext,
        type: 'error'
    });
}

function Uniquify(str, arr) {
    // Given an array and a string, this ensures that the string doesn't already exist in the array
    if (arr.indexOf(str) === -1) {
        return str;
    } else { // If it does, then we "+1" the string
        var lastchar = str[str.length - 1];
        if (isNaN(lastchar) || str[str.length - 2] !== ' ') { // e.g. if string == 'schedule' or 'ABC123'
            str += ' 2'; // becomes 'schedule 2' or 'ABC123 2'
        } else { // e.g. 'MEAM 101 2'
            str = str.slice(0, -2) + ' ' + (parseInt(lastchar) + 1); // becomes "MEAM 101 3"
        }
        return Uniquify(str, arr); // Make sure that this new name is unique
    }
}

var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

shuffle = function(v) {
    // Randomly reorders an array.
    //+ Jonas Raoni Soares Silva @ http://jsfromhell.com/array/shuffle [v1.0]
    for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};

function addrem(item, array) {
    // Adds or removes an item from an array depending on whether the array already contains that item.
    var index = array.indexOf(item);
    if (index === -1) {
        array.push(item);
    } else {
        array.splice(index, 1);
    }
    return array;
}

function FormatID(rawParam) {
    var searchParam = rawParam.replace(/\W/g, ''); // Replace non alpha-numeric characters
    var retArr = ['', '', ''];

    if (isFinite(searchParam[2])) {  // If the third character is a number (e.g. BE100)
        splitTerms(2);
    } else if (isFinite(searchParam[3])) {  // If the fourth character is a number (e.g. CIS110)
        splitTerms(3);
    } else if (isFinite(searchParam[4])) {  // If the fifth character is a number (e.g. MEAM110)
        splitTerms(4);
    } else {
        retArr[0] = searchParam;
    }

    function splitTerms(n) {
        retArr[0] = searchParam.substr(0, n);
        retArr[1] = searchParam.substr(n, 3);
        retArr[2] = searchParam.substr(n+3, 3);
    }
    
    return retArr;
}

function Schedule(term) {
    // This is a blank schedule object constructor
    this.term = term; // e.g. "2016A"
    this.meetings = [];
    this.colorPalette = ["#e74c3c", "#f1c40f", "#3498db", "#9b59b6", "#e67e22", "#2ecc71", "#95a5a6", "#FF73FD", "#73F1FF", "#CA75FF", "#1abc9c", "#F64747", "#ecf0f1"]; // Standard colorPalette
    this.locAdded = false;
}

function GenMeetBlocks(sec) {
    var blocks = []
    for (day in sec.meetDay) { if (sec.meetDay.hasOwnProperty(day)) {
        var meetLetterDay = sec.meetDay[day]; // On which day does this meeting take place?
        var meetRoom      = sec.meetLoc;
        var newid         = sec.idDashed+'-'+meetLetterDay+sec.meetHour.toString().replace(".", "");
        var asscsecs      = sec.SchedAsscSecs;

        var newblock = {
            'class': sec.idDashed,
            'letterday': meetLetterDay,
            'id': newid,
            'startHr': sec.meetHour,
            'duration': sec.hourLength,
            'name': sec.idSpaced,
            'room': meetRoom,
            'asscsecs': asscsecs
        }
        blocks.push(newblock)
    }}
    return blocks;
}

function TwoOverlap(block1, block2) {
    // Thank you to Stack Overflow user BC. for the function this is based on.
    // http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
    var y1 = (block1.startHr || block1.top);
    var h1 = (block1.duration || block1.height);
    var b1 = y1 + h1;

    var y2 = (block2.startHr || block2.top);
    var h2 = (block1.duration || block2.height);
    var b2 = y2 + h2;

    

    // This checks if the top of block 2 is lower down (higher value) than the bottom of block 1...
    // or if the top of block 1 is lower down (higher value) than the bottom of block 2.
    // In this case, they are not overlapping, so return false
    if (b1 <= (y2 + 0.0000001) || b2 <= (y1 + 0.0000001)) {
        return false;
    } else {
        return true;
    }
}