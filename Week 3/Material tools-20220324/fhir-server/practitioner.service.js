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

// UID generator for bundles
const uuidv4 = require("uuid").v4;

// FHIR specific stuff: Server, resources: Patient, Bundle, OperationOutcome and Entry
const { RESOURCES } = require("@asymmetrik/node-fhir-server-core").constants;
const FHIRServer = require("@asymmetrik/node-fhir-server-core");
const getPatient = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/patient");
const getBundle = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundle");
const getOperationOutcome = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/operationoutcome");
const getBundleEntry = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundleentry");
const getPractitioner = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/practitioner");

// Meta data for FHIR R4
let getMeta = (base_version) => {
  return require(FHIRServer.resolveFromVersion(base_version, RESOURCES.META));
};

// How to search the address of our server, so we can return it in the fullURL for each Patient entry
function getBaseUrl(context) {
  const FHIRVersion = "/4_0_0/";
  var protocol = "http://";
  if (context.req.secure) {
    protocol = "https://";
  }
  const baseUrl = `${protocol}${context.req.headers.host}${FHIRVersion}`;
  return baseUrl;
}

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

        // Now with the complete criteria, search all the patients and assemble the bundle
        getPatients(person, include, criteria, context, _count, _page).then(
          (result) => {
            resolve(result);
          }
        );
      });
    } else {
      // Normal search using all the criteria but 'identifier'
      getPatients(person, include, criteria, context, _count, _page).then(
        (result) => {
          resolve(result);
        }
      );
    }
  });

// This function/promise returns an array of sequelize criteria with the legacy person id with a specific document type/number
function getPersonsByIdentifier(personDoc, docType, searchType, searchValue) {
  return new Promise(function (resolve, reject) {
    // Empty array of person id's
    const persons = [];

    // Special type of identifier: "ID" because it's not really an identifier
    // It's the server assigned ID
    if (searchType == "ID") {
      persons.push({ PRSN_ID: searchValue });
      resolve(persons);
    } else {
      // Association between DOC_TYPE and PERSON_DOC to search by the abbreviated type and not by ID
      let include = [
        {
          model: docType,
          as: "DOC_TYPE",
        },
      ];

      if (searchType != "") {
        include.where = [{ DCTP_ABREV: searchType }];
      }

      // Criteria involves the document number
      const criteria = [];
      criteria.push({ PRDT_DOC_VALUE: searchValue });

      // Here we ask for all the persons matching the criteria
      personDoc
        .findAll({
          where: criteria,
          include: include,
        })
        .then((personDocs) => {
          personDocs.forEach((personDoc) => {
            // And add them to the criteria array
            persons.push({ PRSN_ID: personDoc.PRDT_PRSN_ID });
          });

          if (persons.length == 0) {
            // tricky: there was no person we add something that will always fail
            // in a autonumeric INT, to ensure that we will return no
            // patient at all
            persons.push({ PRSN_ID: -1 });
          }

          // And that's our completed job
          resolve(persons);
        });
    }
  });
}

// This is the specific search for all patients matching the query
function getPatients(person, include, criteria, context, count = 5, page = 1) {
  return new Promise(function (resolve, reject) {
    // Here we solve paginations issues: how many records per page, which page
    const offset = (page - 1) * count;
    const limit = count;

    // Bundle and Entry definitions
    let BundleEntry = getBundleEntry;
    let Bundle = getBundle;

    // Our Base address
    let baseUrl = getBaseUrl(context);

    result = [];
    entries = [];

    // Get total number of rows because we want to know how many records in total we have to report that in our searchset bundle
    person
      .findAndCountAll({
        where: criteria,
        include: include,
        distinct: true,
      })
      .then((TotalCount) => {
        // Adjust page offset and limit to the total count
        if (offset + limit > TotalCount) {
          limit = count;
          offset = 0;
        }

        // Now we actually do the search combining the criteria, inclusions, limit and offset
        person
          .findAll({
            where: criteria,
            include: include,
            limit: limit,
            offset: offset,
          })
          .then((persons) => {
            persons.forEach((person) => {
              // We map from legacy person to patient
              const initialPatient = personToPatientMapper(person);

              // Add the identifiers
              const patient = personIdentifierToPatientIdentifierMapper(
                initialPatient,
                person
              );

              // And save the result in an array
              result.push(patient);
            });

            // With all the patients we have in the result.array we assemble the entries
            const entries = result.map(
              (patient) =>
                new BundleEntry({
                  fullUrl: `${baseUrl}/Patient/${patient.id}`,
                  resource: patient,
                })
            );

            // We assemble the bundle with the type, total, entries, id, and meta
            const bundle = new Bundle({
              id: uuidv4(),
              meta: {
                lastUpdated: new Date(),
              },
              type: "searchset",
              total: TotalCount.count,
              entry: entries,
            });

            // And finally, we generate the link element
            // self (always), prev (if there is a previous page available)
            // next (if there is a next page available)
            var OriginalQuery = `${baseUrl}Patient`;
            var LinkQuery = `${baseUrl}Patient`;
            var parNum = 0;
            var linkParNum = 0;

            // This is to reassemble the query
            for (var param in context.req.query) {
              console.log(param);
              console.log(context.req.query[param]);
              if (param != "base_version") {
                var sep = "&";
                parNum = parNum + 1;

                if (parNum == 1) {
                  sep = "?";
                }

                OriginalQuery = `${OriginalQuery}${sep}${param}=${context.req.query[param]}`;

                if (param != "_page" && param != "_count") {
                  var LinkSep = "&";
                  linkParNum = linkParNum + 1;

                  if (linkParNum == 1) {
                    LinkSep = "?";
                  }

                  LinkQuery = `${LinkQuery}${LinkSep}${param}=${context.req.query[param]}`;
                }
              }
            }

            // self is always there
            MyLinks = [
              {
                relation: "self",
                url: OriginalQuery,
              },
            ];

            // prev and next may or not exist
            if (page > 1) {
              const prevPage = page - 1;
              MyLinks.push({
                relation: "prev",
                url: `${LinkQuery}&_count=${count}&_page=${prevPage.toString()}`,
              });
            }

            MaxPages = TotalCount.count / count + 1;
            MaxPages = parseInt(MaxPages);

            if (page < MaxPages) {
              const nextPage = page + 1;
              MyLinks.push({
                relation: "next",
                url: `${LinkQuery}&_count=${count}&_page=${nextPage.toString()}`,
              });
            }

            bundle.link = MyLinks;

            // Now we have all the required elements, so we can return the complete bundle
            resolve(bundle);
          });
      });
  });
}

