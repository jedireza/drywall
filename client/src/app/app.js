angular.module('app', [
  'ngRoute',
  //'projectsinfo',
  //'dashboard',
  //'projects',
  //'admin',
  'signup',
  'login',
  'account',
  'config',
  'services.breadcrumbs',
  'services.i18nNotifications',
  'services.httpRequestTracker',
  'services.easyRestResource',
  'security',
  'templates.app',
  'templates.common',
  'ui.bootstrap'
  //'directives.crud',
]);


// Node.js Express backend csurf module csrf/xsrf token cookie name
angular.module('app').config(['$httpProvider', function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = '_csrfToken';
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

angular.module('app').controller('ContactCtrl', ['$scope', '$log', 'easyRestResource',
  function($scope, $log, restResource){
    // local var
    var successAlert = { type: 'success', msg: 'We have received your message. Thank you.' };
    var errorAlert = { type: 'warning', msg: 'Error submitting your message. Please try again.' };

    // model def
    $scope.msg = {};
    $scope.alerts = [];

    // method def
    $scope.hasError = function(ngModelCtrl){
      return ngModelCtrl.$dirty && ngModelCtrl.$invalid;
    };
    $scope.showError = function(ngModelCtrl, err){
      return ngModelCtrl.$dirty && ngModelCtrl.$error[err];
    };
    $scope.canSave = function(ngFormCtrl){
      return ngFormCtrl.$dirty && ngFormCtrl.$valid;
    };
    $scope.closeAlert = function(ind){
      $scope.alerts.splice(ind, 1);
    };
    $scope.submit = function(){
      var msg = $scope.msg;
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
      });
    };
  }]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'security', 'breadcrumbs', 'notifications', 'httpRequestTracker',
  function ($scope, $location, $route, security, breadcrumbs, notifications, httpRequestTracker) {
  //$scope.location = $location;
  //$scope.breadcrumbs = breadcrumbs;

  $scope.isAuthenticated = security.isAuthenticated;
  //$scope.isAdmin = security.isAdmin;
  $scope.logout = function(){
    security.logout()
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
    security.logout()
  };
}]);