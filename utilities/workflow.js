exports = module.exports = function(req, res) {
  var workflow = new (require('events').EventEmitter)();
  
  workflow.outcome = {
    success: false,
    errors: [],
    errfor: {}
  };
  
  workflow.on('exception', function(err) {
    workflow.outcome.errors.push('Exception: '+ err);
    return workflow.emit('response');
  });
  
  workflow.on('response', function() {
    if (workflow.outcome.errors.length == 0 && Object.keys(workflow.outcome.errfor).length == 0) {
      workflow.outcome.success = true;
    }
    
    res.send(workflow.outcome);
  });
  
  return workflow;
}