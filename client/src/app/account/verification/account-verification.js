angular.module('account.verification', ['security', 'services.utility', 'services.accountResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('account.verification').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/account/verification', {
      templateUrl: 'account/verification/account-verification.tpl.html',
      controller: 'AccountVerificationCtrl',
      title: 'Verification Required',
      resolve: {
        upsertVerificationToken: ['$q', '$location', 'accountResource', 'securityAuthorization', function($q, $location, restResource, securityAuthorization){
          //lazy upsert verification only for un-verified user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireUnverifiedUser()
            .then(restResource.upsertVerification, function(reason){
              //rejected either user is verified already or isn't authenticated
              redirectUrl = reason === 'verified-client'? '/account': '/login';
              return $q.reject();
            })
            .then(function(data){
              if(!data.success){
                return $q.reject();
              }
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/account';
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise; //promise resolved if data.success == true
        }]
      }
    })
    .when('/account/verification/:token', {
      resolve: {
        verify: ['$q', '$location', '$route', 'accountResource', 'securityAuthorization', function($q, $location, $route, restResource, securityAuthorization){
          //attemp to verify account only for un-verified user
          var redirectUrl;
          var promise = securityAuthorization.requireUnverifiedUser()
            .then(function(){
              return restResource.verifyAccount($route.current.params.token);
            }, function(){
              redirectUrl = '/account';
              return $q.reject();
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
          return promise; //promise never resolves, will always redirect
        }]
      }
    })
  ;
}]);
angular.module('account.verification').controller('AccountVerificationCtrl', [ '$scope', '$location', '$log', 'accountResource', 'security', 'utility',
  function($scope, $location, $log, restResource, security, utility){
    //model def
    $scope.formVisible = false;
    $scope.email = security.currentUser.email;
    $scope.errfor = {}; //for email server-side validation
    $scope.alerts = [];

    // method def
    $scope.showForm = function(){
      $scope.formVisible = true;
    };
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
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
