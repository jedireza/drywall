'use strict';

// public api
var user = {
  find: function (req, res, next) {
    req.query.username = req.query.username ? req.query.username : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';
    req.query.isActive = req.query.isActive ? req.query.isActive : '';
    req.query.roles = req.query.roles ? req.query.roles : '';

    var filters = {};
    if (req.query.username) {
      filters.username = new RegExp('^.*?' + req.query.username + '.*$', 'i');
    }

    if (req.query.isActive) {
      filters.isActive = req.query.isActive;
    }

    if (req.query.roles && req.query.roles === 'admin') {
      filters['roles.admin'] = {$exists: true};
    }

    if (req.query.roles && req.query.roles === 'account') {
      filters['roles.account'] = {$exists: true};
    }

    req.app.db.models.User.pagedFind({
      filters: filters,
      keys: 'username email isActive',
      limit: req.query.limit,
      page: req.query.page,
      sort: req.query.sort
    }, function (err, results) {
      if (err) {
        return next(err);
      }
      results.filters = req.query;
      res.status(200).json(results);
    });
  },
  create: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.body.username) {
        workflow.outcome.errors.push('Please enter a username.');
        return workflow.emit('response');
      }

      if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
        workflow.outcome.errors.push('only use letters, numbers, -, _');
        return workflow.emit('response');
      }

      workflow.emit('duplicateUsernameCheck');
    });

    workflow.on('duplicateUsernameCheck', function () {
      req.app.db.models.User.findOne({username: req.body.username}, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (user) {
          workflow.outcome.errors.push('That username is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createUser');
      });
    });

    workflow.on('createUser', function () {
      var fieldsToSet = {
        username: req.body.username,
        search: [
          req.body.username
        ]
      };
      req.app.db.models.User.create(fieldsToSet, function (err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = user;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = user;