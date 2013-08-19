'use strict';

exports.init = function(req, res){
  if (req.isAuthenticated()) { 
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/reset/index');
  }
};

exports.set = function(req, res){
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
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    var encryptedPassword = req.app.db.models.User.encryptPassword(req.body.password);
    
    req.app.db.models.User.findOneAndUpdate(
      { resetPasswordToken: req.params.token },
      { password: encryptedPassword, resetPasswordToken: '' }, 
      function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }
        
        if (!user) {
          workflow.outcome.errors.push('Invalid reset token.');
          return workflow.emit('response');
        }
        
        workflow.emit('response');
      }
    );
  });
  
  workflow.emit('validate');
};
