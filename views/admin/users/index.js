exports.find = function(req, res, next){
  //defaults
  req.query.username = req.query.username ? req.query.username : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';
  
  //filters
  var filters = {};
  if (req.query.username) filters.username = new RegExp('^.*?'+ req.query.username +'.*$', 'i');
  if (req.query.isActive) filters.isActive = req.query.isActive;
  if (req.query.roles && req.query.roles == 'admin') {
    filters['roles.admin'] = { $exists: true };
  }
  if (req.query.roles && req.query.roles == 'account') {
    filters['roles.account'] = { $exists: true };
  }
  
  //get results
  res.app.db.models.User.pagedFind({
    filters: filters,
    keys: 'username email isActive',
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
      res.render('admin/users/index', { data: {results: JSON.stringify(results)} });
    }
  });
};



exports.read = function(req, res, next){
  res.app.db.models.User.findOne({ _id: req.params.id }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
    if (err) {
      res.send(500, 'Model findOne error. '+ err);
      return;
    }
    
    if (req.header('x-requested-with') == 'XMLHttpRequest') {
      res.send(user);
    }
    else {
      res.render('admin/users/details', {
        data: {
          record: JSON.stringify(user)
        }
      });
    }
  });
};



exports.create = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
      return workflow.emit('response');
    }
    
    if (req.body.username.match(/^[a-zA-Z0-9\-\_]+$/) !== -1) {
      workflow.outcome.errfor.username = 'only use letters, numbers, -, _';
      return workflow.emit('response');
    }
    
    workflow.emit('duplicateUsernameCheck');
  });
  
  workflow.on('duplicateUsernameCheck', function() {
    res.app.db.models.User.findOne({ username: req.body.username }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('createUser');
    });
  });
  
  workflow.on('createUser', function() {
    res.app.db.models.User.create({ username: req.body.username }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      workflow.outcome.record = user;
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
    //defaults
    if (!req.body.isActive) req.body.isActive = 'no';
    
    //verify
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
    workflow.emit('duplicateUsernameCheck');
  });
  
  workflow.on('duplicateUsernameCheck', function() {
    res.app.db.models.User.findOne({ username: req.body.username, _id: {$ne: req.params.id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('duplicateEmailCheck');
    });
  });
  
  workflow.on('duplicateEmailCheck', function() {
    res.app.db.models.User.findOne({ email: req.body.email, _id: {$ne: req.params.id} }, function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errfor.email = 'email already taken';
        return workflow.emit('response');
      }
      
      workflow.emit('patchUser');
    });
  });
  
  workflow.on('patchUser', function() {
    var fieldsToSet = {
      isActive: req.body.isActive,
      username: req.body.username,
      email: req.body.email
    };
    
    req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.password = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.body.newPassword) workflow.outcome.errfor.newPassword = 'required';
    if (!req.body.confirm) workflow.outcome.errfor.confirm = 'required';
    if (req.body.newPassword != req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0 || workflow.outcome.errors.length != 0) {
      return workflow.emit('response');
    }
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    var fieldsToSet = {
      password: req.app.db.models.User.encryptPassword(req.body.newPassword)
    };
    
    req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.newPassword = '';
      workflow.outcome.confirm = '';
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.linkAdmin = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not link users to admins.');
      return workflow.emit('response');
    }
    
    if (!req.body.newAdminId) {
      workflow.outcome.errfor.newAdminId = 'required';
      return workflow.emit('response');
    }
    
    workflow.emit('verifyAdmin');
  });
  
  workflow.on('verifyAdmin', function(callback) {
    res.app.db.models.Admin.findOne({ _id: req.body.newAdminId }).exec(function(err, admin) {
      if (err) return workflow.emit('exception', err);
      
      if (admin.user && admin.user != req.params.id) {
        workflow.outcome.errors.push('Admin is already linked to a different user.');
        return workflow.emit('response');
      }
      
      workflow.admin = admin;
      workflow.emit('duplicateLinkCheck');
    });
  });
  
  workflow.on('duplicateLinkCheck', function(callback) {
    res.app.db.models.User.findOne({ 'roles.admin': req.body.newAdminId, _id: {$ne: req.params.id} }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errors.push('Another user is already linked to that admin.');
        return workflow.emit('response');
      }
      
      workflow.emit('patchUser');
    });
  });
  
  workflow.on('patchUser', function(callback) {
    res.app.db.models.User.findOne({ _id: req.params.id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      user.roles.admin = req.body.newAdminId;
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.roles = user.roles;
        workflow.emit('patchAdmin')
      });
    });
  });
  
  workflow.on('patchAdmin', function() {
    workflow.admin.user = req.params.id;
    workflow.admin.save(function(err, admin) {
      if (err) return workflow.emit('exception', err);
      workflow.emit('finalize');
    });
  });
  
  workflow.on('finalize', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }, 'roles').populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.roles = user.roles;
      workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.unlinkAdmin = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not unlink users from admins.');
      return workflow.emit('response');
    }
    
    if (req.user._id == req.params.id) {
      workflow.outcome.errors.push('You may not unlink yourself from admin.');
      return workflow.emit('response');
    }
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('User was not found.');
        return workflow.emit('response');
      }
      
      var adminId = user.roles.admin;
      user.roles.admin = undefined;
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.roles = user.roles;
        workflow.emit('patchAdmin', adminId);
      });
    });
  });
  
  workflow.on('patchAdmin', function(id) {
    res.app.db.models.Admin.findOne({ _id: id }).exec(function(err, admin) {
      if (err) return workflow.emit('exception', err);
      
      if (!admin) {
        workflow.outcome.errors.push('Admin was not found.');
        return workflow.emit('response');
      }
      
      admin.user = undefined;
      admin.save(function(err, admin) {
        if (err) return workflow.emit('exception', err);
        workflow.emit('finalize');
      });
    });
  });
  
  workflow.on('finalize', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }, 'roles').populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.roles = user.roles;
      workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.linkAccount = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not link users to accounts.');
      return workflow.emit('response');
    }
    
    if (!req.body.newAccountId) {
      workflow.outcome.errfor.newAccountId = 'required';
      return workflow.emit('response');
    }
    
    workflow.emit('verifyAccount');
  });
  
  workflow.on('verifyAccount', function(callback) {
    res.app.db.models.Account.findOne({ _id: req.body.newAccountId }).exec(function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      if (account.user && account.user != req.params.id) {
        workflow.outcome.errors.push('Account is already linked to a different user.');
        return workflow.emit('response');
      }
      
      workflow.account = account;
      workflow.emit('duplicateLinkCheck');
    });
  });
  
  workflow.on('duplicateLinkCheck', function(callback) {
    res.app.db.models.User.findOne({ 'roles.account': req.body.newAccountId, _id: {$ne: req.params.id} }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (user) {
        workflow.outcome.errors.push('Another user is already linked to that account.');
        return workflow.emit('response');
      }
      
      workflow.emit('patchUser');
    });
  });
  
  workflow.on('patchUser', function(callback) {
    res.app.db.models.User.findOne({ _id: req.params.id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      user.roles.account = req.body.newAccountId;
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.roles = user.roles;
        workflow.emit('patchAccount')
      });
    });
  });
  
  workflow.on('patchAccount', function() {
    workflow.account.user = req.params.id;
    workflow.account.save(function(err, account) {
      if (err) return workflow.emit('exception', err);
      workflow.emit('finalize');
    });
  });
  
  workflow.on('finalize', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }, 'roles').populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.roles = user.roles;
      workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.unlinkAccount = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not unlink users from accounts.');
      return workflow.emit('response');
    }
    
    workflow.emit('patchUser');
  });
  
  workflow.on('patchUser', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('User was not found.');
        return workflow.emit('response');
      }
      
      var accountId = user.roles.account;
      user.roles.account = undefined;
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.roles = user.roles;
        workflow.emit('patchAccount', accountId);
      });
    });
  });
  
  workflow.on('patchAccount', function(id) {
    res.app.db.models.Account.findOne({ _id: id }).exec(function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      if (!account) {
        workflow.outcome.errors.push('Account was not found.');
        return workflow.emit('response');
      }
      
      account.user = undefined;
      account.save(function(err, account) {
        if (err) return workflow.emit('exception', err);
        workflow.emit('finalize');
      });
    });
  });
  
  workflow.on('finalize', function() {
    res.app.db.models.User.findOne({ _id: req.params.id }, 'roles').populate('roles.admin').populate('roles.account').exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.roles = user.roles;
      workflow.emit('response');
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
      workflow.outcome.errors.push('You may not delete users.');
      return workflow.emit('response');
    }
    
    if (req.user._id == req.params.id) {
      workflow.outcome.errors.push('You may not delete yourself from user.');
      return workflow.emit('response');
    }
    
    workflow.emit('deleteUser');
  });
  
  workflow.on('deleteUser', function(err) {
    req.app.db.models.User.findByIdAndRemove(req.params.id, function(err, user) {
        if (err) return workflow.emit('exception', err);
        workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};