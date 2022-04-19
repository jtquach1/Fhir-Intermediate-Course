/*eslint no-unused-vars: "warn"*/

// Housekeeping for sequelize
const { DataTypes } = require("sequelize");
const sequelize = require("./dbconfig").db;

// Specific models for our legacy person object
const Person = require("./models/PERSON");
const PersonDoc = require("./models/PERSON_DOC");
const DocType = require("./models/DOC_TYPE");
const Medication = require("./models/MEDS");

// UID generator for bundles
const uuidv4 = require("uuid").v4;

// Mapping between FHIR system and legacy document type
const LegacyDocumentType = require("./legacy_document_type");

// FHIR specific stuff
const getBundle = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundle");
const getBundleEntry = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/bundleentry");
const getOperationOutcome = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/operationoutcome");
const getMedicationRequest = require("@asymmetrik/node-fhir-server-core/src/server/resources/4_0_0/schemas/medicationrequest");

const { searchById: patientSearchById } = require("./patient.service.js");
const {
  searchById: practitionerSearchById,
} = require("./practitioner.service.js");

const { getBaseUrl } = require("./serviceUtils");

// Med to MedicationRequest mapper. This function receives a legacy medication and returns a FHIR MedicationRequest
function medToMedicationRequestMapper(medication, patient, practitioner) {
  let resource = getMedicationRequest;

  // Logical server id
  resource.id = medication.med_id.toString();

  // No conversion needed
  resource.status = medication.status;
  resource.intent = medication.intent;
  resource.medicationCodeableConcept = {
    coding: [
      {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: resource.code,
        display: resource.display,
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

  // And that's our resource
  return resource;
}

function getMedicationRequests(
  medication,
  include,
  criteria,
  context,
  count = 5,
  page = 1
) {
  const resourceType = "MedicationRequest";
  return new Promise(function (resolve, reject) {
    // Here we solve paginations issues: how many records per page, which page
    let offset = (page - 1) * count;
    let limit = count;

    // Bundle and Entry definitions
    let BundleEntry = getBundleEntry;
    let Bundle = getBundle;

    // Our Base address
    let baseUrl = getBaseUrl(context);

    // Get total number of rows because we want to know how many records in total we have to report that in our searchset bundle
    medication
      .findAndCountAll({
        where: criteria,
        include: include,
        distinct: true,
      })
      .then((TotalCount) => {
        console.log("TotalCount", JSON.stringify(TotalCount));
        // Adjust page offset and limit to the total count
        if (offset + limit > TotalCount.count) {
          limit = count;
          offset = 0;
        }

        // Now we actually do the search combining the criteria, inclusions, limit and offset
        medication
          .findAll({
            where: criteria,
            include: include,
            limit: limit,
            offset: offset,
          })
          .then((medications) => {
            const result = [];

            medications.forEach(async (medication) => {
              const patient =
                { id: 1234 } ||
                (await patientSearchById(medication.PRSN_ID, context));
              const practitioner =
                { id: 5678 } ||
                (await practitionerSearchById(medication.NPI, context));

              // console.log("patient", JSON.stringify(patient));
              // console.log("practitioner", JSON.stringify(practitioner));

              // We map from legacy medication to MedicationRequest
              const medicationRequest = medToMedicationRequestMapper(
                medication,
                patient,
                practitioner
              );

              // And save the result in an array
              result.push(medicationRequest);
            });

            // With all the medication requests we have in the result.array we assemble the entries
            const entries = result.map(
              (resource) =>
                new BundleEntry({
                  fullUrl: `${baseUrl}/${resourceType}/${resource.id}`,
                  resource: resource,
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
            var OriginalQuery = `${baseUrl}${resourceType}`;
            var LinkQuery = `${baseUrl}${resourceType}`;
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

// This is for MedicationRequest searches (direct read is special, below)
module.exports.search = (args, context, logger) =>
  new Promise((resolve, reject) => {
    let baseUrl = getBaseUrl(context);

    const {
      _id, // Special search parameter to search by Id instead of direct read
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

    let include = [
      // {
      //   model: medication,
      //   as: "MEDS",
      //   include: [
      //     {
      //       model: person,
      //       as: "PERSONS",
      //     },
      //   ],
      // },
      { model: person, as: "PERSONS" },
    ];

    getMedicationRequests(
      medication,
      include,
      criteria,
      context,
      _count,
      _page
    ).then((result) => {
      resolve(result);
    });
  });

module.exports.searchById = (args, context, logger) =>
  new Promise((resolve, reject) => {
    // 	logger.info('MedicationRequest >>> searchById');
    let { base_version, id } = args;
    let medication = new Medication(sequelize, DataTypes);

    medication
      .findOne({
        where: { med_id: id },
      })
      .then(async (medication) => {
        if (medication) {
          // // Do searchById
          const patient = await patientSearchById(medication.PRSN_ID, context);
          const practitioner = await practitionerSearchById(
            medication.NPI,
            context
          );

          // console.log("patient", JSON.stringify(patient));
          // console.log("practitioner", JSON.stringify(practitioner));

          const medicationRequest = medToMedicationRequestMapper(
            medication,
            patient,
            practitioner
          );
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
