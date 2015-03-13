'use strict';

exports = module.exports = function(app, db) {
  var Note = db.sequelize.define('Note', {
        data: {
            type: db.Sequelize.STRING,
            defaultValue: ''
        },
        name: {
            type: db.Sequelize.STRING,
            defaultValue: ''
        }
    }, {
        freezeTableName: true, // Model tableName will be the same as the model name
        classMethods: {
            associate: function(models) {
                Note.belongsTo(models.User, {foreignKey : 'user_id'});
            }
        }
    });

  return Note;
};