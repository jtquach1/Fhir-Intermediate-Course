import requests #REST Access to FHIR Server
from typing import Dict, Tuple, List

def getPrompt(searchMap: Dict[int, str]) -> int:
  optionStrings = list(map(lambda item: f'({item[0]}) {item[1]}', searchMap.items()))
  separator = '\n'
  index = input(f'Pick a number to indicate selection:\n{separator.join(optionStrings)}\n')
  return int(index)


def getPatientUrlAndSearchParam(base: str, search: int, searchMap: Dict[int, str]) -> Tuple[str, str]:
  url: str = f'{base}/Patient?'
  searchParam: str = ''
  
  if (search == 1):
    id = input('Id -try d67a0cff-8f7e-46f7-bb99-577a6623e59a-: ')
    searchParam = f'_id={id}'
    
  if (search == 2):
    system = input('Identifier system -try https://github.com/synthetichealth/synthea- or hit enter if unknown: ')
    code = input('Identifier code -try 0c6b1f3d-edb2-422b-a0af-a262fb90ed07-: ')
    system = (f'{system}|', '')[not system]
    identifier = f'{system}{code}'
    searchParam = f'identifier={identifier}'
    
  if (search == 3):
    name = input('Name -try Adolph-:')
    searchParam = f'name={name}'

  if (search == 4):
    birthdate = input('Birthdate -try 1944-11-28-: ')
    name = input('Name -try Adolph-:')
    searchParam = f'birthdate={birthdate}&name={name}'

  if (search == 5):
    gender = input('Gender -try male-: ')
    name = input('Name -try Adolph-:')
    searchParam = f'gender={gender}&name={name}'

  if (searchParam):
    print(f'Searching for Patient by {searchMap[search]}...@{url}{searchParam}')
  
  return (url, searchParam)

def systemAndCodePairToStrings(pair: Tuple[str, str]) -> str:
  system = pair[0]
  code = pair[1]
  system = (f'{system}|', '')[not system]
  return f'{system}{code}'

def comparatorAndDatePairToStrings(pair: Tuple[str, str]) -> str:
  comparator = pair[0]
  date = pair[1]
  comparator = (f'{comparator}', '')[not comparator]
  return f'&date={comparator}{date}'


def getVitalsUrlAndSearchParam(base: str, search: int, searchMap: Dict[int, str]) -> Tuple[str, str]:
  url: str = f'{base}/Observation?'
  searchParam: str = ''
  category = 'http://terminology.hl7.org/CodeSystem/observation-category|vital-signs'

  if (search >= 1 or search <= 3):
    patient = input('Patient reference id -try d67a0cff-8f7e-46f7-bb99-577a6623e59a-: ')

    if (search == 1):
      searchParam = f'patient={patient}&category={category}'

    if (search == 2):
      pairs: List[Tuple[str, str]] = []
      print('Provide pairs of systems and codes (hit enter on code to STOP)')
      while (True):
        system = input('System -try http://loinc.org or hit enter if unknown-: ')
        code = input('Code -try 8302-2, 39156-5, 72514-3, or hit enter to STOP-: ')
        if (not code):
          break
        else:
          pairs.append((system, code))
      separator = ','
      codes = separator.join(list(map(systemAndCodePairToStrings, pairs)))            
      searchParam = f'patient={patient}&code={codes}'
      
    if (search == 3):
      searchParam = f'patient={patient}&category={category}'
      pairs: List[Tuple[str, str]] = []
      print('Provide pairs of comparators and dates (hit enter on date to STOP)')
      while (True):
        comparator = input('Comparator -try gt, lt, ge, le, or hit enter if unknown-: ')
        date = input('Date -try 2016-12-28T01:23:28+00:00, 2015-12-23T01:23:28+00:00, or hit enter to STOP-: ')
        if (not date):
          break
        else:
          pairs.append((comparator, date))
      separator = ''
      dates = separator.join(list(map(comparatorAndDatePairToStrings, pairs)))
      searchParam = f'patient={patient}&category={category}{dates}'
      
  if (searchParam):
    print(f'Searching for Observation by {searchMap[search]}...@{url}{searchParam}')
  
  return (url, searchParam)


def getBaseUrl() -> str:
  # Base Endpoint URLs
  # base = 'http://fhir.hl7fundamentals.org/r4' # this server is unusable
  # base = 'http://fhirserver.hl7fundamentals.org/fhir' # replaces above server for now
  base = 'https://r4.smarthealthit.org'
  return base


def getProcedures(json_response, base: str, prompt: int) -> None:
  try:
    key='entry'
    EntryArray=json_response[key]
    FirstEntry=EntryArray[0]
    key='resource'
    resource=FirstEntry['resource']

    # Looking at a Bundle whose first entry is a Patient
    if (prompt == 1):
      id = resource['id']

    # Looking at a Bundle whose first entry is an Observation
    else:
      id = resource['subject']['reference'].split('/')[1]
    
    print('Patient Found')
    print('Patient Id @ endpoint:'+id)
    #Now Searching the procedures for the patient
    url=f'{base}/Procedure?patient={id}'
    print('Now Searching for Procedures...@'+url)
    procedure_response = requests.get(url).json()
    key='entry'
    EntryArray=procedure_response[key]
    print ('Procedure(s) found for the patient')
    for entry in EntryArray:
      procedure=entry['resource']
      print('-------------------------')
      ISODate=procedure['performedPeriod']['start']
      print ('date:'+ISODate)
      print ('status:'+procedure['status'])
      print ('description:'+procedure['code']['text']) 

  except Exception as e:
    print ('Patient/Procedures Not Found')


def main():
  promptMap: Dict[int, str] = {
    1: 'Patient searching',
    2: 'Retrieve and display Patient\'s vitals signs',
  }
  
  patientSearchMap: Dict[int, str] = {
    1: 'id',
    2: 'identifier',
    3: 'name',
    4: 'birthdate and name',
    5: 'gender and name'
  }
  
  vitalsSearchMap: Dict[int, str] = {
    1: 'patient and category',
    2: 'patient and code',
    3: 'patient, category, and date',
  }
  
  prompt: int = getPrompt(promptMap)
  
  base: str = getBaseUrl()
  
  if (prompt == 1):
    search: int = getPrompt(patientSearchMap) 
    urlAndSearchParam: Tuple[str, str] = getPatientUrlAndSearchParam(base, search, patientSearchMap)
  else:
    search: int = getPrompt(vitalsSearchMap)
    urlAndSearchParam: Tuple[str, str] = getVitalsUrlAndSearchParam(base, search, vitalsSearchMap)
  
  url: str = urlAndSearchParam[0]
  searchParam: str = urlAndSearchParam[1]
  
  response = requests.get(f'{url}{searchParam}')
  json_response = response.json()
  
  getProcedures(json_response, base, prompt)


main()
