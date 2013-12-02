/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Verify = Backbone.Model.extend({
    url: '/account/verification/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      keepFormOpen: false,
      email: ''
    }
  });

  app.VerifyView = Backbone.View.extend({
    el: '#verify',
    template: _.template( $('#tmpl-verify').html() ),
    events: {
      'submit form': 'preventSubmit',
      'click .btn-resend': 'resend',
      'click .btn-verify': 'verify'
    },
    initialize: function() {
      this.model = new app.Verify( JSON.parse($('#data-user').html()) );
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    resend: function() {
      this.model.set({
        keepFormOpen: true
      });
      this.render();
    },
    verify: function() {
      this.$el.find('.btn-verify').attr('disabled', true);

      this.model.save({
        email: this.$el.find('[name="email"]').val()
      });
    }
  });

  $(document).ready(function() {
    app.verifyView = new app.VerifyView();
  });
}());
