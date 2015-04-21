'use strict';
// public api
var status = {
  find: function(req, res, next){
    req.query.pivot = req.query.pivot ? req.query.pivot : '';
    req.query.name = req.query.name ? req.query.name : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.pivot) {
      filters.pivot = new RegExp('^.*?'+ req.query.pivot +'.*$', 'i');
    }

    if (req.query.name) {
      filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
    }

    req.app.db.models.Status.pagedFind({
      filters: filters,
      keys: 'pivot name',
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

  read: function(req, res, next){
    req.app.db.models.Status.findById(req.params.id).exec(function(err, status) {
      if (err) {
        return next(err);
      }
      res.status(200).json(status);
    });
  },

  create: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not create statuses.');
        return workflow.emit('response');
      }

      if (!req.body.pivot) {
        workflow.outcome.errors.push('A pivot is required.');
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errors.push('A name is required.');
        return workflow.emit('response');
      }

      workflow.emit('duplicateStatusCheck');
    });

    workflow.on('duplicateStatusCheck', function() {
      req.app.db.models.Status.findById(req.app.utility.slugify(req.body.pivot +' '+ req.body.name)).exec(function(err, status) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (status) {
          workflow.outcome.errors.push('That status+pivot is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createStatus');
      });
    });

    workflow.on('createStatus', function() {
      var fieldsToSet = {
        _id: req.app.utility.slugify(req.body.pivot +' '+ req.body.name),
        pivot: req.body.pivot,
        name: req.body.name
      };

      req.app.db.models.Status.create(fieldsToSet, function(err, status) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = status;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  update: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not update statuses.');
        return workflow.emit('response');
      }

      if (!req.body.pivot) {
        workflow.outcome.errfor.pivot = 'required';
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errfor.name = 'required';
        return workflow.emit('response');
      }

      workflow.emit('duplicateStatusCheck');
    });

    workflow.on('duplicateStatusCheck', function() {
      req.app.db.models.Status.findById(req.app.utility.slugify(req.body.pivot +' '+ req.body.name)).exec(function(err, status) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (status && status._id !== req.params.id ) {
          workflow.outcome.errors.push('That status+pivot is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('patchStatus');
      });
    });

    workflow.on('patchStatus', function() {
      var fieldsToSet = {
        pivot: req.body.pivot,
        name: req.body.name
      };
      var options = { new: true };

      req.app.db.models.Status.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, status) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.status = status;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  delete: function(req, res, next){
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not delete statuses.');
        return workflow.emit('response');
      }

      workflow.emit('deleteStatus');
    });

    workflow.on('deleteStatus', function(err) {
      req.app.db.models.Status.findByIdAndRemove(req.params.id, function(err, status) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }
};
module.exports = status;