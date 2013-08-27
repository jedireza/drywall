/* global app:true */

(function() {
  'use strict';
  
  app = app || {};
  
  app.Login = Backbone.Model.extend({
    url: '/login/',
    defaults: {
      errors: [],
      errfor: {},
      username: '',
      password: ''
    }
  });
  
  app.LoginView = Backbone.View.extend({
    el: '#login',
    template: _.template( $('#tmpl-login').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'loginOnEnter',
      'click .btn-login': 'login'
    },
    initialize: function() {
      this.model = new app.Login();
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="username"]').focus();
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    loginOnEnter: function(event) {
      if (event.keyCode !== 13) { return; }
      if ($(event.target).attr('name') !== 'password') { return; }
      event.preventDefault();
      this.login();
    },
    login: function() {
      this.$el.find('.btn-login').attr('disabled', true);
      this.model.attributes.errors = [];
      this.model.attributes.errfor = {};
      
      this.model.save({
        username: this.$el.find('[name="username"]').val(),
        password: this.$el.find('[name="password"]').val()
      },{
        success: function(model, response) {
          if (response.success) {
            var returnUrl = app.loginView.$el.find('[name="returnUrl"]').val();
            if (returnUrl === '/') {
              returnUrl = response.defaultReturnUrl;
            }
            location.href = returnUrl;
          }
          else {
            model.set(response);
          }
        }
      });
    }
  });
  
  $(document).ready(function() {
    app.loginView = new app.LoginView();
  });
}());
