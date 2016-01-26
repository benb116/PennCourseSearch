function readCalFile() {
	var files = $('#schedInput')[0].files;
	if (!files || !files.length) {return;}

	var file = files[0];
	var reader = new FileReader();
	// If we use onloadend, we need to check the readyState.
	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			var secArr = parseCalFile(evt.target.result);
			if (secArr.length) {
				$('#importSubmit').prop('disabled', false);
			} else {
				$('#importSubmit').prop('disabled', true);
			}
			$('#secsToImport').empty();
			for (var i = 0; i < secArr.length; i++) {
				$('#secsToImport').append('<input type="checkbox" name="'+FormatID(secArr[i]).join('-')+'" checked><span style="display:inline">'+FormatID(secArr[i]).join(' ')+'</span><br>');
			}
			return secArr;
		} else {
			$('#importSubmit').prop('disabled', true);
			return [];
		}
	};
	var blob = file.slice(0, file.size-1);
	reader.readAsBinaryString(blob);
}

function parseCalFile(rawCal) {
	function FilterFunc (line) {
		if (line.split(':')[0] === 'SUMMARY') {
			return 1;
		}
	}
	function MapFunc (line) {
		return line.split('\r')[0].replace(/ /g, '').split(':')[1];
	  }

	var secs = rawCal.split('\n').filter(FilterFunc).map(MapFunc);
	var uniq = secs.filter(function(elem, pos) {
		return secs.indexOf(elem) == pos;
	}); 
	return uniq;
}