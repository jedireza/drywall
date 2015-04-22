describe('AccountVerificationCtrl', function(){
  var scope, security, accountResource, $location, $log, $q, form;

  // include module contains AccountVerificationCtrl
  beforeEach(module('account'));

  // include mocked services for this test
  // defined in account-settings-ctrl.spec.js
  beforeEach(module('mock.account.services.security'));
  beforeEach(module('mock.account.services.accountResource'));

  // instantiate controller to be tested
  beforeEach(inject(function($compile, _$location_, _$q_, _$log_, $rootScope, $controller, _security_, _accountResource_) {
    scope = $rootScope.$new();
    security = _security_;
    security.currentUser = { email: 'jdoe@gmail.com' };
    accountResource = _accountResource_;
    $location = _$location_;
    $log = _$log_;
    $q = _$q_;
    $controller('AccountVerificationCtrl', {
      $scope: scope, $location: $location, $log: $log, security: security, accountResource: accountResource
    });

    var element = angular.element( '<form name="verificationForm"><input name="email" ng-model="email"></form>');
    $compile(element)(scope);

    //prep scope properties
    form = scope.verificationForm;

    scope.$digest();
  }));
  it('should hide email form initially', function(){
    expect(scope.formVisible).toBe(false);
  });
  it('shows email form when clicked link', function(){
    expect(scope.formVisible).toBe(false);
    scope.showForm();
    expect(scope.formVisible).toBe(true);
  });
  it('should use accountResource to resend verification email', function(){
    spyOn(accountResource, 'resendVerification').and.callThrough();
    scope.submit();
    expect(accountResource.resendVerification).toHaveBeenCalled();
  });
  it('should reset previous alerts', function(){
    scope.alerts.push('some old alert');
    expect(scope.alerts.length).toBeGreaterThan(0);
    scope.submit();
    expect(scope.alerts.length).toBe(0);
  });
  it('should display success message and hide email form when request completed successfully', function(){
    expect(scope.alerts.length).toBe(0);
    scope.submit();
    scope.$digest();
    expect(scope.alerts.length).toBeGreaterThan(0);
    expect(scope.alerts[0]).toEqual({
      type: 'success',
      msg: 'Verification email successfully re-sent.'
    });
    expect(scope.formVisible).toBe(false);
    expect(form.$pristine).toBe(true);
  });
  it('should display error message when request completed with error', function(){
    var errorMessage = 'email already registered';
    spyOn(accountResource, 'resendVerification').and.callFake(function(){
      return $q.when({
        success: false,
        errfor: {
          email: errorMessage
        }
      });
    });
    expect(form.email.$valid).toBe(true);
    scope.submit();
    scope.$digest();
    expect(form.email.$valid).toBe(false);
  });
  it('should display error message when request failed', function(){
    var errorMessage = 'unknown reason';
    spyOn(accountResource, 'resendVerification').and.callFake(function(){
      return $q.reject(errorMessage);
    });
    expect(scope.alerts.length).toBe(0);
    scope.submit();
    scope.$digest();
    expect(scope.alerts.length).toBeGreaterThan(0);
    expect(scope.alerts[0]).toEqual({
      type: 'danger',
      msg: 'Error sending verification email: ' + errorMessage
    });
  });
});