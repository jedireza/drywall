var filterUser = function (user) {
  if (user) {
    return {
        id: user._id,
        email: user.email,
        //firstName: user.firstName,
        //lastName: user.lastName,
        admin: !!(user.roles && user.roles.admin)
    };
  }
  return null;
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
  }
};

module.exports = security;
