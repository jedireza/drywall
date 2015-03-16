'use strict';

exports = module.exports = function(app, db) {
  db.models = {};

  var associateAndSync = function(model){
    model.associate(db.models);
    model.sync().then(function() {console.log("Synced ", model.name)});
  };

  db.models["User"] = require('./schema/User')(app, db);
  associateAndSync(db.models.User); 
  db.models["Note"] = require('./schema/Note')(app, db);
  associateAndSync(db.models.Note); // needs User before associate
  db.models["Account"] = require('./schema/Account')(app, db);
  associateAndSync(db.models.Account); 
  db.models.User.hasOne(db.models.Account, {foreignKey: 'user_id'});
  db.models["Admin"] = require('./schema/Admin')(app, db);
  associateAndSync(db.models.Admin); 
  db.models["AdminGroup"] = require('./schema/AdminGroup')(app, db);
  associateAndSync(db.models.AdminGroup); 
  db.models.Admin.hasMany(db.models.AdminGroup, {foreignKey: 'admin_id'});
  db.models.User.hasOne(db.models.Account, {foreignKey: 'user_id'});
  db.models.User.hasOne(db.models.Admin, {foreignKey: 'user_id'});

  // require('./schema/Admin')(app, db);
  // require('./schema/AdminGroup')(app, db);
  // require('./schema/Account')(app, db);
  // require('./schema/LoginAttempt')(app, db);


  // require('./schema/Status')(app, db);
  // require('./schema/StatusLog')(app, db);
  // require('./schema/Category')(app, db);
}; 