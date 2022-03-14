const Config = require("../config");
const Client = require("../L01_2_compare_demographics");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L01_2_CompareDemographicData_Tests", function () {
  it("L01_2_T01:Patient Not Found", async function () {
    const PatientIdentifierValue = "L01_2_T01";
    var myFamily = "";
    var myGiven = "";
    var myGender = "";
    var myBirth = "";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    expect(result).toEqual("Error:Patient_Not_Found");
  });
  it("L01_2_T02:CompareDemographics-different family name", async function () {
    const PatientIdentifierValue = "L01_2_T02";
    const myFamily = "Dougras";
    const myGiven = "Jamieson Harris";
    const myGender = "male";
    const myBirth = "1968-07-23";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    var match = "{family}|Dougras|Douglas|{red}\n";
    match += "{given}|Jamieson Harris|Jamieson Harris|{green}\n";
    match += "{gender}|MALE|MALE|{green}\n";
    match += "{birthDate}|1968-07-23|1968-07-23|{green}\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_2_T03:CompareDemographics-different given name", async function () {
    const PatientIdentifierValue = "L01_2_T02";
    const myFamily = "Douglas";
    const myGiven = "Jamieson";
    const myGender = "male";
    const myBirth = "1968-07-23";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    var match = "{family}|Douglas|Douglas|{green}\n";
    match += "{given}|Jamieson|Jamieson Harris|{red}\n";
    match += "{gender}|MALE|MALE|{green}\n";
    match += "{birthDate}|1968-07-23|1968-07-23|{green}\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_2_T04:CompareDemographics-different birth date", async function () {
    const PatientIdentifierValue = "L01_2_T02";
    const myFamily = "Douglas";
    const myGiven = "Jamieson Harris";
    const myGender = "male";
    const myBirth = "1968-07-24";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    var match = "{family}|Douglas|Douglas|{green}\n";
    match += "{given}|Jamieson Harris|Jamieson Harris|{green}\n";
    match += "{gender}|MALE|MALE|{green}\n";
    match += "{birthDate}|1968-07-24|1968-07-23|{red}\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_2_T05:CompareDemographics-different gender", async function () {
    const PatientIdentifierValue = "L01_2_T02";
    const myFamily = "Douglas";
    const myGiven = "Jamieson Harris";
    const myGender = "female";
    const myBirth = "1968-07-23";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    var match = "{family}|Douglas|Douglas|{green}\n";
    match += "{given}|Jamieson Harris|Jamieson Harris|{green}\n";
    match += "{gender}|FEMALE|MALE|{red}\n";
    match += "{birthDate}|1968-07-23|1968-07-23|{green}\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
  it("L01_2_T06:Compare Demographics-Everything is OK", async function () {
    const PatientIdentifierValue = "L01_2_T02";
    const myFamily = "Douglas";
    const myGiven = "Jamieson Harris";
    const myGender = "male";
    const myBirth = "1968-07-23";
    const result = await Client.GetDemographicComparison(
      baseUrl,
      PatientIdentifierSystem,
      PatientIdentifierValue,
      myFamily,
      myGiven,
      myGender,
      myBirth
    );
    var match = "{family}|Douglas|Douglas|{green}\n";
    match += "{given}|Jamieson Harris|Jamieson Harris|{green}\n";
    match += "{gender}|MALE|MALE|{green}\n";
    match += "{birthDate}|1968-07-23|1968-07-23|{green}\n";
    expect(result.toUpperCase()).toEqual(match.toUpperCase());
  });
});
