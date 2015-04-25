/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Status = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/posts/'+ this.id +'/';
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
      return '/admin/posts/'+ app.mainView.model.id +'/';
    }
  });

  app.Details = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      title: '',
      content: '',
      pivot: '',
      userCreated: {
      	time: '',
      	name: '',
      }
    },
    url: function() {
      return '/admin/posts/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.status) {
        app.mainView.model.set(response.status);
        delete response.status;
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
        pivot: app.mainView.model.get('pivot'),
        title: app.mainView.model.get('title'),
        content: app.mainView.model.get('content'),
        userCreated: app.mainView.model.get('userCreated'),
      });
    },
    render: function() {
      var editor;
      this.$el.html(this.template( this.model.attributes ));
      
      editor = new MediumEditor('#editable', {
      	buttons: ['bold', 'italic', 'underline', 'anchor', 'header1', 'header2', 
      						'quote', 'justifyLeft', 'justifyCenter', 'justifyRight', 'removeFormat'],
      	paste: {
      		forcePlainText: false,
	        cleanPastedHTML: true,
	        cleanAttrs: ['style', 'dir'],
	        cleanTags: ['label', 'meta']
    		}
      }); 

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      this.model.save({
        pivot: this.$el.find('[name="pivot"]').val(),
        title: this.$el.find('[name="title"]').val(),
        content: document.getElementById('editable').innerHTML,
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
              location.href = '/admin/posts/';
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
      this.model = new app.Status( JSON.parse( unescape($('#data-record').html()) ) );

      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
