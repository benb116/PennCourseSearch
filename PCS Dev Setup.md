# PCS Development Setup

### Please follow the steps below to set up PCS in your dev environment

1. Clone the PCS repo from https://github.com/benb116/PennCourseSearch
2. You will need the following keys to run PCS:
	* OpenData request authorization bearers and tokens (see https://esb.isc-seo.upenn.edu/8091/documentation/)
		* PCS supports using multiple API keys for OpenData to achieve more than 100 requests per minute. 
	* Penn Course Review API token (see http://pennlabs.org/docs/pcr.html)
	* Keen IO keys (optional) (see https://keen.io/)
	* IFTTT key (optional) (see https://ifttt.com/)
3. In the top level of the directory, create your config.json file
	* The file should contain the following entries, filling in your values
		```
		var config = {};
		
		config.requestAB = ['', '']; // OpenData Authorization bearers array
		config.requestAT = ['','']; // OpenData Authorization tokens array, order matches requestAB
		
		config.PCRToken = '';
		
		config.KeenIOID = '';
		config.KeenIOWriteKey = '';
		
		config.IFTTTKey = '';
		
		module.exports = config;
		```
	* Alternatively, set the corresponding environment variables (see "index.js"
4. `npm install` the packages listed in "package.json"
5. Create a top-level directory called "Data" and subdirectories with the name of the term for course data and review data, respectively
	* Naming convention: course data in directory "2019A" (Spring, 2019) and review data in "2017CRev" (review data that was published in the fall of 2017)
6. In the files "index.js", "DB/DBManage.js", and "public/js/PCSangular.js", find the lines that define `currentTerm` and `currentRev`. Replace the strings as necessary with the same strings from the previous step.
7. In "DB/DBManage.js", find the line `var opendata = require('../opendata.js')(N);` N is the number of requests to make per minute while caching OpenData information. Change N to be less than 100 (I usually set it to 95).
8. From the DB directory, run the following command to begin caching course data: `node DBManage.js registrar 0`
	* Change 0 to be a dept (e.g. MEAM) to cache a specific department
	* Append a second number to stop at a certain department index (e.g. `node DBManage.js registrar 0 20`)
9. Run the same command with `review` instead of `registrar`
	* It is recommended to run this command in chunks so as not to overload the PCR API
10. **IF YOU ARE SETTING UP PRODUCTION** make sure that the `NODE_ENV` environment variable is set to `'production'`

This should be all you need to set up the environment. Run `node index.js` to start the server on port 3000
