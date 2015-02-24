describe('LoginForgotCtrl', function(){
  var scope, security, $location, $log, $q, form;

  // include module contains LoginCtrl
  beforeEach(module('login'));

  // include mocked security service for this test
  // defined in login-ctrl.spec.js
  beforeEach(module('mock.login.services.security'));

  // instantiate controller to be tested
  beforeEach(inject(function($compile, _$location_, _$q_, _$log_, $rootScope, $controller, _security_) {
    scope = $rootScope.$new();
    security = _security_;
    $location = _$location_;
    $log = _$log_;
    $q = _$q_;

    $controller('LoginForgotCtrl', {
      $scope: scope, $location: $location, $log: $log, security: security
    });

    var element = angular.element(
      '<form name="loginForgotForm"><input name="email" ng-model="email"></form>'
    );
    $compile(element)(scope);

    //prep scope properties
    form = scope.loginForgotForm;
    scope.user = {
      email: 'jdoe@gmail.com'
    };

    scope.$digest();
  }));
  it('uses security service to login new user', function () {
    spyOn(security, 'loginForgot').and.callThrough();
    scope.submit();
    expect(security.loginForgot).toHaveBeenCalled();
  });

  describe('when login call returns', function () {
    it('should reset loginForgot Form and user model', function () {
      form.$setDirty();
      expect(form.$pristine).toBe(false);
      scope.submit();
      scope.$digest();
      expect(form.$pristine).toBe(true);
      expect(scope.user).toEqual({});
    });
    it('should display success message if request succeeded', function () {
      var successMessage = {
        type: 'info',
        msg: 'If an account matched that address, an email will be sent with instructions.'
      };
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBeGreaterThan(0);
      expect(scope.alerts[0]).toEqual(successMessage);
    });
    it('should display error message if request incurred error', function () {
      var errors = ['login reset error msg'];
      spyOn(security, 'loginForgot').and.callFake(function (user) {
        return $q.when({
          success: false,
          errors: errors
        });
      });
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBeGreaterThan(0);
      expect(scope.alerts[0]).toEqual({
        type: 'danger',
        msg: errors[0]
      });
    });
  });

  describe('when login call fails', function () {
    it('should display error message', function () {
      spyOn(security, 'loginForgot').and.callFake(function (user) {
        return $q.reject();
      });
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBeGreaterThan(0);
      expect(scope.alerts[0]).toEqual({
        type: 'danger',
        msg: 'Error resetting your account, Please try again'
      });
    });
  });
});