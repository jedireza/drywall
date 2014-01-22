'use strict';

exports.find = function(req, res, next){
  req.query.name = req.query.name ? req.query.name : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';

  var filters = {};
  if (req.query.name) {
    filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
  }

  req.app.db.models.AccountGroup.pagedFind({
    filters: filters,
    keys: 'name',
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
      res.render('admin/account-groups/index', { data: { results: escape(JSON.stringify(results)) } });
    }
  });
};

exports.read = function(req, res, next){
  req.app.db.models.AccountGroup.findById(req.params.id).exec(function(err, accountGroup) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(accountGroup);
    }
    else {
      res.render('admin/account-groups/details', { data: { record: escape(JSON.stringify(accountGroup)) } });
    }
  });
};

exports.create = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create account groups.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errors.push('Please enter a name.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateAccountGroupCheck');
  });

  workflow.on('duplicateAccountGroupCheck', function() {
    req.app.db.models.AccountGroup.findById(req.app.utility.slugify(req.body.name)).exec(function(err, accountGroup) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (accountGroup) {
        workflow.outcome.errors.push('That group already exists.');
        return workflow.emit('response');
      }

      workflow.emit('createAccountGroup');
    });
  });

  workflow.on('createAccountGroup', function() {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.name),
      name: req.body.name
    };

    req.app.db.models.AccountGroup.create(fieldsToSet, function(err, accountGroup) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = accountGroup;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update account groups.');
      return workflow.emit('response');
    }

    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchAccountGroup');
  });

  workflow.on('patchAccountGroup', function() {
    var fieldsToSet = {
      name: req.body.name
    };

    req.app.db.models.AccountGroup.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, accountGroup) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.accountGroup = accountGroup;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.permissions = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not change the permissions of account groups.');
      return workflow.emit('response');
    }

    if (!req.body.permissions) {
      workflow.outcome.errfor.permissions = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchAccountGroup');
  });

  workflow.on('patchAccountGroup', function() {
    var fieldsToSet = {
      permissions: req.body.permissions
    };

    req.app.db.models.AccountGroup.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, accountGroup) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.accountGroup = accountGroup;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete account groups.');
      return workflow.emit('response');
    }

    workflow.emit('deleteAccountGroup');
  });

  workflow.on('deleteAccountGroup', function(err) {
    req.app.db.models.AccountGroup.findByIdAndRemove(req.params.id, function(err, accountGroup) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
