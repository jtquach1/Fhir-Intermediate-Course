const Config = require("./config");
const { GetIPSImmunizations } = require("./L03_3_get_clinical_data_from_ips");
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();
module.exports = { TestResults };

async function TestResults() {
  var outcome = [];
  //Level 1
  const T1_1 = await AddTests_L01_1();
  outcome.push(T1_1);
  const T1_2 = await AddTests_L01_2();
  outcome.push(T1_2);
  const T1_3 = await AddTests_L01_3();
  outcome.push(T1_3);
  //Level 2
  const T2_1 = await AddTests_L02_1();
  outcome.push(T2_1);
  //Level 3
  const T3_1 = await AddTests_L03_1();
  outcome.push(T3_1);
  const T3_2 = await AddTests_L03_2();
  outcome.push(T3_2);
  const T3_3 = await AddTests_L03_3();
  outcome.push(T3_3);
  //Level 4
  const T4_1 = await AddTests_L04_1();
  outcome.push(T4_1);
  const T4_2 = await AddTests_L04_2();
  outcome.push(T4_2);
  //Level 5
  const T5_1 = await AddTests_L05_1();
  outcome.push(T5_1);
  return outcome;
}

async function AddTests_L01_1() {
  const T_L01_1 = require("./L01_1_fetch_demographics");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L01_1_T01",
    PatientIdentifierValue: "L01_1_T01",
  });
  TestParam.push({
    Test_Key: "L01_1_T02",
    PatientIdentifierValue: "L01_1_T02",
  });
  TestParam.push({
    Test_Key: "L01_1_T03",
    PatientIdentifierValue: "L01_1_T03",
  });
  TestParam.push({
    Test_Key: "L01_1_T04",
    PatientIdentifierValue: "L01_1_T04",
  });
  TestParam.push({
    Test_Key: "L01_1_T05",
    PatientIdentifierValue: "L01_1_T05",
  });
  TestParam.push({
    Test_Key: "L01_1_T06",
    PatientIdentifierValue: "L01_1_T06",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L01_1.GetPatientPhoneAndEmail(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
      //console.log(test.Test_Key);
      //console.log(result);
    })
  );
  //console.log(JSON.stringify(TestResults));
  return TestResults;
}

