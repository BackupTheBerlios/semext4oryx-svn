package org.oryxeditor.server;

import java.io.File;
import java.net.URI;

import org.json.JSONArray;
import org.json.JSONObject;
import org.oryxeditor.semantics.Ontology;

import edu.stanford.smi.protegex.owl.ProtegeOWL;
import edu.stanford.smi.protegex.owl.jena.JenaOWLModel;

public class SExtTestReqWrapper {

	private static URI prepareTest() throws Exception {
		URI uri = File.createTempFile("testOntology", ".owl").toURI();
		JenaOWLModel model = ProtegeOWL.createJenaOWLModel();
		model.save(uri);
		return uri;
	}
	
	public static JSONObject wrap(JSONObject req, boolean withOntology) throws Exception {
		Ontology.path_root = new File(".").getAbsolutePath();
		Ontology.path_root = new File(".").toURI().toURL().toString();
		
		JSONObject request = new JSONObject();
		request.put("id", "submission");
		request.put("type", "request");
		request.put("modelId", "JUnit Tests");
		
		if (withOntology) {
			request.put("ontology", prepareTest().toURL().toString());;
		}
		
		JSONArray messages = new JSONArray();
		messages.put(req);
		request.put("messages", messages);
		
		return request;
	}
	
}
