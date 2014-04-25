/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Admin = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/administrators/'+ this.id +'/';
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
      return '/admin/administrators/'+ app.mainView.model.id +'/';
    }
  });

  app.Details = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      first: '',
      middle: '',
      last: ''
    },
    url: function() {
      return '/admin/administrators/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.admin) {
        app.mainView.model.set(response.admin);
        delete response.admin;
      }

      return response;
    }
  });

  app.Login = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      id: '',
      name: '',
      newUsername: ''
    },
    url: function() {
      return '/admin/administrators/'+ app.mainView.model.id +'/user/';
    },
    parse: function(response) {
      if (response.admin) {
        app.mainView.model.set(response.admin);
        delete response.admin;
      }

      return response;
    }
  });

  app.Groups = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      groups: [],
      newMembership: ''
    },
    url: function() {
      return '/admin/administrators/'+ app.mainView.model.id +'/groups/';
    },
    parse: function(response) {
      if (response.admin) {
        app.mainView.model.set(response.admin);
        delete response.admin;
      }

      return response;
    }
  });

  app.Permissions = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      permissions: [],
      newPermission: ''
    },
    url: function() {
      return '/admin/administrators/'+ app.mainView.model.id +'/permissions/';
    },
    parse: function(response) {
      if (response.admin) {
        app.mainView.model.set(response.admin);
        delete response.admin;
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

  app.DetailsView = Backbone.View.extend({
    el: '#details',
    template: _.template( $('#tmpl-details').html() ),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Details();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        first: app.mainView.model.get('name').first,
        middle: app.mainView.model.get('name').middle,
        last: app.mainView.model.get('name').last
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
        first: this.$el.find('[name="first"]').val(),
        middle: this.$el.find('[name="middle"]').val(),
        last: this.$el.find('[name="last"]').val()
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
              location.href = '/admin/administrators/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
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
    initialize: function() {
      this.model = new app.Login();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        id: app.mainView.model.get('user').id,
        name: app.mainView.model.get('user').name
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
    userOpen: function() {
      location.href = '/admin/users/'+ this.model.get('id') +'/';
    },
    userLink: function() {
      this.model.save({
        newUsername: $('[name="newUsername"]').val()
      });
    },
    userUnlink: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response) {
            if (response.admin) {
              app.mainView.model.set(response.admin);
              delete response.admin;
            }
            app.loginView.model.set(response);
          }
        });
      }
    }
  });

  app.GroupsView = Backbone.View.extend({
    el: '#groups',
    template: _.template( $('#tmpl-groups').html() ),
    events: {
      'click .btn-add': 'add',
      'click .btn-delete': 'delete',
      'click .btn-save': 'saveGroups'
    },
    initialize: function() {
      this.model = new app.Groups();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        groups: app.mainView.model.get('groups')
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
    add: function() {
      var newMembership = this.$el.find('[name="newMembership"]').val();
      var newMembershipName = this.$el.find('[name="newMembership"] option:selected').text();
      if (!newMembership) {
        alert('Please select a group.');
        return;
      }
      else {
        var alreadyAdded = false;
        _.each(this.model.get('groups'), function(group) {
          if (newMembership === group._id) {
            alreadyAdded = true;
          }
        });

        if (alreadyAdded) {
          alert('That group already exists.');
          return;
        }
      }

      this.model.get('groups').push({ _id: newMembership, name: newMembershipName });

      var sorted = this.model.get('groups');
      sorted.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
      this.model.set('groups', sorted);

      this.render();
    },
    delete: function(event) {
      if (confirm('Are you sure?')) {
        var idx = this.$el.find('.btn-delete').index(event.currentTarget);
        this.model.get('groups').splice(idx, 1);
        this.render();
      }
    },
    saveGroups: function() {
      this.model.save();
    }
  });

  app.PermissionsView = Backbone.View.extend({
    el: '#permissions',
    template: _.template( $('#tmpl-permissions').html() ),
    events: {
      'click .btn-add': 'add',
      'click .btn-allow': 'allow',
      'click .btn-deny': 'deny',
      'click .btn-delete': 'delete',
      'click .btn-set': 'savePermissions'
    },
    initialize: function() {
      this.model = new app.Permissions();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        permissions: app.mainView.model.get('permissions')
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
    add: function() {
      var newPermission = this.$el.find('[name="newPermission"]').val().trim();
      if (!newPermission) {
        alert('Please enter a name.');
        return;
      }
      else {
        var alreadyAdded = false;
        _.each(this.model.get('permissions'), function(permission) {
          if (newPermission === permission.name) {
            alreadyAdded = true;
          }
        });
        if (alreadyAdded) {
          alert('That name already exists.');
          return;
        }
      }

      this.model.get('permissions').push({ name: newPermission, permit: true });

      var sorted = this.model.get('permissions');
      sorted.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
      this.model.set('permissions', sorted);

      this.render();
    },
    allow: function(event) {
      var idx = this.$el.find('.btn-allow').index(event.currentTarget);
      this.model.get('permissions')[idx].permit = true;
      this.render();
    },
    deny: function(event) {
      var idx = this.$el.find('.btn-deny').index(event.currentTarget);
      this.model.get('permissions')[idx].permit = false;
      this.render();
    },
    delete: function(event) {
      if (confirm('Are you sure?')) {
        var idx = this.$el.find('.btn-delete').index(event.currentTarget);
        this.model.get('permissions').splice(idx, 1);
        this.render();
      }
    },
    savePermissions: function() {
      this.model.save();
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Admin( JSON.parse( unescape($('#data-record').html()) ) );

      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
      app.loginView = new app.LoginView();
      app.groupsView = new app.GroupsView();
      app.permissionsView = new app.PermissionsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
