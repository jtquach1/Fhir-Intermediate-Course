const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { CreateUSCoreR4LabObservation };

async function CreateUSCoreR4LabObservation(
  server,
  PatientIdentifierSystem,
  PatientIdentifierValue,
  ObservationStatusCode,
  ObservationDateTime,
  ObservationLOINCCode,
  ObservationLOINCDisplay,
  ResultType,
  NumericResultValue,
  NumericResultUCUMUnit,
  CodedResultSNOMEDCode,
  CodedResultSNOMEDDisplay
) {
  const patient = await GetPatient(
    server,
    PatientIdentifierSystem,
    PatientIdentifierValue
  );

  const getResultValue = () => {
    switch (ResultType.toLowerCase()) {
      case "numeric":
        return {
          valueQuantity: {
            value: NumericResultValue,
            unit: NumericResultUCUMUnit,
            system: "http://unitsofmeasure.org",
          },
        };
      case "coded":
        return {
          valueCodeableConcept: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: CodedResultSNOMEDCode,
                display: CodedResultSNOMEDDisplay,
              },
            ],
          },
        };
      default:
        return {};
    }
  };

  const getText = () => {
    const { given, family } = { ...patient.name?.[0] };
    const name = given?.[0] && family ? `${given[0]} ${family}` : "";
    const elements = {
      code: ObservationLOINCDisplay,
      subject: `Generated Summary. identifier: ${PatientIdentifierValue}; name: ${name}; birthDate: ${patient.birthDate}`,
      effective: ObservationDateTime,
      value:
        NumericResultValue && NumericResultUCUMUnit
          ? `${NumericResultValue} ${NumericResultUCUMUnit}`
          : `${CodedResultSNOMEDDisplay}`,
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
    const resultValue = getResultValue();

    const text = getText();

    const observation = {
      resourceType: "Observation",
      status: ObservationStatusCode,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: ObservationLOINCCode,
            display: ObservationLOINCDisplay,
          },
        ],
      },
      subject: {
        reference: `Patient/${PatientIdentifierValue}`,
      },
      effectiveDateTime: ObservationDateTime,
      ...resultValue,
      text,
    };

    return JSON.stringify(observation);
  }
  return "Error:Patient_Not_Found";
}
