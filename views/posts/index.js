'use strict';

exports.find = function(req, res, next){
  req.query.pivot = req.query.pivot ? req.query.pivot : '';
  req.query.title = req.query.title ? req.query.title : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '-userCreated.time';

  var filters = {};
  if (req.query.pivot) {
    filters.pivot = new RegExp('^.*?'+ req.query.pivot +'.*$', 'i');
  }

  if (req.query.title) {
    filters.title = new RegExp('^.*?'+ req.query.title +'.*$', 'i');
  }

  req.app.db.models.Post.pagedFind({
    filters: filters,
    keys: 'pivot title content userCreated',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('posts/index', { data: { results: escape(JSON.stringify(results)) } });
    }
  });
};

exports.read = function(req, res, next){
  req.app.db.models.Post.findById(req.params.id).exec(function(err, post) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(post);
    }
    else {
      res.render('posts/details', { data: { record: escape(JSON.stringify(post)) } });
    }
  });
};

