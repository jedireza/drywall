angular.module('services.easyRestResource', []).factory('easyRestResource', ['$http', '$q', function ($http, $q) {
  var baseUrl = '/api';
  var resource = {};
  resource.sendMessage = function(data){
    return $http.post(baseUrl + '/sendMessage', data)
      .then(function(res){
        return res.data;
      });
  };
  resource.signup = function(data){
    return $http.post(baseUrl + '/signup', data)
      .then(function(res){
        return res.data;
      });
  };
  resource.login = function(data){
    return $http.post(baseUrl + '/login', data)
      .then(function(res){
        return res.data;
      });
  };
  resource.loginForgot = function(data){
    return $http.post(baseUrl + '/login/forgot', data)
      .then(function(res){
        return res.data;
      });
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
