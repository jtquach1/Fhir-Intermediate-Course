const Client = require("fhir-kit-client");
module.exports = { GetPatientPhoneAndEmail };

// Copied from L00_0_demo.js
async function GetPatient(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const fhirClient = new Client({
    baseUrl: server,
  });

  var PatientInfo = null;
  let searchResponse = await fhirClient.search({
    resourceType: "Patient",
    searchParams: {
      identifier: patientidentifiersystem + "|" + patientidentifiervalue,
    },
  });
  entries = searchResponse.entry;
  if (entries) {
    PatientInfo = entries[0].resource;
  }
  return PatientInfo;
}

const capitalize = (word) =>
  word.charAt(0).toLocaleUpperCase() + word.substr(1);

const format = (array) => (array.length === 0 ? "-" : array.join(","));

async function GetPatientPhoneAndEmail(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );

  if (patient) {
    const phones = [];
    const emails = [];

    if (patient.telecom) {
      for (const contactPoint of patient.telecom) {
        const { system, value, use } = { ...contactPoint };
        if (system && value && use) {
          const item = `${value}(${capitalize(use)})`;
          if (system === "phone") phones.push(item);
          if (system === "email") emails.push(item);
        }
      }
    }

    const output = `Emails:${format(emails)}\nPhones:${format(phones)}\n`;
    return output;
  }

  return "Error:Patient_Not_Found";
}
