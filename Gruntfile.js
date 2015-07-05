module.exports = function(grunt) {
 
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
		    build: {
		        files : {
			      'public/js/main.min.js' : 'public/js/main.js'
			    }
		    }
		},

		// cssmin: {
		//   target: {
		//     files: [{
		//       expand: true,
		//       cwd: 'public/css',
		//       src: 'index.css',
		//       dest: 'public/css',
		//       ext: '.min.css'
		//     }]
		//   }
		// }

		cssmin: {
		  options: {
		    shorthandCompacting: false,
		    roundingPrecision: -1
		  },
		  target: {
		    files: {
		      'public/css/index.min.css': ['public/css/index.css', 'public/css/modal.css']
		    }
		  }
		}

    });
 
    grunt.registerTask('default', ['uglify', 'cssmin'] );
 
};