exports.find = function(req, res, next){
  //defaults
  req.query.q = req.query.q ? req.query.q : '';
  var regexQuery = new RegExp('^.*?'+ req.query.q +'.*$', 'i');
  
  //results
  var outcome = {};
  
  var searchUsers = function(callback) {
    res.app.db.models.User.find({username: regexQuery}, 'username').sort('username').limit(10).lean().exec(function(err, results) {
      if (err) return callback(err, null);
      outcome.users = results;
      callback(null, 'done searching users');
    });
  };
  
  var searchAccounts = function(callback) {
    res.app.db.models.Account.find({'name.full': regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) callback(err, null);
      outcome.accounts = results;
      return callback(null, 'done searching users');
    });
  };
  
  var searchAdministrators = function(callback) {
    res.app.db.models.Admin.find({'name.full': regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function(err, results) {
      if (err) callback(err, null);
      outcome.administrators = results;
      return callback(null, 'done searching users');
    });
  };
  
  //render templates
  var searches = [searchUsers, searchAccounts, searchAdministrators];
  require('async').parallel(searches, function(err, results){
    if (err) {
      res.send(500, 'Exception: '+ err);
      return;
    }
    
    res.send(outcome);
  });
};