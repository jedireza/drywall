angular.module('services.adminResource', []).factory('adminResource', ['$http', '$q', function ($http, $q) {
  // local variable
  var baseUrl = '/api';
  var processResponse = function(res){
    return res.data;
  };
  var processError = function(e){
    var msg = [];
    if(e.status)         { msg.push(e.status); }
    if(e.statusText)     { msg.push(e.statusText); }
    if(msg.length === 0) { msg.push('Unknown Server Error'); }
    return $q.reject(msg.join(' '));
  };
  // public api
  var resource = {};
  resource.getStats = function(){
    return $http.get(baseUrl + '/admin').then(processResponse, processError);
  };
  resource.search = function(query){
    return $http.get(baseUrl + '/admin/search', { params: { q: query }} ).then(processResponse, processError);
  };
  resource.findUsers = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http.get(baseUrl + '/admin/users', { params: filters }).then(processResponse, processError);
  };
  resource.addUser = function(username){
    return $http.post(baseUrl + '/admin/users', { username: username }).then(processResponse, processResponse);
  };
  return resource;
}]);
