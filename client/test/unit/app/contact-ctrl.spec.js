angular.module('mock.services.accountResource', [])
  .factory('accountResource', function($q){
    var service = {};
    service.sendMessage = function(data){
      return $q.when({ success: true }); //return a promise that's immediately resolved
    };
    return service;
  });
describe('ContactCtrl', function(){
  var scope, restResource, form, msg, $q;

  // include module contains ContactCtrl
  beforeEach(module('base'));

  // include mocked easyRestService for this test
  beforeEach(module('mock.services.accountResource'));

  // instantiate controller to be tested
  beforeEach(inject(function(_$q_, $compile, $rootScope, $log, $controller, _accountResource_) {
    $q = _$q_;
    scope = $rootScope.$new();
    restResource = _accountResource_;

    $controller('ContactCtrl', {
      $scope: scope, restResource: restResource, $log: $log
    });
    var element = angular.element(
      '<form name="msgForm"><input name="testInput" ng-model="model.testValue"></form>'
    );
    $compile(element)(scope);

    //prep scope properties
    form = scope.msgForm;
    msg = scope.msg = {
      name: 'John Doe',
      email: 'jdoe@gmail.com',
      message: 'message content'
    };
    scope.alerts = [];
    scope.$digest();
  }));
  describe('should be able to send message', function(){
    it('by calling accountResource', function(){
      spyOn(restResource, 'sendMessage').and.callThrough();
      scope.submit();
      expect(restResource.sendMessage).toHaveBeenCalled();
    });
    it('resets alerts after clicking Send Message button', function(){
      scope.alerts.push({});
      expect(scope.alerts.length).toBeGreaterThan(0);
      scope.submit();
      expect(scope.alerts.length).toBe(0);
    });
    it('resets message form and msg model regardless call is successful or not', function(){
      expect(scope.msg).toEqual(msg);
      scope.submit();
      scope.$digest();
      expect(scope.msg).toEqual({});
      expect(form.$pristine).toBe(true);
    });
    it('displays success alert message when call completed successfully', function(){
      var successAlert = { type: 'success', msg: 'We have received your message. Thank you.' };
      expect(scope.alerts.length).toBe(0);
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBe(1);
      expect(scope.alerts[0]).toEqual(successAlert);
    });
    it('displays error alert message when call completed with error', function(){
      var errorAlert = { type: 'warning', msg: 'Error submitting your message. Please try again.' };
      expect(scope.alerts.length).toBe(0);
      spyOn(restResource, 'sendMessage').and.callFake(function(){
        return $q.when({ success: false });
      });
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBe(1);
      expect(scope.alerts[0]).toEqual(errorAlert);
    });
    it('displays error alert message when call failed', function(){
      var errorAlert = { type: 'warning', msg: 'Error submitting your message. Please try again.' };
      expect(scope.alerts.length).toBe(0);
      spyOn(restResource, 'sendMessage').and.callFake(function(){
        return $q.reject();
      });
      scope.submit();
      scope.$digest();
      expect(scope.alerts.length).toBe(1);
      expect(scope.alerts[0]).toEqual(errorAlert);
    });
  });
});