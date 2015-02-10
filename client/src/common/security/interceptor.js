angular.module('security.interceptor', ['security.retryQueue'])

// This http interceptor listens for authentication failures
.factory('securityInterceptor', ['$q', '$log', '$injector', 'securityRetryQueue', function($q, $log, $injector, queue) {
  return {
    'responseError': function(response){
      if(response.status === 401){
        // The request bounced because it was not authorized - add a new request to the retry queue
        // and return a new promise that will be resolved or rejected after calling retryItem's retry or cancel method
        // eg. retryRequest is the retryFn that will be called later
        return queue.pushRetryFn('unauthorized-server', function retryRequest(){
          return $injector.get('$http')(response.config);
        });
      }
      //if not 401 then forward the error to next error handler
      return $q.reject(response);
    }
  };
  //return function(promise) {
  //  // Intercept failed requests
  //  return promise.then(null, function(originalResponse) {
  //    if(originalResponse.status === 401) {
  //      // The request bounced because it was not authorized - add a new request to the retry queue
  //      promise = queue.pushRetryFn('unauthorized-server', function retryRequest() {
  //        // We must use $injector to get the $http service to prevent circular dependency
  //        return $injector.get('$http')(originalResponse.config);
  //      });
  //    }
  //    return promise;
  //  });
  //};
}])

// We have to add the interceptor to the queue as a string because the interceptor depends upon service instances that are not available in the config block.
.config(['$httpProvider', function($httpProvider) {
  //$httpProvider.responseInterceptors.push('securityInterceptor');
  $httpProvider.interceptors.push('securityInterceptor');
}]);