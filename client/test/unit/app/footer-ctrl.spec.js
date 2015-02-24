angular.module('mock.footer.services.security', [])
  .factory('security', function(){
    var service = {};
    service.isAuthenticated = function(){ return true; };
    service.logout = function(redirect){ };
    return service;
  });
describe('FooterCtrl', function(){
  var scope, security;

  // include module contains FooterCtrl
  beforeEach(module('base'));

  // include mocked security service for this test
  beforeEach(module('mock.footer.services.security'));

  // instantiate controller to be tested
  beforeEach(inject(function($rootScope, $controller, _security_) {
    scope = $rootScope.$new();
    security = _security_;

    $controller('FooterCtrl', {
      $scope: scope, security: security
    });

    scope.$digest();
  }));
  it('should use security service to determine if user is authenticated', function(){
    spyOn(security, 'isAuthenticated').and.callThrough();
    var flag = scope.isAuthenticated();
    expect(security.isAuthenticated).toHaveBeenCalled();
    expect(flag).toBe(true);
  });
  it('should use security service to logout user', function(){
    spyOn(security, 'logout');
    scope.logout();
    expect(security.logout).toHaveBeenCalled();
  });
});