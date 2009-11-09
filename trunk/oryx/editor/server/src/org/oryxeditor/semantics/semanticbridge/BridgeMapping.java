package org.oryxeditor.semantics.semanticbridge;

import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.apache.log4j.Logger;

import edu.stanford.smi.protegex.owl.model.OWLIndividual;
import edu.stanford.smi.protegex.owl.model.OWLNamedClass;
import edu.stanford.smi.protegex.owl.model.RDFResource;

/**
 * kleine Hilfsklasse zur Verwaltung von Mappings bei der Semantischen Brücke
 * 
 * @author boettcher
 */
public class BridgeMapping {
	
	private final static Logger log = Logger.getLogger(org.oryxeditor.semantics.semanticbridge.BridgeMapping.class);
	
	private Map<OWLIndividual, OWLNamedClass> mapping1 = new HashMap<OWLIndividual, OWLNamedClass>();
	private Map<OWLNamedClass, OWLNamedClass> mapping2 = new HashMap<OWLNamedClass, OWLNamedClass>();
	
	public Collection<OWLIndividual> getIndividuals() {
		return mapping1.keySet();
	}
	
	public Collection<OWLNamedClass> getSources() {
		return mapping2.keySet();
	}
	
	public void addTripel(OWLIndividual individual, OWLNamedClass source, OWLNamedClass target) {
		mapping1.put(individual, source);
		mapping2.put(source, target);
	}
	
	public OWLNamedClass getSourceToIndividual(OWLIndividual individual) {
		return mapping1.get(individual);
	}
	
	public OWLNamedClass getTargetToIndividual(OWLIndividual individual) {
		return mapping2.get(mapping1.get(individual));
	}
	
	public OWLNamedClass getTargetToSource(RDFResource source) {
		return mapping2.get(source);
	}
	
	public String getTargetNameToSourceName(String sourceName) {
		for (OWLNamedClass source : mapping2.keySet()) {
			if (source.getBrowserText().equals(sourceName)) {
				return mapping2.get(source).getBrowserText();
			}
		}
		return null;
	}
	
	public String getTargetAsString(OWLIndividual individual) {
		if (getTargetToIndividual(individual) != null)
			return getTargetToIndividual(individual).getBrowserText();
		else
			return "null";
	}
	
	public OWLNamedClass getSourceToTarget(RDFResource target) {
		for (OWLNamedClass key : mapping2.keySet()) {
			if (target != null && target.equals(mapping2.get(key)))
				return key;
		}
		return null;
	}
	
	/**
	 * Gibt zum Targetnamen des entsprechenden Sourcenamen
	 * Berücksichtigt, dass die Targetname aus der SemBrücke
	 * einen NS-Präfix hat.
	 * 
	 * @param targetName
	 * @return
	 */
	public String getSourceNameToTargetName(String targetName) {
		for (OWLNamedClass source : mapping2.keySet()) {
			String tName = mapping2.get(source).getBrowserText();
			
			/*
			 *  Bugfix: Es muss berücksichtigt werden,
			 *  dass hier ein NS-Präfix existiert. 
			 */
			if (tName.contains(":")) {
				tName = tName.substring(tName.indexOf(":") + 1);
			}
			
			if (tName.equals(targetName)) {
				return source.getBrowserText();
			}
		}
		return null;
	}
	
	public boolean containsSource(RDFResource source) {
		return mapping2.containsKey(source);
	}
	
	public boolean containsTarget(RDFResource target) {
		return mapping2.containsValue(target);
	}
	
	/**
	 * Vereinigung zwischen zwei BridgeMappings
	 * 
	 * @param mapping
	 * @return
	 */
	public void addBridgeMapping(BridgeMapping mapping) {
		for (OWLIndividual individual : mapping.getIndividuals()) {
			OWLNamedClass source = mapping.getSourceToIndividual(individual);
			mapping1.put(individual, source);
			mapping2.put(source, mapping.getTargetToIndividual(individual));
		}
	}
	
	/**
	 * Erzeuge zuerst eine Map(Individual -> SourceConcept -> TargetConcept)
	 * 
	 * @param bridgedIndividuals
	 * @param targetNamespace
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public static BridgeMapping createBridgeMap(Collection<OWLIndividual> bridgedIndividuals, String targetNamespace) throws Exception {
		BridgeMapping mapping = new BridgeMapping();
				
		for (Iterator<OWLIndividual> i = bridgedIndividuals.iterator(); i.hasNext();) {
			OWLIndividual individual = i.next();
			OWLNamedClass sourceClass = null;
			OWLNamedClass targetClass = null;
			
			// durch das Reasoning müssen wir erstmal das ursprüngliche Konzept finden
			for (OWLNamedClass cls : (Collection<OWLNamedClass>) individual.getProtegeTypes()) {
				if ("owl".equals(cls.getNamespacePrefix())) { 
					continue;
				}
				else if (targetNamespace.equals(cls.getNamespace())) {
					targetClass = cls;
				}
				else {
					sourceClass = cls;
				}
			}
			
			if (sourceClass == null)
				throw new Exception("Es konnte kein Konzept zur Instanz '" + individual.getBrowserText() + "' gefunden werden.");
			
			// nur wenn auch TargetKonzept vorhanden, haben wir ein Polymorphes Konzept 
			else if (targetClass != null) {
				
				mapping.addTripel(individual, sourceClass, targetClass);
				log.info(individual.getBrowserText() + " -> " + sourceClass.getBrowserText() + " -> " + (targetClass != null ? targetClass.getBrowserText() : "null"));
			}
		}
		
		return mapping;
	}
	
	public boolean isEmpty() {
		return mapping1.isEmpty() || mapping2.isEmpty();
	}
}