exports.init = function(req, res){
  //are we logged in?
  if (req.isAuthenticated()) { 
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    if (!req.query.returnUrl) req.query.returnUrl = '/';
    res.render('login/index', { returnUrl: req.query.returnUrl });
  }
};

exports.login = function(req, res){
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.username) workflow.outcome.errfor.username = 'required';
    if (!req.body.password) workflow.outcome.errfor.password = 'required';
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
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