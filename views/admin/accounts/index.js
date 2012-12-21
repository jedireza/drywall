exports.find = function(req, res, next){
  //defaults
  req.query.name = req.query.name ? req.query.name : '';
  req.query.company = req.query.company ? req.query.company : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';
  
  //filters
  var filters = {};
  if (req.query.name) filters['name.full'] = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
  if (req.query.company) filters.company = new RegExp('^.*?'+ req.query.company +'.*$', 'i');
  
  //get results
  res.app.db.models.Account.pagedFind({
    filters: filters,
    keys: 'name.full company',
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
      res.render('admin/accounts/index', { data: {results: JSON.stringify(results)} });
    }
  });
};



exports.read = function(req, res, next){
  res.app.db.models.Account.findOne({ _id: req.params.id }).populate('user', 'username').exec(function(err, account) {
    if (err) {
      res.send(500, 'Model findOne error. '+ err);
      return;
    }
    
    if (req.header('x-requested-with') == 'XMLHttpRequest') {
      res.send(account);
    }
    else {
      res.render('admin/accounts/details', {
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
    if (!req.body.name) {
      workflow.outcome.errfor.name = 'required';
      return workflow.emit('response')
    }
    
    workflow.emit('createAccount');
  });
  
  workflow.on('createAccount', function() {
    var nameParts = req.body.name.trim().split(/\s/);
    var fieldsToSet = {
      name: {
        first: nameParts.shift(),
        middle: (nameParts.length > 1 ? nameParts.shift() : ''),
        last: (nameParts.length == 0 ? '' : nameParts.join(' ')),
      }
    };
    fieldsToSet.name.full = fieldsToSet.name.first + (fieldsToSet.name.last ? ' '+ fieldsToSet.name.last : '');
    
    res.app.db.models.Account.create(fieldsToSet, function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      workflow.outcome.record = account;
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
    if (req.body.name && !req.body.name.first) workflow.outcome.errfor['name.first'] = 'required';
    if (req.body.name && !req.body.name.last) workflow.outcome.errfor['name.last'] = 'required';
    
    //return if we have errors already
    if (Object.keys(workflow.outcome.errfor).length != 0) return workflow.emit('response');
    
    workflow.emit('patchAccount');
  });
  
  workflow.on('patchAccount', function() {
    var fieldsToSet = {
      name: {
        first: req.body.name.first,
        middle: req.body.name.middle,
        last: req.body.name.last,
        full: req.body.name.full
      },
      company: req.body.company
    };
    
    req.app.db.models.Account.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, account) {
      if (err) return workflow.emit('exception', err);
      return workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.linkUser = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not link accounts to users.');
      return workflow.emit('response');
    }
    
    if (!req.body.newUsername) {
      workflow.outcome.errfor.newUsername = 'required';
      return workflow.emit('response');
    }
    
    workflow.emit('verifyUser');
  });
  
  workflow.on('verifyUser', function(callback) {
    res.app.db.models.User.findOne({ username: req.body.newUsername }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('User not found.');
        return workflow.emit('response');
      }
      else if (user.roles && user.roles.account && user.roles.account != req.params.id) {
        workflow.outcome.errors.push('User is already linked to a different account.');
        return workflow.emit('response');
      }
      
      workflow.user = user;
      workflow.emit('duplicateLinkCheck');
    });
  });
  
  workflow.on('duplicateLinkCheck', function(callback) {
    res.app.db.models.Account.findOne({ user: workflow.user._id, _id: {$ne: req.params.id} }).exec(function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      if (account) {
        workflow.outcome.errors.push('Another account is already linked to that user.');
        return workflow.emit('response');
      }
      
      workflow.emit('patchAccount');
    });
  });
  
  workflow.on('patchAccount', function(callback) {
    res.app.db.models.Account.findByIdAndUpdate(req.params.id, { user: workflow.user._id }).exec(function(err, account) {
      if (err) return workflow.emit('exception', err);
      workflow.emit('patchUser')
    });
  });
  
  workflow.on('patchUser', function() {
    workflow.user.roles.account = req.params.id;
    workflow.user.save(function(err, user) {
      if (err) return workflow.emit('exception', err);
      workflow.outcome.user = user;
      workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};



exports.unlinkUser = function(req, res, next){
  //create a workflow event emitter
  var workflow = new req.app.utility.Workflow(req, res);
  
  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not unlink users from accounts.');
      return workflow.emit('response');
    }
    
    workflow.emit('patchAccount');
  });
  
  workflow.on('patchAccount', function() {
    res.app.db.models.Account.findOne({ _id: req.params.id }).exec(function(err, account) {
      if (err) return workflow.emit('exception', err);
      
      if (!account) {
        workflow.outcome.errors.push('Account was not found.');
        return workflow.emit('response');
      }
      
      var userId = account.user;
      account.user = undefined;
      account.save(function(err, account) {
        if (err) return workflow.emit('exception', err);
        workflow.outcome.user = {};
        workflow.emit('patchUser', userId);
      });
    });
  });
  
  workflow.on('patchUser', function(id) {
    res.app.db.models.User.findOne({ _id: id }).exec(function(err, user) {
      if (err) return workflow.emit('exception', err);
      
      if (!user) {
        workflow.outcome.errors.push('User was not found.');
        return workflow.emit('response');
      }
      
      user.roles.account = undefined;
      user.save(function(err, user) {
        if (err) return workflow.emit('exception', err);
        console.log(user);
        workflow.emit('response');
      });
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
      workflow.outcome.errors.push('You may not delete accounts.');
      return workflow.emit('response');
    }
    
    workflow.emit('deleteAccount');
  });
  
  workflow.on('deleteAccount', function(err) {
    req.app.db.models.Account.findByIdAndRemove(req.params.id, function(err, account) {
        if (err) return workflow.emit('exception', err);
        workflow.emit('response');
    });
  });
  
  //start the workflow
  workflow.emit('validate');
};