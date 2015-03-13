'use strict';

exports = module.exports = function(app, db) {
  var User = db.sequelize.define('User', {
    username: {type: db.Sequelize.STRING,defaultValue: '', unique: true},
    password: {type: db.Sequelize.STRING},
    email: { type: db.Sequelize.STRING, unique: true },
    isActive: {type: db.Sequelize.STRING},
    resetPasswordToken: {type: db.Sequelize.STRING},
    resetPasswordExpires: {type: db.Sequelize.DATE},
    twitter: {type: db.Sequelize.STRING}, // write JSON blob for now
    github: {type: db.Sequelize.STRING}, // write JSON blob for now
    facebook: {type: db.Sequelize.STRING}, // write JSON blob for now
    google: {type: db.Sequelize.STRING}, // write JSON blob for now
    tumblr: {type: db.Sequelize.STRING} // write JSON blob for now
  }, {
      freezeTableName: true, // Model tableName will be the same as the model name
      classMethods: {
          associate: function(models) {
              //User.hasOne(models.Admin, {foreignKey : 'admin_id'});
              //User.hasOne(models.Account, {foreignKey : 'account_id'});
          },
          canPlayRoleOf: function(role) {
            if (role === "admin" && this.roles.admin) {
              return true;
            }

            if (role === "account" && this.roles.account) {
              return true;
            }

            return false;
          },
          defaultReturnUrl: function() {
            var returnUrl = '/';
            if (this.canPlayRoleOf('account')) {
              returnUrl = '/account/';
            }

            if (this.canPlayRoleOf('admin')) {
              returnUrl = '/admin/';
            }

            return returnUrl;
          }
      }
  });

  User.encryptPassword = function(password, done) {
    var bcrypt = require('bcrypt');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return done(err);
      }

      bcrypt.hash(password, salt, function(err, hash) {
        done(err, hash);
      });
    });
  };
  
  User.validatePassword = function(password, hash, done) {
    var bcrypt = require('bcrypt');
    bcrypt.compare(password, hash, function(err, res) {
      done(err, res);
    });
  };

  return User;
};
