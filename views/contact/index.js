exports.init = function(req, res){
  res.render('contact/index', { user: req.user });
};
exports.sendMessage = function(req, res){
  var workflow = new req.app.utility.Workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.name) workflow.outcome.errfor.name = 'required';
    if (!req.body.email) workflow.outcome.errfor.email = 'required';
    if (!req.body.phone) workflow.outcome.errfor.phone = 'required';
    if (!req.body.message) workflow.outcome.errfor.message = 'required';

    //return if we have errors already
    if (workflow.hasErrors()) {
      workflow.outcome.errors.push('missing required info');
      return workflow.emit('response');
    }

    workflow.emit('sendEmail');
  });

  workflow.on('sendEmail', function() {
    req.app.utility.email(req, res, {
      from: req.app.get('email-from-name') +' <'+ req.app.get('email-from-address') +'>',
      to: req.app.get('admin-email'),
      subject: req.app.get('project-name') +' contact form',
      textPath: 'contact/email-text',
      htmlPath: 'contact/email-html',
      locals: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        message: req.body.message,
        projectName: req.app.get('project-name')
      },
      success: function(message) {
        workflow.emit('response');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending: '+ err);
        workflow.emit('response');
      }
    });
  });

  workflow.emit('validate');
};