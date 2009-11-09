package org.oryxeditor.semantics.handler;

import org.json.JSONObject;
import org.oryxeditor.semantics.Ontology;
import org.oryxeditor.semantics.semanticbridge.SemanticBridge;

import org.oryxeditor.server.SemanticExtension;

public class SemanticPoolHandler {
	
	public JSONObject createOntology(JSONObject object) throws Exception {
		String name = object.getString(SemanticExtension.NAME);
		String id = object.getString(SemanticExtension.ID);
		String description = object.getString(SemanticExtension.DESCRIPTION);

		Ontology ontology = new Ontology(name);
		ontology.setDescription(description);

		JSONObject result = makeVersion(SemanticExtension.T_ONTOLOGY, name, "1.0", ontology);
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_CREATE + ":::" + SemanticExtension.T_ONTOLOGY
				+ ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, id);
		return result;
	}

	/**
	 * Verarbeitet den Request 'create Semantic Bridge'
	 * 
	 * @param object - Request Objekt
	 * @return response Objekt
	 * @throws Exception - interner Fehler bei der Verarbeitung des requests bzw. bei der Erstellung der response
	 */
	public JSONObject createSemanticBridge(final JSONObject object) throws Exception {
		String name = object.getString(SemanticExtension.NAME);
		String id = object.getString(SemanticExtension.ID);
		String description = object.getString(SemanticExtension.DESCRIPTION);
		String source = object.getString(SemanticExtension.SOURCE_ONTOLOGY);
		String target = object.getString(SemanticExtension.TARGET_ONTOLOGY);
		
		SemanticBridge sBridge = SemanticBridge.createSemanticBridge(name, source, target);
		Ontology ontology = sBridge.getSemanticBridgeOntologyRepresentation();
		ontology.setDescription(description);

		JSONObject result = makeVersion(SemanticExtension.T_SEMANTIC_BRIDGE, name, "1.0", ontology);
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_CREATE + ":::" + SemanticExtension.T_SEMANTIC_BRIDGE
				+ ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, id);
		return result;
	}
	
	/**
	 * erstellt eine neue Version der Ontologie (derzeit nur Ontologien)
	 * 
	 * @param type
	 *            - Ontologie oder Semantische Brücke
	 * @return Antwort-JSON
	 * @throws Exception
	 */
	public JSONObject makeVersion(final String type, final Ontology ontology) throws Exception {
		Ontology newVersion = ontology.createNewVersion();

		JSONObject result = new JSONObject();
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		result.put(SemanticExtension.URL, newVersion.getUrl());
		result.put(SemanticExtension.XML, SemanticExtension.T_ONTOLOGY.equals(type) ? newVersion.createXMLFile() : newVersion.getSWRLRules());
		result.put(SemanticExtension.DESCRIPTION, newVersion.getDescription());
		result.put(SemanticExtension.VERSION, newVersion.getVersion());
		result.put(SemanticExtension.TYPE, type);
		result.put(SemanticExtension.NAME, newVersion.getName());
		return result;
	}

	/**
	 * erstellt eine neue Version der Ontologie (derzeit nur Ontologien)
	 * 
	 * @param type
	 *            - Ontologie oder Semantische Brücke
	 * @param newName
	 *            - Name unter der die Ontologie/SBrücke gespeichert werden soll
	 * @param version
	 *            - Versionskennung
	 * @return Antwort-JSON
	 * @throws Exception
	 */
	public JSONObject makeVersion(final String type, final String newName, final String version, final Ontology ontology) throws Exception {
		ontology.setName(newName);
		ontology.setVersion(version);
		Ontology newVersion = ontology.createNewVersion();

		JSONObject result = new JSONObject();
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		result.put(SemanticExtension.URL, newVersion.getUrl());
		result.put(SemanticExtension.XML, SemanticExtension.T_ONTOLOGY.equals(type) ? newVersion.createXMLFile() : newVersion.getSWRLRules());
		result.put(SemanticExtension.DESCRIPTION, newVersion.getDescription());
		result.put(SemanticExtension.VERSION, newVersion.getVersion());
		result.put(SemanticExtension.TYPE, type);
		result.put(SemanticExtension.NAME, newVersion.getName());
		return result;
	}
	
	public JSONObject importOntology(final JSONObject request, final String url, final Ontology ontology) throws Exception {
		String name = request.getString(SemanticExtension.NAME);
		String id = request.getString(SemanticExtension.ID);
		
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_IMPORT + ":::" + SemanticExtension.T_ONTOLOGY
				+ ":::" + url);
		result.put(SemanticExtension.REFID, id);
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		result.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		result.put(SemanticExtension.NAME, name);
		result.put(SemanticExtension.URL, url);
		result.put(SemanticExtension.XML, ontology.createXMLFile());
		result.put(SemanticExtension.DESCRIPTION, ontology.getDescription());
		result.put(SemanticExtension.VERSION, ontology.getVersion());
		return result;
	}
	
	public JSONObject importSemanticBridge(final JSONObject request, final String url, final Ontology ontology) throws Exception {
		String name = request.getString(SemanticExtension.NAME);
		String id = request.getString(SemanticExtension.ID);
		
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_IMPORT + ":::"
				+ SemanticExtension.T_SEMANTIC_BRIDGE + ":::" + url);
		result.put(SemanticExtension.REFID, id);
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_NEW_VERSION);
		result.put(SemanticExtension.TYPE, SemanticExtension.T_SEMANTIC_BRIDGE);
		result.put(SemanticExtension.NAME, name);
		result.put(SemanticExtension.URL, url);
		result.put(SemanticExtension.XML, "not implemented yet");
		result.put(SemanticExtension.DESCRIPTION, ontology.getDescription());
		result.put(SemanticExtension.VERSION, ontology.getVersion());
		return result;
	}
}
