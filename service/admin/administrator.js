'use strict';
// public api
var administrator = {
  find: function(req, res, next){
    req.query.search = req.query.search ? req.query.search : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.search) {
      filters.search = new RegExp('^.*?'+ req.query.search +'.*$', 'i');
    }

    req.app.db.models.Admin.pagedFind({
      filters: filters,
      keys: 'name.full',
      limit: req.query.limit,
      page: req.query.page,
      sort: req.query.sort
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      results.filters = req.query;
      res.status(200).json(results);
    });
  },

  create: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.body['name.full']) {
        workflow.outcome.errors.push('Please enter a name.');
        return workflow.emit('response');
      }

      workflow.emit('createAdministrator');
    });

    workflow.on('createAdministrator', function() {
      var nameParts = req.body['name.full'].trim().split(/\s/);
      var fieldsToSet = {
        name: {
          first: nameParts.shift(),
          middle: (nameParts.length > 1 ? nameParts.shift() : ''),
          last: (nameParts.length === 0 ? '' : nameParts.join(' '))
        }
      };
      fieldsToSet.name.full = fieldsToSet.name.first + (fieldsToSet.name.last ? ' '+ fieldsToSet.name.last : '');
      fieldsToSet.search = [
        fieldsToSet.name.first,
        fieldsToSet.name.middle,
        fieldsToSet.name.last
      ];

      req.app.db.models.Admin.create(fieldsToSet, function(err, admin) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = admin;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }
};
module.exports = administrator;