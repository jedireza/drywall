angular.module('login.social.google', ['security.service']);
angular.module('login.social.google').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/login/google/callback', {
      resolve: {
        verify: ['$log', '$q', '$location', '$route', 'security', function($log, $q, $location, $route, security){
          var redirectUrl;
          var code = $route.current.params.code || '';
          var promise = security.socialLogin('google', code)
            .then(function(data){
              if(data.success) {
                // redirectUrl = data.defaultReturnUrl || '/account'
                redirectUrl = '/account';
              }
              return $q.reject();
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/login';
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise;
        }]
      }
    })
  ;
}]);
