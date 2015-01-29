angular.module('signup', ['directives.serverError', 'services.easyRestResource', 'ui.bootstrap']);
angular.module('signup').controller('SignupCtrl', [ '$scope', '$location', '$log', 'easyRestResource',
  function($scope, $location, $log, restResource){
    // local variable
    var signupSuccess = function(data){
      if(data.success){
        //account/user created, redirect...
        var url = data.defaultReturnUrl || '/';
        return $location.path(url);
      }else{
        //error due to server side validation
        $scope.errfor = data.errfor;
        angular.forEach(data.errfor, function(err, field){
          $scope.signupForm[field].$setValidity('server', false);
        });
        return;
      }
    };
    var signupError = function(){
      $scope.alerts.push({
        type: 'error',
        msg: 'Error creating account, Please try again'
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
      restResource.signup($scope.user).then(signupSuccess, signupError);
    };
    $scope.socialSignup = function(provider){
      $log.log('Attempting to signup with ', provider);
    };
  }]);