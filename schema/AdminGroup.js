exports = module.exports = function(app, mongoose) {
  var adminGroupSchema = new mongoose.Schema({
    name: String,
    permissions: [{ name: String, permit: Boolean }]
  });
  adminGroupSchema.plugin(require('./plugins/pagedFind'));
  adminGroupSchema.index({ name: 1 }, {unique: true});
  adminGroupSchema.set('autoIndex', (app.get('env') == 'development'));
  app.db.model('AdminGroup', adminGroupSchema);
}