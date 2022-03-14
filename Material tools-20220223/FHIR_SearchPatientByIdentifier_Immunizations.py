import requests #REST Access to FHIR Server
print('Please enter patient''s identifier')
identifier=input('Given Name -try 580fffd0-9f22-4112-b96d-4e33901c81ae-:')
url='http://fhir.hl7fundamentals.org/r4/Patient?identifier='+identifier

print('Searching for Patient by identifier...@'+url)
response = requests.get(url)
json_response = response.json()
#
#
#
try:
  key='entry'
  EntryArray=json_response[key]
  FirstEntry=EntryArray[0]
  key='resource'
  resource=FirstEntry['resource']
  id=resource['id']
  PatientServerId= id
  print('Patient Found')
  print('Patient Id @ endpoint:'+id)
  #Now Searching the procedures for the patient
  url='http://fhir.hl7fundamentals.org/r4/Immunization?patient='+id
  print('Now Searching for Immunizations...@'+url)
  procedure_response = requests.get(url).json()
  key='entry'
  EntryArray=procedure_response[key]
  print ('Procedure(s) found for the patient')
  for entry in EntryArray:
    immunization=entry['resource']
    print('-------------------------')
    ISODate=immunization['occurrenceDateTime']
    print ('date:'+ISODate)
    print ('status:'+immunization['status'])
    print ('description:'+immunization['vaccineCode']['text']) 
except Exception as e:
  print ('Patient/immunizations Not Found')
   