'use strict';

exports = module.exports = function(app, db) {
var Admin = db.sequelize.define("Admin",{
    name_first: { type: db.Sequelize.STRING, defaultValue: '' },
    name_middle: { type: db.Sequelize.STRING, defaultValue: '' },
    name_last: { type: db.Sequelize.STRING, defaultValue: '' },
    name_full: { type: db.Sequelize.STRING, defaultValue: '' },
    zip: { type: db.Sequelize.STRING, defaultValue: '' },
    status_id: { type: db.Sequelize.STRING, ref: 'Status' },
    status_name: { type: db.Sequelize.STRING, defaultValue: '' },
    permissions: { type: db.Sequelize.STRING, defaultValue: '[]' }
  },{
      freezeTableName: true, // Model tableName will be the same as the model name
      classMethods: {
          associate: function(models) {
              Admin.belongsTo(models.User, {foreignKey : 'user_id'});
          }
      },
      instanceMethods: {
        hasPermissionTo: function(something) {
          //check group permissions
          var groupHasPermission = false;

          for (var i = 0 ; i < this.adminGroups.length ; i++) {
             if(this.adminGroups[i].hasPermissionTo(something)){
                return true;
             }
          }

          var permissionsO = JSON.parse(this.permissions);
          //check admin permissions
          for (var k = 0 ; k < permissionsO.length ; k++) {
            if (permissionsO[k].name === something) {
              if (permissionsO[k].permit) {
                return true;
              }

              return false;
            }
          }

          return groupHasPermission;
        },
        isMemberOf: function(group) {
          for (var i = 0 ; i < this.groups.length ; i++) {
            if (this.adminGroups[i].id === group) {
              return true;
            }
          }

          return false;
        }
      }
  });

  return Admin;
};
