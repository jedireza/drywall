/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Details = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      name: ''
    },
    url: function() {
      return '/admin/admin-groups/'+ this.id +'/';
    },
    initialize: function(data) {
      this.set(data);
    },
    update: function() {
      this.save(undefined, {});
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
      return '/admin/admin-groups/'+ this.id +'/permissions/';
    },
    initialize: function(data) {
      this.set(data);
    },
    savePermissions: function() {
      this.save(undefined, {});
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
      return '/admin/admin-groups/'+ this.id +'/';
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
  
  app.DetailsView = Backbone.View.extend({
    el: '#details',
    template: _.template( $('#tmpl-details').html() ),
    events: {
      'click .btn-update': 'update'
    },
    update: function() {
      this.model.set({
        name: this.$el.find('[name="name"]').val()
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
        location.href = '/admin/admin-groups/';
      }
      
      //render
      this.$el.html(this.template( this.model.toJSON() ));
    }
  });
  
  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      var initData = JSON.parse($('#data-record').html());
      this.model = new app.Details({
        _id: initData._id,
        name: initData.name
      });
      
      app.headerView = new app.HeaderView({ model: this.model });
      app.detailsView = new app.DetailsView({ model: this.model });
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


