angular.module('base',['ngRoute', 'security', 'services.utility', 'services.easyRestResource', 'services.adminResource', 'ui.bootstrap']);
angular.module('base').controller('HeaderCtrl', ['$scope', '$route', '$location', 'security',
  function ($scope, $route, $location, security) {
    $scope.isAuthenticated = function(){
      return security.isAuthenticated();
    };
    $scope.isAdmin = function(){
      if($location.path().indexOf('/admin') === -1){
        return false;
      }else{
        return security.isAdmin();
      }
    };
    $scope.logout = function(){
      return security.logout();
    };
    $scope.isActive = function(viewLocation){
      return $location.path() === viewLocation;
    };
  }
]);
angular.module('base').controller('AdminSearchCtrl' ,['$scope', 'adminResource',
  function($scope, adminResource){

    var clearSearchDropdown = function(){
      $scope.resultIsOpen = false;
      $scope.result = {};
    };
    var showSearchDropdown = function(data){
      $scope.result = data;
      $scope.resultIsOpen = true;
    };

    $scope.showDropdownHeader = function(header){
      var users = $scope.result.users;
      var accounts = $scope.result.accounts;
      var administrators = $scope.result.administrators;
      if(!(users && accounts && administrators)) {
        return false;
      }
      switch(header){
        case 'noDocsMatched':
          return users.length === 0 && accounts.length === 0 && administrators.length === 0;
        case 'Users':
          return users.length !== 0;
        case 'Accounts':
          return accounts.length !== 0;
        case 'Administrators':
          return administrators.length !== 0;
        default:
          return false;
      }
    };

    $scope.update = function(){
      clearSearchDropdown();
      if ($scope.query) {
        // no need to search backend if query string is empty
        adminResource.search($scope.query).then(function (data) {
          showSearchDropdown(data);
        }, function (e) {
          clearSearchDropdown();
        });
      }
    };

    $scope.resultIsOpen = false;
    $scope.query = "";
    $scope.result = {};
  }
]);
angular.module('base').controller('FooterCtrl', ['$scope', 'security',
  function($scope, security){
    $scope.isAuthenticated = function(){
      return security.isAuthenticated();
    };
    //$scope.isAdmin = security.isAdmin;
    $scope.logout = function(){
      return security.logout();
    };
  }
]);

angular.module('base').controller('ContactCtrl', ['$scope', 'utility', 'easyRestResource',
  function($scope, utility, restResource){
    // local var
    var successAlert = { type: 'success', msg: 'We have received your message. Thank you.' };
    var errorAlert = { type: 'warning', msg: 'Error submitting your message. Please try again.' };

    // model def
    $scope.msg = {};
    $scope.alerts = [];

    // method def
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.canSave = utility.canSave;
    $scope.closeAlert = function(ind){
      $scope.alerts.splice(ind, 1);
    };
    $scope.submit = function(){
      var msg = $scope.msg;
      $scope.alerts = [];
      restResource.sendMessage({
        name: msg.name,
        email: msg.email,
        message: msg.message
      }).then(function(data){
        $scope.msgForm.$setPristine();
        $scope.msg = {};
        if(data.success){
          $scope.alerts.push(successAlert);
        }else{
          //TODO: optionally do case study errfor/errors
          $scope.alerts.push(errorAlert);
        }
      }, function(x){
        $scope.msgForm.$setPristine();
        $scope.msg = {};
        $scope.alerts.push(errorAlert);
      });
    };
  }
]);
