exports = module.exports = function(app, mongoose) {
  //general sub docs
  require('./schema/Note')(app, mongoose);
  
  //user system
  require('./schema/User')(app, mongoose);
  require('./schema/Admin')(app, mongoose);
  require('./schema/AdminGroup')(app, mongoose);
  require('./schema/Account')(app, mongoose);
}