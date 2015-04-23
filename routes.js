'use strict';

var preAuth = require('./service/pre-auth');
var security = require('./service/security');
var account = require('./service/account');
var admin = require('./service/admin/admin');
var adminUser = require('./service/admin/user');
var adminAccount = require('./service/admin/account');
var adminAdministrator = require('./service/admin/administrator');
var adminGroup = require('./service/admin/admin-group');
var adminStatus = require('./service/admin/status');
var adminCategory = require('./service/admin/category');

function useAngular(req, res, next){
  res.sendFile(require('path').join(__dirname, './client/dist/index.html'));
}

function apiEnsureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.set('X-Auth-Required', 'true');
  //no need to store the originalUrl in session: caller knows the return url
  //req.session.returnUrl = req.originalUrl;
  res.status(401).send({errors: ['authentication required']});
}

function apiEnsureAccount(req, res, next){
  if(req.user.canPlayRoleOf('account')){
    return next();
  }
  res.status(401).send({errors: ['authorization required']});
}

function apiEnsureVerifiedAccount(req, res, next){
  if(!req.app.config.requireAccountVerification){
    return next();
  }
  req.user.isVerified(function(err, flag){
    if(err){
      return next(err);
    }
    if(flag){
      return next();
    }else{
      return res.status(401).send({errors: ['verification required']});
    }
  });
}

function apiEnsureAdmin(req, res, next){
  if(req.user.canPlayRoleOf('admin')){
    return next();
  }
  res.status(401).send({errors: ['authorization required']});
}

