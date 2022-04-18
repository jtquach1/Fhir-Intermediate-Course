/*eslint no-unused-vars: "warn"*/
// We only support one resource type: practitioner. And only search by id, by specific criteria and create.

// Housekeeping for sequelize
const { DataTypes } = require("sequelize");
const sequelize = require("./dbconfig").db;

// Specific models for our legacy person object
const Person = require("./models/PERSON");
const PersonDoc = require("./models/PERSON_DOC");
const DocType = require("./models/DOC_TYPE");

// Mapping between FHIR system and legacy document type
const LegacyDocumentType = require("./legacy_document_type");

// FHIR specific stuff: Server, resources: Practitioner, Bundle, OperationOutcome and Entry
const getOperationOutcome = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/operationoutcome");

const {
  getBaseUrl,
  getPersonsByIdentifier,
  convertLegacyToFhirIdentifiers,
  personToPatientOrPractitionerMapper,
  getPatientsOrPractitioners,
} = require("./serviceUtils");

// This is for practitioner searches (direct read is special, below)
module.exports.search = (args, context, logger) =>
  new Promise((resolve, reject) => {
    //	logger.info('Practitioner >>> search');
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
      criteria.push({ NPI: _id });
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

    // Assignment L01-2: Add support for Practitioner
    // We need to make sure the people we get have NPI's, otherwise we get an empty bundle from querying Patients too (who have null NPIs)
    criteria.push({
      NPI: {
        [Op.not]: null,
      },
    });

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
          "Practitioner"
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
        "Practitioner"
      ).then((result) => {
        resolve(result);
      });
    }
  });

module.exports.searchById = (args, context, logger) =>
  new Promise((resolve, reject) => {
    // 	logger.info('Practitioner >>> searchById');
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
        where: { NPI: id },
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
          const initialPractitioner = personToPatientOrPractitionerMapper(
            person,
            "Practitioner"
          );
          const practitioner = convertLegacyToFhirIdentifiers(
            initialPractitioner,
            person
          );
          resolve(practitioner);
        } else {
          let operationOutcome = new getOperationOutcome();
          let legacyMapper = LegacyDocumentType;
          var mapped = legacyMapper.GetDocumentSystemUse("NPI");
          var message = `Practitioner with identifier ${mapped.system} ${id} not found `;

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
