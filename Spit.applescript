set deptlist to {"AAMW", "ACCT", "AFRC", "AFST", "ALAN", "AMCS", "ANAT", "ANCH", "ANEL", "ANTH", "ARAB", "ARCH", "ARTH", "ASAM", "ASTR", "BCHE", "BE", "BENG", "BEPP", "BFMD", "BIBB", "BIOE", "BIOL", "BIOM", "BMB", "BSTA", "CAMB", "CBE", "CHEM", "CHIN", "CINE", "CIS", "CIT", "CLST", "COGS", "COLL", "COML", "COMM", "CPLN", "CRIM", "DEMG", "DORT", "DOSP", "DPED", "DRST", "DTCH", "DYNM", "EALC", "EAS", "ECON", "EDUC", "EEUR", "ENGL", "ENGR", "ENM", "ENVS", "EPID", "ESE", "FNAR", "FNCE", "FOLK", "FREN", "FRSM", "GAFL", "GAS", "GCB", "GEOL", "GREK", "GRMN", "GSWS", "GUJR", "HCMG", "HEBR", "HIND", "HIST", "HPR", "HSOC", "HSPV", "HSSC", "IMUN", "INTG", "INTL", "INTR", "IPD", "ITAL", "JPAN", "JWST", "KORN", "LALS", "LARP", "LATN", "LAW", "LGIC", "LGST", "LING", "LSMP", "MAPP", "MATH", "MEAM", "MED", "MGEC", "MGMT", "MKTG", "MLA", "MLYM", "MMP", "MSCI", "MSE", "MSSP", "MTR", "MUSA", "MUSC", "NANO", "NELC", "NETS", "NGG", "NPLD", "NSCI", "NURS", "OPIM", "PERS", "PHIL", "PHRM", "PHYS", "PPE", "PRTG", "PSCI", "PSYC", "PUBH", "PUNJ", "REAL", "RELS", "ROML", "RUSS", "SAST", "SCND", "SKRT", "SLAV", "SOCI", "SPAN", "STAT", "STSC", "SWRK", "TAML", "TCOM", "TELU", "THAR", "TURK", "URBS", "URDU", "VCSN", "VCSP", "VIPR", "VISR", "VLST", "VMED", "WH", "WHCP", "WHG", "WRIT", "YDSH"}

repeat with dept in deptlist
	log dept
	do shell script "curl http://localhost:3000/Spit?dept=" & dept
	
	delay 5
end repeat
