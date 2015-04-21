angular.module('admin.admin-groups.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('admin.admin-groups.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/admin-groups/:id', {
      templateUrl: 'admin/admin-groups/admin-group.tpl.html',
      controller: 'AdminGroupsDetailCtrl',
      title: 'Admin Groups / Details',
      resolve: {
        group: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findAdminGroup(id);
              }else{
                redirectUrl = '/admin/admin-groups';
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
angular.module('admin.admin-groups.detail').controller('AdminGroupsDetailCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'group',
  function($scope, $route, $location, $log, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
      $scope.group = data;
    };
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };
    var isExistingPermission = function(newPermission){
      var flag = false;
      angular.forEach($scope.group.permissions, function(permission, ind){
        if(permission.name === newPermission){
          flag = true;
        }
      });
      return flag;
    };
    //$scope vars
    $scope.detailAlerts = [];
    $scope.deleteAlerts = [];
    $scope.permissionAlerts = [];
    $scope.canSave = utility.canSave;
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.closeDetailAlert = function(ind){
      closeAlert($scope.detailAlerts, ind);
    };
    $scope.closeDeleteAlert = function(ind){
      closeAlert($scope.deleteAlerts, ind);
    };
    $scope.closePermissionAlert = function(ind){
      closeAlert($scope.permissionAlerts, ind);
    };
    $scope.update = function(){
      $scope.detailAlerts = [];
      adminResource.updateAdminGroup($scope.group._id, { name: $scope.group.name }).then(function(result){
        if(result.success){
          deserializeData(result.adminGroup);
          $scope.detailAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
        }else{
          angular.forEach(result.errors, function(err, index){
            $scope.detailAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function(x){
        $scope.detailAlerts.push({ type: 'danger', msg: 'Error updating admin group: ' + x });
      });
    };
    $scope.addPermission = function(){
      if(!$scope.newPermission){
        alert('Please enter a name.');
      } else if(isExistingPermission($scope.newPermission)){
        alert('That name already exists.');
      }else{
        $scope.group.permissions.push({
          name: angular.copy($scope.newPermission),
          permit: true
        });
      }
      $scope.newPermission = null;  //reset newPermission after user interaction
    };
    $scope.togglePermission = function(index){
      $scope.group.permissions[index]['permit'] = !$scope.group.permissions[index]['permit'];
    };
    $scope.deletePermission = function(index){
      if(confirm('Are you sure?')){
        $scope.group.permissions.splice(index, 1);
      }
    };
    $scope.saveSettings = function(){
      $scope.permissionAlerts = [];
      var permissions = $scope.group.permissions;
      adminResource.saveAdminGroupPermissions($scope.group._id, {permissions: permissions}).then(function (result) {
        if (result.success) {
          $scope.permissionAlerts.push({type: 'info', msg: 'Changes have been saved.'});
          deserializeData(result.adminGroup);
        } else {
          //error due to server side validation
          angular.forEach(result.errors, function (err, index) {
            $scope.permissionAlerts.push({type: 'danger', msg: err});
          });
        }
      }, function (x) {
        $scope.permissionAlerts.push({type: 'danger', msg: 'Error saving admin group permissions: ' + x});
      });
    };
    $scope.deleteAdminGroup = function(){
      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteAdminGroup($scope.group._id).then(function(result){
          if(result.success){
            //redirect to admin admin-groups index page
            $location.path('/admin/admin-groups');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting admin group: ' + x });
        });
      }
    };

    //initialize
    deserializeData(data);
  }
]);