package org.oryxeditor.semantics.semanticbridge;

import java.io.FileWriter;
import java.io.StringReader;
import java.net.URI;
import java.util.Collection;
import java.util.Iterator;

import org.dom4j.Document;
import org.dom4j.io.OutputFormat;
import org.dom4j.io.SAXReader;
import org.dom4j.io.XMLWriter;
import org.json.JSONObject;
import org.oryxeditor.semantics.Ontology;

import edu.stanford.smi.protegex.owl.ProtegeOWL;
import edu.stanford.smi.protegex.owl.jena.JenaOWLModel;
import edu.stanford.smi.protegex.owl.model.OWLIndividual;
import edu.stanford.smi.protegex.owl.model.RDFProperty;
import edu.stanford.smi.protegex.owl.model.RDFResource;
import edu.stanford.smi.protegex.owl.model.util.ImportHelper;
import edu.stanford.smi.protegex.owl.swrl.model.SWRLFactory;
import edu.stanford.smi.protegex.owl.model.NamespaceManager;
import edu.stanford.smi.protegex.owl.model.OWLModel;

public class SemanticBridge {

	private final String name;
	private final String bridgeURL;
	private final String targetURL;
	private final String sourceURL;
	private final JSONObject request;
	
	private Ontology ontology;
	
	/**
	 * Konstruktor mit Übergabe der Ontologie in der die Semantische Brücke gespeichert ist
	 * 
	 * @param ontology - Ontologie in der die Semantische Brücke gespeichert ist
	 * @param sourceURL - URL der Quellontologie
	 * @param targetURL - URL der Zielontologie
	 * @throws Exception
	 */
	public SemanticBridge(Ontology ontology, String sourceURL, String targetURL, JSONObject clientRequest) throws Exception {
		this.ontology = ontology;
		this.name = ontology.getName();
		this.bridgeURL = ontology.getUrl();
		this.sourceURL = sourceURL;
		this.targetURL = targetURL;
		this.request = clientRequest;

		init();
	}
	
	/**
	 * Standardkonstruktor
	 * 
	 * @param name - Name der Semantischen Brücke
	 * @param bridgeURL - URL der Semantischen Brücke
	 * @param sourceURL - URL der Quellontologie
	 * @param targetURL - URL der Zielontologie
	 * @throws Exception
	 */
	public SemanticBridge(String name, String bridgeURL, String sourceURL, String targetURL) throws Exception {
		this(name, bridgeURL, sourceURL, targetURL, null);
	}
	
	public SemanticBridge(String name, String bridgeURL, String sourceURL, String targetURL, JSONObject clientRequest) throws Exception {
		this(new Ontology(bridgeURL, name), sourceURL, targetURL, clientRequest);
	}
	
	/**
	 * Name der Semantischen Brücke
	 * 
	 * @return
	 */
	public String getName() {
		return name;
	}

	/**
	 * URL der Semantischen Brücke
	 * 
	 * @return
	 */
	public String getBridgeURL() {
		return bridgeURL;
	}

	/**
	 * URL der Zielontologie
	 * 
	 * @return
	 */
	public String getTargetURL() {
		return targetURL;
	}

	/**
	 * URL der Quellontologie
	 * 
	 * @return
	 */
	public String getSourceURL() {
		return sourceURL;
	}

	/**
	 * Ontologie mit Semantischer Brücke
	 * 
	 * @return
	 */
	public Ontology getOntology() {
		return ontology;
	}

	/**
	 * Gibt die Ontologie zurück in der die Regeln und Imports der Semantische Brücke gespeichert sind
	 * 
	 * @return Ontologie
	 */
	public Ontology getSemanticBridgeOntologyRepresentation() {
		return ontology;
	}
	
	/**
	 * Clientrequest falls vorhanden, sonst null
	 * 
	 * @return
	 */
	public JSONObject getRequest() {
		return request;
	}

