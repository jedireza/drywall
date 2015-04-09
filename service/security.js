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

var socialLogin = function(provider, req, res, next){
  provider = provider.toLowerCase();
  var workflow = req.app.utility.workflow(req, res);
  workflow.on('authUser', function(){
    req._passport.instance.authenticate(provider, { callbackURL: req.app.config.oauth[provider]['loginCallback'] }, function(err, user, info) {
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
        //return next(err);
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
    res.end();
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
  }
};

module.exports = security;
