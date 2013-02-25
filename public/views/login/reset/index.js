/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Reset = Backbone.Model.extend({
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      id: undefined,
      password: '',
      confirm: ''
    },
    url: function() {
      return '/login/reset/'+ this.id +'/';
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
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="password"]').focus();
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    resetOnEnter: function(event) {
      if (event.keyCode != 13) return;
      event.preventDefault();
      this.reset();
    },
    reset: function() {
      this.$el.find('.btn-reset').attr('disabled', true);
      
      this.model.save({
        password: this.$el.find('[name="password"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      });
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
      app.resetView = new app.ResetView({ model: new app.Reset({ id: token }) });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.router = new app.Router();
    Backbone.history.start({ pushState: true });
  });


