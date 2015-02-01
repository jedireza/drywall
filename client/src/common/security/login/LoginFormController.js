angular.module('security.login.form', ['services.localizedMessages', 'ui.bootstrap'])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', ['$scope', 'security', 'localizedMessages', function($scope, security, localizedMessages) {
  // The model for this form 
  $scope.user = {};
  $scope.alerts = [{
    type: 'info',
    msg: 'Please enter your login details'
  }];
  // The reason that we are being asked to login - for instance because we tried to access something to which we are not authorized
  // We could do something different for each reason here but to keep it simple...
  if(security.getLoginReason()){
    $scope.alerts.push({
      type: 'warning',
      msg: security.isAuthenticated()?
        localizedMessages.get('login.reason.notAuthorized') :
        localizedMessages.get('login.reason.notAuthenticated')
    });
  }

  // Attempt to authenticate the user specified in the form's model
  $scope.login = function() {
    // Clear any previous security errors
    $scope.alerts = [];

    // Try to login
    security.login($scope.user.email, $scope.user.password).then(function(data) {
      if ( !data.success ) {
        // If we get here then the login failed due to bad credentials
        $scope.alerts.push({
          type: 'danger',
          msg: localizedMessages.get('login.error.invalidCredentials')
        });
      }
    }, function(x) {
      // If we get here then there was a problem with the login request to the server
      $scope.alerts.push({
        type: 'danger',
        msg: localizedMessages.get('login.error.serverError', {exception: x})
      });
    });
  };

  $scope.clearForm = function() {
    $scope.user = {};
  };

  $scope.cancelLogin = function() {
    security.cancelLogin();
  };

  $scope.closeAlert = function(ind){
    $scope.alerts.splice(ind, 1);
  };
}]);
