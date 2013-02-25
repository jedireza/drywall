/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Category = Backbone.Model.extend({
    idAttribute: "_id",
    url: function() {
      return '/admin/categories/'+ this.id +'/';
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
      return '/admin/categories/'+ app.mainView.model.id +'/';
    }
  });
  
  app.Details = Backbone.Model.extend({
    idAttribute: "_id",
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      pivot: '',
      name: ''
    },
    url: function() {
      return '/admin/categories/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.category) {
        app.mainView.model.set(response.category);
        delete response.category;
      }
      return response;
    }
  });



/**
 * VIEWS
 **/
  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model = app.mainView.model;
      this.model.on('change', this.render, this);
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
      app.mainView.model.bind('change', this.syncUp, this);
      
      this.model.on('change', this.render, this);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        pivot: app.mainView.model.get('pivot'),
        name: app.mainView.model.get('name')
      });
    },
    render: function() {
      //render
      this.$el.html(this.template( this.model.attributes ));
      
      //set input values
      for(var key in this.model.attributes) {
        this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
      }
    },
    update: function() {
      this.model.save({
        pivot: this.$el.find('[name="pivot"]').val(),
        name: this.$el.find('[name="name"]').val()
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
      this.model.on('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response, options) {
            if (response.success) {
              location.href = '/admin/categories/';
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
      
      //setup model
      this.model = new app.Category( JSON.parse($('#data-record').html()) );
      
      //sub views
      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.mainView = new app.MainView();
  });


