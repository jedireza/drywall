'use strict';

exports = module.exports = function(app) {
  app.utility = {};
  app.utility.sendmail = require('./utilities/sendmail');
  app.utility.slugify = require('./utilities/slugify');
  app.utility.workflow = require('./utilities/workflow');
};
