'use strict';
// public api
var group = {
  find: function(req, res, next){
    req.query.name = req.query.name ? req.query.name : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.name) {
      filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
    }

    req.app.db.models.AdminGroup.pagedFind({
      filters: filters,
      keys: 'name',
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
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not create admin groups.');
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errors.push('Please enter a name.');
        return workflow.emit('response');
      }

      workflow.emit('duplicateAdminGroupCheck');
    });

    workflow.on('duplicateAdminGroupCheck', function() {
      req.app.db.models.AdminGroup.findById(req.app.utility.slugify(req.body.name)).exec(function(err, adminGroup) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (adminGroup) {
          workflow.outcome.errors.push('That group already exists.');
          return workflow.emit('response');
        }

        workflow.emit('createAdminGroup');
      });
    });

    workflow.on('createAdminGroup', function() {
      var fieldsToSet = {
        _id: req.app.utility.slugify(req.body.name),
        name: req.body.name
      };

      req.app.db.models.AdminGroup.create(fieldsToSet, function(err, adminGroup) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = adminGroup;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = group;