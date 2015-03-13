'use strict';

exports = module.exports = function(app, db) {
  db.models = {};

  var associateAndSync = function(model){
    model.associate(db.models);
    model.sync().then(function() {console.log("Synced ", model.name)});
  };

  db.models["User"] = require('./schema/User')(app, db);
  associateAndSync(db.models.User); 
  // require('./schema/Admin')(app, db);
  // require('./schema/AdminGroup')(app, db);
  // require('./schema/Account')(app, db);
  // require('./schema/LoginAttempt')(app, db);

  db.models["Note"] = require('./schema/Note')(app, db);
  associateAndSync(db.models.Note); // needs User before associate
  // require('./schema/Status')(app, db);
  // require('./schema/StatusLog')(app, db);
  // require('./schema/Category')(app, db);
}; 