'use strict';

exports.find = function(req, res, next){
  req.query.pivot = req.query.pivot ? req.query.pivot : '';
  req.query.title = req.query.title ? req.query.title : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '-userCreated.time';

  var filters = {};
  if (req.query.pivot) {
    filters.pivot = new RegExp('^.*?'+ req.query.pivot +'.*$', 'i');
  }

  if (req.query.title) {
    filters.title = new RegExp('^.*?'+ req.query.title +'.*$', 'i');
  }

  req.app.db.models.Post.pagedFind({
    filters: filters,
    keys: 'pivot title userCreated',
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
      res.render('admin/posts/index', { data: { results: escape(JSON.stringify(results)) } });
    }
  });
};

exports.read = function(req, res, next){
  req.app.db.models.Post.findById(req.params.id).exec(function(err, post) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(post);
    }
    else {
      res.render('admin/posts/details', { data: { record: escape(JSON.stringify(post)) } });
    }
  });
};

exports.create = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create posts.');
      return workflow.emit('response');
    }

    if (!req.body.pivot) {
      workflow.outcome.errors.push('A pivot is required.');
      return workflow.emit('response');
    }

    if (!req.body.title) {
      workflow.outcome.errors.push('A title is required.');
      return workflow.emit('response');
    }

    workflow.emit('duplicatePostCheck');
  });

  workflow.on('duplicatePostCheck', function() {
    req.app.db.models.Post.findById(req.app.utility.slugify(req.body.pivot +' '+ req.body.title)).exec(function(err, post) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (post) {
        workflow.outcome.errors.push('That title+pivot is already taken.');
        return workflow.emit('response');
      }

      workflow.emit('createPost');
    });
  });

  workflow.on('createPost', function() {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.pivot +' '+ req.body.title),
      pivot: req.body.pivot,
      title: req.body.title,
      'userCreated.name': req.user.username,
      'userCreated.id': req.user.id,
    };

    req.app.db.models.Post.create(fieldsToSet, function(err, post) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
     	post.linkToCategory(fieldsToSet.pivot, function(err, post) {
     		 if(err) {
     		 	return workflow.emit('exception', err);
     		 }
     		 workflow.outcome.record = post;
      	 return workflow.emit('response');
     	});   
    });
  });

  workflow.emit('validate');
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update posts.');
      return workflow.emit('response');
    }

    if (!req.body.pivot) {
      workflow.outcome.errfor.pivot = 'pivot';
      return workflow.emit('response');
    }

    if (!req.body.title) {
      workflow.outcome.errfor.title = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchPost');
  });

  workflow.on('patchPost', function() {
    var fieldsToSet = {
      pivot: req.body.pivot,
      title: req.body.title,
      content: req.body.content,
    };

    req.app.db.models.Post.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, post) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      post.linkToCategory(req.body.pivot, function(err, post) {
     		 if(err) {
     		 	return workflow.emit('exception', err);
     		 }
     		 workflow.outcome.record = post;
      	 return workflow.emit('response');
     	}); 
    });
  });

  workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete posts.');
      return workflow.emit('response');
    }

    workflow.emit('deletePost');
  });

  workflow.on('deletePost', function(err) {
    req.app.db.models.Post.findByIdAndRemove(req.params.id, function(err, post) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};
