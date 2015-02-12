describe('security', function() {
  var END_POINT = {
    login:            '/api/login',
    logout:           '/api/logout',
    currentUser:      '/api/current-user',
    signup:           '/api/signup',
    loginForgot:      '/api/login/forgot',
    loginReset:       '/api/login/reset',
    loginGoogle:      '/api/login/google/callback',
    connectGoogle:    '/api/account/settings/google/callback',
    disconnectGoogle: '/api/account/settings/google/disconnect'
  };

  var $rootScope, $http, $httpBackend, status, userInfo, messages;
  
  angular.module('test',[]).constant('I18N.MESSAGES', messages = {});
  beforeEach(module('security', 'test', 'security/login/form.tpl.html'));
  beforeEach(inject(function(_$rootScope_, _$httpBackend_, _$http_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $http = _$http_;

    userInfo = { id: '1234567890', email: 'jo@bloggs.com', firstName: 'Jo', lastName: 'Bloggs'};
    $httpBackend.when('GET', END_POINT.currentUser).respond(200, { user: userInfo });
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  var service, queue;
  beforeEach(inject(function($injector) {
    service = $injector.get('security');
    queue = $injector.get('securityRetryQueue');
  }));

  describe('showLogin', function() {
    it("should open the dialog", function() {
      service.showLogin();
      $rootScope.$digest();
      expect(angular.element('.login-form').length).toBeGreaterThan(0);
    });
  });

  describe('login', function() {
    it('sends a http request to login the specified user', function() {
      $httpBackend.when('POST', END_POINT.login).respond(200, { success: true, user: userInfo });
      $httpBackend.expect('POST', END_POINT.login);
      service.login('email', 'password');
      $httpBackend.flush();
      expect(service.currentUser).toEqual(userInfo);
    });
    it('calls queue.retry on a successful login', function() {
      $httpBackend.when('POST', END_POINT.login).respond(200, { success: true, user: userInfo });
      spyOn(queue, 'retryAll');
      service.showLogin();
      service.login('email', 'password');
      $httpBackend.flush();
      $rootScope.$digest();
      expect(queue.retryAll).toHaveBeenCalled();
      expect(service.currentUser).toEqual(userInfo);
    });
    it('does not call queue.retryAll after a login failure', function() {
      $httpBackend.when('POST', END_POINT.login).respond(200, { success: false });
      spyOn(queue, 'retryAll');
      expect(queue.retryAll).not.toHaveBeenCalled();
      service.login('email', 'password');
      $httpBackend.flush();
      expect(queue.retryAll).not.toHaveBeenCalled();
    });
    it('returns data contains userInfo to success handlers if the user authenticated', function() {
      var responseData = { success: true, user: userInfo };
      $httpBackend.when('POST', END_POINT.login).respond(200, responseData);
      service.login('email', 'password').then(function(data) {
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
    });
    it('returns data to success handlers if the user was not authenticated', function() {
      var responseData = { success: false };
      $httpBackend.when('POST', END_POINT.login).respond(200, responseData);
      service.login('email', 'password').then(function(data) {
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
    });
  });

  describe('socialLogin', function(){
    var url, responseData;
    beforeEach(function(){
      url = END_POINT.loginGoogle + '?code=google_code';
      responseData = { success: true, user: userInfo };
    });
    it('sends a http GET request to login the specified user', function() {
      $httpBackend.when('GET', url).respond(200, responseData);
      $httpBackend.expect('GET', url);
      service.socialLogin('google', 'google_code');
      $httpBackend.flush();
      expect(service.currentUser).toEqual(userInfo);
    });
    it('returns data contains userInfo to success handlers if the user authenticated', function() {
      $httpBackend.when('GET', url).respond(200, responseData);
      service.socialLogin('google', 'google_code').then(function(data) {
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
    });
    it('returns data to success handlers if the user was not authenticated', function() {
      var responseData =  { success: false };
      $httpBackend.when('GET', url).respond(200, responseData);
      service.socialLogin('google', 'google_code').then(function(data) {
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
    });
  });

  describe('socialConnect', function(){
    var url, responseData;
    beforeEach(function(){
      url = END_POINT.connectGoogle + '?code=google_code';
      responseData = { success: true };
    });
    it('sends a http GET request to connect the specified user', function() {
      $httpBackend.when('GET', url).respond(200, responseData);
      $httpBackend.expect('GET', url);
      service.socialConnect('google', 'google_code');
      $httpBackend.flush();
    });
    it('returns data indicating whether user is successfully connected', function() {
      var resolved;
      $httpBackend.when('GET', url).respond(200, responseData);
      service.socialConnect('google', 'google_code').then(function(data) {
        resolved = true;
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
  });

  describe('socialDisconnect', function(){
    var responseData;
    beforeEach(function(){
      responseData = { success: true };
    });
    it('sends a http GET request to disconnect the specified user', function() {
      $httpBackend.when('GET', END_POINT.disconnectGoogle).respond(200, responseData);
      $httpBackend.expect('GET', END_POINT.disconnectGoogle);
      service.socialDisconnect('google');
      $httpBackend.flush();
    });
    it('returns data indicating whether user is successfully disconnected', function() {
      var resolved;
      $httpBackend.when('GET', END_POINT.disconnectGoogle).respond(200, responseData);
      service.socialDisconnect('google').then(function(data) {
        resolved = true;
        expect(data).toEqual(responseData);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
  });

  describe('logout', function() {
    beforeEach(function() {
      $httpBackend.when('POST', END_POINT.logout).respond(200, { success: true });
    });

    it('sends a http post to clear the current logged in user', function() {
      $httpBackend.expect('POST', END_POINT.logout);
      service.logout();
      $httpBackend.flush();
    });

    it('redirects to / by default', function() {
      inject(function($location) {
        spyOn($location, 'path');
        service.logout();
        $httpBackend.flush();
        expect($location.path).toHaveBeenCalledWith('/');
      });
    });

    it('redirects to the path specified in the first parameter', function() {
      inject(function($location) {
        spyOn($location, 'path');
        service.logout('/other/path');
        $httpBackend.flush();
        expect($location.path).toHaveBeenCalledWith('/other/path');
      });
    });
  });

  describe("currentUser", function() {

    it("should be unauthenticated to begin with", function() {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isAdmin()).toBe(false);
      expect(service.currentUser).toBe(null);
    });
    it("should be authenticated if we update with user info", function() {
      var userInfo = {};
      service.currentUser = userInfo;
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isAdmin()).toBe(false);
      expect(service.currentUser).toBe(userInfo);
    });
    it("should be admin if we update with admin user info", function() {
      var userInfo = { admin: true };
      service.currentUser = userInfo;
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isAdmin()).toBe(true);
      expect(service.currentUser).toBe(userInfo);
    });

    it("should not be authenticated or admin if we clear the user", function() {
      var userInfo = { admin: true };
      service.currentUser = userInfo;
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isAdmin()).toBe(true);
      expect(service.currentUser).toBe(userInfo);

      service.currentUser = null;
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isAdmin()).toBe(false);
      expect(service.currentUser).toBe(null);
    });
  });

  describe('requestCurrentUser', function() {
    it('makes a GET request to current-user url', function() {
      var resolved;
      expect(service.isAuthenticated()).toBe(false);
      $httpBackend.expect('GET', END_POINT.currentUser);
      service.requestCurrentUser().then(function(data) {
        resolved = true;
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser).toEqual(userInfo);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
    it('returns the current user immediately without making GET request if they are already authenticated', function() {
      var resolved;
      userInfo = {};
      service.currentUser = userInfo;
      expect(service.isAuthenticated()).toBe(true);
      service.requestCurrentUser().then(function(data) {
        resolved = true;
        expect(service.currentUser).toBe(userInfo);
      });
      $rootScope.$digest();
      expect(resolved).toBe(true);
    });
  });

  describe('signup', function(){
    var data;
    beforeEach(function(){
      data = {
        username: 'test user',
        email: 'JohnDoe@gmail.com',
        password: 'password'
      };
      $httpBackend.when('POST', END_POINT.signup).respond(200, { success: true });
    });
    it('sends a http request to sign up the specified user', function() {
      var resolved;
      $httpBackend.expect('POST', END_POINT.signup, data);
      service.signup(data).then(function(result){
        resolved = true;
        expect(result.success).toBe(true);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
  });

  describe('loginForgot', function(){
    var data;
    beforeEach(function(){
      data = { email: 'JohnDoe@gmail.com' };
      $httpBackend.when('POST', END_POINT.loginForgot).respond(200, { success: true });
    });
    it('sends a http request to send reset password token for the specified user', function() {
      var resolved;
      $httpBackend.expect('POST', END_POINT.loginForgot, data);
      service.loginForgot(data).then(function(result){
        resolved = true;
        expect(result.success).toBe(true);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
  });

  describe('loginReset', function(){
    var id, email, data, url;
    beforeEach(function(){
      id = 'token_value';
      email = 'jdoe@gmail.com';
      url = END_POINT.loginReset + '/' + email + '/' + id;
      data = {
        password: 'password',
        confirm: 'password'
      };
      $httpBackend.when('PUT', url).respond(200, { success: true });
    });
    it('sends a http request to reset password for the specified user', function() {
      var resolved;
      $httpBackend.expect('PUT', url, data);
      service.loginReset(id, email, data).then(function(result){
        resolved = true;
        expect(result.success).toBe(true);
      });
      $httpBackend.flush();
      expect(resolved).toBe(true);
    });
  });

});