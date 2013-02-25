exports = module.exports = function(app) {
  //create utility object in app
  app.utility = {};
  
  //setup utilities
  app.utility.email = require('./utilities/email');
  app.utility.slugify = require('./utilities/slugify');
  app.utility.Workflow = require('./utilities/workflow');
}