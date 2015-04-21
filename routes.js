'use strict';

var security = require('./service/security');
var account = require('./service/account');
var admin = require('./service/admin');
var adminUser = require('./service/admin/user');
var adminAccount = require('./service/admin/account');
var adminAdministrator = require('./service/admin/administrator');
var adminGroup = require('./service/admin/admin-group');
var adminStatus = require('./service/admin/status');

function useAngular(req, res, next){
  res.sendFile(require('path').join(__dirname, './client/dist/index.html'));
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) {
    return next();
  }
  res.redirect('/');
}

function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) {
    if (req.app.config.requireAccountVerification) {
      if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
        return res.redirect('/account/verification/');
      }
    }
    return next();
  }
  res.redirect('/');
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
  app.post('/api/sendMessage', require('./views/contact/index').sendMessage);
  //TODO: move signup/login api handlers to security service
  app.post('/api/signup', require('./views/signup/index').signup);
  app.post('/api/login', security.login);
  app.post('/api/login/forgot', require('./views/login/forgot/index').send);
  app.put('/api/login/reset/:email/:token', require('./views/login/reset/index').set);
  app.post('/api/logout/', security.logout);
  app.get('/api/login/facebook/callback', security.loginFacebook);
  app.get('/api/login/google/callback', security.loginGoogle);

  //-----authentication required api-----
  app.all('/api/account*', apiEnsureAuthenticated);
  app.all('/api/account*', apiEnsureAccount);
  app.all('/api/account/settings*', apiEnsureVerifiedAccount);
  app.get('/api/account/settings', account.getAccountDetails);
  app.put('/api/account/settings', require('./views/account/settings/index').update);
  app.put('/api/account/settings/identity', require('./views/account/settings/index').identity);
  app.put('/api/account/settings/password', require('./views/account/settings/index').password);
  app.get('/api/account/verification', account.upsertVerification);
  app.post('/api/account/verification', account.resendVerification);
  app.get('/api/account/verification/:token/', account.verify);
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

  //******** End OF static routes ********

  //front end
  //app.get('/', require('./views/index').init);
  //app.get('/about/', require('./views/about/index').init);
  //app.get('/contact/', require('./views/contact/index').init);
  //app.post('/contact/', require('./views/contact/index').sendMessage);

  //sign up
  //app.get('/signup/', require('./views/signup/index').init);
  //app.post('/signup/', require('./views/signup/index').signup);

  //social sign up
  //app.post('/signup/social/', require('./views/signup/index').signupSocial);
  //app.get('/signup/twitter/', passport.authenticate('twitter', { callbackURL: '/signup/twitter/callback/' }));
  //app.get('/signup/twitter/callback/', require('./views/signup/index').signupTwitter);
  //app.get('/signup/github/', passport.authenticate('github', { callbackURL: '/signup/github/callback/', scope: ['user:email'] }));
  //app.get('/signup/github/callback/', require('./views/signup/index').signupGitHub);
  //app.get('/signup/facebook/', passport.authenticate('facebook', { callbackURL: '/signup/facebook/callback/', scope: ['email'] }));
  //app.get('/signup/facebook/callback/', require('./views/signup/index').signupFacebook);
  //app.get('/signup/google/', passport.authenticate('google', { callbackURL: '/signup/google/callback/', scope: ['profile email'] }));
  //app.get('/signup/google/callback/', require('./views/signup/index').signupGoogle);
  //app.get('/signup/tumblr/', passport.authenticate('tumblr', { callbackURL: '/signup/tumblr/callback/' }));
  //app.get('/signup/tumblr/callback/', require('./views/signup/index').signupTumblr);

  //login/out
  //app.get('/login/', require('./views/login/index').init);
  //app.post('/login/', require('./views/login/index').login);
  //app.get('/login/forgot/', require('./views/login/forgot/index').init);
  //app.post('/login/forgot/', require('./views/login/forgot/index').send);
  //app.get('/login/reset/', require('./views/login/reset/index').init);
  //app.get('/login/reset/:email/:token/', require('./views/login/reset/index').init);
  //app.put('/login/reset/:email/:token/', require('./views/login/reset/index').set);
  //app.get('/logout/', require('./views/logout/index').init);

  //social login
  //app.get('/login/twitter/', passport.authenticate('twitter', { callbackURL: '/login/twitter/callback/' }));
  //app.get('/login/twitter/callback/', require('./views/login/index').loginTwitter);
  //app.get('/login/github/', passport.authenticate('github', { callbackURL: '/login/github/callback/' }));
  //app.get('/login/github/callback/', require('./views/login/index').loginGitHub);
  //app.get('/login/facebook/callback/', require('./views/login/index').loginFacebook);
  //app.get('/login/google/callback/', require('./views/login/index').loginGoogle);
  //app.get('/login/tumblr/', passport.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/', scope: ['profile email'] }));
  //app.get('/login/tumblr/callback/', require('./views/login/index').loginTumblr);

  //admin
  //app.all('/admin*', ensureAuthenticated);
  //app.all('/admin*', ensureAdmin);
  //app.get('/admin/', require('./views/admin/index').init);

  //admin > users
  //app.get('/admin/users/', require('./views/admin/users/index').find);
  //app.post('/admin/users/', require('./views/admin/users/index').create);
  //app.get('/admin/users/:id/', require('./views/admin/users/index').read);
  //app.put('/admin/users/:id/', require('./views/admin/users/index').update);
  //app.put('/admin/users/:id/password/', require('./views/admin/users/index').password);
  //app.put('/admin/users/:id/role-admin/', require('./views/admin/users/index').linkAdmin);
  //app.delete('/admin/users/:id/role-admin/', require('./views/admin/users/index').unlinkAdmin);
  //app.put('/admin/users/:id/role-account/', require('./views/admin/users/index').linkAccount);
  //app.delete('/admin/users/:id/role-account/', require('./views/admin/users/index').unlinkAccount);
  //app.delete('/admin/users/:id/', require('./views/admin/users/index').delete);

  //admin > administrators
  //app.get('/admin/administrators/', require('./views/admin/administrators/index').find);
  //app.post('/admin/administrators/', require('./views/admin/administrators/index').create);
  //app.get('/admin/administrators/:id/', require('./views/admin/administrators/index').read);
  //app.put('/admin/administrators/:id/', require('./views/admin/administrators/index').update);
  //app.put('/admin/administrators/:id/permissions/', require('./views/admin/administrators/index').permissions);
  //app.put('/admin/administrators/:id/groups/', require('./views/admin/administrators/index').groups);
  //app.put('/admin/administrators/:id/user/', require('./views/admin/administrators/index').linkUser);
  //app.delete('/admin/administrators/:id/user/', require('./views/admin/administrators/index').unlinkUser);
  //app.delete('/admin/administrators/:id/', require('./views/admin/administrators/index').delete);

  //admin > admin groups
  //app.get('/admin/admin-groups/', require('./views/admin/admin-groups/index').find);
  //app.post('/admin/admin-groups/', require('./views/admin/admin-groups/index').create);
  //app.get('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').read);
  //app.put('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').update);
  //app.put('/admin/admin-groups/:id/permissions/', require('./views/admin/admin-groups/index').permissions);
  //app.delete('/admin/admin-groups/:id/', require('./views/admin/admin-groups/index').delete);

  //admin > accounts
  //app.get('/admin/accounts/', require('./views/admin/accounts/index').find);
  //app.post('/admin/accounts/', require('./views/admin/accounts/index').create);
  //app.get('/admin/accounts/:id/', require('./views/admin/accounts/index').read);
  //app.put('/admin/accounts/:id/', require('./views/admin/accounts/index').update);
  //app.put('/admin/accounts/:id/user/', require('./views/admin/accounts/index').linkUser);
  //app.delete('/admin/accounts/:id/user/', require('./views/admin/accounts/index').unlinkUser);
  //app.post('/admin/accounts/:id/notes/', require('./views/admin/accounts/index').newNote);
  //app.post('/admin/accounts/:id/status/', require('./views/admin/accounts/index').newStatus);
  //app.delete('/admin/accounts/:id/', require('./views/admin/accounts/index').delete);

  //admin > statuses
  app.get('/admin/statuses/', require('./views/admin/statuses/index').find);
  app.post('/admin/statuses/', require('./views/admin/statuses/index').create);
  app.get('/admin/statuses/:id/', require('./views/admin/statuses/index').read);
  app.put('/admin/statuses/:id/', require('./views/admin/statuses/index').update);
  app.delete('/admin/statuses/:id/', require('./views/admin/statuses/index').delete);

  //admin > categories
  app.get('/admin/categories/', require('./views/admin/categories/index').find);
  app.post('/admin/categories/', require('./views/admin/categories/index').create);
  app.get('/admin/categories/:id/', require('./views/admin/categories/index').read);
  app.put('/admin/categories/:id/', require('./views/admin/categories/index').update);
  app.delete('/admin/categories/:id/', require('./views/admin/categories/index').delete);

  //admin > search
  app.get('/admin/search/', require('./views/admin/search/index').find);

  //account
  //app.all('/account*', ensureAuthenticated);
  //app.all('/account*', ensureAccount);
  //app.get('/account/', require('./views/account/index').init);

  //account > verification
  //app.get('/account/verification/', require('./views/account/verification/index').init);
  //app.post('/account/verification/', require('./views/account/verification/index').resendVerification);
  //app.get('/account/verification/:token/', require('./views/account/verification/index').verify);
  //
  //account > settings
  //app.get('/account/settings/', require('./views/account/settings/index').init);
  //app.put('/account/settings/', require('./views/account/settings/index').update);
  //app.put('/account/settings/identity/', require('./views/account/settings/index').identity);
  //app.put('/account/settings/password/', require('./views/account/settings/index').password);

  //account > settings > social
  //app.get('/account/settings/twitter/', passport.authenticate('twitter', { callbackURL: '/account/settings/twitter/callback/' }));
  //app.get('/account/settings/twitter/callback/', require('./views/account/settings/index').connectTwitter);
  //app.get('/account/settings/twitter/disconnect/', require('./views/account/settings/index').disconnectTwitter);
  //app.get('/account/settings/github/', passport.authenticate('github', { callbackURL: '/account/settings/github/callback/' }));
  //app.get('/account/settings/github/callback/', require('./views/account/settings/index').connectGitHub);
  //app.get('/account/settings/github/disconnect/', require('./views/account/settings/index').disconnectGitHub);
  //app.get('/account/settings/facebook/callback/', require('./views/account/settings/index').connectFacebook);
  //app.get('/account/settings/facebook/disconnect/', require('./views/account/settings/index').disconnectFacebook);
  //app.get('/account/settings/google/callback/', require('./views/account/settings/index').connectGoogle);
  //app.get('/account/settings/google/disconnect/', require('./views/account/settings/index').disconnectGoogle);
  //app.get('/account/settings/tumblr/', passport.authenticate('tumblr', { callbackURL: '/account/settings/tumblr/callback/' }));
  //app.get('/account/settings/tumblr/callback/', require('./views/account/settings/index').connectTumblr);
  //app.get('/account/settings/tumblr/disconnect/', require('./views/account/settings/index').disconnectTumblr);

  //route not found
  app.all('*', require('./views/http/index').http404);
};
