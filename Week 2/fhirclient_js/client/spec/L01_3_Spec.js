const Config = require("../config");
const Client = require("../L01_3_providers_near_patient");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L01_3_GetProvidersNearPatient_Tests", function () {
  it("L01_3_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L01_3_T01";
    const result = await Client.GetProvidersNearCity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L01_3_T02:Patient With No City Element", async function () {
    const PatientIdentifierValue = "L01_3_T02";
    const result = await Client.GetProvidersNearCity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:Patient_w/o_City";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_3_T03:No Provider in The City", async function () {
    const PatientIdentifierValue = "L01_3_T03";
    const result = await Client.GetProvidersNearCity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "Error:No_Provider_In_Patient_City";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_3_T04:One Provider in The City", async function () {
    const PatientIdentifierValue = "L01_3_T04";
    const result = await Client.GetProvidersNearCity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "OnlyPhysician,InTown|Phone:+402-772-7777|2000 ONE PROVIDER DRIVE|OB/GYN\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_3_T05:Several Providers in the City", async function () {
    const PatientIdentifierValue = "L01_3_T05";
    const result = await Client.GetProvidersNearCity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "OnePhysician,First|Phone:+402-772-7777|2000 ONE PROVIDER DRIVE|OB/GYN\nTwoPhysician,Second|Phone:+403-772-7777|3000 TWO PROVIDER DRIVE|FAMILY MEDICINE\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