	/**
	 * Erstellt eine neue Semantische Brücke
	 * 
	 * @param name - Name der Semantische Brücke
	 * @param sourceURL - URL der Source Ontologie
	 * @param targetURL - URL der Target Ontologie
	 * @return neuerstellte Semantische Brücke
	 * @throws Exception
	 */
	public static SemanticBridge createSemanticBridge(String name, String sourceURL, String targetURL) throws Exception {
		Ontology ontology = new Ontology(name);
		
		OWLModel model = ontology.getModel();
		NamespaceManager nsManager = model.getNamespaceManager();
		nsManager.init(model);
		
		// importierte URLs
		final String temporal = "http://swrl.stanford.edu/ontologies/built-ins/3.3/temporal.owl";
		final String abox = "http://swrl.stanford.edu/ontologies/built-ins/3.3/abox.owl";
		final String tbox = "http://swrl.stanford.edu/ontologies/built-ins/3.3/tbox.owl";
		final String swrlx = "http://swrl.stanford.edu/ontologies/built-ins/3.3/swrlx.owl";
		final String swrla = "http://swrl.stanford.edu/ontologies/3.3/swrla.owl";
		final String swrlm = "http://swrl.stanford.edu/ontologies/built-ins/3.4/swrlm.owl";
		final String swrlxml = "http://swrl.stanford.edu/ontologies/built-ins/3.4/swrlxml.owl";
		final String sqwrl = "http://sqwrl.stanford.edu/ontologies/built-ins/3.4/sqwrl.owl";
		
		// SWRL Builds-ins
		nsManager.setPrefix(swrlxml + "#", "swrlxml");
		nsManager.setPrefix(swrlx + "#", "swrlx");
		nsManager.setPrefix(swrlm + "#", "swrlm");
		nsManager.setPrefix(temporal + "#", "temporal");
		nsManager.setPrefix(tbox + "#", "tbox");
		nsManager.setPrefix(abox + "#", "abox");
		nsManager.setPrefix(swrla + "#", "swrla");
		nsManager.setPrefix(sqwrl + "#", "sqwrl");
		
		nsManager.setPrefix("http://www.w3.org/2003/11/swrl#", "swrl");
		nsManager.setPrefix("http://www.w3.org/2003/11/swrlb#", "swrlb");
		
		nsManager.setPrefix("http://protege.stanford.edu/plugins/owl/protege#", "protege");
		
		// Quell- und Zielontologien
		nsManager.setPrefix(sourceURL + "#", "source");
		nsManager.setPrefix(targetURL + "#", "target");

		// Imports
		ImportHelper importHelper = new ImportHelper((JenaOWLModel) model);
		importHelper.addImport(new URI(sourceURL));
		importHelper.addImport(new URI(targetURL));

		importHelper.addImport(new URI(temporal));
		importHelper.addImport(new URI(abox));
		importHelper.addImport(new URI(tbox));
		importHelper.addImport(new URI(swrlx));
		importHelper.addImport(new URI(swrla));
		importHelper.addImport(new URI(swrlm));
		importHelper.addImport(new URI(swrlxml));
		importHelper.addImport(new URI(sqwrl));
		importHelper.importOntologies();
		
		return new SemanticBridge(ontology, sourceURL, targetURL, null);
	}
	
	/**
	 * Initialisierung der Semantischen Brücke
	 * @throws Exception
	 */
	private void init() throws Exception {
		
		// überprüfen ob semantische Brücke target und source Ontologie enthält (aus PerformanceGründen erstmal abgeschaltet)
//		OWLModel bridge = ProtegeOWL.createJenaOWLModelFromURI(bridgeURL);
//		if (bridge.getNamespaceManager().getPrefix(targetURL + "#") == null || bridge.getNamespaceManager().getPrefix(sourceURL + "#") == null)
//			throw new Exception("Semantische Brücke muss sowohl Source- als auch TagetOntologie enthalten.");
	}
	
