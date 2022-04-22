/*eslint no-unused-vars: "warn"*/
// Mapping between FHIR system and legacy document type
const LegacyDocumentType = require("./legacy_document_type");

// UID generator for bundles
const uuidv4 = require("uuid").v4;

// Housekeeping for sequelize
const { DataTypes } = require("sequelize");
const sequelize = require("./dbconfig").db;

// Specific models for our legacy medication object
const Person = require("./models/PERSON");

const { RESOURCES } = require("@asymmetrik/node-fhir-server-core").constants;
const FHIRServer = require("@asymmetrik/node-fhir-server-core");
const Bundle = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundle");
const BundleEntry = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundleentry");
const getPatient = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/patient");
const getPractitioner = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/practitioner");
const getMedicationRequest = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/medicationrequest");

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
    } else if (searchType === "NPI") {
      persons.push({ NPI: searchValue });
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
            // patient/practitioner at all
            persons.push({ PRSN_ID: -1 });
          }

          // And that's our completed job
          resolve(persons);
        });
    }
  });
}

// Providing special support for the person's identifiers
function convertLegacyToFhirIdentifiers(resource, person) {
  // Our helper for transforming the legacy to system/value
  let legacyMapper = LegacyDocumentType;
  const docs = person.PERSON_DOC;

  if (docs) {
    // For each legacy identifier
    docs.forEach((doc) => {
      var docTypeCode = doc.DOC_TYPE.DCTP_ABREV;
      var docNumber = doc.PRDT_DOC_VALUE;
      var startDate = doc.createdAt;
      var mapped = legacyMapper.GetDocumentSystemUse(docTypeCode);

      if (mapped.system != "") {
        // Assemble each identifier
        // use-system-value-period
        var oldCol = resource.identifier;
        oldCol.push({
          use: mapped.use,
          system: mapped.system,
          value: docNumber,
          period: { start: startDate },
        });
        resource.identifier = oldCol;
      }
    });
    return resource;
  }
}

// Person to Patient mapper. This function receives a legacy person and returns a FHIR Patient/Practitioner
function personToPatientOrPractitionerMapper(person, resourceType) {
  let resource;
  if (resourceType === "Patient") {
    resource = new getPatient();
  } else {
    resource = new getPractitioner();
  }

  if (person) {
    if (resourceType === "Practitioner" && !person.NPI) {
      return;
    }

    // Logical server id
    resource.id =
      resourceType === "Practitioner"
        ? person.NPI.toString()
        : person.PRSN_ID.toString();

    // We only have family, given and text. If we have more than one given, we will adjust later.
    resource.name = [
      {
        use: "official",
        family: person.PRSN_LAST_NAME,
        given: [person.PRSN_FIRST_NAME],
        text: `${person.PRSN_FIRST_NAME} ${person.PRSN_LAST_NAME}`,
      },
    ];

    // Mapping of gender is not needed because it's the same codes
    resource.gender = person.PRSN_GENDER;

    // BirthDate no conversion needed
    resource.birthDate = person.PRSN_BIRTH_DATE;

    // If there is second name then we add the given and adjust the text element
    if (person.PRSN_SECOND_NAME != "") {
      resource.name[0].given.push(person.PRSN_SECOND_NAME);
      resource.name[0].text =
        resource.name.text = `${person.PRSN_FIRST_NAME} ${person.PRSN_SECOND_NAME} ${person.PRSN_LAST_NAME}`;
    }

    // We map our legacy identifier type to FHIR system
    let legacyMapper = LegacyDocumentType;
    const idMapper = legacyMapper.GetDocumentSystemUse("ID");
    const npiMapper = legacyMapper.GetDocumentSystemUse("NPI");
    const npiIdentifier = person.NPI && {
      use: npiMapper.use,
      system: npiMapper.system,
      value: person.NPI?.toString(),
      period: { start: person.createdAt },
    };

    // We have the identifier (use, system, value)
    resource.identifier = [
      {
        use: idMapper.use,
        system: idMapper.system,
        value: person.PRSN_ID.toString(),
        period: { start: person.createdAt },
      },
      npiIdentifier,
    ].filter((value) => !!value);

    // We assemble the email address
    resource.telecom = [
      {
        system: "email",
        value: person.PRSN_EMAIL,
      },
    ];

    // If there is a nick name, we add it
    if (person.PRSN_NICK_NAME != "") {
      legal_name = resource.name[0];
      resource.name = [
        legal_name,
        {
          use: "nickname",
          given: [person.PRSN_NICK_NAME],
        },
      ];
    }

    // Full text for the resource. NO automatic narrative.
    resource.text = {
      status: "generated",
      div:
        '<div xmlns="http:// www.w3.org/1999/xhtml">' +
        resource.name[0].text +
        "</div>",
    };
  }

  return resource;
}

