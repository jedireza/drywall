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
    resetPasswordToken: String,
    twitter: {},
    github: {},
    facebook: {},
    search: [String]
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
    if(app.get("strong-slow-crypto")){
      console.log("STORNG!!!");
      //inline require because bcrypt install requires separate tools to be installed (openSSL, node-gyp)
      var bcrypt = require('bcrypt');
      var salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }else{
      return require('crypto').createHmac('sha512',app.get('crypto-key')).update(password).digest('hex'); //sha512
    }
  };
  userSchema.statics.isCorrectPassword = function(password, hashInDb) {
    if(app.get("strong-slow-crypto")){
      return require('bcrypt').compareSync(password, hashInDb);
    }else{
      return this.encryptPassword(password) === hashInDb;
    }
  };
  userSchema.plugin(require('./plugins/pagedFind'));
  userSchema.index({ username: 1 }, {unique: true});
  userSchema.index({ email: 1 });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ resetPasswordToken: 1 });
  userSchema.index({ 'twitter.id': 1 });
  userSchema.index({ 'github.id': 1 });
  userSchema.index({ 'facebook.id': 1 });
  userSchema.index({ search: 1 });
  userSchema.set('autoIndex', (app.get('env') == 'development'));
  app.db.model('User', userSchema);
}