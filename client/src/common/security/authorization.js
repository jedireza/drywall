angular.module('security.authorization', ['security.service', 'config'])

// This service provides guard methods to support AngularJS routes.
// You can add them as resolves to routes to require authorization levels
// before allowing a route change to complete
.provider('securityAuthorization', {

  requireAdminUser: ['securityAuthorization', function(securityAuthorization) {
    return securityAuthorization.requireAdminUser();
  }],

  requireAuthenticatedUser: ['securityAuthorization', function(securityAuthorization) {
    return securityAuthorization.requireAuthenticatedUser();
  }],

  requireUnauthenticatedUser: ['securityAuthorization', function(securityAuthorization) {
    return securityAuthorization.requireUnauthenticatedUser();
  }],

  requireVerifiedUser: [ 'securityAuthorization', function(securityAuthorization){
    return securityAuthorization.requireVerifiedUser();
  }],

  requireUnverifiedUser: [ 'securityAuthorization', function(securityAuthorization){
    return securityAuthorization.requireUnverifiedUser();
  }],

  $get: ['$log', '$q', '$location', 'security', 'securityRetryQueue', 'REQUIRE_ACCOUNT_VERIFICATION', function($log, $q, $location, security, queue, requireAccountVerification) {
    var service = {

      // Require that there is an authenticated user
      // (use this in a route resolve to prevent non-authenticated users from entering that route)
      requireAuthenticatedUser: function() {
        var promise = security.requestCurrentUser().then(function(userInfo) {
          if ( !security.isAuthenticated() ) {
            return queue.pushRetryFn('unauthenticated-client', service.requireAuthenticatedUser);
          }
        });
        return promise;
      },

      requireUnauthenticatedUser: function(){
        var promise = security.requestCurrentUser().then(function(userInfo){
          if( security.isAuthenticated() ){
            return $q.reject('authenticated-client');
          }
        });
        return promise;
      },

      // Require that there is an administrator logged in
      // (use this in a route resolve to prevent non-administrators from entering that route)
      requireAdminUser: function() {
        var promise = security.requestCurrentUser().then(function(userInfo) {
          if ( !security.isAuthenticated() ) {
            return queue.pushRetryFn('unauthenticated-client', service.requireAdminUser);
          }else if( !security.isAdmin() ){
            return $q.reject('unauthorized-client');
          }
        });
        return promise;
      },

      requireVerifiedUser: function(){
        var promise = security.requestCurrentUser().then(function(userInfo){
          if( !security.isAuthenticated() ){
            return queue.pushRetryFn('unauthenticated-client', service.requireVerifiedUser);
          }
          if(requireAccountVerification && userInfo && !userInfo.isVerified){
            return $q.reject('unverified-client');
          }
        });
        return promise;
      },

      requireUnverifiedUser: function(){
        var promise = security.requestCurrentUser().then(function(userInfo){
          if( !security.isAuthenticated() ){
            return queue.pushRetryFn('unauthenticated-client', service.requireUnverifiedUser);
          }
          if(requireAccountVerification && userInfo && userInfo.isVerified){
            return $q.reject('verified-client');
          }
        });
        return promise;
      }

    };

    return service;
  }]
});