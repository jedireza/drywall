'use strict';

exports = module.exports = function(app, mongoose) {
  var categorySchema = new mongoose.Schema({
    _id: { type: String },
    pivot: { type: String, default: '' },
    name: { type: String, default: '' }
  });
  categorySchema.plugin(require('./plugins/pagedFind'));
  categorySchema.index({ pivot: 1 });
  categorySchema.index({ name: 1 });
  categorySchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Category', categorySchema);
};
