/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Contact = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      name: {},
      company: ''
    },
    url: function() {
      return '/admin/accounts/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    update: function() {
      this.save(undefined, {});
    }
  });
  
  app.Login = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      user: {},
      newUsername: '',
      upsert: 'no'
    },
    url: function() {
      return '/admin/accounts/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    userLink: function() {
      this.save(undefined, {
        url: this.url() +'user/'
      });
    },
    userUnlink: function() {
      this.destroy({
        url: this.url() +'user/',
        success: function(model, response, options) {
          model.set(response);
        }
      });
    }
  });
  
  app.Delete = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/accounts/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    delete: function() {
      this.destroy({
        success: function(model, response, options) {
          model.set(response);
        }
      });
    }
  });



/**
 * VIEWS
 **/
  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.toJSON() ));
    }
  });
  
  app.ContactView = Backbone.View.extend({
    el: '#contact',
    template: _.template( $('#tmpl-contact').html() ),
    events: {
      'click .btn-update': 'update'
    },
    update: function() {
      this.model.set({
        name: {
          first: this.$el.find('[name="name.first"]').val(),
          middle: this.$el.find('[name="name.middle"]').val(),
          last: this.$el.find('[name="name.last"]').val(),
          full: this.$el.find('[name="name.first"]').val() +' '+ this.$el.find('[name="name.last"]').val()
        },
        company: this.$el.find('[name="company"]').val()
      }, {silent: true});
      
      this.model.update();
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      var modelData = this.model.toJSON();
      
      //render
      this.$el.html(this.template( modelData ));
      
      //set input values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    }
  });
  
  app.LoginView = Backbone.View.extend({
    el: '#login',
    template: _.template( $('#tmpl-login').html() ),
    events: {
      'click .btn-user-open': 'userOpen',
      'click .btn-user-link': 'userLink',
      'click .btn-user-unlink': 'userUnlink'
    },
    userOpen: function() {
      location.href = '/admin/users/'+ this.model.get('user')._id +'/';
    },
    userLink: function() {
      this.model.set({
        newUsername: $('[name="newUsername"]').val(),
        upsert: $('[name="upsert"]').is(':checked') ? 'yes' : 'no'
      }, {silent: true});
      this.model.userLink();
    },
    userUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.userUnlink();
      }
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      var modelData = this.model.toJSON();
      
      //render
      this.$el.html(this.template( modelData ));
      
      //set input values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    }
  });
  
  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template( $('#tmpl-delete').html() ),
    events: {
      'click .btn-delete': 'delete',
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.delete();
      }
    },
    initialize: function() {
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      if (this.model.get('success')) {
        location.href = '/admin/accounts/';
      }
      
      //render
      this.$el.html(this.template( this.model.toJSON() ));
    }
  });
  
  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      var initData = JSON.parse($('#data-record').html());
      this.model = new app.Contact({
        _id: initData._id,
        name: {
          first: initData.name.first,
          middle: initData.name.middle,
          last: initData.name.last,
          full: initData.name.full
        },
        company: initData.company
      });
      
      app.headerView = new app.HeaderView({ model: this.model });
      app.contactView = new app.ContactView({ model: this.model });
      app.loginView = new app.LoginView({ model: new app.Login({ _id: initData._id, user: initData.user }) });
      app.deleteView = new app.DeleteView({ model: new app.Delete({ _id: initData._id }) });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


