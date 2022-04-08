/* jshint indent: 1 */
//This structures were automatically generated from
//our legacy tables by sequelize-auto
//This is the relationship from a person to its documents (identifiers)
const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "PERSON_DOC",
    {
      PRDT_ID: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      PRDT_PRSN_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "PERSON",
          key: "PRSN_ID",
        },
      },
      PRDT_DCTP_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "DOC_TYPE",
          key: "DCTP_ID",
        },
      },
      PRDT_DOC_VALUE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRDT_CREATE_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRDT_DELETE_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "PERSON_DOC",
      timestamps: false,
    }
  );
};
