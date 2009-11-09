package org.oryxeditor.semantics.handler;

import java.net.URL;
import java.util.Iterator;

import org.apache.commons.collections.map.ListOrderedMap;
import org.dom4j.Document;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import edu.stanford.smi.protegex.owl.model.OWLNamedClass;
import edu.stanford.smi.protegex.owl.model.RDFProperty;
import edu.stanford.smi.protegex.owl.model.RDFSClass;

import org.oryxeditor.semantics.Ontology;
import org.oryxeditor.semantics.SemanticDescription;
import org.oryxeditor.server.SemanticExtension;

public class SemanticDataobjectHandler {

	@SuppressWarnings("unchecked")
	public JSONObject editConcept(final JSONObject request, final Ontology ontology) throws Exception {
		final String name = request.getString(SemanticExtension.NAME);
		final String superConcept = request.getString(SemanticExtension.SUPER);
		final String object = request.getString(SemanticExtension.OBJECT);
		final String comment = request.getString(SemanticExtension.COMMENT);
		final String description = request.getString(SemanticExtension.DESCRIPTION);

		// Konzept ändern
		OWLNamedClass conceptClass = ontology.getModel().getOWLNamedClass(object);
		
		// Superklasse -> falls nicht vorhanden: OWLThing
		OWLNamedClass newSuperConcept = (superConcept.length() > 0 ? ontology.getModel().getOWLNamedClass(superConcept) : ontology.getModel().getOWLThingClass());
		for (Iterator i = conceptClass.getSuperclasses(false).iterator(); i.hasNext();) {
			RDFSClass cls = (RDFSClass) i.next();
			conceptClass.removeSuperclass(cls);
		}
		conceptClass.addSuperclass(newSuperConcept);
		conceptClass.setName(name);

		// Kommentar für den Ontology Engineer
		SemanticDescription desc = new SemanticDescription(conceptClass);
		desc.addComplexComment(SemanticDescription.commentType.EDIT,
				new ListOrderedMap() {
					/** */
					private static final long serialVersionUID = 7495392226821890386L;

					{
						put("New Name", name);
						put("New SuperConcept", superConcept);
					}
				}, comment);

		// Beschreibung setzen
		desc.setUserComment(description);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_EDIT + ":::" + SemanticExtension.T_CONCEPT + ":::"
				+ object + ":::TO:::" + name + ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}
	
	public JSONObject addProperty(final JSONObject request, final Ontology ontology) throws Exception {
		final String comment = request.getString(SemanticExtension.COMMENT);
		final String description = request.getString(SemanticExtension.DESCRIPTION);

		String name = request.getString(SemanticExtension.NAME);
		String domain = request.getString(SemanticExtension.DOMAIN);
		String range = request.getString(SemanticExtension.RANGE);
		boolean literal = request.has(SemanticExtension.LITERAL) ? request.getBoolean(SemanticExtension.LITERAL)
				: false;

		// Property
		OWLNamedClass subject = ontology.getModel().getOWLNamedClass(
				domain);

		// Datatyp Property
		RDFProperty property;
		if (literal) {
			property = ontology.getModel().createOWLDatatypeProperty(name, ontology.getModel().getXSDstring());
			property.setDomain(subject);
		}

		// Object Property
		else {
			OWLNamedClass object = ontology.getModel().getOWLNamedClass(range);
			property = ontology.getModel().createOWLObjectProperty(name);
			property.setDomain(subject);
			property.setRange(object);
		}

		SemanticDescription sd = new SemanticDescription(property);
		sd.setUserComment(description);
		sd.addSimpleComment(SemanticDescription.commentType.ADD, comment);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_ADD + ":::" + SemanticExtension.T_PROPERTY + ":::"
				+ name + ":::TO:::" + domain + "->" + range + ":::"
				+ ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}
	
