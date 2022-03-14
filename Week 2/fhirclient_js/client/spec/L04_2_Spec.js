const Config = require("../config");
const Client = require("../L04_2_create_uscore_immunization.js");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();
const Axios = require("axios");

const { ConsoleReporter } = require("jasmine");
describe("L04_2_Create_USCore_Immunization_Tests", function () {
  it("L04_2_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L04_2_T01";
    const ImmunizationStatusCode = "completed";
    const ImmunizationDateTime = "2021-10-25";
    const ProductCVXCode = "173";
    const ProductCVXDisplay = "cholera, BivWC";
    const ReasonCode = "";

    const result = await Client.CreateUSCoreR4Immunization(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      ImmunizationStatusCode,
      ImmunizationDateTime,
      ProductCVXCode,
      ProductCVXDisplay,
      ReasonCode
    );

    expect(result).toEqual("Error:Patient_Not_Found");
  });

  it("L04_1_T02:Immunization Completed", async function () {
    const PatientIdentifierValue = "L04_2_T02";
    const ImmunizationStatusCode = "completed";
    const ImmunizationDateTime = "2021-10-25";
    const ProductCVXCode = "173";
    const ProductCVXDisplay = "cholera, BivWC";
    const ReasonCode = "";

    const result = await Client.CreateUSCoreR4Immunization(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      ImmunizationStatusCode,
      ImmunizationDateTime,
      ProductCVXCode,
      ProductCVXDisplay,
      ReasonCode
    );
    //US Core Validation
    const valid = await ValidateUSCoreImmunization(baseUrl, result);
    expect(valid).toEqual("OK");
    //Content Validation
    MyImmunization = JSON.parse(result);
    expect(MyImmunization.status).toEqual(ImmunizationStatusCode);
    expect(MyImmunization.occurrenceDateTime).toEqual(ImmunizationDateTime);
    expect(MyImmunization.vaccineCode.coding[0].code).toEqual(ProductCVXCode);
  });
  it("L04_2_T03:Immunization Not Done", async function () {
    const PatientIdentifierValue = "L04_2_T02";
    const ImmunizationStatusCode = "not-done";
    const ImmunizationDateTime = "2021-10-30T10:30:00Z";
    const ProductCVXCode = "207";
    const ProductCVXDisplay = "COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5 mL dose";
    const ReasonCode = "IMMUNE";

    const result = await Client.CreateUSCoreR4Immunization(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      ImmunizationStatusCode,
      ImmunizationDateTime,
      ProductCVXCode,
      ProductCVXDisplay,
      ReasonCode
    );
    //US Core Validation
    const valid = await ValidateUSCoreImmunization(baseUrl, result);
    expect(valid).toEqual("OK");
    //Content Validation
    MyImmunization = JSON.parse(result);
    expect(MyImmunization.status).toEqual(ImmunizationStatusCode);
    expect(MyImmunization.occurrenceDateTime).toEqual(ImmunizationDateTime);
    expect(MyImmunization.vaccineCode.coding[0].code).toEqual(ProductCVXCode);
    expect(MyImmunization.statusReason.coding[0].code).toEqual(ReasonCode);
  });

  async function ValidateUSCoreImmunization(server, resourceText) {
    var urlFHIREndpoint = server;
    var ResourceClass = "Immunization";
    var OperationName = "$validate";
    var FullURL = urlFHIREndpoint + "/" + ResourceClass + "/" + OperationName;
    //We call the FHIR endpoint with our parameters
    let result = await Axios.post(FullURL, resourceText, {
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    });
    return result.statusText;
  }
});
