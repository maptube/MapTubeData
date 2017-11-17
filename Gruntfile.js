module.exports = function(grunt) {

  // Project configuration.
  //TODO: you might want to switch web_server for grunt-contrib-connect
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
	web_server: {
      options: {
        cors: true,
        port: 8000,
        nevercache: true,
        logRequests: true
	  },
      foo: 'bar' // For some reason an extra key with a non-object value is necessary 
    },
	documentation: {
        default: {
            files: [{
                "expand": true,
                "cwd": "src",
                "src": ["**/*.js"]
            }],
            options: {
                destination: "docs"
            }
        },
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  // Load the plugin that provides the "web-server" task.
  grunt.loadNpmTasks('grunt-web-server');
  
  // Load the plugin that provices the "documentation" task.
  grunt.loadNpmTasks('grunt-documentation');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('web-server',['web_server']);

};