angular.module('base',['security', 'services.utility', 'services.easyRestResource']);

angular.module('base').controller('HeaderCtrl', ['$scope', '$location', 'security',
  function ($scope, $location, security) {
    $scope.isAuthenticated = function(){
      return security.isAuthenticated();
    };
    //$scope.isAdmin = security.isAdmin;
    $scope.logout = function(){
      return security.logout();
    };
    $scope.isActive = function(viewLocation){
      return $location.path() === viewLocation;
    };
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

angular.module('base').controller('ContactCtrl', ['$scope', '$log', 'utility', 'easyRestResource',
  function($scope, $log, utility, restResource){
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
