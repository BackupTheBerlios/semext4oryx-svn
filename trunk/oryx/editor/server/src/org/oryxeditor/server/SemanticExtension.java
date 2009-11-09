package org.oryxeditor.server;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collection;
import java.util.HashSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.oryxeditor.semantics.Finalizer;
import org.oryxeditor.semantics.Ontology;

import org.oryxeditor.semantics.handler.SemanticPoolHandler;
import org.oryxeditor.semantics.handler.SemanticBridgeHandler;
import org.oryxeditor.semantics.handler.SemanticDataobjectHandler;

public class SemanticExtension extends HttpServlet {

	/* KEYS DER NACHRICHTEN */
	public final static String ID = "id";
	public final static String REFID = "refid";
	public final static String MESSAGES = "messages";
	public final static String COMMAND = "command";
	public final static String ONTOLOGY = "ontology";
	public final static String TYPE = "type";
	public final static String NAME = "name";
	public final static String DESCRIPTION = "description";
	public final static String VERSION = "version";
	public final static String URL = "url";
	public final static String XML = "xml";
	public final static String ERROR = "error";
	public final static String SUPER = "super";
	public final static String DOMAIN = "domain";
	public final static String RANGE = "range";
	public final static String LITERAL = "literal";
	public final static String OBJECT = "object";
	public final static String RULES = "rules";
	public final static String COMMENT = "comment";
	public final static String TARGET_ONTOLOGY = "targetOntology";
	public final static String SOURCE_ONTOLOGY = "sourceOntology";
	public final static String SEMANTIC_BRIDGE = "semanticBridge";
	public final static String SHAPE_ID = "shapeid";
	
	/** ModelID zur Identifizierung der Modelle */
	public final static String MODEL_ID = "modelId";
	public final static String NEW_MODEL_ID = "newModelId";
	public final static String OLD_MODEL_ID = "oldModelId";

	/* IDs */
	public final static String SUBMISSION = "submission";
	public final static String MESSAGE = "message";

	/* ÜBERTRAGUNGSTYPEN */
	public final static String S_REQUEST = "request";
	public final static String S_RESPONSE = "response";

	/* NACHRICHTENTYPEN */
	public final static String C_IMPORT = "import";
	public final static String C_CREATE = "create";
	public final static String C_ADD = "add";
	public final static String C_EDIT = "edit";
	public final static String C_REMOVE = "remove";
	public final static String C_NEW_VERSION = "newVersion";
	public final static String C_GET_RULES = "getrules";
	public final static String C_GET_CONCEPTS = "getconcepts";
	public final static String C_SEMANTIC_BRIDGE = "semanticBridge";
	public final static String C_CHANGE_REPRESENTATION = "changeRepresentation";
	public final static String C_CHANGE_CONCEPTNAME = "changeConceptname";
	public final static String C_SUGGEST_SEMANTIC_BRIDGE = "suggest";
	public final static String C_HIGHLIGHT = "highlight";
	public final static String C_RELOAD = "reload";
	public final static String C_UPDATE_MODELID = "updateModelID";

	/* ELEMENTTYPEN */
	public final static String T_SEMANTIC_BRIDGE = "semantic bridge";
	public final static String T_ONTOLOGY = "ontology";
	public final static String T_CONCEPT = "concept";
	public final static String T_PROPERTY = "property";
	public final static String T_RULE = "rule";
	public final static String T_MODEL = "model";

	private static final long serialVersionUID = -8374877061121257562L;

	private SemanticPoolHandler semanticPoolHandler;
	private SemanticBridgeHandler semanticBridgeHandler;
	private SemanticDataobjectHandler semanticDataobjectHandler;
	
	private Collection<Finalizer> finalizerCollection = new HashSet<Finalizer>();
	
//	private Ontology getOntology() throws Exception {
//		if (ontology == null)
//			throw new Exception("Der Anfrage wurde keine Ontologie übergeben.");
//
//		return ontology;
//	}
	
	public SemanticExtension() {
		semanticPoolHandler = new SemanticPoolHandler();
		semanticBridgeHandler = new SemanticBridgeHandler();
		semanticDataobjectHandler = new SemanticDataobjectHandler();
	}
	
