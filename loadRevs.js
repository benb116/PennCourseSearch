var deptList = ["AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BE", "BENF", "BENG", "BEPP", "BFMD", "BIBB", "BIOE", "BIOL", "BIOM", "BIOT", "BMB", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CINE", "CIS", "CIT", "CLST", "COGS", "COLL", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DENT", "DOSP", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDCE", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENMG", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "GAFL", "GAS", "GCB", "GEND", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "INTS", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LGIC", "LGST", "LING", "LSMP", "MATH", "MCS", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OIDD", "OPIM", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PREC", "PRTG", "PSCI", "PSYC", "PSYS", "PUBH", "PUNJ", "REAL", "REG", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TELU", "THAR", "TURK", "URBS", "URDU", "VANB", "VBMS", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "WH", "WHCP", "WHG", "WRIT", "YDSH"];

var allRevs = {};
for (var dept in deptList) { if (deptList.hasOwnProperty(dept)) {
	try {
		var thedept = deptList[dept];
		allRevs[thedept] = require('./2016CRev/'+thedept);
	} catch(err) {
		
	}
}}
module.exports = allRevs;