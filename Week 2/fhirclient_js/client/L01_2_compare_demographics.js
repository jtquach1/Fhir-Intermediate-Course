const Client = require("fhir-kit-client");
const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { GetDemographicComparison };

async function GetDemographicComparison(
  server,
  patientidentifiersystem,
  patientidentifiervalue,
  myFamily,
  myGiven,
  myGender,
  myBirthDate
) {
  const patient = await GetPatient(
    server,
    patientidentifiersystem,
    patientidentifiervalue
  );

  if (patient) {
    const humanName = patient.name?.[0];
    const family = humanName.family;
    const given = humanName.given?.join(" ");
    const gender = patient.gender;
    const birthDate = patient.birthDate;

    if (family && given && gender && birthDate) {
      const serverData = { family, given, gender, birthDate };
      const localData = {
        family: myFamily,
        given: myGiven,
        gender: myGender,
        birthDate: myBirthDate,
      };

      const items = [];

      for (const key of Object.keys(serverData)) {
        const serverValue = serverData[key];
        const localValue = localData[key];
        const color = serverValue === localValue ? "green" : "red";
        const item = `{${key}}|${localValue}|${serverValue}|{${color}}\n`;
        items.push(item);
      }

      return items.join("");
    }
  }

  return "Error:Patient_Not_Found";
}
