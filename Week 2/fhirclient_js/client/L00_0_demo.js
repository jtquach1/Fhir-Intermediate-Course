// This module is a demo in node js, created to understand different ways to query a FHIR Server
// and retrieve/create Patient Demographic Information and US Core/IPS conformant resources
// You are free to copy code from this demos to create your functions.
// (This is not mandatory, though)
// We will demo:
// 1) How to get a Patient's full name and address
// 2) How to get a US Core Race extension
// 3) How to read all US Core Condition resources for a patient
// 4) How to create a US Core Allergy conformant resource
// 5) How to read lab results from an IPS document for a patient
// 6) How to expand  a valueset using a terminology server
const Client = require("fhir-kit-client");
const Axios = require("axios"); //When we want to do something not supported by client we use axios
module.exports = {
  L00_1_GetPatientFullNameAndAddress,
  L00_2_GetUSCoreRace,
  L00_3_GetConditions,
  L00_4_CreateUSCoreAllergyIntollerance,
  L00_5_GetLabResultsFromIPS,
  L00_6_ExpandValueset,
};

async function L00_1_GetPatientFullNameAndAddress(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  var ret = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );
  aux = "Error:Patient_Not_Found";
  if (ret) {
    aux = "";
    var auxA = "";
    var auxN = "";

    if (ret.address) {
      //
      //All known addresses
      //line(s) - city - , state , country (postalCode) /
      //
      ret.address.forEach((ad) => {
        paddr = "";
        ad.line.forEach((l) => {
          paddr += l + " ";
        });
        if (ad.city) {
          paddr = paddr + " - " + ad.city;
        }
        if (ad.state) {
          paddr = paddr + " , " + ad.state;
        }
        if (ad.country) {
          paddr = paddr + " , " + ad.country;
        }
        if (ad.postalCode) {
          paddr = paddr + " (" + ad.postalCode + ")";
        }

        auxA = auxA + paddr + " / ";
      });
    }
    //Only the first repetition of name
    if (ret.name) {
      var name = ret.name[0];
      var first = "";
      name.given.forEach((m) => {
        first += m + " ";
      });

      auxN = ret.name[0].family;
      auxN = auxN + "," + first;
    }
    if (auxN == "") {
      auxN = "-";
    }
    if (auxA == "") {
      auxA = "-";
    }
    aux = "Full Name:" + auxN + "\n" + "Address:" + auxA + "\n";
  }
  return aux;
}

async function GetPatient(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const fhirClient = new Client({
    baseUrl: server,
  });

  var PatientInfo = null;
  let searchResponse = await fhirClient.search({
    resourceType: "Patient",
    searchParams: {
      identifier: patientidentifiersystem + "|" + patientidentifiervalue,
    },
  });
  entries = searchResponse.entry;
  if (entries) {
    PatientInfo = entries[0].resource;
  }
  return PatientInfo;
}

async function L00_2_GetUSCoreRace(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  var p = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );
  aux = "Error:Patient_Not_Found";
  if (p) {
    var auxt = "";
    var auxo = "";
    var auxd = "";
    var ethnicityExtensionUrl =
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race";
    var aux = "Error:No_us-core-race_Extension";
    e = p.extension;
    if (e) {
      p.extension.forEach((ef) => {
        if (ef.url == ethnicityExtensionUrl) {
          aux = "";
          ef.extension.forEach((efs) => {
            switch (efs.url) {
              case "text":
                auxt = "text|" + efs.valueString + "\n";
                break;
              case "ombCategory":
                c = efs.valueCoding;
                auxo = "code|" + c.code + ":" + c.display + "\n";
                break;
              case "detailed":
                c = efs.valueCoding;
                auxd += "detail|" + c.code + ":" + c.display + "\n";
                break;
              default:
                break;
            }
          });

          aux = aux + auxt;
          aux = aux + auxo;
          aux = aux + auxd;
          aux = aux.trim();
          // break;
        }
      });
      if (auxt == "" || auxo == "") {
        aux = "Error:Non_Conformant_us-core-race_Extension";
      }
    }
  }
  return aux;
}

async function L00_3_GetConditions(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  var patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );
  aux = "Error:Patient_Not_Found";
  if (patient) {
    const fhirClient = new Client({
      baseUrl: server,
    });
    var aux = "Error:No_Conditions";

    let searchResponse = await fhirClient.search({
      resourceType: "Condition",
      searchParams: { patient: patient.id },
    });
    entries = searchResponse.entry;

    if (entries) {
      aux = "";
      entries.forEach((e) => {
        var oneP = e.resource;
        cStatus = oneP.clinicalStatus.coding[0].display;
        cVerification = oneP.verificationStatus.coding[0].display;
        cCategory = oneP.category[0].coding[0].display;
        cCode = oneP.code.coding[0].code + ":" + oneP.code.coding[0].display;
        cDate = oneP.onsetDateTime;
        aux +=
          cStatus +
          "|" +
          cVerification +
          "|" +
          cCategory +
          "|" +
          cCode +
          "|" +
          cDate +
          "\n";
      });
    }
  }
  return aux;
}

