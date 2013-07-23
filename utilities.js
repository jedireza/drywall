'use strict';

exports = module.exports = function(app) {
  app.utility = {};
  app.utility.email = require('./utilities/email');
  app.utility.slugify = require('./utilities/slugify');
  app.utility.Workflow = require('./utilities/workflow');
};