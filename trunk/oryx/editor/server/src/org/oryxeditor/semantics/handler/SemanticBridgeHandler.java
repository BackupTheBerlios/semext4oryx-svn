package org.oryxeditor.semantics.handler;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import edu.stanford.smi.protegex.owl.model.OWLIndividual;
import edu.stanford.smi.protegex.owl.model.OWLNamedClass;
import edu.stanford.smi.protegex.owl.model.OWLOntology;

import org.oryxeditor.semantics.Ontology;
import org.oryxeditor.semantics.SemanticDescription;
import org.oryxeditor.semantics.semanticbridge.BridgeMapping;
import org.oryxeditor.semantics.semanticbridge.SemanticBridge;
import org.oryxeditor.semantics.semanticbridge.SemanticBridgeRule;
import org.oryxeditor.server.SemanticExtension;

public class SemanticBridgeHandler {

	/** 
	 * Nach Ontologie gegliedert halten wir uns hier aus Performancegründen die Mappings bevor
	 * wir neue Repräsenationen erstellen. */
	private List<SemanticBridgeBucket> bucketList = new ArrayList<SemanticBridgeBucket>();
	
	/**
	 * Führt eine semantische Brücke aus und liefert eine geänderte
	 * Repräsenation zurück
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	public void addSemanticBridge(final String modelID, JSONObject request) throws Exception {
		
		// request verarbeiten
//		String msgId = request.getString(SemanticExtension.ID);
		String name = request.getString(SemanticExtension.NAME);
		String bridgeString = request.getString(SemanticExtension.SEMANTIC_BRIDGE);
		String sourceString = request.getString(SemanticExtension.SOURCE_ONTOLOGY);
		String xmlString = request.getString(SemanticExtension.XML);
		String targetString = request.getString(SemanticExtension.TARGET_ONTOLOGY);

		// Ontologie und Concept splitten
		String[] source = sourceString.split("#");
		String[] target = targetString.split("#");

		Ontology sourceOntology = new Ontology(modelID, source[0], name);
		sourceOntology.setXmlserverpath(xmlString);
		SemanticBridge bridge = new SemanticBridge(name, bridgeString, source[0], target[0], request);
		String targetNamespace = target[0] + "#";
		
		// Semantische Brücke ausführen
		Collection<OWLIndividual> bridgedIndividuals = bridge.useSemanticBridge(source[1]);
		
		// Mapping zwischen Individual -> SourceConcept -> TargetConcept erstellen
		BridgeMapping mapping = BridgeMapping.createBridgeMap(bridgedIndividuals, targetNamespace);

		// nur wenn die Polymorphie zum Target vorliegt, sonst hier abbrechen
		if (mapping.getSourceNameToTargetName(target[1]) == null) {
			throw new Exception("The entered semantic bridge has no mapping between these concepts.");
		}
		
		for (SemanticBridgeBucket bucket : bucketList) {
			if (bucket.getKey().getUrl().equals(sourceOntology.getUrl())) {
				bucket.getMapping().addBridgeMapping(mapping);
				bucket.addSemanticBridge(bridge);
				return;
			}
		}
		
		// falls nicht bereits vorhanden neuer Eintrag in der Bucketlist
		bucketList.add(new SemanticBridgeBucket(sourceOntology, mapping, bridge));
	}
	
	public void generateResponses(JSONArray messageArray) throws Exception {

		for (SemanticBridgeBucket bucket : bucketList) {
			Ontology source = bucket.getSource();
			BridgeMapping mapping = bucket.getMapping();
						
			if (mapping.isEmpty()) {
				JSONObject error = new JSONObject();
				error.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.ERROR);
				error.put(SemanticExtension.ERROR, "The semantic bridge couldn't be established.");
				messageArray.put(error);
			}
			
			// Polymorphes Modell erstellen und XML daraus erzeugen
			String xmlPath = source.createPolymorphModel(mapping);

			JSONObject msg1 = new JSONObject();
			msg1.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_SEMANTIC_BRIDGE + ":::" + SemanticExtension.T_ONTOLOGY);
//			msg1.put(SemanticExtension.REFID, msgId);
			msg1.put(SemanticExtension.COMMAND, SemanticExtension.C_CHANGE_REPRESENTATION);
			msg1.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
			msg1.put(SemanticExtension.URL, source.getUrl());
			msg1.put(SemanticExtension.XML, xmlPath);
			messageArray.put(msg1);
			
			for (SemanticBridge bridge : bucket.getSemBridgeList()) {
				JSONObject req = bridge.getRequest();
				String concept = req.getString(SemanticExtension.SOURCE_ONTOLOGY).split("#")[1];
				String bridgeString = req.getString(SemanticExtension.SEMANTIC_BRIDGE);
				
				JSONObject msg2 = new JSONObject();
				msg2.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_SEMANTIC_BRIDGE + ":::" + SemanticExtension.T_ONTOLOGY + ":::" + bridgeString);
				msg2.put(SemanticExtension.REFID, req.get(SemanticExtension.ID));
				msg2.put(SemanticExtension.COMMAND, SemanticExtension.C_CHANGE_CONCEPTNAME);
				msg2.put(SemanticExtension.TYPE, SemanticExtension.T_CONCEPT);
				msg2.put(SemanticExtension.SEMANTIC_BRIDGE, bridgeString);
				msg2.put(SemanticExtension.OBJECT, concept);
				msg2.put(SemanticExtension.NAME, Ontology.formatEquivalentClass(concept, mapping.getTargetNameToSourceName(concept)));
				msg2.put(SemanticExtension.SHAPE_ID, req.getString(SemanticExtension.SHAPE_ID));
				messageArray.put(msg2);
			}
		}
		
		bucketList.clear();
	}
	
	@SuppressWarnings("unchecked")
	public String getTargetNamespaceFromIndividual(OWLIndividual individual) {
		for (OWLOntology onto : (Collection<OWLOntology>) individual.getOWLModel().getOWLOntologies()) {
			if (!onto.equals(individual.getOWLModel().getDefaultOWLOntology())) {
				return onto.getNamespace();
			}
		}
		return null;
	}
	
	
	/**
	 * Überprüft ob die semantische Brücke auf das Konzept angewendet werden kann
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public JSONObject suggestSemanticBridge(JSONObject request) throws Exception {
		
		// request verarbeiten
		String msgId = request.getString(SemanticExtension.ID);
		String name = request.getString(SemanticExtension.NAME);
		String bridgeString = request.getString(SemanticExtension.SEMANTIC_BRIDGE);

		// Ontologie und Concept splitten
		String[] source = name.split("#");

		// Objekte erstellen
		SemanticBridge bridge = new SemanticBridge(name, bridgeString, source[0], null);
		
		// Semantische Brücke ausführen
		Collection<OWLIndividual> bridgedIndividuals = bridge.useSemanticBridge(source[1]);
		
		// Response generieren
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_SUGGEST_SEMANTIC_BRIDGE + ":::" + SemanticExtension.T_ONTOLOGY + ":::" + bridgeString);
		result.put(SemanticExtension.REFID, msgId);
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_SUGGEST_SEMANTIC_BRIDGE);
		
		// es sind Mapping verfügbar -> Semantische Brücke ist anwendbar
		if (!bridgedIndividuals.isEmpty()) {			
			String namespace = null;
			String target = null;
			for (OWLIndividual individual : bridgedIndividuals) {

				// zuerst einmal Namespace raussuchen
				if (namespace == null) {
					namespace = getTargetNamespaceFromIndividual(individual);
				}
				
				// dann Targetkonzept suchen
				if (namespace != null) {
					
					// durch den Reasoner mehrere Klassifikationen
					for (OWLNamedClass cls : (Collection<OWLNamedClass>) individual.getProtegeTypes()) {
						
						// Klassifikation unseres Konzepts
						//FIXME evt. Namespace überprüfen
						if (cls.getBrowserText().equals(source[1])) {
							
							// das dazugehörige Konzept des anderen Namespaces raussuchen -> fertig
							target = BridgeMapping.createBridgeMap(bridgedIndividuals, namespace).getTargetToSource(cls).getBrowserText();
							break;
						}
					}
				}
				
				// schon beides gefunden -> Antwort vervollständigen -> fertig
				if (namespace != null && target != null) {
					
					// Befehl Semantische Datenobjekte mit dieser Annotation zu highlighten
					result.put(SemanticExtension.ONTOLOGY, namespace.subSequence(0, namespace.length() - 1));
					result.put(SemanticExtension.NAME, target.substring(target.indexOf(":") + 1));
					break;
				}
			}
		}

		return result;
	}
	
	/**
	 * Ändert die Eigenschaften einer Semantischen Brücke
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	public JSONObject editSemanticBridge(final JSONObject request, final Ontology ontology) throws Exception {
		final String id = request.getString(SemanticExtension.ID);
//		final String name = request.getString(NAME);
		final String comment = request.getString(SemanticExtension.COMMENT);
		final String description = request.getString(SemanticExtension.DESCRIPTION);

		SemanticDescription sd = new SemanticDescription(ontology.getModel().getDefaultOWLOntology());
		sd.setUserComment(description);
		sd.addSimpleComment(SemanticDescription.commentType.EDIT, comment);

		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_EDIT + ":::" + SemanticExtension.T_SEMANTIC_BRIDGE
				+ ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, id);
		return result;
	}
	
	/**
	 * Schreibt eine neue Regel mit Anforderung in die Semantische Brücke
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	public JSONObject addRuleRequirement(final JSONObject request, final Ontology ontology) throws Exception {
		String msgId = request.getString(SemanticExtension.ID);
		String name = request.getString(SemanticExtension.NAME);
		String comment = request.getString(SemanticExtension.COMMENT);

		ontology.addSWRLRules(name, comment);
		
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_GET_RULES + ":::"
				+ ontology.getUrl());
		result.put(SemanticExtension.REFID, msgId);

		return result;
	}
	
	/**
	 * Liefert die Regeln einer Semantischen Brücke zurück
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	public JSONObject getRules(final JSONObject request, final Ontology ontology) throws Exception {
		String msgId = request.getString(SemanticExtension.ID);

		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_GET_RULES + ":::"
				+ ontology.getUrl());
		result.put(SemanticExtension.REFID, msgId);
		
		JSONArray rules = new JSONArray();
		List<SemanticBridgeRule> ruleMap = ontology.getSWRLRules(); 
		for (SemanticBridgeRule rule : ruleMap) {
			JSONObject entry = new JSONObject();
			entry.put(SemanticExtension.NAME, rule.getName());
			entry.put(SemanticExtension.RULES, rule.getRules());
			entry.put(SemanticExtension.COMMENT, rule.getComments().toString());
			rules.put(entry);
		}
		result.put(SemanticExtension.RULES, rules);
		return result;
	}
	
	/**
	 * Verwaltet die Semantischen Brücken
	 * 
	 * @author boettcher
	 */
	class SemanticBridgeBucket {
		
		private Ontology source;
		private BridgeMapping mapping;
		private List<SemanticBridge> semBridgeList;
		
		public SemanticBridgeBucket(Ontology source, BridgeMapping mapping, SemanticBridge bridge) {
			this.source = source;
			this.mapping = mapping;
			this.semBridgeList = new ArrayList<SemanticBridge>();
			this.semBridgeList.add(bridge);
		}
		
		public Ontology getKey() {
			return this.source;
		}
		
		public void addSemanticBridge(SemanticBridge bridge) {
			semBridgeList.add(bridge);
		}

		public Ontology getSource() {
			return source;
		}

		public BridgeMapping getMapping() {
			return mapping;
		}

		public List<SemanticBridge> getSemBridgeList() {
			return semBridgeList;
		}
	}
}