	/*
	 * FIXME Pfade eventuell ersetzen durch
	 * - ServletContext.getRealPath(String name) / ServletContext.getResource(String path)
	 * zum loggen:
	 * - Servlet.log(String msg)
	 */

	protected JSONObject dispatch(JSONObject request) throws Exception {

		// Antwort
		JSONObject response = new JSONObject();
		response.put(ID, SUBMISSION);
		response.put(TYPE, S_RESPONSE);
		JSONArray resMessages = new JSONArray();

		// Anfrage
		String id = request.getString(ID);
		String modelID = request.getString(MODEL_ID);
//		String type = request.getString(TYPE);

		Ontology ontology = null;
		
		if (request.has(ONTOLOGY)) {
			String url = request.getString(ONTOLOGY);

			// Ontologie laden ...
			if (url != null && url.length() > 0) {
				try {
					final Ontology newOntology = getOntologyFromFile(modelID, url);
					finalizerCollection.add(new Finalizer() {
						public void finalize() {
							newOntology.getModel().dispose();
						}
					});
					ontology = newOntology;
					
					// ModelID im Client aktualisieren
					JSONObject msg = new JSONObject();
					msg.put(SemanticExtension.ID, SemanticExtension.S_RESPONSE + ":::" + SemanticExtension.C_UPDATE_MODELID + ":::" + ontology.getModelID());
					msg.put(SemanticExtension.REFID, id);
					msg.put(SemanticExtension.COMMAND, SemanticExtension.C_UPDATE_MODELID);
					msg.put(SemanticExtension.TYPE, SemanticExtension.T_MODEL);
					msg.put(SemanticExtension.NEW_MODEL_ID, ontology.getModelID());
					resMessages.put(msg);
				}
				
				catch (MalformedURLException e) {
					e.printStackTrace();
					JSONObject error = new JSONObject();
					error.put(ID, S_RESPONSE + ":::" + ERROR);
					error.put(REFID, id);
					error.put(ERROR, "Die angegebene URL '" + url + "' ist nicht gültig.");
					resMessages.put(error);

					response.put(MESSAGES, resMessages);
					return response;
				}
				
				catch (FileNotFoundException e) {
					e.printStackTrace();
					JSONObject error = new JSONObject();
					error.put(ID, S_RESPONSE + ":::" + ERROR);
					error.put(REFID, id);
					error.put(ERROR, "Die angegebene URL '" + url + "' ist nicht erreichbar.");
					resMessages.put(error);

					response.put(MESSAGES, resMessages);
					return response;
				}
			}

			else {
				JSONObject error = new JSONObject();
				// error.put(ID, S_RESPONSE + ":::" + ERROR + ":::" + C_IMPORT +
				// ":::"
				// + T_ONTOLOGY + ":::" + url);
				// error.put(REFID, id);
				// error.put(ERROR, "Die angegebene url '" + url
				// + "' ist ungültig und kann nicht importiert werden.");
				// TODO Fehlermeldung schreiben
				resMessages.put(error);
				response.put(MESSAGES, resMessages);
				return response;
			}
			
			// falls vorhanden, setze das alte XML File
			if (request.has(XML)) {
				ontology.setXmlserverpath(request.getString(XML));
			}
		}

		// keine Ontologie angegeben -> COMMAND muss gleich CREATE sein -> sonst
		// Fehler

		// einzelne Nachrichten abarbeiten
		JSONArray messages = request.getJSONArray(MESSAGES);
		for (int i = 0; i < messages.length(); i++) {
			JSONObject message = messages.getJSONObject(i);
			String command = message.getString(COMMAND);
			String ctype = message.getString(TYPE);

			try {

				// importieren ...
				if (C_IMPORT.equals(command)) {

					// ... Ontologie
					if (T_ONTOLOGY.equals(ctype)) {
						resMessages.put(semanticPoolHandler.importOntology(message, ontology.getUrl(), ontology));
					}

					// ... semantische Brücke
					else if (T_SEMANTIC_BRIDGE.equals(ctype)) {
						resMessages.put(semanticPoolHandler.importSemanticBridge(message, ontology.getUrl(), ontology));
					}
				}

				// erstellen ...
				else if (C_CREATE.equals(command)) {

					// ... Ontologie
					if (T_ONTOLOGY.equals(ctype)) {
						resMessages.put(semanticPoolHandler.createOntology(message));
					}

					// ... Semantische Brücke
					else if (T_SEMANTIC_BRIDGE.equals(ctype)) {
						resMessages.put(semanticPoolHandler.createSemanticBridge(message));
					}

					// ... Fehler
					else {

					}
				}

				// hinzufügen ...
				else if (C_ADD.equals(command)) {

					// ... Konzept
					if (T_CONCEPT.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.addConcept(message, ontology));
					}

					// ... Property
					else if (T_PROPERTY.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.addProperty(message, ontology));
					}

					// ... Rule
					else if (T_RULE.equals(ctype)) {
						resMessages.put(semanticBridgeHandler.addRuleRequirement(message, ontology));
					}
					
					// ... Fehler
					else {

					}
				}

				// bearbeiten ...
				else if (C_EDIT.equals(command)) {

					// ... Ontologie
					if (T_ONTOLOGY.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.editConcept(message, ontology));
					}
					
					// ... Semantische Brücke
					if (T_SEMANTIC_BRIDGE.equals(ctype)) {
						resMessages.put(semanticBridgeHandler.editSemanticBridge(message, ontology));
					}
					
					// ... Konzept
					if (T_CONCEPT.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.editConcept(message, ontology));
					}

