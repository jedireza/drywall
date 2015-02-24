angular.module('mock.signup.services.security', [])
  .factory('security', function($q){
    var service = {};
    service.signup = function(user){
      return $q.when({ success: true });
    };
    return service;
  });
describe('SignupCtrl', function(){
  var scope, security, $location, $log, $q, SOCIAL, form, user;

  // include module contains SignupCtrl
  beforeEach(module('signup'));

  // include mocked security service for this test
  beforeEach(module('mock.signup.services.security'));

  // instantiate controller to be tested
  beforeEach(inject(function($compile, _$location_, _$q_, _$log_, $rootScope, $controller, _security_, _SOCIAL_) {
    scope = $rootScope.$new();
    security = _security_;
    $location = _$location_;
    $log = _$log_;
    SOCIAL = _SOCIAL_;
    $q = _$q_;

    $controller('SignupCtrl', {
      $scope: scope, $location: $location, $log: $log, security: security, SOCIAL: SOCIAL
    });

    var element = angular.element(
      '<form name="signupForm"><input name="email" ng-model="model.testValue"></form>'
    );
    $compile(element)(scope);

    //prep scope properties
    form = scope.signupForm;
    user = scope.user = {
      username: 'jdoe',
      email: 'jdoe@gmail.com',
      password: 'myPassword'
    };

    scope.$digest();
  }));
  it('uses security service to signup new user', function () {
    spyOn(security, 'signup').and.callThrough();
    scope.submit();
    expect(security.signup).toHaveBeenCalled();
  });

  describe('when signup call returns successfully', function () {
    it('should redirect user to homepage after signup completed successfully', function () {
      spyOn($location, 'path').and.callThrough();
      scope.submit();
      scope.$digest();
      expect($location.path).toHaveBeenCalledWith('/');
    });
    it('should redirect user to a specific url if return url is available', function () {
      spyOn(security, 'signup').and.callFake(function (user) {
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
      var errfor = {email: 'already registered'};
      spyOn(security, 'signup').and.callFake(function (user) {
        return $q.when({
          success: false,
          errfor: errfor
        });
      });
      expect(form.email.$valid).toBe(true);
      scope.submit();
      scope.$digest();
      expect(scope.errfor).toEqual(errfor);
      expect(form.email.$valid).toBe(false);
    });
  });

  describe('when signup call returns with error', function () {
    it('should display error message', function () {
      spyOn(security, 'signup').and.callFake(function (user) {
        return $q.reject();
      });
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBeGreaterThan(0);
    });
  });
});