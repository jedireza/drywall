angular.module('account.settings', ['config', 'account.settings.social', 'security.service', 'security.authorization', 'services.accountResource', 'services.utility','ui.bootstrap', 'directives.serverError']);
angular.module('account.settings').config(['$routeProvider', 'securityAuthorizationProvider', function($routeProvider){
  $routeProvider
    .when('/account/settings', {
      templateUrl: 'account/settings/account-settings.tpl.html',
      controller: 'AccountSettingsCtrl',
      title: 'Account Settings',
      resolve: {
        accountDetails: ['$q', '$location', 'securityAuthorization', 'accountResource' ,function($q, $location, securityAuthorization, accountResource){
          //get account details only for verified-user, otherwise redirect to /account/verification
          var redirectUrl;
          var promise = securityAuthorization.requireVerifiedUser()
            .then(accountResource.getAccountDetails, function(reason){
              //rejected either user is unverified or un-authenticated
              redirectUrl = reason === 'unverified-client'? '/account/verification': '/login';
              return $q.reject();
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/account';
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise;
        }]
      }
    });
}]);
angular.module('account.settings').controller('AccountSettingsCtrl', [ '$scope', '$location', '$log', 'security', 'utility', 'accountResource', 'accountDetails', 'SOCIAL',
  function($scope, $location, $log, security, utility, restResource, accountDetails, SOCIAL){
    //local vars
    var account = accountDetails.account;
    var user = accountDetails.user;
    var submitDetailForm = function(){
      $scope.alerts.detail = [];
      restResource.setAccountDetails($scope.userDetail).then(function(data){
        if(data.success){
          $scope.alerts.detail.push({
            type: 'success',
            msg: 'Account detail is updated.'
          });
        }else{
          angular.forEach(data.errors, function(err, index){
            $scope.alerts.detail.push({
              type: 'danger',
              msg: err
            });
          });
        }
      }, function(x){
        $scope.alerts.detail.push({
          type: 'danger',
          msg: 'Error updating account details: ' + x
        });
      });
    };

    var submitIdentityForm = function(){
      $scope.alerts.identity = [];
      restResource.setIdentity($scope.user).then(function(data){
        if(data.success){
          $scope.alerts.identity.push({
            type: 'success',
            msg: 'User identity is updated.'
          });
        }else{
          //error due to server side validation
          $scope.errfor = data.errfor;
          angular.forEach(data.errfor, function(err, field){
            $scope.identityForm[field].$setValidity('server', false);
          });
          angular.forEach(data.errors, function(err, index){
            $scope.alerts.identity.push({
              type: 'danger',
              msg: err
            });
          });
        }
      }, function(x){
        $scope.alerts.identity.push({
          type: 'danger',
          msg: 'Error updating user identity: ' + x
        });
      });
    };

    var submitPasswordForm = function(){
      $scope.alerts.pass = [];
      restResource.setPassword($scope.pass).then(function(data){
        $scope.pass = {};
        $scope.passwordForm.$setPristine();
        if(data.success){
          $scope.alerts.pass.push({
            type: 'success',
            msg: 'Password is updated.'
          });
        }else{
          //error due to server side validation
          angular.forEach(data.errors, function(err, index){
            $scope.alerts.pass.push({
              type: 'danger',
              msg: err
            });
          });
        }
      }, function(x){
        $scope.alerts.pass.push({
          type: 'danger',
          msg: 'Error updating password: ' + x
        });
      });
    };

    var disconnect = function(provider){
      var errorAlert = {
        type: 'warning',
        msg: 'Error occurred when disconnecting your '+ provider + ' account. Please try again later.'
      };
      $scope.socialAlerts = [];
      security.socialDisconnect(provider).then(function(data){
        if(data.success){
          $scope.social[provider]['connected'] = false;
          $scope.socialAlerts.push({
            type: 'info',
            msg: 'Successfully disconnected your '+ provider +' account.'
          });
        }else{
          $scope.socialAlerts.push(errorAlert);
        }
      }, function(x){
        $scope.socialAlerts.push(errorAlert);
      });
    };

    //model def
    $scope.errfor = {}; //for identity server-side validation
    $scope.alerts = {
      detail: [], identity: [], pass: []
    };
    $scope.userDetail = {
      first:  account.name.first,
      middle: account.name.middle,
      last:   account.name.last,
      company:account.company,
      phone:  account.phone,
      zip:    account.zip
    };
    $scope.user = {
      username: user.username,
      email:    user.email
    };
    $scope.pass = {};
    $scope.social = null;
    if(!angular.equals({}, SOCIAL)){
      $scope.social = SOCIAL;
      if(user.google && user.google.id){
        $scope.social.google.connected = true;
      }
      if(user.facebook && user.facebook.id){
        $scope.social.facebook.connected = true;
      }
    }

    $scope.socialAlerts = [];

    //initial behavior
    var search = $location.search();
    if(search.provider){
      if(search.success === 'true'){
        $scope.socialAlerts.push({
          type: 'info',
          msg: 'Successfully connected your '+ search.provider +' account.'
        });
      }else{
        $scope.socialAlerts.push({
          type: 'warning',
          msg: 'Unable to connect your '+ search.provider + ' account. ' + search.reason
        });
      }
    }

    // method def
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.canSave = utility.canSave;
    $scope.closeAlert = function(key, ind){
      $scope.alerts[key].splice(ind, 1);
    };
    $scope.closeSocialAlert = function(ind){
      $scope.socialAlerts.splice(ind, 1);
    };
    $scope.submit = function(ngFormCtrl){
      switch (ngFormCtrl.$name){
        case 'detailForm':
          submitDetailForm();
          break;
        case 'identityForm':
          submitIdentityForm();
          break;
        case 'passwordForm':
          submitPasswordForm();
          break;
        default:
          return;
      }
    };
    $scope.disconnect = function(provider){
      if($scope.social){
        disconnect(provider);
      }
    };
  }
]);
