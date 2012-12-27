/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Identity = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      isActive: '',
      username: '',
      email: ''
    },
    url: function() {
      return '/admin/users/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    update: function() {
      this.save(undefined, {});
    }
  });
  
  app.Roles = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      roles: {},
      newAccountId: '',
      newAdminId: ''
    },
    url: function() {
      return '/admin/users/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    adminLink: function() {
      this.save(undefined, {
        url: this.url() +'role-admin/'
      });
    },
    adminUnlink: function() {
      this.destroy({
        url: this.url() +'role-admin/',
        success: function(model, response, options) {
          model.set(response);
        }
      });
    },
    accountLink: function() {
      this.save(undefined, {
        url: this.url() +'role-account/'
      });
    },
    accountUnlink: function() {
      this.destroy({
        url: this.url() +'role-account/',
        success: function(model, response, options) {
          model.set(response);
        }
      });
    }
  });
  
  app.Password = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      newPassword: '',
      confirm: ''
    },
    url: function() {
      return '/admin/users/'+ this.id +'/password/';
    },
    initialize: function(data) {
      this.set(data);
    },
    password: function() {
      this.save(null, {});
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
      return '/admin/users/'+ this.id +'/';
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
  
  app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-identity').html() ),
    events: {
      'click .btn-update': 'update'
    },
    update: function() {
      this.model.set({
        isActive: this.$el.find('[name="isActive"]').val(),
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val()
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
  
  app.RolesView = Backbone.View.extend({
    el: '#roles',
    template: _.template( $('#tmpl-roles').html() ),
    events: {
      'click .btn-admin-open': 'adminOpen',
      'click .btn-admin-link': 'adminLink',
      'click .btn-admin-unlink': 'adminUnlink',
      'click .btn-account-open': 'accountOpen',
      'click .btn-account-link': 'accountLink',
      'click .btn-account-unlink': 'accountUnlink'
    },
    adminOpen: function() {
      location.href = '/admin/administrators/'+ this.model.get('roles').admin._id +'/';
    },
    adminLink: function() {
      this.model.set({ newAdminId: $('[name="newAdminId"]').val() }, {silent: true});
      this.model.adminLink();
    },
    adminUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.adminUnlink();
      }
    },
    accountOpen: function() {
      location.href = '/admin/accounts/'+ this.model.get('roles').account._id +'/';
    },
    accountLink: function() {
      this.model.set({ newAccountId: $('[name="newAccountId"]').val() }, {silent: true});
      this.model.accountLink();
    },
    accountUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.accountUnlink();
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
  
  app.PasswordView = Backbone.View.extend({
    el: '#password',
    template: _.template( $('#tmpl-password').html() ),
    events: {
      'click .btn-password': 'password'
    },
    password: function() {
      this.model.set({
        newPassword: this.$el.find('[name="newPassword"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      }, {silent: true});
      
      this.model.password();
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
        location.href = '/admin/users/';
      }
      
      //render
      this.$el.html(this.template( this.model.toJSON() ));
    }
  });
  
  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      var initData = JSON.parse($('#data-record').html());
      this.model = new app.Identity({
        _id: initData._id,
        isActive: initData.isActive,
        username: initData.username,
        email: initData.email
      });
      
      app.headerView = new app.HeaderView({ model: this.model });
      app.identityView = new app.IdentityView({ model: this.model });
      app.passwordView = new app.PasswordView({ model: new app.Password({ _id: initData._id }) });
      app.rolesView = new app.RolesView({ model: new app.Roles({ _id: initData._id, roles: initData.roles }) });
      app.deleteView = new app.DeleteView({ model: new app.Delete({ _id: initData._id }) });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


