exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: String,
    roles: {
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
    },
    isActive: String,
    timeCreated: { type: Date, default: Date.now },
    resetPasswordToken: String
  });
  userSchema.methods.canPlayRoleOf = function(role) {
    if (role == "admin" && this.roles.admin) return true;
    if (role == "account" && this.roles.account) return true;
    return false;
  };
  userSchema.methods.defaultReturnUrl = function() {
    var returnUrl = '/';
    if (this.canPlayRoleOf('account')) returnUrl = '/account/';
    if (this.canPlayRoleOf('admin')) returnUrl = '/admin/';
    return returnUrl;
  };
  userSchema.statics.encryptPassword = function(password) {
    return require('crypto').createHash('sha512').update(password).digest('hex');
  };
  userSchema.plugin(require('./plugins/pagedFind'));
  userSchema.index({ username: 1 }, {unique: true});
  userSchema.index({ email: 1 });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ resetPasswordToken: 1 });
  userSchema.set('autoIndex', (app.get('env') == 'development'));
  app.db.model('User', userSchema);
}