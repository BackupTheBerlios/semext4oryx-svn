package org.oryxeditor.semantics.semanticbridge;

import java.util.Collection;

public class SemanticBridgeRule {

	private String name;
	private String rules;
	private Collection<String> comments;
	
	public SemanticBridgeRule(String name, String rules, Collection<String> comment) {
		this.name = name;
		this.rules = rules;
		this.comments = comment;
	}
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getRules() {
		return rules;
	}
	public void setRules(String rules) {
		this.rules = rules;
	}
	public Collection<String> getComments() {
		return comments;
	}
	public void addComment(Collection<String> comment) {
		this.comments.addAll(comment);
	}
}