async function AddTests_L01_2() {
  const T_L01_2 = require("./L01_2_compare_demographics");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L01_2_T01",
    PatientIdentifierValue: "L01_2_T01",
    Family: "",
    Given: "",
    Gender: "",
    Birth: "",
  });
  TestParam.push({
    Test_Key: "L01_2_T02",
    PatientIdentifierValue: "L01_2_T02",
    Family: "Dougras",
    Given: "Jamieson Harris",
    Gender: "male",
    Birth: "1968-07-23",
  });
  TestParam.push({
    Test_Key: "L01_2_T03",
    PatientIdentifierValue: "L01_2_T02",
    Family: "Douglas",
    Given: "Jamieson",
    Gender: "male",
    Birth: "1968-07-23",
  });
  TestParam.push({
    Test_Key: "L01_2_T04",
    PatientIdentifierValue: "L01_2_T02",
    Family: "Douglas",
    Given: "Jamieson Harris",
    Gender: "male",
    Birth: "1968-07-24",
  });
  TestParam.push({
    Test_Key: "L01_2_T05",
    PatientIdentifierValue: "L01_2_T02",
    Family: "Douglas",
    Given: "Jamieson Harris",
    Gender: "female",
    Birth: "1968-07-23",
  });
  TestParam.push({
    Test_Key: "L01_2_T06",
    PatientIdentifierValue: "L01_2_T02",
    Family: "Douglas",
    Given: "Jamieson Harris",
    Gender: "male",
    Birth: "1968-07-23",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L01_2.GetDemographicComparison(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue,
        test.Family,
        test.Given,
        test.Gender,
        test.Birth
      );
      TestResults.push({ key: test.Test_Key, value: result });
      //    console.log(test.Test_Key);
      //    console.log(result);
    })
  );
  //  console.log(JSON.stringify(TestResults));
  return TestResults;
}
async function AddTests_L01_3() {
  const T_L01_3 = require("./L01_3_providers_near_patient");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L01_3_T01",
    PatientIdentifierValue: "L01_3_T01",
  });
  TestParam.push({
    Test_Key: "L01_3_T02",
    PatientIdentifierValue: "L01_3_T02",
  });
  TestParam.push({
    Test_Key: "L01_3_T03",
    PatientIdentifierValue: "L01_3_T03",
  });
  TestParam.push({
    Test_Key: "L01_3_T04",
    PatientIdentifierValue: "L01_3_T04",
  });
  TestParam.push({
    Test_Key: "L01_3_T05",
    PatientIdentifierValue: "L01_3_T05",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L01_3.GetProvidersNearCity(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  return TestResults;
}

async function AddTests_L02_1() {
  const T_L02_1 = require("./L02_1_fetch_ethnicity");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L02_1_T01",
    PatientIdentifierValue: "L02_1_T01",
  });
  TestParam.push({
    Test_Key: "L02_1_T02",
    PatientIdentifierValue: "L02_1_T02",
  });
  TestParam.push({
    Test_Key: "L02_1_T03",
    PatientIdentifierValue: "L02_1_T03",
  });
  TestParam.push({
    Test_Key: "L02_1_T04",
    PatientIdentifierValue: "L02_1_T04",
  });
  TestParam.push({
    Test_Key: "L02_1_T05",
    PatientIdentifierValue: "L02_1_T05",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L02_1.GetEthnicity(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  return TestResults;
}

async function AddTests_L03_1() {
  const T_L03_1 = require("./L03_1_fetch_immunizations");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L03_1_T01",
    PatientIdentifierValue: "L03_1_T01",
  });
  TestParam.push({
    Test_Key: "L03_1_T02",
    PatientIdentifierValue: "L03_1_T02",
  });
  TestParam.push({
    Test_Key: "L03_1_T03",
    PatientIdentifierValue: "L03_1_T03",
  });
  TestParam.push({
    Test_Key: "L03_1_T04",
    PatientIdentifierValue: "L03_1_T04",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L03_1.GetImmunizations(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  return TestResults;
}

async function AddTests_L03_2() {
  const T_L03_2 = require("./L03_2_fetch_medications");
  var TestResults = [];
  var TestParam = [];
  TestParam.push({
    Test_Key: "L03_2_T01",
    PatientIdentifierValue: "L03_2_T01",
  });
  TestParam.push({
    Test_Key: "L03_2_T02",
    PatientIdentifierValue: "L03_2_T02",
  });
  TestParam.push({
    Test_Key: "L03_2_T03",
    PatientIdentifierValue: "L03_2_T03",
  });
  TestParam.push({
    Test_Key: "L03_2_T04",
    PatientIdentifierValue: "L03_2_T04",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L03_2.GetMedications(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  return TestResults;
}

async function AddTests_L03_3() {
  const T_L03_3 = require("./L03_3_get_clinical_data_from_ips");

  var TestResults = [];

  var TestParam = [];
  TestParam.push({
    Test_Key: "L03_3_T01",
    PatientIdentifierValue: "L03_3_T01",
  });
  TestParam.push({
    Test_Key: "L03_3_T02",
    PatientIdentifierValue: "L03_3_T02",
  });
  TestParam.push({
    Test_Key: "L03_3_T03",
    PatientIdentifierValue: "L03_3_T03",
  });
  TestParam.push({
    Test_Key: "L03_3_T04",
    PatientIdentifierValue: "L03_3_T04",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L03_3.GetIPSMedications(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  var TestParam = [];
  TestParam.push({
    Test_Key: "L03_3_T05",
    PatientIdentifierValue: "L03_3_T04",
  });
  TestParam.push({
    Test_Key: "L03_3_T06",
    PatientIdentifierValue: "L03_3_T03",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L03_3.GetIPSImmunizations(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );

  return TestResults;
}

async function AddTests_L04_1() {
  const T_L04_1 = require("./L04_1_create_uscore_labresult");

  var TestResults = [];

  var TestParam = [];

  TestParam.push({
    Test_Key: "L04_1_T01",
    PatientIdentifierValue: "L04_1_T01",
    ObservationStatusCode: "final",
    ObservationDateTime: "2020-10-11T20:30:00Z",
    ObservationLOINCCode: "1975-2",
    ObservationLOINCDisplay: "Bilirubin, serum",
    ResultType: "numeric",
    NumericResultValue: "8.6",
    NumericResultUCUMUnit: "mg/dl",
    CodedResultSNOMEDCode: "",
    CodedResultSNOMEDDisplay: "",
  });
  TestParam.push({
    Test_Key: "L04_1_T02",
    PatientIdentifierValue: "L04_1_T02",
    ObservationStatusCode: "final",
    ObservationDateTime: "2020-10-11T20:30:00Z",
    ObservationLOINCCode: "1975-2",
    ObservationLOINCDisplay: "Bilirubin, serum",
    ResultType: "numeric",
    NumericResultValue: "8.6",
    NumericResultUCUMUnit: "mg/dl",
    CodedResultSNOMEDCode: "",
    CodedResultSNOMEDDisplay: "",
  });
  TestParam.push({
    Test_Key: "L04_1_T03",
    PatientIdentifierValue: "L04_1_T02",
    ObservationStatusCode: "final",
    ObservationDateTime: "2020-10-11T20:30:00Z",
    ObservationLOINCCode: "5778-6",
    ObservationLOINCDisplay: "Color of Urine",
    ResultType: "Coded",
    NumericResultValue: "",
    NumericResultUCUMUnit: "",
    CodedResultSNOMEDCode: "371244009",
    CodedResultSNOMEDDisplay: "Yellow",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L04_1.CreateUSCoreR4LabObservation(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue,
        test.ObservationStatusCode,
        test.ObservationDateTime,
        test.ObservationLOINCCode,
        test.ObservationLOINCDisplay,
        test.ResultType,
        test.NumericResultValue,
        test.NumericResultUCUMUnit,
        test.CodedResultSNOMEDCode,
        test.CodedResultSNOMEDDisplay
      );
      if (test.Test_Key != "L04_1_T01") {
        //Patient not found -> no resource
        if (result != "") {
          const valid = await ValidateUSCoreResource(
            baseUrl,
            result,
            "Observation"
          );
          TestResults.push({ key: test.Test_Key, value: valid });
        } else {
          TestResults.push({ key: test.Test_Key, value: "" });
        }
      } else {
        TestResults.push({ key: test.Test_Key, value: result });
      }
    })
  );
  return TestResults;
}

async function AddTests_L04_2() {
  const T_L04_2 = require("./L04_2_create_uscore_immunization");

  var TestResults = [];

  var TestParam = [];

  TestParam.push({
    Test_Key: "L04_2_T01",
    PatientIdentifierValue: "L04_2_T01",
    ImmunizationStatusCode: "completed",
    ImmunizationDateTime: "2021-10-25",
    ProductCVXCode: "173",
    ProductCVXDisplay: "cholera, BivWC",
    ReasonCode: "",
  });
  TestParam.push({
    Test_Key: "L04_2_T02",
    PatientIdentifierValue: "L04_2_T02",
    ImmunizationStatusCode: "completed",
    ImmunizationDateTime: "2021-10-25",
    ProductCVXCode: "173",
    ProductCVXDisplay: "cholera, BivWC",
    ReasonCode: "",
  });
  TestParam.push({
    Test_Key: "L04_2_T03",
    PatientIdentifierValue: "L04_2_T02",
    ImmunizationStatusCode: "not-done",
    ImmunizationDateTime: "2021-10-30T10:30:00Z",
    ProductCVXCode: "207",
    ProductCVXDisplay: "COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5 mL dose",
    ReasonCode: "IMMUNE",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L04_2.CreateUSCoreR4Immunization(
        baseUrl,
        PatientIdentifierSystem,
        test.PatientIdentifierValue,
        test.ImmunizationStatusCode,
        test.ImmunizationDateTime,
        test.ProductCVXCode,
        test.ProductCVXDisplay,
        test.ReasonCode
      );

      if (test.Test_Key != "L04_2_T01") {
        //Patient not found -> no resource
        if (result != "") {
          const valid = await ValidateUSCoreResource(
            baseUrl,
            result,
            "Immunization"
          );
          TestResults.push({ key: test.Test_Key, value: valid });
        } else {
          TestResults.push({ key: test.Test_Key, value: "" });
        }
      } else {
        TestResults.push({ key: test.Test_Key, value: result });
      }
    })
  );
  return TestResults;
}

async function AddTests_L05_1() {
  const T_L05_1 = require("./L05_1_expand_valueset");
  const termUrl = Config.TerminologyServerEndpoint();
  var TestResults = [];

  var TestParam = [];

  TestParam.push({
    Test_Key: "L05_1_T01",
    url: "http://snomed.info/sct?fhir_vs=isa/73211009",
    filter: "diaxetes",
  });
  TestParam.push({
    Test_Key: "L05_1_T02",
    url: "http://snomed.info/sct?fhir_vs=isa/73211009",
    filter: "Drug-induced diabetes",
  });

  await Promise.all(
    TestParam.map(async (test) => {
      const result = await T_L05_1.ExpandValueSetForCombo(
        termUrl,
        test.url,
        test.filter
      );
      TestResults.push({ key: test.Test_Key, value: result });
    })
  );
  return TestResults;
}

async function ValidateUSCoreResource(server, resourceText, ResourceType) {
  const Axios = require("axios");
  var urlFHIREndpoint = server;
  var ResourceClass = ResourceType;
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

  return result;
}
