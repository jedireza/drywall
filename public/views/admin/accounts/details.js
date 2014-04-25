/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Account = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/accounts/'+ this.id +'/';
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
      return '/admin/accounts/'+ app.mainView.model.id +'/';
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
      last: '',
      company: '',
      phone: '',
      zip: ''
    },
    url: function() {
      return '/admin/accounts/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
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
      return '/admin/accounts/'+ app.mainView.model.id +'/user/';
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
      }

      return response;
    }
  });

  app.Note = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      data: '',
      userCreated: {}
    },
    url: function() {
      return '/admin/accounts/'+ app.mainView.model.id +'/notes/'+ (this.isNew() ? '' : this.id +'/');
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
      }

      return response;
    }
  });

  app.NoteCollection = Backbone.Collection.extend({
    model: app.Note
  });

  app.Status = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      status: '',
      name: '',
    },
    url: function() {
      return '/admin/accounts/'+ app.mainView.model.id +'/status/'+ (this.isNew() ? '' : this.id +'/');
    },
    parse: function(response) {
      if (response.account) {
        app.mainView.model.set(response.account);
        delete response.account;
      }

      return response;
    }
  });

  app.StatusCollection = Backbone.Collection.extend({
    model: app.Status
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
        last: app.mainView.model.get('name').last,
        company: app.mainView.model.get('company'),
        phone: app.mainView.model.get('phone'),
        zip: app.mainView.model.get('zip')
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
        last: this.$el.find('[name="last"]').val(),
        company: this.$el.find('[name="company"]').val(),
        phone: this.$el.find('[name="phone"]').val(),
        zip: this.$el.find('[name="zip"]').val()
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
              location.href = '/admin/accounts/';
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
            if (response.account) {
              app.mainView.model.set(response.account);
              delete response.account;
            }

            app.loginView.model.set(response);
          }
        });
      }
    }
  });

  app.NewNoteView = Backbone.View.extend({
    el: '#notes-new',
    template: _.template( $('#tmpl-notes-new').html() ),
    events: {
      'click .btn-add': 'addNew'
    },
    initialize: function() {
      this.model = new app.Note();
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html( this.template(this.model.attributes) );
    },
    validates: function() {
      var errors = [];
      if (this.$el.find('[name="data"]').val() === '') {
        errors.push('Please enter some notes.');
      }

      if (errors.length > 0) {
        this.model.set({ errors: errors });
        return false;
      }

      return true;
    },
    addNew: function() {
      if (this.validates()) {
        this.model.save({
          data: this.$el.find('[name="data"]').val()
        });
      }
    }
  });

  app.NoteCollectionView = Backbone.View.extend({
    el: '#notes-collection',
    template: _.template( $('#tmpl-notes-collection').html() ),
    initialize: function() {
      this.collection = new app.NoteCollection();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.collection, 'reset', this.render);
      this.render();
    },
    syncUp: function() {
      this.collection.reset(app.mainView.model.get('notes'));
    },
    render: function() {
      this.$el.html(this.template());

      var frag = document.createDocumentFragment();
      var last = document.createTextNode('');
      frag.appendChild(last);
      this.collection.each(function(model) {
        var view = new app.NotesItemView({ model: model });
        var newEl = view.render().el;
        frag.insertBefore(newEl, last);
        last = newEl;
      }, this);
      $('#notes-items').append(frag);

      if (this.collection.length === 0) {
        $('#notes-items').append( $('#tmpl-notes-none').html() );
      }
    }
  });

  app.NotesItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'note',
    template: _.template( $('#tmpl-notes-item').html() ),
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      this.$el.find('.timeago').each(function(index, indexValue) {
        if (indexValue.innerText) {
          var myMoment = moment(indexValue.innerText);
          indexValue.innerText = myMoment.from();
        }
      });
      return this;
    }
  });

  app.NewStatusView = Backbone.View.extend({
    el: '#status-new',
    template: _.template( $('#tmpl-status-new').html() ),
    events: {
      'click .btn-add': 'addNew'
    },
    initialize: function() {
      this.model = new app.Status();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        id: app.mainView.model.get('status').id,
        name: app.mainView.model.get('status').name
      });
    },
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      if (app.mainView.model.get('status') && app.mainView.model.get('status').id) {
        this.$el.find('[name="status"]').val(app.mainView.model.get('status').id);
      }
    },
    validates: function() {
      var errors = [];
      if (this.$el.find('[name="status"]').val() === '') {
        errors.push('Please choose a status.');
      }

      if (this.$el.find('[name="status"]').val() === app.mainView.model.get('status').id) {
        errors.push('That is the current status.');
      }

      if (errors.length > 0) {
        this.model.set({ errors: errors });
        return false;
      }

      return true;
    },
    addNew: function() {
      if (this.validates()) {
        this.model.save({
          id: this.$el.find('[name="status"]').val(),
          name: this.$el.find('[name="status"] option:selected').text()
        });
      }
    }
  });

  app.StatusCollectionView = Backbone.View.extend({
    el: '#status-collection',
    template: _.template( $('#tmpl-status-collection').html() ),
    initialize: function() {
      this.collection = new app.StatusCollection();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.collection, 'reset', this.render);
      this.render();
    },
    syncUp: function() {
      this.collection.reset(app.mainView.model.get('statusLog'));
    },
    render: function() {
      this.$el.html( this.template() );

      var frag = document.createDocumentFragment();
      var last = document.createTextNode('');
      frag.appendChild(last);
      this.collection.each(function(model) {
        var view = new app.StatusItemView({ model: model });
        var newEl = view.render().el;
        frag.insertBefore(newEl, last);
        last = newEl;
      }, this);
      $('#status-items').append(frag);
    }
  });

  app.StatusItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'status',
    template: _.template( $('#tmpl-status-item').html() ),
    render: function() {
      this.$el.html( this.template(this.model.attributes) );

      this.$el.find('.timeago').each(function(index, indexValue) {
        if (indexValue.innerText) {
          var myMoment = moment(indexValue.innerText);
          indexValue.innerText = myMoment.from();
        }
      });
      return this;
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Account( JSON.parse( unescape($('#data-record').html()) ) );

      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
      app.loginView = new app.LoginView();
      app.newNoteView = new app.NewNoteView();
      app.notesCollectionView = new app.NoteCollectionView();
      app.newStatusView = new app.NewStatusView();
      app.statusCollectionView = new app.StatusCollectionView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
