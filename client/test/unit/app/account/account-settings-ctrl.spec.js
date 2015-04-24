angular.module('mock.account.services.security', [])
  .factory('security', function($q){
    var service = {};
    service.socialDisconnect = function(provider){
      return $q.when({ success: true });
    };
    return service;
  });
angular.module('mock.account.services.accountResource', [])
  .factory('accountResource', function($q){
    var service = {};
    service.setAccountDetails = function(){ return $q.when({success: true}); };
    service.setIdentity = function(){ return $q.when({success: true}); };
    service.setPassword = function(){ return $q.when({success: true}); };
    service.resendVerification = function(){ return $q.when({ success: true }); };
    return service;
  });
angular.module('mock.config', [])
  .constant('SOCIAL', {
    'facebook': {
      text: 'Facebook',
      icon: 'fa-facebook-square',
      login: '/login/facebook',
      connect: '/account/settings/facebook/'
    },
    'google': {
      text: 'Google',
      icon: 'fa-google-plus-square',
      login: '/login/google',
      connect: '/account/settings/google/'
    }
  });
describe('AccountSettingsCtrl', function(){
  var scope, security, accountResource, $location, $log, $q, SOCIAL, accountDetails, detailForm, identityForm, passwordForm;

  // include module contains AccountSettingsCtrl
  beforeEach(module('account'));

  // include mocked services for this test
  beforeEach(module('mock.config'));
  beforeEach(module('mock.account.services.security'));
  beforeEach(module('mock.account.services.accountResource'));

  // prepare common controller dependencies
  beforeEach(inject(function($compile, _$location_, _$q_, _$log_, $rootScope, $controller, _security_, _accountResource_, _SOCIAL_) {
    scope = $rootScope.$new();
    security = _security_;
    accountResource = _accountResource_;
    $location = _$location_;
    $log = _$log_;
    SOCIAL = _SOCIAL_;
    $q = _$q_;
    accountDetails = {
      account: {
        _id: 'account_id',
        name: { first: 'John', last: 'Doe', middle: 'n', full: 'John n Doe' },
        company: 'John Doe & Company',
        phone: '123-4567890',
        zip: '12345'
      },
      user: {
        _id: 'user_id',
        email: 'jdoe@gmail.com',
        username: 'jdoe',
        facebook: { id: 'facebookid'},
        google: { id: 'googleid' }
      }
    };
  }));
  describe('when no search parameters present', function(){
    // instantiate controller to be tested
    beforeEach(inject(function($controller, $compile){
      $controller('AccountSettingsCtrl', {
        $scope: scope, $location: $location, $log: $log, security: security, accountResource: accountResource, SOCIAL: SOCIAL, accountDetails: accountDetails
      });

      var element = angular.element( '<form name="detailForm"><input name="first" ng-model="first"><input name="last" ng-model="last"></form>'
        + '<form name="identityForm"><input name="username" ng-model="username"><input name="email" ng-model="email"></form>'
        + '<form name="passwordForm"><input name="confirm" ng-model="confirm"><input name="password" ng-model="password"></form>'
      );
      $compile(element)(scope);

      //prep scope properties
      detailForm = scope.detailForm;
      identityForm = scope.identityForm;
      passwordForm = scope.passwordForm;

      scope.$digest();
    }));
    it('should have resolved accountDetails', function () {
      var account = accountDetails.account;
      var user = accountDetails.user;
      expect(scope.userDetail).toEqual({
        first:    account.name.first,
        middle:   account.name.middle,
        last:     account.name.last,
        company:  account.company,
        phone:    account.phone,
        zip:      account.zip
      });
      expect(scope.user).toEqual({
        username: user.username,
        email:    user.email
      });
    });

    it('should correctly determine social provided connection state', function(){
      expect(scope.social.google.connected).toBe(true);
      expect(scope.social.facebook.connected).toBe(true);
    });

    describe('detailForm', function(){
      it('should use accountResource to set account details', function(){
        spyOn(accountResource, 'setAccountDetails').and.callThrough();
        scope.submit(detailForm);
        expect(accountResource.setAccountDetails).toHaveBeenCalled();
      });
      it('should remove existing alerts after form submission', function(){
        scope.alerts.detail.push('some alert');
        expect(scope.alerts.detail.length).toBe(1);
        scope.submit(detailForm);
        expect(scope.alerts.detail.length).toBe(0);
      });
      it('should display success message when request completed successfully', function(){
        expect(scope.alerts.detail.length).toBe(0);
        scope.submit(detailForm);
        scope.$digest();
        expect(scope.alerts.detail.length).toBeGreaterThan(0);
        expect(scope.alerts.detail[0]).toEqual({
          type: 'success',
          msg: 'Account detail is updated.'
        });
      });
      it('should display error message when request completed with error', function(){
        var errorMessage = 'error updating account detail';
        spyOn(accountResource, 'setAccountDetails').and.callFake(function(){
          return $q.when({
            success: false,
            errors: [errorMessage]
          });
        });
        expect(scope.alerts.detail.length).toBe(0);
        scope.submit(detailForm);
        scope.$digest();
        expect(scope.alerts.detail.length).toBeGreaterThan(0);
        expect(scope.alerts.detail[0]).toEqual({
          type: 'danger',
          msg: errorMessage
        });
      });
      it('should display error message when request failed', function(){
        var errorMessage = 'unknown reason';
        spyOn(accountResource, 'setAccountDetails').and.callFake(function(){
          return $q.reject(errorMessage);
        });
        expect(scope.alerts.detail.length).toBe(0);
        scope.submit(detailForm);
        scope.$digest();
        expect(scope.alerts.detail.length).toBeGreaterThan(0);
        expect(scope.alerts.detail[0]).toEqual({
          type: 'danger',
          msg: 'Error updating account details: ' + errorMessage
        });
      });
    });

    describe('identityForm', function(){
      it('should use accountResource to set identity', function(){
        spyOn(accountResource, 'setIdentity').and.callThrough();
        scope.submit(identityForm);
        expect(accountResource.setIdentity).toHaveBeenCalled();
      });
      it('should remove existing alerts after form submission', function(){
        scope.alerts.identity.push('some alert');
        expect(scope.alerts.identity.length).toBe(1);
        scope.submit(identityForm);
        expect(scope.alerts.identity.length).toBe(0);
      });
      it('should display success message when request completed successfully', function(){
        expect(scope.alerts.identity.length).toBe(0);
        scope.submit(identityForm);
        scope.$digest();
        expect(scope.alerts.identity.length).toBeGreaterThan(0);
        expect(scope.alerts.identity[0]).toEqual({
          type: 'success',
          msg: 'User identity is updated.'
        });
      });
      it('should display error message when request completed with error', function(){
        var errorMessage = 'error updating user identity';
        spyOn(accountResource, 'setIdentity').and.callFake(function(){
          return $q.when({
            success: false,
            errors: [errorMessage],
            errfor: {
              username: 'username already taken'
            }
          });
        });
        expect(scope.alerts.identity.length).toBe(0);
        expect(identityForm.username.$valid).toBe(true);
        scope.submit(identityForm);
        scope.$digest();
        expect(scope.alerts.identity.length).toBeGreaterThan(0);
        expect(scope.alerts.identity[0]).toEqual({
          type: 'danger',
          msg: errorMessage
        });
        expect(identityForm.username.$valid).toBe(false);
      });
      it('should display error message when request failed', function(){
        var errorMessage = 'unknown reason';
        spyOn(accountResource, 'setIdentity').and.callFake(function(){
          return $q.reject(errorMessage);
        });
        expect(scope.alerts.identity.length).toBe(0);
        scope.submit(identityForm);
        scope.$digest();
        expect(scope.alerts.identity.length).toBeGreaterThan(0);
        expect(scope.alerts.identity[0]).toEqual({
          type: 'danger',
          msg: 'Error updating user identity: ' + errorMessage
        });
      });
    });

    describe('passwordForm', function(){
      it('should use accountResource to set identity', function(){
        spyOn(accountResource, 'setPassword').and.callThrough();
        scope.submit(passwordForm);
        expect(accountResource.setPassword).toHaveBeenCalled();
      });
      it('should remove existing alerts after form submission', function(){
        scope.alerts.pass.push('some alert');
        expect(scope.alerts.pass.length).toBe(1);
        scope.submit(passwordForm);
        expect(scope.alerts.pass.length).toBe(0);
      });
      it('should display success message when request completed successfully', function(){
        expect(scope.alerts.pass.length).toBe(0);
        scope.submit(passwordForm);
        scope.$digest();
        expect(scope.alerts.pass.length).toBeGreaterThan(0);
        expect(scope.alerts.pass[0]).toEqual({
          type: 'success',
          msg: 'Password is updated.'
        });
      });
      it('should display error message when request completed with error', function(){
        var errorMessage = 'error updating password';
        spyOn(accountResource, 'setPassword').and.callFake(function(){
          return $q.when({
            success: false,
            errors: [errorMessage]
          });
        });
        expect(scope.alerts.pass.length).toBe(0);
        scope.submit(passwordForm);
        scope.$digest();
        expect(scope.alerts.pass.length).toBeGreaterThan(0);
        expect(scope.alerts.pass[0]).toEqual({
          type: 'danger',
          msg: errorMessage
        });
      });
      it('should display error message when request failed', function(){
        var errorMessage = 'unknown reason';
        spyOn(accountResource, 'setPassword').and.callFake(function(){
          return $q.reject(errorMessage);
        });
        expect(scope.alerts.pass.length).toBe(0);
        scope.submit(passwordForm);
        scope.$digest();
        expect(scope.alerts.pass.length).toBeGreaterThan(0);
        expect(scope.alerts.pass[0]).toEqual({
          type: 'danger',
          msg: 'Error updating password: ' + errorMessage
        });
      });
    });

    describe('disconnect social provider', function(){
      it('should use security service', function(){
        spyOn(security, 'socialDisconnect').and.callThrough();
        scope.disconnect('google');
        expect(security.socialDisconnect).toHaveBeenCalled();
      });
      it('should remove existing alerts after clicking disconnect button', function(){
        scope.socialAlerts.push('some alert');
        expect(scope.socialAlerts.length).toBe(1);
        scope.disconnect('facebook');
        expect(scope.socialAlerts.length).toBe(0);
      });
      it('should display success message and update scope variable when request completed successfully', function(){
        expect(scope.socialAlerts.length).toBe(0);
        expect(scope.social.facebook.connected).toBe(true);
        scope.disconnect('facebook');
        scope.$digest();
        expect(scope.socialAlerts.length).toBeGreaterThan(0);
        expect(scope.socialAlerts[0]).toEqual({
          type: 'info',
          msg: 'Successfully disconnected your facebook account.'
        });
        expect(scope.social.facebook.connected).toBe(false);
      });
      it('should display error message when request completed with error', function(){
        spyOn(security, 'socialDisconnect').and.callFake(function(){
          return $q.when({ success: false });
        });
        expect(scope.socialAlerts.length).toBe(0);
        scope.disconnect('facebook');
        scope.$digest();
        expect(scope.socialAlerts.length).toBeGreaterThan(0);
        expect(scope.socialAlerts[0]).toEqual({
          type: 'warning',
          msg: 'Error occurred when disconnecting your facebook account. Please try again later.'
        });
      });
      it('should display error message when request failed', function(){
        spyOn(security, 'socialDisconnect').and.callFake(function(){
          return $q.reject();
        });
        expect(scope.socialAlerts.length).toBe(0);
        scope.disconnect('facebook');
        scope.$digest();
        expect(scope.socialAlerts.length).toBeGreaterThan(0);
        expect(scope.socialAlerts[0]).toEqual({
          type: 'warning',
          msg: 'Error occurred when disconnecting your facebook account. Please try again later.'
        });
      });
    });
  });

  describe('when search parameters present', function(){
    var $controller, $compile;
    beforeEach(inject(function(_$controller_, _$compile_){
      $controller = _$controller_;
      $compile = _$compile_;
    }));
    it('should be able to display successfully connected to social provider message', function(){
      $location.search('success=true&provider=google');
      $controller('AccountSettingsCtrl', {
        $scope: scope, $location: $location, $log: $log, security: security, accountResource: accountResource, SOCIAL: SOCIAL, accountDetails: accountDetails
      });

      var element = angular.element( '<form name="detailForm"><input name="first" ng-model="first"><input name="last" ng-model="last"></form>'
        + '<form name="identityForm"><input name="username" ng-model="username"><input name="email" ng-model="email"></form>'
        + '<form name="passwordForm"><input name="confirm" ng-model="confirm"><input name="password" ng-model="password"></form>'
      );
      $compile(element)(scope);
      scope.$digest();

      expect(scope.socialAlerts.length).toBeGreaterThan(0);
      expect(scope.socialAlerts[0]).toEqual({
        type: 'info',
        msg: 'Successfully connected your google account.'
      });
    });

    it('should be able to display warning connecting to social provider message', function(){
      $location.search('success=false&provider=google&reason=unknown');
      $controller('AccountSettingsCtrl', {
        $scope: scope, $location: $location, $log: $log, security: security, accountResource: accountResource, SOCIAL: SOCIAL, accountDetails: accountDetails
      });

      var element = angular.element( '<form name="detailForm"><input name="first" ng-model="first"><input name="last" ng-model="last"></form>'
        + '<form name="identityForm"><input name="username" ng-model="username"><input name="email" ng-model="email"></form>'
        + '<form name="passwordForm"><input name="confirm" ng-model="confirm"><input name="password" ng-model="password"></form>'
      );
      $compile(element)(scope);
      scope.$digest();

      expect(scope.socialAlerts.length).toBeGreaterThan(0);
      expect(scope.socialAlerts[0]).toEqual({
        type: 'warning',
        msg: 'Unable to connect your google account. unknown'
      });
    });
  });
});