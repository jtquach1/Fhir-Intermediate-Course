const Client = require("fhir-kit-client");
const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
const capitalize = Utils.capitalize;
module.exports = { GetIPSMedications, GetIPSImmunizations };

const getIPSDocument = async (
  server,
  patientidentifiersystem,
  patientidentifiervalue
) => {
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
      resourceType: "Bundle",
      searchParams: {
        "composition.patient": patient.id,
        "composition.type": "60591-5", // Composition.type
      },
    });
    const ipsDocument = searchResponse?.entry?.[0]?.resource;
    return ipsDocument ? ipsDocument : "Error:No_IPS";
  }
  return "Error:Patient_Not_Found";
};

const getMedicationsAndMedicationStatements = (ipsDocument) => {
  const medications = [];
  const medicationStatements = [];
  for (const entry of ipsDocument.entry) {
    const { resourceType } = { ...entry.resource };
    if (resourceType === "Medication") {
      medications.push(entry.resource);
    }
    if (resourceType === "MedicationStatement") {
      medicationStatements.push(entry.resource);
    }
  }
  return { medications, medicationStatements };
};

const getCodeAndDisplayString = (
  medications,
  medicationCodeableConcept,
  medicationReference
) => {
  if (medications.length !== 0) {
    const medication = medications.find(
      (medication) =>
        medication.id === medicationReference?.reference?.split("/")?.[1]
    );
    const { coding } = {
      ...(medicationCodeableConcept || medication.code),
    };
    const { code, display } = { ...coding?.[0] };
    return `${code}:${display}`;
  }

  return `no-medication-info:No information about medications`;
};

async function GetIPSMedications(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const ipsDocument = await getIPSDocument(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );

  if (typeof ipsDocument !== "string") {
    const { medications, medicationStatements } =
      getMedicationsAndMedicationStatements(ipsDocument);

    const medicationStatementToString = ({
      status,
      effectiveDateTime,
      effectivePeriod,
      medicationCodeableConcept,
      medicationReference,
    }) => {
      const capitalizedStatus = capitalize(status);
      const dateOrPeriod = effectiveDateTime || effectivePeriod?.start || "";
      const codeAndDisplay = getCodeAndDisplayString(
        medications,
        medicationCodeableConcept,
        medicationReference
      );
      return `${capitalizedStatus}|${dateOrPeriod}|${codeAndDisplay}\n`;
    };

    return medicationStatements.map(medicationStatementToString).join("");
  }
  return ipsDocument;
}

const getImmunizations = (ipsDocument) => {
  const immunizations = [];
  for (const entry of ipsDocument.entry) {
    const { resourceType } = { ...entry.resource };
    if (resourceType === "Immunization") {
      immunizations.push(entry.resource);
    }
  }
  return immunizations;
};

async function GetIPSImmunizations(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const ipsDocument = await getIPSDocument(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );

  if (typeof ipsDocument !== "string") {
    const immunizations = getImmunizations(ipsDocument);

    if (immunizations.length !== 0) {
      const immunizationToString = ({
        status,
        occurrenceDateTime,
        vaccineCode,
      }) => {
        const capitalizedStatus = capitalize(status);
        const { coding } = { ...vaccineCode };
        const { code, display } = { ...coding?.[0] };
        return `${capitalizedStatus}|${occurrenceDateTime}|${code}:${display}\n`;
      };

      return immunizations.map(immunizationToString).join("");
    }
    return "Error:IPS_No_Immunizations";
  }
  return ipsDocument;
}
