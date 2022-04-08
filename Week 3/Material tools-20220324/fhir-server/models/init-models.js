var DataTypes = require("sequelize").DataTypes;
var _DOC_TYPE = require("./DOC_TYPE");
var _PERSON = require("./PERSON");
var _PERSON_DOC = require("./PERSON_DOC");

function initModels(sequelize) {
  var DOC_TYPE = _DOC_TYPE(sequelize, DataTypes);
  var PERSON = _PERSON(sequelize, DataTypes);
  var PERSON_DOC = _PERSON_DOC(sequelize, DataTypes);

  PERSON_DOC.belongsTo(DOC_TYPE, { as: "PRDT_DCTP", foreignKey: "PRDT_DCTP_ID"});
  DOC_TYPE.hasMany(PERSON_DOC, { as: "PERSON_DOCs", foreignKey: "PRDT_DCTP_ID"});
  PERSON_DOC.belongsTo(PERSON, { as: "PRDT_PRSN", foreignKey: "PRDT_PRSN_ID"});
  PERSON.hasMany(PERSON_DOC, { as: "PERSON_DOCs", foreignKey: "PRDT_PRSN_ID"});

  return {
    DOC_TYPE,
    PERSON,
    PERSON_DOC,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
