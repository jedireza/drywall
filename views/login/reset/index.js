exports.init = function(req, res){
  //are we logged in?
  if (req.isAuthenticated()) { 
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/reset/index');
  }
};

exports.set = function(req, res){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.password) workflow.outcome.errfor.password = 'required';
    if (!req.body.confirm) workflow.outcome.errfor.confirm = 'required';
    if (req.body.password != req.body.confirm) workflow.outcome.errors.push('Passwords do not match.');
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0 || workflow.outcome.errors.length != 0) {
      return workflow.emit('response');
    }
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    //encrypt password
    var encryptedPassword = req.app.db.models.User.encryptPassword(req.body.password);
    
    //find the user with that email and update
    req.app.db.models.User.findOneAndUpdate(
      { resetPasswordToken: req.params.token },
      { password: encryptedPassword, resetPasswordToken: '' }, 
      function(err, user) {
        if (err) return workflow.emit('exception', err);
        
        if (!user) {
          workflow.outcome.errors.push('Invalid reset token.');
          return workflow.emit('response');
        }
        
        workflow.emit('response');
      }
    );
  });
  
  //start the workflow
  workflow.emit('validate');
};