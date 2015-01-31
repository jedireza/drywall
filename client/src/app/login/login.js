angular.module('login', ['login.forgot', 'login.reset', 'security.service', 'directives.serverError', 'services.easyRestResource', 'ui.bootstrap']);
angular.module('login').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/login', {
      templateUrl: 'login/login.tpl.html',
      controller: 'LoginCtrl'
    });
}]);
angular.module('login').controller('LoginCtrl', [ '$scope', '$location', '$log', 'easyRestResource', 'security',
  function($scope, $location, $log, restResource, security){
    // local variable
    var loginSuccess = function(data){
      if(data.success){
        //account/user created, redirect...
        var url = data.defaultReturnUrl || '/';
        return $location.path(url);
      }else{
        //error due to server side validation
        $scope.errfor = data.errfor;
        angular.forEach(data.errfor, function(err, field){
          $scope.loginForm[field].$setValidity('server', false);
        });
        angular.forEach(data.errors, function(err, index){
          $scope.alerts.push({
            type: 'danger',
            msg: err
          });
        });
        return;
      }
    };
    var loginError = function(){
      $scope.alerts.push({
        type: 'danger',
        msg: 'Error logging you in, Please try again'
      });
    };
    // model def
    $scope.user = {};
    $scope.alerts = [];
    $scope.errfor = {};

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
      security.login($scope.user.username, $scope.user.password).then(loginSuccess, loginError);
      //restResource.login($scope.user).then(loginSuccess, loginError);
    };
    //$scope.socialLogin = function(provider){
    //  $log.log('Attempting to login with ', provider);
    //  restResource.socialLogin(provider).then(null, loginError);
    //};
  }]);
