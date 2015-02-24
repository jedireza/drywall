angular.module('mock.header.services.security', [])
  .factory('security', function(){
    var service = {};
    service.isAuthenticated = function(){ return true; };
    service.logout = function(redirect){ };
    return service;
  });
describe('HeaderCtrl', function(){
  var scope, security, $location;

  // include module contains HeaderCtrl
  beforeEach(module('base'));

  // include mocked security service for this test
  beforeEach(module('mock.header.services.security'));

  // instantiate controller to be tested
  beforeEach(inject(function(_$location_, $rootScope, $controller, _security_) {
    scope = $rootScope.$new();
    security = _security_;
    $location = _$location_;

    $controller('HeaderCtrl', {
      $scope: scope, $location: $location, security: security
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
  it('should answer whether a route is active', function(){
    $location.path('/active');
    expect(scope.isActive('/active')).toBe(true);
    expect(scope.isActive('/active/with/child')).toBe(false);
    expect(scope.isActive('/inactive')).toBe(false);
  });
});