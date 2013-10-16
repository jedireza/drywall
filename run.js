#!/usr/bin/env node
'use strict';

//dependencies
var watchr = require('watchr'),
    path = require('path'),
    findit = require('findit2'),
    fs = require('fs'),
    cp = require('child_process');

//our app object
var app = {
  process: undefined,
  start: function() {
    app.process = cp.fork('./app.js');
    console.log('RUN [✔] App started');
    app.process.on('close', function(code, signal) {
      console.log('RUN {!} Attempting to restart app...');
      app.restart();
    });
  },
  restartLog: [],
  restart: function() {
    app.restartLog.push(new Date());
    app.start();
    setTimeout(function() {
      if (app.restartLog.length >= 3) {
        console.log('RUN {#} Mayday relay: app is sickly.');
        app.process.kill();
        process.exit(1);
      }
      else {
        app.restartLog = [];
      }
    }, 1000);
  }
};

//are there any special commands to run?
if (process.argv.length > 2) {
  var command = process.argv[2];
  
  if ('build' === command) {
    console.log('RUN {!} Roger that! Running the build...');
    var filterToBuild = function(filePath, stat) {
      var isLESS = /\.less/.test(filePath);
      var isJS = /\.js/.test(filePath) && !/\.min\.js/.test(filePath);
      if (isLESS || isJS) { build(filePath); }
    };
    findit.find('public/layouts').on('file', filterToBuild);
    findit.find('public/views').on('file', filterToBuild);
  }
  else if ('clean' === command) {
    console.log('RUN {!} Roger that! Cleaning build files...');
    var filterToDelete = function(filePath, stat) {
      var isCSS = /\.min\.css/.test(filePath);
      var isJS = /\.min\.js/.test(filePath);
      if (isCSS || isJS) {
        fs.unlink(filePath);
        console.log('RUN [✔] Deleted: '+ filePath);
      }
    };
    findit.find('public/layouts').on('file', filterToDelete);
    findit.find('public/views').on('file', filterToDelete);
  }
  else {
    console.log('RUN {!} Sorry. I\'m not sure what you mean.');
  }
}
//no special commands
else {
  //first time starting up
  app.start();
  
  //listen to changes in public asset files
  watchr.watch({
    paths: [
      'public/layouts/',
      'public/views/',
      'public/less/'
    ],
    ignoreCustomPatterns: /\.min\.js|\.min\.css/i,
    listener: function(changeType, filePath, fileCurrentStat, filePreviousStat){
      if ('delete' === changeType) { return; }
      console.log('RUN {*} Change detected: '+ filePath);
      build(filePath);
    }
  });
  
  //listen to changes in app files
  watchr.watch({
    paths: [
      'app.js',
      'layouts/',
      'models.js',
      'passport.js',
      'routes.js',
      'schema/',
      'utilities/',
      'utilities.js',
      'views/'
    ],
    listener: function(changeType, filePath, fileCurrentStat, filePreviousStat) {
      if ('delete' === changeType) { return; }
      console.log('RUN {*} Change detected: '+ filePath);
      
      //kill the app when script files change
      if (/\.js/.test(filePath)) {
        lintJS(filePath, function() {
          console.log('RUN {!} Killing app...');
          app.process.kill();
        });
      }
    }
  });
}

//a function that handles building assets
var build = function(filePath) {
  //just lint if it's our less tools
  if (/public\/less/.test(filePath)) {
    return lintLESS(filePath);
  }
  
  //add dependencies for core styles
  var dependencies;
  if (/public\/layouts\/core\.less/.test(filePath)) {
    dependencies = [
      'public/less/bootstrap-build.less',
      'public/vendor/font-awesome/less/font-awesome.less'
    ];
  }
  
  //add dependencies for core js
  if (/public\/layouts\/core\.js/.test(filePath)) {
    dependencies = [
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
      'public/vendor/moment/moment.js'
    ];
  }
  
  //add dependencies for ie-sucks js
  if (/public\/layouts\/ie-sucks\.js/.test(filePath)) {
    dependencies = [
      'public/vendor/html5shiv/html5shiv.js',
      'public/vendor/respond/respond.src.js'
    ];
  }
  
  //build less files
  if (/\.less/.test(filePath)) {
    lintLESS(filePath);
    compileLESS(filePath, dependencies);
  }
  
  //build js files
  if (/\.js/.test(filePath)) {
    lintJS(filePath);
    compileJS(filePath, dependencies);
  }
};

