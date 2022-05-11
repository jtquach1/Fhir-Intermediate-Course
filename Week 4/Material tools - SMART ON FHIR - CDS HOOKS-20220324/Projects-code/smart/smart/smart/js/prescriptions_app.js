	
	var app;
	
	// It runs when the application is authenticated
	FHIR.oauth2.ready(function(client){
				app = new App(client);
				$("#welcome").hide();
				app.sectionContent.load("smart/prescriptions_app.html");
				app.loadPatientPrescriptions(false);
	});
	
	
	function App(client) {
		this.client = client;
		this.patientId = $("#patient-id").val();
		this.practitionerId = $("#practitioner-id").val();
        this.cdssURL = "http://localhost:8084/cdss/cds-services/";
		this.cdssToken = "";
		this.medicationRequestToCancel = null;
		this.medicationRequestDraft = null;
		this.sectionContent = $("main.container .content #section-content");
		/*Save the fhirServer from the EHR context*/
		this.fhirServer = client.state.serverUrl;		
	}
	

	/******************************************************************************/
	/****************************** Principal Functions *************************/
	/******************************************************************************/
   

	 /* Load the prescriptions that the patient already has */
     App.prototype.loadPatientPrescriptions = function(reload) {
     	app.client.request('MedicationRequest?subject='+ app.patientId+'&_count=200').then(function(prescriptions){
     		var medicationRequests = prescriptions.entry;
     		if (medicationRequests !== undefined) {
     			if(reload){ /*If I am reloading the table, before I delete the content */
					$('#prescriptions-table tbody').empty();
     			}

     			for(var i=0; i < medicationRequests.length; i++){
     				var medicationRequest = medicationRequests[i].resource;
     				var date = app.getdate(new Date(medicationRequest.authoredOn));
     				var medicationReference = medicationRequest.medicationReference.reference;
     				var instructions = medicationRequest.dosageInstruction[0];
     				var doseQuantity = instructions.doseAndRate[0].doseQuantity.value + 'mg';
     				var doseFrequency = instructions.timing.repeat.frequency;
     				var dose = doseQuantity + ' - ' + doseFrequency + ' times per day';
     				var status = medicationRequest.status;
     				app.attachRowInPrescriptionsTable(date, medicationReference, dose, status);
     			}

     			if(reload){ /*I reload the table before closing the modal*/
     				var modal = $('#new-prescription-modal');
					modal.modal('hide');
					$('body').removeClass('modal-open');
					$('.modal-backdrop').remove();
					modal.find("#medication").hide();
					modal.find("#search").show();
					modal.find("#alert").hide();
					modal.find('#search-input').val('');
					modal.find('#search-results').empty();
					var dose = modal.find("#dose");
					dose.find("#input-dose").val('');
					dose.find("#dose-times-input").val('');
					dose.find("#dose-comments-input").val('');
					app.medicationRequest = null;
     			}

     			$("#prescriptions-table").show();
     		}
     	});
     };

	/*When you stop typing in the search for medications, the application searches for medications on the FHIR server whose name has the text entered*/
     App.prototype.searchMedication = function(textEntered){
			var nameWanted = $(textEntered).val();
			var searchResults = $('#new-prescription-modal #search-results');
			/*The search is only started if at least 3 letters have been entered */
			if(nameWanted.length >= 3) {
				app.client.request('Medication?display=' + nameWanted).then(function(medications) {

					searchResults.empty();
					var medications = medications.entry;
					if(medications !== undefined) {
						for(var i=0; i < medications.length; i++){
     						var medication = medications[i].resource;
     						var name = medication.code.coding[0].display;
     						var id = medication.id;
     						/*Search results are added, including the name and medication identifier*/
     						searchResults.append('<li><a href="#" onclick="app.loadDose(this)" id= '+ id +'>' + name +'</a></li>');
     					}
				}
		
				});
			
	    	}

	    	/*If the input value is deleted (medication search), the search results are deleted */
			if(!nameWanted.length) {
				searchResults.empty();
			}
     };


     /*Once the medication of the search results is selected, it is requested to load the daily dose */
     App.prototype.loadDose = function(medication){
     	var medicationEl = $('#medication');
     	var selectedMedicationText = $('#medication #selected-medication');
     	var selectedMedicationId = $('#medication #selected-medication-id');
     	var search = $("#search");
     	var dose = $("#dose");
     	var addMedicationButton = $('#dose #add-prescription');
		/*The name of the selected medication is displayed */
		selectedMedicationText.text($(medication).text());
		selectedMedicationId.val($(medication).attr('id'));
		if(app.medicationRequestDraft !== null) {
			addMedicationButton.data("type","update");
		} else {
			addMedicationButton.data("type","create");
		}
		medicationEl.show();
		search.hide();
		/*Allow to load the medication dose*/
		dose.show();
     };
	
	App.prototype.addPrescription = function(prescription) {
	  	var type = $(prescription).data("type");
	  	var dose = $('#dose');
		var doseValue = dose.find("#input-dose").val();
		var doseFrequency = dose.find("#dose-times-input").val();
		var doseComments = dose.find("#dose-comments-input").val();

	  	if (type == "update"){
			var medicationRequestDraftUpdated = app.adaptMedicationRequestForUpdate(app.medicationRequestDraft,"draft", doseValue, doseFrequency, doseComments);
	  		app.updateMedicationRequest(medicationRequestDraftUpdated, true);
	  	} else {
	  		app.createMedicationRequest(doseValue, doseFrequency, doseComments);
	  	}
	}

	/*When you click on a search result*/
	App.prototype.createMedicationRequest = function (doseValue, doseFrequency, doseComments){
		var medicationId = $('#medication #selected-medication-id').val();

		/*Create a MedicationRequest draft status for the patient, referring to the medication that the user selected */ 
		app.client.create(
			{
				"resourceType": "MedicationRequest",
				"meta": app.getMeta("MedicationRequest"),
				"text": app.getText(),    
				"status": "draft",
				"intent": "order",
				"subject": {
					"reference": 'Patient/'+ app.patientId
				},
				"medicationReference": {
					"reference": "Medication/" + medicationId
				},
				"dosageInstruction": [{
					"text": doseComments,
					"timing": {
						"repeat": {
							"frequency": parseInt(doseFrequency),
							"period": 1,
							"periodUnit" : "d"
						}
					},
					"asNeededBoolean": true,
					"doseAndRate":[{
						"doseQuantity": {
							"value": parseInt(doseValue),
							"unit": "mg",
							"system": "http://unitsofmeasure.org",
							"code": "mg"
						}
					}]
				}]
			}
		).then(
		function(data){
			app.medicationRequestDraft = data;
			app.callCDSService(app.medicationRequestDraft);
		},
			function(error){
				console.log(error);
			}
		);
		


	}


	App.prototype.callCDSService = function(medicationRequestDraft) {
		var dose = $("#dose");
				
		/*Search for active patient prescriptions (MedicationRequest) */
		app.client.request('MedicationRequest?subject='+ app.patientId +'&status:exact=active').then(function(activePrescriptions) {
			var hook = {
				"hook": "order-select",
				"hookInstance": app.generateUUID(),
				"fhirServer": app.fhirServer,
				"fhirAuthorization": app.getFHIRAuthorization(),
				"context": {
					"userId":"Practitioner/" + app.practitionerId,
					"patientId": app.patientId,
					"selections": [ "MedicationRequest/"+ medicationRequestDraft.id  ],
					"draftOrders":{
						"resourceType":"Bundle",
						"id": app.generateUUID(),
							"meta": {
							"lastUpdated": app.getdate(new Date())
							},
							"type": "searchset",
							"link": [
   							{
      							"relation": "self",
      							"url": "http://localhost:8080/fhir/MedicationRequest"
    						}
							],
						"entry":[ {
  							"resource": medicationRequestDraft

						}
							 
						]
					}
				},
				"prefetch": {
					"activeMedicationRequest": activePrescriptions
				}
			}

			$.ajax({
				type: "POST",
				contentType: "application/json",
				url: app.cdssURL + 'drug-max-dose',
				data: JSON.stringify(hook)
			}).then(function(response){
				var cards = response.cards;
				/* If the maximum opioid dose is exceeded, the CDSS service returns a card*/
				if(Object.keys(cards).length){
					app.showAlert(cards[0]);
				} else {  /* If the maximum dose is not exceeded, the MedicationRequest of the patient is updated in ACTIVE status */
					var medicationRequestActive  = app.adaptMedicationRequestForUpdate(medicationRequestDraft, "active",null,null,null);
					app.updateMedicationRequest(medicationRequestActive, false);
				}
				dose.hide();
			});
		});
	};

	/*Show alert that returns CDSS service in card form*/
	App.prototype.showAlert = function (card){
		/*Based on the value in the indicator field (info, warning, critical) the alert color is set*/
		var alert  = $("#alert");
		var alertText;
		if(card.indicator == "warning") {  
			alert.addClass("alert-warning");
			alertText ='<h4>'+card.summary+'</h4>'+ card.detail;
			alertText += '<div id="alert-sources">';
		    if(card.source !== undefined) {
				alertText += '<p style="margin-top:1em !important" >More information...</p>';
				alertText += '<ul>';
				card.source.forEach(function(source) {
					alertText += '<li><a href='+source.url+' target="_blank" class="alert-link">' + source.label + '</a></li>';
				})
				alertText += '</ul>';
			}
			alertText += '</div>'
			alertText += '<div id="alert-suggestions">';
			if(card.suggestions !== undefined) {
				alertText += '<p style="margin-top:1em !important" >Suggestions: </p>';
				alertText += '<ul>';
				card.suggestions.forEach(function(suggestion) {
					var type = "";
					var resource = "";
					if(suggestion.actions !== undefined) {
						suggestion.actions.forEach(function(action) {
							type = action.type;
							app.medicationRequestToCancel = JSON.parse(action.resource); 
						});
					}
					alertText += '<li><a href="#" id="' +suggestion.uuid+ '" data-type="' + type +'" class="alert-link" onclick="app.executeAction(this)">'+ suggestion.label + '</a></li>';
				});
				alertText += '</ul>';
			}
			alertText += '</div>'
			alert.html(alertText);
		}
		alert.show();
	}

	/*Ejecutar un acción propuesta dentro de la card */
	App.prototype.executeAction = function(action){
		var typeOfAction = $(action).data("type");
		var dose = $("#dose");
		var alert  = $("#alert");
		var addMedicationButton = dose.find('#add-prescription');
		
		/* If you selected the action that suggests modifying the dose, the possibility of modifying it is offered */
		/* If the medication is reloaded, the MedicationRequest draft will be updated and the CDSS service will be called again */
		if(typeOfAction == ""){
			addMedicationButton.data("type","update");
			dose.show();
			alert.hide();
			alert.empty();
		}

		/* If you selected "Cancel Prescription" action, then the MedicationRequest resource is updated by passing it from draft to cancelled*/
		if(typeOfAction != "" && typeOfAction == "update"){
			app.updateMedicationRequest(app.medicationRequestToCancel, false);
		}
	}

	/*Adapt MedicationRequest to update*/ 
	App.prototype.adaptMedicationRequestForUpdate = function(medicationRequest, status, doseValue, doseFrequency, doseComments) {
			medicationRequest.meta = app.getMeta("MedicationRequest");
			medicationRequest.status = status;
			delete medicationRequest.authoredOn;
			/* If I want to change the dose */
			if(doseValue !== null) { 
				medicationRequest.dosageInstruction[0].text = doseComments;
				medicationRequest.dosageInstruction[0].timing.repeat.frequency = parseInt(doseFrequency);
				medicationRequest.dosageInstruction[0].doseAndRate[0].doseQuantity.value = parseInt(doseValue);
			}
			return medicationRequest; 
	};

	
	/* The MedicationRequest resource is updated */
	App.prototype.updateMedicationRequest = function(medicationRequest,llamarACDSS){
		app.client.update(medicationRequest).then(function(data){
			 if(llamarACDSS){
			 	app.medicationRequestDraft = data;
			 	app.callCDSService(data);
			 } else {
				app.loadPatientPrescriptions(true);
				app.medicationRequestDraft = null;
			 }
			 
		});
	};
	
	/******************************************************************************/
	/****************************** Auxiliary Functions **************************/
	/******************************************************************************/
	
     /* Transform date */
     App.prototype.getdate = function(date){
     	var dd = String(date.getDate()).padStart(2, '0');
		var mm = String(date.getMonth() + 1).padStart(2, '0');
		var yyyy = date.getFullYear();
     	return yyyy + '-' + mm + '-' + dd;
     };

     /* Add rows to the patient's prescription table */
     App.prototype.attachRowInPrescriptionsTable = function(date, medicationReference, dose, status){
     	  app.client.request(medicationReference).then(function(medication) {
     			var row = '<tr>';
     	  		row += '<td>' + date + '</td>';
     	  		row += '<td class="med">' + medication.code.text + '</td>';
     	  		row += '<td>' + dose + '</td>';
     	  
     	  		var statusTag;
     	  		switch(status){
     	  			case 'active':
     	  				statusTag = '<span class="badge badge-success">Active</span>';
     	  				break;
     	    		case 'cancelled':
     	    			statusTag = '<span class="badge badge-danger">Cancelled</span>';
     	    			break;
     	    		default:
     	    			statusTag = '<span class="badge badge-secondary">'+ status +'</span>';
     	  		}
     	  		row += '<td>' + statusTag + '</td>';
     	  
     	  		row += '</tr>';
     	  		$('#prescriptions-table tbody').append(row);		
     	  });

     };

    /* Generate UUID */
	App.prototype.generateUUID = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	/* Authorization to access the FHIR server */
	App.prototype.getFHIRAuthorization = function() {
		return {
			"access_token":  "m7rt6i7s9nuxkjvi8vsx",
			"token_type" : "Bearer",
			"expires_in" : 3600,
			"scope": "patient/MedicationRequest.read user/Medication.read",
			"subject": "drug-max-dose-cds-services" 
		};
	}
	

	App.prototype.getText = function () {
		 return {
					"status": "generated",
					"div": "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p></p></div>"
				};
	
	};

	App.prototype.getMeta = function (resource) {
		return  {"profile": ["https://saintmartinhospital.org/fhir/StructureDefinition/" + resource] };
	}