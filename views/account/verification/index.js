'use strict';

var sendVerificationEmail = function(req, res, options) {
  req.app.utility.sendmail(req, res, {
    from: req.app.get('email-from-name') +' <'+ req.app.get('email-from-address') +'>',
    to: options.email,
    subject: 'Verify Your '+ req.app.get('project-name') +' Account',
    textPath: 'account/verification/email-text',
    htmlPath: 'account/verification/email-html',
    locals: {
      verifyURL: 'http://'+ req.headers.host +'/account/verification/' + options.verificationToken + '/',
      projectName: req.app.get('project-name')
    },
    success: function() {
      options.onSuccess();
    },
    error: function(err) {
      options.onError(err);
    }
  });
};

exports.init = function(req, res, next){
  if (req.user.roles.account.isVerified === 'yes') { 
    return res.redirect(req.user.defaultReturnUrl());
  }
  
  var renderPage = function() {
    req.app.db.models.User.findById(req.user.id, 'email').exec(function(err, user) {
      if (err) {
        return next(err);
      }
      
      res.render('account/verification/index', {
        data: {
          user: JSON.stringify(user)
        }
      });
    });
  };
  
  if (req.user.roles.account.verificationToken === '') {
    var fieldsToSet = {
      verificationToken: require('crypto').createHash('md5').update(Math.random().toString()).digest('hex')
    };
    
    req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
      if (err) {
        return next(err);
      }
      
      sendVerificationEmail(req, res, {
        email: req.user.email,
        verificationToken: account.verificationToken,
        onSuccess: function() {
          return renderPage();
        },
        onError: function(err) {
          return next(err);
        }
      });
    });
  }
  else {
    renderPage();
  }
};

exports.resendVerification = function(req, res){
  if (req.user.roles.account.isVerified === 'yes') { 
    return res.redirect(req.user.defaultReturnUrl());
  }
  
  var workflow = req.app.utility.workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }
    
    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }
    
    workflow.emit('duplicateEmailCheck');
  });
  
  workflow.on('duplicateEmailCheck', function() {
    req.app.db.models.User.findOne({ email: req.body.email, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      if (user) {
        workflow.outcome.errfor.email = 'email already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('patchUser');
    });
  });
  
  workflow.on('patchUser', function() {
    var fieldsToSet = {
      email: req.body.email
    };
    
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      workflow.user = user;
      workflow.emit('patchAccount');
    });
  });
  
  workflow.on('patchAccount', function() {
    var fieldsToSet = {
      verificationToken: require('crypto').createHash('md5').update(Math.random().toString()).digest('hex')
    };
    
    req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      sendVerificationEmail(req, res, {
        email: workflow.user.email,
        verificationToken: account.verificationToken,
        onSuccess: function() {
          workflow.emit('response');
        },
        onError: function(err) {
          workflow.outcome.errors.push('Error Sending: '+ err);
          workflow.emit('response');
        }
      });
    });
  });
  
  workflow.emit('validate');
};

exports.verify = function(req, res, next){
  var conditions = {
    _id: req.user.roles.account.id,
    verificationToken: req.params.token
  };
  
  var fieldsToSet = {
    isVerified: 'yes',
    verificationToken: ''
  };
  
  req.app.db.models.Account.findOneAndUpdate(conditions, fieldsToSet, function(err, account) {
    if (err) {
      return next(err);
    }
    
    return res.redirect(req.user.defaultReturnUrl());
  });
};
