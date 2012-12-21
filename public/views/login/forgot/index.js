/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Forgot = Backbone.Model.extend({
    url: '/login/forgot/',
    defaults: {
      errors: [],
      errfor: {},
      email: '',
      emailHelp: '',
      wasEmailSent: false
    },
    forgot: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {},
              wasEmailSent: true
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
  app.ForgotView = Backbone.View.extend({
    el: '#forgot',
    template: _.template( $('#tmpl-forgot').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="email"]': 'forgotOnEnter',
      'click .btn-forgot': 'forgot'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.find('[name="email"]').focus();
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    forgotOnEnter: function(event) {
      if (event.keyCode != 13) return;
      this.forgot(event);
    },
    forgot: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        email: this.$el.find('[name="email"]').val()
      });
      this.$el.find('.btn-forgot').attr('disabled', true);
      this.model.forgot();
    }
  });
  
  app.MainView = Backbone.View.extend({
    initialize: function() {
      app.forgotView = new app.ForgotView({model: new app.Forgot()});
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


