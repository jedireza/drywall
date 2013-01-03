exports = module.exports = function(app, mongoose) {
  var adminSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: {
      full: {type: String, default: ''},
      first: {type: String, default: ''},
      middle: {type: String, default: ''},
      last: {type: String, default: ''},
    },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminGroup' }],
    permissions: [{ name: String, permit: Boolean }],
    timeCreated: { type: Date, default: Date.now }
  });
  adminSchema.methods.hasPermissionTo = function(something) {
    /* 
     * TODO:
     * when mongoose supports calling populate on embedded documents,
     * we can stop using the '_groups' hack since 'groups' will
     * be populated correctly during the passport login
     * https://github.com/LearnBoost/mongoose/issues/601
     *
     */
    
    //check group permissions
    var groupHasPermission = false;
    for (var i = 0 ; i < this._groups.length ; i++) {
      for (var j = 0 ; j < this._groups[i].permissions.length ; j++) {
        if (this._groups[i].permissions[j].name == something) {
          if (this._groups[i].permissions[j].permit) groupHasPermission = true;
        }
      }
    }
    
    //check user permissions
    for (var i = 0 ; i < this.permissions.length ; i++) {
      if (this.permissions[i].name == something) {
        if (this.permissions[i].permit) return true;
        return false;
      }
    }
    
    return groupHasPermission;
  };
  adminSchema.methods.isMemberOf = function(group) {
    for (var i = 0 ; i < this._groups.length ; i++) {
      if (this._groups[i].name == group) {
        return true;
      }
    }
    
    return false;
  };
  adminSchema.plugin(require('./plugins/pagedFind'));
  adminSchema.index({ user: 1 });
  adminSchema.index({ 'name.full': 1 });
  adminSchema.index({ timeCreated: 1 });
  adminSchema.set('autoIndex', (app.get('env') == 'development'));
  app.db.model('Admin', adminSchema);
}