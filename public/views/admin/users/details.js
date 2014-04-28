/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.User = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/users/'+ this.id +'/';
    }
  });

  app.Delete = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/';
    }
  });

  app.Identity = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      isActive: '',
      username: '',
      email: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.Roles = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      roles: {},
      newAccountId: '',
      newAdminId: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.Password = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      newPassword: '',
      confirm: ''
    },
    url: function() {
      return '/admin/users/'+ app.mainView.model.id +'/password/';
    },
    parse: function(response) {
      if (response.user) {
        app.mainView.model.set(response.user);
        delete response.user;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model = app.mainView.model;
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.IdentityView = Backbone.View.extend({
    el: '#identity',
    template: _.template( $('#tmpl-identity').html() ),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Identity();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        isActive: app.mainView.model.get('isActive'),
        username: app.mainView.model.get('username'),
        email: app.mainView.model.get('email')
      });
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      this.model.save({
        isActive: this.$el.find('[name="isActive"]').val(),
        username: this.$el.find('[name="username"]').val(),
        email: this.$el.find('[name="email"]').val()
      });
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
    initialize: function() {
      this.model = new app.Roles();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        roles: app.mainView.model.get('roles')
      });
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    adminOpen: function() {
      location.href = '/admin/administrators/'+ this.model.get('roles').admin._id +'/';
    },
    adminLink: function() {
      this.model.save({
        newAdminId: $('[name="newAdminId"]').val()
      },{
        url: this.model.url() +'role-admin/'
      });
    },
    adminUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          url: this.model.url() +'role-admin/',
          success: function(model, response) {
            if (response.user) {
              app.mainView.model.set(response.user);
              delete response.user;
            }

            app.rolesView.model.set(response);
          }
        });
      }
    },
    accountOpen: function() {
      location.href = '/admin/accounts/'+ this.model.get('roles').account._id +'/';
    },
    accountLink: function() {
      this.model.save({
        newAccountId: $('[name="newAccountId"]').val()
      },{
        url: this.model.url() +'role-account/'
      });
    },
    accountUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          url: this.model.url() +'role-account/',
          success: function(model, response) {
            if (response.user) {
              app.mainView.model.set(response.user);
              delete response.user;
            }

            app.rolesView.model.set(response);
          }
        });
      }
    }
  });

  app.PasswordView = Backbone.View.extend({
    el: '#password',
    template: _.template( $('#tmpl-password').html() ),
    events: {
      'click .btn-password': 'password'
    },
    initialize: function() {
      this.model = new app.Password({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    password: function() {
      this.model.save({
        newPassword: this.$el.find('[name="newPassword"]').val(),
        confirm: this.$el.find('[name="confirm"]').val()
      });
    }
  });

  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template( $('#tmpl-delete').html() ),
    events: {
      'click .btn-delete': 'delete',
    },
    initialize: function() {
      this.model = new app.Delete({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response) {
            if (response.success) {
              location.href = '/admin/users/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
      }
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.User( JSON.parse( unescape($('#data-record').html())) );

      app.headerView = new app.HeaderView();
      app.identityView = new app.IdentityView();
      app.passwordView = new app.PasswordView();
      app.rolesView = new app.RolesView();
      app.deleteView = new app.DeleteView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
