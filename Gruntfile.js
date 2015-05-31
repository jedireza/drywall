var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    distdir: 'client/dist',
    src: {
      angularJS: [
        'client/src/common/**/*.js',
        'client/src/app/**/*.js'
      ],
      angularTpl: ['<%= distdir %>/templates/**/*.js'],
      angularHtml: {
        app: ['client/src/app/**/*.tpl.html'],
        common: ['client/src/common/**/*.tpl.html']
      }
    },
    copy: {
      vendor: {
        files: [
          {
            expand: true, cwd: 'client/bower_components/jquery/dist/',
            src: ['jquery.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular/',
            src: ['angular.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-animate/',
            src: ['angular-animate.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-bootstrap/',
            src: ['ui-bootstrap.js', 'ui-bootstrap-tpls.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-cookies/',
            src: ['angular-cookies.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-resource/',
            src: ['angular-resource.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-route/',
            src: ['angular-route.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-sanitize/',
            src: ['angular-sanitize.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/angular-touch/',
            src: ['angular-touch.js'], dest: '<%= distdir %>/vendor/'
          },
          {
            expand: true, cwd: 'client/bower_components/moment/',
            src: ['moment.js'], dest: '<%= distdir %>/vendor/'
          }
        ]
      },
      asset: {
        files: [
          {
            expand: true, cwd: 'client/src/assets/',
            src: ['favicon.ico'], dest: '<%= distdir %>/'
          },
          {
            expand: true, cwd: 'client/src/assets/img/',
            src: ['*.png', '*.gif', '*.jpg'], dest: '<%= distdir %>/img/'
          },
          {
            expand: true, cwd: 'client/bower_components/font-awesome/fonts/',
            src: ['*'], dest: '<%= distdir %>/fonts/'
          }
        ]
      },
      index: {
        files: [
          {
            expand: true, cwd: 'client/src/',
            src: ['index.html'], dest: '<%= distdir %>/'
          }
        ]
      }
    },
    concat: {
      angular: {
        src: ['<%= src.angularJS %>', '<%= src.angularTpl %>'],
        dest: '<%= distdir %>/app.js'
      }
    },
    html2js: {
      app: {
        options: {
          base: 'client/src/app'
        },
        src: ['<%= src.angularHtml.app %>'],
        dest: '<%= distdir %>/templates/app.js',
        module: 'templates.app'
      },
      common: {
        options: {
          base: 'client/src/common'
        },
        src: ['<%= src.angularHtml.common %>'],
        dest: '<%= distdir %>/templates/common.js',
        module: 'templates.common'
      }
    },
    sass: {
      dev: {
        options: {
          style: 'expanded',
          compass: false,
          loadPath: '.'
        },
        files: {
          '<%= distdir %>/css/style.css': 'client/src/assets/sass/style.scss'
        }
      }
    },
    karma: {
      unit: {
        configFile: 'client/test/karma.conf.js'
      },
      watch: {
        configFile: 'client/test/karma.conf.js',
        background: true,
        singleRun: false
      }
    },
    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    nodemon: {
      dev: {
        script: 'app.js',
        options: {
          ignore: [
            'node_modules/**',
            'client/**'
          ],
          ext: 'js'
        }
      }
    },
    watch: {
      angularIndex: {
        files: ['client/src/index.html'],
        tasks: ['copy:index']
      },
      angularJS: {
        files: ['<%= src.angularJS %>'],
        tasks: ['newer:concat', 'newer:jshint:client']
      },
      angularHtmlTpl: {
        files: ['<%= src.angularHtml.app %>', '<%= src.angularHtml.common %>'],
        tasks: ['newer:html2js', 'newer:concat']
      },
      sass: {
        files: ['client/src/assets/sass/**/*.scss'],
        tasks: ['sass:dev']
      },
      serverJS: {
        files: ['service/**/*.js'],
        task: ['newer:jshint:server']
      }
    },
    jshint: {
      client: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
           'client/src/common/directives/gravatar.js'
          ]
        },
        src: [
          'client/src/app/**/*.js',
          'client/src/common/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'schema/**/*.js',
          'service/**/*.js'
        ]
      }
    },
    clean: {
      src: [
        'client/dist/**'
      ]
    },
    useminPrepare: {
      html: '<%= distdir %>/index.html',
      options: {
        dest: '<%= distdir %>/'
      }
    },
    usemin: {
      html: ['<%= distdir %>/index.html']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');


  grunt.registerTask('angular', ['copy', 'html2js', 'concat:angular', 'sass:dev']);

  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('unitTest', ['clean', 'angular', 'karma:unit']);
  grunt.registerTask('test', ['clean', 'lint']);

  grunt.registerTask('dev', ['clean', 'angular', 'concurrent']);
  grunt.registerTask('production', ['clean', 'angular', 'useminPrepare', 'concat:generated', 'uglify:generated', 'cssmin:generated', 'usemin']);

  grunt.registerTask('default', ['dev']);
};
