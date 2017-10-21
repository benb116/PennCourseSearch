var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BDS", "BE", "BENF", "BENG", "BEPP", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BMIN", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CIMS", "CIS", "CIT", "CLST", "COGS", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DPED", "DPRD", "DRST", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCIN", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LAWM", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OIDD", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "VPTH", "WH", "WHCP", "WHG", "WRIT", "YDSH"];

var allCourses = [];
for (var dept in deptList) { if (deptList.hasOwnProperty(dept)) {
	try {
		var thedept = deptList[dept];
		var newte = require('./Data/2018A/'+thedept+'.json');
		allCourses = allCourses.concat(newte);
	} catch(err) {
		
	}
}}
module.exports = allCourses;