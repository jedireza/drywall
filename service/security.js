'use strict';
var filterUser = function (user) {
  if (user) {
    return {
      id: user._id,
      email: user.email,
      //firstName: user.firstName,
      //lastName: user.lastName,
      admin: !!(user.roles && user.roles.admin),
      isVerified: !!(user.roles && user.roles.account && user.roles.account.isVerified && user.roles.account.isVerified === 'yes')
    };
  }
  return null;
};

var getSocialCallbackUrl = function(hostname, provider){
  return 'http://' + hostname + '/login/' + provider + '/callback';
};

var socialLogin = function(provider, req, res, next){
  provider = provider.toLowerCase();
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('authUser', function(){
    req._passport.instance.authenticate(provider, { callbackURL: getSocialCallbackUrl(req.app.config.hostname, provider)}, function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!info || !info.profile) {
        workflow.outcome.errors.push(provider + ' user not found');
        return workflow.emit('response');
        //return res.redirect('/login/');
      }
      workflow.profile = info.profile;
      return workflow.emit('findUser');
    })(req, res, next);
  });

  workflow.on('findUser', function(){
    var option = {};
    option[provider+'.id'] = workflow.profile.id;
    req.app.db.models.User.findOne(option, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        return workflow.emit('duplicateEmailCheck');
      }
      else {
        //user exists and is linked to google
        workflow.user = user;
        return workflow.emit('populateUser');
      }
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    workflow.email = workflow.profile.emails && workflow.profile.emails[0].value || '';
    if(!workflow.email){
      return workflow.emit('duplicateUsernameCheck');
    }
    req.app.db.models.User.findOne({ email: workflow.email.toLowerCase() }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        //user/account exists but not yet linked
        workflow.user = user;
        return workflow.emit('linkUser');
      }
      return workflow.emit('duplicateUsernameCheck');
    });
  });

  workflow.on('duplicateUsernameCheck', function(){
    workflow.username = workflow.profile.username || workflow.profile.id;
    if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
      workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    }

    req.app.db.models.User.findOne({ username: workflow.username }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (user) {
        workflow.username = workflow.username + workflow.profile.id;
      }
      else {
        workflow.username = workflow.username;
      }

      return workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function(){
    var fieldsToSet = {
      isActive: 'yes',
      username: workflow.username,
      email: workflow.email.toLowerCase(),
      search: [
        workflow.username,
        workflow.email
      ]
    };

    //links account by saving social profile retrieved from social profile provider i.e. google
    fieldsToSet[workflow.profile.provider] = {
      id: workflow.profile.id,
      profile: workflow.profile
    };

    req.app.db.models.User.create(fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.user = user;
      return workflow.emit('createAccount');
    });
  });

  workflow.on('createAccount', function(){
    var displayName = workflow.profile.displayName || '';
    var nameParts = displayName.split(' ');
    var fieldsToSet = {
      isVerified: 'yes',
      'name.first': nameParts[0],
      'name.last': nameParts[1] || '',
      'name.full': displayName,
      user: {
        id: workflow.user._id,
        name: workflow.user.username
      },
      search: [
        nameParts[0],
        nameParts[1] || ''
      ]
    };
    req.app.db.models.Account.create(fieldsToSet, function(err, account) {
      if (err) {
        return workflow.emit('exception', err);
      }

      //update user with account
      workflow.user.roles.account = account._id;
      workflow.user.save(function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    if(!workflow.email) {
      return workflow.emit('populateUser');
    }
    req.app.utility.sendmail(req, res, {
      from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
      to: workflow.email,
      subject: 'Your '+ req.app.config.projectName +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: workflow.user.username,
        email: workflow.email.toLowerCase(),
        loginURL: req.protocol +'://'+ req.headers.host +'/login/',
        projectName: req.app.config.projectName
      },
      success: function(message) {
        workflow.emit('populateUser');
      },
      error: function(err) {
        console.log('Error Sending Welcome Email: '+ err);
        workflow.emit('populateUser');
      }
    });
  });

  workflow.on('populateUser', function(){
    var user = workflow.user;
    user.populate('roles.admin roles.account', function(err, user){
      if(err){
        return workflow.emit('exception', err);
      }
      if (user && user.roles && user.roles.admin) {
        user.roles.admin.populate("groups", function(err, admin) {
          if(err){
            return workflow.emit('exception', err);
          }
          workflow.user = user;
          return workflow.emit('logUserIn');
        });
      }
      else {
        workflow.user = user;
        return workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function(){

    req.login(workflow.user, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }
      workflow.outcome.defaultReturnUrl = workflow.user.defaultReturnUrl();
      workflow.outcome.user = filterUser(req.user);
      workflow.emit('response');
    });
  });

  workflow.on('linkUser', function(){
    workflow.user[workflow.profile.provider] = {
      id: workflow.profile.id,
      profile: workflow.profile
    };

    //link existing user to social provider
    workflow.user.save(function(err, user){
      if (err) {
        return workflow.emit('exception', err);
      }
      //also makes sure to update account isVerified is set to true assuming user has been verified with social provider
      var fieldsToSet = { isVerified: 'yes', verificationToken: '' };
      req.app.db.models.Account.findByIdAndUpdate(workflow.user.roles.account, fieldsToSet, function(err, account) {
        if (err) {
          return workflow.emit('exception', err);
        }
        return workflow.emit('populateUser');
      });
    });
  });

  workflow.emit('authUser');
};

var security = {
  sendCurrentUser: function (req, res, next) {
    res.status(200).json({user: filterUser(req.user)});
  },
  signup: function(req, res){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.username) {
        workflow.outcome.errfor.username = 'required';
      }
      else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
        workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
      }

      if (!req.body.email) {
        workflow.outcome.errfor.email = 'required';
      }
      else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
        workflow.outcome.errfor.email = 'invalid email format';
      }

      if (!req.body.password) {
        workflow.outcome.errfor.password = 'required';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('duplicateUsernameCheck');
    });

    workflow.on('duplicateUsernameCheck', function() {
      req.app.db.models.User.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errfor.username = 'username already taken';
          return workflow.emit('response');
        }

        workflow.emit('duplicateEmailCheck');
      });
    });

    workflow.on('duplicateEmailCheck', function() {
      req.app.db.models.User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errfor.email = 'email already registered';
          return workflow.emit('response');
        }

        workflow.emit('createUser');
      });
    });

    workflow.on('createUser', function() {
      req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
        if (err) {
          return workflow.emit('exception', err);
        }

        var fieldsToSet = {
          isActive: 'yes',
          username: req.body.username,
          email: req.body.email.toLowerCase(),
          password: hash,
          search: [
            req.body.username,
            req.body.email
          ]
        };
        req.app.db.models.User.create(fieldsToSet, function(err, user) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.user = user;
          workflow.emit('createAccount');
        });
      });
    });

    workflow.on('createAccount', function() {
      var fieldsToSet = {
        isVerified: req.app.config.requireAccountVerification ? 'no' : 'yes',
        'name.full': workflow.user.username,
        user: {
          id: workflow.user._id,
          name: workflow.user.username
        },
        search: [
          workflow.user.username
        ]
      };

      req.app.db.models.Account.create(fieldsToSet, function(err, account) {
        if (err) {
          return workflow.emit('exception', err);
        }

        //update user with account
        workflow.user.roles.account = account._id;
        workflow.user.save(function(err, user) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.emit('sendWelcomeEmail');
        });
      });
    });

    workflow.on('sendWelcomeEmail', function() {
      req.app.utility.sendmail(req, res, {
        from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
        to: req.body.email,
        subject: 'Your '+ req.app.config.projectName +' Account',
        textPath: 'signup/email-text',
        htmlPath: 'signup/email-html',
        locals: {
          username: req.body.username,
          email: req.body.email,
          loginURL: req.protocol +'://'+ req.headers.host +'/login/',
          projectName: req.app.config.projectName
        },
        success: function(message) {
          workflow.emit('logUserIn');
        },
        error: function(err) {
          console.log('Error Sending Welcome Email: '+ err);
          workflow.emit('logUserIn');
        }
      });
    });

    workflow.on('logUserIn', function() {
      req._passport.instance.authenticate('local', function(err, user, info) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (!user) {
          workflow.outcome.errors.push('Login failed. That is strange.');
          return workflow.emit('response');
        }
        else {
          req.login(user, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }

            workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
            workflow.emit('response');
          });
        }
      })(req, res);
    });

    workflow.emit('validate');
  },
  login: function(req, res){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.username) {
        workflow.outcome.errfor.username = 'required';
      }

      if (!req.body.password) {
        workflow.outcome.errfor.password = 'required';
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('abuseFilter');
    });

    workflow.on('abuseFilter', function() {
      var getIpCount = function(done) {
        var conditions = { ip: req.ip };
        req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
          if (err) {
            return done(err);
          }

          done(null, count);
        });
      };

      var getIpUserCount = function(done) {
        var conditions = { ip: req.ip, user: req.body.username };
        req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
          if (err) {
            return done(err);
          }

          done(null, count);
        });
      };

      var asyncFinally = function(err, results) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
          workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
          return workflow.emit('response');
        }
        else {
          workflow.emit('attemptLogin');
        }
      };

      require('async').parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
    });

    workflow.on('attemptLogin', function() {
      req._passport.instance.authenticate('local', function(err, user, info) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (!user) {
          var fieldsToSet = { ip: req.ip, user: req.body.username };
          req.app.db.models.LoginAttempt.create(fieldsToSet, function(err, doc) {
            if (err) {
              return workflow.emit('exception', err);
            }

            workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
            return workflow.emit('response');
          });
        }
        else {
          req.login(user, function(err) {
            if (err) {
              return workflow.emit('exception', err);
            }
            workflow.outcome.user = filterUser(req.user);
            workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
            workflow.emit('response');
          });
        }
      })(req, res);
    });

    workflow.emit('validate');
  },
  logout: function(req, res){
    req.logout();
    res.send({success: true});
  },
  loginGoogle: function(req, res, next){
    return socialLogin('google', req, res, next);
  },
  loginFacebook: function(req, res, next){
    return socialLogin('facebook', req, res, next);
  },
  forgotPassword: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.email) {
        workflow.outcome.errfor.email = 'required';
        return workflow.emit('response');
      }

      workflow.emit('generateToken');
    });

    workflow.on('generateToken', function() {
      var crypto = require('crypto');
      crypto.randomBytes(21, function(err, buf) {
        if (err) {
          return next(err);
        }

        var token = buf.toString('hex');
        req.app.db.models.User.encryptPassword(token, function(err, hash) {
          if (err) {
            return next(err);
          }

          workflow.emit('patchUser', token, hash);
        });
      });
    });

    workflow.on('patchUser', function(token, hash) {
      var conditions = { email: req.body.email.toLowerCase() };
      var fieldsToSet = {
        resetPasswordToken: hash,
        resetPasswordExpires: Date.now() + 10000000
      };
      req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (!user) {
          return workflow.emit('response');
        }

        workflow.emit('sendEmail', token, user);
      });
    });

    workflow.on('sendEmail', function(token, user) {
      req.app.utility.sendmail(req, res, {
        from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
        to: user.email,
        subject: 'Reset your '+ req.app.config.projectName +' password',
        textPath: 'login/forgot/email-text',
        htmlPath: 'login/forgot/email-html',
        locals: {
          username: user.username,
          resetLink: req.protocol +'://'+ req.headers.host +'/login/reset/'+ user.email +'/'+ token +'/',
          projectName: req.app.config.projectName
        },
        success: function(message) {
          workflow.emit('response');
        },
        error: function(err) {
          workflow.outcome.errors.push('Error Sending: '+ err);
          workflow.emit('response');
        }
      });
    });

    workflow.emit('validate');
  },
  resetPassword: function(req, res){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body.password) {
        workflow.outcome.errfor.password = 'required';
      }

      if (!req.body.confirm) {
        workflow.outcome.errfor.confirm = 'required';
      }

      if (req.body.password !== req.body.confirm) {
        workflow.outcome.errors.push('Passwords do not match.');
      }

      if (workflow.hasErrors()) {
        return workflow.emit('response');
      }

      workflow.emit('findUser');
    });

    workflow.on('findUser', function() {
      var conditions = {
        email: req.params.email,
        resetPasswordExpires: { $gt: Date.now() }
      };
      req.app.db.models.User.findOne(conditions, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (!user) {
          workflow.outcome.errors.push('Invalid request.');
          return workflow.emit('response');
        }

        req.app.db.models.User.validatePassword(req.params.token, user.resetPasswordToken, function(err, isValid) {
          if (err) {
            return workflow.emit('exception', err);
          }

          if (!isValid) {
            workflow.outcome.errors.push('Invalid request.');
            return workflow.emit('response');
          }

          workflow.emit('patchUser', user);
        });
      });
    });

    workflow.on('patchUser', function(user) {
      req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
        if (err) {
          return workflow.emit('exception', err);
        }

        var fieldsToSet = { password: hash, resetPasswordToken: '' };
        req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.emit('response');
        });
      });
    });

    workflow.emit('validate');
  }
};

module.exports = security;
