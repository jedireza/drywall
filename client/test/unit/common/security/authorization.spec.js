describe('securityAuthorization', function() {
  var $rootScope, security, securityAuthorization, queue;
  var userResponse, resolved;

  var assertAddingItemToRetryQueue = function(fn){
    var resolved = false;
    userResponse.user = null;
    expect(queue.hasMore()).toBe(false);
    fn().then(function() {
      resolved = true;
    });
    $rootScope.$digest();
    expect(security.isAuthenticated()).toBe(false);
    expect(queue.hasMore()).toBe(true);
    expect(queue.retryReason()).toBe('unauthenticated-client');
    expect(resolved).toBe(false);
  };

  beforeEach(module('config'));
  beforeEach(function() {
    module(function($provide) {
      $provide.constant('REQUIRE_ACCOUNT_VERIFICATION', true);
    });
  });
  beforeEach(module('security.authorization', 'security/login/form.tpl.html'));
  beforeEach(inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    securityAuthorization = $injector.get('securityAuthorization');
    security = $injector.get('security');
    queue = $injector.get('securityRetryQueue');
    
    userResponse = { user: { id: '1234567890', email: 'jo@bloggs.com', firstName: 'Jo', lastName: 'Bloggs', isVerified: true } };
    resolved = false;

    spyOn(security, 'requestCurrentUser').and.callFake(function() {
      security.currentUser = security.currentUser || userResponse.user;
      var promise = $injector.get('$q').when(security.currentUser);
      // Trigger a digest to resolve the promise;
      return promise;
    });
  }));

  describe('requireAuthenticatedUser', function() {
    it('makes a GET request to current-user url', function() {
      expect(security.isAuthenticated()).toBe(false);
      securityAuthorization.requireAuthenticatedUser().then(function(data) {
        resolved = true;
        expect(security.isAuthenticated()).toBe(true);
        expect(security.currentUser).toBe(userResponse.user);
      });
      $rootScope.$digest();
      expect(resolved).toBe(true);
    });
    it('adds a new item to the retry queue if not authenticated', function(){
      assertAddingItemToRetryQueue(securityAuthorization.requireAuthenticatedUser);
    });
  });

  describe('requireAdminUser', function() {
    it('returns a resolved promise if we are already an admin', function() {
      var userInfo = {admin: true};
      security.currentUser = userInfo;
      expect(security.isAdmin()).toBe(true);
      securityAuthorization.requireAdminUser().then(function() {
        resolved = true;
      });
      $rootScope.$digest();
      expect(security.currentUser).toBe(userInfo);
      expect(resolved).toBe(true);
    });
    it('adds a new item to the retry queue if not authenticated', function(){
      assertAddingItemToRetryQueue(securityAuthorization.requireAdminUser);
    });
    it('returns a resolved promise if we are authenticated and authorized', function(){
      userResponse.user.admin = true;
      expect(security.isAuthenticated()).toBe(false);
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireAdminUser().then(function(data) {
        resolved = true;
        expect(security.isAuthenticated()).toBe(true);
        expect(security.isAdmin()).toBe(true);
        expect(security.currentUser).toBe(userResponse.user);
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(resolved).toBe(true);
    });
    it('returns a rejected promise if authenticated but not authorized', function(){
      var rejected = false;
      var reason;
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireAdminUser().catch(function(r) {
        rejected = true;
        reason = r;
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(rejected).toBe(true);
      expect(reason).toBe('unauthorized-client');
    });
  });

  describe('requireUnauthenticatedUser', function(){
    it('returns a resolved promise if not authenticated', function(){
      var resolved = false;
      userResponse.user = null;
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireUnauthenticatedUser().then(function() {
        resolved = true;
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(resolved).toBe(true);
    });
    it('returns a rejected promise if already authenticated', function(){
      var rejected = false;
      var reason;
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireUnauthenticatedUser().catch(function(r) {
        rejected = true;
        reason = r;
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(rejected).toBe(true);
      expect(reason).toBe('authenticated-client');
    });
  });

  describe('requireVerifiedUser', function(){
    it('adds a new item to the retry queue if not authenticated', function(){
      assertAddingItemToRetryQueue(securityAuthorization.requireVerifiedUser);
    });
    it('returns a resolved promise if we are authenticated and is verified already', function(){
      expect(security.isAuthenticated()).toBe(false);
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireVerifiedUser().then(function(data) {
        resolved = true;
        expect(security.isAuthenticated()).toBe(true);
        expect(security.currentUser).toBe(userResponse.user);
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(resolved).toBe(true);
    });
    it('returns a rejected promise if authenticated but not yet verified', function(){
      userResponse.user.isVerified = false;
      var rejected = false;
      var reason;
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireVerifiedUser().catch(function(r) {
        rejected = true;
        reason = r;
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(rejected).toBe(true);
      expect(reason).toBe('unverified-client');
    });
  });
  describe('requireUnverifiedUser', function(){
    it('adds a new item to the retry queue if not authenticated', function(){
      assertAddingItemToRetryQueue(securityAuthorization.requireUnverifiedUser);
    });
    it('returns a resolved promise if we are authenticated but not yet verified', function(){
      userResponse.user.isVerified = false;
      expect(security.isAuthenticated()).toBe(false);
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireUnverifiedUser().then(function(data) {
        resolved = true;
        expect(security.isAuthenticated()).toBe(true);
        expect(security.currentUser).toBe(userResponse.user);
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(resolved).toBe(true);
    });
    it('returns a rejected promise if authenticated and verified', function(){
      var rejected = false;
      var reason;
      expect(queue.hasMore()).toBe(false);
      securityAuthorization.requireUnverifiedUser().catch(function(r) {
        rejected = true;
        reason = r;
      });
      $rootScope.$digest();
      expect(queue.hasMore()).toBe(false);
      expect(rejected).toBe(true);
      expect(reason).toBe('verified-client');
    });
  });
});
  