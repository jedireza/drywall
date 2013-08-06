'use strict';

exports = module.exports = function(app, mongoose) {
  var adminGroupSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    permissions: [{ name: String, permit: Boolean }]
  });
  adminGroupSchema.plugin(require('./plugins/pagedFind'));
  adminGroupSchema.index({ name: 1 }, { unique: true });
  adminGroupSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('AdminGroup', adminGroupSchema);
};
