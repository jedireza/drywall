'use strict';

exports.init = function(req, res){
  res.render('signup/verify/index');
};

exports.verify = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);
  
  workflow.on('patchUser', function() {
    var conditions = {
      verifyEmailToken: req.params.token
    };
    var fieldsToSet = {
      verifyEmailToken: '',
      isVerified: 'yes'
    };
    req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.render('signup/verify/failure');
      }
      
      workflow.emit('sendWelcomeEmail', user);
    });
  });
  
  workflow.on('sendWelcomeEmail', function(user) {
    req.app.utility.sendmail(req, res, {
      from: req.app.get('email-from-name') +' <'+ req.app.get('email-from-address') +'>',
      to: user.email,
      subject: 'Your '+ req.app.get('project-name') +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: user.username,
        email: user.email,
        loginURL: 'http://'+ req.headers.host +'/login/',
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        workflow.emit('logUserIn', user);
      },
      error: function(err) {
        workflow.emit('logUserIn', user);
      }
    });
  });
  
  workflow.on('logUserIn', function(user) {
    req.login(user, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      res.render('signup/verify/success');
    });
  });
  
  workflow.emit('patchUser');
};
