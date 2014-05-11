'use strict';

var sendVerificationEmail = function(req, res, options) {
  req.app.utility.sendmail(req, res, {
    from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
    to: options.email,
    subject: 'Verify Your '+ req.app.config.projectName +' Account',
    textPath: 'account/verification/email-text',
    htmlPath: 'account/verification/email-html',
    locals: {
      verifyURL: req.protocol +'://'+ req.headers.host +'/account/verification/' + options.verificationToken + '/',
      projectName: req.app.config.projectName
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

  var workflow = req.app.utility.workflow(req, res);

  workflow.on('renderPage', function() {
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
  });

  workflow.on('generateTokenOrRender', function() {
    if (req.user.roles.account.verificationToken !== '') {
      return workflow.emit('renderPage');
    }

    workflow.emit('generateToken');
  });

  workflow.on('generateToken', function() {
    var crypto = require('crypto');
    crypto.randomBytes(21, function(err, buf) {
      if (err) {
        return next(err);
      }

      var token = buf.toString('hex');
      req.app.db.models.User.encryptPassword(token, function(err, hash) {
        if (err) {
          return next(err);
        }

        workflow.emit('patchAccount', token, hash);
      });
    });
  });

  workflow.on('patchAccount', function(token, hash) {
    var fieldsToSet = { verificationToken: hash };
    req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
      if (err) {
        return next(err);
      }

      sendVerificationEmail(req, res, {
        email: req.user.email,
        verificationToken: token,
        onSuccess: function() {
          return workflow.emit('renderPage');
        },
        onError: function(err) {
          return next(err);
        }
      });
    });
  });

  workflow.emit('generateTokenOrRender');
};

exports.resendVerification = function(req, res, next){
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
    req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.user.id } }, function(err, user) {
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
    var fieldsToSet = { email: req.body.email.toLowerCase() };
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.user = user;
      workflow.emit('generateToken');
    });
  });

  workflow.on('generateToken', function() {
    var crypto = require('crypto');
    crypto.randomBytes(21, function(err, buf) {
      if (err) {
        return next(err);
      }

      var token = buf.toString('hex');
      req.app.db.models.User.encryptPassword(token, function(err, hash) {
        if (err) {
          return next(err);
        }

        workflow.emit('patchAccount', token, hash);
      });
    });
  });

  workflow.on('patchAccount', function(token, hash) {
    var fieldsToSet = { verificationToken: hash };
    req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
      if (err) {
        return workflow.emit('exception', err);
      }

      sendVerificationEmail(req, res, {
        email: workflow.user.email,
        verificationToken: token,
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
  req.app.db.models.User.validatePassword(req.params.token, req.user.roles.account.verificationToken, function(err, isValid) {
    if (!isValid) {
      return res.redirect(req.user.defaultReturnUrl());
    }

    var fieldsToSet = { isVerified: 'yes', verificationToken: '' };
    req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account._id, fieldsToSet, function(err, account) {
      if (err) {
        return next(err);
      }

      return res.redirect(req.user.defaultReturnUrl());
    });
  });
};