exports = module.exports = function(app, passport) {
  //******** NEW JSON API ********
  app.get('/api/current-user', security.sendCurrentUser);
  app.post('/api/sendMessage', preAuth.sendMessage);
  app.post('/api/signup', security.signup);
  app.post('/api/login', security.login);
  app.post('/api/login/forgot', security.forgotPassword);
  app.put('/api/login/reset/:email/:token', security.resetPassword);
  app.get('/api/login/facebook/callback', security.loginFacebook);
  app.get('/api/login/google/callback', security.loginGoogle);
  app.post('/api/logout', security.logout);

  //-----authentication required api-----
  app.all('/api/account*', apiEnsureAuthenticated);
  app.all('/api/account*', apiEnsureAccount);

  app.get('/api/account/verification', account.upsertVerification);
  app.post('/api/account/verification', account.resendVerification);
  app.get('/api/account/verification/:token/', account.verify);

  app.all('/api/account/settings*', apiEnsureVerifiedAccount);

  app.get('/api/account/settings', account.getAccountDetails);
  app.put('/api/account/settings', account.update);
  app.put('/api/account/settings/identity', account.identity);
  app.put('/api/account/settings/password', account.password);
  app.get('/api/account/settings/google/callback', account.connectGoogle);
  app.get('/api/account/settings/google/disconnect', account.disconnectGoogle);
  app.get('/api/account/settings/facebook/callback', account.connectFacebook);
  app.get('/api/account/settings/facebook/disconnect', account.disconnectFacebook);

  //-----athorization required api-----
  app.all('/api/admin*', apiEnsureAuthenticated);
  app.all('/api/admin*', apiEnsureAdmin);
  app.get('/api/admin', admin.getStats);

  //admin > users
  app.get('/api/admin/users', adminUser.find);
  app.post('/api/admin/users/', adminUser.create);
  app.get('/api/admin/users/:id', adminUser.read);
  app.put('/api/admin/users/:id', adminUser.update);
  app.put('/api/admin/users/:id/password', adminUser.password);
  app.put('/api/admin/users/:id/role-admin', adminUser.linkAdmin);
  app.delete('/api/admin/users/:id/role-admin', adminUser.unlinkAdmin);
  app.put('/api/admin/users/:id/role-account', adminUser.linkAccount);
  app.delete('/api/admin/users/:id/role-account', adminUser.unlinkAccount);
  app.delete('/api/admin/users/:id', adminUser.delete);

  //admin > administrators
  app.get('/api/admin/administrators', adminAdministrator.find);
  app.post('/api/admin/administrators', adminAdministrator.create);
  app.get('/api/admin/administrators/:id', adminAdministrator.read);
  app.put('/api/admin/administrators/:id', adminAdministrator.update);
  app.put('/api/admin/administrators/:id/permissions', adminAdministrator.permissions);
  app.put('/api/admin/administrators/:id/groups', adminAdministrator.groups);
  app.put('/api/admin/administrators/:id/user', adminAdministrator.linkUser);
  app.delete('/api/admin/administrators/:id/user', adminAdministrator.unlinkUser);
  app.delete('/api/admin/administrators/:id', adminAdministrator.delete);

  //admin > admin groups
  app.get('/api/admin/admin-groups', adminGroup.find);
  app.post('/api/admin/admin-groups', adminGroup.create);
  app.get('/api/admin/admin-groups/:id', adminGroup.read);
  app.put('/api/admin/admin-groups/:id', adminGroup.update);
  app.put('/api/admin/admin-groups/:id/permissions', adminGroup.permissions);
  app.delete('/api/admin/admin-groups/:id', adminGroup.delete);

  //admin > accounts
  app.get('/api/admin/accounts', adminAccount.find);
  app.post('/api/admin/accounts', adminAccount.create);
  app.get('/api/admin/accounts/:id', adminAccount.read);
  app.put('/api/admin/accounts/:id', adminAccount.update);
  app.put('/api/admin/accounts/:id/user', adminAccount.linkUser);
  app.delete('/api/admin/accounts/:id/user', adminAccount.unlinkUser);
  app.post('/api/admin/accounts/:id/notes', adminAccount.newNote);
  app.post('/api/admin/accounts/:id/status', adminAccount.newStatus);
  app.delete('/api/admin/accounts/:id', adminAccount.delete);

  //admin > statuses
  app.get('/api/admin/statuses', adminStatus.find);
  app.post('/api/admin/statuses', adminStatus.create);
  app.get('/api/admin/statuses/:id', adminStatus.read);
  app.put('/api/admin/statuses/:id', adminStatus.update);
  app.delete('/api/admin/statuses/:id', adminStatus.delete);

  //admin > categories
  app.get('/api/admin/categories', adminCategory.find);
  app.post('/api/admin/categories', adminCategory.create);
  app.get('/api/admin/categories/:id', adminCategory.read);
  app.put('/api/admin/categories/:id', adminCategory.update);
  app.delete('/api/admin/categories/:id', adminCategory.delete);

  //admin > search
  app.get('/api/admin/search', admin.search);

  //******** END OF NEW JSON API ********

  //******** Static routes handled by Angular ********
  //public
  app.get('/', useAngular);
  app.get('/about', useAngular);
  app.get('/contact', useAngular);

  //sign up
  app.get('/signup', useAngular);

  //social sign up no-longer needed as user can login with their social account directly
  //this eliminates one more step (collecting email) before user login

  //login/out
  app.get('/login', useAngular);
  app.get('/login/forgot', useAngular);
  app.get('/login/reset', useAngular);
  app.get('/login/reset/:email/:token', useAngular);

  //social login
  app.get('/login/facebook', passport.authenticate('facebook', { callbackURL: 'http://' + app.config.hostname + '/login/facebook/callback', scope: ['email'] }));
  app.get('/login/facebook/callback', useAngular);
  app.get('/login/google', passport.authenticate('google', { callbackURL: 'http://' + app.config.hostname + '/login/google/callback', scope: ['profile email'] }));
  app.get('/login/google/callback', useAngular);

  //account
  app.get('/account', useAngular);

  //account > verification
  app.get('/account/verification', useAngular);
  app.get('/account/verification/:token', useAngular);

  //account > settings
  app.get('/account/settings', useAngular);

  //account > settings > social
  app.get('/account/settings/facebook/', passport.authenticate('facebook', { callbackURL: 'http://' + app.config.hostname + '/account/settings/facebook/callback', scope: [ 'email' ]}));
  app.get('/account/settings/facebook/callback', useAngular);
  app.get('/account/settings/google/', passport.authenticate('google', { callbackURL: 'http://' + app.config.hostname + '/account/settings/google/callback', scope: ['profile email'] }));
  app.get('/account/settings/google/callback', useAngular);

  //admin
  app.get('/admin', useAngular);

  //admin > users
  app.get('/admin/users', useAngular);
  app.get('/admin/users/:id', useAngular);

  //admin > administrators
  app.get('/admin/administrators', useAngular);
  app.get('/admin/administrators/:id', useAngular);

  //admin > admin groups
  app.get('/admin/admin-groups', useAngular);
  app.get('/admin/admin-groups/:id', useAngular);

  //admin > accounts
  app.get('/admin/accounts', useAngular);
  app.get('/admin/accounts/:id', useAngular);

  //admin > statuses
  app.get('/admin/statuses', useAngular);
  app.get('/admin/statuses/:id', useAngular);

  //admin > categories
  app.get('/admin/categories', useAngular);
  app.get('/admin/categories/:id', useAngular);

  //other routes not found nor begin with /api is handled by Angular
  app.all(/^(?!\/api).*$/, useAngular);

  //******** End OF static routes ********
};
