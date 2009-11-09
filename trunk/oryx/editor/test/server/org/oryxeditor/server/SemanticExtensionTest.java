package org.oryxeditor.server;

import static org.mockito.Mockito.*;

import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JTextArea;

import org.dom4j.Document;
import org.dom4j.io.SAXReader;
import org.json.JSONArray;
import org.json.JSONObject;

import junit.framework.TestCase;


public class SemanticExtensionTest extends TestCase {

	public static void main(String[] args) {
		try {
			final SemanticExtension application = new SemanticExtension();
			
			JFrame frame = new JFrame();
			frame.setTitle("Client-Server-Communication Testtool");
			frame.setSize(640, 480);

			
			final JTextArea input = new JTextArea();
			final JTextArea output = new JTextArea();
			final JTextArea exception = new JTextArea();
			final JButton execute = new JButton("ausführen");
			execute.addActionListener(new ActionListener() {
				
				@Override
				public void actionPerformed(ActionEvent e) {
					try {
						JSONObject request = new JSONObject(input.getText());
						JSONObject response = application.dispatch(request);
						output.setText(response.toString());
					}
					catch (Exception ex) {
						exception.setText(ex.toString());
					}
				}
			});
			final JButton close = new JButton("schliessen");
			close.addActionListener(new ActionListener() {
				
				@Override
				public void actionPerformed(ActionEvent e) {
					System.exit(0);
				}
			});
			frame.getContentPane().setLayout(new GridLayout(0,2));
			frame.getContentPane().add(new JLabel("Input"));
			frame.getContentPane().add(input);
			frame.getContentPane().add(new JLabel("Output"));
			frame.getContentPane().add(output);
			frame.getContentPane().add(new JLabel("Exception Thrown"));
			frame.getContentPane().add(exception);
			frame.getContentPane().add(execute);
			frame.getContentPane().add(close);
			
			frame.setVisible(true);
//
//			application.prettyPrintResponse(application.handleIncomingSubmission(application.createExampleSemanticBridgeRequest("http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl", "http://localhost:8080/ontologies/RosettaNetOntology.owl#Partner", "http://localhost:8080/ontologies/MoonOntology.owl#Customer")));
//			application.prettyPrintResponse(application.handleIncomingSubmission(application.createExampleSuggestSemanticBridgeRequest("http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl", "http://localhost:8080/ontologies/RosettaNetOntology.owl", "http://localhost:8080/ontologies/RosettaNetOntology.owl#Partner")));
			
			// 
			// JSONArray messages1 = new JSONArray();
			// messages1.put(application.createExampleGetConcepts("ResidentInfo"));
			// JSONObject request1 =
			// application.createExampleNewVersionRequest("http://localhost:8080/ontologies/ResidentRegistryOntology.owl",
			// messages1);
//			JSONObject request1 = new JSONObject("{\"id\": \"submission\", \"type\": \"request\", \"messages\": [{\"id\": \"semanticBridge:::http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl\", \"command\": \"semanticBridge\", \"type\": \"ontology\", \"name\": \"RosettaNet\", \"semanticBridge\": \"http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl\", \"sourceOntology\": \"http://localhost:8080/ontologies/RosettaNetOntology.owl#ProductLineItem\", \"targetOntology\": \"http://localhost:8080/ontologies/MoonOntology.owl#OrderItem\"}]}");
//			JSONObject request1 = new JSONObject("{\"id\": \"submission\", \"type\": \"request\", \"messages\": [{\"id\": \"semanticBridge:::http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl\", \"command\": \"semanticBridge\", \"type\": \"ontology\", \"name\": \"RosettaNet\", \"semanticBridge\": \"http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl\", \"sourceOntology\": \"http://localhost:8080/ontologies/RosettaNetOntology.owl#Partner\", \"targetOntology\": \"http://localhost:8080/ontologies/MoonOntology.owl#Customer\"}]}");
//			JSONObject request1 = new JSONObject("{\"id\": \"submission\", \"type\": \"request\", \"messages\": [{\"id\": \"semanticBridge:::http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology.owl\", \"command\": \"semanticBridge\", \"type\": \"ontology\", \"name\": \"RosettaNet\", \"semanticBridge\": \"http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology.owl\", \"sourceOntology\": \"http://localhost:8080/ontologies/RosettaNetOntology.owl#Partner\", \"targetOntology\": \"http://localhost:8080/ontologies/MoonOntology.owl#Customer\"}]}");
//			JSONObject response1 = application.handleIncomingSubmission(request1);
//			application.prettyPrintResponse(response1);

//			 // zuerst eine neue Ontologie erstellen
//			 JSONObject request0 = application.createExampleNewOntologyRequest("TestOntology");
//			 JSONObject response0 = application.handleIncomingSubmission(request0);
//			 application.prettyPrintResponse(response0);
			//			
			// JSONObject request = new
			// JSONObject("{\"id\": \"submission\", \"type\": \"request\", \"ontology\": \"http://localhost:8080/ontologies/ResidentInfo_Versions/ResidentInfo_v1.1.owl\", \"messages\": [{\"id\": \"remove:::concept:::adfdsfds\", \"command\": \"remove\", \"type\": \"concept\", \"name\": \"adfdsfds\", \"comment\": \"fsdfds\"}, {\"id\": \"newVersion:::ontology:::http://localhost:8080/ontologies/ResidentInfo_Versions/ResidentInfo_v1.1.owl\", \"command\": \"newVersion\", \"type\": \"ontology\"}]}");
			// JSONObject response =
			// application.handleIncomingSubmission(request);
			// application.prettyPrintResponse(response);

			// JSONArray messages = new JSONArray();
			// messages.put(application.createExampleSetRulesRequest("http://localhost:8080/ontologies/SemanticBridge_ResidentRegistry2PublicServicePayment.owl",
			// "source:hasName(?x, ?Name)  ∧  source:hasGivenName(?Name, ?GivenName)  ∧  source:hasRef(?GivenName, ?GivenNameRef)  ∧  source:hasSurname(?Name, ?Surname)  ∧  source:hasRef(?Surname, ?SurnameRef)  ∧  swrlb:stringConcat(?AccoutOwnerRef, ?GivenNameRef, \" \", ?SurnameRef)  ∧  swrlx:createOWLThing(?AccountOwner, ?x) → target:hasAccountOwner(?x, ?AccountOwner)  ∧  target:hasRef(?AccountOwner, ?AccoutOwnerRef)"));
			// JSONObject request1 =
			// application.createExampleNewVersionRequest("http://localhost:8080/ontologies/SemanticBridge_ResidentRegistry2PublicServicePayment.owl",
			// "SemanticBridge_ResidentRegistry2PublicServicePayment2",
			// messages);
			// JSONObject response1 =
			// application.handleIncomingSubmission(request1);
			// application.prettyPrintResponse(response1);
			//
			// JSONObject request2 =
			// application.createExampleGetRulesRequest("http://localhost:8080/ontologies/SemanticBridge_ResidentRegistry2PublicServicePayment.owl");
			// JSONObject response2 =
			// application.handleIncomingSubmission(request2);
			// application.prettyPrintResponse(response2);

			// eine vorhandene Ontologie importieren
//			 JSONObject request = application.createExampleImportRequest("http://localhost:8080/ontologies/RosettaNetOntology.owl");
//			 JSONObject response =
//			 application.handleIncomingSubmission(request);
//			 application.prettyPrintResponse(response);
			//			
			// zuerst eine neue Ontologie erstellen
			// JSONObject request0 =
			// application.createExampleNewOntologyRequest("TestOntology");
			// JSONObject response0 =
			// application.handleIncomingSubmission(request0);
			// application.prettyPrintResponse(response0);
			//			
			// // dann eine neue Version mit hinzugefügtem und geändertem
			// Konzept
			// JSONArray messages1 = new JSONArray();
			// messages1.put(application.createExampleAddRequest("newConcept",
			// "Locality"));
			// messages1.put(application.createExampleEditRequest("newConcept",
			// "NewConcept", "ZipCode"));
			// JSONObject request1 =
			// application.createExampleNewVersionRequest("http://localhost:8080/ontologies/ResidentRegistryOntology.owl",
			// messages1);
			// JSONObject response1 =
			// application.handleIncomingSubmission(request1);
			// application.prettyPrintResponse(response1);
			//			
			// // dann eine neue Version mit gelöschtem Konzept
			// JSONArray messages2 = new JSONArray();
			// messages2.put(application.createExampleRemoveRequest(T_PROPERTY,
			// "hasDeath"));
			// JSONObject request2 =
			// application.createExampleNewVersionRequest("http://localhost:8080/ontologies/ResidentInfo.owl",
			// messages2);
			// JSONObject response2 =
			// application.handleIncomingSubmission(request2);
			// application.prettyPrintResponse(response2);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	

	private void prettyPrintResponse(JSONObject response) throws Exception {

		System.out.println(response.toString());

		JSONArray messages = response.getJSONArray(SemanticExtension.MESSAGES);
		for (int i = 0; i < messages.length(); i++) {
			JSONObject message = messages.getJSONObject(i);

			// FIXME Type der refid auslesen
			if (message.has(SemanticExtension.XML)) {
				SAXReader reader = new SAXReader();
				Document document = reader.read(message.get("xml").toString());
				System.out.println(document.asXML());
			}

			else if (message.has("error")) {
				System.out.println(message.get("error"));
			}
		}
	}
	
	public void testAddRequest() throws Exception {
		final SemanticExtension server = new SemanticExtension();
		
		// Request
		final JSONObject request = SemanticExtensionTestHelper.createExampleAddRequest("newConcept", "");
		
		// Ausführen
		final  JSONObject response = server.dispatch(SExtTestReqWrapper.wrap(request, true));
		
		// Prüfen
		assertTrue(!response.has(SemanticExtension.ERROR));
	}
	
	public void testCreateNewOntologyRequest() throws Exception {
		final SemanticExtension server = new SemanticExtension();
		
		// Request
		final JSONObject request = SemanticExtensionTestHelper.createExampleNewOntologyRequest("TestOntology");
		
		// Ausführen
		final  JSONObject response = server.dispatch(SExtTestReqWrapper.wrap(request, false));
		
		// Prüfen
		System.out.println(response.toString());
	}
		
	public void testEditRequest() throws Exception {
		final SemanticExtension server = new SemanticExtension();
		
		// Request
		 JSONArray messages = new JSONArray();
		 messages.put(SemanticExtensionTestHelper.createExampleAddRequest("newConcept", "Locality"));
		 messages.put(SemanticExtensionTestHelper.createExampleEditRequest("newConcept", "NewConcept", "ZipCode"));
		 JSONObject request = SemanticExtensionTestHelper.createExampleNewVersionRequest("http://localhost:8080/ontologies/ResidentRegistryOntology.owl",messages);
		
		// Ausführen
		final  JSONObject response = server.dispatch(request);
		
		// Prüfen
	}

	public void testRemoveRequest() throws Exception {
		final SemanticExtension server = new SemanticExtension();
		
		// Request
		 JSONArray messages = new JSONArray();
		 messages.put(SemanticExtensionTestHelper.createExampleRemoveRequest(SemanticExtension.T_PROPERTY,"hasDeath"));
		 JSONObject request = SemanticExtensionTestHelper.createExampleNewVersionRequest("http://localhost:8080/ontologies/ResidentInfo.owl",messages);
		
		// Ausführen
		final  JSONObject response = server.dispatch(request);
		
		// Prüfen
	}					
}
