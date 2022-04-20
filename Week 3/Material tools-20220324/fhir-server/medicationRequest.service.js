/*eslint no-unused-vars: "warn"*/

// Housekeeping for sequelize
const { DataTypes } = require("sequelize");
const sequelize = require("./dbconfig").db;

// Specific models for our legacy medication object
const Person = require("./models/PERSON");
const Medication = require("./models/MEDS");

const getOperationOutcome = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/operationoutcome");

const {
  personToPatientOrPractitionerMapper,
  medToMedicationRequestMapper,
  getFhirResources,
} = require("./serviceUtils");

// This is for MedicationRequest searches (direct read is special, below)
module.exports.search = (args, context, logger) =>
  new Promise((resolve, reject) => {
    const {
      _id, // Special search parameter to search by Id instead of direct read
      // These are the parameters we can search for:
      patient,
      intent,
      status,
    } = { ...args };

    // Special parameters to support pagination
    const { _count, _page } = { ...context.req.query };

    // Our instance of the tables of the legacy database
    let person = new Person(sequelize, DataTypes);
    let medication = new Medication(sequelize, DataTypes);

    // We declare sequelizer the relations between the tables
    medication.belongsTo(person, {
      as: "PERSONS",
      foreignKey: "PRSN_ID",
      otherKey: "NPI",
    });
    person.hasMany(medication, {
      as: "MEDS",
      foreignKey: "PRSN_ID",
      otherKey: "NPI",
    });

    // These are the operators for and/or in sequelizer. We need a few of them
    const { Op } = require("sequelize");

    // Definining our array for search criteria. The criteria in the request translated to what sequelize expects for our tables
    let criteria = [];

    // If the _id is a parameter
    if (_id) {
      criteria.push({ med_id: _id });
    }

    if (patient) {
      criteria.push({ prsn_id: patient });
    }

    if (intent) {
      criteria.push({
        [Op.or]: intent.split(",").map((entry) => ({ intent: entry })),
      });
    }

    if (status) {
      criteria.push({
        [Op.or]: status.split(",").map((entry) => ({ status: entry })),
      });
    }

    let include = [{ model: person, as: "PERSONS" }];

    getFhirResources(
      medication,
      include,
      criteria,
      context,
      _count,
      _page,
      "MedicationRequest"
    ).then((result) => {
      resolve(result);
    });
  });

module.exports.searchById = (args, context, logger) =>
  new Promise((resolve, reject) => {
    // 	logger.info('MedicationRequest >>> searchById');
    let { base_version, id } = args;
    let medication = new Medication(sequelize, DataTypes);
    let person = new Person(sequelize, DataTypes);

    // We declare sequelizer the relations between the tables
    // medication.belongsTo(person, {
    //   as: "PERSONS",
    //   foreignKey: "PRSN_ID",
    //   otherKey: "NPI",
    // });
    // person.hasMany(medication, {
    //   as: "MEDS",
    //   foreignKey: "PRSN_ID",
    //   otherKey: "NPI",
    // });
    // let include = [{ model: person, as: "PERSONS" }];

    medication
      .findOne({
        // include,
        where: { med_id: id },
      })
      .then(async (result) => {
        if (result) {
          const medication = result.get();

          // // Do searchById
          const [legacyPatient, legacyPractitioner] = await Promise.all([
            person.findOne({ where: { PRSN_ID: medication.PRSN_ID } }),
            person.findOne({ where: { NPI: medication.NPI } }),
          ]);

          const patient = personToPatientOrPractitionerMapper(
            legacyPatient,
            "Patient"
          );

          const practitioner = personToPatientOrPractitionerMapper(
            legacyPractitioner,
            "Practitioner"
          );

          const medicationRequest = medToMedicationRequestMapper(
            medication,
            patient,
            practitioner
          );

          console.log("medicationRequest", medicationRequest);

          resolve(medicationRequest);
        } else {
          let operationOutcome = new getOperationOutcome();
          var message = `MedicationRequest with id ${id} not found `;

          operationOutcome.issue = [
            {
              severity: "error",
              code: "processing",
              diagnostics: message,
            },
          ];
          resolve(operationOutcome);
        }
      })
      .catch((error) => {
        let operationOutcome = new getOperationOutcome();
        var message = error || "Error in retrieving MedicationRequest";
        operationOutcome.issue = [
          {
            severity: "error",
            code: "processing",
            diagnostics: message,
          },
        ];
        resolve(operationOutcome);
      });
  });
