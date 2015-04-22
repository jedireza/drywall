angular.module('app', [
  'ngRoute',
  'config',
  'base',
  'signup',
  'login',
  'account',
  'admin',
  'services.i18nNotifications',
  'services.httpRequestTracker',
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
      controller: 'ContactCtrl',
      title: 'Contact Us'
    })
    .when('/about', {
      templateUrl: 'about.tpl.html',
      title: 'About Us'
    })
    .otherwise({
      templateUrl: '404.tpl.html',
      title: 'Page Not Found'
    });
}]);

angular.module('app').run(['$location', '$rootScope', 'security', function($location, $rootScope, security) {
  // Get the current user when the application starts
  // (in case they are still logged in from a previous session)
  security.requestCurrentUser();

  // add a listener to $routeChangeSuccess
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
    $rootScope.title = current.$$route && current.$$route.title? current.$$route.title: 'Drywall is Running';
  });
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
