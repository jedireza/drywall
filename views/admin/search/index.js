exports.find = function(req, res, next){
  //defaults
  req.query.q = req.query.q ? req.query.q : '';
  var regexQuery = new RegExp('^.*?'+ req.query.q +'.*$', 'i');
  
  //results container
  var outcome = {};
  
  var searchUsers = function(callback) {
    req.app.db.models.User.find({search: regexQuery}, 'username').sort('username').limit(10).lean().exec(function(err, results) {
      if (err) return callback(err, null);
      outcome.users = results;
      callback(null, 'done');
    });
  };
  
  var searchAccounts = function(callback) {
    req.app.db.models.Account.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) callback(err, null);
      outcome.accounts = results;
      return callback(null, 'done');
    });
  };
  
  var searchAdministrators = function(callback) {
    req.app.db.models.Admin.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) callback(err, null);
      outcome.administrators = results;
      return callback(null, 'done');
    });
  };
  
  var asyncFinally = function(err, results) {
    if (err) return next(err);
    
    res.send(outcome);
  };
  
  require('async').parallel([searchUsers, searchAccounts, searchAdministrators], asyncFinally);
};