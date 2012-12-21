/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app.Record = Backbone.Model.extend({
    urlRoot: '/admin/admin-groups/',
    idAttribute: "_id",
    defaults: {
      _id: null,
      name: ''
    }
  });
  
  app.RecordCollection = Backbone.Collection.extend({
    model: app.Record,
    url: '/admin/admin-groups/',
    parse: function(results) {
      this.paging = {
        pages: results.pages,
        items: results.items
      };
      this.filters = results.filters;
      
      return results.data;
    }
  });
  
  app.Filter = Backbone.Model.extend({
    defaults: {
      name: '',
      sort: '',
      limit: ''
    }
  });
  
  app.Paging = Backbone.Model.extend({
    defaults: {
      pages: {},
      items: {}
    }
  });



/**
 * VIEWS
 **/
  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress input[type="text"]': 'addNewOnEnter',
      'click .btn-add': 'addNew'
    },
    initialize: function() {
      this.model = new app.Record();
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      this.$el.html( this.template(this.model.toJSON()) );
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    addNewOnEnter: function(event) {
      if (event.keyCode != 13) return;
      event.preventDefault();
      this.addNew(event);
    },
    addNew: function() {
      if (this.$el.find('[name="name"]').val() == '') {
        alert('Please enter a name.');
      }
      else {
        this.model.set({ name: this.$el.find('[name="name"]').val() });
        this.model.save(undefined, {
          success: function(model, response, options) {
            if (response.success) {
              location.href = model.urlRoot + response.record._id +'/';
            }
            else {
              response.errors.length > 0 ? alert(response.errors[0]) : alert(response.errfor.name);
            }
          },
          error: function(model, xhr, options) {
            var response = JSON.parse(xhr.responseText);
            alert(response.errors);
          }
        });
      }
    }
  });
  
  app.ResultsView = Backbone.View.extend({
    el: '#results-table',
    template: _.template( $('#tmpl-results-table').html() ),
    initialize: function() {
      this.$el.html(this.template());
      app.resultsView = this;
      
      var results = JSON.parse( $('#data-results').html() );
      this.collection = new app.RecordCollection( results.data );
      this.collection.on('reset', this.render, this);
      
      this.pagingView = new app.PagingView({
        model: new app.Paging({ pages: results.pages, items: results.items })
      });
      this.filterView = new app.FilterView( {model: new app.Filter(results.filters)} );
      
      this.render();
    },
    render: function() {
      $('#results-rows').empty();
      
      this.collection.each(function(record) {
        var view = new app.ResultsRowView({ model: record });
        $('#results-rows').append( view.render().$el );
      }, this);
      
      if (this.collection.length == 0) {
        $('#results-rows').append( $('#tmpl-results-empty-row').html() );
      }
      
      this.pagingView.model.set(this.collection.paging);
      this.filterView.model.set(this.collection.filters);
    }
  });
  
  app.ResultsRowView = Backbone.View.extend({
    tagName: 'tr',
    template: _.template( $('#tmpl-results-row').html() ),
    events: {
      'click .btn-details': 'viewDetails'
    },
    viewDetails: function() {
      location.href = '/admin/admin-groups/'+ this.model.id +'/';
    },
    render: function() {
      this.$el.html( this.template(this.model.toJSON()) );
      return this;
    }
  });
  
  app.FilterView = Backbone.View.extend({
    el: '#filters',
    template: _.template( $('#tmpl-filters').html() ),
    events: {
      'submit form': 'preventSubmit',
      'keypress input[type="text"]': 'filterOnEnter',
      'change select': 'filter'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      var modelData = this.model.toJSON();
      this.$el.html( this.template(modelData) );
      
      //set field values
      for(var key in modelData) {
        this.$el.find('[name="'+ key +'"]').val(modelData[key]);
      }
    },
    preventSubmit: function(event) {
      event.preventDefault();
    },
    filterOnEnter: function(event) {
      if (event.keyCode != 13) return;
      this.filter(event);
    },
    filter: function() {
      var query = $("#filters form").serialize();
      app.resultsView.collection.fetch({data: query});
      Backbone.history.navigate('q/'+ query, false); 
    }
  });
  
  app.PagingView = Backbone.View.extend({
    el: '#results-paging',
    template: _.template( $('#tmpl-results-paging').html() ),
    events: {
      'click .btn-page': 'goToPage'
    },
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.render();
    },
    render: function() {
      if (this.model.get('pages').total > 1) {
        this.$el.html( this.template(this.model.toJSON()) );
        
        if (!this.model.get('pages').hasPrev) {
          this.$el.find('.btn-prev').attr('disabled', 'disabled');
        }
        if (!this.model.get('pages').hasNext) {
          this.$el.find('.btn-next').attr('disabled', 'disabled');
        }
      }
      else {
        this.$el.empty();
      }
      
      return this;
    },
    goToPage: function(event) {
      var query = $("#filters form").serialize() +"&page="+ $(event.target).data('page');
      app.resultsView.collection.fetch({data: query});
      Backbone.history.navigate('q/'+ query, false); 
      var body = $('body').scrollTop(0);
    }
  });
  
  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.headerView = new app.HeaderView();
      app.resultsView = new app.ResultsView();
    }
  });



/**
 * ROUTER
 **/
  app.Router = Backbone.Router.extend({
    routes: {
      '': 'default',
      'q/:params': 'query'
    },
    default: function() {
      if (!app.mainView) app.mainView = new app.MainView();
      
      if (!app.isFirstLoad) {
        app.resultsView.collection.fetch();
      }
      
      app.isFirstLoad = false;
    },
    query: function(params) {
      if (!app.mainView) app.mainView = new app.MainView();
      
      if (params) {
        app.resultsView.collection.fetch({ data: params });
      }
      
      app.isFirstLoad = false;
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.isFirstLoad = true;
    app.router = new app.Router();
    Backbone.history.start();
  });


