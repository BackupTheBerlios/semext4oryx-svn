package org.oryxeditor.semantics;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.OutputFormat;
import org.dom4j.io.XMLWriter;
import org.oryxeditor.semantics.semanticbridge.BridgeMapping;
import org.oryxeditor.semantics.semanticbridge.SemanticBridgeRule;

import edu.stanford.smi.protegex.owl.model.OWLOntology;
import edu.stanford.smi.protegex.owl.ProtegeOWL;
import edu.stanford.smi.protegex.owl.jena.JenaOWLModel;
import edu.stanford.smi.protegex.owl.model.NamespaceManager;
import edu.stanford.smi.protegex.owl.model.OWLIndividual;
import edu.stanford.smi.protegex.owl.model.OWLModel;
import edu.stanford.smi.protegex.owl.model.OWLNamedClass;
import edu.stanford.smi.protegex.owl.model.OWLObjectProperty;
import edu.stanford.smi.protegex.owl.model.OWLProperty;
import edu.stanford.smi.protegex.owl.model.OWLRestriction;
import edu.stanford.smi.protegex.owl.model.RDFIndividual;
import edu.stanford.smi.protegex.owl.model.RDFProperty;
import edu.stanford.smi.protegex.owl.model.RDFResource;
import edu.stanford.smi.protegex.owl.model.util.ImportHelper;
import edu.stanford.smi.protegex.owl.swrl.model.SWRLFactory;
import edu.stanford.smi.protegex.owl.swrl.model.SWRLImp;
import edu.stanford.smi.protegex.owl.swrl.parser.SWRLParseException;

public class Ontology {

	private final static Logger log = Logger.getLogger(org.oryxeditor.semantics.Ontology.class);
	
	/** Versionspattern als RegExp */
	public static final Pattern VERSION_PATTERN = Pattern.compile("(\\w+)(\\.(\\d+))?");
	
	private final String[] STANDARD_NAMESPACES = { "owl", "rdf", "rdfs", "swrl", "protege", "swrlxml" };
	private final String[] STANDARD_PROPERTIES = { "hasRef" };
	private List<String> black_concept_list = new ArrayList<String>();

	private String url;
	private Document xml;
	private String name;
	private OWLModel model = null;
	private String version = null;
	private String description = null;
	private String xmlURL = null;
	
	/** ModelID, danach richtet sich u.a. der Speicherplatz */
	private String modelID = "";
	
	/** Standard URL Root */
	public static String url_root = "http://localhost:8080/ontologies/";
	
	/** Standard Server Verzeichnis */
	public static String path_root = "C:/Program Files/apache-tomcat-6.0.18/webapps/ontologies/";
	
	/**
	 * Es wird eine komplett neue Ontologie aufgebaut
	 * 
	 * @param name
	 * @throws Exception
	 */
	public Ontology(String name) throws Exception {
		this.modelID = generateNewModelId();
		this.name = name;
		String url = url_root + name + ".owl";
		if (isURLReachable(url))
			throw new Exception("Die URL '" + url + "' existiert bereits.");
		this.url = url;
		this.model = ProtegeOWL.createJenaOWLModel();
		NamespaceManager nsManager = this.model.getNamespaceManager();
		nsManager.init(this.model);
		nsManager.setPrefix("http://www.w3.org/2000/01/rdf-schema#", "rdfs");
		nsManager.setPrefix("http://www.w3.org/1999/02/22-rdf-syntax-ns#", "rdf");
		nsManager.setPrefix("http://www.w3.org/2002/07/owl#", "owl");
		nsManager.setPrefix("http://www.w3.org/2001/XMLSchema#", "xsd");
		nsManager.setDefaultNamespace(url + "#");
		//TODO Namespaces setzen
		this.xml = createXMLRepresenatation();
	}
	
