angular.module('admin.accounts.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('admin.accounts.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/accounts/:id', {
      templateUrl: 'admin/accounts/admin-account.tpl.html',
      controller: 'AccountsDetailCtrl',
      title: 'Accounts / Details',
      resolve: {
        account: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findAccount(id);
              }else{
                redirectUrl = '/admin/accounts';
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
angular.module('admin.accounts.detail').controller('AccountsDetailCtrl', ['$scope', '$route', '$location', 'utility', 'adminResource', 'account',
  function($scope, $route, $location, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
      $scope.statuses = data.statuses;
      deserializeAccount(data.record);
    };
    var deserializeAccount = function(account){
      $scope.account = account;
      $scope.selectedStatus = {
        "_id": account.status.id,
        "name": account.status.name
      };
    };
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };

    // $scope vars
    $scope.contactAlerts = [];
    $scope.loginAlerts = [];
    $scope.deleteAlerts = [];
    $scope.statusAlerts = [];
    $scope.noteAlerts = [];
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
    $scope.closeStatusAlert = function(ind){
      closeAlert($scope.statusAlerts, ind);
    };
    $scope.closeNoteAlert = function(ind){
      closeAlert($scope.noteAlerts, ind);
    };
    $scope.formatTime = function(timestamp, replace){
      var res = moment(timestamp).from();
      return replace? res.replace('ago', replace): res;
    };
    $scope.updateAccount = function(){
      var data = {
        first:   $scope.account.name.first,
        middle:  $scope.account.name.middle,
        last:    $scope.account.name.last,
        company: $scope.account.company,
        phone:   $scope.account.phone,
        zip:     $scope.account.zip
      };
      $scope.contactAlerts = [];
      adminResource.updateAccount($scope.account._id, data).then(function(result){
        if(result.success){
          deserializeAccount(result.account);
          $scope.contactAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
        }else{
          angular.forEach(result.errors, function(err, index){
            $scope.contactAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function(x){
        $scope.contactAlerts.push({ type: 'danger', msg: 'Error updating account: ' + x });
      });
    };
    $scope.linkUser = function () {
      $scope.loginAlerts = [];
      var newUsername = $scope.account.newUsername;
      $scope.account.newUsername = '';
      adminResource.linkUser($scope.account._id, { newUsername: newUsername }).then(function (result) {
        $scope.loginForm.$setPristine();
        if (result.success) {
          deserializeAccount(result.account);
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
        adminResource.unlinkUser($scope.account._id).then(function (result) {
          if (result.success) {
            deserializeAccount(result.account);
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
    $scope.deleteAccount = function(){
      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteAccount($scope.account._id).then(function(result){
          if(result.success){
            // redirect to admin users index page
            $location.path('/admin/accounts');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting account: ' + x });
        });
      }
    };
    $scope.changeStatus = function(){
      $scope.statusAlerts = [];
      if($scope.selectedStatus && $scope.selectedStatus._id){
        if($scope.selectedStatus._id === $scope.account.status.id){
          // status selected is the current status
          $scope.statusAlerts.push({ type: 'danger', msg: 'That is the current status.'});
        }else{
          // update status
          var data = {
            id: $scope.selectedStatus._id,
            name: $scope.selectedStatus.name
          };
          adminResource.newAccountStatus($scope.account._id, data).then(function(result){
            if(result.success){
              deserializeAccount(result.account);
            }else{
              //error due to server side validation
              angular.forEach(result.errors, function(err, index){
                $scope.statusAlerts.push({ type: 'danger', msg: err});
              });
            }
          }, function(x){
            $scope.statusAlerts.push({ type: 'danger', msg: 'Error adding new status: ' + x});
          });
        }
      }else{ //no status is selected
        $scope.statusAlerts.push({ type: 'danger', msg: 'Please choose a status.'});
      }
    };
    $scope.addNote = function(){
      $scope.noteAlerts = [];
      if($scope.newNote){
        var data = { data: $scope.newNote };
        $scope.newNote = undefined;  //reset $scope.newNote
        adminResource.newAccountNote($scope.account._id, data).then(function(result){
          if(result.success){
            deserializeAccount(result.account);
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.noteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.noteAlerts.push({ type: 'danger', msg: 'Error adding new note: ' + x});
        });
      }else{
        // new note is empty
        $scope.noteAlerts.push({ type: 'danger', msg: 'Please enter some notes.' });
      }
    };
    //initialize
    deserializeData(data);
  }
]);