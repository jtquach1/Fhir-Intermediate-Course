const Config = require("../config");
const Client = require("../L05_1_expand_valueset.js");
const baseUrl = Config.TerminologyServerEndpoint();

describe("L05_1_Expand_Valueset_Tests", function () {
  it("L05_1_T01:Term/Filter does not exist", async function () {
    const url = "http://snomed.info/sct?fhir_vs=isa/73211009";
    const filter = "diaxetes";
    const result = await Client.ExpandValueSetForCombo(baseUrl, url, filter);

    expect(result).toEqual("Error:ValueSet_Filter_Not_Found");
  });

  it("L05_1_T02:Existing term", async function () {
    const url = "http://snomed.info/sct?fhir_vs=isa/73211009";
    const filter = "Drug-induced diabetes";
    const result = await Client.ExpandValueSetForCombo(baseUrl, url, filter);

    // Original terminology server at  https://snowstorm.ihtsdotools.org/fhir is unresolvable during tests, not sure why
    // US-based server doesn't support expand
    // AU-based server has 1+ matching concepts
    expect(result).toEqual(
      "5368009|Drug-induced diabetes mellitus\n408540003|Diabetes mellitus caused by non-steroid drugs\n413183008|Diabetes mellitus caused by non-steroid drugs without complication\n"
    );
  });
});
