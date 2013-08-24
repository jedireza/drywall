/* global app:true */

(function() {
  'use strict';
  
  app = app || {};
  
  app.Verify = Backbone.Model.extend({
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      email: '',
      id: undefined
    },
    url: function() {
      return '/signup/verify/'+ this.id +'/';
    }
  });
  
  app.VerifyView = Backbone.View.extend({
    el: '#verify',
    template: _.template( $('#tmpl-verify').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress [name="email"]': 'verifyOnEnter',
      'click .btn-verify': 'verify'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="email"]').focus();
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    verifyOnEnter: function(event) {
      if (event.keyCode !== 13) {
        return;
      }
      if ($(event.target).attr('name') !== 'email') {
        return;
      }
      event.preventDefault();
      this.verify();
    },
    verify: function() {
      this.$el.find('.btn-verify').attr('disabled', true);
      this.model.save({
        email: this.$el.find('[name="email"]').val()
      });
    }
  });
  
  app.Router = Backbone.Router.extend({
    routes: {
      'signup/verify/': 'start',
      'signup/verify/:token/': 'start'
    },
    start: function(token) {
        app.verifyView = new app.VerifyView({ model: new app.Verify({ id: token }) });
      }
  });
  
  $(document).ready(function() {
    app.router = new app.Router();
    Backbone.history.start({ pushState: true });
  });
}());