	public JSONObject editProperty(final JSONObject request, final Ontology ontology) throws Exception {
		final String name = request.getString(SemanticExtension.NAME);
		final String domain = request.getString(SemanticExtension.DOMAIN);
		final String range = request.getString(SemanticExtension.RANGE);
		String obj = request.getString(SemanticExtension.OBJECT);
		final String comment = request.getString(SemanticExtension.COMMENT);
		final String description = request.getString(SemanticExtension.DESCRIPTION);

		// Konzept ändern
		RDFProperty property = ontology.getModel().getRDFProperty(obj);
		OWLNamedClass subject = ontology.getModel().getOWLNamedClass(
				domain);
		OWLNamedClass object = ontology.getModel().getOWLNamedClass(range);
		property.setName(name);
		property.setDomain(subject);
		property.setRange(object);

		// Kommentar für den Ontology Engineer
		SemanticDescription desc = new SemanticDescription(property);
		desc.addComplexComment(SemanticDescription.commentType.EDIT,
				new ListOrderedMap() {
					/** */
					private static final long serialVersionUID = -5587926227071932622L;

					{
						put("New Name", name);
						put("New DomainObject", domain);
						put("New RangeObject", range);
					}
				}, comment);
		desc.setUserComment(description);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_EDIT + ":::" + SemanticExtension.T_PROPERTY + ":::"
				+ name + ":::TO:::" + domain + "->" + range + ":::"
				+ ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}

	public JSONObject removeConcept(final JSONObject request, final Ontology ontology) throws Exception {
		String name = request.getString(SemanticExtension.NAME);
		final String comment = request.getString(SemanticExtension.COMMENT);

		// Konzept als veraltet kennzeichnen
		OWLNamedClass clazz = ontology.getModel().getOWLNamedClass(name);
		clazz.setDeprecated(true);

		// Kommentar für den Ontology Engineer
		SemanticDescription sd = new SemanticDescription(clazz);
		sd.addSimpleComment(SemanticDescription.commentType.DELETE, comment);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_REMOVE + ":::" + SemanticExtension.T_CONCEPT
				+ ":::" + name + ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}

