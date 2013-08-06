'use strict';

exports = module.exports = function(app, mongoose) {
  var statusLogSchema = new mongoose.Schema({
    id: { type: String, ref: 'Status' },
    name: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  app.db.model('StatusLog', statusLogSchema);
};
