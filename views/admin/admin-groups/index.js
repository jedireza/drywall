exports.find = function(req, res, next){
  //defaults
  req.query.name = req.query.name ? req.query.name : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';
  
  //filters
  var filters = {};
  if (req.query.name) filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
  
  //get results
  res.app.db.models.AdminGroup.pagedFind({
    filters: filters,
    keys: 'name',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
  }, function(err, results) {
    if (err) {
      res.send(500, 'Model pagedFind error. '+ err);
      return;
    }
    
    if (req.header('x-requested-with') == 'XMLHttpRequest') {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('admin/admin-groups/index', { data: {results: JSON.stringify(results)} });
    }
  });
};



exports.read = function(req, res, next){
  res.app.db.models.AdminGroup.findOne({ _id: req.params.id }).populate('user', 'username').exec(function(err, account) {
    if (err) {
      res.send(500, 'Model findOne error. '+ err);
      return;
    }
    
    if (req.header('x-requested-with') == 'XMLHttpRequest') {
      res.send(account);
    }
    else {
      res.render('admin/admin-groups/details', {
        data: {
          record: JSON.stringify(account)
        }
      });
    }
  });
};



exports.create = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create admin groups.');
      return workflow.emit('response');
    }
    
    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response')
    }
    
    workflow.emit('duplicateAdminGroupCheck');
  });
  
  workflow.on('duplicateAdminGroupCheck', function() {
    res.app.db.models.AdminGroup.findOne({ name: req.body.name }, function(err, adminGroup) {
      if (err) return workflow.emit('exception', err);
      
      if (adminGroup) {
        workflow.outcome.errors.push('That group name is already taken.');
        return workflow.emit('response');
      }
      
      workflow.emit('createAdminGroup');
    });
  });
  
  workflow.on('createAdminGroup', function() {
    var fieldsToSet = {
      name: req.body.name
    };
    
    res.app.db.models.AdminGroup.create(fieldsToSet, function(err, group) {
      if (err) return workflow.emit('exception', err);
      
      workflow.outcome.record = group;
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.update = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update admin groups.');
      return workflow.emit('response');
    }
    
    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response');
    }
    
    workflow.emit('patchAdminGroup');
  });
  
  workflow.on('patchAdminGroup', function() {
    var fieldsToSet = {
      name: req.body.name
    };
    
    req.app.db.models.AdminGroup.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, adminGroup) {
      if (err) return workflow.emit('exception', err);
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.permissions = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not change the permissions of admin groups.');
      return workflow.emit('response');
    }
    
    if (!req.body.permissions) {
      workflow.outcome.errfor.permissions = 'required';
      return workflow.emit('response')
    }
    
    workflow.emit('patchAdminGroup');
  });
  
  workflow.on('patchAdminGroup', function() {
    var fieldsToSet = {
      permissions: req.body.permissions
    };
    
    req.app.db.models.AdminGroup.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, adminGroup) {
      if (err) return workflow.emit('exception', err);
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.delete = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete admin groups.');
      return workflow.emit('response');
    }
    
    workflow.emit('deleteAdminGroup');
  });
  
  workflow.on('deleteAdminGroup', function(err) {
    req.app.db.models.AdminGroup.findByIdAndRemove(req.params.id, function(err, adminGroup) {
        if (err) return workflow.emit('exception', err);
        workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};