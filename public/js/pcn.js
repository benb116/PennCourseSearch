function validEmail(email) {
	// Regex test to see if an email is valid
	var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

function promptNotify (secID) {
	ga('send', 'event', 'UI interaction', 'notify');
	// Register a user for notifications from PCN
	secID = secID.replace(/-/g, ' ');
	// Has the user put in an email already?
	var email = (localStorage.email || '');

	sweetAlert({
		title: "PennCourseNotify",
		text: "Get notified when "+secID+" opens up.",
		type: "input",
		inputPlaceholder: "bfrank@sas.upenn.edu",
		inputValue: email, // Make previous email defaut input value
		showCancelButton: true,
		closeOnConfirm: false,
		animation: "slide-from-top"
	}, function(inputValue) {
		if (inputValue === false) {
			return false;
		} else if (inputValue === "") {
			sweetAlert.showInputError("Please enter an email address");
			return false;
		} else if (!validEmail(inputValue)) { // If the user did not put in a valid email
			sweetAlert.showInputError('Please enter a valid email');
		} else { // If it's all good
			email = inputValue;
			localStorage.email = email;
			registerNotify(secID, email);
		}
	});
}

function registerNotify(secID, email) {
	sweetAlert({title: 'Requesting...'});
	$.post('/Notify?secID='+secID+'&email='+email).done(function(res, one, two) {
		var stat;
		if (two.status === 200) {
			stat = 'success';
		} else if (two.status >= 400) { // If there was an actual PCS server error or something
			sweetAlert.close();
			ErrorAlert(two);
		} else { // If there was a PCN error
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