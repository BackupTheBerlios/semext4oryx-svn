package org.oryxeditor.server;

import org.json.JSONArray;
import org.json.JSONObject;

public class SemanticExtensionTestHelper {

	public static JSONObject createExampleNewOntologyRequest(String name) throws Exception {
		JSONObject request = new JSONObject();

		// wir bauen eine import Message
		request.put(SemanticExtension.ID, SemanticExtension.MESSAGE);
		request.put(SemanticExtension.COMMAND, SemanticExtension.C_CREATE);
		request.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		request.put(SemanticExtension.NAME, name);
		request.put(SemanticExtension.DESCRIPTION, "keine Beschreibung ... ups");

		return request;
	}

	public static JSONObject createExampleReloadRequest(String url, String name) throws Exception {
		JSONObject request = new JSONObject();
		JSONArray messages = new JSONArray();

		// semantic bridge message
		JSONObject newMessage = new JSONObject();
		newMessage.put(SemanticExtension.ID, SemanticExtension.MESSAGE);
		newMessage.put(SemanticExtension.NAME, name);
		newMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_RELOAD);
		newMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		messages.put(newMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.MESSAGES, messages);
		
		return request;
	}
	
	public static JSONObject createExampleSemanticBridgeRequest(String bridgeURL, String sourceURL, String targetURL) throws Exception {
		JSONObject request = new JSONObject();
		JSONArray messages = new JSONArray();

		// semantic bridge message
		JSONObject newMessage = new JSONObject();
		newMessage.put(SemanticExtension.ID, SemanticExtension.MESSAGE);
		newMessage.put(SemanticExtension.NAME, "RosettaNet");
		newMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_SEMANTIC_BRIDGE);
		newMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		newMessage.put(SemanticExtension.SEMANTIC_BRIDGE, bridgeURL);
		newMessage.put(SemanticExtension.SOURCE_ONTOLOGY, sourceURL);
		newMessage.put(SemanticExtension.TARGET_ONTOLOGY, targetURL);

		messages.put(newMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.MESSAGES, messages);
		
		return request;
	}

	public static JSONObject createExampleSuggestSemanticBridgeRequest(String bridgeURL, String ontologyURL, String concept) throws Exception {
		JSONObject request = new JSONObject();
		JSONArray messages = new JSONArray();

		// semantic bridge message
		JSONObject newMessage = new JSONObject();
		newMessage.put(SemanticExtension.ID, SemanticExtension.MESSAGE);
		newMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_SUGGEST_SEMANTIC_BRIDGE);
		newMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		newMessage.put(SemanticExtension.SEMANTIC_BRIDGE, bridgeURL);
		newMessage.put(SemanticExtension.NAME, concept);

		messages.put(newMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.ONTOLOGY, ontologyURL);
		request.put(SemanticExtension.MESSAGES, messages);
		
		return request;
	}
	

	public static JSONObject createExampleImportRequest(String url) throws Exception {
		JSONObject request = new JSONObject();
		JSONArray messages = new JSONArray();

		// wir bauen eine import Message
		JSONObject importMessage = new JSONObject();
		importMessage.put(SemanticExtension.ID, SemanticExtension.MESSAGE);
		importMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_IMPORT);
		importMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		importMessage.put(SemanticExtension.NAME, "ResidentRegistryOntology");

		// jetzt bauen wir die Nachrichten zusammen
		messages.put(importMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.ONTOLOGY, url);
		request.put(SemanticExtension.MESSAGES, messages);

		return request;
	}

	public static JSONObject createExampleGetConcepts(String concept) throws Exception {
		JSONObject message = new JSONObject();
		message.put(SemanticExtension.ID, SemanticExtension.C_GET_CONCEPTS + ":::" + SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.COMMAND, SemanticExtension.C_GET_CONCEPTS);
		message.put(SemanticExtension.TYPE, SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.NAME, concept);
		return message;
	}

	public static JSONObject createExampleAddRequest(String name, String superConcept) throws Exception {
		// wir bauen eine add Message
		JSONObject message = new JSONObject();
		message.put(SemanticExtension.ID, SemanticExtension.C_ADD + ":::" + SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.COMMAND, SemanticExtension.C_ADD);
		message.put(SemanticExtension.TYPE, SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.NAME, name);
		message.put(SemanticExtension.DESCRIPTION, "Eine Beschreibung");
		message.put(SemanticExtension.SUPER, superConcept);
		message.put(SemanticExtension.COMMENT, "bitte das hinzufügen");
		return message;
	}

	public static JSONObject createExampleEditRequest(String object, String name, String superConcept) throws Exception {
		// wir bauen eine edit Message
		JSONObject message = new JSONObject();
		message.put(SemanticExtension.ID, SemanticExtension.C_EDIT + ":::" + SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.COMMAND, SemanticExtension.C_EDIT);
		message.put(SemanticExtension.TYPE, SemanticExtension.T_CONCEPT);
		message.put(SemanticExtension.NAME, name);
		message.put(SemanticExtension.DESCRIPTION, "Eine Beschreibung");
		message.put(SemanticExtension.SUPER, superConcept);
		message.put(SemanticExtension.OBJECT, object);
		message.put(SemanticExtension.COMMENT, "bitte das ändern");
		return message;
	}

	public static JSONObject createExampleRemoveRequest(String type, String name) throws Exception {
		// wir bauen eine remove Message
		JSONObject message = new JSONObject();
		message.put(SemanticExtension.ID, SemanticExtension.C_REMOVE + ":::" + type);
		message.put(SemanticExtension.COMMAND, SemanticExtension.C_REMOVE);
		message.put(SemanticExtension.DESCRIPTION, "das ist hier die neue Beschreibung");
		message.put(SemanticExtension.TYPE, type);
		message.put(SemanticExtension.NAME, name);
		message.put(SemanticExtension.COMMENT, "bitte das löschen");
		return message;
	}

	public static JSONObject createExampleNewVersionRequest(String url, JSONArray messages) throws Exception { 
		JSONObject request = new JSONObject();

		// wir bauen eine new Version Message
		JSONObject newVersionMessage = new JSONObject();
		newVersionMessage.put(SemanticExtension.ID, SemanticExtension.C_NEW_VERSION + ":::" + url);
		newVersionMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		newVersionMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);

		// jetzt bauen wir die Nachrichten zusammen
		messages.put(newVersionMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.ONTOLOGY, url);
		request.put(SemanticExtension.MESSAGES, messages);

		return request;
	}

	public static JSONObject createExampleNewVersionWithNewNameRequest(String url, String name, JSONArray messages) throws Exception {
		JSONObject request = new JSONObject();

		// wir bauen eine new Version Message
		JSONObject newVersionMessage = new JSONObject();
		newVersionMessage.put(SemanticExtension.ID, SemanticExtension.C_NEW_VERSION + ":::" + url);
		newVersionMessage.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		newVersionMessage.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		newVersionMessage.put(SemanticExtension.NAME, name);
		newVersionMessage.put(SemanticExtension.VERSION, "12.2");

		// jetzt bauen wir die Nachrichten zusammen
		messages.put(newVersionMessage);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.ONTOLOGY, url);
		request.put(SemanticExtension.MESSAGES, messages);

		return request;
	}

	public static JSONObject createExampleGetRulesRequest(String url) throws Exception {
		JSONObject request = new JSONObject();
		JSONArray messages = new JSONArray();

		// wir bauen eine getRules Message
		JSONObject message = new JSONObject();
		message.put(SemanticExtension.ID, SemanticExtension.C_GET_RULES + ":::" + url);
		message.put(SemanticExtension.COMMAND, SemanticExtension.C_GET_RULES);
		message.put(SemanticExtension.TYPE, SemanticExtension.T_SEMANTIC_BRIDGE);

		// jetzt bauen wir die Nachrichten zusammen
		messages.put(message);

		request.put(SemanticExtension.ID, SemanticExtension.SUBMISSION);
		request.put(SemanticExtension.TYPE, SemanticExtension.S_REQUEST);
		request.put(SemanticExtension.ONTOLOGY, url);
		request.put(SemanticExtension.MESSAGES, messages);

		return request;
	}

}
