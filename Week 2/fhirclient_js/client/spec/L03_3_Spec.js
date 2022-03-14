const Config = require("../config");
const Client = require("../L03_3_get_clinical_data_from_ips");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L03_3_GetClinicalDataFromIPS_Tests", function () {
  it("L03_3_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L03_3_T01";
    const result = await Client.GetIPSMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L03_3_T02:Patient has no IPS", async function () {
    const PatientIdentifierValue = "L03_3_T02";
    const result = await Client.GetIPSMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:No_IPS";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_3_T03:Patient has one IPS with MEDS", async function () {
    const PatientIdentifierValue = "L03_3_T03";
    const result = await Client.GetIPSMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Active|2015-03|108774000:Product containing anastrozole (medicinal product)\n";
    match +=
      "Active|2016-01|412588001:Cimicifuga racemosa extract (substance)\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_3_T04:Patient has one IPS with no Meds", async function () {
    const PatientIdentifierValue = "L03_3_T04";
    const result = await Client.GetIPSMedications(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Active||no-medication-info:No information about medications\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_3_T05:Patient has one IPS with IMMS", async function () {
    const PatientIdentifierValue = "L03_3_T04";
    const result = await Client.GetIPSImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "Completed|1998-06-04T00:00:00+02:00|414005006:Diphtheria + Pertussis + Poliomyelitis + Tetanus vaccine\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L03_3_T06:Patient has one IPS with no Imms", async function () {
    const PatientIdentifierValue = "L03_3_T03";
    const result = await Client.GetIPSImmunizations(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:IPS_No_Immunizations";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
