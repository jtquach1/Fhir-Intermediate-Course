/*eslint no-unused-vars: "warn"*/
// We only support one resource type: patient. And only search by id, by specific criteria and create.

// Housekeeping for sequelize
const { DataTypes } = require("sequelize");
const sequelize = require("./dbconfig").db;

// Specific models for our legacy person object
const Person = require("./models/PERSON");
const PersonDoc = require("./models/PERSON_DOC");
const DocType = require("./models/DOC_TYPE");

// Mapping between FHIR system and legacy document type
const LegacyDocumentType = require("./legacy_document_type");

// FHIR specific stuff
const getOperationOutcome = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/operationoutcome");

const {
  getBaseUrl,
  getPersonsByIdentifier,
  convertLegacyToFhirIdentifiers,
  personToPatientOrPractitionerMapper,
  getPatientsOrPractitioners,
} = require("./serviceUtils");

// This is for patient searches (direct read is special, below)
module.exports.search = (args, context, logger) =>
  new Promise((resolve, reject) => {
    //	logger.info('Patient >>> search');
    let baseUrl = getBaseUrl(context);

    const {
      // Common search params, we only support _id
      base_version,
      _content,
      _format,
      _id, // Special search parameter to search by Id instead of direct read
      _lastUpdated,
      _profile,
      _query,
      _security,
      _tag,

      // Search Result params ,we only support _count
      _INCLUDE,
      _REVINCLUDE,
      _SORT,
      _COUNT,
      _SUMMARY,
      _ELEMENTS,
      _CONTAINED,
      _CONTAINEDTYPED,

      // These are the parameters we can search for : name, identifier, family, gender and birthDate
      name,
      identifier,
      family,
      gender,
      birthdate,
      email,
    } = { ...args };

    // Special parameters to support pagination
    const { _count, _page } = { ...context.req.query };

    // Our instance of the tables of the legacy database
    let person = new Person(sequelize, DataTypes);
    let personDoc = new PersonDoc(sequelize, DataTypes);
    let docType = new DocType(sequelize, DataTypes);

    // We declare sequelizer the relations between the tables
    personDoc.belongsTo(docType, {
      as: "DOC_TYPE",
      foreignKey: "PRDT_DCTP_ID",
    });
    person.hasMany(personDoc, { as: "PERSON_DOC", foreignKey: "PRDT_PRSN_ID" });

    // These are the operators for and/or in sequelizer. We need a few of them
    const { Op } = require("sequelize");

    // Definining our array for search criteria. The criteria in the request translated to what sequelize expects for our tables
    let criteria = [];

    // If the family name is a parameter in this specific request...
    if (family) {
      criteria.push({ PRSN_LAST_NAME: family });
    }

    // If the gender is a parameter...
    if (gender) {
      criteria.push({ PRSN_GENDER: gender });
    }

    // If the birth date is a parameter...
    if (birthdate) {
      criteria.push({ PRSN_BIRTH_DATE: birthdate });
    }

    // If the _id is a parameter
    if (_id) {
      criteria.push({ prsn_id: _id });
    }

    // If name is a parameter we need to look in every name part, and do an OR
    if (name) {
      criteria.push({
        [Op.or]: [
          {
            PRSN_LAST_NAME: {
              [Op.like]: `%${name}%`,
            },
          },
          {
            PRSN_FIRST_NAME: {
              [Op.like]: `%${name}%`,
            },
          },
          {
            PRSN_SECOND_NAME: {
              [Op.like]: `%${name}%`,
            },
          },
        ],
      });
    }

    // Assignment L01-1: Add search parameter
    if (email) {
      criteria.push({
        PRSN_EMAIL: email,
      });
    }

    // We want sequelize to traverse the tables and get us all together: PERSONS, DOCUMENTS, DOCUMENT CODES
    let include = [
      {
        model: personDoc,
        as: "PERSON_DOC",
        include: [
          {
            model: docType,
            as: "DOC_TYPE",
          },
        ],
      },
    ];

    // We need to handle the 'identifier' parameter in a different way. We will search first in PERSON_DOC to get the (few..one?) person matching the identifier and add them as 'another' criteria for the search. So we have both. We decided to do this because the alternative was to filter using sequelize filter for includes (include.where) but it would also filter our results to only the specific identifier. And persons can have more than one, thus...this

    if (identifier) {
      // splitting the token system|value
      var search_type = "";
      var search_value = "";
      v = identifier.split("|");

      // If system is specified
      if (v.length > 1) {
        search_system = v[0];

        // Get the legacy type corresponding to the system
        let legacyMapper = LegacyDocumentType;
        search_type = legacyMapper.GetDocumentType(search_system);
        search_value = v[1];
      } else {
        search_value = identifier;
      }

      // This function gets the primary key for all the persons with the same identifier. Hopefully, only one of them.
      getPersonsByIdentifier(
        personDoc,
        docType,
        search_type,
        search_value
      ).then((result) => {
        // For each person with the same identifier, add the person id to the criteria
        result.forEach((item) => {
          criteria.push(item);
        });

        // Now with the complete criteria, search all the patients/practitioners and assemble the bundle
        getPatientsOrPractitioners(
          person,
          include,
          criteria,
          context,
          _count,
          _page,
          "Patient"
        ).then((result) => {
          resolve(result);
        });
      });
    } else {
      // Normal search using all the criteria but 'identifier'
      getPatientsOrPractitioners(
        person,
        include,
        criteria,
        context,
        _count,
        _page,
        "Patient"
      ).then((result) => {
        resolve(result);
      });
    }
  });

