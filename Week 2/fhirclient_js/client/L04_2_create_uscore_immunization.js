const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { CreateUSCoreR4Immunization };

async function CreateUSCoreR4Immunization(
  server,
  PatientIdentifierSystem,
  PatientIdentifierValue,
  ImmunizationStatusCode,
  ImmunizationDateTime,
  ProductCVXCode,
  ProductCVXDisplay,
  ReasonCode
) {
  const patient = await GetPatient(
    server,
    PatientIdentifierSystem,
    PatientIdentifierValue
  );

  const getText = () => {
    const { given, family } = { ...patient.name?.[0] };
    const name = given?.[0] && family ? `${given[0]} ${family}` : "";
    const elements = {
      status: ImmunizationStatusCode,
      statusReason: ReasonCode,
      vaccineCode: ProductCVXDisplay,
      subject: `Generated Summary. identifier: ${PatientIdentifierValue}; name: ${name}; birthDate: ${patient.birthDate}`,
      occurence: ImmunizationDateTime,
    };
    const text = {
      status: "generated",
      div:
        '<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative</b></p>' +
        Object.keys(elements)
          .map((key) => `<p><b>${key}</b>: ${elements[key]}</p>`)
          .join("") +
        "</div>",
    };
    return text;
  };

  if (patient) {
    const text = getText();

    const immunization = {
      resourceType: "Immunization",
      status: ImmunizationStatusCode,
      statusReason: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: ReasonCode,
          },
        ],
      },
      vaccineCode: {
        coding: [
          {
            system: "http://loinc.org",
            code: ProductCVXCode,
            display: ProductCVXDisplay,
          },
        ],
      },
      patient: {
        reference: `Patient/${PatientIdentifierValue}`,
      },
      occurrenceDateTime: ImmunizationDateTime,
      text,
    };

    return JSON.stringify(immunization);
  }
  return "Error:Patient_Not_Found";
}
