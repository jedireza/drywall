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
            expand: true, cwd: 'bower_components/bootstrap/',
            src: ['js/**', 'less/**'], dest: 'public/vendor/bootstrap/'
          },
          {
            expand: true, cwd: 'bower_components/backbone/',
            src: ['backbone.js'], dest: 'public/vendor/backbone/'
          },
          {
            expand: true, cwd: 'bower_components/font-awesome/',
            src: ['fonts/**', 'less/**'], dest: 'public/vendor/font-awesome/'
          },
          {
            expand: true, cwd: 'bower_components/html5shiv/dist/',
            src: ['html5shiv.js'], dest: 'public/vendor/html5shiv/'
          },
          {
            expand: true, cwd: 'bower_components/jquery/dist/',
            src: ['jquery.js'], dest: 'public/vendor/jquery/'
          },
          {
            expand: true, cwd: 'bower_components/jquery.cookie/',
            src: ['jquery.cookie.js'], dest: 'public/vendor/jquery.cookie/'
          },
          {
            expand: true, cwd: 'bower_components/momentjs/',
            src: ['moment.js'], dest: 'public/vendor/momentjs/'
          },
          {
            expand: true, cwd: 'bower_components/respond/src/',
            src: ['respond.js'], dest: 'public/vendor/respond/'
          },
          {
            expand: true, cwd: 'bower_components/underscore/',
            src: ['underscore.js'], dest: 'public/vendor/underscore/'
          }
        ]
      },
      clientVendor: {
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
            expand: true, cwd: 'client/src/assets/img/',
            src: ['*.png', '*.gif', '*.jpg'], dest: '<%= distdir %>/img/'
          },
          {
            expand: true, cwd: 'bower_components/font-awesome/fonts/',
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
          compass: false
        },
        files: {
          '<%= distdir %>/css/style.css': 'client/src/assets/sass/style.scss'
        }
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
            'public/**'
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
      clientJS: {
         files: [
          'public/layouts/**/*.js', '!public/layouts/**/*.min.js',
          'public/views/**/*.js', '!public/views/**/*.min.js'
         ],
         tasks: ['newer:uglify', 'newer:jshint:client']
      },
      serverJS: {
         files: ['views/**/*.js'],
         tasks: ['newer:jshint:server']
      },
      clientLess: {
         files: [
          'public/layouts/**/*.less',
          'public/views/**/*.less',
          'public/less/**/*.less'
         ],
         tasks: ['newer:less']
      },
      layoutLess: {
        files: [
          'public/layouts/**/*.less',
          'public/less/**/*.less'
        ],
        tasks: ['less:layouts']
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: function(filePath) {
          return filePath + '.map';
        }
      },
      layouts: {
        files: {
          'public/layouts/core.min.js': [
            'public/vendor/jquery/jquery.js',
            'public/vendor/jquery.cookie/jquery.cookie.js',
            'public/vendor/underscore/underscore.js',
            'public/vendor/backbone/backbone.js',
            'public/vendor/bootstrap/js/affix.js',
            'public/vendor/bootstrap/js/alert.js',
            'public/vendor/bootstrap/js/button.js',
            'public/vendor/bootstrap/js/carousel.js',
            'public/vendor/bootstrap/js/collapse.js',
            'public/vendor/bootstrap/js/dropdown.js',
            'public/vendor/bootstrap/js/modal.js',
            'public/vendor/bootstrap/js/tooltip.js',
            'public/vendor/bootstrap/js/popover.js',
            'public/vendor/bootstrap/js/scrollspy.js',
            'public/vendor/bootstrap/js/tab.js',
            'public/vendor/bootstrap/js/transition.js',
            'public/vendor/momentjs/moment.js',
            'public/layouts/core.js'
          ],
          'public/layouts/ie-sucks.min.js': [
            'public/vendor/html5shiv/html5shiv.js',
            'public/vendor/respond/respond.js',
            'public/layouts/ie-sucks.js'
          ],
          'public/layouts/admin.min.js': ['public/layouts/admin.js']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.js', '!**/*.min.js'],
          dest: 'public/views/',
          ext: '.min.js'
        }]
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
      //client: {
      //  options: {
      //    jshintrc: '.jshintrc-client',
      //    ignores: [
      //      'public/layouts/**/*.min.js',
      //      'public/views/**/*.min.js'
      //    ]
      //  },
      //  src: [
      //    'public/layouts/**/*.js',
      //    'public/views/**/*.js'
      //  ]
      //},
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'schema/**/*.js',
          'views/**/*.js'
        ]
      }
    },
    less: {
      options: {
        compress: true
      },
      layouts: {
        files: {
          'public/layouts/core.min.css': [
            'public/less/bootstrap-build.less',
            'public/less/font-awesome-build.less',
            'public/layouts/core.less'
          ],
          'public/layouts/admin.min.css': ['public/layouts/admin.less']
        }
      },
      views: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.less'],
          dest: 'public/views/',
          ext: '.min.css'
        }]
      }
    },
    clean: {
      client: {
        src: [
            'client/dist/**'
        ]
      },
      js: {
        src: [
          'public/layouts/**/*.min.js',
          'public/layouts/**/*.min.js.map',
          'public/views/**/*.min.js',
          'public/views/**/*.min.js.map'
        ]
      },
      css: {
        src: [
          'public/layouts/**/*.min.css',
          'public/views/**/*.min.css'
        ]
      },
      vendor: {
        src: ['public/vendor/**']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-html2js');

  grunt.registerTask('default', ['clean', 'copy', 'html2js', 'concat', 'newer:uglify', 'newer:less', 'newer:sass:dev','concurrent']);
  grunt.registerTask('build', ['copy', 'uglify', 'less']);
  grunt.registerTask('lint', ['jshint']);

  grunt.registerTask('flint', ['jshint:client']);
  grunt.registerTask('front', ['copy:clientVendor', 'copy:asset', 'copy:index', 'html2js', 'concat', 'sass:dev']);
  grunt.registerTask('back', ['copy:vendor', 'newer:uglify', 'newer:less']);
  grunt.registerTask('dev', ['clean', 'front', 'back', 'concurrent']);
};
