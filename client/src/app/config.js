//----- angular app configuration-----
angular.module('config', []);
angular.module('config')
  .constant('ENABLE_SOCIAL', {
    facebook: false,
    google: false
  })
  .constant('REQUIRE_ACCOUNT_VERIFICATION', false)
;
//----- end of configuration -----
angular.module('config')
  .constant('XSRF_COOKIE_NAME', '_csrfToken')
  .constant('I18N.MESSAGES', {
    'errors.route.changeError':'Route change error',
    'crud.user.save.success':"A user with id '{{id}}' was saved successfully.",
    'crud.user.remove.success':"A user with id '{{id}}' was removed successfully.",
    'crud.user.remove.error':"Something went wrong when removing user with id '{{id}}'.",
    'crud.user.save.error':"Something went wrong when saving a user...",
    'crud.project.save.success':"A project with id '{{id}}' was saved successfully.",
    'crud.project.remove.success':"A project with id '{{id}}' was removed successfully.",
    'crud.project.save.error':"Something went wrong when saving a project...",
    'login.reason.notAuthorized':"You do not have the necessary access permissions.  Do you want to login as someone else?",
    'login.reason.notAuthenticated':"You must be logged in to access this part of the application.",
    'login.error.invalidCredentials': "Login failed.  Please check your credentials and try again.",
    'login.error.serverError': "There was a problem with authenticating: {{exception}}."
  })
;
angular.module('config').config(['$provide', 'ENABLE_SOCIAL', function($provide, ENABLE_SOCIAL){
  var setting = {
    'facebook': {
      text: 'Facebook',
      icon: 'fa-facebook-square',
      login: '/login/facebook',
      connect: '/account/settings/facebook/'
    },
    'google': {
      text: 'Google',
      icon: 'fa-google-plus-square',
      login: '/login/google',
      connect: '/account/settings/google/'
    }
  };
  var social = {};
  angular.forEach(ENABLE_SOCIAL, function(enable, key){
    if(enable){
      social[key] = setting[key];
    }
  });

  // programmatically set constant, 'SOCIAL', in config module
  $provide.constant('SOCIAL', social);
}]);