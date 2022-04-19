const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MEDS', {
    med_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    intent: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    display: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    PRSN_ID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    NPI: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'MEDS',
    timestamps: false
  });
};
