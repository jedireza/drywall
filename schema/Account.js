'use strict';

exports = module.exports = function(app, db) {
  var Account = db.sequelize.define("Account",{
    isVerified: { type: db.Sequelize.STRING, defaultValue: '' },
    verificationToken: { type: db.Sequelize.STRING, defaultValue: '' },
    name_first: { type: db.Sequelize.STRING, defaultValue: '' },
    name_middle: { type: db.Sequelize.STRING, defaultValue: '' },
    name_last: { type: db.Sequelize.STRING, defaultValue: '' },
    name_full: { type: db.Sequelize.STRING, defaultValue: '' },
    company: { type: db.Sequelize.STRING, defaultValue: '' },
    phone: { type: db.Sequelize.STRING, defaultValue: '' },
    zip: { type: db.Sequelize.STRING, defaultValue: '' },
    status_id: { type: db.Sequelize.STRING, ref: 'Status' },
    status_name: { type: db.Sequelize.STRING, defaultValue: '' }
  },{
      freezeTableName: true, // Model tableName will be the same as the model name
      classMethods: {
          associate: function(models) {
              Account.belongsTo(models.User, {foreignKey : 'user_id'});
              Account.hasMany(models.Note, {foreignKey: 'account_id'});
          }
      }
  });

  return Account;
};
