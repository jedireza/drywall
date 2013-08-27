'use strict';

//dependencies
var express = require('express'),
    mongoStore = require('connect-mongo')(express),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    mongoose = require('mongoose');

//create express app
var app = express();

//mongo uri
app.set('mongodb-uri', process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/drywall');

//setup mongoose
app.db = mongoose.createConnection(app.get('mongodb-uri'));
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//config all
app.configure(function(){
  //settings
  app.disable('x-powered-by');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('strict routing', true);
  app.set('project-name', 'Drywall');
  app.set('company-name', 'Acme, Inc.');
  app.set('admin-email', 'your@email.addy');
  app.set('crypto-key', process.env.CRYPTO_KEY || 'k3yb0ardc4t');
  app.set('require-account-verification', false);
  
  //email (smtp) settings
  app.set('email-from-name', app.get('project-name')+ ' Website');
  app.set('email-from-address', 'your@email.addy');
  app.set('email-credentials', {
    user: 'your@email.addy',
    password: process.env.EMAIL_PASSWORD || 'bl4rg!',
    host: 'smtp.gmail.com',
    ssl: true
  });
  
  //twitter settings
  app.set('twitter-oauth-key', process.env.TWITTER_OAUTH_KEY || '');
  app.set('twitter-oauth-secret', process.env.TWITTER_OAUTH_SECRET || '');
  
  //github settings
  app.set('github-oauth-key', process.env.GITHUB_OAUTH_KEY || '');
  app.set('github-oauth-secret', process.env.GITHUB_OAUTH_SECRET || '');
  
  //facebook settings
  app.set('facebook-oauth-key', process.env.FACEBOOK_OAUTH_KEY || '');
  app.set('facebook-oauth-secret', process.env.FACEBOOK_OAUTH_SECRET || '');
  
  //middleware
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: process.env.SESSION_SECRET || 'Sup3rS3cr3tK3y',
    store: new mongoStore({ url: app.get('mongodb-uri') })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  
  //error handler
  app.use(require('./views/http/index').http500);
  
  //locals
  app.locals.projectName = app.get('project-name');
  app.locals.copyrightYear = new Date().getFullYear();
  app.locals.copyrightName = app.get('company-name');
  app.locals.cacheBreaker = 'br34k-01';
});

//config dev
app.configure('development', function(){
  app.use(express.errorHandler());
});

//config passport
require('./passport')(app, passport);

//route requests
require('./routes')(app, passport);

//utilities
require('./utilities')(app);

//listen up
http.createServer(app).listen(app.get('port'), function(){
  //and... we're live
});
