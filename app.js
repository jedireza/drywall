//dependencies
var express = require('express')
  , mongoStore = require('connect-mongo')(express)
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , mongoose = require('mongoose')
;

//create express app
var app = express();

//setup mongoose
app.db = mongoose.createConnection('localhost', 'drywall');
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  console.log('mongoose open for business');
});

//config data models
require('./models')(app, mongoose);

//config passport
require('./passport')(app, passport);

//config all
app.configure(function(){
  //settings
  app.disable('x-powered-by');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('strict routing', true);
  app.set('project-name', 'Drywall.js');
  app.set('company-name', 'Acme, Inc.');
  app.set('admin-email', 'your@email.addy');
  app.set('email-from-name', app.get('project-name')+ ' Website');
  app.set('email-from-address', 'from@email.addy');
  app.set('email-credentials', {
    user: 'username',
    password: 'password',
    host: 'mail.email.addy',
    ssl: true
  });
  
  //middleware
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ 
    secret: 'Sup3rS3cr3tK3y',
    store: new mongoStore({ db: 'drywall', host: 'localhost' })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  
  //locals
  app.locals.projectName = app.get('project-name');
  app.locals.copyrightYear = new Date().getFullYear();
  app.locals.copyrightName = app.get('company-name');
});

//config dev
app.configure('development', function(){
  app.use(express.errorHandler());
});

//route requests
require('./routes')(app);

//utilities
require('./utilities')(app);

//listen up
http.createServer(app).listen(app.get('port'), function(){
  console.log('express server listening on port ' + app.get('port'));
});
