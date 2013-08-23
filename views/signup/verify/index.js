'use strict';

exports.init = function(req, res){
  res.render('signup/verify/index');
};

exports.initConfirm = function(req, res){
  res.render('signup/verify/confirm');
};

exports.verify = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
      if (!req.body.email) {
          workflow.outcome.errfor.email = 'required';
      }

      //return if we have errors already
      if (workflow.hasErrors()) return workflow.emit('response');

      workflow.emit('patchUser');
  });

  workflow.on('patchUser', function() {
      //find the user with that email and update
      req.app.db.models.User.findOneAndUpdate(
          { verifyEmailToken: req.params.token, email: req.body.email },
          { verifyEmailToken: '', isVerified: 'yes' },
          function(err, user) {
              if (err) return workflow.emit('exception', err);

              if (!user) {
                  workflow.outcome.errors.push('Email and token do not match.');
                  return workflow.emit('response');
              }

              workflow.emit('sendWelcomeEmail', user);
          }
      );
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
              workflow.emit('response');
          },
          error: function(err) {
              console.log('Error Sending Welcome Email: '+ err);
              workflow.emit('response');
          }
      });
  });

  workflow.emit('validate');
};