// Medication to MedicationRequest mapper. This function receives a legacy medication, FHIR patient, FHIR practitioner, and returns a FHIR MedicationRequest
function medToMedicationRequestMapper(medication, patient, practitioner) {
  let resource = new getMedicationRequest();

  // Logical server id
  resource.id = medication.med_id.toString();

  // No conversion needed
  resource.status = medication.status;
  resource.intent = medication.intent;
  resource.medicationCodeableConcept = {
    coding: [
      {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: medication.code,
        display: medication.display,
      },
    ],
  };

  resource.subject = {
    reference: `Patient/${patient.id}`,
    display: patient.name?.[0].text,
  };

  resource.requester = {
    reference: `Practitioner/${practitioner.id}`,
    display: practitioner.name?.[0].text,
  };

  // Full text for the resource. NO automatic narrative.
  resource.text = {
    status: "generated",
    div: '<div xmlns="http:// www.w3.org/1999/xhtml">' + resource.id + "</div>",
  };

  return resource;
}

const convertPersonToFHIR = (resourceType) => (result) => {
  const person = result.get();

  // We map from legacy person to person/practitioner
  const initialResource = personToPatientOrPractitionerMapper(
    person,
    resourceType
  );

  // Add the identifiers
  const resource = convertLegacyToFhirIdentifiers(initialResource, person);

  // And save the result in an array
  return resource;
};

const convertMedicationToFHIR = async (result) => {
  const medication = result.get();
  let person = new Person(sequelize, DataTypes);

  return await Promise.all([
    person.findOne({ where: { PRSN_ID: medication.PRSN_ID } }),
    person.findOne({ where: { NPI: medication.NPI } }),
  ]).then(([legacyPatient, legacyPractitioner]) => {
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

    return medicationRequest;
  });
};

const getFhirConverter = (resourceType) => {
  let converter;
  switch (resourceType) {
    case "MedicationRequest":
      converter = convertMedicationToFHIR;
      break;
    case "Patient":
    case "Practitioner":
      converter = convertPersonToFHIR(resourceType);
      break;
    default:
      converter = undefined;
  }
  return converter;
};

const getLinks = (query, endpoint, total, pageSize, pageInt) => {
  // This is to reassemble the query
  const getQuery = (exclude) =>
    [
      `${endpoint}`,
      ...Object.entries(query)
        .filter((entry) => !exclude.includes(entry[0]))
        .map((entry, index) => `${!index ? "?" : "&"}${entry.join("=")}`),
    ].join("");

  // And finally, we generate the link element self (always), prev (if there is a previous page available), and next (if there is a next page available)
  const originalQuery = getQuery(["base_version"]);
  const linkQuery = getQuery(["base_version", "_count", "_page"]);

  // Support search without parameters
  const separator = linkQuery === endpoint ? "?" : "&";

  // self is always there
  const links = [{ relation: "self", url: originalQuery }];
  const maxPages = Math.floor(total / pageSize + 1);

  // prev and next may or not exist
  if (pageInt > 1) {
    const prevPage = pageInt - 1;
    links.push({
      relation: "prev",
      url: `${linkQuery}${separator}_count=${pageSize}&_page=${prevPage}`,
    });
  }

  console.log("pageInt", pageInt);
  console.log("maxPages", maxPages);
  if (pageInt < maxPages) {
    const nextPage = pageInt + 1;
    links.push({
      relation: "next",
      url: `${linkQuery}${separator}_count=${pageSize}&_page=${nextPage}`,
    });
  }

  return links;
};

// This is the specific search for all resources matching the query
function getFhirResources(
  legacyModel,
  include,
  criteria,
  context,
  count = 5,
  page = 1,
  resourceType
) {
  const converter = getFhirConverter(resourceType);
  if (!converter) return;

  return new Promise(function (resolve, reject) {
    // Here we solve paginations issues: how many records per page, which page
    const pageSize = parseInt(count);
    const pageInt = parseInt(page);
    let offset = (pageInt - 1) * pageSize;
    let limit = pageSize;

    // Our Base address
    const baseUrl = getBaseUrl(context);
    const endpoint = `${baseUrl}${resourceType}`;

    // Get total number of rows because we want to know how many records in total we have to report that in our searchset bundle
    legacyModel
      .count({ where: criteria, include, distinct: true })
      .then((total) => {
        // Now we actually do the search combining the criteria, inclusions, limit and offset
        legacyModel
          .findAll({ where: criteria, include, limit, offset })
          .then((legacyModels) => Promise.all(legacyModels.map(converter)))
          .then((resources) => {
            // With all the patients we have in the result.array we assemble the entries
            const entries = resources.map(
              (resource) =>
                new BundleEntry({
                  fullUrl: `${endpoint}/${resource.id}`,
                  resource,
                })
            );

            console.log(context.req.query);

            // We assemble the bundle with the type, total, entries, id, and meta
            const bundle = new Bundle({
              id: uuidv4(),
              meta: { lastUpdated: new Date() },
              type: "searchset",
              total,
              entry: entries,
            });

            bundle.link = getLinks(
              context.req.query,
              endpoint,
              total,
              pageSize,
              pageInt
            );

            // Now we have all the required elements, so we can return the complete bundle
            resolve(bundle);
          });
      });
  });
}

module.exports = {
  getBaseUrl,
  getPersonsByIdentifier,
  convertLegacyToFhirIdentifiers,
  personToPatientOrPractitionerMapper,
  medToMedicationRequestMapper,
  getFhirResources,
  convertPersonToFHIR,
  convertMedicationToFHIR,
};
