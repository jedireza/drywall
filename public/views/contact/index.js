/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Contact = Backbone.Model.extend({
    url: '/contact/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      name: '',
      email: '',
      message: ''
    }
  });

  app.ContactView = Backbone.View.extend({
    el: '#contact',
    template: _.template( $('#tmpl-contact').html() ),
    events: {
      'submit form': 'preventSubmit',
      'click .btn-contact': 'contact'
    },
    initialize: function() {
      this.model = new app.Contact();
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      this.$el.find('[name="name"]').focus();
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    contact: function() {
      this.$el.find('.btn-contact').attr('disabled', true);

      this.model.save({
        name: this.$el.find('[name="name"]').val(),
        email: this.$el.find('[name="email"]').val(),
        message: this.$el.find('[name="message"]').val()
      });
    }
  });

  $(document).ready(function() {
    app.contactView = new app.ContactView();
  });
}());
