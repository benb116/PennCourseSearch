$(document).ready(function() {
	$('.tooltip').tooltipster();
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
			}
		});
	}

	if (!window.File) {
		$('#ImportButton').hide();
	}
});

function ErrorAlert(err) {
	// Shows an error dialog and logs the error to the console
	// Also includes the error report in an email that can be sent to Ben
	console.log(err);
	sweetAlert({
		title: '#awkward',
		html: true,
		text: 'An error occurred. Refresh or <a href="mailto:bernsb@seas.upenn.edu?Subject=PCS%20IS%20BROKEN!!!!&body=Error%20message:%20' + encodeURIComponent(JSON.stringify(err)) + '">email Ben</a>',
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
