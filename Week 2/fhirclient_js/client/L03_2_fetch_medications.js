const Client = require("fhir-kit-client");
const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
const capitalize = Utils.capitalize;
module.exports = { GetMedications };

async function GetMedications(
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
      resourceType: "MedicationRequest",
      searchParams: {
        patient: patient.id,
      },
    });
    const entries = searchResponse.entry;
    if (entries) {
      const medicationRequestToString = ({ resource }) => {
        const {
          status,
          intent,
          authoredOn,
          medicationCodeableConcept,
          requester,
        } = {
          ...resource,
        };
        const { coding } = { ...medicationCodeableConcept };
        const { code, display } = { ...coding?.[0] };
        const capitalizedStatus = capitalize(status);
        const capitalizedIntent = capitalize(intent);
        return `${capitalizedStatus}|${capitalizedIntent}|${authoredOn}|${code}:${display}|${requester.display}\n`;
      };
      return entries.map(medicationRequestToString).join("");
    }
    return "Error:No_Medications";
  }
  return "Error:Patient_Not_Found";
}