					// ... Property
					else if (T_PROPERTY.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.editProperty(message, ontology));
					}

					// ... Fehler
					else {

					}
				}

				// löschen ...
				else if (C_REMOVE.equals(command)) {

					// ... Konzept
					if (T_CONCEPT.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.removeConcept(message, ontology));
					}

					// ... Property
					else if (T_PROPERTY.equals(ctype)) {
						resMessages.put(semanticDataobjectHandler.removeProperty(message, ontology));
					}

					// ... Fehler
					else {

					}
				}

				// neue Version erstellen
				else if (C_NEW_VERSION.equals(command)) {
					
					//FIXME soll noch required werden, dazu Formularfeld Beschreibung in die Semantische Brücke einfügen
					if (message.has(DESCRIPTION)) {
						String description = message.getString(DESCRIPTION);
						ontology.setDescription(description);
					}

					if (message.has(NAME) && message.has(VERSION)) {
						String name = message.getString(NAME);
						String version = message.getString(VERSION);

						resMessages.put(semanticPoolHandler.makeVersion(ctype, name, version, ontology));
					} else {
						resMessages.put(semanticPoolHandler.makeVersion(ctype, ontology));
					}
				}

				// Rules abfragen
				else if (C_GET_RULES.equals(command)) {
					resMessages.put(semanticBridgeHandler.getRules(message, ontology));
				}

				// Unterkonzepte abfragen
				else if (C_GET_CONCEPTS.equals(command)) {
					resMessages.put(semanticDataobjectHandler.getConcepts(message));
				}

				// Semantische Brücke
				else if (C_SEMANTIC_BRIDGE.equals(command)) {
					semanticBridgeHandler.addSemanticBridge(modelID, message);
				}

				// Vorschläge für mögliche Semantische Brücken
				else if (C_SUGGEST_SEMANTIC_BRIDGE.equals(command)) {
					resMessages.put(semanticBridgeHandler.suggestSemanticBridge(message));
				}
				
				// lädt die ursprünge Ontology neu
				else if (C_RELOAD.equals(command)) {
					resMessages.put(ontology == null ? semanticDataobjectHandler.reloadOntology(message, modelID) : semanticDataobjectHandler.reloadOntology(message, ontology));
				}
				
				// Fehler
				else {
					JSONObject error = new JSONObject();
					error.put(ID, S_RESPONSE + ":::" + ERROR + ":::" + command);
					error.put(REFID, id);
					error.put(ERROR,"Der Befehl '" + command + "' ist unbekannt und kann nicht verarbeitet werden.");
					resMessages.put(error);
				}
			}

			// Bei der Behandlung der Messages ist ein Fehler aufgetreten,
			// dieser wird in eine ErrorMsg verpackt und zurück geschickt
			catch (Exception e) {
				e.printStackTrace();
				JSONObject error = new JSONObject();
				error.put(ID, S_RESPONSE + ":::" + ERROR + ":::" + command);
				error.put(REFID, id);
				error.put(ERROR, e.getMessage().length() > 0 ? e.getMessage() : e.toString());
				resMessages.put(error);
			}
		}

		/* 
		 * Semantische Brücken müssen en-bloc abgearbeitet werden, deshalb hier nochmal der
		 * Aufruf
		 */
		semanticBridgeHandler.generateResponses(resMessages);
		
		response.put(MESSAGES, resMessages);
		return response;
	}

	protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
		String submission = req.getParameter("submission");
		res.setContentType("text/json");
		Ontology.path_root = "../webapps/ontologies/";

		// FIXME res.setStatus(int sc) aufrufen
		
		try {
			JSONObject request = new JSONObject(submission);
			JSONObject response = dispatch(request);
			res.getWriter().print(response);
		}

		catch (Exception e) {
			res.getWriter().print(e.toString());
		}
		
		finally {

	        // make sure the memory is deallocated
			try {
		        System.gc();
		        System.runFinalization();
		        System.gc();
			}
			
			catch (Exception e) {
				// nothing to do here
			}
		}
	}

	public static Ontology getOntologyFromFile(final String modelID, String owlURL) throws Exception {

		URL url = new URL(owlURL);
		String file = url.getFile();
		String filename = file.substring(url.getFile().lastIndexOf("/") + 1, url.getFile().lastIndexOf("."));
		
		Pattern filenamePattern = Pattern.compile("([^_]*)(\\_\\d*\\.\\d*(.\\d*)?)?");
		Matcher m = filenamePattern.matcher(filename);
		if (m.find()) {
			filename = m.group(1);
		}

		return new Ontology(modelID, owlURL, filename);
	}
	
	// private JSONObject createXMLRepresenation(String name, String owlURL)
	// throws Exception {
	//
	// URL url = new URL(owlURL);
	// String file = url.getFile();
	// String filename = file.substring(0, url.getFile().indexOf("."));
	//
	// OWLModel owlModel = ProtegeOWL.createJenaOWLModelFromURI(owlURL);
	//
	// Document document = DocumentHelper.createDocument();
	// Element root = document.addElement("ontology");
	//
	// /*
	// * !Hack! - eigentlich sollte mal diese Infos auch über das OWL-Modell
	// * bekommen owlModel.getOWLVersionInfoProperty();
	// * owlModel.getRDFSCommentProperty();
	// */
	// SAXReader reader = new SAXReader();
	// Document owlDocument = reader.read(owlURL);
	// String version = ((Element) owlDocument
	// .selectSingleNode("//owl:Ontology/owl:versionInfo")).getText();
	// String description = ((Element) owlDocument
	// .selectSingleNode("//owl:Ontology/rdfs:comment")).getText();
	//
	// root.addAttribute("version", version);
	// root.addAttribute("description", description);
	//
	// buildTreeModell(root, owlModel.getOWLThingClass());
	// for (Object child : root.selectNodes("concept")) {
	// Element e = (Element) child;
	// if (black_concept_list.contains(e.attribute("cls").getValue())) {
	// e.addAttribute("type", "flat");
	// }
	// }
	//
	// // lets write to a file
	// File outputFile = new File(filename + ".xml");
	// OutputFormat format = OutputFormat.createPrettyPrint();
	// XMLWriter writer = new XMLWriter(new FileWriter(outputPath
	// + outputFile.getName()), format);
	// writer.write(document);
	// writer.close();
	//
	// JSONObject result = new JSONObject();
	// result.put("name", name);
	// result.put("url", owlURL);
	// result.put("xml", "http://localhost:8080/ontologies/"
	// + outputFile.getName());
	// result.put("description", description);
	// result.put("version", version);
	//
	// return result;
	// // return "http://localhost:8080/ontologies/" + outputFile.getName() +
	// // ":::" + description + ":::" + version;
	// }
}
