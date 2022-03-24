const Config = require("../config");
const Client = require("../L04_1_create_uscore_labresult.js");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();
const Axios = require("axios");
const { ConsoleReporter } = require("jasmine");
describe("L04_1_Create_USCore_LabResult_Tests", function () {
  it("L04_1_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L04_1_T01";
    const ObservationStatusCode = "final";
    const ObservationDateTime = "2020-10-11T20:30:00Z";
    const ObservationLOINCCode = "1975-2";
    const ObservationLOINCDisplay = "Bilirubin, serum";
    const ResultType = "numeric";

    // This needs to be a number, otherwise the Observation is not conformant
    const NumericResultValue = 8.6;

    const NumericResultUCUMUnit = "mg/dl";
    const CodedResultSNOMEDCode = "";
    const CodedResultSNOMEDDisplay = "";

    const result = await Client.CreateUSCoreR4LabObservation(
      baseUrl,
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
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L04_1_T02:Create Numerical Observation", async function () {
    const PatientIdentifierValue = "L04_1_T02";
    const ObservationStatusCode = "final";
    const ObservationDateTime = "2020-10-11T20:30:00Z";
    const ObservationLOINCCode = "1975-2";
    const ObservationLOINCDisplay = "Bilirubin, serum";
    const ResultType = "numeric";

    // This needs to be a number, otherwise the Observation is not conformant
    const NumericResultValue = 8.6;

    const NumericResultUCUMUnit = "mg/dl";
    const CodedResultSNOMEDCode = "";
    const CodedResultSNOMEDDisplay = "";
    const result = await Client.CreateUSCoreR4LabObservation(
      baseUrl,
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
    );
    //US Core Validation
    const valid = await ValidateUSCoreObservation(baseUrl, result);
    expect(valid).toEqual("OK");
    //Content Validation
    MyObservation = JSON.parse(result);
    expect(MyObservation.status).toEqual(ObservationStatusCode);
    expect(MyObservation.effectiveDateTime).toEqual(ObservationDateTime);
    expect(MyObservation.valueQuantity.value).toEqual(NumericResultValue);
    expect(MyObservation.valueQuantity.unit).toEqual(NumericResultUCUMUnit);
    expect(MyObservation.code.coding[0].code).toEqual(ObservationLOINCCode);
  });
  it("L04_1_T03:Create Categorical Observation", async function () {
    const PatientIdentifierValue = "L04_1_T02";
    const ObservationStatusCode = "final";
    const ObservationDateTime = "2020-10-11T20:30:00Z";
    const ObservationLOINCCode = "5778-6";
    const ObservationLOINCDisplay = "Color of Urine";
    const ResultType = "Coded";
    const NumericResultValue = "";
    const NumericResultUCUMUnit = "";
    const CodedResultSNOMEDCode = "371244009";
    const CodedResultSNOMEDDisplay = "Yellow";
    // Generate Observation Resource
    const result = await Client.CreateUSCoreR4LabObservation(
      baseUrl,
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
    );
    //US Core Validation
    const valid = await ValidateUSCoreObservation(baseUrl, result);
    expect(valid).toEqual("OK");
    //Check that fundamental items are also there!
    MyObservation = JSON.parse(result);
    expect(MyObservation.status).toEqual(ObservationStatusCode);
    expect(MyObservation.effectiveDateTime).toEqual(ObservationDateTime);
    expect(MyObservation.valueCodeableConcept.coding[0].code).toEqual(
      CodedResultSNOMEDCode
    );
    expect(MyObservation.valueCodeableConcept.coding[0].display).toEqual(
      CodedResultSNOMEDDisplay
    );
  });

  async function ValidateUSCoreObservation(server, resourceText) {
    var urlFHIREndpoint = server;
    var ResourceClass = "Observation";
    var OperationName = "$validate";
    var FullURL = urlFHIREndpoint + "/" + ResourceClass + "/" + OperationName;
    //We call the FHIR endpoint with our parameters
    let result = await Axios.post(FullURL, resourceText, {
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    });
    var status = "OK";
    result = result.data.issue[0].details.text;
    if (result != "Validation successful, no issues found") {
      status = result;
    }

    return status; // This needs to be status, otherwise will never equal "OK"
  }
});
