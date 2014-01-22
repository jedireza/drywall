'use strict';

exports = module.exports = function(app, mongoose) {
  var acccountGroupSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    permissions: [{ name: String, permit: Boolean }]
  });
  acccountGroupSchema.plugin(require('./plugins/pagedFind'));
  acccountGroupSchema.index({ name: 1 }, { unique: true });
  acccountGroupSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('AccountGroup', acccountGroupSchema);
};
