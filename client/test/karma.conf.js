// karma.conf.js
module.exports = function (config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '..',

    // test frameworks
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'dist/vendor/jquery.js',
      'dist/vendor/angular.js',
      'dist/vendor/angular-animate.js',
      'dist/vendor/angular-cookies.js',
      'dist/vendor/angular-resource.js',
      'dist/vendor/angular-route.js',
      'dist/vendor/angular-sanitize.js',
      'dist/vendor/angular-touch.js',
      'dist/vendor/ui-bootstrap.js',
      'dist/vendor/ui-bootstrap-tpls.js',
      'dist/vendor/moment.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/app/**/*.js',
      'src/common/**/*.js',
      'test/unit/**/*.spec.js',
      'dist/templates/**/*.js'
    ],

    // use dots reporter, as travis terminal does not support escaping sequences
    // possible values: 'dots' || 'progress'
    reporters: 'progress',

    // these are default values, just to show available options

    // web server port
    port: 8089,

    // cli runner port
    runnerPort: 9109,

    urlRoot: '/__test/',

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // polling interval in ms (ignored on OS that support inotify)
    autoWatchInterval: 0,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari
    // - PhantomJS
    browsers: ['Firefox', 'Chrome', 'PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    // Which plugins to enable
    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher',
      'karma-jasmine'
    ]
  });
};