// POST of a new Patient Instance
module.exports.create = (args, context, logger) =>
  new Promise((resolve, reject) => {
    // 	logger.info('Patient >>> searchById');
    let { base_version } = args;

    // Our legacy model
    let docType = new DocType(sequelize, DataTypes);
    let person = new Person(sequelize, DataTypes);
    let personDoc = new PersonDoc(sequelize, DataTypes);

    // The incoming resource is in the request body
    // Note: Only JSON is supported
    const resource = context.req.body;

    // Mapping of each resource element
    // To our legacy structure
    // First we need to extract the information
    const lastName = resource.name[0].family;
    const firstName = resource.name[0].given[0];
    const secondName = resource.name[0].given[1];
    const birthDate = resource.birthDate;
    const gender = resource.gender;
    const email = resource.telecom[0].value;
    const nickname = resource.name[1].given[0];

    // We assemble the object for sequelizer to take
    // charge of the instance creation
    person
      .create({
        PRSN_FIRST_NAME: firstName,
        PRSN_SECOND_NAME: secondName,
        PRSN_LAST_NAME: lastName,
        PRSN_BIRTH_DATE: birthDate,
        PRSN_GENDER: gender,
        PRSN_EMAIL: email,
        PRSN_NICK_NAME: nickname,
        createdAt: new Date().toISOString(),
        updatedAt: "",
      })
      .then((person) => {
        // This is the new resource id (server assigned)
        newId = person.PRSN_ID;

        // For each identifier, we create a new PERSON_DOC record
        // But we need to search for the ID of the document type first
        resource.identifier.forEach((ident) => {
          let legacyMapper = LegacyDocumentType;
          search_type = legacyMapper.GetDocumentType(ident.system);

          // FHIR identifier.system -> document type
          if (search_type != "") {
            // document type code -> document type id
            docType
              .findOne({
                where: { DCTP_ABREV: search_type },
              })
              .then((doc) => {
                docTypeid = personDoc.create({
                  // With the document type and value, and the person id we create the new record in PERSON_DOC
                  PRDT_PRSN_ID: newId,
                  PRDT_DCTP_ID: doc.DCTP_ID,
                  PRDT_DOC_VALUE: ident.value,
                  createdAt: new Date().toISOString(),
                  updatedAt: "",
                });
              });
          }
        });

        // This is all the information that the response will have about the patient, the newId in Location
        resolve({ id: newId });
      });
  });

module.exports.searchById = (args, context, logger) =>
  new Promise((resolve, reject) => {
    // 	logger.info('Patient >>> searchById');
    let { base_version, id } = args;
    let person = new Person(sequelize, DataTypes);
    let personDoc = new PersonDoc(sequelize, DataTypes);
    let docType = new DocType(sequelize, DataTypes);

    personDoc.belongsTo(docType, {
      as: "DOC_TYPE",
      foreignKey: "PRDT_DCTP_ID",
    });

    person.hasMany(personDoc, { as: "PERSON_DOC", foreignKey: "PRDT_PRSN_ID" });

    person
      .findOne({
        where: { prsn_id: id },
        include: [
          {
            model: personDoc,
            as: "PERSON_DOC",
            include: [
              {
                model: docType,
                as: "DOC_TYPE",
              },
            ],
          },
        ],
      })
      .then((person) => {
        if (person) {
          const initialPatient = personToPatientOrPractitionerMapper(
            person,
            "Patient"
          );
          const patient = convertLegacyToFhirIdentifiers(
            initialPatient,
            person
          );
          resolve(patient);
        } else {
          let operationOutcome = new getOperationOutcome();
          let legacyMapper = LegacyDocumentType;
          var mapped = legacyMapper.GetDocumentSystemUse("ID");
          var message = `Patient with identifier ${mapped.system} ${id} not found `;

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
        var message = error;
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