async function L00_4_CreateUSCoreAllergyIntollerance(
  server,
  patientidentifiersystem,
  patientidentifiervalue,
  ClinicalStatusCode,
  VerificationStatusCode,
  CategoryCode,
  CriticalityCode,
  AllergySnomedCode,
  AllergySnomedDisplay,
  ManifestationSnomedCode,
  ManifestationSnomedDisplay,
  ManifestationSeverityCode
) {
  var patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );
  aux = "Error:Patient_Not_Found";
  if (patient) {
    const Allergy = {
      resourceType: "AllergyIntolerance",
      meta: {
        profile: [
          "http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance",
        ],
      },
      text: {
        status: "generated",
        div: '<div xmlns="http://www.w3.org/1999/xhtml">Redacted</div>',
      },
      clinicalStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
            code: ClinicalStatusCode,
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
            code: VerificationStatusCode,
          },
        ],
      },
      category: [CategoryCode],
      criticality: CriticalityCode,
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: AllergySnomedCode,
            display: AllergySnomedDisplay,
          },
        ],
        text: AllergySnomedDisplay,
      },
      patient: {
        reference: "Patient/example",
        display: "Amy V. Shaw",
      },
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: ManifestationSnomedCode,
                  display: ManifestationSnomedDisplay,
                },
              ],
              text: ManifestationSnomedDisplay,
            },
          ],
          severity: ManifestationSeverityCode,
        },
      ],
    };
    aux = JSON.stringify(Allergy);
  }
  return aux;
}

async function L00_5_GetLabResultsFromIPS(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  var patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );
  aux = "Error:Patient_Not_Found";
  if (patient) {
    aux = await GetIPSLabResult(server, patient);
  }
  return aux;
}

async function GetIPSLabResult(server, p) {
  var aux = await GetLabResultDetail(server, p);
  return aux;
}

async function GetLabResultDetail(server, patient) {
  var aux = "Error:No_IPS";

  const fhirClient = new Client({
    baseUrl: server,
  });

  var PatientInfo = null;
  let searchResponse = await fhirClient.search({
    resourceType: "Bundle",
    searchParams: { "composition.patient": patient.id },
  });
  entries = searchResponse.entry;

  if (entries) {
    aux = "Error:No_IPS_LabResult";
    OneDoc = entries[0].resource;
    if (OneDoc) {
      aux = GetLabResultsFromIps(OneDoc);
    }
  }

  return aux;
}
async function GetLabResultsFromIps(OneDoc) {
  aux = "";
  OneDoc.entry.forEach((e) => {
    var oneP = e.resource;
    //Only Observations
    if (oneP.resourceType == "Observation") {
      var m_category = oneP.category[0].coding[0].code;
      // Only laboratory items which are not panels
      if (m_category == "laboratory") {
        //Must support for IPS Laboratory
        var m_code = "";
        c = oneP.code;
        try {
          m_code = c.coding[0].code + ":" + c.coding[0].display;

          //Only one of these three will be true
          var m_result = "";
          if (oneP.valueString) {
            m_result = oneP.valueString;
          }
          if (oneP.valueQuantity) {
            m_result = oneP.valueQuantity.value + " " + oneP.valueQuantity.unit;
          }
          if (oneP.valueCodeableConcept) {
            m_result =
              oneP.valueCodeableConcept.coding[0].code +
              ":" +
              oneP.valueCodeableConcept.coding[0].display;
          }

          var m_status = oneP.status;

          var m_datefo = oneP.effectiveDateTime;

          aux +=
            m_code + "|" + m_datefo + "|" + m_status + "|" + m_result + "\n";
        } catch {}
      }
    }
  });
  return aux;
}

async function L00_6_ExpandValueset(server, Url, Filter) {
  var urlFHIREndpoint = server;
  var ResourceClass = "ValueSet";
  var OperationName = "$expand";
  var Parameters = "url=" + Url;
  if (Filter != "") {
    Parameters = Parameters + "&" + "filter=" + Filter;
  }
  var FullURL =
    urlFHIREndpoint +
    "/" +
    ResourceClass +
    "/" +
    OperationName +
    "?" +
    Parameters;

  //We call the FHIR endpoint with our parameters

  let result = await Axios.get(FullURL);
  var aux = "";
  if (result.data.expansion.contains) {
    result.data.expansion.contains.forEach((ec) => {
      aux += ec.code + "|" + ec.display + "\n";
    });
  }
  if (aux == "") {
    aux = "Error:ValueSet_Filter_Not_Found";
  }

  return aux;
}
