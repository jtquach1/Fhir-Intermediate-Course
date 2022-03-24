const Utils = require("./utils");
const GetPatient = Utils.GetPatient;
module.exports = { GetEthnicity };

const sortingMap = {
  TEXT: 3,
  CODE: 2,
  DETAIL: 1,
};

const getKey = (string) => string.match(/TEXT|DETAIL|CODE/gi)[0];

const sortByKey = (ext1, ext2) =>
  sortingMap[getKey(ext2)] - sortingMap[getKey(ext1)];

async function GetEthnicity(
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
    const usCoreEthnicity = patient.extension?.[0];
    const extensions =
      usCoreEthnicity?.url ===
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity" &&
      usCoreEthnicity?.extension;

    if (extensions) {
      let isMinimallyCompliant = false;
      const formattedExtensions = extensions.map((extension) => {
        const { code, display } = { ...extension.valueCoding };
        switch (extension.url) {
          case "ombCategory":
            return `CODE|${code}:${display}\n`;
          case "detailed":
            return `DETAIL|${code}:${display}\n`;
          case "text":
            isMinimallyCompliant = true;
            return `TEXT|${extension.valueString}\n`;
        }
      });

      if (isMinimallyCompliant) {
        // Tests sort from TEXT, CODE, DETAIL
        return formattedExtensions.sort(sortByKey).join("");
      }
      return "Error:Non_Conformant_us-core-ethnicity_Extension";
    }
    return "Error:No_us-core-ethnicity_Extension";
  }
  return "Error:Patient_Not_Found";
}
