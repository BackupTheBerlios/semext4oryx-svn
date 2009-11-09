package org.oryxeditor.semantics;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.collections.OrderedMap;
import org.apache.log4j.Logger;

import edu.stanford.smi.protegex.owl.model.RDFResource;

/**
 * Semantischer Kommentar, welche vom Prozessmodellierer für den Ontologiemodellierer hinterlegt wird
 * 
 * @author Johannes Böttcher
 *
 */
public class SemanticDescription {

	/**
	 * Kommentartypen, Kommentare können durch unterschiedliche Benutzeraktionen hinzugefügt werden
	 * 
	 * @author Johannes Böttcher
	 */
	public enum commentType {
		
		/** Kommentar beim Editieren von Resourcen */
		EDIT,
		
		/** Kommentar beim Löschen von Resourcen */
		DELETE,
		
		/** Kommentar beim Hinzufügen von Resourcen */
		ADD,
		
		/** Kommentar ohne Typ -> meist Benutzerkommentar */
		UNTYPED
	}
	
	private final static Logger log = Logger.getLogger(org.oryxeditor.semantics.SemanticDescription.class);
	
	/** Pattern um die Kommentare zu parsen */
	private final static Pattern PREFIX = Pattern.compile("x{5}\\s(" + commentType.ADD + "|" + commentType.EDIT + "|" + commentType.DELETE + ")\\s:\\s\\w{2},\\s\\w{3}\\s\\d{2},\\s\\d{4}\\sx{5}");
	
	private RDFResource resource;
	private List<Comment> typedComments;
	
	/**
	 * Standardkonstruktor
	 * 
	 * @param resource
	 */
	public SemanticDescription(RDFResource resource) {
		this.resource = resource;
		this.typedComments = new ArrayList<Comment>();
		try {
			parseComments();
		}
		catch (IOException e) {
			log.error("Fehler, kann die Beschreibung der Resource '" + resource.getBrowserText() + "' nicht parsen: " + e.getMessage());
		}
	}
	
	/**
	 * Parst die Kommentare und sammelt sie in einer Liste
	 * 
	 * @throws Exception
	 */
	@SuppressWarnings("unchecked")
	private void parseComments() throws IOException {
		for (Iterator i = this.resource.getComments().iterator(); i.hasNext();) {
			Object o = i.next();
			if (o instanceof String) {
				
				// kein Kommentar enthalten
				if (((String) o).length() == 0)
					continue;
				
				this.typedComments.add(new Comment(getTypeFromComment((String) o), (String) o));
			}
			
			else {
				System.out.println("Konnte '" + o.toString() + "' nicht parsen.");
			}
		}
	}
	
	/**
	 * Liefert den Kommentartyp eines Kommentareintrages
	 * 
	 * @param comment
	 * @return
	 * @throws Exception
	 */
	private commentType getTypeFromComment(String comment) throws IOException {
		
		// kein Kommentar ist ein ungetypter Kommentar
		if (comment.length() == 0)
			return commentType.UNTYPED;
		
		BufferedReader reader = new BufferedReader(new StringReader(comment));
		String firstLine = reader.readLine();
		Matcher m = PREFIX.matcher(firstLine);
		if (m.find()) {
			String type = m.group(1);
			if (commentType.ADD.toString().equals(type)) return commentType.ADD;
			if (commentType.EDIT.toString().equals(type)) return commentType.EDIT;
			if (commentType.DELETE.toString().equals(type)) return commentType.DELETE;
		}
		
		return commentType.UNTYPED;
	}
	
	/**
	 * Ersetzt den Benutzerkommentar (Beschreibung) einer Resource
	 * 
	 * @param userComment
	 */
	public void setUserComment(String userComment) {
		String comment = userComment + "\n";
		
		// alte Kommentare löschen
		Comment oldComment = getUserComment();
		if (oldComment != null) {
			this.typedComments.remove(oldComment);
			this.resource.removeComment(oldComment.getComment());
		}
		
		// neuen Kommentar hinzufügen
		this.typedComments.add(new Comment(commentType.UNTYPED, comment));
		this.resource.addComment(comment);
	}
	
	/**
	 * Fügt einen einfachen getypten Kommentar zu einer Aktion hinzu
	 * 
	 * @param type - Kommentartyp {@link commentType}
	 * @param userComment - Kommentar zur Aktion
	 */
	public void addSimpleComment(commentType type, String userComment) {
		SimpleDateFormat formatter = new SimpleDateFormat("EEE, MMM d, yyyy", new Locale("de","DE"));
		StringBuffer comment = new StringBuffer("xxxxx " + type + " : " + formatter.format(new Date()) + " xxxxx\n");
		comment.append("Kommentar: " + userComment + "\n");
		comment.append("xxxxx " + type + " xxxxx\n");
		this.typedComments.add(new Comment(type, comment.toString()));
		this.resource.addComment(comment.toString());
	}
	
	/**
	 * Fügt einen komplexen getypten Kommentar zu einer Aktion hinzu, dabei wird noch die Key-Value Paare einer Map hinterlegt
	 * 
	 * @param type - Kommentartyp {@link commentType}
	 * @param params - Map aus der die Key-Value Paar im Kommentar hinterlegt werden
	 * @param userComment - Kommentar zur Aktion
	 */
	@SuppressWarnings("unchecked")
	public void addComplexComment(commentType type, OrderedMap params, String userComment) {
		SimpleDateFormat formatter = new SimpleDateFormat("EEE, MMM d, yyyy", new Locale("de","DE"));
		StringBuffer comment = new StringBuffer("xxxxx " + type + " : " + formatter.format(new Date()) + " xxxxx\n");
		for (Iterator i = params.keySet().iterator(); i.hasNext(); ) {
			String key = (String) i.next();
			comment.append(key + " : " + params.get(key) + "\n");
		}
		comment.append("Kommentar: " + userComment + "\n");
		comment.append("xxxxx " + type + " xxxxx\n");
		this.typedComments.add(new Comment(type, comment.toString()));
		this.resource.addComment(comment.toString());
	}
	
	/**
	 * Stringrepräsentation aller Kommentare
	 */
	public String toString() {
		try {
			StringBuffer result = new StringBuffer();
			for (Comment c : this.typedComments) {
				result.append(c.getComment());
			}
			return result.toString();
		}
		
		catch (Exception e) {
			return super.toString();
		}
	}
	
	/**
	 * liefert den ungetypten Kommentar und damit die Beschreibung der Resource zurück
	 * 
	 * @return Benutzerkommentar der Resource
	 */
	public Comment getUserComment() {
		for (Comment c : this.typedComments) {
			if (c.getType().equals(commentType.UNTYPED)) {
				return c;
			}
		}
		
		return null;
	}
	
	/**
	 * Kommentar einer Resource
	 * 
	 * @author boettcher
	 */
	public class Comment {
		
		private commentType type;
		private String comment;
		
		/**
		 * Standardkonstruktor
		 * 
		 * @param type - Kommentartyp {@link commentType}
		 * @param comment - Kommentar zur Resource
		 */
		public Comment(commentType type, String comment) {
			this.type = type;
			this.comment = comment.trim();
		}
		
		/**
		 * liefert den Kommentartyp des Kommentars zurück
		 * 
		 * @return Kommentartyp {@link commentType}
		 */
		public commentType getType() {
			return this.type;
		}

		/**
		 * Liefert den Kommentar zurück
		 * 
		 * @return String - Kommentar
		 */
		public String getComment() {
			return this.comment;
		}

	}
}
