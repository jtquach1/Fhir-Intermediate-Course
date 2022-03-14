const Config = require("../config");
const Client = require("../L03_1_fetch_immunizations");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();
//L03_1_T01: Patient Does Not Exist
//L03_1_T02: Patient Exists, but has no immunization data
//L03_1_T03: Patient Exists, has some non-compliant imm resource
//L03_1_T04: Patient Exists, with one imm resource
//L03_1_T05: Patient Exists, with several imm resources

describe("L03_1_GetClinicalDataImmunization_Tests", function () {
  it("L03_1_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L03_1_T01";
    const result = await Client.GetImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L03_1_T02:Patient has no Immunization data", async function () {
    const PatientIdentifierValue = "L03_1_T02";
    const result = await Client.GetImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:No_Immunizations";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_1_T03:Patient has one immunization resource", async function () {
    const PatientIdentifierValue = "L03_1_T03";
    const result = await Client.GetImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Completed|158:influenza, injectable, quadrivalent|2020-01-08\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_1_T04:Patient with several immunization resources", async function () {
    const PatientIdentifierValue = "L03_1_T04";
    const result = await Client.GetImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Completed|207:COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5 mL dose|2020-01-10\n";
    match += "Completed|173:cholera, BivWC|2019-10-20\n";

    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
