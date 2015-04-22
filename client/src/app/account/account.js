angular.module('account.index', ['ngRoute', 'security.authorization']);
angular.module('account.index').config(['$routeProvider', 'securityAuthorizationProvider', function($routeProvider, securityAuthorizationProvider){
  $routeProvider
    .when('/account', {
      templateUrl: 'account/account.tpl.html',
      controller: 'AccountCtrl',
      title: 'Account Area',
      resolve: {
        authenticatedUser: securityAuthorizationProvider.requireAuthenticatedUser
      }
    });
}]);
angular.module('account.index').controller('AccountCtrl', [ '$scope',
  function($scope){
    $scope.dayOfYear = moment().format('DDD');
    $scope.dayOfMonth = moment().format('D');
    $scope.weekOfYear = moment().format('w');
    $scope.dayOfWeek = moment().format('d');
    $scope.weekYear = moment().format('gg');
    $scope.hourOfDay = moment().format('H');
  }]);
