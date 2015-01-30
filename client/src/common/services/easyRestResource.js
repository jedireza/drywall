angular.module('services.easyRestResource', []).factory('easyRestResource', ['$http', '$q', function ($http, $q) {
  // local variable
  var baseUrl = '/api';
  var processResponse = function(res){
    return res.data;
  };
  // public api
  var resource = {};
  resource.sendMessage = function(data){
    return $http.post(baseUrl + '/sendMessage', data).then(processResponse);
  };
  resource.signup = function(data){
    return $http.post(baseUrl + '/signup', data).then(processResponse);
  };
  resource.login = function(data){
    return $http.post(baseUrl + '/login', data).then(processResponse);
  };
  resource.loginForgot = function(data){
    return $http.post(baseUrl + '/login/forgot', data).then(processResponse);
  };
  resource.loginReset = function(id, email, data){
    var url = baseUrl + '/login/reset/' + email + '/' + id;
    return $http.put(url, data).then(processResponse)
  };
  //resource.socialSignup = function(provider){
  //  var url = baseUrl + '/signup';
  //  switch(provider){
  //    case 'Google':
  //      return $http.get(url + '/google');
  //    default:
  //  }
  //  return $q.reject();
  //};
  return resource;
}]);
