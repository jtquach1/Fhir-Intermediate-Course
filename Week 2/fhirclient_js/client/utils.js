const Client = require("fhir-kit-client");
module.exports = { GetPatient };

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
