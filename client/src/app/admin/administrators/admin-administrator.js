angular.module('admin.administrators.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('admin.administrators.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/administrators/:id', {
      templateUrl: 'admin/administrators/admin-administrator.tpl.html',
      controller: 'AdministratorsDetailCtrl',
      title: 'Administrators / Details',
      resolve: {
        administrator: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /administrator
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findAdministrator(id);
              }else{
                redirectUrl = '/admin/administrators';
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
angular.module('admin.administrators.detail').controller('AdministratorsDetailCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'administrator',
  function($scope, $route, $location, $log, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
      $scope.groups = data.adminGroups;
      deserializeAdministrator(data.record);
    };
    var deserializeAdministrator = function(administrator){
      $scope.selectedNewGroup = null;
      $scope.administrator = administrator;
    };
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };
    var isExistingGroup = function(selectedGroup){
      var flag = false;
      var groups = $scope.administrator.groups;
      angular.forEach(groups, function(group, ind){
        if(group._id === selectedGroup._id){
          flag = true;
        }
      });
      return flag;
    };
    var isExistingPermission = function(newPermission){
      var flag = false;
      var permissions = $scope.administrator.permissions;
      angular.forEach(permissions, function(permission, ind){
        if(permission.name === newPermission){
          flag = true;
        }
      });
      return flag;
    };
    // $scope vars
    $scope.contactAlerts = [];
    $scope.loginAlerts = [];
    $scope.deleteAlerts = [];
    $scope.groupAlerts = [];
    $scope.permissionAlerts = [];
    $scope.canSave = utility.canSave;
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.closeContactAlert = function(ind){
      closeAlert($scope.contactAlerts, ind);
    };
    $scope.closeLoginAlert = function(ind){
      closeAlert($scope.loginAlerts, ind);
    };
    $scope.closeDeleteAlert = function(ind){
      closeAlert($scope.deleteAlerts, ind);
    };
    $scope.closeGroupAlert = function(ind){
      closeAlert($scope.groupAlerts, ind);
    };
    $scope.closePermissionAlert = function(ind){
      closeAlert($scope.permissionAlerts, ind);
    };
    $scope.updateAdmin = function(){
      var data = {
        first:   $scope.administrator.name.first,
        middle:  $scope.administrator.name.middle,
        last:    $scope.administrator.name.last
      };
      $scope.contactAlerts = [];
      adminResource.updateAdministrator($scope.administrator._id, data).then(function(result){
        if(result.success){
          deserializeAdministrator(result.admin);
          $scope.contactAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
        }else{
          angular.forEach(result.errors, function(err, index){
            $scope.contactAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function(x){
        $scope.contactAlerts.push({ type: 'danger', msg: 'Error updating administrator: ' + x });
      });
    };
    $scope.linkUser = function () {
      $scope.loginAlerts = [];
      var newUsername = $scope.administrator.newUsername;
      $scope.administrator.newUsername = '';
      adminResource.adminLinkUser($scope.administrator._id, { newUsername: newUsername }).then(function (result) {
        $scope.loginForm.$setPristine();
        if (result.success) {
          deserializeAdministrator(result.admin);
        } else {
          angular.forEach(result.errors, function (err, index) {
            $scope.loginAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function (x) {
        $scope.loginAlerts.push({ type: 'danger', msg: 'Error linking user: ' + x });
      });
    };
    $scope.unlinkUser = function () {
      $scope.loginAlerts = [];
      if (confirm('Are you sure?')) {
        adminResource.adminUnlinkUser($scope.administrator._id).then(function (result) {
          if (result.success) {
            deserializeAdministrator(result.admin);
          } else {
            angular.forEach(result.errors, function (err, index) {
              $scope.loginAlerts.push({type: 'danger', msg: err});
            });
          }
        }, function (x) {
          $scope.loginAlerts.push({ type: 'danger', msg: 'Error unlinking user: ' + x });
        });
      }
    };
    $scope.addGroup = function(){
      if(!$scope.selectedNewGroup){
        alert('Please select a group.');
      } else if(isExistingGroup($scope.selectedNewGroup)){
        alert('That group already exists.');
      }else{
        $scope.administrator.groups.push(angular.copy($scope.selectedNewGroup));
      }
      $scope.selectedNewGroup = null;  //reset selectedGroup after user interaction
    };
    $scope.deleteGroup = function(index){
      if(confirm('Are you sure?')){
        $scope.administrator.groups.splice(index, 1);
      }
    };
    $scope.saveGroups = function(){
      $scope.groupAlerts = [];
      var groups = $scope.administrator.groups;
      adminResource.saveAdminGroups($scope.administrator._id, {groups: groups}).then(function (result) {
        if (result.success) {
          $scope.groupAlerts.push({type: 'info', msg: 'Changes have been saved.'});
          deserializeAdministrator(result.admin);
        } else {
          //error due to server side validation
          angular.forEach(result.errors, function (err, index) {
            $scope.groupAlerts.push({type: 'danger', msg: err});
          });
        }
      }, function (x) {
        $scope.groupAlerts.push({type: 'danger', msg: 'Error saving admin groups: ' + x});
      });
    };
    $scope.addPermission = function(){
      if(!$scope.newPermission){
        alert('Please enter a name.');
      } else if(isExistingPermission($scope.newPermission)){
        alert('That name already exists.');
      }else{
        $scope.administrator.permissions.push({
          name: angular.copy($scope.newPermission),
          permit: true
        });
      }
      $scope.newPermission = null;  //reset newPermission after user interaction
    };
    $scope.togglePermission = function(index){
      $scope.administrator.permissions[index]['permit'] = !$scope.administrator.permissions[index]['permit'];
    };
    $scope.deletePermission = function(index){
      if(confirm('Are you sure?')){
        $scope.administrator.permissions.splice(index, 1);
      }
    };
    $scope.saveSettings = function(){
      $scope.permissionAlerts = [];
      var permissions = $scope.administrator.permissions;
      adminResource.saveAdminPermissions($scope.administrator._id, {permissions: permissions}).then(function (result) {
        if (result.success) {
          $scope.permissionAlerts.push({type: 'info', msg: 'Changes have been saved.'});
          deserializeAdministrator(result.admin);
        } else {
          //error due to server side validation
          angular.forEach(result.errors, function (err, index) {
            $scope.permissionAlerts.push({type: 'danger', msg: err});
          });
        }
      }, function (x) {
        $scope.permissionAlerts.push({type: 'danger', msg: 'Error saving admin permissions: ' + x});
      });
    };
    $scope.deleteAdministrator = function(){
      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteAdministrator($scope.administrator._id).then(function(result){
          if(result.success){
            // redirect to admin administrators index page
            $location.path('/admin/administrators');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting administrator: ' + x });
        });
      }
    };

    //initialize
    deserializeData(data);
  }
]);