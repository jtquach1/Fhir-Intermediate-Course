/* jshint indent: 1 */
//This structures were automatically generated from
//our legacy tables by sequelize-auto
//This is demographic information about the patient: names, gender, birth date, nickname and one email
const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "PERSON",
    {
      PRSN_ID: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      PRSN_FIRST_NAME: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_SECOND_NAME: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_LAST_NAME: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_BIRTH_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_GENDER: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_EMAIL: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_NICK_NAME: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_CREATE_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      PRSN_UPDATE_DATE: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      NPI: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "PERSON",
      timestamps: false,
    }
  );
};
