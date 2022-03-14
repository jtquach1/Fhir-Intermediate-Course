const Config = require("../config");
const Client = require("../L02_1_fetch_ethnicity");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();
//L02_1_T01: Patient Does Not Exist
//L02_1_T02: Patient Exists, but has no extension for ethnicity
//L01_1_T03: Patient Exists, has a non-compliant extension for ethnicity
//L01_1_T04: Patient Exists, with a minimum compliant ethnicity extension
//L01_1_T05: Patient Exists, with a full ethnicity extension

describe("L02_1_GetEthnicity_Tests", function () {
  it("L02_1_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L02_1_T01";
    const result = await Client.GetEthnicity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L02_1_T02:Patient Has No Extension for Ethnicity", async function () {
    const PatientIdentifierValue = "L02_1_T02";
    const result = await Client.GetEthnicity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "ERROR:NO_US-CORE-ETHNICITY_EXTENSION";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L02_1_T03:Patient has a non-compliant ethnicity extension", async function () {
    const PatientIdentifierValue = "L02_1_T03";
    const result = await Client.GetEthnicity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "ERROR:NON_CONFORMANT_US-CORE-ETHNICITY_EXTENSION";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L02_1_T04:Patient with a minimum compliant ethnicity extension", async function () {
    const PatientIdentifierValue = "L02_1_T04";
    const result = await Client.GetEthnicity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match = "TEXT|HISPANIC OR LATINO\nCODE|2135-2:HISPANIC OR LATINO\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L02_1_T05:Patient with a full compliant ethnicity extension", async function () {
    const PatientIdentifierValue = "L02_1_T05";
    const result = await Client.GetEthnicity(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue
    );
    var match =
      "TEXT|HISPANIC OR LATINO\nCODE|2135-2:HISPANIC OR LATINO\nDETAIL|2184-0:DOMINICAN\nDETAIL|2148-5:MEXICAN\nDETAIL|2151-9:CHICANO\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
