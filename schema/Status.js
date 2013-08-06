'use strict';

exports = module.exports = function(app, mongoose) {
  var statusSchema = new mongoose.Schema({
    _id: { type: String },
    pivot: { type: String, default: '' },
    name: { type: String, default: '' }
  });
  statusSchema.plugin(require('./plugins/pagedFind'));
  statusSchema.index({ pivot: 1 });
  statusSchema.index({ name: 1 });
  statusSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Status', statusSchema);
};
