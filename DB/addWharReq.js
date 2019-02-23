var fs = require('fs');

var oldd = require('./OldWharton.json');
var newd = require('./NewWharton.json');

var obj2 = {};


var GEDOldmap = {
	'SS': 'WSST',
	'SandT': 'WSAT',
	'LAC': 'WLAC'
};

for (var c in oldd.data) {
	var thisc = oldd.data[c];
	var idDashed = thisc[0] + '-' + thisc[1].toString().padStart(3,'0');
	if (!obj2[idDashed]) {obj2[idDashed] = {};}

	if (thisc[3] === 'Yes ') {
		obj2[idDashed].global = 'WGLO';
	}
	var thisGED = GEDOldmap[thisc[4]];
	obj2[idDashed].GEDOld = thisGED;
}

var ccpmap = {
	'No -': 'N',
	'Yes -': 'WCCY',
	'See Advisor': 'WCCS',
	'Yes - CDUS': 'WCCC'
};

var GEDNewmap = {
	'H': 'WNHR',
	'NSME': 'WNNS',
	'SS': 'WNSS',
	'FGE': 'WNFR',
	'URE': 'WURE',
	'See Advisor': 'WNSA'
};

for (c in newd.data){
	var thisc = newd.data[c];
	var idDashed = thisc[0] + '-' + thisc[1].toString().padStart(3,'0');
	var thisGED = GEDNewmap[thisc[3]];
	var thisCCP = ccpmap[thisc[4]];
	// console.log(idDashed, thisGED, thisCCP)
	if (!obj2[idDashed]) {obj2[idDashed] = {};}
	if (thisCCP !== 'N') {
		obj2[idDashed].CCPNew = thisCCP;
	}
	obj2[idDashed].GEDNew = thisGED;
}
// console.log(obj2)

fs.writeFile('./wharreq.json', JSON.stringify(obj2, null, 4), function (err) { // Write to file
    if (err) {
        console.log("error: " + err);
    }
});