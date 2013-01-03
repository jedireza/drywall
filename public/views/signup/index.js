/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Signup = Backbone.Model.extend({
    url: '/signup/',
    defaults: {
      errors: [],
      errfor: {},
      username: '',
      email: '',
      password: '',
      isAuthenticated: false
    },
    signup: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {},
              isAuthenticated: true
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
  app.SignupView = Backbone.View.extend({
    el: '#signup',
    template: _.template( $('#tmpl-signup').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="password"]': 'signupOnEnter',
      'click .btn-signup': 'signup'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      if (this.model.get('isAuthenticated')) {
        location.href = '/account/';
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
    signupOnEnter: function(event) {
      if (event.keyCode != 13) return;
      if ($(event.target).attr('name') != 'password') return;
      this.signup(event);
    },
    signup: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val(),
        password: this.$el.find('[name="password"]').val()
      });
      this.$el.find('.btn-signup').attr('disabled', true);
      this.model.signup();
    }
  });
  
  app.MainView = Backbone.View.extend({
    initialize: function() {
      app.signupView = new app.SignupView({ model: new app.Signup() });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


