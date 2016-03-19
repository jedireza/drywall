'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*\n' +
      ' * <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
      ' * <%= pkg.description %>\n' +
      ' * <%= pkg.homepage %>\n' +
      ' *\n' +
      ' * Made by <%= pkg.author.name %>\n' +
      ' * Under <%= pkg.license %> License\n' +
      ' */\n',

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'src/metisMenu.js'
      ]
    },
    concat: {
      plugin: {
        src: ['src/metisMenu.js'],
        dest: 'dist/metisMenu.js'
      },
      css: {
        src: ['src/metisMenu.css'],
        dest: 'dist/metisMenu.css'
      }
    },
    uglify: {
      plugin: {
        src: ['dist/metisMenu.js'],
        dest: 'dist/metisMenu.min.js'
      }
    },
    cssmin: {
      menucss: {
        src: ['src/metisMenu.css'],
        dest: 'dist/metisMenu.min.css'
      }
    },
    usebanner: {
      options: {
        position: 'top',
        banner: '<%= banner %>'
      },
      files: {
        src: 'dist/*.{css,js}'
      }
    },
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        hostname: 'localhost',
        base: [
          'dist',
          'test'
        ]
      },
      livereload: {
        options: {
          open: true
        }
      }
    },
    watch: {
      script: {
        files: ['src/**/*.js'],
        tasks: ['concat:plugin', 'uglify', 'usebanner']
      },
      style: {
        files: ['src/**/*.css'],
        tasks: ['concat:css', 'cssmin', 'usebanner']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'test/{,*/}*.html',
          'dist/{,*/}*.css',
          'dist/{,*/}*.js'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-banner');

  grunt.registerTask('travis', ['jshint']);
  grunt.registerTask('serve', ['connect:livereload', 'watch']);
  grunt.registerTask('default', [
    'jshint',
    'concat',
    'uglify',
    'cssmin',
    'usebanner'
  ]);
};
