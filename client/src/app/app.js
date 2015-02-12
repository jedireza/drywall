angular.module('app', [
  'ngRoute',
  'base',
  //'projectsinfo',
  //'dashboard',
  //'projects',
  //'admin',
  'signup',
  'login',
  'account',
  'config',
  'services.i18nNotifications',
  'services.httpRequestTracker',
  'services.easyRestResource',
  'security',
  'templates.app',
  'templates.common',
  'ui.bootstrap'
]);


// Node.js Express backend csurf module csrf/xsrf token cookie name
angular.module('app').config(['$httpProvider', 'XSRF_COOKIE_NAME', function($httpProvider, XSRF_COOKIE_NAME){
  $httpProvider.defaults.xsrfCookieName = XSRF_COOKIE_NAME;
}]);

angular.module('app').config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
  });
  $routeProvider
    .when('/', {
      templateUrl: 'main.tpl.html',
      controller: 'AppCtrl'
    })
    .when('/contact', {
      templateUrl: 'contact.tpl.html',
      controller: 'ContactCtrl'
    })
    .when('/about', {
      templateUrl: 'about.tpl.html'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

angular.module('app').run(['security', function(security) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();
}]);

angular.module('app').controller('AppCtrl', ['$scope', 'i18nNotifications', 'localizedMessages', function($scope, i18nNotifications, localizedMessages) {

  $scope.notifications = i18nNotifications;

  $scope.removeNotification = function (notification) {
    i18nNotifications.remove(notification);
  };

  $scope.$on('$routeChangeError', function(event, current, previous, rejection){
    i18nNotifications.pushForCurrentRoute('errors.route.changeError', 'error', {}, {rejection: rejection});
  });
}]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'security', 'notifications', 'httpRequestTracker',
  function ($scope, $location, $route, security, notifications, httpRequestTracker) {
  //$scope.location = $location;
  //$scope.breadcrumbs = breadcrumbs;

  $scope.isAuthenticated = security.isAuthenticated;
  //$scope.isAdmin = security.isAdmin;
  $scope.logout = function(){
    security.logout();
  };
  $scope.isActive = function(viewLocation){
    return $location.path() === viewLocation;
  };
  //$scope.home = function () {
  //  if (security.isAuthenticated()) {
  //    $location.path('/dashboard');
  //  } else {
  //    $location.path('/projectsinfo');
  //  }
  //};
  //
  //$scope.isNavbarActive = function (navBarPath) {
  //  return navBarPath === breadcrumbs.getFirst().name;
  //};
  //
  //$scope.hasPendingRequests = function () {
  //  return httpRequestTracker.hasPendingRequests();
  //};
}]);

angular.module('app').controller('FooterCtrl', ['$scope', 'security', function($scope, security){
  $scope.isAuthenticated = security.isAuthenticated;
  $scope.logout = function(){
    security.logout();
  };
}]);