/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Reset = Backbone.Model.extend({
    defaults: {
      errors: [],
      errfor: {},
      id: '',
      password: '',
      confirm: '',
      wasPasswordSet: false
    },
    url: function() {
      return '/login/reset/'+ this.id +'/';
    },
    reset: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          if (response.success) {
            model.set({
              errors: [],
              errfor: {},
              wasPasswordSet: true
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
  app.ResetView = Backbone.View.extend({
    el: '#reset',
    template: _.template( $('#tmpl-reset').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="confirm"]': 'resetOnEnter',
      'click .btn-reset': 'reset'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.toJSON() ));
      this.$el.find('[name="password"]').focus();
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    resetOnEnter: function(event) {
      if (event.keyCode != 13) return;
      this.reset(event);
    },
    reset: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        password: this.$el.find('[name="password"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      });
      this.$el.find('.btn-reset').attr('disabled', true);
      this.model.reset();
    }
  });
  
  app.MainView = Backbone.View.extend({
    initialize: function(options) {
      app.resetView = new app.ResetView({ model: new app.Reset({id: options.token}) });
    }
  });



/**
 * ROUTER
 **/
  app.Router = Backbone.Router.extend({
    routes: {
      'login/reset/': 'start',
      'login/reset/:token/': 'start'
    },
    start: function(token) {
      app.mainView = new app.MainView( {token: token} );
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.router = new app.Router();
    Backbone.history.start({ pushState: true });
  });


