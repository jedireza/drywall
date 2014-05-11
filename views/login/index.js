'use strict';

var getReturnUrl = function(req) {
  var returnUrl = req.user.defaultReturnUrl();
  if (req.session.returnUrl) {
    returnUrl = req.session.returnUrl;
    delete req.session.returnUrl;
  }
  return returnUrl;
};

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(getReturnUrl(req));
  }
  else {
    res.render('login/index', {
      oauthMessage: '',
      oauthTwitter: !!req.app.config.oauth.twitter.key,
      oauthGitHub: !!req.app.config.oauth.github.key,
      oauthFacebook: !!req.app.config.oauth.facebook.key,
      oauthGoogle: !!req.app.config.oauth.google.key,
      oauthTumblr: !!req.app.config.oauth.tumblr.key
    });
  }
};

exports.login = function(req, res){
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

          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.loginTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'twitter.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Twitter account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'github.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your GitHub account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'facebook.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Facebook account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGoogle = function(req, res, next){
  req._passport.instance.authenticate('google', { callbackURL: '/login/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'google.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Google account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginTumblr = function(req, res, next){
  req._passport.instance.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({ 'tumblr.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Tumblr account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};
