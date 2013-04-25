/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Signup = Backbone.Model.extend({
    url: '/signup/social/',
    defaults: {
      errors: [],
      errfor: {},
      email: ''
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
      this.model = new app.Signup();
      this.model.set('email', $('#data-email').text());
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="email"]').focus();
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    signupOnEnter: function(event) {
      if (event.keyCode != 13) return;
      event.preventDefault();
      this.signup();
    },
    signup: function() {
      this.$el.find('.btn-signup').attr('disabled', true);
      
      this.model.save({
        email: this.$el.find('[name="email"]').val()
      },{
        success: function(model, response, options) {
          if (response.success) {
            location.href = '/account/';
          }
          else {
            model.set(response);
          }
        }
      });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.signupView = new app.SignupView();
  });


