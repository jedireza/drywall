'use strict';
// public api
var account = {
  find: function (req, res, next) {
    var outcome = {};

    var getStatusOptions = function (callback) {
      req.app.db.models.Status.find({pivot: 'Account'}, 'name').sort('name').exec(function (err, statuses) {
        if (err) {
          return callback(err, null);
        }

        outcome.statuses = statuses;
        return callback(null, 'done');
      });
    };

    var getResults = function (callback) {
      req.query.search = req.query.search ? req.query.search : '';
      req.query.status = req.query.status ? req.query.status : '';
      req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
      req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
      req.query.sort = req.query.sort ? req.query.sort : '_id';

      var filters = {};
      if (req.query.search) {
        filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
      }

      if (req.query.status) {
        filters['status.id'] = req.query.status;
      }

      req.app.db.models.Account.pagedFind({
        filters: filters,
        keys: 'name company phone zip userCreated status',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
      }, function (err, results) {
        if (err) {
          return callback(err, null);
        }

        outcome.results = results;
        return callback(null, 'done');
      });
    };

    var asyncFinally = function (err, results) {
      if (err) {
        return next(err);
      }

      outcome.results.filters = req.query;
      res.status(200).json(outcome);
    };

    require('async').parallel([getStatusOptions, getResults], asyncFinally);
  },

  create: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body['name.full']) {
        workflow.outcome.errors.push('Please enter a name.');
        return workflow.emit('response');
      }

      workflow.emit('createAccount');
    });

    workflow.on('createAccount', function() {
      var nameParts = req.body['name.full'].trim().split(/\s/);
      var fieldsToSet = {
        name: {
          first: nameParts.shift(),
          middle: (nameParts.length > 1 ? nameParts.shift() : ''),
          last: (nameParts.length === 0 ? '' : nameParts.join(' '))
        },
        userCreated: {
          id: req.user._id,
          name: req.user.username,
          time: new Date().toISOString()
        }
      };
      fieldsToSet.name.full = fieldsToSet.name.first + (fieldsToSet.name.last ? ' '+ fieldsToSet.name.last : '');
      fieldsToSet.search = [
        fieldsToSet.name.first,
        fieldsToSet.name.middle,
        fieldsToSet.name.last
      ];

      req.app.db.models.Account.create(fieldsToSet, function(err, account) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = account;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }
};
module.exports = account;