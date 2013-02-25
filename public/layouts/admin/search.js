/**
 * SETUP
 **/
  var app = app || {};



/**
 * MODELS
 **/
  app._SearchResult = Backbone.Model.extend({
    defaults: {
      _id: undefined,
      name: '---',
      url: '---',
      type: 'result'
    }
  });
  
  app._SearchCollection = Backbone.Collection.extend({
    model: app._SearchResult,
    url: '/admin/search/',
    parse: function(response) {
      var outcome = [];
      
      if (response.users.length) outcome.push({name: 'Users', type: 'header'});
      _.each(response.users, function(user) {
        outcome.push({name: user.username, url: '/admin/users/'+ user._id +'/'});
      });
      
      if (response.accounts.length) outcome.push({name: 'Accounts', type: 'header'});
      _.each(response.accounts, function(account) {
        outcome.push({name: account.name.full, url: '/admin/accounts/'+ account._id +'/'});
      });
      
      if (response.administrators.length) outcome.push({name: 'Administrators', type: 'header'});
      _.each(response.administrators, function(administrator) {
        outcome.push({name: administrator.name.full, url: '/admin/administrators/'+ administrator._id +'/'});
      });
      
      return outcome;
    }
  });



/**
 * VIEWS
 **/
  app._SearchView = Backbone.View.extend({
    el: '#_search',
    template: _.template( $('#tmpl-_search').html() ),
    events: {
      'keydown .search-query': 'startKeyBuffer'
    },
    timeLastKeyPressed: undefined,
    lastTimeoutID: undefined,
    selectedResult: undefined,
    startKeyBuffer: function(event) {
      app._searchView.timeLastKeyPressed = (new Date());
      
      //handle esc
      if (event.keyCode == 27) {
        this.clearResults();
        return;
      }
      
      //handle enter
      if (event.keyCode == 13) {
        if (this.selectedResult != undefined) {
          var url = this.$el.find('li.active a').attr('href')
          if (url) location.href = url;
        }
        return false;
      }
      
      //handle up and down
      if (event.keyCode == 38 || event.keyCode == 40) {
        this.navigateResults(event);
        return false;
      }
      
      //ignore non-alphanumeric, except backspace
      if (!/[a-zA-Z0-9-_ ]/.test(String.fromCharCode(event.keyCode)) && event.keyCode != 8) {
        return;
      }
      
      this.keyBuffer();
    },
    keyBuffer: function() {
      //only run search after 333 milliseconds have passed
      if (((new Date()) - app._searchView.timeLastKeyPressed) / 1000 >= 0.333) {
        app._searchView.runSearch();
      }
      else {
        //cancel the last timeout?
        if (app._searchView.lastTimeoutID) {
          clearTimeout(app._searchView.lastTimeoutID);
        }
        
        //call back in 100 milliseconds
        app._searchView.lastTimeoutID = setTimeout(app._searchView.keyBuffer, 50);
      }
    },
    runSearch: function() {
      var query = this.$el.find('.search-query').val();
      if (!query) {
        this.clearResults();
        return;
      }
      
      this.collection.fetch({ data: {q: query} });
    },
    navigateResults: function(event) {
      //navigable results
      var arrLinkResults = this.$el.find('li a').get();
      
      //up or down
      var movingUp = (event.keyCode == 38);
      var movingDown = (event.keyCode == 40);
      
      if (this.selectedResult == undefined && this.$el.find('li a').get(0)) {
        this.selectedResult = -1;
      }
      
      //moving up
      if (movingUp && this.selectedResult == 0) {
        this.selectedResult = arrLinkResults.length - 1;
      }
      else if (movingUp) {
        this.selectedResult -= 1;
      }
      
      //moving down
      if (movingDown && this.selectedResult == (arrLinkResults.length - 1)) {
        this.selectedResult = 0;
      }
      else if (movingDown) {
        this.selectedResult += 1;
      }
      
      if (this.selectedResult > arrLinkResults.length) this.selectedResult = 0;
      if (arrLinkResults.length == 0) this.selectedResult = undefined;
      
      //select the result
      this.selectResult();
    },
    selectResult: function() {
      if (this.selectedResult != undefined) {
        this.$el.find('li a').closest('li').attr('class', '');
        this.$el.find('li a:eq('+ this.selectedResult +')').closest('li').attr('class', 'active');
      }
    },
    clearResults: function() {
      this.$el.find('.search-query').val('');
      this.$el.find('.dropdown').removeClass('open');
      this.$el.find('#_search-results-rows').html('');
      this.selectedResult = undefined;
    },
    initialize: function() {
      this.collection = new app._SearchCollection();
      this.collection.on('reset', this.render, this);
      this.$el.html(this.template());
      this.render();
    },
    render: function() {
      if (this.$el.find('.search-query').val() == '') {
        this.$el.find('.dropdown').removeClass('open');
      }
      else {
        this.$el.find('.dropdown').addClass('open');
      }
      
      $('#_search-results-rows').empty();
      
      this.collection.each(function(record) {
        var view = new app._SearchResultView({ model: record });
        $('#_search-results-rows').append( view.render().$el );
      }, this);
      
      if (this.collection.length == 0) {
        $('#_search-results-rows').append( $('#tmpl-_search-results-empty-row').html() );
      }
    }
  });
  
  app._SearchResultView = Backbone.View.extend({
    tagName: 'li',
    template: _.template( $('#tmpl-_search-results-row').html() ),
    events: {
      'click .btn-details': 'goTo'
    },
    goTo: function() {
      location.href = this.model.get('url');
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
      if (this.model.get('type') == 'header') {
        this.$el.addClass('nav-header');
      }
      return this;
    }
  });



/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app._searchView = new app._SearchView();
  });


