'use strict';

exports.init = function(req, res, next){
  var sigma = {};
  var collections = ['User', 'Account', 'Admin', 'AdminGroup' /*, 'Category', 'Status'*/];
  var queries = [];

  collections.forEach(function(el, i, arr) {
    queries.push(function(done) {
      req.app.db.models[el].findAndCountAll({})
      .catch(function(err){
          return done(err, null);
      })
      .then(function(result){
        sigma['count'+ el] = result.count;
        done(null, el);
      });
    
    });
  });

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    res.render('admin/index', sigma);
  };

  require('async').parallel(queries, asyncFinally);
};
