const Client = require("fhir-kit-client");
const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
const capitalize = Utils.capitalize;
module.exports = { GetImmunizations };

async function GetImmunizations(
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
    const fhirClient = new Client({
      baseUrl: server,
    });
    const searchResponse = await fhirClient.search({
      resourceType: "Immunization",
      searchParams: {
        patient: patient.id,
      },
    });
    const entries = searchResponse.entry;
    if (entries) {
      const immunizationToString = ({ resource }) => {
        const { status, vaccineCode, occurrenceDateTime } = { ...resource };
        const { coding } = { ...vaccineCode };
        const { code, display } = { ...coding?.[0] };
        const capitalizedStatus = capitalize(status);
        return `${capitalizedStatus}|${code}:${display}|${occurrenceDateTime}\n`;
      };
      return entries.map(immunizationToString).join("");
    }
    return "Error:No_Immunizations";
  }
  return "Error:Patient_Not_Found";
}
