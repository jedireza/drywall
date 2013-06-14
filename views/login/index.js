exports.init = function(req, res){
  //are we logged in?
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/index', {
      returnUrl: req.query.returnUrl || '/',
      oauthMessage: '',
      oauthTwitter: !!req.app.get('twitter-oauth-key'),
      oauthGitHub: !!req.app.get('github-oauth-key'),
      oauthFacebook: !!req.app.get('facebook-oauth-key'),
      user: req.user
    });
  }
};



exports.login = function(req, res){
  var workflow = new req.app.utility.Workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.username) workflow.outcome.errfor.username = 'required';
    if (!req.body.password) workflow.outcome.errfor.password = 'required';

    //return if we have errors already
    if (workflow.hasErrors()) return workflow.emit('response');

    workflow.emit('attemptLogin');
  });

  workflow.on('attemptLogin', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) return workflow.emit('exception', err);

      if (!user) {
        workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function(err) {
          if (err) return workflow.emit('exception', err);

          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};



exports.loginTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) return res.redirect('/login/');

    req.app.db.models.User.findOne({ 'twitter.id': info.profile.id }, function(err, user) {
      if (err) return next(err);

      if (!user) {
        res.render('login/index', {
          returnUrl: req.query.returnUrl || '/',
          oauthMessage: 'No users found linked to your Twitter account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) return next(err);

          res.redirect(user.defaultReturnUrl());
        });
      }
    });
  })(req, res, next);
};



exports.loginGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) return res.redirect('/login/');

    req.app.db.models.User.findOne({ 'github.id': info.profile.id }, function(err, user) {
      if (err) return next(err);

      if (!user) {
        res.render('login/index', {
          returnUrl: req.query.returnUrl || '/',
          oauthMessage: 'No users found linked to your GitHub account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) return next(err);

          res.redirect(user.defaultReturnUrl());
        });
      }
    });
  })(req, res, next);
};



exports.loginFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) return res.redirect('/login/');

    req.app.db.models.User.findOne({ 'facebook.id': info.profile.id }, function(err, user) {
      if (err) return next(err);

      if (!user) {
        res.render('login/index', {
          returnUrl: req.query.returnUrl || '/',
          oauthMessage: 'No users found linked to your Facebook account. You may need to create an account first.',
          oauthTwitter: !!req.app.get('twitter-oauth-key'),
          oauthGitHub: !!req.app.get('github-oauth-key'),
          oauthFacebook: !!req.app.get('facebook-oauth-key')
        });
      }
      else {
        req.login(user, function(err) {
          if (err) return next(err);

          res.redirect(user.defaultReturnUrl());
        });
      }
    });
  })(req, res, next);
};