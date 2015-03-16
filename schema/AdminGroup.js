'use strict';

exports = module.exports = function(app, db) {
	var AdminGroup = db.sequelize.define('AdminGroup', {
	    name: { type: db.Sequelize.STRING, defaultValue: ''},
	    permissions: { type: db.Sequelize.STRING, defaultValue: '[]'}
	}, {
	    freezeTableName: true, // Model tableName will be the same as the model name
	    classMethods: {
	        associate: function(models) {
	            AdminGroup.belongsTo(models.Admin, {foreignKey : 'admin_id'});
	        }
	    },
	    instanceMethods: {
        hasPermissionTo: function(something) {
          	var groupHasPermission = false;
          	var groupPermissions0 = JSON.parse(this.permissions[i]);
	        for (var j = 0 ; j < groupPermissions0.length ; j++) {
	          if (groupPermissions0[j].name === something) {
	            if (groupPermissions0[j].permit) {
	            	groupHasPermission = true;
	            }
	          }
	        }

        	return groupHasPermission;
        }
      }
	});

	return AdminGroup;
};
