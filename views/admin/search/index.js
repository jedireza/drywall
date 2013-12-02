'use strict';

exports.find = function(req, res, next){
  req.query.q = req.query.q ? req.query.q : '';
  var regexQuery = new RegExp('^.*?'+ req.query.q +'.*$', 'i');
  var outcome = {};

  var searchUsers = function(done) {
    req.app.db.models.User.find({search: regexQuery}, 'username').sort('username').limit(10).lean().exec(function(err, results) {
      if (err) {
        return done(err, null);
      }

      outcome.users = results;
      done(null, 'searchUsers');
    });
  };

  var searchAccounts = function(done) {
    req.app.db.models.Account.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) {
        return done(err, null);
      }

      outcome.accounts = results;
      return done(null, 'searchAccounts');
    });
  };

  var searchAdministrators = function(done) {
    req.app.db.models.Admin.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) {
        return done(err, null);
      }

      outcome.administrators = results;
      return done(null, 'searchAdministrators');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err, null);
    }

    res.send(outcome);
  };

  require('async').parallel([searchUsers, searchAccounts, searchAdministrators], asyncFinally);
};
