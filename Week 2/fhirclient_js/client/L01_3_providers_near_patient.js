const Client = require("fhir-kit-client");
const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { GetProvidersNearCity };

async function GetProvidersNearCity(
  server,
  patientidentifiersystem,
  patientidentifiervalue
) {
  const patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );

  if (patient) {
    const city = patient.address?.[0]?.city;
    if (!city) return "Error:Patient_w/o_City";

    const providers = await searchProvidersInCity(server, city);
    if (!providers) return "Error:No_Provider_In_Patient_City";

    return providers
      .map((provider) => {
        const {
          name,
          address,
          telecom,
          qualification: qualifications,
        } = { ...provider };
        const fullName = `${name?.[0]?.family},${name?.[0]?.given?.join(" ")}`;
        const addresses = address?.[0]?.line?.join(" ");
        const telephone =
          telecom?.[0] && telecom[0].system === "phone" && telecom[0].value;
        const qualification = qualifications?.[0]?.code?.coding?.[0].display;
        return `${fullName}|Phone:${telephone}|${addresses}|${qualification}\n`;
      })
      .join("");
  }

  return "Error:Patient_Not_Found";
}

const searchProvidersInCity = async (fhirEndpoint, city) => {
  const fhirClient = new Client({ baseUrl: fhirEndpoint });
  const result = await fhirClient.search({
    resourceType: "Practitioner",
    searchParams: {
      "address-city": city,
    },
  });
  const providers = result.entry?.map((entry) => entry.resource);
  return providers;
};
