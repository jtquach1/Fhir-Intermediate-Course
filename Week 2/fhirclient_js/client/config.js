const ServerEndpoint = () => {
  return "http://wildfhir4.aegis.net/fhir4-0-1"; // updated URL
};
const TerminologyServerEndpoint = () => {
  // Doesn't work for L00_1_T06 because results.data.expansion doesn't exist
  // return "https://snowstorm.ihtsdotools.org/fhir";
  // return "https://snowstorm-alpha.ihtsdotools.org/fhir";
  // return "https://dev-snowstorm.ihtsdotools.org/fhir";
  // AU-based
  // return "https://r4.ontoserver.csiro.au/fhir";
  // US-based
  return "http://tx.fhir.org/r4";
};

const AssignmentSubmissionFHIRServer = () => {
  return "http://fhirserver.hl7fundamentals.org/fhir/"; // updated URL
};
const StudentId = () => {
  return "jquach@mitre.org";
};
const StudentName = () => {
  return "Joyce Quach";
};
const PatientIdentifierSystem = () => {
  return "http://fhirintermediate.org/patient_id";
};
exports.ServerEndpoint = ServerEndpoint;
exports.TerminologyServerEndpoint = TerminologyServerEndpoint;
exports.AssignmentSubmissionFHIRServer = AssignmentSubmissionFHIRServer;
exports.StudentId = StudentId;
exports.StudentName = StudentName;
exports.PatientIdentifierSystem = PatientIdentifierSystem;

// Check 9:59 of https://www.youtube.com/watch?v=8wJiHh3cKLs to see how to submit your zipped code
