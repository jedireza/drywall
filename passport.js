exports = module.exports = function(app, passport) {
  var passportLocalStrategy = require('passport-local').Strategy;
  passport.use(new passportLocalStrategy(
    function(username, password, done) {
      app.db.models.User.findOne({ username: username, isActive: 'yes' }, function(err, user) {
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
      /* 
       * TODO:
       * when mongoose supports calling populate on embedded documents,
       * we can change this code and stop using the '_groups' hack since
       * assigning direcly to 'groups' doesn't stick right now
       * https://github.com/LearnBoost/mongoose/issues/601
       *
       */
      
      if (user.roles && user.roles.admin && user.roles.admin.groups) {
        app.db.models.AdminGroup.find({ _id: {$in: user.roles.admin.groups} }).exec(function(err, groups) {
          user.roles.admin._groups = groups;
          done(err, user);
        });
      }
      else {
        done(err, user);
      }
    });
  });
}