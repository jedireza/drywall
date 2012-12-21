exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: {
      full: String,
      first: String,
      middle: String,
      last:  String
    },
    company: String,
    notes: [mongoose.modelSchemas['Note']],
    timeCreated: { type: Date, default: Date.now }
  });
  accountSchema.plugin(require('./plugins/pagedFind'));
  accountSchema.index({ user: 1 });
  accountSchema.index({ 'name.full': 1 });
  accountSchema.index({ company: 1 });
  accountSchema.index({ timeCreated: 1 });
  accountSchema.index({ 'notes.user': 1 });
  accountSchema.index({ 'notes.username': 1 });
  accountSchema.index({ 'notes.timeCreated': 1 });
  accountSchema.set('autoIndex', (app.get('env') == 'development'));
  app.db.model('Account', accountSchema);
}