describe('LoginResetCtrl', function(){
  var scope, security, $location, $log, $routeParams, $q, form;

  // include module contains LoginCtrl
  beforeEach(module('login'));

  // include mocked security service for this test
  // defined in login-ctrl.spec.js
  beforeEach(module('mock.login.services.security'));

  // inject common controller dependencies
  beforeEach(inject(function(_$location_, _$q_, _$log_, _$routeParams_, $rootScope, _security_) {
    scope = $rootScope.$new();
    security = _security_;
    $location = _$location_;
    $log = _$log_;
    $q = _$q_;
    $routeParams = _$routeParams_;
  }));

  describe('when invalid reset url', function(){
    // instantiate controller to be tested
    beforeEach(inject(function($compile, $controller){
      $controller('LoginResetCtrl', {
        $scope: scope, $location: $location, $log: $log, $routeParams: $routeParams, security: security
      });

      var element = angular.element(
        '<form name="resetForm"><input name="password" ng-model="password"><input name="confirm" ng-model="confirm"></form>'
      );
      $compile(element)(scope);

      //prep scope properties
      form = scope.resetForm;
      scope.user = {
        password: 'myPassword',
        confirm: 'myPassword'
      };
      scope.$digest();
    }));
    it('should display error message', function(){
      expect(scope.alerts.length).toBe(1);
      expect(scope.alerts[0]).toEqual({
        type: 'warning',
        msg: 'You do not have a valid reset request.'
      });
    });
  });

  describe('when valid reset url', function(){
    // instantiate controller to be tested
    beforeEach(inject(function($compile, $controller){
      $routeParams.email = 'jdoe@gmail.com';
      $routeParams.token = 'reset_token';

      $controller('LoginResetCtrl', {
        $scope: scope, $location: $location, $log: $log, $routeParams: $routeParams, security: security
      });

      var element = angular.element(
        '<form name="resetForm"><input name="password" ng-model="password"><input name="confirm" ng-model="confirm"></form>'
      );
      $compile(element)(scope);

      //prep scope properties
      form = scope.resetForm;
      scope.user = {
        password: 'myPassword',
        confirm: 'myPassword'
      };
      scope.$digest();
    }));
    it('should not display error message', function(){
      expect(scope.alerts.length).toBe(0);
    });
    it('uses security service to reset user', function () {
      spyOn(security, 'loginReset').and.callThrough();
      scope.submit();
      expect(security.loginReset).toHaveBeenCalled();
    });
    describe('when reset call returns', function () {
      it('should reset  resetForm and user model', function () {
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
          msg:  'Your password has been reset. Please login to confirm.'
        };
        expect(scope.alerts.length).toBe(0);
        scope.submit();
        scope.$digest();
        expect(scope.alerts.length).toBe(1);
        expect(scope.alerts[0]).toEqual(successMessage);
      });
      it('should display error message if request incurred error', function () {
        var errors = ['reset error msg'];
        spyOn(security, 'loginReset').and.callFake(function (user) {
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

    describe('when reset call fails', function () {
      it('should display error message', function () {
        spyOn(security, 'loginReset').and.callFake(function (user) {
          return $q.reject();
        });
        expect(scope.alerts.length).toBe(0);
        scope.submit();
        scope.$digest();
        expect(scope.alerts.length).toBeGreaterThan(0);
        expect(scope.alerts[0]).toEqual({
          type: 'danger',
          msg: 'Error resetting your password, Please try again'
        });
      });
    });
  });

});