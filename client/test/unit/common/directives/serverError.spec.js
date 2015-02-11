describe('directives.serverError', function () {
  var element, scope, password;
  beforeEach(module('directives.serverError'));
  beforeEach(inject(function($compile, $rootScope) {
    scope = $rootScope;
    var form =
      '<form name="testForm">' +
      '<input type="password" name="password" ng-model="password" server-error>' +
      '</form>';
    form = angular.element(form);  //form now is a jQuery element
    $compile(form)(scope);
    element = form.find('input');  //input jQuery element
    password = scope.testForm.password;
    scope.$digest();
  }));

  it('should be valid when initiated', function() {
    expect(password).toBeDefined();
    expect(password.$pristine).toBe(true);
    expect(password.$valid).toBe(true);
  });

  describe('input with server-error class', function(){
    afterEach(function(){
      password.$setValidity('server', true);
      password.$setPristine();
    });

    it('is invalid if $error.server occurs', function(){
      password.$setValidity('server', false);
      expect(password.$valid).toBe(false);
      expect(password.$error.server).toBe(true);
    });

    it('should be valid upon user input (change event)', function(){
      password.$setValidity('server', false);
      element.change();
      expect(password.$pristine).toBe(false);
      expect(password.$valid).toBe(true);
      expect(password.$error.server).toBeFalsy();
    });
  });
});