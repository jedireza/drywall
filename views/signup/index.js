exports.init = function(req, res){
  //are we logged in?
  if (req.isAuthenticated()) { 
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    if (!req.query.returnUrl) req.query.returnUrl = '/';
    res.render('signup/index', { returnUrl: req.query.returnUrl });
  }
};

exports.signup = function(req, res){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
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
    else if (!/^[a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }
    if (!req.body.password) workflow.outcome.errfor.password = 'required';
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
    workflow.emit('duplicateUsernameCheck');
  });
  
  workflow.on('duplicateUsernameCheck', function() {
    res.app.db.models.User.findOne({ username: req.body.username }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('duplicateEmailCheck');
    });
  });
  
  workflow.on('duplicateEmailCheck', function() {
    res.app.db.models.User.findOne({ email: req.body.email }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }
      
      workflow.emit('createUser');
    });
  });
  
  workflow.on('createUser', function() {
    var fieldsToSet = {
      isActive: 'yes',
      username: req.body.username,
      email: req.body.email,
      password: req.app.db.models.User.encryptPassword(req.body.password)
    };
    res.app.db.models.User.create(fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      workflow.outcome.user = user;
      workflow.emit('createAccount');
    });
  });
  
  workflow.on('createAccount', function() {
    res.app.db.models.Account.create({ user: workflow.outcome.user._id}, function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      //update user with account
      workflow.outcome.user.roles.account = account._id;
      workflow.outcome.user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        delete workflow.outcome.user;
        workflow.emit('sendWelcomeEmail');
      });
    });
  });
  
  workflow.on('sendWelcomeEmail', function() {
    res.app.utility.email(req, res, {
      from: req.app.get('email-from-name') +' <'+ req.app.get('email-from-address') +'>',
      to: req.body.email,
      subject: 'Your '+ req.app.get('project-name') +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: req.body.username,
        email: req.body.email,
        loginURL: 'http://'+ req.headers.host +'/login/',
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        workflow.emit('logUserIn');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending Welcome Email: '+ err);
        workflow.emit('response');
      }
    });
    
    workflow.emit('logUserIn');
  });
  
  workflow.on('logUserIn', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
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
  
  //start the workflow
  workflow.emit('validate');
};