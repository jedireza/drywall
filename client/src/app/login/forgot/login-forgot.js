angular.module('login.forgot', ['services.easyRestResource', 'ui.bootstrap']);
angular.module('login.forgot').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/login/forgot', {
      templateUrl: 'login/forgot/login-forgot.tpl.html',
      controller: 'LoginForgotCtrl'
    });
}]);
angular.module('login.forgot').controller('LoginForgotCtrl', [ '$scope', '$location', '$log', 'easyRestResource',
  function($scope, $location, $log, restResource){
    // local variable
    var resetSuccess = function(data){
      $scope.loginForgotForm.$setPristine();
      $scope.user = {};
      if(data.success){
        $scope.alerts.push({
          type: 'info',
          msg: 'If an account matched that address, an email will be sent with instructions.'
        });
      }else{
        angular.forEach(data.errors, function(err, index){
          $scope.alerts.push({
            type: 'danger',
            msg: err
          });
        });
      }
    };
    var resetError = function(){
      $scope.alerts.push({
        type: 'danger',
        msg: 'Error resetting your account, Please try again'
      });
    };
    // model def
    $scope.user = {};
    $scope.alerts = [];

    // method def
    $scope.hasError = function(ngModelCtrl){
      return ngModelCtrl.$dirty && ngModelCtrl.$invalid;
    };
    $scope.showError = function(ngModelCtrl, err){
      return ngModelCtrl.$dirty && ngModelCtrl.$error[err];
    };
    $scope.canSave = function(ngFormCtrl){
      return ngFormCtrl.$dirty && ngFormCtrl.$valid;
    };
    $scope.closeAlert = function(ind){
      $scope.alerts.splice(ind, 1);
    };
    $scope.submit = function(){
      restResource.loginForgot($scope.user).then(resetSuccess, resetError);
    };
    //$scope.socialLogin = function(provider){
    //  $log.log('Attempting to login with ', provider);
    //  restResource.socialLogin(provider).then(null, loginError);
    //};
  }]);
