/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Contact = Backbone.Model.extend({
    url: '/contact/',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      name: '',
      email: '',
      phone: '',
      message: '',
    },
    contact: function() {
      this.save(undefined, {
        success: function(model, response, options) {
          model.set(response);
        },
        error: function(model, xhr, options) {
          var response = JSON.parse(xhr.responseText);
          model.set(response);
        }
      });
    }
  });



/**
 * VIEWS
 **/
  app.ContactView = Backbone.View.extend({
    el: '#contact',
    template: _.template( $('#tmpl-contact').html() ),
    events: {
      'submit form': 'preventSubmit',
      'click .btn-contact': 'contact'
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
      }
      return this;
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    contact: function(event) {
      if (event) event.preventDefault();
      this.model.set({
        name: this.$el.find('[name="name"]').val(),
        email: this.$el.find('[name="email"]').val(),
        phone: this.$el.find('[name="phone"]').val(),
        message: this.$el.find('[name="message"]').val()
      });
      this.$el.find('.btn-contact').attr('disabled', true);
      this.model.contact();
    }
  });
  
  app.MainView = Backbone.View.extend({
    initialize: function() {
      app.contactView = new app.ContactView({ model: new app.Contact() });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