	/**
	 * führt die Semantische Brücke zwischen zwei Konzepten aus
	 * 
	 * @param sourceURL
	 * @param concept
	 * @param bridgeURL
	 * @return
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public Collection<OWLIndividual> useSemanticBridge(String sourceConcept) throws Exception {
		
		Ontology source = new Ontology("undefined", sourceURL, "source");
		JenaOWLModel bridgingModel = (JenaOWLModel) source.getModel();
		
		// creating individuals to bridge
		source.createIndividual(source.getModel().getOWLNamedClass(sourceConcept), true);
//		bridgingModel.save(new File("C:/Program Files/apache-tomcat-6.0.18/webapps/ontologies/withIndividuals.owl").toURI());
//		source = new Ontology("http://localhost:8080/ontologies/withIndividuals.owl", "source");
//		bridgingModel = (JenaOWLModel) source.getModel();
//		JenaOWLModel.save(new File("withIndividuals.owl"), source.getModel().getOntModel(), FileUtils.langXML, 
//                source.getModel().getDefaultOWLOntology().getNamespace());
		
		RDFResource rootIndividual = null;
		for (Iterator<RDFResource> it = bridgingModel.getUserDefinedRDFIndividuals(false).iterator(); it.hasNext();) {
			rootIndividual = it.next();
			
			if (rootIndividual.getProtegeTypes().contains(bridgingModel.getRDFResource(sourceConcept))) {
				break;
			}
		}
		
		ImportHelper importHelper = new ImportHelper(bridgingModel);
		importHelper.addImport(new URI(bridgeURL));
		importHelper.importOntologies();
		
		bridgingModel = SemanticUtils.removeBadNamespaceDeclarations(bridgingModel);
		
		SemanticUtils.performOWLandSWRLreasoning(bridgingModel);
		
		SWRLFactory swrlFactory = new SWRLFactory(bridgingModel);
		swrlFactory.deleteImps();
		
		// zum Testen
		String output = SemanticUtils.writeMinimalInferredModel(bridgingModel,rootIndividual);
		SAXReader reader = new SAXReader();
		Document doc = reader.read(new StringReader(output));
		
		// lets write to a file
        XMLWriter writer = new XMLWriter(
            new FileWriter( "output.xml" )
        );
        writer.write( doc );
        writer.close();
        
		return SemanticUtils.removeTBox(bridgingModel, rootIndividual).getOWLIndividuals();
	}
	
	/**
	 * Testmethode
	 * 
	 * @param args
	 * @throws Exception
	 */
	public static void main(String[] args) throws Exception {
		SemanticBridge bridge = new SemanticBridge("RosettaNet2Moon", "http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology_neu.owl", "http://localhost:8080/ontologies/RosettaNetOntology.owl", "http://localhost:8080/ontologies/MoonOntology.owl");
		System.out.println(bridge.useSemanticBridge("Partner"));
//		SemanticBridge.runSemanticBridgeExample();
	}
		
