const Config = require("../config");
const Client = require("../L03_2_fetch_medications");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L03_1_GetClinicalDataMedication_Tests", function () {
  it("L03_1_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L03_2_T01";
    const result = await Client.GetMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L03_1_T02:Patient has no Medication data", async function () {
    const PatientIdentifierValue = "L03_2_T02";
    const result = await Client.GetMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:No_Medications";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_1_T03:Patient has one Medication resource", async function () {
    const PatientIdentifierValue = "L03_2_T03";
    const result = await Client.GetMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Active|Order|2021-01-05|582620:Nizatidine 15 MG/ML Oral Solution [Axid]|John Requester, MD\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_1_T04:Patient with several Medication resources", async function () {
    const PatientIdentifierValue = "L03_2_T04";
    const result = await Client.GetMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Active|Order|2021-01-05|582620:Nizatidine 15 MG/ML Oral Solution [Axid]|Mary Requesting, MD\n";
    match +=
      "Active|Order|2021-01-05|198436:Acetaminophen 325 MG Oral Capsule|Mary Requesting, MD\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
