angular.module('services.easyRestResource', []).factory('easyRestResource', ['$http', function ($http) {
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
  return resource;
}]);
