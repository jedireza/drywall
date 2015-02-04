angular.module('account.verification', ['security', 'services.easyRestResource', 'ui.bootstrap']);
angular.module('account.verification').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/account/verification', {
      templateUrl: 'account/verification/account-verification.tpl.html',
      controller: 'AccountVerificationCtrl',
      resolve: {
        upsertVerificationToken: ['$q', '$location', 'easyRestResource', 'securityAuthorization', function($q, $location, restResource, securityAuthorization){
          //lazy upsert verification only for un-verified user, otherwise redirect to /account
          var promise = securityAuthorization.requireUnverifiedUser()
            .then(restResource.upsertVerification)
            .then(function(data){
              if(!data.success){
                return $q.reject();
              }
            })
            .catch(function(){
              $location.path('/account');
              $q.reject();
            });
          return promise; //promise resolved if data.success == true
        }]
      }
    })
    .when('/account/verification/:token', {
      resolve: {
        verify: ['$q', '$location', '$route', 'easyRestResource', 'securityAuthorization', function($q, $location, $route, restResource, securityAuthorization){
          //attemp to verify account only for un-verified user
          var redirectUrl;
          var promise = securityAuthorization.requireUnverifiedUser()
            .then(function(){
              return restResource.verifyAccount($route.current.params.token);
            }, function(){
              redirectUrl = '/account';
              $q.reject();
            })
            .then(function(data){
              if(data.success) {
                redirectUrl = '/account';
              }
              return $q.reject();
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/account/verification';
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise;
        }]
      }
    })
  ;
}]);
angular.module('account.verification').controller('AccountVerificationCtrl', [ '$scope', '$location', '$log', 'easyRestResource', 'security',
  function($scope, $location, $log, restResource, security){
    //model def
    $scope.formVisible = false;
    $scope.email = security.currentUser.email;
    $scope.errfor = {}; //for email server-side validation
    $scope.alerts = [];

    // method def
    $scope.showForm = function(){
      $scope.formVisible = true;
    };
    $scope.hasError = function(ngModelCtrl){
      return ngModelCtrl.$dirty && ngModelCtrl.$invalid;
    };
    $scope.showError = function(ngModelCtrl, err){
      return ngModelCtrl.$dirty && ngModelCtrl.$error[err];
    };
    $scope.closeAlert = function(ind){
      $scope.alerts.splice(ind, 1);
    };
    $scope.submit = function(){
      $scope.alerts = [];
      restResource.resendVerification($scope.email).then(function (data) {
        if (data.success) {
          $scope.alerts.push({
            type: 'success',
            msg: 'Verification email successfully re-sent.'
          });
          $scope.formVisible = false;
          $scope.verificationForm.$setPristine();
        } else {
          //error due to server side validation
          $scope.errfor = data.errfor;
          angular.forEach(data.errfor, function (err, field) {
            $scope.verificationForm[field].$setValidity('server', false);
          });
        }
      }, function (x) {
        $scope.alerts.push({
          type: 'danger',
          msg: 'Error sending verification email: ' + x
        });
      });
    };
  }
]);