	/**
	 * Es wird eine vorhandene Ontologie geladen
	 * TODO sollte wohl in eigene Methode 
	 * 
	 * @param modelID
	 * @param url
	 * @param name
	 * @param model
	 * @throws Exception
	 */
	public Ontology(final String modelID, String url, String name, OWLModel model) throws Exception {
		this.modelID = "".equals(modelID) ? generateNewModelId() : modelID;
		this.url = url;
		this.model = model;
		this.name = name;
//		this.version = readVersionFromModel();
//		this.description = readDescriptionFromModel();
		this.xml = createXMLRepresenatation();
	}
	
	/**
	 * Es wird eine vorhandene Ontologie geladen
	 * TODO sollte wohl in eigene Methode 
	 * 
	 * @param modelID
	 * @param url
	 * @param name
	 * @throws Exception
	 */
	public Ontology(final String modelID, String url, String name) throws Exception {
		this(modelID, url, name, null);
	}
	
	/**
	 * Es wird eine vorhandene Ontologie geladen
	 * TODO sollte wohl in eigene Methode 
	 * 
	 * @param url
	 * @param name
	 * @throws Exception
	 */
	public Ontology(String url, String name) throws Exception {
		this("", url, name, null);
	}
	
	/**
	 * vollständiger Kontruktor
	 * 
	 * @param modelID
	 * @param url
	 * @param xml
	 * @param model
	 * @param name
	 * @param version
	 * @param description
	 */
	public Ontology(final String modelID, String url, Document xml, OWLModel model, String name, String version, String description) {
		this.modelID = "".equals(modelID) ? generateNewModelId() : modelID;
		this.url = url;
		this.xml = xml;
		this.model = model;
		this.name = name;
		this.version = version;
		this.description = description;
	}
	
	/**
	 * Hilfsmethode um aus dem Modell die Beschreibung der Ontologie zu lesen, falls nicht vorhanden wird ein Standardstring zurückgegeben
	 * 
	 * @return Beschreibung der Ontology (falls nicht vorhanden -> Standardstring)
	 */
	@SuppressWarnings("unchecked")
	private String readDescriptionFromModel() {
		OWLOntology ont = getModel().getDefaultOWLOntology();
		if (ont.getComments().size() > 0) {
			String comment = new String();
			for (String s : (Collection<String>) ont.getComments()) {
				comment += s + "\n";
			}
			return comment;
		}
			
		else
			return "Keine Beschreibung vorhanden";
	}
	
