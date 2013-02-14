exports = module.exports = function(app, passport) {
  var passportLocalStrategy = require('passport-local').Strategy;
  passport.use(new passportLocalStrategy(
    function(username, password, done) {
      //lookup conditions
      var conditions = { isActive: 'yes' };
      if (username.indexOf('@') === -1) {
        conditions.username = username;
      }
      else {
        conditions.email = username;
      }
      
      app.db.models.User.findOne(conditions, function(err, user) {
        if (err) return done(err);
        
        if (!user) return done(null, false, { message: 'Unknown user' });
        
        //validate password
        var encryptedPassword = app.db.models.User.encryptPassword(password);
        if (user.password != encryptedPassword) {
          return done(null, false, { message: 'Invalid password' });
        }
        
        //we're good
        return done(null, user);
      });
    }
  ));
  
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  
  passport.deserializeUser(function(id, done) {
    app.db.models.User.findOne({ _id: id }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (user.roles && user.roles.admin) {
        user.roles.admin.populate("groups", function(err, admin) {
          user.roles.admin = admin;
          done(err, user);
        });
      }
      else {
        done(err, user);
      }
    });
  });
}