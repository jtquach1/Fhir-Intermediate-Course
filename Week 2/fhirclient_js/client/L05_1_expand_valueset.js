const axios = require("axios");
module.exports = { ExpandValueSetForCombo };

async function ExpandValueSetForCombo(fhirEndpoint, url, filter) {
  const resourceClass = "ValueSet";
  const operation = "$expand";
  const parameters = `url=${url}${!!filter ? `&filter=${filter}` : ""}`;
  const fullURL = `${fhirEndpoint}/${resourceClass}/${operation}?${parameters}`;
  const result = await axios.get(fullURL);

  if (result?.data?.expansion?.contains) {
    return result.data.expansion.contains
      ?.map(({ code, display }) => `${code}|${display}\n`)
      .join("");
  }
  return "Error:ValueSet_Filter_Not_Found";
}
