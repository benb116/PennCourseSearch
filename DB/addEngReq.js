/*

This script is used to easily add entries into the engreq.json file
node addEngReq.js natsci t CAMB
node addEngReq.js ss t [ECON,101,102
node addEngReq.js writ h WRIT-014

*/
var fs = require('fs');
var engreq = require('./engreq.json'); // pull existing info
var code = process.argv[4].toUpperCase();

var codearray = [];
if (code[0] === '[') { // If we want to add multiple classes in a dept
    code = code.split('[')[1];
    var codesplit = code.split(',');
    var dept = codesplit[0]; // Get the dept
    for (var i = 1; i < codesplit.length; i++) { // create array of idDashed's
        codearray.push(dept+'-'+codesplit[i]);
    }
} else {
    codearray[0] = code;
}
var req = process.argv[2].toLowerCase();
var tf = (process.argv[3][0].toLowerCase() === 't');

for (var i = 0; i < codearray.length; i++) {
    if (!engreq[codearray[i]]) { // If the dept/course doesn't exist in the record, make an entry
        engreq[codearray[i]] = {};
    }
    engreq[codearray[i]][req] = tf; // Set the value
    if (req === 'tbs') { // TBS classes by definition do not count for eng
        engreq[codearray[i]].eng = false;
    }
    if (req === 'writ') { // For writing, instead of true or false, assume that a record means true and specifiy the req it fills
        if (process.argv[3][0].toLowerCase() === 'h') {engreq[codearray[i]].writ = true; engreq[codearray[i]].hum = true;}
        if (process.argv[3][0].toLowerCase() === 's') {engreq[codearray[i]].writ = true; engreq[codearray[i]].ss = true;}
    }
}
console.log(engreq);
fs.writeFile('./engreq.json', JSON.stringify(engreq), function (err) { // Write to file
    if (err) {
        console.log("error: " + err);
    }
});