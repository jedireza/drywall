angular.module('account', []);
angular.module('account').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/account', {
      templateUrl: 'account/account.tpl.html',
      controller: 'AccountCtrl'
    });
}]);
angular.module('account').controller('AccountCtrl', [ '$scope',
  function($scope){
    $scope.dayOfYear = moment().format('DDD');
    $scope.dayOfMonth = moment().format('D');
    $scope.weekOfYear = moment().format('w');
    $scope.dayOfWeek = moment().format('d');
    $scope.weekYear = moment().format('gg');
    $scope.hourOfDay = moment().format('H');
  }]);
