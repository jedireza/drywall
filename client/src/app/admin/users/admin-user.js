angular.module('admin.users.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('admin.users.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/users/:id', {
      templateUrl: 'admin/users/admin-user.tpl.html',
      controller: 'UsersDetailCtrl',
      title: 'Users / Details',
      resolve: {
        user: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findUser(id);
              }else{
                redirectUrl = '/admin/users';
                return $q.reject();
              }
            }, function(reason){
              //rejected either user is un-authorized or un-authenticated
              redirectUrl = reason === 'unauthorized-client'? '/account': '/login';
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
angular.module('admin.users.detail').controller('UsersDetailCtrl', ['$scope', '$route', '$location', 'utility', 'adminResource', 'user',
  function($scope, $route, $location, utility, adminResource, user) {
    // local vars
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };
    var link = function(type){
      $scope.roleAlerts = [];
      var resource, data;
      if(type === 'admin'){ //linkAdmin
        resource = adminResource.linkAdmin;
        data = { newAdminId: $scope.role.newAdminId };
      } else{ //linkAccount
        resource = adminResource.linkAccount;
        data = { newAccountId: $scope.role.newAccountId };
      }
      resource($scope.user._id, data).then(function (result) {
        $scope.role = {};
        $scope.roleForm.$setPristine();
        if (result.success) {
          $scope.user = result.user; //update $scope user model
        } else {
          angular.forEach(result.errors, function (err, index) {
            $scope.roleAlerts.push({type: 'danger', msg: err});
          });
        }
      }, function (x) {
        $scope.roleAlerts.push({
          type: 'danger',
          msg: 'Error linking ' + type + ': ' + x
        });
      });
    };
    var unlink = function(type){
      $scope.roleAlerts = [];
      var resource = type === 'admin'? adminResource.unlinkAdmin: adminResource.unlinkAccount;
      if(confirm('Are you sure?')){
        resource($scope.user._id).then(function(result){
          if(result.success){
            $scope.user = result.user; //update $scope user model
          }else{
            angular.forEach(result.errors, function(err, index){
              $scope.roleAlerts.push({ type: 'danger', msg: err });
            });
          }
        }, function(x){
          $scope.roleAlerts.push({
            type: 'danger',
            msg: 'Error unlinking ' + type + ': '  + x
          });
        });
      }
    };

    // $scope vars
    $scope.role = {};
    $scope.identityAlerts = [];
    $scope.passwordAlerts = [];
    $scope.roleAlerts = [];
    $scope.deleteAlerts = [];
    $scope.errfor = {};
    $scope.isActives = ["yes", "no"];
    $scope.canSave = utility.canSave;
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.closeIdentityAlert = function(ind){
      closeAlert($scope.identityAlerts, ind);
    };
    $scope.closePasswordAlert = function(ind){
      closeAlert($scope.passwordAlerts, ind);
    };
    $scope.closeRoleAlert = function(ind){
      closeAlert($scope.roleAlerts, ind);
    };
    $scope.closeDeleteAlert = function(ind){
      closeAlert($scope.deleteAlerts, ind);
    };
    $scope.updateIdentity = function(){
      var data = {
        username: $scope.user.username,
        email: $scope.user.email
      };
      if($scope.user.isActive){
        data['isActive'] = $scope.user.isActive;
      }
      $scope.identityAlerts = [];
      adminResource.updateUser($scope.user._id, data).then(function(result){
        if(result.success){
          $scope.user = result.user; //update $scope user model
          $scope.identityAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
        }else{
          $scope.errfor = result.errfor;
          angular.forEach(result.errfor, function(err, field){
            $scope.identityForm[field].$setValidity('server', false);
          });
          angular.forEach(result.errors, function(err, index){
            $scope.identityAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function(x){
        $scope.identityAlerts.push({
          type: 'danger',
          msg: 'Error updating user identity: ' + x
        });
      });
    };
    $scope.unlinkAdmin = function(){
      unlink('admin');
    };
    $scope.linkAdmin = function(){
      link('admin');
    };
    $scope.unlinkAccount = function(){
      unlink('account');
    };
    $scope.linkAccount = function(){
      link('account');
    };
    $scope.setPassword = function(){
      $scope.passwordAlerts = [];
      adminResource.setPassword($scope.user._id, $scope.pass).then(function(result){
        $scope.pass = {};
        $scope.passwordForm.$setPristine();
        if(result.success){
          $scope.user = result.user; //update $scope user model (why password hash is sent to front-end?)
          $scope.passwordAlerts.push({ type: 'info', msg: 'A new password has been set.' });
        }else{
          //error due to server side validation
          angular.forEach(result.errors, function(err, index){
            $scope.passwordAlerts.push({ type: 'danger', msg: err});
          });
        }
      }, function(x){
        $scope.passwordAlerts.push({ type: 'danger', msg: 'Error updating password: ' + x });
      });
    };
    $scope.deleteUser = function(){
      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteUser($scope.user._id).then(function(result){
          if(result.success){
            // redirect to admin users index page
            $location.path('/admin/users');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting user: ' + x });
        });
      }
    };
    //initialize
    $scope.user = user; //from resolved data
    $scope.user.isActive = $scope.user.isActive || null;
  }
]);