//a function that lints less files
var lintLESS = function(filePath, cb) {
  var lesscmd = cp.spawn(createCommand('node_modules/.bin/recess'), [filePath, '--noSummary', '--strictPropertyOrder', 'false']);
  lesscmd.stdout.on('data', function(d) { process.stdout.write(d); });
  lesscmd.stderr.on('data', function(d) { process.stderr.write(d); });
  lesscmd.on('close', function (code) {
    console.log('RUN [✔] Linted: '+ filePath);
    if (cb) { cb(); }
  });
};

//a function that compiles less files
var compileLESS = function(filePath, dependencyPaths) {
  if (!dependencyPaths) { dependencyPaths = []; }
  var args = ['--compress'];
  args = args.concat(dependencyPaths, filePath);
  
  var basePath = path.dirname(filePath) +'/';
  var lessBaseName = path.basename(filePath, '.less');
  var lessMinName = lessBaseName + '.min.css';
  var lessMinPath = basePath + lessMinName;
  
  var cssStream = fs.createWriteStream(lessMinPath);
  var lesscmd = cp.spawn(createCommand('node_modules/.bin/recess'), args);
  lesscmd.stdout.on('data', function(d) { cssStream.write(d); });
  lesscmd.stderr.on('data', function(d) { process.stderr.write(d); });
  lesscmd.on('close', function (code) {
    cssStream.end();
    console.log('RUN [✔] Compiled: '+ filePath +' > '+ lessMinName);
  });
};

//a function that lints javascript files
var lintJS = function(filePath, cb) {
  var configFile = './.jshintrc-client';
  if (!/public\//.test(filePath)) {
    configFile = './.jshintrc-server';
  }
  var hintcmd = cp.spawn(createCommand('node_modules/.bin/jshint'), [filePath, '--config', configFile]);
  hintcmd.stdout.on('data', function(d) { process.stdout.write(d); });
  hintcmd.stderr.on('data', function(d) { process.stderr.write(d); });
  hintcmd.on('close', function (code) {
    console.log('RUN [✔] Linted: '+ filePath);
    if (cb) { cb(); }
  });
};

//a function that compiles javascript files
var compileJS = function(filePath, dependencyPaths) {
  var basePath = path.dirname(filePath) +'/';
  var jsBaseName = path.basename(filePath, '.js');
  var jsMinName = jsBaseName + '.min.js';
  var jsMinPath = basePath + jsMinName;
  var jsMapName = jsMinName + '.map';
  var jsMapPath = basePath + jsMapName;
  
  var args = dependencyPaths || [];
  args = args.concat([
    filePath,
    '--output', jsMinPath,
    '--source-map', jsMapPath,
    '--source-map-root', '/',
    '--prefix', '1',
    '--source-map-url', jsMapName
  ]);
  
  var uglycmd = cp.spawn(createCommand('node_modules/.bin/uglifyjs'), args);
  uglycmd.stdout.on('data', function(d) { process.stdout.write(d); });
  uglycmd.stderr.on('data', function(d) { process.stderr.write(d); });
  uglycmd.on('close', function (code) {
    console.log('RUN [✔] Compiled: '+ filePath +' > '+ jsMinName);
  });
};

//create the proper command for Windows environments
var createCommand = function(command) {
  if (/^win/.test(process.platform)) {
    return command.replace(/\//g, '\\') + '.cmd';
  }
  return command;
};
