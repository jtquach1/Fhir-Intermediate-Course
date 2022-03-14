const Config = require("../config");
const Client = require("../L01_1_fetch_demographics");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L01_1_FetchDemographicData_Tests", function () {
  it("L01_1_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L01_1_T01";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L01_1_T02:Patient Exists, but has no telecom element", async function () {
    const PatientIdentifierValue = "L01_1_T02";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Emails:-\nPhones:-\n");
  });
  it("L01_1_T03:Patient Exists, only with one phone number", async function () {
    const PatientIdentifierValue = "L01_1_T03";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    const match = "Emails:-\nPhones:+15555555555(Home)\n".toUpperCase();
    expect(result.toUpperCase()).toEqual(match);
  });
  it("L01_1_T04:Patient Exists, only with one email address", async function () {
    const PatientIdentifierValue = "L01_1_T04";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    const match =
      "Emails:mymail@patientt04.com(Home)\nPhones:-\n".toUpperCase();
    expect(result.toUpperCase()).toEqual(match);
  });
  it("L01_1_T05:Patient Exists, with more than one phone number and email addresses", async function () {
    const PatientIdentifierValue = "L01_1_T05";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    const match =
      "Emails:mymail@patientt05job.com(Work),mymail@patientt05.com(Home)\nPhones:+15555555555(Work),+16666666666(Home)\n".toUpperCase();
    expect(result.toUpperCase()).toEqual(match);
  });
  it("L01_1_T06:Patient Exists, with one telecom which is not phone or email", async function () {
    const PatientIdentifierValue = "L01_1_T06";
    const result = await Client.GetPatientPhoneAndEmail(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Emails:-\nPhones:-\n");
  });
});
