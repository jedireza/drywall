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
      name: {}
    },
    url: function() {
      return '/admin/administrators/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    update: function() {
      this.save(undefined, {patch: true});
    }
  });
  
  app.Login = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      user: {},
      newUsername: ''
    },
    url: function() {
      return '/admin/administrators/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    userLink: function() {
      this.save(undefined, {
        patch: true,
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
  
  app.Groups = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      groups: [],
      groupList: [],
      newMembership: ''
    },
    url: function() {
      return '/admin/administrators/'+ this.id +'/groups/';
    },
    initialize: function(data) {
      this.set(data);
    },
    saveGroups: function() {
      var newGroups = _.map(this.get('groups'), function(group) { return group._id; });
      this.save({newGroups: newGroups}, {patch: true});
    }
  });
  
  app.Permissions = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      permissions: [],
      newPermission: ''
    },
    url: function() {
      return '/admin/administrators/'+ this.id +'/permissions/';
    },
    initialize: function(data) {
      this.set(data);
    },
    savePermissions: function() {
      this.save(undefined, {patch: true});
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
      return '/admin/administrators/'+ this.id +'/';
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
        }
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
      this.model.set({ newUsername: $('[name="newUsername"]').val() }, {silent: true});
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
  
  app.GroupsView = Backbone.View.extend({
    el: '#groups',
    template: _.template( $('#tmpl-groups').html() ),
    events: {
      'click .btn-add': 'add',
      'click .btn-delete': 'delete',
      'click .btn-save': 'saveGroups'
    },
    add: function(event) {
      //validate
      var newMembership = this.$el.find('[name="newMembership"]').val();
      var newMembershipName = this.$el.find('[name="newMembership"] option:selected').text();
      if (!newMembership) {
        alert('Please select a group.');
        return;
      }
      else {
        var alreadyAdded = false;
        _.each(this.model.get('groups'), function(group) {
          if (newMembership == group._id) {
            alreadyAdded = true;
          }
        });
        if (alreadyAdded) {
          alert('That group already exists.');
          return;
        }
      }
      
      //add item
      this.model.get('groups').push({_id: newMembership, name: newMembershipName});
      
      //sort
      var sorted = this.model.get('groups');
      sorted.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
      this.model.set('groups', sorted);
      
      //re-render
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
      if (confirm('Are you sure?')) {
        this.model.saveGroups();
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
    add: function(event) {
      //validate
      var newPermission = this.$el.find('[name="newPermission"]').val().trim();
      if (!newPermission) {
        alert('Please enter a name.');
        return;
      }
      else {
        var alreadyAdded = false;
        _.each(this.model.get('permissions'), function(permission) {
          if (newPermission == permission.name) {
            alreadyAdded = true;
          }
        });
        if (alreadyAdded) {
          alert('That name already exists.');
          return;
        }
      }
      
      //add item
      this.model.get('permissions').push({name: newPermission, permit: true});
      
      //sort
      var sorted = this.model.get('permissions');
      sorted.sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase();
      });
      this.model.set('permissions', sorted);
      
      //re-render
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
      if (confirm('Are you sure?')) {
        this.model.savePermissions();
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
        location.href = '/admin/administrators/';
      }
      
      //render
      this.$el.html(this.template( this.model.toJSON() ));
    }
  });
  
  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      var groupList = JSON.parse($('#data-group-list').html());
      var initData = JSON.parse($('#data-record').html());
      this.model = new app.Contact({
        _id: initData._id,
        name: {
          first: initData.name.first,
          middle: initData.name.middle,
          last: initData.name.last,
          full: initData.name.full
        }
      });
      
      app.headerView = new app.HeaderView({ model: this.model });
      app.contactView = new app.ContactView({ model: this.model });
      app.loginView = new app.LoginView({ model: new app.Login({ _id: initData._id, user: initData.user }) });
      app.groupsView = new app.GroupsView({ model: new app.Groups({ _id: initData._id, groups: initData.groups, groupList: groupList }) });
      app.permissionsView = new app.PermissionsView({ model: new app.Permissions({ _id: initData._id, permissions: initData.permissions }) });
      app.deleteView = new app.DeleteView({ model: new app.Delete({ _id: initData._id }) });
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


