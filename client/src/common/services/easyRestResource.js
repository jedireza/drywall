angular.module('services.easyRestResource', ['security.service']).factory('easyRestResource', ['$http', '$q', '$log', 'security', function ($http, $q, $log, security) {
  // local variable
  var baseUrl = '/api';
  var processResponse = function(res){
    return res.data;
  };
  var processError = function(e){
    var msg = [];
    if(e.status)        msg.push(e.status);
    if(e.statusText)    msg.push(e.statusText);
    if(msg.length == 0) msg.push('Unknown Server Error');
    return $q.reject(msg.join(' '));
  };
  // public api
  var resource = {};
  resource.sendMessage = function(data){
    return $http.post(baseUrl + '/sendMessage', data).then(processResponse, processError);
  };
  resource.signup = function(data){
    return $http.post(baseUrl + '/signup', data).then(processResponse, processError);
  };
  //resource.login = function(data){
  //  return $http.post(baseUrl + '/login', data).then(processResponse);
  //};
  resource.loginForgot = function(data){
    return $http.post(baseUrl + '/login/forgot', data).then(processResponse, processError);
  };
  resource.loginReset = function(id, email, data){
    var url = baseUrl + '/login/reset/' + email + '/' + id;
    return $http.put(url, data).then(processResponse, processError)
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

  resource.getAccountDetails = function(){
    return $http.get(baseUrl + '/account/settings').then(processResponse, processError);
  };
  resource.setAccountDetails = function(data){
    return $http.put(baseUrl + '/account/settings', data).then(processResponse, processError);
  };
  resource.setIdentity = function(data){
    return $http.put(baseUrl + '/account/settings/identity', data).then(processResponse, processError);
  };
  resource.setPassword = function(data){
    return $http.put(baseUrl + '/account/settings/password', data).then(processResponse, processError);
  };

  resource.resendVerification = function(email){
    return $http.post(baseUrl + '/account/verification', {email: email}).then(processResponse, processError);
  };

  resource.upsertVerification = function(){
    return $http.get(baseUrl + '/account/verification').then(processResponse, processError);
  };

  resource.verifyAccount = function(token){
    return $http.get(baseUrl + '/account/verification/' + token)
      .then(processResponse, processError)
      .then(function(data){
        //this saves us another round trip to backend to retrieve the latest currentUser obj
        if(data.success && data.user){
          security.setCurrentUser(data.user);
        }
        return data;
      });
  };
  return resource;
}]);
