angular.module('services.utility', []).factory('utility', [function () {

  var utility = {};
  utility.hasError = function(ngModelCtrl){
    return ngModelCtrl.$dirty && ngModelCtrl.$invalid;
  };
  utility.showError = function(ngModelCtrl, err){
    return ngModelCtrl.$dirty && ngModelCtrl.$error[err];
  };
  utility.canSave = function(ngFormCtrl){
    return ngFormCtrl.$dirty && ngFormCtrl.$valid;
  };
  return utility;
}]);