	/**
	 * NUR Testmethode
	 * 
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	public static void runSemanticBridgeExample() throws Exception {
        JenaOWLModel     bridgingModel      = null;
        String           output             = null;

		// load the parsed model into bridging model
        String name = "RosettaNetOntology2";
		bridgingModel = ProtegeOWL.createJenaOWLModelFromURI("http://localhost:8080/ontologies/" + name + ".owl");

		// get the root individual in the model (the Process individual)
		// (this is used to write the minimal inferred model after performing
		// reasoning)
		RDFResource rootIndividual = null;
//		String processClassName = bridgingModel.getResourceNameForURI("http://localhost/semanticWeb/RosettaNetOntology.owl#Partner");
		
//		bridgingModel.getOWLNamedClass("Partner").createOWLIndividual("partner_1");
		
		RDFResource process = bridgingModel.getRDFResource("Partner");
		Collection individuals = bridgingModel.getUserDefinedRDFIndividuals(false);
		for (Iterator iterator = individuals.iterator(); iterator.hasNext();) {
			rootIndividual = (RDFResource) iterator.next();

			if (rootIndividual.getProtegeTypes().contains(process)) {
				break;
			}
		}

		// make the given URL for the bridge ontology absolute if necessary
//		bridgeURI = SemanticBpelFunctionContext
//				.convertProjectRelativeUriToAbsoluteUri((String) arg0);

		// Import the bridge ontology containing the mapping rules
		// from the specified URI
		ImportHelper importHelper = new ImportHelper(bridgingModel);

		importHelper.addImport(new URI("http://localhost:8080/ontologies/semantic-bridges/SemanticBridge_RosettaNetOntology2MoonOntology2.owl"));
		importHelper.importOntologies();

		// TODO this is a workaround for removing "bad" namespace declarations
		// caused by creating objects that do not have a namespace declaration
		bridgingModel = SemanticUtils
				.removeBadNamespaceDeclarations(bridgingModel);

		// perform all necessary steps for OWL and SWRL reasoning
		// (which performs the actual dataflow)
		SemanticUtils.performOWLandSWRLreasoning(bridgingModel);

		// create SWRLFactory for manipulation of rule model
		SWRLFactory swrlFactory = new SWRLFactory(bridgingModel);

		// delete the rules, since we do not want to safe them into the
		// resulting ontology
		swrlFactory.deleteImps();

		// remove all swrl related facts (like e.g. swrl-variables, imports)
		// SemanticUtils.removeRemainingSWRLFacts(bridgingModel);
		
		// remove protege internals & all individuals from model
		Collection bridgedIndividuals = SemanticUtils.removeTBox(bridgingModel, rootIndividual).getOWLIndividuals();
		
		for (Iterator i = bridgedIndividuals.iterator(); i.hasNext();) {
			OWLIndividual individual = (OWLIndividual) i.next();
//			System.out.println("Types: " + individual.getRDFTypes());
//			System.out.println("### " + individual.getBrowserText() + " ###");
			for (Object property : individual.getPossibleRDFProperties()) {
				RDFProperty prop = (RDFProperty) property;
				
				// only from namespaces of the two ontologies
				//FIXME dynamisch machen
				if ("http://localhost:8080/ontologies/MoonOntology.owl#".equals(prop.getNamespace()) || "http://localhost:8080/ontologies/RosettaNetOntology.owl#".equals(prop.getNamespace())) {
					
					// only the properties with values
					if (individual.getPropertyValue(prop) != null) {
						System.out.println(prop.getBrowserText());
					}
				}
			}
			System.out.println("#######################");
		}
		
		// write the resulting ontology model
		output = SemanticUtils.writeMinimalInferredModel(bridgingModel,rootIndividual);
//		System.out.println("Semantic Bridge Result: " + output);

		// fokus-style
//		org.w3c.dom.Document outDoc = SemanticUtils.xmlStringToElement(output, "root");
//	    String filename = "c:/output2.xml";
//	    Source source = new DOMSource(outDoc);
//	    File file = new File(filename);
//	    Result result = new StreamResult(file);
//	    Transformer xformer = TransformerFactory.newInstance().newTransformer();
//	    xformer.transform(source, result);
		
        // make sure the memory is deallocated
        bridgingModel.dispose();
        System.gc();
        System.runFinalization();
        System.gc();
        
	    // my-style
		SAXReader reader = new SAXReader();
		Document doc = reader.read(new StringReader(output));
		
		// lets write to a file
        XMLWriter writer = new XMLWriter(
            new FileWriter( "output.xml" )
        );
        writer.write( doc );
        writer.close();


        // Pretty print the document to System.out
        OutputFormat format = OutputFormat.createPrettyPrint();
        writer = new XMLWriter( System.out, format );
        writer.write( doc );

        // Compact format to System.out
        format = OutputFormat.createCompactFormat();
        writer = new XMLWriter( System.out, format );
//        writer.write( doc );

		
//		TransformerFactory tf = TransformerFactory.newInstance();
//	    tf.setAttribute("indent-number", new Integer(4));
//	    Transformer t = tf.newTransformer();
//	    t.setOutputProperty(OutputKeys.INDENT, "yes");
//	    t.setOutputProperty(OutputKeys.METHOD, "xml");
//	    t.setOutputProperty(OutputKeys.MEDIA_TYPE, "text/xml");
//	
//	    t.transform(new DOMSource(outDoc), new StreamResult(new OutputStreamWriter(new FileOutputStream(new File("C:\\output.owl")))));
	}
}
