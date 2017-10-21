var fs = require('fs');
var engreq = require('./engreq.json');

var code = process.argv[4].toUpperCase();
console.log(code)
var codearray = [];
if (code[0] == '[') {
	code = code.split('[')[1];
	var codesplit = code.split(',');
	var dept = codesplit[0];
	for (var i = 1; i < codesplit.length; i++) {
		codearray.push(dept+'-'+codesplit[i]);
	}
} else {
	codearray[0] = code;
}
var req = process.argv[2].toLowerCase();
var tf = (process.argv[3][0] == 't');

for (var i = 0; i < codearray.length; i++) {
	if (!engreq[codearray[i]]) {
		engreq[codearray[i]] = {}
	}
	engreq[codearray[i]][req] = tf;
	if (req == 'tbs') { // TBS classes by definition do not count for eng
		engreq[codearray[i]].eng = false;
	}
	if (req == 'writ') {
		if (process.argv[3][0].toLowerCase() == 'H') {engreq[codearray[1]].hum = true;}
		if (process.argv[3][0].toLowerCase() == 'S') {engreq[codearray[1]].ss = true;}
	}
}
console.log(engreq)
fs.writeFile('./engreq.json', JSON.stringify(engreq), function (err) {
	if (err) {
		console.log("error: " + err);
	}
});