angular.module('mock.login.services.security', [])
  .factory('security', function($q){
    var service = {};
    service.login = function(username, password){
      return $q.when({ success: true });
    };
    service.loginForgot = function(user){
      return $q.when({ success: true });
    };
    service.loginReset = function(id, email, user){
      return $q.when({ success: true });
    };
    return service;
  });
describe('LoginCtrl', function(){
  var scope, security, $location, $log, $q, SOCIAL, form, user;

  // include module contains LoginCtrl
  beforeEach(module('login'));

  // include mocked security service for this test
  beforeEach(module('mock.login.services.security'));

  // instantiate controller to be tested
  beforeEach(inject(function($compile, _$location_, _$q_, _$log_, $rootScope, $controller, _security_, _SOCIAL_) {
    scope = $rootScope.$new();
    security = _security_;
    $location = _$location_;
    $log = _$log_;
    SOCIAL = _SOCIAL_;
    $q = _$q_;

    $controller('LoginCtrl', {
      $scope: scope, $location: $location, $log: $log, security: security, SOCIAL: SOCIAL
    });

    var element = angular.element(
      '<form name="loginForm"><input name="username" ng-model="username"><input name="password" ng-model="password"></form>'
    );
    $compile(element)(scope);

    //prep scope properties
    form = scope.loginForm;
    user = scope.user = {
      username: 'jdoe@gmail.com',
      password: 'myPassword'
    };

    scope.$digest();
  }));
  it('uses security service to login new user', function () {
    spyOn(security, 'login').and.callThrough();
    scope.submit();
    expect(security.login).toHaveBeenCalled();
  });

  describe('when login call returns successfully', function () {
    it('should redirect user to homepage if return url is not specified', function () {
      spyOn($location, 'path').and.callThrough();
      scope.submit();
      scope.$digest();
      expect($location.path).toHaveBeenCalledWith('/');
    });
    it('should redirect user to a specific url if return url is available', function () {
      spyOn(security, 'login').and.callFake(function (username, password) {
        return $q.when({
          success: true,
          defaultReturnUrl: '/someUrl'
        });
      });
      spyOn($location, 'path').and.callThrough();
      scope.submit();
      scope.$digest();
      expect($location.path).toHaveBeenCalledWith('/someUrl');
    });
    it('should display server side validation message if available', function () {
      var errfor = { username: 'already registered' };
      var errors = ['login error msg'];
      spyOn(security, 'login').and.callFake(function (username, password) {
        return $q.when({
          success: false,
          errfor: errfor,
          errors: errors
        });
      });
      expect(form.username.$valid).toBe(true);
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.errfor).toEqual(errfor);
      expect(form.username.$valid).toBe(false);
      expect(scope.alerts.length).toBeGreaterThan(0);
    });
  });

  describe('when login call returns with error', function () {
    it('should display error message', function () {
      spyOn(security, 'login').and.callFake(function (username, password) {
        return $q.reject();
      });
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBeGreaterThan(0);
    });
  });
});