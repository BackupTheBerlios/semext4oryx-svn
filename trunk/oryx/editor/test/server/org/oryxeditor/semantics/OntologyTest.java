package org.oryxeditor.semantics;

import junit.framework.TestCase;

public class OntologyTest extends TestCase {
	
	public void testTransformURL2Path() throws Exception {
		
		// Testdaten
		String url = "http://localhost:8080/ontologies/RosettaNetOntology_1.0.xml";
		
		// Ausführen
		String path = Ontology.transformURL2ServerPath(url);
		
		// Validieren
		assertEquals("C:/Program Files/apache-tomcat-6.0.18/webapps/ontologies/RosettaNetOntology_1.0.xml", path);
	}
	
	public void testTransformPath2URL() throws Exception {
		
		// Testdaten
		String path = "C:/Program Files/apache-tomcat-6.0.18/webapps/ontologies/MoonOntology_Versions/MoonOntology_1.1.owl";
		
		// Ausführen
		String url = Ontology.transformServerPath2URL(path);
		
		// Validieren
		assertEquals("http://localhost:8080/ontologies/MoonOntology_Versions/MoonOntology_1.1.owl", url);
	}

	public void testTransformForthAndBack() throws Exception {

		// Testdaten
		String url = "http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology.owl";
		
		// Ausführen
		String path = Ontology.transformURL2ServerPath(url);
		String url2 = Ontology.transformServerPath2URL(path);
		
		// Validieren
		assertEquals(url, url2);

	}
}
