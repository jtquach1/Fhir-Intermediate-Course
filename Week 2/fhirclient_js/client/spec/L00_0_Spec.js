
const Config = require('../config');
const Client = require('../L00_0_demo');
const baseUrl = Config.ServerEndpoint();
const PatientIdentifierSystem = Config.PatientIdentifierSystem();

describe("L00_Demo_Tests", function () {
    it("L00_1_T01:Patient Not Found", async function () {
        const PatientIdentifierValue = 'L00_1_T01';
        const result = await Client.L00_1_GetPatientFullNameAndAddress(baseUrl, PatientIdentifierSystem, PatientIdentifierValue);
        expect(result).toEqual('Error:Patient_Not_Found');
    });
    it("L00_1_T02:Patient with Full Address and Name", async function () {
        const PatientIdentifierValue = 'L00_1_T02';
        const result = await Client.L00_1_GetPatientFullNameAndAddress(baseUrl, PatientIdentifierSystem, PatientIdentifierValue);
        const match = `FULL NAME:PATIENT L00_1_T02 FAM,PATIENT L00_1_T02 GIV 
ADDRESS:128 THIS PATIENT DRIVE SUITE 318  - ANN ARBOR , MI , US (48103) / 256 THIS PATIENT AVE SUITE 320 - PENT HOUSE  - MONROE , MI , US (48161) / 
`;
        expect(result.toUpperCase()).toEqual(match.toUpperCase());
    });


    it("L00_1_T03:Patient with a full conformant us-core race extension", async function () {
        const PatientIdentifierValue = 'L00_1_T03';
        const result = await Client.L00_2_GetUSCoreRace(baseUrl, PatientIdentifierSystem, PatientIdentifierValue);
        const match = "TEXT|MIXED\nCODE|2028-9:ASIAN\nDETAIL|1586-7:SHOSHONE\nDETAIL|2036-2:FILIPINO";
        const r1 = match;
        const r2 = result;
        expect(r1.toUpperCase()).toEqual(r2.toUpperCase());
    });

    it("L00_1_T04:Patient with several us-core condition resources", async function () {
        const PatientIdentifierValue = 'L00_1_T04';
        const result = await Client.L00_3_GetConditions(baseUrl, PatientIdentifierSystem, PatientIdentifierValue);
        const match = "ACTIVE|CONFIRMED|PROBLEM LIST ITEM|442311008:LIVEBORN BORN IN HOSPITAL|2020-08-10\nACTIVE|CONFIRMED|PROBLEM LIST ITEM|69347004:NEONATAL JAUNDICE (DISORDER)|2020-08-10\n";
        const r1 = match;
        const r2 = result;
        expect(r1.toUpperCase()).toEqual(r2.toUpperCase());
    });

    it("L00_1_T05:Create US Core R4 Conformant Allergy Resource", async function () {
        const PatientIdentifierValue = 'L00_1_T04';
        const ClinicalStatusCode = "active";
        const VerificationStatusCode = "confirmed";
        const CategoryCode = "medication";
        const CriticalityCode = "high";
        const AllergySnomedCode = "387406002";
        const AllergySnomedDisplay = "Sulfonamide (substance)";
        const ManifestationSnomedCode = "271807003";
        const ManifestationSnomedDisplay = "Skin Rash";
        const ManifestationSeverityCode = "mild";

        const result = await Client.L00_4_CreateUSCoreAllergyIntollerance(baseUrl, PatientIdentifierSystem, PatientIdentifierValue,
            ClinicalStatusCode, VerificationStatusCode, CategoryCode, CriticalityCode, AllergySnomedCode, AllergySnomedDisplay,
            ManifestationSnomedCode, ManifestationSnomedDisplay, ManifestationSeverityCode);
        //The only error we expect is 'Patient does not exist', but this specific patient exists
        //so we do not cover this specific test here
        const status = await ValidateUSCoreAllergyIntolerance(baseUrl, result);
        const match = "OK";
        const r1 = match;
        const r2 = status;
        expect(r1.toUpperCase()).toEqual(r2.toUpperCase());
    });




    it("L00_1_T06:Terminology Service - Expand operation", async function () {

        const url = "http://snomed.info/sct?fhir_vs";
        const filter = "Radioisotope myocardial imaging procedure";
        const tserver = Config.TerminologyServerEndpoint();
        const result = await Client.L00_6_ExpandValueset(tserver, url, filter);
        const match = "64432007|RADIOISOTOPE MYOCARDIAL IMAGING PROCEDURE\n";
        const r1 = match;
        const r2 = result;
        expect(r1.toUpperCase()).toEqual(r2.toUpperCase());
    });


    it("L00_1_T07:Get Lab Results from IPS Document", async function () {
        const PatientIdentifierValue = 'L03_3_T03';
        const result = await Client.L00_5_GetLabResultsFromIPS(baseUrl, PatientIdentifierSystem, PatientIdentifierValue);
        var match = "882-1:ABO and Rh group [Type] in Blood|2015-10-10T09:15:00+01:00|final|278149003:Blood group A Rh(D) positive\n";
        match += "945-6:C Ab [Presence] in Serum or Plasma|2015-10-10T09:35:00+01:00|final|10828004:Positive\n";
        match += "1018-1:E Ab [Presence] in Serum or Plasma|2015-10-10T09:35:00+01:00|final|10828004:Positive\n";
        match += "1156-9:little c Ab [Presence] in Serum or Plasma|2015-10-10T09:35:00+01:00|final|260385009:Negative\n";
        match += "17856-6:Hemoglobin A1c/Hemoglobin.total in Blood by HPLC|2017-11-10T08:20:00+01:00|final|7.5 %\n";
        match += "42803-7:Bacteria identified in Isolate|2017-12-10T08:20:00+01:00|final|115329001:Methicillin resistant Staphylococcus aureus\n";
        expect(result).toEqual(match)
    });

    async function ValidateUSCoreAllergyIntolerance(server, resourceText) {
        const Axios = require('axios');
        var urlFHIREndpoint = server;
        var ResourceClass = "AllergyIntolerance";
        var OperationName = "$validate";
        var FullURL = urlFHIREndpoint + "/" + ResourceClass + "/" + OperationName;
        //We call the FHIR endpoint with our parameters
        let result = await Axios.post(
            FullURL, resourceText, {
            headers: {
                "Content-Type": "application/fhir+json",
                "Accept": "application/fhir+json"
            }
        }
        );
        status = "ok";
        result = result.data.issue[0].details.text;
        if (result != "Validation successful, no issues found") { status = result; }
        return status;

    }
});
