/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Login = Backbone.Model.extend({
    url: '/login/',
    defaults: {
      errors: [],
      errfor: {},
      username: '',
      password: '',
      isAuthenticated: false,
      defaultReturnUrl: '/'
    },
    login: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {},
              isAuthenticated: true,
              defaultReturnUrl: response.defaultReturnUrl
            });
          }
          else {
            model.set({
              errors: response.errors,
              errfor: response.errfor
            });
          }
        },
        error: function(model, xhr, options) {
          var response = JSON.parse(xhr.responseText);
          model.set({
            errors: response.errors,
            errfor: response.errfor
          });
        }
      });
    }
  });



/**
 * VIEWS
 **/
  app.LoginView = Backbone.View.extend({
    el: '#login',
    template: _.template( $('#tmpl-login').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'loginOnEnter',
      'click .btn-login': 'login'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      if (this.model.get('isAuthenticated')) {
        var returnUrl = this.$el.find('[name="returnUrl"]').val();
        if (returnUrl == '/') returnUrl = this.model.get('defaultReturnUrl');
        location.href = returnUrl;
      }
      else {
        this.$el.html(this.template(this.model.toJSON()));
        this.$el.find('[name="username"]').focus();
      }
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    loginOnEnter: function(event) {
      if (event.keyCode != 13) return;
      if ($(event.target).attr('name') != 'password') return;
      this.login(event);
    },
    login: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        username: this.$el.find('[name="username"]').val(),
        password: this.$el.find('[name="password"]').val()
      });
      this.$el.find('.btn-login').attr('disabled', true);
      this.model.login();
    }
  });
  
  app.MainView = Backbone.View.extend({
    initialize: function() {
      app.loginView = new app.LoginView({ model: new app.Login() });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


