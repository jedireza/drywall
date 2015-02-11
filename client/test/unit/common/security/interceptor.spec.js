describe('securityInterceptor', function() {

  var queue, interceptor, scope;

  beforeEach(module('security.interceptor'));

  beforeEach(inject(function($injector, $rootScope) {
    scope = $rootScope.$new();
    queue = $injector.get('securityRetryQueue');
    interceptor = $injector.get('securityInterceptor');
  }));

  it('should be defined', function() {
    expect(interceptor).toBeDefined();
  });

  it('should have a handler for responseError', function () {
    expect(angular.isFunction(interceptor.responseError)).toBe(true);
  });

  describe('when HTTP 401', function () {
    var rejection;
    beforeEach(function () {
      rejection = { status: 401 };
    });

    it('should intercept error responses and adds it to the retry queue', function() {
      interceptor.responseError(rejection);
      expect(queue.hasMore()).toBe(true);
      expect(queue.retryReason()).toBe('unauthorized-server');
    });
  });

  describe('when not HTTP 401', function () {
    var rejection;
    beforeEach(function () {
      rejection = { status: 400 };
    });

    it('should not intercept error responses', function() {
      var result;
      interceptor.responseError(rejection).catch(function(reason){
        result = reason;
      });
      expect(result).toBeUndefined();
      scope.$root.$digest();
      expect(result).toBe(rejection);
      expect(queue.hasMore()).toBe(false);
    });
  });
});