	public JSONObject removeProperty(final JSONObject request, final Ontology ontology) throws Exception {
		String name = request.getString(SemanticExtension.NAME);
		final String comment = request.getString(SemanticExtension.COMMENT);

		// Konzept löschen
		RDFProperty property = ontology.getModel().getRDFProperty(name);
		property.setDeprecated(true);

		// Kommentar für den Ontology Engineer
		SemanticDescription sd = new SemanticDescription(property);
		sd.addSimpleComment(SemanticDescription.commentType.DELETE, comment);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_REMOVE + ":::" + SemanticExtension.T_PROPERTY
				+ ":::" + name + ":::" + ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}
	
	 
	public JSONObject addConcept(final JSONObject request, final Ontology ontology) throws Exception {
		String name = request.getString(SemanticExtension.NAME);
		String superConcept = request.getString(SemanticExtension.SUPER);
		String comment = request.getString(SemanticExtension.COMMENT);
		String description = request.getString(SemanticExtension.DESCRIPTION);

		// Superklasse finden -> falls nicht vorhanden: OWLThing
		OWLNamedClass superClass = (superConcept.length() > 0 ? ontology.getModel().getOWLNamedClass(superConcept) : ontology.getModel().getOWLThingClass());
		OWLNamedClass clazz = ontology.getModel().createOWLNamedSubclass(name, superClass);
		SemanticDescription sd = new SemanticDescription(clazz);
		sd.setUserComment(description);
		sd.addSimpleComment(SemanticDescription.commentType.ADD, comment);

		// Antwort schreiben
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_ADD + ":::" + SemanticExtension.T_CONCEPT + ":::"
				+ name + ":::TO:::" + superConcept + ":::"
				+ ontology.getUrl());
		result.put(SemanticExtension.REFID, request.getString(SemanticExtension.ID));
		return result;
	}
	
	/**
	 * Liefert eine Liste der Konzepte der Objektproperties des angegebenen
	 * Konzepts zurück
	 * 
	 * @param request
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public JSONObject getConcepts(final JSONObject request) throws Exception {
		String msgId = request.getString(SemanticExtension.ID);
		String name = request.getString(SemanticExtension.NAME);
		String xml = request.getString(SemanticExtension.XML);

		// Ergebnisliste
		JSONArray ranges = new JSONArray();
		
		// falls es ein gebridgetes Concept ist, müssen wir aus der Repräsentation den Namen extrahieren
		SAXReader reader = new SAXReader();
		Document doc = reader.read(new URL(xml));
		Element parent = (Element) doc.selectSingleNode("//concept[@cls='"+name+"']");

		for (Iterator<Element> i = parent.elementIterator(); i.hasNext();) {
			Element child = i.next();
			
			// Subkonzept
			if (SemanticExtension.T_CONCEPT.equals(child.getName())) {
				JSONObject json = new JSONObject();
				json.put(SemanticExtension.NAME, child.attributeValue("cls"));
				json.put(SemanticExtension.TYPE, SemanticExtension.OBJECT);
				ranges.put(json);
			}
			
			else if (SemanticExtension.T_PROPERTY.equals(child.getName())) {
				
				// Datenproperty
				if ("true".equals(child.attributeValue("leaf"))) {
					JSONObject json = new JSONObject();
					String attrName = child.attributeValue("property");
					json.put(SemanticExtension.NAME, attrName.startsWith("has") ? attrName.substring(3) : attrName);
					json.put(SemanticExtension.TYPE, SemanticExtension.LITERAL);
					ranges.put(json);
				}
				
				// Objektproperty
				else {
					Element clsChild = (Element) child.selectSingleNode(SemanticExtension.T_CONCEPT);
					
					/* workaround: wenn keine Objekte vorhanden sind fortfahren*/
					if (clsChild == null)
						continue;
					
					/* Polymorphe Konzepte können polymorphe Kindkonzepte enthalten, die über
					 * die Eigenschaften doppelt enthalten sind.
					 * Um die doppelten Herauszufiltern überprüfen wir vor dem Einfügen ob
					 * das polymorphes Konzept bereits enthalten ist. 
					 */
					if (!containsConceptAttribute(ranges, clsChild)) {
						JSONObject json = new JSONObject();
						json.put(SemanticExtension.NAME, clsChild.attributeValue("cls"));
						json.put(SemanticExtension.TYPE, SemanticExtension.OBJECT);
						ranges.put(json);
					}
				}
			}
		}
		
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_GET_CONCEPTS + ":::" + xml);
		result.put(SemanticExtension.REFID, msgId);
		result.put(SemanticExtension.RANGE, ranges);
		return result;
	}
		
	/**
	 * kleine Hilfmethode um doppelte polymorphe Konzepte zu entdecken
	 * 
	 * @param ranges
	 * @param xml
	 * @return ist das Konzept bereits enthalten 
	 */
	private boolean containsConceptAttribute(JSONArray ranges, Element xml) throws JSONException {
		for (int i = 0; i < ranges.length(); i++) {
			JSONObject obj = ranges.getJSONObject(i);
			String name = obj.getString(SemanticExtension.NAME);
			
			// nur polymorphe Konzepte sollen herausgefiltert werden
			if (name != null && name.contains(" = ") && xml.attributeValue("ns").contains(",")) {
				if (name.equals(xml.attributeValue("cls"))) {
					return true;
				}
			}
		}
		return false;
	}
	
	public JSONObject reloadOntology(final JSONObject object, final String modelID) throws Exception {
		
		// Ontologie laden, falls vorhanden
		if (object.has(SemanticExtension.URL)) {
			Ontology ontology = SemanticExtension.getOntologyFromFile(modelID, object.getString(SemanticExtension.URL));
			return reloadOntology(object, ontology);
		}

		else {
			JSONObject error = new JSONObject();
			error.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.ERROR + ":::" + SemanticExtension.C_RELOAD);
			error.put(SemanticExtension.ERROR, "Es wurde keine URL übergeben.");
			return error;
		}
		
	}
	
	public JSONObject reloadOntology(final JSONObject object, final Ontology ontology) throws Exception {
		String id = object.getString(SemanticExtension.ID);
		
		// Ontologie laden, falls vorhanden
		Ontology onto = ontology;
		if (object.has(SemanticExtension.URL)) {
			onto = SemanticExtension.getOntologyFromFile(ontology.getModelID(), object.getString(SemanticExtension.URL));
		}
		
		// XML austauschen, falls vorhanden
		if (object.has(SemanticExtension.XML)) {
			onto.setXmlserverpath(object.getString(SemanticExtension.XML));
		}
		
		JSONObject result = new JSONObject();
		result.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_RELOAD + ":::" + SemanticExtension.T_ONTOLOGY + ":::" + onto.getUrl());
		result.put(SemanticExtension.REFID, id);
		result.put(SemanticExtension.COMMAND, SemanticExtension.C_CHANGE_REPRESENTATION);
		result.put(SemanticExtension.TYPE, SemanticExtension.T_ONTOLOGY);
		result.put(SemanticExtension.URL, onto.getUrl());
		result.put(SemanticExtension.XML, onto.createXMLFile());
		
		return result;
	}
}
