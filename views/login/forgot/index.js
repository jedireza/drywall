'use strict';

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/forgot/index');
  }
};

exports.send = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function() {
    var token = require('crypto').createHash('md5').update(Math.random().toString()).digest('hex');

    req.app.db.models.User.findOneAndUpdate({ email: req.body.email.toLowerCase() }, { resetPasswordToken: token }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Email address not found.');
        return workflow.emit('response');
      }

      workflow.emit('sendEmail', token, user);
    });
  });

  workflow.on('sendEmail', function(token, user) {
    req.app.utility.sendmail(req, res, {
      from: req.app.get('smtp-from-name') +' <'+ req.app.get('smtp-from-address') +'>',
      to: user.email,
      subject: 'Reset your '+ req.app.get('project-name') +' password',
      textPath: 'login/forgot/email-text',
      htmlPath: 'login/forgot/email-html',
      locals: {
        username: user.username,
        resetLink: 'http://'+ req.headers.host +'/login/reset/'+ token +'/',
        projectName: req.app.get('project-name')
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
};
