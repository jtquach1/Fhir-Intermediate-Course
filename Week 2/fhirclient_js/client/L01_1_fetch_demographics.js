const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { GetPatientPhoneAndEmail };

const capitalize = (word) =>
  word.charAt(0).toLocaleUpperCase() + word.substr(1);

const format = (array) => (array.length === 0 ? "-" : array.join(","));

async function GetPatientPhoneAndEmail(
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
    const phones = [];
    const emails = [];

    if (patient.telecom) {
      for (const contactPoint of patient.telecom) {
        const { system, value, use } = { ...contactPoint };
        if (system && value && use) {
          const item = `${value}(${capitalize(use)})`;
          if (system === "phone") phones.push(item);
          if (system === "email") emails.push(item);
        }
      }
    }

    const output = `Emails:${format(emails)}\nPhones:${format(phones)}\n`;
    return output;
  }

  return "Error:Patient_Not_Found";
}
