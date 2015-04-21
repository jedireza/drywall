'use strict';
// public api
var category = {
  find: function (req, res, next) {
    req.query.pivot = req.query.pivot ? req.query.pivot : '';
    req.query.name = req.query.name ? req.query.name : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.pivot) {
      filters.pivot = new RegExp('^.*?' + req.query.pivot + '.*$', 'i');
    }
    if (req.query.name) {
      filters.name = new RegExp('^.*?' + req.query.name + '.*$', 'i');
    }

    req.app.db.models.Category.pagedFind({
      filters: filters,
      keys: 'pivot name',
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

  read: function (req, res, next) {
    req.app.db.models.Category.findById(req.params.id).exec(function (err, category) {
      if (err) {
        return next(err);
      }
      res.status(200).json(category);
    });
  },

  create: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not create categories.');
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

      workflow.emit('duplicateCategoryCheck');
    });

    workflow.on('duplicateCategoryCheck', function () {
      req.app.db.models.Category.findById(req.app.utility.slugify(req.body.pivot + ' ' + req.body.name)).exec(function (err, category) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (category) {
          workflow.outcome.errors.push('That category+pivot is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('createCategory');
      });
    });

    workflow.on('createCategory', function () {
      var fieldsToSet = {
        _id: req.app.utility.slugify(req.body.pivot + ' ' + req.body.name),
        pivot: req.body.pivot,
        name: req.body.name
      };

      req.app.db.models.Category.create(fieldsToSet, function (err, category) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.record = category;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  update: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not update categories.');
        return workflow.emit('response');
      }

      if (!req.body.pivot) {
        workflow.outcome.errfor.pivot = 'pivot';
        return workflow.emit('response');
      }

      if (!req.body.name) {
        workflow.outcome.errfor.name = 'required';
        return workflow.emit('response');
      }

      workflow.emit('duplicateCategoryCheck');
    });

    workflow.on('duplicateCategoryCheck', function () {
      req.app.db.models.Category.findById(req.app.utility.slugify(req.body.pivot + ' ' + req.body.name)).exec(function (err, category) {
        if (err) {
          return workflow.emit('exception', err);
        }

        if (category && category._id !== req.params.id) {
          workflow.outcome.errors.push('That category+pivot is already taken.');
          return workflow.emit('response');
        }

        workflow.emit('patchCategory');
      });
    });


    workflow.on('patchCategory', function () {
      var fieldsToSet = {
        pivot: req.body.pivot,
        name: req.body.name
      };
      var options = { new: true };

      req.app.db.models.Category.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, category) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.category = category;
        return workflow.emit('response');
      });
    });

    workflow.emit('validate');
  },

  delete: function (req, res, next) {
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function () {
      if (!req.user.roles.admin.isMemberOf('root')) {
        workflow.outcome.errors.push('You may not delete categories.');
        return workflow.emit('response');
      }

      workflow.emit('deleteCategory');
    });

    workflow.on('deleteCategory', function (err) {
      req.app.db.models.Category.findByIdAndRemove(req.params.id, function (err, category) {
        if (err) {
          return workflow.emit('exception', err);
        }
        workflow.emit('response');
      });
    });

    workflow.emit('validate');
  }

};
module.exports = category;
