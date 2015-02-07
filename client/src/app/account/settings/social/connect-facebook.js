angular.module('account.settings.social.facebook', ['security']);
angular.module('account.settings.social.facebook').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/account/settings/facebook/callback', {
      resolve: {
        connect: ['$log', '$q', '$location', '$route', 'security', function($log, $q, $location, $route, security){
          var code = $route.current.params.code || '';
          var search = {};
          var promise = security.socialConnect('facebook', code)
            .then(function(data){
              if(data.success){
                search.success = 'true';
              }else{
                search.success = 'false';
                search.reason = data.errors[0];
              }
              return $q.reject();
            })
            .catch(function(){
              search.provider = 'facebook';
              search.success = search.success || 'false';
              $location.search({}); //remove search param "code" added by facebook
              $location.search(search);
              $location.path('/account/settings');
              return $q.reject();
            });
          return promise;
        }]
      },
      reloadOnSearch: false
    });
}]);