/*
When we click on the prescriptions menu, we start our SMART application by calling launch.html with the parameters
    - launch: indicates the context of the EHR associated with the launch
    - iss: the URL of the FHIR server 
*/
$('#prescriptions-section').click(function(){
    window.location.href = 'http://localhost:8085/launch.html?launch=Sssa121313&iss=http://localhost:8080/fhir';
});


