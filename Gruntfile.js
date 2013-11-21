var path = require('path');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
        options: {
          file: 'app.js',
          ignoredFiles: ['node_modules/**'],
          ignoredFiles: ['public/**'],
          watchedExtensions: ['js']
        }
      }
    },
    watch: {
      publicJS: {
         files: [
          'public/layouts/**/*.js', '!public/layouts/**/*.min.js',
          'public/views/**/*.js', '!public/views/**/*.min.js'
         ],
         tasks: ['newer:uglify', 'newer:jshint:public']
      },
      publicLess: {
         files: [
          'public/layouts/**/*.less',
          'public/views/**/*.less',
          'public/less/**/*.less'
         ],
         tasks: ['newer:less', 'newer:jshint:server']
      }
    },
    uglify: {
      options: {
        compress: true,
        sourceMapRoot: '/',
        sourceMapPrefix: 1,
        sourceMap: function(filePath) {
          return filePath.replace(/.js/, '.js.map');
        },
        sourceMappingURL: function(filePath) {
          return path.basename(filePath) +'.map';
        }
      },
      publicLayouts: {
        files: {
          'public/layouts/core.min.js': [
            'public/vendor/jquery/jquery-1.10.2.js',
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
            'public/vendor/moment/moment.js',
            'public/layouts/core.js'
          ],
          'public/layouts/ie-sucks.min.js': [
            'public/vendor/html5shiv/html5shiv.js',
            'public/vendor/respond/respond.src.js',
            'public/layouts/ie-sucks.js'
          ],
          'public/layouts/admin.min.js': ['public/layouts/admin.js']
        }
      },
      publicViews: {
        files: [{
          expand: true,
          cwd: 'public/views/',
          src: ['**/*.js'],
          dest: 'public/views/',
          ext: '.min.js'
        }]
      }
    },
    jshint: {
      public: {
        options: {
          jshintrc: '.jshintrc-client',
          ignores: [
            'public/views/**/*.min.js'
          ]
        },
        src: ['public/views/**/*.js']
      },
      server: {
        options: {
          jshintrc: '.jshintrc-server'
        },
        src: [
          'views/**/*.js',
          'schema/**/*.js',
          'utilities/**/*.js',
        ]
      }
    },
    less: {
      options: {
        compress: true
      },
      publicLayouts: {
        files: {
          'public/layouts/core.min.css': [
            'public/less/bootstrap-build.less',
            'public/vendor/font-awesome/less/font-awesome.less',
            'public/layouts/core.less'
          ],
          'public/layouts/admin.min.css': ['public/layouts/admin.less']
        }
      },
      publicViews: {
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
      publicJS: {
        src: [
          'public/layouts/**/*.min.js',
          'public/layouts/**/*.min.js.map',
          'public/views/**/*.min.js',
          'public/views/**/*.min.js.map'
        ]
      },
      publicCSS: {
        src: [
          'public/layouts/**/*.min.css',
          'public/views/**/*.min.css'
        ]
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-newer');
  
  grunt.registerTask('default', ['uglify', 'less', 'concurrent']);
  grunt.registerTask('build', ['uglify', 'less']);
  grunt.registerTask('lint', ['jshint']);
};