// Person to Patient mapper. This function receives a legacy person and returns a FHIR Patient
function personToPatientMapper(person) {
  let fhirPatient = new getPatient();

  if (person) {
    // Logical server id
    fhirPatient.id = person.PRSN_ID.toString();

    // We only have family, given and text. If we have more than one given, we will adjust later.
    fhirPatient.name = [
      {
        use: "official",
        family: person.PRSN_LAST_NAME,
        given: [person.PRSN_FIRST_NAME],

        text: `${person.PRSN_FIRST_NAME} ${person.PRSN_LAST_NAME}`,
      },
    ];

    // Mapping of gender is not needed because it's the same codes
    fhirPatient.gender = person.PRSN_GENDER;

    // BirthDate no conversion needed
    fhirPatient.birthDate = person.PRSN_BIRTH_DATE;

    // If there is second name then we add the given and adjust the text element
    if (person.PRSN_SECOND_NAME != "") {
      fhirPatient.name[0].given.push(person.PRSN_SECOND_NAME);
      fhirPatient.name[0].text =
        fhirPatient.name.text = `${person.PRSN_FIRST_NAME} ${person.PRSN_SECOND_NAME} ${person.PRSN_LAST_NAME}`;
    }

    // We map our legacy identifier type to FHIR system
    let legacyMapper = LegacyDocumentType;
    mapper = legacyMapper.GetDocumentSystemUse("ID");

    // We have the identifier (use, system, value)
    fhirPatient.identifier = [
      {
        use: mapper.use,
        system: mapper.system,
        value: person.PRSN_ID.toString(),
        period: { start: person.createdAt },
      },
    ];

    // We assemble the email address
    fhirPatient.telecom = [
      {
        system: "email",
        value: person.PRSN_EMAIL,
      },
    ];

    // If there is a nick name, we add it
    if (person.PRSN_NICK_NAME != "") {
      legal_name = fhirPatient.name[0];
      fhirPatient.name = [
        legal_name,
        {
          use: "nickname",
          given: [person.PRSN_NICK_NAME],
        },
      ];
    }

    // Full text for the resource. NO automatic narrative.
    fhirPatient.text = {
      status: "generated",
      div:
        '<div xmlns="http:// www.w3.org/1999/xhtml">' +
        fhirPatient.name[0].text +
        "</div>",
    };
  }

  // And that's our resource
  return fhirPatient;
}

// Providing special support for the person's identifiers
function personIdentifierToPatientIdentifierMapper(fhirPatient, person) {
  // Our helper for transforming the legacy to system/value
  let legacyMapper = LegacyDocumentType;
  MyDocs = person.PERSON_DOC;

  if (MyDocs) {
    // For each legacy identifier
    MyDocs.forEach((doc) => {
      var docTypeCode = doc.DOC_TYPE.DCTP_ABREV;
      var docNumber = doc.PRDT_DOC_VALUE;
      var startDate = doc.createdAt;
      var mapped = legacyMapper.GetDocumentSystemUse(docTypeCode);

      if (mapped.system != "") {
        // Assemble each identifier
        // use-system-value-period
        var oldCol = fhirPatient.identifier;
        oldCol.push({
          use: mapped.use,
          system: mapped.system,
          value: docNumber,
          period: { start: startDate },
        });
        fhirPatient.identifier = oldCol;
      }
    });
    return fhirPatient;
  }
}

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
          const initialPatient = personToPatientMapper(person);
          const patient = personIdentifierToPatientIdentifierMapper(
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
