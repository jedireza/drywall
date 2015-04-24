var workflow = new (require('events').EventEmitter)();
var async = require('async');
var prompt = require('prompt');

workflow.on('collectUserInput', function(){
  prompt.message = ''; prompt.delimiter = '';
  async.waterfall([function(cb){
    //1. admin username, email, and password
    console.log('=====Create admin user=====');
    var schema = {
      properties: {
        username: {
          description: 'username',
          type: 'string',                 // Specify the type of input to expect.
          pattern: /^\w+$/,
          message: 'Username must be letters',
          default: 'root'
        },
        email: {
          description: 'email',
          pattern: /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/,
          message: 'Not a valid email address',
          required: true
        },
        password: {
          description: 'password',     // Prompt displayed to the user. If not supplied name will be used.
          type: 'string',                 // Specify the type of input to expect.
          pattern: /^\w+$/,                  // Regular expression that input must be valid against.
          message: 'Password must be letters', // Warning message to display if validation fails.
          hidden: true,                        // If true, characters entered will not be output to console.
          required: true
        }
      }
    };
    prompt.start();
    prompt.get(schema, function (err, result) {
      if(err){
        return cb(err);
      }
      workflow.admin = {
        username: result.username,
        email:    result.email,
        password: result.password
      };
      cb();
    });
  }, function(cb){
    //2. mongo connection
    console.log('=====Setup Mongo DB=====');
    var schema = {
      properties: {
        host: {
          description: 'MongoDB host',
          type: 'string',                 // Specify the type of input to expect.
          default: 'localhost'
        },
        port: {
          description: 'MongoDB port',
          type: 'number',
          default: 27017
        },
        database: {
          description: 'MongoDB database',
          type: 'string',
          default: 'angular-drywall'
        },
        user: {
          description: 'MongoDB user',
          type: 'string',
          default: ''
        },
        password: {
          description: 'MongoDB password',
          type: 'string',
          default: '',
          hidden: true
        }
      }
    };
    prompt.start();
    prompt.get(schema, function (err, result) {
      if(err){
        return cb(err);
      }
      workflow.mongo = {
        host: result.host,
        port: result.port,
        database: result.database,
        user: result.user? result.user: null,
        password: result.password? result.password: null
      };
      cb();
    });
  }, function(cb){
    //3. smtp email server and password
    console.log('=====(Optional) Set smtp server credential (to send notification email)=====');
    var schema = {
      properties: {
        email: {
          description: 'smtp email',
          default: workflow.admin.email
        },
        password: {
          description: 'smtp password',
          type: 'string',
          hidden: true
        },
        host: {
          description: 'smtp server host',
          type: 'string',
          default: 'smtp.gmail.com'
        }
      }
    };
    prompt.start();
    prompt.get(schema, function (err, result) {
      if(err){
        return cb(err);
      }
      workflow.smtp = {
        email:    result.email,
        password: result.password,
        host:     result.host
      };
      cb();
    });
  }], function(err, res){
    if(err){
      console.log('Error collecting config info, please try again.');
      process.exit(-1);
    }
    return workflow.emit('checkDbConnection');
  })
});


workflow.on('checkDbConnection', function(){
// Connection URL
//  var url = 'mongodb://localhost/angular-drwayll';
  var uri = ['mongodb://'];
  if(workflow.mongo.user && workflow.mongo.password){
    uri = uri.concat([workflow.mongo.user, ':', workflow.mongo.password, '@']);
  }
  uri = uri.concat([workflow.mongo.host, ':', workflow.mongo.port, '/', workflow.mongo.database]).join('');
  workflow.mongo.uri = uri;
  require('mongodb').MongoClient.connect(uri, function(err, db) {
    if(err){
      console.log('error connecting to db, please verify Mongodb setting then try again.');
      process.exit(-1);
    }else if(db){
      workflow.db = db;
    }
    return workflow.emit('initDb');
  });
});

workflow.on('initDb', function(){
  var db = workflow.db;
  async.waterfall([function(cb){
    // drop db if exists
    db.dropDatabase(function(err, result){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one admingroup doc
    db.collection('admingroups').insert({ _id: 'root', name: 'Root' }, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one admin doc
    var admins = db.collection('admins');
    admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] }, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one account doc
    db.collection('accounts').insert({isVerified: 'yes'}, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // encrypt password
    var bcrypt = require('bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return cb(err);
      }
      bcrypt.hash(workflow.admin.password, salt, function(err, hash) {
        cb(err, hash);
      });
    });
  }, function(hash, cb){
    // insert one user doc
    db.collection('admins').findOne(function(err, admin){
      if(err) return cb(err);
      db.collection('accounts').findOne(function(err, account){
        if(err) return cb(err);
        var user = {
          username: workflow.admin.username,
          password: hash,
          isActive: 'yes',
          email: workflow.admin.email,
          roles: {
            admin: admin._id,
            account: account._id
          }
        };
        db.collection('users').insert(user, function(err, res){
          return cb(err, admin._id, account._id);
        });
      });
    });
  }, function(adminId, accountId, cb){
    //patch admin
    db.collection('users').findOne(function(err, user){
      if(err) {
        return cb(err);
      }
      db.collection('admins').update({_id: adminId}, {$set: { user: { id: user._id, name: user.username } }}, function(err, res){
        return cb(err, accountId, user);
      });
    });
  }, function(accountId, user, cb){
    //patch account
    db.collection('accounts').update({_id: accountId}, {$set: { user: { id: user._id, name: user.username }}}, function(err, res){
      return err? cb(err): cb();
    });
  }], function(err, result){
    if(err){
      console.log('error initializing mongodb, please try again.');
      process.exit(-1);
    }
    return workflow.emit('generateConfigJS');
  });
});

workflow.on('generateConfigJS', function(){
  async.waterfall([
    function(cb){
      // retrieve config.example.js from file system
      require('fs').readFile('./config.example.js', {encoding: 'utf8'}, function(err, data){
        return err? cb(err): cb(null, data);
      });
    },
    function(content, cb){
      // find and replace with information collected
      var smtpEnabled = !!workflow.smtp.password;
      var map = {
        '{{MONGO_URI}}': workflow.mongo.uri,
        '{{ADMIN_EMAIL}}': workflow.admin.email,
        '{{SMTP_EMAIL}}': smtpEnabled? workflow.smtp.email: '',
        '{{SMTP_PASSWORD}}': smtpEnabled? workflow.smtp.password: '',
        '{{SMTP_HOST}}': smtpEnabled? workflow.smtp.host: ''
      };
      for(var key in map){
        if(map.hasOwnProperty(key)){
          content = content.replace(new RegExp(key, 'g'), map[key]);
        }
      }
      cb(null, content);
    },
    function(content, cb){
      // output config.js back to filesystem
      require('fs').writeFile('./config.js', content, function(err, res){
        return err? cb(err): cb();
      });
    }
  ], function(err, result){
    if(err){
      console.log('error generating config.js.');
      process.exit(-1);
    }
    return workflow.emit('complete');
  });
});

workflow.on('complete', function(){
  if(workflow.db){
    workflow.db.close();
  }
  console.log('=====Angular-Drywall initialization complete=====');
  process.exit(0);
});

workflow.emit('collectUserInput');