	/**
	 * Hilfsmethode um aus dem Modell die Version der Ontologie zu lesen, falls nicht vorhanden wird <i>1.0</i> zurückgegeben
	 * 
	 * @return Version der Ontology (falls nicht vorhanden -> 1.0)
	 */
	private String readVersionFromModel() {
		OWLOntology ont = getModel().getDefaultOWLOntology();
		Object value = ont.getPropertyValue(getModel().getOWLVersionInfoProperty());
		return (value != null) ? value.toString() : "1.0";
	}
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getUrl() {
		return url;
	}
	public void setUrl(String url) {
		this.url = url;
	}
	public Document getXml() {
		return xml;
	}
	public void setXml(Document xml) {
		this.xml = xml;
	}
	public OWLModel getModel() {
		if (model == null) {
			try {
				model = ProtegeOWL.createJenaOWLModelFromURI(url);
			}
			
			catch (Exception e) {
				throw new RuntimeException("Das Modell der Ontologie konnte nicht eingelesen werden", e);
			}
		}
		return model;
	}
	public void setModel(OWLModel model) {
		this.model = model;
	}
	public String getVersion() {
		if (version == null) {
			version = readVersionFromModel();
		}
		return version;
	}
	public void setVersion(String version) {
		this.version = version;
	}
	public String getDescription() {
		if (description == null) {
			description = readDescriptionFromModel();
		}
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	
	/**
	 * Hilfsmethode die testet, ob es bereits eine Resource mit dieser URL exisitert
	 * 
	 * @param url
	 * @return
	 */
	private boolean isURLReachable(String url) {
		try {
			InputStream is = new URL(url).openStream();
			is.close();
			return true;
		}
		
		catch (IOException e) {
			return false;
		}
	}
	
	/**
	 * Erstellt die XML Repräsentation der Ontologie
	 * 
	 * @return
	 * @throws Exception
	 */
	private Document createXMLRepresenatation() throws Exception {
		Document document = DocumentHelper.createDocument();
		Element root = document.addElement("ontology");

		root.addAttribute("version", getVersion());
		root.addAttribute("description", getDescription());

		buildTreeModell(root, getModel().getOWLThingClass(), false);
		for (Object child : root.selectNodes("concept")) {
			Element e = (Element) child;
			if (black_concept_list.contains(e.attribute("cls").getValue())) {
				e.addAttribute("type", "flat");
			}
		}
		
		return document;
	}
	
	private String generateNewVersion(File versionFolder, String newVersion) throws Exception {

		// Überprüfen ob Version schon vorhanden ist?
		File file = new File(versionFolder + File.separator + name + "_" + newVersion + ".owl");
		if (file.exists()) {
			
			// Unterversion bereits vorhanden => erhöre Unterversion
			int subVersion = 1;
			while (new File(versionFolder + File.separator + name + "_" + newVersion + "." + subVersion + ".owl").exists()) {
				subVersion++;
			}
			
			// neue Unterversion erzeugt
			return newVersion + "." + subVersion;
			
		}
		
		else
			return newVersion;
	}
	
	public Ontology createNewVersion() throws Exception {

		String newVersion;
		
		Matcher m = VERSION_PATTERN.matcher(getVersion());
		if (m.find()) {
			String prefix = m.group(1);
			
			// bereits vorhandene Versionsstruktur
			if (m.groupCount() == 3) {
				Integer num = new Integer(m.group(3));
				newVersion = prefix + "." + (num.intValue() + 1);
			}
			
			// neue Versionsstruktur
			else {
				newVersion = prefix + ".1";
			}
		}
		
		// nicht parsbar
		else {
			throw new Exception("Die Versionskennzeichnung '" + getVersion() + "' konnte nicht interpretiert werden.");
		}
		
		// Versionsverzeichnis ggf. anlegen
//		File versionFolder = new File(path_root + name + "_Versions");
//		if (!versionFolder.exists())
//			versionFolder.mkdir();

		
		//TODO Version in die Ontologie schreiben
		
		return createNewVersion(name, newVersion);
	}
	
	/**
	 * Erstellt eine neue Version von einer Ontologie
	 * 
	 * @param path
	 * @param name
	 * @param version
	 * @return
	 * @throws Exception
	 */
	public Ontology createNewVersion(String name, String version) throws Exception {

		// neue Version ermitteln
//		File versionFolder = new File(path_root + name + "_Versions");
		File versionFolder = new File(path_root);
		String newVersion = generateNewVersion(versionFolder, version.replace(' ', '_'));
		File newServerLocation = new File(getServerLocation(name, newVersion, "owl"));
		String urlPath = transformServerPath2URL(newServerLocation.getAbsolutePath());
		
		// Fehlermeldung falls Ontologie bereits existiert
		if (newServerLocation.exists())
			throw new Exception("Die Ontologie '" + urlPath + "' existiert bereits und konnte nicht angelegt werden.");
		
		// Version erstellen		
		getModel().getDefaultOWLOntology().setComment(getDescription());
		getModel().getDefaultOWLOntology().setPropertyValue(getModel().getOWLVersionInfoProperty(), version);
		JenaOWLModel jenaModel = (JenaOWLModel) getModel();
		jenaModel.save(newServerLocation.toURI());
		Ontology newOntology = new Ontology(modelID, urlPath, name, getModel());
		newOntology.setVersion(newVersion);
		newOntology.setDescription(this.getDescription());
		
		return newOntology;
	}
	
	/**
	 * Interne Berechnung für den Speicherort der Ontologie auf dem Server
	 * 
	 * @param name
	 * @param version
	 * @param fileExtension
	 * @return
	 */
	private String getServerLocation(String name, String version, String fileExt) {
		
		// Standardverzeichnis
		StringBuffer serverLocation = new StringBuffer(path_root);
		
		// Modellverzeichnis
		File modelFolder = new File(path_root + File.separator + modelID);
		if (!modelFolder.exists()) {
			modelFolder.mkdir();
		}
		serverLocation.append(modelFolder.getName() + File.separator);
		
		// Versionsverzeichnis
		File versionFolder = new File(modelFolder + name + "_Versions");
		if (versionFolder.exists()) {
			modelFolder.mkdir();
			serverLocation.append(versionFolder.getName() + File.separator);
		}
				
		// Dateianme hinzufügen
		serverLocation.append(name + "_" + version + "." + fileExt);
		
		return serverLocation.toString();
	}
	
	/**
	 * Interne Berechnung der neuen URL für die Ontologie
	 * 
	 * @param standardpath
	 * @param name
	 * @param version
	 * @return
	 */
//	private String getNewOntologyURL(String name, String version, String timestamp, String fileExt) {
//		// Standardverzeichnis
//		StringBuffer url = new StringBuffer(url_root);
//		
//		// Versionsverzeichnis
//		File versionFolder = new File(path_root + name + "_Versions");
//		if (versionFolder.exists()) {
//			url.append(versionFolder.getName() + "/");
//		}
//		
//		// Dateianme hinzufügen
//		url.append(name + "_" + version + "_" + timestamp + "." + fileExt);
//		
//		return url.toString();
//	}
	
	private String generateNewModelId() {
		SimpleDateFormat dateformat = new SimpleDateFormat("yyyyMMdd_HHmmss");
		String timestamp = dateformat.format(new Date());
		return timestamp;
	}
	
	public String createXMLFile() throws IOException {
		String vers = getVersion();
		
		// lets write to a file
		OutputFormat format = OutputFormat.createPrettyPrint();
		String path = getServerLocation(name, vers, "xml");
		XMLWriter writer = new XMLWriter(new FileWriter(path), format);
		writer.write(xml);
		writer.close();

		// wenn alles bis hierher geklappt hat, versuchen wir die alte Datei zu löschen
//		if (xmlURL != null) {
//			String oldpath = transformURL2ServerPath(xmlURL);
//			File oldfile = new File(oldpath);
//			if (oldfile != null && oldfile.exists()) {
//				oldfile.delete();
//			}
//		}
		
		return transformServerPath2URL(path);
	}

	public static String transformServerPath2URL(final String serverPath) {
		String path = new File(serverPath).getAbsolutePath();
		String root = new File(path_root).getAbsolutePath(); 
		String without_root = StringUtils.remove(path, root);
		String url = url_root + without_root.replace(File.separatorChar, '/');
		return url;
	}
	
	public static String transformURL2ServerPath(final String url) {
		String without_root = StringUtils.remove(url, url_root);
		String path = path_root + without_root.replace('/', File.separatorChar);
		return path;
	}
	
	/**
	 * Liefert eine Liste mit den Namen der Konzepte die über eine Objektproperty an das angegebene Konzept gebunden sind
	 * 
	 * @param concept
	 * @return
	 */
	public List<String> getObjectPropertiesRanges(String concept) {
		List<String> result = new ArrayList<String>();
		OWLNamedClass cls = getModel().getOWLNamedClass(concept);
		for (RDFProperty prop : getAssociateProperties(cls)) {
			if (prop.getRange() instanceof OWLNamedClass)
				result.add(prop.getRange().getBrowserText());
		}
		return result;
	}
	
	/**
	 * Liefert eine Collection mit den Namen der DatentypProperties die an das angegebene Konzept gebunden sind
	 * 
	 * @param concept
	 * @return
	 */
	public Collection<String> getDatatypeProperties(String concept) {
		List<String> result = new ArrayList<String>();
		OWLNamedClass cls = this.getModel().getOWLNamedClass(concept);
		for (RDFProperty prop : getAssociateProperties(cls)) {
			if (prop.hasDatatypeRange())
				
				result.add(prop.getBrowserText() + " (" + prop.getRangeDatatype().getBrowserText() + ")");
		}
		return result;
	}
	
	@SuppressWarnings("unchecked")
	protected Collection<RDFProperty> getAssociateProperties(OWLNamedClass cls) {
		Collection<RDFProperty> properties = cls.getUnionDomainProperties(false);
		for (Iterator<OWLRestriction> i = cls.getRestrictions().iterator(); i.hasNext();)
			properties.add(getModel().getRDFProperty(i.next().getOnProperty().getName()));
		return properties;
	}
	
	/**
	 * Formatiert die polymorphe Darstellung polymorpher Datenobjekte
	 * 
	 * @param source
	 * @param target
	 * @return
	 */
	public static String formatEquivalentClass(String source, String target) {
		if (target == null)
			return source;
		return source + " = " + normalize(target);
	}
	
	/**
	 * Normalisiert die durch die Brücke entstandenen Resourcenamen
	 * 
	 * @param name
	 * @return
	 */
	private static String normalize(String name) {

		if (name.contains(":")) {
			name = name.substring(name.indexOf(":") + 1, name.length());
		}

		return name;
	}
	
	/**
	 * Aufbau des Repräsentationsbaumes (ausgehend von einem Konzept)
	 * 
	 * @param parentElement
	 * @param parent
	 * @param withProperties - Ausgabe von Properties der gegebenen Klasse
	 */
	private void buildTreeModell(Element parentElement, OWLNamedClass parent, boolean withProperties) {
		
		// alle Subklassen
		for (OWLNamedClass owlClass : removeClassesWithNamesspaces(parent.getNamedSubclasses(), STANDARD_NAMESPACES)) {
			
			// als deprecated gelabelte Klassen werden nicht angezeigt
			if (owlClass.isDeprecated())
				continue;
			
			// nur Klassen des DefaultNS
			if (!owlClass.getNamespace().equals(this.getModel().getNamespaceManager().getDefaultNamespace()))
				continue;
			
			// neues Konzept der Represenation hinzufügen
			Element concept = parentElement.addElement("concept").addAttribute("cls", owlClass.getBrowserText());
			concept.addAttribute("name", owlClass.getBrowserText());
			concept.addAttribute("ns", owlClass.getOWLModel().getNamespaceManager().getDefaultNamespace());
			SemanticDescription desc = new SemanticDescription(owlClass);
			concept.addAttribute("description", (desc.getUserComment() != null) ? desc.getUserComment().getComment() : "keine Beschreibung vorhanden");
			
			// Äquivalenzklassen bilden sonst eine Loop
			for (Object o : owlClass.getEquivalentClasses()) {
				if (o instanceof OWLNamedClass) {
					OWLNamedClass equiClass = (OWLNamedClass) o;
					concept.attribute("name").setValue(formatEquivalentClass(concept.attributeValue("name"), equiClass.getBrowserText()));
					concept.attribute("ns").setValue(concept.attributeValue("ns") + "," + equiClass.getNamespace());
					concept.addAttribute("polymorph", "true");
				}
			}
				
			// hat keine weiteren Unterklassen und keine Properties
			if (owlClass.getNamedSubclasses().size() == 0 && getAssociateProperties(owlClass).size() == 0) {
				concept.addAttribute("leaf", "true");
			}

			// hat weitere Unterklassen -> rekursiver Aufruf
			else {
				buildTreeModell(concept, owlClass, true);
			}
		}
		
		// alle Properties
		if (withProperties) {
			for (OWLProperty owlProperty : removeProperties(getAssociateProperties(parent), STANDARD_PROPERTIES)) {
				
				// als deprecated gelabelte Properties werden nicht angezeigt
				if (owlProperty.isDeprecated())
					continue;
				
				Element property = parentElement.addElement("property").addAttribute("property", normalize(owlProperty.getBrowserText()));
				property.addAttribute("ns", owlProperty.getNamespace());
				SemanticDescription desc = new SemanticDescription(owlProperty);
				property.addAttribute("description", (desc.getUserComment() != null) ? desc.getUserComment().getComment() : "keine Beschreibung vorhanden");
	
				// hat eine Objektrange -> rekursiver Aufruf
				if (owlProperty.hasObjectRange()) {
					buildTreeModell(property, owlProperty);
				}
	
				// simplen Datentyp als Range -> wird als String angehangen
				else {
					property.addAttribute("leaf", "true");
					property.attribute("property").setValue(property.attribute("property").getValue() /* + " (" + owlProperty.getRangeDatatype().getBrowserText() + ")" */);
				}
			}
		}
	}

	/**
	 * Aufbau des Repräsentationsbaumes (ausgehend von einer Property)
	 * 
	 * @param parentElement
	 * @param parent
	 */
	@SuppressWarnings("unchecked")
	private void buildTreeModell(Element parentElement, OWLProperty parent) {

		for (OWLNamedClass owlClass : (Collection<OWLNamedClass>) parent.getUnionRangeClasses()) {
					
			// als deprecated gelabelte Klassen werden nicht angezeigt
			if (owlClass.isDeprecated())
				continue;
			
			// nur Klassen des DefaultNS
			if (!owlClass.getNamespace().equals(this.getModel().getNamespaceManager().getDefaultNamespace()))
				continue;
			
			Element concept = parentElement.addElement("concept").addAttribute("cls", owlClass.getBrowserText()).addAttribute("type", "hierarchical");
			concept.addAttribute("name", owlClass.getBrowserText());
			concept.addAttribute("ns", owlClass.getOWLModel().getNamespaceManager().getDefaultNamespace());
			SemanticDescription desc = new SemanticDescription(owlClass);
			concept.addAttribute("description", (desc.getUserComment() != null) ? desc.getUserComment().getComment() : "keine Beschreibung vorhanden");
			
			// Äquivalenzklassen bilden sonst eine Loop
			for (Object o : owlClass.getEquivalentClasses()) {
				if (o instanceof OWLNamedClass) {
					OWLNamedClass equiClass = (OWLNamedClass) o;
					concept.attribute("name").setValue(formatEquivalentClass(concept.attributeValue("name"), equiClass.getBrowserText()));
					concept.attribute("ns").setValue(concept.attributeValue("ns") + "," + equiClass.getNamespace());
					concept.addAttribute("polymorph", "true");
				}
			}
			
			black_concept_list.add(owlClass.getBrowserText());

			OWLNamedClass owlConcept = (OWLNamedClass) owlClass;
			if (owlConcept.getNamedSubclasses().size() == 0 && removeProperties(getAssociateProperties(owlConcept), STANDARD_PROPERTIES).size() == 0) {
				concept.addAttribute("leaf", "true");
			}

			else {
				buildTreeModell(concept, owlConcept, true);
			}
		}
	}
	
	/**
	 * Gibt die Regeln der Semantischen Brücke als Map mit Namen als Key
	 * 
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public List<SemanticBridgeRule> getSWRLRules() {
		List<SemanticBridgeRule> result = new ArrayList<SemanticBridgeRule>();
		SWRLFactory swrlFactory = new SWRLFactory(getModel());
		Collection rules = swrlFactory.getImps();
		for (Iterator i = rules.iterator(); i.hasNext(); ) {
			SWRLImp rule = (SWRLImp) i.next();
			
			result.add(new SemanticBridgeRule(rule.getName(), rule.getBrowserText(), rule.getComments()));
		}
		return result;
	}
	
	/**
	 * Fügt eine neue Regel hinzu
	 * 
	 * @param name - Name der neuen Regel
	 * @param comment - Kommentar vom Businessexperten zur neuen Regel
	 */
	public void addSWRLRules(String name, String comment) {
		SWRLFactory swrlFactory = new SWRLFactory(getModel());
//		SWRLImp newRule = swrlFactory.createImpWithGivenName(name);
		SWRLImp newRule = swrlFactory.createImp(swrlFactory.createAtomList(), swrlFactory.createAtomList());
		newRule.setName(name);
		newRule.addComment(comment);
	}
	
	/**
	 * Setzt die Regeln der Semantischen Brücke, wie bei Protege
	 * @return
	 */
	public boolean setSWRLRules(String rule, String comment) {
		SWRLFactory swrlFactory = new SWRLFactory(getModel());
		try {
			SWRLImp swrlRule = swrlFactory.createImp(rule);
			swrlRule.addComment(comment);
			return true;
		} catch (SWRLParseException e) {
			return false;
		}
	}
	
	public RDFIndividual createIndividual(OWLNamedClass cls, boolean recursive) {
		//TODO add existing individuals to map
		return createIndividual(cls, new HashMap<OWLNamedClass, OWLIndividual>());
	}
	
	private OWLIndividual createIndividual(OWLNamedClass cls, Map<OWLNamedClass, OWLIndividual> individuals) {
		System.out.println("Creating: " + cls.getBrowserText() + "_" + (individuals.size() + 1));
		OWLIndividual individual = cls.createOWLIndividual(cls.getBrowserText() + "_" + (individuals.size() + 1));
		individuals.put(cls, individual);
		
		for (OWLProperty owlProperty : removeProperties(getAssociateProperties(cls), STANDARD_PROPERTIES)) {

			// hat eine Objektrange -> rekursiver Aufruf
			if (owlProperty.getRangeDatatype() == null) {
				if (!individuals.containsKey(owlProperty.getRange())) {
					OWLIndividual subIndividual = createIndividual((OWLNamedClass) owlProperty.getRange(), individuals);
					
					individual.setPropertyValue(owlProperty, subIndividual);
				}
				else {
					individual.setPropertyValue(owlProperty, individuals.get(owlProperty.getRange()));
				}
					
			}
			
			else {
				individual.setPropertyValue(owlProperty, owlProperty.getBrowserText().substring(3));
			}
		}
		
		return individual;
	}
	
	protected Collection<OWLProperty> removeProperties(Collection<RDFProperty> properties, String[] removes) {
		Collection<OWLProperty> result = new ArrayList<OWLProperty>();
		boolean skip = false;
		for (Object o : properties) {

			// wir brauchen nur OWL Klassen
			if (!OWLProperty.class.isAssignableFrom(o.getClass())) {
				continue;
			}

			OWLProperty prop = (OWLProperty) o;

			// durchsuche alle NS
			for (String remove : removes) {
				if (remove.equals(prop.getBrowserText())) {
					skip = true;
					break;
				}
			}
			if (!skip) {
				result.add(prop);
			} else
				skip = false;

		}
		return result;
	}

	@SuppressWarnings("unchecked")
	private Collection<OWLNamedClass> removeClassesWithNamesspaces(Collection classes, String[] namespaces) {
		Collection<OWLNamedClass> result = new ArrayList<OWLNamedClass>();
		boolean skip = false;
		for (Object o : classes) {

			// wir brauchen nur OWL Klassen
			if (!OWLNamedClass.class.isAssignableFrom(o.getClass())) {
				continue;
			}

			OWLNamedClass cl = (OWLNamedClass) o;

			// durchsuche alle NS
			for (String namespace : namespaces) {
				if (namespace.equals(cl.getNamespacePrefix())) {
					skip = true;
					break;
				}
			}
			if (!skip) {
				result.add(cl);
			} else
				skip = false;

		}
		return result;
	}
	
	public String createPolymorphModel(BridgeMapping mapping) throws Exception {

		// falls keine Individuals vorhanden sind, sind wir schon fertig (alles bleibt beim altem)
		if (mapping.getIndividuals().size() == 0)
			return createXMLFile();
		
		// wir benötigen die Prefixe der Namensräumen, die bekommen wir aus dem Modell, was wir aus einen der Individuals holen können
		OWLIndividual first = mapping.getIndividuals().iterator().next();
		String targetNamespace = mapping.getTargetToIndividual(first).getNamespace();
		String targetPrefix = first.getOWLModel().getNamespaceManager().getPrefix(targetNamespace);
		getModel().getNamespaceManager().setPrefix(targetNamespace, targetPrefix);

		ImportHelper helper = new ImportHelper((JenaOWLModel) getModel());
		helper.addImport(new URI(targetNamespace.substring(0, targetNamespace.length() - 1)));
		helper.importOntologies();

		// polymorphe Konzepte umbenennen
		for (OWLNamedClass cls : mapping.getSources()) {
			
			// nur vollständige Mappings
			if (mapping.getTargetToSource(cls) != null) {
				getModel().getOWLNamedClass(cls.getBrowserText()).addEquivalentClass(getModel().getOWLNamedClass(mapping.getTargetToSource(cls).getBrowserText()));
			}
		}

		// gehe einzeln die Individuals durch
		for (OWLIndividual individual : mapping.getIndividuals()) {
			
			// kein Mapping vorhanden -> nächsten
			if (mapping.getTargetToIndividual(individual) == null) {
				continue;
			}
			
			// gehe einzeln ihre Properties durch
			for (Object property : individual.getPossibleRDFProperties()) {
				RDFProperty prop = (RDFProperty) property;
				
				// Property gehört nicht zum Target Namensraum -> muss nicht hinzugefügt werden
				if (!targetNamespace.equals(prop.getNamespace()))
					continue;
				
				// Nur die Properties die auch in den Individuals mit Werten gesetzt wurden (OpenWorldAsumption)
				if (individual.getPropertyValue(prop) == null) {
					continue;
				}
					
				// Konzept neue Property hinzufügen
				else {
					OWLProperty p = getModel().getOWLProperty(prop.getName());
					if (prop.hasObjectRange()) {
						
						// die gebridgte hinzufügen
						RDFResource range = mapping.getSourceToTarget(prop.getRange());
						if (range != null) {
							((OWLObjectProperty) p).addUnionRangeClass(getModel().getOWLNamedClass(range.getBrowserText()));
						}

					}
					p.addUnionDomainClass(getModel().getOWLNamedClass(mapping.getSourceToIndividual(individual).getBrowserText()));
					log.info("New Property: " + p.getBrowserText() + " Domain: " + p.getUnionDomain() + " Range: " + p.getUnionRangeClasses());
				}
			}
		}
					
		// zum Kontrollieren können wir auch mal das owl Modell rausschreiben
//        File tempFile2 = File.createTempFile(name + "2" + namespacePrefix, "_tmp.owl");
//		File tempFile2 = new File("test.owl");
//        JenaOWLModel.save(tempFile2, getModel().getOntModel(), FileUtils.langXML, getModel().getDefaultOWLOntology().getNamespace());

		this.xml = createXMLRepresenatation();
		return createXMLFile();
	}
	
	
	public String getXmlserverpath() {
		return xmlURL;
	}

	public void setXmlserverpath(String xmlserverpath) {
		this.xmlURL = xmlserverpath;
	}

	/**
	 * Fügt dem Element einen standardisierten Kommentar hinzu
	 * 
	 * @param comment
	 * @param name
	 */
	public void addComment(String name, String comment) {
		RDFResource resource = this.getModel().getRDFResource(name);
		if (resource != null)
			resource.addComment(comment);
	}
	
	public static void main(String[] args) throws Exception {
		final String name = "ResidentInfo";
		final String url = "http://localhost:8080/ontologies/" + name + ".owl";
		
		Ontology ont = new Ontology("123", url, name);

		// Pretty Print
		OutputFormat format = OutputFormat.createPrettyPrint();
	    XMLWriter writer = new XMLWriter( System.out, format );
	    writer.write( ont.getXml() );
	    writer.close();

	}

	public String getModelID() {
		return modelID;
	}

	public void setModelID(String modelID) {
		this.modelID = modelID;
	}
}
