/* jshint indent: 1 */
//This structures were automatically generated from
//our legacy tables by sequelize-auto
//These are the document (identifier) types
const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "DOC_TYPE",
    {
      DCTP_ID: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      DCTP_ABREV: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      DCTP_DESC: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      DCTP_CREATE_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "DOC_TYPE",
      timestamps: false,
    }
  );
};
