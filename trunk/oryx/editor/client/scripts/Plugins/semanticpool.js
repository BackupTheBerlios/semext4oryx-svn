/*
 * Diese Erweiterung implementiert einen semantischen Pool, in dem
 * Objekte der semantischen Datenflussmodellierung verwaltet werden
 * können.
 * 
 * Sie ist Teil der Diplomarbeit "Semantische Datenflussmodellierung
 * in der Geschäftsprozessmodellierung".
 */
if (!ORYX) ORYX = new Object();
if (!ORYX.Plugins) ORYX.Plugins = new Object();

ORYX.Plugins.SemanticPool = Clazz.extend({
	facade: undefined,
	ontologyStore: undefined,
	bridgeStore: undefined,
	contextmenu: undefined,
	changes: undefined,
	filter: undefined,
	filterState: undefined,
	modelID: undefined,
	
	// scheinbar ein Bug im unregisterOnEvent(), deshalb eigenes Flag u
	ignoreShapeAddedEvent: false,
	
	// Konstruktor (Startpunkt)
	construct: function (facade) {
		this.facade = facade;
		
    	// Datenmodell für den Semantischen Pool
		this.ontologyStore = new Ext.data.SimpleStore({
    		fields: ['name','type','url','xml','description','version']
    	});
// this.ontologyStore.filter('type', new RegExp('[^Ontology]','i'));
		
		this.bridgeStore = new Ext.data.SimpleStore({
    		fields: ['name','type','url','xml','description','version']
    	});
    	
    	// Array mit allen Änderungen
    	this.changes = new Array();
    	
		this.filter = new Ext.tree.TreeFilter();
		this.filterState = false;
    	
		// Kontextmenu erstellen
		this.contextMenu = new Ext.menu.Menu({
			id: 'messageContextMenu',
			items: [
		        new Ext.menu.TextItem({text: 'Actions'}),
		        new Ext.menu.Separator({}),
		        {
		        	id: 		'SemExtMenuItem',
		        	text: 		'annotate with Concept',
		        	iconCls: 	'semExtension',
		        	handler: 	function() {
						this.contextMenu.hide();
						this.showSemanticDataObject();
					}.bind(this)
		        },
		        {
		        	id: 		'SetupSemBridgeMenuItem',
		        	text: 		'setup a semantic bridge',
		        	iconCls: 	'add',
		        	handler: 	function() {
						this.contextMenu.hide();
						
						// durch den Aufruf ist bereis sichergestellt das wirklich genau 2 Shapes ausgewählt sind
						var selection = this.facade.getSelection();
						this.setupSemanticBridge(selection[0], selection[1]);
					}.bind(this)
		        },
		        {
		        	id: 		'EditSemBridgeMenuItem',
		        	text: 		'edit semantic bridge',
		        	iconCls: 	'edit',
		        	handler: 	function() {
						this.contextMenu.hide();
						this.editSemanticBridge();
					}.bind(this)
		        },
		        {
		        	id: 		'RemoveSemBridgeMenuItem',
		        	text: 		'remove semantic bridge',
		        	iconCls: 	'delete',
		        	handler: 	function() {
						this.contextMenu.hide();
						this.removeSemanticBridge(this.facade.getSelection(), true);
					}.bind(this)
		        },
		        {
		        	id:			'SemBridgeSuggestion',
		        	text:		'suggest semantic Bridge',
		        	iconCls:	'semExtension',
		        	handler: 	function() {
		        		this.contextMenu.hide();
		        		this.suggestSemanticBridge();
		        	}.bind(this)
		        }
		    ]
		});

    	// Mauslistener hinzufügen für das Kontextmenü
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN, this.handleMouseDown.bind(this));
		
		// Event - Modell geladen
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED, this.onLoad.bind(this));
		
		// KeyListener
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN, this.keyListenerActionPerformed.bind(this));
		
		// DockerListener (falls um- und angedockt wird)
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED, this.dockerChangePerformed.bind(this));
		
		// ShapeAddedListener
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_SHAPEADDED, this.shapeAddedToCanvas.bind(this));

		// ModelSaveListener
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MODEL_BEFORE_SAVE, this.saveListenerPerformed.bind(this));

		// Icon in der Toolbar registrieren
        this.facade.offer({
            'name': "Semantic Pool",
            'functionality': this.showSemanticPool.bind(this),
            'group': "SemanticExtension",
            'icon': ORYX.PATH + "images/box.png",
            'description': "In the semantic pool import, export, create and organize your ontologies and semantis Bridges.",
            'index': 1,
            'minShape': 0,
            'maxShape': 0
        });
	},
	
	/**
	 * wird aufgerufen bevor das Modell gespeichert wird
	 */
	saveListenerPerformed: function(event) {
		
		// bevor mit saveAs ein neues Modell angelegt wird, kopieren wir die Repräsentationen
		if (event && event.forceNew) {
			
			this.ontologyStore.each(
				function(record) {
					var message = {
						"id"		: "reload:::ontology:::" + record.get('url'),
						"command"	: "reload",
						"type"		: "ontology",
						"url"		: record.get('url'),
						"xml"		: record.get('xml')
					};
					this.addMessageToServer(message);
				}.bind(this)
			);
			
			// falls Serveranfragen existieren, werden sie nun an den Server geschickt
			if (this.changes.length > 0) {
				this.startProgressBar('Please wait ...', '... copy semantic pool  ...');
				var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
				this.handleStandardServerResponse(response);
			    this.stopProgressBar(true);
			}

		}
	},
		
	/**
	 * wird sofort nach den Laden des Modells ausgeführt, alle initialen
	 * Aktionen hier aufrufen
	 */
	onLoad: function() {
		
		// lade den Semantischen Pool
		this.restorePool();
		
		// ModelID laden
		this.modelID = this.facade.getCanvas().properties['oryx-id'];
		
		// führe die angelegten Semantischen Brücken aus
		this.facade.getCanvas().getChildren().each(
			function(shape) {
				if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
	        		this.addSemanticBridgeServerCall(shape);
				}
			}.bind(this)
		);
		
		// falls Serveranfragen existieren, werden sie nun an den Server geschickt
		if (this.changes.length > 0) {
			this.startProgressBar('Please wait ...', '... loading semantic pool  ...');
			var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
			this.handleSemanticBridgeResponse(response, false);
		    this.stopProgressBar(true);
		}
	},
	
	/**
	 * Listener der auf ShapeAdded Events lauscht
	 * @param event - ausgelöstes ShapeAddedEvent
	 */
	shapeAddedToCanvas: function(event) {
		
		// so schnell wie möglich returnen
		if (event.shape.getStencil().id() != "http://b3mn.org/stencilset/bpmn1.1#semanticBridge")
			return;

		var shape = event.shape;
		var parent = event.option.parent;
		
		if (this.ignoreShapeAddedEvent) {
			console.log("Shape-added Event ignored...");
			return;
		}
		
		// Neues Konzept hinzufügen
//		if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#DataObject" && parent.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
//			
//			// Add-Dialog aufbauen
//			var newCForm = this.getRootConceptForm();
//			var content = this.getFormTabPanel();
//			content.add(newCForm);
//			content.setActiveTab(newCForm);
//			Ext.getCmp('rootConceptNameField').reset();
//			var window = this.getPropertyWindow("Add Concept/Property", content);
//			window.addButton(this.getAddElementButton());
//			window.addButton(this.getCancelElementButton());
//			window.show();
//			
//		}
		
		if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
			
			var Data = Ext.data.Record.create([{name: 'name'}]);

			var comboStore = new Ext.data.SimpleStore({fields: ['name']});
			
			this.bridgeStore.each(
				function(bridge) {
					comboStore.add(new Data({name: bridge.get('name') + " (Version: " + bridge.get('version') + ")"}));
				}.bind(this)
			);
        	// Abfragedialog
	        var window = new Ext.Window({
	            id: 'setup-semanticbridge',
	            width: 590,
	            title: 'Select Semantic Bridge',
	            labelWidth: 100,
	            modal: true,
	            resizable: true,
	            items: [{
	            	xtype: 'form',
	        		id: 'setupBridgeForm',
	            	labelWidth: 100,
	    	        frame: false,
	    	        bodyStyle:'padding:5px 5px 0',
	    	        width: 580,
	    	        defaults: {width: 420},
	    	        items: [{
	                	xtype: 'combo',
	                	id: 'semanticbridgechoice',
	            		name: 'semantic bridge',
	                	fieldLabel: 'Semantic Bridge',
	                	mode: 'local',
	                	store: comboStore,
	                	displayField: 'name',
	                	typeAhead: true,
	                	forceSelection: true,
	                	emptyText: 'Select a semantic bridge ...',
	                	selectOnFocus: true
	                }]
	    	    }],
	    	    buttons: [{
	    	    	text: 'set',
	    	    	handler: function() {

	    	    		// Benutzerauswahl
						var selectedIndex = Ext.getCmp('semanticbridgechoice').selectedIndex;
						var data = this.bridgeStore.getAt(selectedIndex);
						
	    	    		// Eigenschaften setzen
	    	    		shape.setProperty('oryx-url', data.get('url'));
	    	    		shape.setProperty('oryx-name', data.get('name'));
	    	    		shape.setProperty('oryx-version', data.get('version'));
			        		
			        	this.facade.getCanvas().update();

		        		window.hide();
	    	    	}.bind(this)
	    	    }, {
	    	    	text: 'cancel',
	    	    	handler: function() {
	    	    		window.hide();
	    	    	}
	    	    }],
	            height: 100
	        });
	        window.on('hide', function(){
	        	window.destroy(true);
				delete window;
			});
			
	        // Show the window
	        window.show();
		}
	},
	
	/**
	 * Listener auf Docker Events
	 * @param event - ausgelöstes DockerEvent
	 */
	dockerChangePerformed: function(event) {
		var shape = event.parent;
		console.log(event);
		
		// nur semantische Brücken sind für uns interessant
		if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
			console.log("A docker of a Semantic Bridge changed");
			var bridgeShape = shape;
			var dockedShape = event.target;
			var askForExecution = false;
			
			// ist jetzt eine vollständige Semantische Brücke
			if (bridgeShape.incoming.length == 1 && bridgeShape.outgoing.length == 1 && shape.properties['oryx-url']) {
				console.log("Complete Semantic Bridge");
				var sourceShape = bridgeShape.incoming[0];
				var targetShape = bridgeShape.outgoing[0];
				
				// beide Datenobjekte müssen semantisch sein -> sonst nicht erlauben
				if (!sourceShape.properties['oryx-concept'] || !targetShape.properties['oryx-concept']) {
					Ext.MessageBox.alert('Action not permitted!', "<p>Semantic Bridges are only allow between semantic Dataobjects. Your Semantic Bridge was removed.</p>");
					this.facade.setSelection(new Array(this.facade.getCanvas()));
					this.facade.deleteShape(shape);
					return;
				}
				
				// Brücke zwischen zwei Semantischen Datenobjekten
				if (sourceShape.properties['oryx-concept'].length > 0 && targetShape.properties['oryx-concept'].length > 0) {
					console.log("Semantic Bridge between two Semantic Data Objects");
				}
				
				// war es bereits vorher eine vollständige Brücke
				if (bridgeShape.properties['oryx-source'].length > 0 && bridgeShape.properties['oryx-target'].length > 0) {
					console.log("The bridge was already complete.");
				}
				
				// Semantische Brücke hat sich geändert
				if (sourceShape.properties['oryx-concept'] != bridgeShape.properties['oryx-source'] || targetShape.properties['oryx-concept'] != bridgeShape.properties['oryx-target']) {
					askForExecution = true;
				}
			}

			// setze die Quelle der Semantischen Brücke
			if (bridgeShape.incoming.length == 1) {
				bridgeShape.setProperty('oryx-source', bridgeShape.incoming[0].properties['oryx-concept']);
			}
			
			// setze das Ziel der Semantischen Brücke
			if (bridgeShape.outgoing.length == 1) {
				bridgeShape.setProperty('oryx-target', bridgeShape.outgoing[0].properties['oryx-concept']);
			}
			
			// semantische Brücke hat sich geändert -> soll sie nun ausgeführt werden
			if (askForExecution) {
				 Ext.MessageBox.confirm(
					'Execute Semantic Bridge?',
					'You established a semantic bridge between two semantic dataobjects. Would you like to execute this bridge now?',
					function(btn) {
						if (btn == 'yes') {
							this.startProgressBar('Please wait ...', '... executing Semantic Bridge  ...');
			        		this.addSemanticBridgeServerCall(bridgeShape);
			        		var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
			        		this.handleSemanticBridgeResponse(response, true);
			        	    this.stopProgressBar(true);
						}
					}.bind(this)
				);
			}
		}
	},
	
	/**
	 * liefert zu einem Shape alle verbundenen Semantischen Brücken
	 */
	getConnectedSemanticBridgesToShape: function(shape) {
		var connectedBridges = new Array();
		
		for (var i = 0; i < shape.incoming.length; i++) {
			if (shape.incoming[i].getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
				connectedBridges = connectedBridges.concat(new Array(shape.incoming[i]));
			}
		}
		
		for (var i = 0; i < shape.outgoing.length; i++) {
			if (shape.outgoing[i].getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
				connectedBridges = connectedBridges.concat(new Array(shape.outgoing[i]));
			}
		}
			
		return connectedBridges;
	},
	
	/**
	 * überprüft ob es von der angegebenen Semantische Brücke eine aktive Modellierung gibt
	 * @param url - URL der semantischen Brücke 
	 */
	countActiveSemanticBridgeExists: function(url) {
		var activeSemanticBridges = 0;

		// im SemanticBridge Pool suchen
		var row = this.bridgeStore.find('url', url);
		if (row == -1) {
			return activeSemanticBridges;
		}
		
		var bridge = this.bridgeStore.getAt(row);
		
		this.facade.getCanvas().getChildren().each(
			function(shape) {
				if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
					if (shape.properties['oryx-url'] == url) {
						activeSemanticBridges++;
					}
				}
			}.bind(this)
		);
		
		return activeSemanticBridges;
	},
	
	/**
	 * Entfernt die Semantische Brücke und stellt den Namen des Datenobjektes wieder her
	 */
	removeSemanticBridge: function(bridges, deleteShape) {
		
    	for (var i = 0; i < bridges.length; i++) {
    		
    		//TOD evt. ausgeführte Semantische Brücken speichern
    		if (bridges[i].getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge" && bridges[i].incoming.length == 1 && bridges[i].outgoing.length == 1) {
    			var source = bridges[i].properties['oryx-source'];
    			var parts = source.split("#");
				var dataobject = bridges[i].incoming[0];
				var concept = dataobject.properties['oryx-concept'];
				
				// Sicherheitsüberprüfung (Konzept des Datenobjekts ist gleich das Quellkonzept der Semantischen Brücke)
				if (concept && concept == source) {
					
					// Konzept nicht mehr polymorph
					var otherSemanticBridges = this.countActiveSemanticBridgeExists(bridges[i].properties['oryx-url']);
					if (otherSemanticBridges == 1) {
						this.resetOntology(parts[0]);
					}
					
					// Datenobjekt umbennenen
    				dataobject.setProperty('oryx-name', parts[1]);
    	
    				this.facade.raiseEvent({
    					type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
    					element	: dataobject,
    					name	: 'oryx-name',
    					value	: parts[1]
    				});

    				// Datenobjekt zuklappen
    				this.collapseSemanticDataObject(dataobject);
    				this.facade.getCanvas().update();
    				
    				if (deleteShape) {
						this.facade.deleteShape(bridges[i]);
						this.facade.setSelection(new Array(this.facade.getCanvas()));
    				}
    				
				}

				// Fehler
				else {
					Ext.MessageBox.alert('Es ist ein Fehler aufgetreteten!', "<p>Quellkonzept der Semantische Brücke stimmt nicht mit der Annotation des Datenobjekts überein.</p>");
				}
    		}
    	}
	},
	
	/**
	 * KeyListener
	 * @param event - ausgelöstes KeyEvent
	 */
	keyListenerActionPerformed: function(event) {
		
        if (!event) 
            event = window.event;
        
        var pressedKey = event.which || event.keyCode;
        
        if (pressedKey == ORYX.CONFIG.KEY_CODE_DELETE) {
        	this.removeSemanticBridge(this.facade.getSelection(), false);
        }
	},
	
	/**
	 * Stellt den Pool aus einen persistenten Model wieder her
	 */
	restorePool: function() {
		var jsonString = this.facade.getCanvas().properties['oryx-semanticpool'];
		
		if (jsonString == '') {
			return;
		}

		var persistence = eval('(' + jsonString + ')');
		
		var Data = Ext.data.Record.create([{name: 'name'}, {name: 'type'}, {name: 'url'}, {name: 'xml'}, {name: 'description'}, {name: 'version'}]);
		for (var i = 0; i < persistence.totalCount; i++) {
			var input = new Data({name: persistence.items[i].name, type: persistence.items[i].type, url: persistence.items[i].url, xml: persistence.items[i].xml, description: persistence.items[i].description, version: persistence.items[i].version});
			
			if (persistence.items[i].type == 'Ontology') {
				this.ontologyStore.add(input);				
			}
			else if (persistence.items[i].type == 'Semantic Bridge') {
				this.bridgeStore.add(input);
			}
			else {
				Ext.MessageBox.alert('Es ist ein Fehler aufgetreteten!', "<p>TODO Fehlermeldung.</p>");
			}
		}
	},
	
	/**
	 * Kontextmenü wird aufgerufen
	 */ 
	handleMouseDown: function(event)  {
		console.log(event);
		
		// Highlighting, falls vorhanden, deaktivieren
		this.facade.raiseEvent({
			type	: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
			id		: "suggestSemanticBridge"
		});
		
		// welches Shape wurde ausgewählt
		var selection = this.facade.getSelection();
		console.log("Selected Shapes Count: " + selection.length);
		for (var i = 0; i < selection.length; i++) {
			console.log((i + 1) + ". Selected Shape: " + selection[i].getStencil().id());
			console.log("Concept of " + (i + 1) + ". selected Shape: " + selection[i].properties['oryx-concept']);
		}

		if (event.which == 1) {
			console.log("MouseEvent: left Button pressed");
			
			// aus-/zusammenklappbares Element
			if (event.rangeParent.attributes.getNamedItem('oryx:type')) {
				var action = event.rangeParent.attributes.getNamedItem('oryx:type').value;

				// ausklappen
				if (action == 'toExpand') {

					// ShapeAdd-Events nicht behandeln
					this.ignoreShapeAddedEvent = true;
	
					this.expandSemanticDataObject(selection);
					
					/* workaround, wegen fehlenden Event
					 * Da die GUI sich asynchron aufbaut und es kein Event gibt, welche uns benachrichtigt wenn alles aufgebaut ist,
					 * warten wir einfach 1sek, bis wir den ShapeAdded-Listener wieder frei schalten.
					 */
					setTimeout(function() {
						this.ignoreShapeAddedEvent = false;
					}.bind(this), 1000);
				}
				
				// zusammenklappen
				else if (action == 'toCollapse') {

					// ShapeAdd-Events nicht behandeln
					this.ignoreShapeAddedEvent = true;

					this.collapseSemanticDataObject(selection[0]);
					
					/* workaround, wegen fehlenden Event
					 * Da die GUI sich asynchron aufbaut und es kein Event gibt, welche uns benachrichtigt wenn alles aufgebaut ist,
					 * warten wir einfach 1sek, bis wir den ShapeAdded-Listener wieder frei schalten.
					 */
					setTimeout(function() {
						this.ignoreShapeAddedEvent = false;
					}.bind(this), 1000);
				}
			}
		}
		else if (event.which == 2) {
			console.log("MouseEvent: middle Button pressed");
		}
		else if (event.which == 3) {
			console.log("MouseEvent: right Button pressed");
		}
		
		// Kontextmenü reseten
		Ext.getCmp('SemExtMenuItem').setVisible(false);
		Ext.getCmp('SemBridgeSuggestion').setVisible(false);
		Ext.getCmp('EditSemBridgeMenuItem').setVisible(false);
		Ext.getCmp('RemoveSemBridgeMenuItem').setVisible(false);
		Ext.getCmp('SetupSemBridgeMenuItem').setVisible(false);
		this.contextMenu.hide();
		
		// Maus Rechte Taste & mind. 1 Shape ausgewählt -> Kontextmenü
		if (event.which == 3 && selection.length > 0) {
		
			// genau ein Shape ausgewählt
			if (selection.length == 1) {
				
				// Shape ist ein Datenobjekt
				if (selection[0].getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#DataObject" || selection[0].getStencil().id() == 'http://b3mn.org/stencilset/bpmn1.1#ExpDataObject' || selection[0].getStencil().id() === "http://b3mn.org/stencilset/epc#Data") {
					Ext.getCmp('SemExtMenuItem').setVisible(true);
					Ext.getCmp('SemBridgeSuggestion').setVisible(selection[0].properties['oryx-concept'] != "");
				}

				// Shape ist eine SemBrücke
				else if (selection[0].getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#semanticBridge") {
					Ext.getCmp('EditSemBridgeMenuItem').setVisible(true);
					Ext.getCmp('RemoveSemBridgeMenuItem').setVisible(true);
				}
				
				// weder noch -> kein Kontextmenü
				else {
					return;
				}
			}
			
			// zwei Shapes ausgewählt & Shapes sind Datenobjekte
			else if (selection.length == 2 && (selection[0].getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#DataObject" || selection[0].getStencil().id() === "http://b3mn.org/stencilset/epc#Data") && (selection[1].getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#DataObject" || selection[1].getStencil().id() === "http://b3mn.org/stencilset/epc#Data")) {
				Ext.getCmp('SetupSemBridgeMenuItem').setVisible(true);
			}
			
			// werder noch -> kein Kontextmenü
			else {
				return;
			}
			
			// anzeigen des Menüs
			var pos = this.facade.eventCoordinates(event);
			console.log(pos);
			this.contextMenu.showAt([pos.x + 185, pos.y + 65]);
		}

		// hide Menu
		else {

			// Kontextmenu ausblenden
			this.contextMenu.hide();
		}
	},

	/**
	 * Semantisches Datenobjekt ausrollen Dazu werden für alle Objekte des
	 * Concepts ein eigenes Datenobjekt erzeugt
	 */
	expandSemanticDataObject: function(selection) {
		
		var name = selection[0].properties['oryx-name'];
		var concept = selection[0].properties['oryx-concept'];
		if (!concept) {
			console.log("Only semantic DataObject are able to be expanded.");
			return;
		}
		var parent = selection[0].getParentShape();
		
		this.startProgressBar("Expanding Data Object", "Expanding Data Object ... Please Wait ...");
		
		// Berechnung der Größen
		var x = selection[0].bounds.a.x + 51; // plus Hälfte der Breite der Form
		var y = selection[0].bounds.a.y + 41; // plus Hälfte der Höhe der Form
				
		// Unterkonzepte gleich hinzufügen
        var concept	= selection[0].properties['oryx-concept'];
        if (concept) {
	        var parts = concept.split("#");
	        var row = this.ontologyStore.find('url', parts[0]);
	        var record = this.ontologyStore.getAt(row);
	        var xml = record.get('xml');
	        var cname = parts[1];
	        
			// Message an den Server zusammenbauen
			var message = {
				"id"			: "getconcepts:::" + parts[0] + ":::concept:::" + name,
				"command"		: "getconcepts",
				"type"			: "concept",
				"name"			: name,
				"xml"			: xml
			};
			
			this.addMessageToServer(message);
			var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL, parts[0]);
			var messages = response.messages;
			
			// neue hinzufügen
			var newShape = this.facade.createShape({
				type: 'http://b3mn.org/stencilset/bpmn1.1#ExpDataObject',
				position: {x: x, y: y},
				namespace: 'http://b3mn.org/stencilset/bpmn1.1#',
				parent: parent
			});
			newShape.setProperty('oryx-name', name);
			newShape.setProperty('oryx-annotation', true);
			newShape.setProperty('oryx-concept', concept);
			
			// Connectoren auf das neue Shape umbiegen
			var incoming = selection[0].incoming;
			for (var i = 0; i < incoming.length; i++) {
				incoming[i].dockers.last().setDockedShape(newShape);
			}
			var outgoing = selection[0].outgoing;
			for (var i = 0; i < outgoing.length; i++) {
				outgoing[i].dockers.first().setDockedShape(newShape);
			}
			
			// um wieviel Pixel muss der Parent vergrößert werden
			var parentExpandX = 50;
			
			for (var i = 0; i < messages.length; i++) {
			
				// Objektproperties -> Konzepte
				if (messages[i].range) {
					var childCount = messages[i].range.length;
					
					for (var j = 0; j < childCount; j++) {
					
						var range = messages[i].range[j];
						
						// neue hinzufügen
						var option = {
							type: 'http://b3mn.org/stencilset/bpmn1.1#DataObject',
							// Einrückung um 50/70 & 70 Abstand für jedes Kind
							position: {x: 50, y: (70 + (j * 70))},
							namespace: 'http://b3mn.org/stencilset/bpmn1.1#',
							parent: newShape
						}
						var newChild = this.facade.createShape(option);
						newChild.setProperty('oryx-name', range.name);
						
						// Objectproperty
						if (range.type && range.type == 'object') {
							newChild.setProperty('oryx-annotation', true);
							newChild.setProperty('oryx-concept', parts[0] + "#" + range.name);
						}
						
						// Datatypeproperty
						else if (range.type && range.type == 'literal') {
							newChild.setProperty('oryx-annotation', false);
//							newChild.setProperty('oryx-bgColor', '#CCFFFF');
						}
						
						// Größe an Namenslänge anpassen
						var expandX = range.name.length * 8;
						newChild.bounds.extend({x: expandX, y: 0});
						
						// finde die größte Vergrößerung
						parentExpandX = (expandX > parentExpandX) ? expandX : parentExpandX;
						
					}
				}
			}
			
			// bei verschachtelten ExpDataObject
			if (parent.getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
				
				// weitere Geschwister nach unten verschieben
				var siblings = parent.getChildren();
				for (var i = 0; i < siblings.length; i++) {
					
					// X-Vergrößerung schon durch Geschwister erledigt
					if (siblings[i] instanceof ORYX.Core.Shape && siblings[i] != newShape && siblings[i].getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
						parentExpandX = 0;
					}
					
					// alle Geschwister, die weiter unten (auf der y-Achse)
					// liegen
					if (siblings[i] != newShape && siblings[i].bounds.a.y > selection[0].bounds.a.y) {
						// Vergrößerung des Fenster + Unterschied zwischen
						// beiden Shapes
						// 70 => Standardgröße Child (mit Abstand)
						// 21 => Differenz von Col & Exp
						// 10 => Hälfte von Differenz von Col & Exp (da newShape
						// um diesen Wert verschoben wird)
						siblings[i].bounds.moveBy({x: 0, y: childCount * 70 + 21 + 10});
					}
				}
				
				// Parent vergrößern
				// 70 => Standardgröße Child (mit Abstand)
				// 21 => Differenz von Col & Exp
				// 10 => Hälfte von Differenz von Col & Exp (da newShape um
				// diesen Wert verschoben wird)
				parent.bounds.extend({x: parentExpandX, y: childCount * 70 + 21 + 10});

				// Shape einrücken
				// 20 => Standardeinrückung
				// 30 => Hälfte der Höhe Shape
				// 10 => Hälfte der Differenz von beiden Höhen)
				newShape.bounds.moveBy({x: 20, y: 30 + 10});
			}
			
			// Breite des expanded Shapes abhängig von der Breite der Kinder
			var expand = (parentExpandX + 80 - newShape.bounds.width() > 0) ? parentExpandX + 80 - newShape.bounds.width() : 0;
			newShape.bounds.extend({x: expand, y: (childCount - 1) * 70});
			
			// alten Knoten löschen
			this.facade.deleteShape(selection[0]);

			this.facade.getCanvas().update();
			
			this.facade.setSelection(new Array(newShape));
			
			this.stopProgressBar(stop);
        }	
	},
	
	/**
	 * testet ob das Datenobjekt zuklappbar ist
	 * 1) Datenobjekte mit Kinder die Connectoren besitzen sind nicht zuklappbar
	 * 
	 * @return ist das Datenobjekt zuklappbar
	 */
	checkIfCollapsable: function(dataobjekt) {
		var collapsable = true;
		
		// nur ExpDataObjects sind zuklappbar
		if (dataobjekt && dataobjekt.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
			
			// 1) Datenobjekte mit Kinder die Connectoren besitzen sind nicht zuklappbar
			var children = dataobjekt.getChildren();
			for (var i = 0; i < children.length; i++) {
				
				if (children[i] instanceof ORYX.Core.Shape) {
										
					// hat Connector
					if (children[i].incoming.length > 0 || children[i].outgoing.length > 0) {
						Ext.Msg.alert("Action is not allowed!", "<p>You can not collapse a Dataobject, that has Children with incoming or outgoing edges.</p>");
						return false;
					}
					
					// Rekusiv -> Kind ist nicht zuklappbar
					if (children[i].getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject" && !this.checkIfCollapsable(children[i])) {
						return false;
					}
				}
			}

			return true;
		}
		
		else {
			return false;
		}
	
	},
	/**
	 * Semantisches Datenobjekt einrollen alle Unterobjekte müssen wieder sauber
	 * entfernt werden
	 */
	collapseSemanticDataObject: function(selection) {

		// ist das Shape zuklappbar
		if (!this.checkIfCollapsable(selection)) {
			console.log("not collapsable");
			return;
		}

		var parent = selection.getParentShape();
		
		// neue hinzufügen
		var newShape = this.facade.createShape({
			type: 'http://b3mn.org/stencilset/bpmn1.1#DataObject',
			position: {x: (selection.bounds.a.x + 50), y: (selection.bounds.a.y + 40)},
			namespace: 'http://b3mn.org/stencilset/bpmn1.1#',
			parent: selection.getParentShape()
		});
		var name = selection.properties['oryx-name'];
		newShape.setProperty('oryx-name', name);
		newShape.setProperty('oryx-annotation', true);
		newShape.setProperty('oryx-concept', selection.properties['oryx-concept']);
		
		// Connectoren auf das neue Shape umbiegen
		var incoming = selection.incoming;
		for (var i = 0; i < incoming.length; i++) {
			incoming[i].dockers.last().setDockedShape(newShape);
			incoming[i].dockers.last().setReferencePoint(newShape.getDefaultMagnet().bounds.center());
		}

		var outgoing = selection.outgoing;
		for (var i = 0; i < outgoing.length; i++) {
			outgoing[i].dockers.first().setDockedShape(newShape);
			outgoing[i].dockers.first().setReferencePoint(newShape.getDefaultMagnet().bounds.center());
		}
		
		// bei verschachtelten ExpDataObject
		if (parent.getStencil().id() === "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
			
			// FIXME Evt. mit Iterator oder sowas
			var childCount = 0;
			for (var i = 0; i < selection.getChildren().length; i++) {
				if (selection.getChildren()[i] instanceof ORYX.Core.Shape)
					childCount = childCount + 1;
			}
			
			// Parent verkleinern
			parent.bounds.extend({x: -50, y: -(childCount * 70 + 21 + 10)});
			
			// weitere Geschwister nach oben zurück verschieben
			var siblings = parent.getChildren();
			for (var i = 0; i < siblings.length; i++) {
				
				// alle anderen Geschwister die weiter unten liegen
				if (siblings[i] != newShape && siblings[i].bounds.a.y > selection.bounds.a.y) {
					// Vergrößerung des Fenster + Unterschied zwischen beiden
					// Shapes
					siblings[i].bounds.moveBy({x: 0, y: -(childCount * 70 + 21 + 10)});
				}
			}
			
			// Shape ausrücken
			newShape.bounds.moveBy({x: -20, y: -10});
		}
		
		newShape.bounds.extend({x: (name.length * 8), y: 0});
		
		// alten Knoten löschen
		this.facade.deleteShape(selection);
		
//		var magnet = option.connectedShape.getDefaultMagnet()
//		var cPoint = magnet ? magnet.bounds.center() : option.connectedShape.bounds.midPoint();
//		con.dockers.first().setReferencePoint( cPoint );
//		con.dockers.last().setDockedShape(newShapeObject);
//		con.dockers.last().setReferencePoint(newShapeObject.getDefaultMagnet().bounds.center());
		
		this.facade.getCanvas().update();
	},
	
	/**
	 * Startet einen Fortschrittsbalken
	 */
	startProgressBar: function(title, text) {
       var window = new Ext.Window({
           id: 'progressbarWindow',
           width: 350,
           layout: 'border',
           title: title,
           modal: true,
           resizable: false,
           items: [{
			   id: 'progressbar',
			   xtype: 'progress',
			   margins: '2 2 0 2',
			   region: 'center',
// width: 300
           }],
           buttons: [{
        	   id: 'closeImportButton',
        	   text: 'close',
        	   disabled: true,
        	   handler: function() {
        	   		window.hide();
           	   }
           }],
           height: 90
       });
       window.on('hide', function(){
    	   window.destroy(true);
    	   delete window;
       });
       Ext.getCmp('progressbar').wait();
       
       if (text) {
    	   Ext.getCmp('progressbar').updateText(text);
       }
       
       window.show();
	},
	
	/**
	 * Beendet den Fortschrittsbalken
	 * @param autoHide - ProgressBar verschwindet automatisch nach dem er gestoppt wurde
	 */
	stopProgressBar: function(autoHide) {
		if (Ext.getCmp('progressbar')) {
			Ext.getCmp('progressbar').reset();
			Ext.getCmp('progressbar').updateProgress(1, 'Done');
			Ext.getCmp('closeImportButton').setDisabled(false);
			
			if (autoHide) {
				Ext.getCmp('progressbarWindow').hide();
			}
		}	
	},
	
	/**
	 * behandelt alle ServerAntworten als Standardantworten, bei Abweichung -> Fehler
	 * @param response - Antwort vom Server
	 */
	handleStandardServerResponse: function(response) {
		var messages = response.messages;
		
		// Warnung auf der Console, falls gar keine Message vom Server kommt
		if (messages.length == 0) {
			console.log("WARNUNG: Es ist keine Message vom Server zurück gekommen!");
		}
		
		for (var i=0; i < messages.length; i++) {
			
			// behandelt jede Message nach Standardverfahren
			this.handleStandardServerMessage(messages[i]);
			
		}
	},
	
	/**
	 * behandelt EINE ServerMessage nach Standardverfahren
	 * @param message - eine Server Message
	 * @return boolean - wurde die Message verarbeitet oder nicht
	 */
	handleStandardServerMessage: function(message) {

		/* 
		 * Ein Fehler der vom Server als Fehler gesendet wurde
		 */
		if (message.error) {
			Ext.Msg.alert("An error occured", "<p>" + message.error + "</p>");
			return true;
		}
		
		// Message ohne 'command' -> kann ignoriert werden
		if (!message.command)
			return true;
		
		/*
		 * Erzeuge eine neue Version der Ontology / Sem. Brücke -> in den
		 * Pool einfügen
		 */
		if (message.command == 'newVersion') {
			
			var Data = Ext.data.Record.create([{name: 'name'}, {name: 'type'}, {name: 'url'}, {name: 'xml'}, {name: 'description'}, {name: 'version'}]);
			
			// neue Ontologie
			if (message.type == 'ontology') {
				var ontology = new Data({name: message.name, type: 'Ontology', url: message.url, xml: message.xml, description: message.description, version: message.version});				
				this.ontologyStore.add(ontology);
				this.persistPool();
				return true;
			}
			
			// neue Semantische Brücke
			else if (message.type == 'semantic bridge') {
				var bridge = new Data({name: message.name, type: 'Semantic Bridge', url: message.url, xml: message.xml, description: message.description, version: message.version});				
				this.bridgeStore.add(bridge);
				this.persistPool();
				return true;
			}
			
			
		}
		
		/*
		 * XML Repräsenation der Ontology anpassen, durch die SemBrücke sind
		 * polymorphe SemDataObjects entstanden -> im Pool aktualisieren
		 */
		else if (message.command == 'changeRepresentation') {
			
			var row = this.ontologyStore.find('url', message.url);
			this.ontologyStore.getAt(row).set('xml', message.xml);
			this.persistPool();
			return true;
		}
		
		/*
		 * mögliches TargetSemDataObject hightlighten TODO SemBrücke gleich
		 * zur Einrichtung vorschlagen
		 */
		else if (message.command == 'highlight') {
			
			var concept		= message.name;
			var ontology	= message.ontology;
			
			// Vorschlag vorhanden
			if (concept && ontology) {
				this.highlight(this.facade.getCanvas(), 'oryx-concept', (ontology + '#' + concept));
				return true;
			}
			
			// kein Vorschlag vorhanden
			else {
				return false;
			}
		}
		
		/*
		 * aktualisiert die ModelID im Client
		 */
		else if (message.command == 'updateModelID') {
			
			var newModelID		= message.newModelId;
			
			this.facade.getCanvas().setProperty('oryx-id', newModelID);
			this.modelID = newModelID;
			
			this.facade.raiseEvent({
				type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
				element	: this.facade.getCanvas(),
				name	: 'oryx-id',
				value	: newModelID
			});
			
			this.facade.getCanvas().update();
		}
		
		/*
		 * Antwort des Servers unbekannt -> nicht behandelt
		 */
		else {
			return false;
		}
	},
	
	/**
	 * Zeigt eine Fehlermeldung an, dass die Antwort des Servers nicht verarbeitet werden konnte, weil sie nicht erwartet wurde
	 * @param message - unerwartete Servermessage, die zum Fehler führt
	 */
	showUnexpectedServerResponseDialog: function(message) {
		Ext.Msg.alert("Unexpected Server Response", "<p>The given Server Response was unexpected:<br>" + message + "</p>");
	},
	
	/**
	 * Macht ein hellgrünes Overlay auf Datenobjekt-Shapes
	 * 
	 * @param parent -
	 *            alle Shape mit (propertyname->value) werden gehighlightet...
	 *            geht rekursiv (Pool oder Lane) bis Objekt gefunden
	 * @param propertyname -
	 *            Name der Property
	 * @param propertyvalue -
	 *            Wert des Property
	 * @return shape - Shape das gehighlightet wurde
	 */
	highlight: function(parent, propertyname, propertyvalue) {
		var result;
		
		parent.getChildren().each(
			function(shape) {
				
				// nur wirkliche Objekte, keine Magnets
				if (shape instanceof ORYX.Core.Shape) {
					
					// rekursiver Aufruf möglich
					if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#Pool" || shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#Lane") {
						
						// shape gefunden -> übernehmen
						result = this.highlight(shape, propertyname, propertyvalue) || result;
					}
					
					else if (shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#DataObject" || shape.getStencil().id() == "http://b3mn.org/stencilset/bpmn1.1#ExpDataObject") {
						
						// highlighten
						if (shape.properties[propertyname] && shape.properties[propertyname] == propertyvalue) {
							this.facade.raiseEvent({
								type 		: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
								id			: "suggestSemanticBridge",
								shapes		: [shape],
								attributes 	: {fill : 'lightgreen'}
							});
							
							// shape gefunden -> zuweisen
							result = shape;
						}
					}
				}
			}.bind(this)
		);
		
		return result;
	},
	
	/**
	 * Fügt den Server-Messages eine neue hinzu
	 */
	addMessageToServer: function(message) {
		if (this.changes.length == 0) {
			this.changes = new Array(message);
		}
		else {
			this.changes = this.changes.concat(new Array(message));
		}
	},
	
	/**
	 * Leert die Server-Messages
	 */
	resetMessageToServer: function() {
		this.changes = new Array();
	},	
	
	/**
	 * Sendet die gesammelten Server-Messages zum Server
	 */
	sendMessagesToServer: function(server, url) {
		var result;
		var xml = "";
        var row = this.ontologyStore.find('url', url);
        var record = this.ontologyStore.getAt(row);
        if (record) {
        	xml = record.get('xml');
        }

        if (this.modelID != this.facade.getCanvas().properties['oryx-id']) {
        	var newModelId = this.facade.getCanvas().properties['oryx-id'];
			var message = {
				"id"			: "updateModelID:::" + this.modelID + ":::" + newModelId,
				"command"		: "updateModelID",
				"type"			: "model",
				"newModelId"	: newModelId,
				"oldModelId"	: this.modelID
			};
        	this.addMessageToServer();
        }
        
        console.log("ModelID: " + this.modelID);
        
		var submission = {
			"id"		: "submission",
			"type"		: "request",
			"modelId"	: (this.modelID || ""),
			"ontology"	: url,
			"xml"		: xml,
			"messages"	: this.changes
		};
		
		console.log("Message send to Server '" + server + "':");
		console.log(submission);
		
		// Abschicken
		new Ajax.Request(server, {
	          method: 'POST',
	          asynchronous: false,
	          parameters: {
	    	  	submission: Object.toJSON(submission)
	          },
	          onSuccess: function(request){
	        	  result = request.responseText.evalJSON();
	          }.bind(this),
	          onFailure: function(transport){
	              
	              Ext.Msg.alert("Oryx", "<p>Fehler</p>");
	              return false;
	          },
	          on403: function(transport){
	              
	              Ext.Msg.alert("Oryx", ORYX.I18N.AMLSupport.noRights);
	              ORYX.Log.warn("Import AML failed: " + transport.responseText);
	              return false;
	          }
		});
		
		this.resetMessageToServer();
		return result;
	},

	/**
	 * Panel mit Tabs
	 */
	getFormTabPanel: function(height) {
		if (Ext.getCmp('formTabPanel'))
			return Ext.getCmp('formTabPanel');
		
		var formTabPanel = new Ext.TabPanel({
			id: 'formTabPanel',
			activeTab: 0,
			viewConfig: {
		        forceFit: true
		    },
	        region: 'north',
	        height: (height || 120)
		});
		return formTabPanel;
	},
	
	/**
	 * TextArea Description
	 */
	getDescriptionArea: function(id, title, readonly) {
		var id = (id || 'description');
		if (Ext.getCmp(id))
			return Ext.getCmp(id);
		
		var description = new Ext.form.TextArea({
        	id: id,
		    title: (title || 'Description'),
		    allowBlank: true,
		    readOnly: (readonly || false), 
		    region: 'center'
		});
		return description;
	},
	
	/**
	 * Erstellt ein Fenster zum hinzufügen und editieren von Ontologien,
	 * Konzepten und Eigenschaften
	 * 
	 * @return Fensterobjekt ohne Buttons
	 */
	getPropertyWindow: function(title, content, height) {
		if (Ext.getCmp('propertyWindow'))
			return Ext.getCmp('propertyWindow');
		
       var window = new Ext.Window({
           id: 'propertyWindow',
           layout: 'border',
           width: 400,
           title: title,
           floating: true,
           shim: true,
           modal: true,
           resizable: true,
           items: [
               content, 
               {
            	    xtype: 'panel',
           			title: 'Description',
           			region: 'center',
           			layout: 'border',
           			items: [this.getDescriptionArea()]
               }
           ],
           height: (height || 300)
       });
       window.on('hide', function(){
    	   window.destroy(true);
    	   delete window;
		});
       return window;
	},

	/** 
	 * workaround:
	 * Da das show-Event nicht geworfen wird, müssen wir uns an der render-Event hängen und dann aber warten bis die
	 * GUI aufgebaut worden ist, dann auswählen
	 * 
	 * @param grid - Grid in welchem die Zeile ausgewählt werden soll
	 * @param row - Zeile die ausgewählt werden soll
	 */  
	workaroundSelectRowInGrid: function(grid, row) {
		
		// es wird einfach 1sek gewartet bis die GUI sich aufgebaut hat
		setTimeout(function() {
			grid.getSelectionModel().selectRow(row);
			grid.fireEvent('rowclick', grid, 1);	
		}, 1000);		
	},
	
	/**
	 * Liefert die Tabelle der Ontologien im Annotationsdialog
	 * @param selectRow - Zeile die vorausgewählt sein soll
	 */
	getOntologyList: function(selectRow) {
		if (Ext.getCmp('ontoGrid'))
			return Ext.getCmp('ontoGrid');
		
		var grid = new Ext.grid.GridPanel({
        	id : 'ontoGrid',
            title: 'Ontologies',
            store: this.ontologyStore,
            width: 250,
            height: 350,
            autoExpandColumn: 'nameCol',
            columns: [
                 {id: 'nameCol', header: 'Name', sortable: true, dataIndex: 'name'},
                 {id: 'versionCol', header: 'Version', sortable: false, dataIndex: 'version'}
            ],
            listeners: {
				render: function(g) {
			
					if (this.ontologyStore.getCount() > 0) {
						
						// falls keine Auswahl vorhanden, setze erste Zeile
						if (selectRow == undefined || selectRow < 0) {
							selectRow = 0;
						}
						
						// workaround zur Auswahl einer Zeile
						this.workaroundSelectRowInGrid(grid, selectRow);
					}
					
				}.bind(this)
			},
                    		
            // SelectionHandler (bei Auswahl -> setze Beschreibungspanel)
            sm: new Ext.grid.RowSelectionModel({
            	singleSelect: true,
                listeners: {
                	beforerowselect: function(selectionModel, rowIdx, keepExisting, record) {

		    			if (this.changes.length > 0) {
		    				var msg = 'You are switching an ontology that has unsaved changes. Would you like to dismiss your changes?';
// this.FireFox3Fix(true);
// Ext.MessageBox.confirm(
// 'Save Changes?',
// 'You are switching an ontology that has unsaved changes. Would you like to
// save your changes?',
// function(btn) {
// console.log("Button: " + btn);
// if (btn == 'yes') {
// Ext.Msg.alert('Alert', 'Yes Button pressed');
// }
// });
// this.FireFox3Fix(false);
							var r=confirm(msg);
							if (r==true){
								this.resetMessageToServer();
							    return true;
							} else {
							    return false;
							}
		    			}
            		}.bind(this),
            		rowselect: function(smObj, rowIndex, record) {
            			
						// Baum aktualisieren
						var tree = this.getConceptTree();
						tree.getLoader().dataUrl = record.get('xml');
						tree.getLoader().nsStore.removeAll();
						tree.getRootNode().reload();
						
						/* Workaround:
						 * Da unser Loader nicht schnell genug für die GUI ist, müssen wir nach
						 * kurzer Verzögerung die fehlerhaften Icons laden
						 */
						setTimeout(function() {
							tree.getRootNode().reload();
						}, 200);
						
						tree.getSelectionModel().clearSelections();
										
						// Beschreibung aktualisieren
						var description = this.getDescriptionArea('Ontology-Description', 'Description', true);
						description.setRawValue(record.get('description'));

                    }.bind(this)
                }
            })
        });
		return grid;
	},
	
	getConceptTree: function(url) {
		
//		var nsStore = new Ext.data.SimpleStore({fields: ['namespace']});
		
		if (Ext.getCmp('treePanel'))
			return Ext.getCmp('treePanel');
		
		// versuche eine gute Vorauswahl
		if (!url && this.ontologyStore.getCount() > 0) {
			url = this.ontologyStore.getAt(0).get('xml');
		}
		
		Ext.QuickTips.init();
		
		Ext.app.ConceptLoader = Ext.extend(Ext.ux.XmlTreeLoader, {
			
			nsStore : new Ext.data.SimpleStore({fields: ['namespace']}),
			
//			processResponse : function(response, node, callback) {
//				nsStore.removeAll();
//				return Ext.app.ConceptLoader.superclass.processResponse.call(this, response, node, callback);
//			},
			
			processAttributes : function(attr){
				
				if(attr.cls) { // is it a concept node?
					
					attr.text = attr.name;
					attr.clazz = attr.cls;
		            
					// Book icon:
		          	attr.iconCls = 'cls';
		          	attr.cls = 'ontoNode';
		        }
				
		        else if(attr.property){ // is it a property node?
		        		
		            attr.text = attr.property;
		            
		            // Property icon:
		            attr.iconCls = 'property';
		            attr.cls = 'propNode';
		        }
				
				if (attr.leaf == 'true') {
	          		attr.leaf = true;
				}

				// Namespace
				if (attr.ns) {
					var nsArray = attr.ns.split(',');
					
					// polymorph
					if (nsArray.length > 1) {
						attr.iconCls = attr.iconCls + '_bridged';
					}
					
					// genau ein Namespace
					else {
						var row = this.nsStore.find('namespace', attr.ns);
						if (row == -1) {
							var Namespace = Ext.data.Record.create([{name: 'namespace'}]);
							this.nsStore.add(new Namespace({namespace: attr.ns}));
							row = this.nsStore.length - 1;
						}
						
						attr.iconCls = attr.iconCls + "_" + (row + 1);
					}
						
				}
				else {
					attr.ns = 'default';
				}
				
				attr.leaf = 'false';
				attr.qtip = 'description: ' + attr.description;
				
				attr.loaded = true;
				attr.id = attr.text;
		    }
		});
		
		var tree = new Ext.tree.TreePanel({
    		id: 'treePanel',
    		autoScroll: true,
            margins: '2 2 0 2',
    		rootVisible: false,
    		animate:true,
    		loader: new Ext.app.ConceptLoader({dataUrl: url}),
    		lines: true,
    		root: new Ext.tree.AsyncTreeNode(),
	        width: 350,
	        height: 500,
	        rowspan: 2,
	        title: 'Concepts',
	        useArrows:true,
	        tbar: [{
	        	iconCls: 'hierarchie',
	        	enableToggle: true,
	        	handler: function() {
	        		this.filter.clear();
	        		if (this.filterState) {
	        			this.filter.filter(new RegExp('[^hierarchical]','i'),'type', this.getConceptTree().getRootNode());
	        			this.filterState = false;
	        		}
	        		else {
	        			this.filter.filter(new RegExp('[^flat]','i'),'type',this.getConceptTree().getRootNode());
	        			this.filterState = true;
	        		}
	        	}.bind(this)
	        }, {
	        	iconCls: 'add',
	        	handler: this.addElement.bind(this)
	        }, {
	        	iconCls: 'delete',
	        	handler: this.deleteElement.bind(this)
        	}, {
	        	iconCls: 'edit',
	        	handler: this.editElement.bind(this)
        	}, {
        		iconCls: 'save',
        		handler: function() {
        			this.saveNewOntologyVersion(false);
        		}.bind(this)
        	}, {
        		iconCls: 'save_as',
        		handler: function() {
        			this.saveNewOntologyVersion(true);
        		}.bind(this)
        	}]
		});
		
		return tree;
	},
	
	/**
	 * Kommentarfenster, um Aktionen des Benutzers kommentiert in die Ontologie
	 * übernehmen
	 */
	getCommentWindow: function() {
		if (Ext.getCmp('commentWindow'))
			return Ext.getCmp('commentWindow');
		
		var window = new Ext.Window({
           id: 'commentWindow',
           width: 400,
           layout: 'border',
           title: 'Comment your change',
           modal: true,
           resizable: true,
           defaults: {
        	    split: true,
        	    bodyStyle: 'padding:15px'
           },
           items: [{
        	  xtype: 'label',
        	  region: 'north',
        	  text: 'Please comment your change...',
        	  margins: '5 5 5 5'
           }, {
        	  xtype: 'textarea',
        	  region: 'center',
        	  id: 'editInformationComment',
			  title: 'Comment your change',
			  allowBlank: false
           }],
           height: 200,
           buttons: [{
        	   	id: 'apply-comment',
        	   	text: 'apply'
           }, {
        	   	id: 'cancel',
        	   	text: 'cancel',
        	   	handler: function() {
        	   		window.hide();
           		}
           }]
		});
		window.on('hide', function(){
    	   window.destroy(true);
    	   delete window;
       	});
		
		return window;
	},
	
	/**
	 * Erstellt ein Fenster zum hinzufügen und editieren von Ontologien,
	 * Konzepten und Eigenschaften
	 * @param breits ausgewähltes Konzept
	 * 
	 * @return Fensterobjekt ohne Buttons
	 */
	getAnnotationWindow: function(concept) {
		if (Ext.getCmp('annotationWindow'))
			return Ext.getCmp('annotationWindow');
		
        if (concept) {
	        var parts = concept.split("#");
	        var row = this.ontologyStore.find('url', parts[0]);
	        var record = this.ontologyStore.getAt(row);
	        var url = record.get('xml');
        }
        
		var grid = this.getOntologyList(row);
		var tree = this.getConceptTree(url);
		
		var window = new Ext.Window({
            id: 'annotationWindow',
            width: 615,
            height: 500,
            title: 'Semantic Annotation',
            layout: 'table',
            layoutConfig: {columns: 2},
            floating: true,
            shim: true,
            modal: true,
            resizable: true,
            autoHeight: true,
            resizable: false,
            items: [
                grid,
                tree,
                {
                	id: 'DescriptionPanel',
                	xtype: 'panel',
                	title: 'Description',
                	layout: 'border',
                	width: 250,
                	height: 150,
                	items: [this.getDescriptionArea('Ontology-Description', 'Description', false)]
                }
                
            ],
    		buttons: [{
    			text: 'annotate',
    			handler: this.annotateDataObject.bind(this)
    		},{
    			text: 'cancel',
    			handler: function() {
    				this.getAnnotationWindow().close();
    			}.bind(this)
    		}]
        });
		window.on('hide', function(){
			this.resetMessageToServer();
			window.destroy(true);
			delete window;
		}.bind(this));
		
		if (concept) {
			setTimeout(function() {
				var path = tree.getNodeById(parts[1]).getPath();
				tree.expandPath(path);
				tree.selectPath(path);
			}, 1500);
		}
		return window;
	},
	
	/**
	 * Formularpanel für die Properties
	 */
	getPropertyForm: function() {
		if (Ext.getCmp('propertyFormPanel'))
			return Ext.getCmp('propertyFormPanel');

		var propertyForm = new Ext.FormPanel({
	    	id: 			'propertyFormPanel',
			labelWidth: 	100,
	        frame:			false,
	        title: 			'Property',
	        bodyStyle:		'padding:5px 5px 0',
	        width: 			380,
	        defaults: 		{width: 250},
	        defaultType: 	'textfield',
	        items: [{
	        	id: 'propertyNameField',
				fieldLabel: 'Propertyname',
				name: 'propName',
				allowBlank: false,
				vtype: 'alphanum'
	        }, {
	        	xtype: 'textfield',
	            name: 'propRange',
	            id: 'propertyRangeField',
	            fieldLabel: 'Object Range',
	            anchor: '95%'
	        }, {
            	xtype: 'checkbox',
            	fieldLabel: 'Literal Range',
            	id: 'propertyRangeLiteral',
	        	boxLabel: 'use free-text',
	        	name: 'literal',
	        	inputValue: '1',
	        	handler: function() {
            		Ext.getCmp('propertyRangeField').setDisabled(this.getValue());
            	}
    		}]
	    });
		return propertyForm;
	},
	
	/**
	 * Formularpanel für die Konzepte (mit Root als Parent)
	 */
	getRootConceptForm: function(root, id) {
		var id = (id || 'rootConceptFormPanel');
		if (Ext.getCmp(id))
			return Ext.getCmp(id);
		
		var conceptForm = new Ext.FormPanel({
	    	id:				id,
			labelWidth: 	100,
	        frame:			false,
	        title: 			'New Concept',
	        bodyStyle:		'padding:5px 5px 0',
	        width: 			380,
	        defaults: 		{width: 250},
	        defaultType: 	'textfield',
	        items: [{
	    		id: 		'rootConceptNameField',
	    		fieldLabel: 'Name',
	    		name: 		'name',
	    		allowBlank: false,
	    		vtype: 		'alphanum'
	        }]
	    });
		return conceptForm;
	},

	/**
	 * Formularpanel für die Konzepte (als SubConcept)
	 */
	getSubConceptForm: function(root, id) {
		var id = (id || 'subConceptFormPanel');
		if (Ext.getCmp(id))
			return Ext.getCmp(id);
		
		var conceptForm = new Ext.FormPanel({
	    	id: 			id,
			labelWidth: 	100,
	        frame:			false,
	        title: 			'Subconcept',
	        bodyStyle:		'padding:5px 5px 0',
	        width: 			380,
	        defaults: 		{width: 250},
	        defaultType: 	'textfield',
	        items: [{
	    		id: 		'subConceptNameField',
	    		fieldLabel: 'Name',
	    		name: 		'name',
	    		allowBlank: false,
	    		vtype: 		'alphanum'
	        }, {
	    		id: 		'conceptSuperField',
	    		fieldLabel: 'Superconcept',
	    		name: 		'super',
	    		allowBlank: false,
	    		vtype: 		'alphanum',
	    		disabled:	true
	        }]
	    });
		return conceptForm;
	},
	
	/**
	 * Formularpanel für die Ontologien
	 */
	getNewOntologyForm: function(name) {
		var id = 'newOntologyFormPanel';
		if (Ext.getCmp(id))
			return Ext.getCmp(id);

		var ontologyForm = new Ext.FormPanel({
	    	id: id,
			labelWidth: 100,
	        frame:false,
	        title: (name || 'Ontology'),
	        bodyStyle:'padding:5px 5px 0',
	        width: 380,
	        defaults: {width: 250},
	        defaultType: 'textfield',
	        items: [{
	    		id: 'ontologyNameField',
	    		fieldLabel: 'Name',
	    		name: 'name',
	    		allowBlank: false,
	    		vtype: 'alphanum'
	    	}]
	    });
		return ontologyForm;
	},

	/**
	 * Formularpanel für die Ontologien
	 */
	getImportOntologyForm: function(id) {
		var id = (id || 'importOntologyFormPanel');
		if (Ext.getCmp(id))
			return Ext.getCmp(id);

		var ontologyForm = new Ext.FormPanel({
	    	id: id,
			labelWidth: 100,
	        frame:false,
	        title: 'Ontology',
	        bodyStyle:'padding:5px 5px 0',
	        width: 380,
	        defaults: {width: 250},
	        defaultType: 'textfield',
	        items: [{
	    		id: 'ontologyNameField',
	    		fieldLabel: 'Name',
	    		name: 'name',
	    		allowBlank: false,
	    		vtype: 'alphanum'
	    	}, {
	    		id: 'ontologyUrlField',
	    		fieldLabel: 'URL',
	    		name: 'name',
	    		allowBlank: false,
	    		vtype: 'url'
	    	}]
	    });
		return ontologyForm;
	},
	
	/**
	 * Button zum Hinzufügen von Elementen
	 */
	getAddElementButton: function() {
		if (Ext.getCmp('addElementButton'))
			return Ext.getCmp('addElementButton');
		
		var addElementButton = new Ext.Button({
			id:			'addElementButton',
			text: 		'add',
			handler:	function() {
					
				var parentNode 	= this.getConceptTree().getSelectionModel().getSelectedNode();	
				var descText	= this.getDescriptionArea().getValue();
			
				// neue Property
				if (this.getFormTabPanel().getActiveTab().id == 'propertyFormPanel') {
					var mode = 'ADD_PROPERTY';
					
					// Eingaben validieren
					if (!this.validatePropertyInputs(parentNode)) {
						return;
					}
					
					// Eingaben
					var name = Ext.getCmp('propertyNameField').getValue();
					var range = Ext.getCmp('propertyRangeField').getValue();
					var literal = Ext.getCmp('propertyRangeLiteral').getValue();
				}
			
			
				// neue Class
				else if (this.getFormTabPanel().getActiveTab().id == 'rootConceptFormPanel'){
					var mode = 'ADD_CLASS';
					var parentNode = this.getConceptTree().getRootNode();
					
					// Eingaben validieren
					if (!this.validateConceptInputs(mode, parentNode)) {
						return;
					}
					
					// Eingaben
					var name = Ext.getCmp('rootConceptNameField').getValue();
				}
				
				// neue SubClass
				else if (this.getFormTabPanel().getActiveTab().id == 'subConceptFormPanel'){
					var mode = 'ADD_SUBCLASS';
					
					// Eingaben validieren
					if (!this.validateConceptInputs(mode, parentNode)) {
						return;
					}
					
					// Eingaben
					var name 			= Ext.getCmp('subConceptNameField').getValue();
					var superConcept	= Ext.getCmp('conceptSuperField').getValue();
				}
			
				// unbekanntes Element
				else {
					Ext.Msg.alert("Error", "<p>Element kann nicht hinzugefügt werden.</p>");
					return;					
				}
				
				// Name muss gesetzt sein
				if (name.length == 0) {
					Ext.Msg.alert("Error", "<p>Please insert a proper Name for the new Element.</p>");
					return;
				}
				
				//FIXME das hier noch irgendwie in eine eigene Mehtode rausziehen
				// Kommentar hinzufügen
				var window = this.getCommentWindow();
				window.show();
				Ext.getCmp('apply-comment').on('click', function() {
					var comment = Ext.getCmp('editInformationComment').getValue();
					
		    		// neue Property
		        	if (mode == 'ADD_PROPERTY') {
		    			var cls = 'propNode';
		    			var iconCls = 'property_add';
		    			
	
		    			
						// Message an den Server zusammenbauen
						var message = {
							"id"			: "add:::property:::" + name,
							"command"		: "add",
							"type"			: "property",
							"domain"		: parentNode.text,
							"range"			: range,
							"literal"		: literal,
							"name"			: name,
							"description"	: descText,
							"comment"		: comment
						};
		        	}
		        	
		        	// neues Konzept
		        	else {
		        		var iconCls = 'cls_add';
		        		var cls = 'ontoNode';
		        				            				            		
						// Message an den Server zusammenbauen
						var message = {
							"id"			: "add:::concept:::" + name,
							"command"		: "add",
							"type"			: "concept",
							"name"			: name,
							"description"	: descText,
							"super"			: (superConcept || ''),
							"comment"		: comment
						};
		        	}
	
		        	this.addMessageToServer(message);
		        	
		        	// neuen Knoten im Baum erstellen
		        	var newNode = new Ext.tree.TreeNode({
		        		
		        		// in der Repräsenatation müssen wir die Datentypproperties mit ihren Datentyp anpassen
		        		text: 		name,
		        		id:			name,
		        		iconCls: 	iconCls,
		        		cls: 		cls
		        	});
		        	
		        	// Beschreibung übergeben
		        	newNode.attributes.description = this.getDescriptionArea().getValue();
		        	parentNode.appendChild(newNode);
		        	parentNode.expand();
		        	newNode.select();
		        	this.getPropertyWindow().hide();
					window.hide();
					
				}.bind(this));
			}.bind(this)
		})
		return addElementButton;
	},
	
	/**
	 * Button zum Editieren von Elementen
	 */
	getEditElementButton: function() {
		if (Ext.getCmp('editElementButton'))
			return Ext.getCmp('editElementButton');
		
		
		var editElementButton = new Ext.Button({
			id		: 'editElementButton',
	    	text	: 'apply',
	    	handler	: function() {
	        	var node = this.getConceptTree().getSelectionModel().getSelectedNode();
	        	
	        	// es muss eine Knoten ausgewählt sein
	        	if (node) {

	        		// Validieren
	            	if (this.getFormTabPanel().getActiveTab().id == 'propertyFormPanel') {
	            		if (!this.validatePropertyInputs(node)) {
	            			return;
	            		}
	            	}

	        		// Kommentarfenster öffnen
					var window = this.getCommentWindow();
					window.show();
					
					// Kommentar abgegeben -> Kommando an den Server schicken
					Ext.getCmp('apply-comment').on('click', function() {
		        		var object = node.text;
		        		var iconNode = Ext.get(node.ui.iconNode);
		        		var descText = this.getDescriptionArea().getValue();
		        		var comment = Ext.getCmp('editInformationComment').getValue();
		        		
		        		if (node.attributes.iconCls.indexOf('remove') != -1) {
		        			Ext.Msg.alert("Warning", "<p>Would you like to remove you delete Command?</p>");
		        		}
		        		
		        		// Property
		            	if (this.getFormTabPanel().getActiveTab().id == 'propertyFormPanel') {
		            		var iconCls	= 'property_edit';
		            		var name 	= Ext.getCmp('propertyNameField').getValue();
		            		var range 	= Ext.getCmp('propertyRangeField').getValue();
		            		var literal = Ext.getCmp('propertyRangeLiteral').getValue();
		            		
		    				var message = {
								"id"			: "edit:::property:::" + object,
								"command"		: "edit",
								"type"			: 'property',
								"name"			: name,
								"description"	: descText,
								"object"		: object,
								"comment"		: comment,
								"domain"		: node.parentNode.text,
								"range"			: range,
								"literal"		: literal
		    				};
		            	}
		            	
		            	// Concept
		            	else {
		            		var iconCls			= 'cls_edit'; 
		            		var superConcept	= node.parentNode.text;
		            		var name 			= Ext.getCmp('subConceptNameField').getValue();
		            		
		    				// Message an den Server zusammenbauen
		    				var message = {
								"id"			: "edit:::concept:::" + object,
								"command"		: "edit",
								"type"			: "concept",
								"name"			: name,
								"description"	: descText,
								"super"			: (superConcept || ""),
								"object"		: object,
								"comment"		: comment
		    				};
		            	}
		            	
	    				this.addMessageToServer(message);
	    				
	    				// Fenster schliessen
		            	this.getPropertyWindow().hide();
		            	
		            	// Baum aktualisieren
		            	node.setText(name);
		            	iconNode.removeClass(node.attributes.iconCls);
	            		iconNode.addClass(iconCls);
	            		
	            		// Kommentarfenster schliessen
	            		window.hide();
					}.bind(this));
	        	}
	        	
	        	// TODO Hinweis: Wählen sie ein Node aus
	    	}.bind(this)
		});
		return editElementButton;
	},
	
	/**
	 * Button zum Abbrechen von Elementdialogen
	 */
	getCancelElementButton: function() {
		if (Ext.getCmp('cancelElementButton'))
			return Ext.getCmp('cancelElementButton');
		
		var cancelElementButton = new Ext.Button({
			id		: 'cancelElementButton',
			text	: 'cancel',
	    	handler	: function() {
	    		var tabPanel = this.getFormTabPanel();
	    		if (tabPanel.findById('ontologyFormPanel')) {
	    			tabPanel.remove(Ext.getCmp('ontologyFormPanel'), false);
	    		}
	    		if (tabPanel.findById('conceptFormPanel')) {
	    			tabPanel.remove(Ext.getCmp('conceptFormPanel'), false);
	    		}
	    		if (tabPanel.findById('propertyFormPanel')) {
	    			tabPanel.remove(Ext.getCmp('propertyFormPanel'), false);
	    		}
	    		
	    		// Fenster schliessen und zerstören
	    		this.getPropertyWindow().hide();
	    	}.bind(this)
		});
		return cancelElementButton;
	},

	/**
	 * Validiert die Eingabefelder im Konzept Dialog
	 * @param type - Typ des Konzepts das hinzugefügt werden soll 'ADD_CLASS' für ein Rootkonzept & 'ADD_SUBCLASS' für ein Unterkonzept
	 * @param parentNode - Knoten des Konzepts an dem das Konzept angehängt wird
	 */
	validateConceptInputs: function(type, parentNode) {
		
		// Name des Namenfeldes
		var fieldname = (type == 'ADD_SUBCLASS') ? 'subConceptNameField' : 'rootConceptNameField';

		// Eingaben
		var name = Ext.getCmp(fieldname).getValue();
				
		// 1. Validierung: Name ist Pflichtfeld
		if (name.length == 0) {
			var msg = "Your Concept must have a name. Please insert a name!";
			Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
			Ext.getCmp(fieldname).markInvalid(msg);
			return false;
		}
		
		// 2. Validierung: Name muss eindeutig sein
		var node = this.getConceptTree().getNodeById(name);
		if (node && node.attributes.cls == 'ontoNode') {
			var msg = "The concept name must be unique. Please insert another name!";
			Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
			Ext.getCmp(fieldname).markInvalid(msg);
			return false;
		}
		
		return true;
	},
	
	/**
	 * Validiert die Eingabefelder im Properties Dialog
	 * @paran parentNode - Knoten des Konzepts an dem die Property hängt
	 */
	validatePropertyInputs: function(parentNode) {
		var range = Ext.getCmp('propertyRangeField').getValue();
		var literal = Ext.getCmp('propertyRangeLiteral').getValue();
		var name = Ext.getCmp('propertyNameField').getValue();
		
		// Name ist Pflichtfeld
		if (name.length == 0) {
			var msg = "Your Property must have a name. Please insert a name!";
			Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
			Ext.getCmp('propertyNameField').markInvalid(msg);
			return false;
		}
		
		// Property-Name muss eindeutig im Konzept Kontext sein
		var parent = parentNode;
		while (parent && parent != this.getConceptTree().getRootNode() && parent.attributes.cls == 'ontoNode') {
			for (var i = 0; i < parent.childNodes.length; i++) {
				if (parent.childNodes[i].text == name) {
					var msg = "The name of the Property must be unique in concept context.";
					Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
					Ext.getCmp('propertyNameField').markInvalid(msg);
					return false;
				}
			}
			parent = parent.parentNode;
		}
		
		// Objektproperty -> Range muss gesetzt und bekannt sein
		if (!literal) {
			
			// keine Benutzerangabe
			if (range.length == 0) {
				var msg = "An Objectproperty must have an object Range. Please insert an object range!";
				Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
				Ext.getCmp('propertyRangeField').markInvalid(msg);
				return false;
			}
			
			// Object Range muss in der Ontologie exisitieren und ein Konzept sein
			var objRange = this.getConceptTree().getNodeById(range);
			if (!objRange || objRange.attributes.cls != 'ontoNode') {
				var msg = "Your inserted object range is unknown. Please first add a new concept or change the object range!";
				Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
				Ext.getCmp('propertyRangeField').markInvalid(msg);
				return false;
			}
			
			// Object Range darf nicht gleichzeitig Domain sein
			if (!objRange || objRange == parentNode) {
				var msg = "Your inserted object range mustn't be your object domain. Please choose another object range!";
				Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
				Ext.getCmp('propertyRangeField').markInvalid(msg);
				return false;
			}
		}

		return true;
	},

	/**
	 * Wird ausgeführt, wenn der Benutzer eine Element durch das Betätigen der Toolbar hinzufügen möchte.
	 */
	addElement: function() {
		var parentNode = this.getConceptTree().getSelectionModel().getSelectedNode();
		var newCForm = this.getRootConceptForm();
		var content = this.getFormTabPanel();
		
		// Concept
		content.add(newCForm);
		content.setActiveTab(newCForm);
		
		Ext.getCmp('rootConceptNameField').reset();
		
		// Property & Concept
		if (parentNode && parentNode.attributes.cls == 'ontoNode') {
			var subCForm = this.getSubConceptForm();
			var pForm = this.getPropertyForm();
			
			content.add(subCForm);
			content.add(pForm);
			Ext.getCmp('subConceptNameField').reset();
			Ext.getCmp('conceptSuperField').setValue(parentNode.text);
			Ext.getCmp('propertyNameField').reset();
			Ext.getCmp('propertyRangeField').reset();
			content.setActiveTab(pForm);
		}
		
		var window = this.getPropertyWindow("Add Concept/Property", content); 
		window.addButton(this.getAddElementButton());
		window.addButton(this.getCancelElementButton());
		window.show();
	},
	
	deleteElement: function() {
		var node = this.getConceptTree().getSelectionModel().getSelectedNode();
		if (node) {
			var text = node.text;
			var iconCls = node.attributes.iconCls;
			
			// falls vorher hinzugefügter Knoten -> können wir ihn einfach
			// wieder rauslöschen
			if (iconCls == 'cls_add' || iconCls == 'property_add') {
				node.remove();
			}
			
			// GUI Aktualisierung
			else { 
				var iconNode = Ext.get(node.ui.iconNode);
				
				// FIXME nur vorhanden Klassen wirklich entfernen
				iconNode.removeClass('cls');
				iconNode.removeClass('property');
				iconNode.removeClass('cls_edit');
				iconNode.removeClass('property_edit');
				
				if (iconCls.indexOf('cls') != -1) {
					iconNode.addClass('cls_remove');
					node.attributes.iconCls = 'cls_remove';
					var type = 'concept';
				}

				else if (iconCls.indexOf('property') != -1) {
					iconNode.addClass('property_remove');
					node.attributes.iconCls = 'property_remove';
					var type = 'property';
				}
			}
			
			var window = this.getCommentWindow();
			window.show();
			Ext.getCmp('apply-comment').on('click', function() {
				var comment = Ext.getCmp('editInformationComment').getValue();
				
	   			// Änderungsmessage an den Server
	   			var message = {
	   				"id"			: "remove:::"+type+":::" + text,
	   				"command"		: "remove",
	   				"type"			: type,
	   				"name"			: text,
	   				"comment"		: comment
	   			};
	   			
	   			this.addMessageToServer(message);
   				window.hide();
			}.bind(this));
		}
	},
	
	editElement: function() {
		var node = this.getConceptTree().getSelectionModel().getSelectedNode();
		if (node) {
			var content = this.getFormTabPanel();

			this.getDescriptionArea().setValue(node.attributes.description);
			
			if (node.attributes.cls == 'ontoNode') {
				var cForm = this.getSubConceptForm();
				content.add(cForm);
				content.setActiveTab(cForm);        					
				Ext.getCmp('subConceptNameField').setValue(node.attributes.text);
				Ext.getCmp('conceptSuperField').setValue(node.parentNode.attributes.text);
			}
			
			else if (node.attributes.cls == 'propNode') {
				var pForm = this.getPropertyForm();
				content.add(pForm);
				content.setActiveTab(pForm);

				// Objektproperty
				if (node.firstChild) { 
					Ext.getCmp('propertyNameField').setValue(node.attributes.text);
					Ext.getCmp('propertyRangeField').setValue(node.firstChild.attributes.text);
					Ext.getCmp('propertyRangeLiteral').setValue('0');
				}
				
				// Datentypproperty
				else {
					Ext.getCmp('propertyNameField').setValue(node.attributes.text);
					Ext.getCmp('propertyRangeField').setValue('');
					Ext.getCmp('propertyRangeLiteral').setValue('1');
				}
				
			}
			
			var window = this.getPropertyWindow("Edit Concept/Property", content);
			window.addButton(this.getEditElementButton());
			window.addButton(this.getCancelElementButton());
			window.show();
		}
	},
	
	/**
	 * führt die Annotation des Datenobjekts mit dem gewählten Konzept aus
	 */
	annotateDataObject: function() {
		var tree		= this.getConceptTree();
		var concept		= tree.getSelectionModel().getSelectedNode();
		// TODO Abfrage wenn nichts ausgewählt wurde
		var ontology	= this.getOntologyList().getSelectionModel().getSelected().get('url');
		var nodes		= this.facade.getSelection();
		
		// es muss ein Knoten ausgewählt sein
		if (concept) {
			
			// kein Konzept ausgewählt
			if (!concept.attributes.iconCls.match("cls")) {
				Ext.Msg.alert("Your action is not allowed!", "<p>You can choose only concepts to annotate this data object.</p>");
				return;
			}
			
			this.getAnnotationWindow().hide();
			
			// Annotationsproperty setzen
			nodes[0].setProperty('oryx-annotation', true);
			this.facade.raiseEvent({
				type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
				element	: nodes[0],
				name	: 'oryx-annotation',
				value	: true
			});

			// Konzeptproperty setzen
			nodes[0].setProperty('oryx-concept', ontology + "#" + concept.text);
			this.facade.raiseEvent({
				type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
				element	: nodes[0],
				name	: 'oryx-concept',
				value	: ontology + "#" + concept.text
			});
			
			// Namen setzen
			nodes[0].setProperty('oryx-name', concept.text);
			this.facade.raiseEvent({
				type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
				element	: nodes[0],
				name	: 'oryx-name',
				value	: concept.text
			});
			
			// Beschreibung setzen
			nodes[0].setProperty('oryx-documentation', concept.attributes.description);
			this.facade.raiseEvent({
				type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
				element	: nodes[0],
				name	: 'oryx-documentation',
				value	: concept.attributes.description
			});
			
			// wir vergrößern nur die annotierten Objekte mit Standardgröße
			if (nodes[0].bounds.width() == 40) {
				nodes[0].bounds.extend({x: (concept.text.length * 8), y: 0});
			}
			this.facade.getCanvas().update();
			this.facade.setSelection(nodes);
		}
			
		else {
			Ext.Msg.alert("Error", "<p>Please take a choice.</p>");
		}
	},
	
	saveNewOntologyVersion: function(withGUI) {
		
		if (!withGUI) {
			var url 		= Ext.getCmp('ontoGrid').getSelectionModel().getSelected().get('url');
			var description = this.getDescriptionArea('Ontology-Description').getValue();
		
			// Message zur Erstellung einer neuen Version an den Server
			// zusammenbauen
			var message = {
				"id"			: "newVersion:::ontology:::" + url,
				"command"		: "newVersion",
				"type"			: "ontology",
				"description"	: description
			};
		
			this.startProgressBar("Please wait ...", "... Creating new Version ...");
			
			// Änderungen an den Server schicken
			this.addMessageToServer(message);
			this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
			this.stopProgressBar(false);
			return;
		}
		
    	var nameField = new Ext.form.TextField({
    		fieldLabel: 'Name',
    		name: 'name',
    		allowBlank: false,
    		vtype: 'alphanum'
    	});
    	
    	var versionField = new Ext.form.TextField({
    		fieldLabel: 'Version',
    		name: 'version',
    		allowBlank: false
    	});
    	
    	// *** New Version Form *** //
    	var form = new Ext.FormPanel({
    		id: 'newVersionForm',
        	labelWidth: 50,
	        frame:false,
	        title: 'Create (*.owl)',
	        bodyStyle:'padding:5px 5px 0',
	        width: 480,
	        defaults: {width: 300},
	        defaultType: 'textfield',
	        items: [
	        	nameField, versionField
	        ]
	    });
    	
    	// *** New Version Window *** //
		var newVersionWindow = new Ext.Window({
    		id : 'makeNewVersionWindow',
    		width : 500,
    		height: 200,
    		autoHeight: true,
    		modal : true,
    		autoScroll : true,
    		title : 'Create new Version ...',
    		items: [
    		        form
    		],
    		buttons: [{
    			text: 'save',
    			handler: (function() {
    			    				
    				var name		= nameField.getValue();
    				var version 	= versionField.getValue();
    				var url 		= Ext.getCmp('ontoGrid').getSelectionModel().getSelected().get('url');
    				var description = this.getDescriptionArea('Ontology-Description');
    			
    				// validieren //
    				// Name ist Pflichtfeld
    				if (name.length == 0) {
    					var msg = "Your Ontology must have a name. Please insert a name!";
    					Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
    					nameField.markInvalid(msg);
    					return false;
    				}

    				// Name ist Pflichtfeld
    				if (version.length == 0) {
    					var msg = "Your Ontology must have a version, f.e. 'majorVersion'.'minorVersion'. Please insert a versionnumber!";
    					Ext.Msg.alert("Your input is not valid!", "<p>" + msg + "</p>");
    					versionField.markInvalid(msg);
    					return false;
    				}

    				newVersionWindow.hide();

					// Message zur Erstellung einer neuen Version an den Server
					// zusammenbauen
					var message = {
						"id"			: "newVersion:::ontology:::" + url,
						"command"		: "newVersion",
						"type"			: "ontology",
						"name"			: name,
						"version"		: version,
						"description"	: description
					};
    			
					this.startProgressBar("Please wait ...", "... Creating new Version ...");
					
					// Änderungen an den Server schicken
					this.addMessageToServer(message);
					this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
					this.stopProgressBar(false);
    			}).bind(this)
    		}]
		});
		newVersionWindow.on('hide', function(){
			newVersionWindow.destroy(true);
			delete newVersionWindow;
		});
		// Vorauswahl
		
		// TODO könnte man vielleicht besser mit einem HiddenFeld lösen
		var selection = this.getOntologyList().getSelectionModel().getSelected(); 
// var url = selection.get('url');
		var name = selection.get('name');
		nameField.setValue(name);
// urlField.setValue(url);
		
		newVersionWindow.show();	
	},
	
	/**
	 * Schlägt per Highlighting eine mögliche Semantische Brücke vor
	 */
	suggestSemanticBridge: function() {
		var selection		= this.facade.getSelection();
		var concept			= selection[0].properties['oryx-concept'];
		var result			= true;
		var suggestionStore = new Ext.data.SimpleStore({fields: ['concept','bridge']});
		var Data 			= Ext.data.Record.create([{name: 'concept'}, {name: 'bridge'}]);
		
		this.startProgressBar('Finding suggestions ...');
		
		// untersuche JEDE Semantische Brücke
		this.bridgeStore.each(
			function(record) {
				
				var message = {
					"id"				: "suggest:::semantic bridge:::To:::" + concept,
					"command"			: "suggest",
					"type"				: "semantic bridge",
					"name"				: concept,
					"semanticBridge" 	: record.get('url')
				};
		    	
				this.addMessageToServer(message);
				
				// Progressbar aktualisieren
				Ext.getCmp('progressbar').updateText("... examining '" + record.get('name') + "' ...");
				
				// Client -> Server -> Client Kommunikation
				var messages = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,concept.split('#')[0]).messages;
				for (var i = 0; i < messages.length; i++) {

					// behandelt jede Message nach Standardverfahren
					if (this.handleStandardServerMessage(messages[i])) {
						continue;
					}
					
					if (messages[i].command && messages[i].command == "suggest") {
						
						var target		= messages[i].name;
						var ontology	= messages[i].ontology;
						
						// Vorschlag vorhanden
						if (target && ontology) {
							suggestionStore.add(new Data({concept: (ontology + "#" + target), bridge: record.get('name')}));
						}
						
						result = true;
					}
					
//					// falls nicht behandelt -> Fehler 
//					else {
//						this.showUnexpectedServerResponseDialog(messages[i]);
//					}
				}
				
			}.bind(this)
		);

		this.stopProgressBar(true);
		
		if (result) {

			// Shape zu dem die Verbindung aufgebaut werden soll
			var targetShape = selection[0];
			
			// SuggestionWindow
	    	var suggestionWindow = new Ext.Window({
	    		id : 'suggestion-window',
	    		width : 600,
	    		height: 200,
	    		autoHeight: true,
	    		modal : true,
	    		autoScroll : true,
	    		title : 'Possible Semantic Bridges ...',
	    		items: [{
	    			xtype: 'grid',
	            	id : 'suggestionGrid',
	                title: 'Suggestions',
	                store: suggestionStore,
	                rowspan: 2,
	                width: 580,
	                height: 200,
	                autoExpandColumn: 'conceptCol',
	                columns: [
	                     {id: 'conceptCol', header: 'Concept', sortable: true, dataIndex: 'concept'},
	                     {id: 'bridgeCol', header: 'Bridge', sortable: false, dataIndex: 'bridge'}
	                ],
	                sm: new Ext.grid.RowSelectionModel({
	                	singleSelect: true,
	                    listeners: {
		                	rowselect: function(smObj, rowIndex, record) {
	                			targetShape = this.highlight(this.facade.getCanvas(), 'oryx-concept', record.get('concept'));
		                	}.bind(this)
	                	}
	    			})
	    		}],
	    		buttons: [{
	    			text: 'setup',
	    			disabled: (suggestionStore.getCount() == 0),
	    			handler: function() {
	    			
	    				if (targetShape) {
	
			    			suggestionWindow.hide();
			    			
			    			this.setupSemanticBridge(selection[0], targetShape);
			    			
	    					// Highlighting, falls vorhanden, deaktivieren
			    			this.facade.raiseEvent({
			    				type	: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
			    				id		: "suggestSemanticBridge"
			    			});
	    				}
	    				
	    				else {
	    					Ext.Msg.alert("Error", "<p>Please pick a suggestion.</p>");
	    				}
	    			}.bind(this)
	    		}, {
	    			text: 'close',
	    			handler: function() {

	    				// Highlighting, falls vorhanden, deaktivieren
		    			this.facade.raiseEvent({
		    				type	: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
		    				id		: "suggestSemanticBridge"
		    			});
	    			
		    			suggestionWindow.hide();
					}.bind(this)
	    		}]
	    	});
	    	suggestionWindow.on('hide', function(){
	    		suggestionWindow.destroy(true);
				delete suggestionWindow;
			});
	    	suggestionWindow.show();
	    	
	    	// erste Reihe vorausgewählt
	    	if (suggestionStore.getCount() > 0) {
	    		this.workaroundSelectRowInGrid(Ext.getCmp('suggestionGrid'), 0);
	    	}
		}
		
		else {
			Ext.Msg.alert("No suggestion found", "<p>There was no Semantic Bridge found for this Semantic Dataobjekt.</p>");
		}
	},
	
	/**
	 * Annotiere Datenobjekt (Aufruf über das Kontextmenu)
	 */ 
	showSemanticDataObject: function() {	
		    
		// bereits annotiert
        var nodes = this.facade.getSelection();
        var concept	= nodes[0].properties['oryx-concept'];

        // Fenster anzeigen
        this.getAnnotationWindow(concept).show();
                
        var tree = this.getConceptTree();
        this.filter.filter(new RegExp('[^flat]','i'),'type', tree.getRootNode());
		
        tree.getTopToolbar().addSeparator();
        
        tree.on({
        	'click' : function(selected) {

        		// alle bereits vorhandenen Filter herausfinden
        		var oldFilter = tree.getTopToolbar().items.filterBy(function(o, k) {
        			if (k.match("^switch-filter") == "switch-filter")
        				o.destroy();
        		});
        		
        		// Namespaces vorhanden
        		if (selected.attributes.ns && selected.attributes.ns.split(",").length > 1) {

        			var menu = new Ext.menu.Menu({});
        			
        			// Clear Filter
    				var clearFilterMenuItem = new Ext.menu.Item({
    					id			: "toolbar-button-filter-clear",
    					iconCls		: 'filter_clear',
    					text		: "Polymorph",
    					handler		: function() {
        					this.filter.clear();
    					}.bind(this)
    				});
    				menu.add(clearFilterMenuItem);
    				
    				// polymorphe Filter
        			var forms = selected.attributes.ns.split(",");
	        		for (var i=0; i < forms.length; i++) {
	        			var name = forms[i];
	        			var url = name.substring(0,name.length-1);
	        			var record = this.ontologyStore.getAt(this.ontologyStore.find('url', url));
	        			
	        			menu.add(new Ext.menu.Item({
        					id			: "toolbar-button-filter-" + name,
        					text		: record.get('name'),
        					iconCls		: 'filter_' + (i + 1),
        					name		: name,
        					handler		: function(button) {
	        					this.filter.clear();
	        					this.filter.filter(new RegExp(button.name,'i'),'ns', selected);
        					}.bind(this)
        				}));
	        		}
	        		
	        		tree.getTopToolbar().add(new Ext.Toolbar.SplitButton({
	        			id: 'switch-filter',
        	            text: 'filter',
        	            tooltip: {text:'Switch between the forms of the polymorph concept.', title:'Forms'},
        	            iconCls: 'blist',
        	            menu : menu
	        		 }));
	        		 
        		}
        	}.bind(this)
        });
        
        
        // Auswahl des Annotierten Konzepts
        if (concept) {
// console.log(record.get('description'));
// // this.getDescriptionArea().setRawValue(record.get('description'));
// console.log("Row: " + row);
// console.log(this.getOntologyList().getView());
// console.log(this.getOntologyList().getView().getRow(0));
// this.getOntologyList().getSelectionModel().selectRow(row);
// this.getOntologyList().getView().focusRow(row);

// console.log(parts[1]);
// tree.expandAll();
// var node = tree.getNodeById(parts[1]);
// if (node) {
// console.log("to expand");
// node.expand(true);
// node.select();
// }
        }
        
        // Standardmäßig erste Reihe auswählen
        else {
        	this.getOntologyList().getSelectionModel().selectFirstRow();
        }
	}, 
	
	/**
	 * Resettet eine Ontology aus dem Semantischen Pool - polymorphe Änderungen gehen damit verloren
	 */
	resetOntology: function(url) {
        var row = this.ontologyStore.find('url', url);
        var record = this.ontologyStore.getAt(row);
        var name = record.get('name');
        
        this.startProgressBar("Please Wait ...", "... Restoring Data Object ...");
        
		var message = {
			"id"		: "reload:::ontology:::" + url,
			"command"	: "reload",
			"type"		: "ontology",
			"name"		: name
		};
		
		this.addMessageToServer(message);
		this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
		this.stopProgressBar();
	},
	
	/**
	 * Importieren von Ontologien in den Semantischen Pool
	 */ 
	importToSemanticPool: function(id) {
		
		
		// Importfenster
    	var importWindow = new Ext.Window({
    		id : 'import-window',
    		width : 400,
    		height: 200,
    		autoHeight: true,
    		modal : true,
    		autoScroll : true,
    		title : 'Import ontologies ...',
    		items: [
    			this.getImportOntologyForm('importForm')
    		],
    		buttons: [{
    			text: 'import',
    			handler: function() {
    				
    				// Benutzereingaben testen
			    	var url = Ext.getCmp('ontologyUrlField').getValue();
			    	var ontoName = Ext.getCmp('ontologyNameField').getValue();

			    	// URL muss eingegeben werden
			    	if (!url) {
			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a valid URL.</p>");
			    		return;
			    	}
			    	
			    	// URL darf nicht vorhanden sein
			    	else if ((id == 'oryx_pool_sbridges' && this.bridgeStore.find('url', url) > -1) || (id == 'oryx_pool_onologies' && this.ontologyStore.find('url', url) > -1)) {
			    		Ext.MessageBox.alert('Import not allowed!', "<p>The given URL '" + url + "' is already in the pool.</p>");
			    		return;
			    	}
			    	
			    	// Name muss eingegeben werden
			    	else if (!ontoName) {
			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a Name.</p>");
			    		return;
			    	}
			    	
			    	// Name darf nicht vorhanden sein
			    	else if ((id == 'oryx_pool_sbridges' && this.bridgeStore.find('name', ontoName) > -1) || (id == 'oryx_pool_onologies' && this.ontologyStore.find('name', ontoName) > -1)) {
			    		Ext.MessageBox.alert('Import not allowed!', "<p>There is already an entry with the name '" + ontoName + "'</p>");
			    		return;
			    	}
    			
    				this.startProgressBar('Import', 'importing ... please wait ...');

			    	// Ontology
			    	if (id == 'oryx_pool_onologies') {
				    	
						var message = {
							"id"		: "import:::ontology:::" + url,
							"command"	: "import",
							"type"		: "ontology",
							"name"		: ontoName
						};
			    	}
			    	
			    	// semantische Brücke
			    	else if (id == 'oryx_pool_sbridges') {
			    		
						var message = {
							"id"		: "import:::semantic bridge:::" + url,
							"command"	: "import",
							"type"		: "semantic bridge",
							"name"		: ontoName
						};
			    	}
			    	
					importWindow.hide();

					this.addMessageToServer(message);
					var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url);
					this.handleStandardServerResponse(response);
					this.stopProgressBar(true);

				}.bind(this)
    		}, {
    			id		: 'cancelButton',
    			text	: 'cancel',
    	    	handler	: function() {
    				importWindow.hide();
    			}
    		}]
    	});
    	importWindow.on('hide', function(){
    		importWindow.destroy(true);
			delete importWindow;
		});
    	importWindow.show();
	},
	
	
	/**
	 * Anzeige und Verwaltung des Semantischen Pools
	 */
	showSemanticPool: function(facade) {
		
		// +++ GUI Komponenten +++
		// Liste mit allen Ontologien
    	var ontologyList = new Ext.grid.GridPanel({
    		id: 'oryx_pool_onologies',
    		title: 'Ontologies',
    		store: this.ontologyStore,
    		autoExpandColumn: 'urlCol',
    		height: 300,
    		columns: [
    		          {header: 'Name', sortable: true, width: 150, dataIndex: 'name'},
    		          {header: 'Version', sortable: false, dataIndex: 'version'},
    		          {id: 'urlCol', header: 'URL', sortable: true, dataIndex: 'url'}
    		]
    	});
    	
    	// Liste mit allen semantischen Brücken
    	var sbridgeList = new Ext.grid.GridPanel({
    		id: 'oryx_pool_sbridges',
    		title: 'Semantic Bridges',
    		store: this.bridgeStore,
    		autoExpandColumn: 'urlCol',
    		height: 300,
    		columns: [
    		          {header: 'Name', sortable: true, width: 150, dataIndex: 'name'},
    		          {header: 'Version', sortable: false, dataIndex: 'version'},
    		          {id: 'urlCol', header: 'URL', sortable: true, dataIndex: 'url'}
    		]
    	});
    	
    	// Panel mit Tabs
		var tabPanel = new Ext.TabPanel({
			activeTab: 0,
			viewConfig: {
		        forceFit: true
		    },
	        items:[ontologyList, sbridgeList]           
		});
		
		// Hauptpanel was die Tabs enthält
        var panel = new Ext.Panel({
            items: [{
                xtype: 'label',
                text: "Organize your ontologies and semantic bridges.",
                style: 'margin:10px;display:block'
            }, tabPanel],
            frame: true,
            buttons: [{
                text: "new",
                handler: function() {
	        		
            		//FIXME in Methoden auslagern (duplicate code)
            		if (tabPanel.getActiveTab().id == 'oryx_pool_onologies') {
            			var form = this.getNewOntologyForm();
            			var content = this.getFormTabPanel();
            			content.add(form);
            			var window = this.getPropertyWindow("Add Ontologies", content);
            			var createButton = new Ext.Button({
            				id: 'newOntologyButton',
            				text: 'create',
            				handler: function() {
	        					
	                    		// mandatory
	        					var text = Ext.getCmp('ontologyNameField').getValue();
	        					if (!text) {
	        			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a Name.</p>");
	        			    		return;
	        			    	}
	        					
	        					// optional
	        					var descText = this.getDescriptionArea().getValue();

	            				// Message an den Server zusammenbauen
	            				var message = {
	        						"id"			: "create:::ontology:::" + text,
	        						"command"		: "create",
	        						"type"			: "ontology",
	        						"name"			: text,
	        						"description"	: descText
	            				};
	            				
	            				this.addMessageToServer(message);
	            				this.startProgressBar('Please wait ...', '... creating new Ontology ...');
	            				this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL));
	            				this.stopProgressBar(true);
	            				window.hide();            				
            				}.bind(this)
            			});
	            		window.addButton(createButton);
            		}
            		else if (tabPanel.getActiveTab().id == 'oryx_pool_sbridges') {
            			var form = this.getNewOntologyForm('Semantic Bridge');
            			var content = this.getFormTabPanel(120);
	            		form.add({
		                	xtype: 'combo',
		                	id: 'source-ontology',
		            		name: 'source ontology',
		                	fieldLabel: 'Source ontology',
		                	mode: 'local',
		                	store: this.ontologyStore,
		                	displayField: 'name',
		                	typeAhead: true,
		                	forceSelection: true,
		                	emptyText: 'Select the source ontology ...',
		                	selectOnFocus: true
	            		}, {
		                	xtype: 'combo',
		                	id: 'target-ontology',
		            		name: 'target ontology',
		                	fieldLabel: 'Target ontology',
		                	mode: 'local',
		                	store: this.ontologyStore,
		                	displayField: 'name',
		                	typeAhead: true,
		                	forceSelection: true,
		                	emptyText: 'Select the target ontology ...',
		                	selectOnFocus: true
	            		});
            			content.add(form);
            			var window = this.getPropertyWindow("Add Semantic Bridge", content);
	            		var createButton = new Ext.Button({
	            			id: 'newSemanticBridgeButton',
	            			text: 'create',
	            			handler: function() {
	        					
	                    		// mandatory
	        					var text = Ext.getCmp('ontologyNameField').getValue();
	        					if (!text) {
	        			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a Name.</p>");
	        			    		return;
	        			    	}
	        					var sourceName = Ext.getCmp('source-ontology').getValue();
	        					if (!sourceName) {
	        			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a Source Ontology.</p>");
	        			    		return;	        					
	        					}
	        			        var targetName = Ext.getCmp('target-ontology').getValue();
	        					if (!targetName) {
	        			    		Ext.MessageBox.alert('Input not allowed!', "<p>You must insert a Target Ontology.</p>");
	        			    		return;
	        					}
	        					
	        					// URL herausfinden
	        					var row			= this.ontologyStore.find('name', sourceName);
	        			        var record		= this.ontologyStore.getAt(row);
	        			        var sourceUrl 	= record.get('url');
	        					
	        					row				= this.ontologyStore.find('name', targetName);
	        					record			= this.ontologyStore.getAt(row);
	        					var targetUrl 	= record.get('url');
	        					
	        					// optional
	        					var descText = this.getDescriptionArea().getValue();
        					
	            				// Message an den Server zusammenbauen
	            				var message = {
	        						"id"				: "create:::bridge:::" + text,
	        						"command"			: "create",
	        						"type"				: "semantic bridge",
	        						"name"				: text,
	        						"sourceOntology"	: sourceUrl,
	        						"targetOntology"	: targetUrl,
	        						"description"		: descText
	            				};
	            				
	            				this.addMessageToServer(message);
	            				this.startProgressBar('Please wait ...', '... creating new Semantic Bridge ...');
	            				this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL));
	            				this.stopProgressBar(true);
	            				window.hide();
	            			}.bind(this)
	            		});
	            		window.addButton(createButton);
            		}
            		window.addButton(this.getCancelElementButton());
            		window.show();
            	}.bind(this)
            }, {
                text: "import",
                handler: function() {
            		this.importToSemanticPool(tabPanel.getActiveTab().id);
            	}.bind(this)
            }, {
                text: "export",
                handler: function() {
            		this.exportToSemanticPool(tabPanel.getActiveTab().id)
            	}.bind(this)
            }, {
            	text: "delete",
            	handler: (function() {
            		if (tabPanel.getActiveTab().id == 'oryx_pool_onologies') {
                		var record = ontologyList.getSelectionModel().getSelected();
                		this.ontologyStore.remove(record);            			
            		}
            		else if (tabPanel.getActiveTab().id == 'oryx_pool_sbridges') {
                		var record = sbridgeList.getSelectionModel().getSelected();
                		this.bridgeStore.remove(record);            			
            		}
            	}).bind(this)
            }, {
            	text: "cancel",
                handler: function(){
            		this.getFormTabPanel().remove(this.getNewOntologyForm());
                    Ext.getCmp('oryx_semanticpool_window').close();
                    
                    this.persistPool();
            	}.bind(this)
            }]
        });
        
        // Hauptfenster
        var window = new Ext.Window({
            id: 'oryx_semanticpool_window',
            width: 500,
            title: 'Semantic Pool',
            floating: true,
            shim: true,
            modal: true,
            resizable: true,
            autoHeight: true,
            items: [panel],
            height: 400
        });
        
        // Show the window
        window.show();
	},
	
	/**
	 * Persistiert den aktuellen Pool im Modell
	 */
	persistPool: function() {
		
        // persistieren
        var propName = 'oryx-semanticpool';
        var canvas = this.facade.getCanvas();
        var property = canvas.getStencil().property(propName);
        var jsonString = this.buildValue(property.complexItems());
        canvas.setProperty(propName, jsonString);
        
		this.facade.raiseEvent({
			type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
			element	: this.facade.getCanvas(),
			name	: propName,
			value	: jsonString
		});
	},
	
	/**
	 * Export von Ontologien & Semantischen Brücken als Fenster mit Link
	 */
	exportToSemanticPool: function(id) {
		var selection = Ext.getCmp(id).getSelectionModel().getSelected();
		
		if (selection) {
		    Ext.MessageBox.alert('Export ...', "<p><b>'" + selection.get('name') + "'</b> kann nun herunter geladen werden... <a href='"+selection.get('url')+"' target='_blank'>Download</a></p>");
		}
	},
	
	/**
	 * Erstellt einen Servercall für die Ausführung einer Semantischen Brücke 
	 * ohne ihn jedoch schon zu versenden
	 * 
	 * @param shape - shape der Semantischen Brücke
	 */
	addSemanticBridgeServerCall: function(shape) {
	
		var url				= shape.properties['oryx-url'];
		var source			= shape.properties['oryx-source'];
        var target			= shape.properties['oryx-target'];
        var row				= this.bridgeStore.find('url', url);
        var bridgeRecord	= this.bridgeStore.getAt(row);

		if (!source || !target || !bridgeRecord) {
			console.log("fehlerhafte Konfiguration der Semantischen Brücke:");
			console.log(source);
			console.log(target);
			console.log(bridgeRecord);
			return;
		}
						
		// Name der Quellontologie (damit wird die Repräsentation später ersetzt)
        var parts = source.split("#");
        var ontoRecord = this.ontologyStore.getAt(this.ontologyStore.find('url', parts[0]));
        
		var message = {
			"id"				: "semanticBridge:::" + bridgeRecord.get('url'),
			"command"			: "semanticBridge",
			"type"				: "ontology",
			"name"				: ontoRecord.get('name'),
			"xml"				: ontoRecord.get('xml'),
			"semanticBridge" 	: bridgeRecord.get('url'),
			"sourceOntology" 	: source,
			"targetOntology" 	: target,
			"shapeid"			: shape.id
		};
	    
	    this.addMessageToServer(message);
	},
	
	/**
	 * führt die Semantische Brücke aus (daraufhin wird die Repräsentation
	 * geändert)
	 * 
	 * @param shape - shape der Semantischen Brücke
	 * @param resize - Shape nach der erstellung resizen
	 */
	handleSemanticBridgeResponse: function(response, resize) {
        
		// Client -> Server -> Client Kommunikation
		var messages = response.messages;
	    
		var icon = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
			"title": 'Semantische Brücke noch nicht spezifiziert.',
			"stroke-width": 3.0,
			"stroke": "orange",
			"d": "M12,-5 L12,-7 M12,-9 L12,-20",
			"line-captions": "round"
		}]);
        
		for (var i = 0; i < messages.length; i++) {

			// Fehler aufgetreten -> Semantische Brücke löschen
			if (messages[i].error) {
				var shape = this.facade.getSelection()[0];
				
				// Semantische Brücke nicht aktive
		        var icon = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
		            "title":			'Semantische Brücke ist fehlerhaft.',
		            "stroke-width":		3.0,
		            "stroke":			"red",
		            "d":				"M20,-5 L5,-20 M5,-5 L20,-20",
		            "line-captions": 	"round"
		        }]);
	            
				setTimeout(function() {
		            this.facade.raiseEvent({
		                type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
		                id: 'Semantic Bridge Validation',
		                shapes: [shape],
		                node: icon,
		                nodePosition: "START"
		            });
				}.bind(this), 1500);
				
//				this.facade.deleteShape(this.facade.getSelection()[0]);
//				this.facade.setSelection(new Array(this.facade.getCanvas()));
			}
			
			// behandelt jede Message nach Standardverfahren
			if (this.handleStandardServerMessage(messages[i])) {
				continue;
			}
	    
			/*
			 * Konzeptname nach der Semantischen Brücke aktualisieren, dazu muss: -
			 * shapes als Scope dem Funktionsaufruf übergeben werden - genau eine
			 * Semantische Brücke sein - die genau ein SourceObject hat
			 */
			var shape = this.facade.getCanvas().getChildById(messages[i].shapeid,true);
			if (messages[i].command == 'changeConceptname' && shape && shape.incoming.length == 1) {
				var dataobject = shape.incoming[0];
				dataobject.setProperty('oryx-name', messages[i].name);
	
				this.facade.raiseEvent({
					type 	: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
					element	: dataobject,
					name	: 'oryx-name',
					value	: messages[i].name
				});
				
				// wir vergrößern nach Textgröße
				if (resize) {
					dataobject.bounds.extend({x: (messages[i].name.length * 5), y: 0});
				}
				
				this.facade.getCanvas().update();
				this.facade.setSelection(new Array(shape));
				
				// Semantische Brücke ist nun aktiv
	            icon = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
	                "title":			'Semantische Brücke korrekt.',
	                "stroke-width":		3.0,
	                "stroke":			"green",
	                "d":				"M12,-5 L5,-15 M12,-5 L20,-20",
	                "line-captions": 	"round"
	            }]);
	            
				setTimeout(function() {
		            this.facade.raiseEvent({
		                type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
		                id: 'Semantic Bridge Validation',
		                shapes: [shape],
		                node: icon,
		                nodePosition: "START"
		            });;
				}.bind(this), 1500);

			}
			
			else {
				//TODO Fehlermeldung einfügen
			}
		}

	    return result;
	},
	
	/**
	 * richtet eine Semantische Brücke zwischen zwei annotierten Datenobjekten
	 * ein
	 * @param sourceNode - Shape als Source für die Semantische Brücke
	 * @param targetNode - Shape als Target für die Semantische Brücke
	 */
	setupSemanticBridge: function(sourceNode, targetNode) {
        var source	= sourceNode.properties['oryx-concept'];
        var target	= targetNode.properties['oryx-concept'];
		
        // Error: Source or Target aren't annotated
        if (!(source && target)) {
        	Ext.MessageBox.alert('Error', "<p>Only annotated Dataobjects allowed.</p>");
        }
        	
        else {

        	// Abfragedialog
	        var window = new Ext.Window({
	            id: 'setup-semanticbridge',
	            width: 590,
	            title: 'Setup Semantic Bridge',
	            labelWidth: 100,
	            modal: true,
	            resizable: true,
	            items: [{
	            	xtype: 'form',
	        		id: 'setupBridgeForm',
	            	labelWidth: 100,
	    	        frame: false,
	    	        title: 'Setup Semantic Bridge',
	    	        bodyStyle:'padding:5px 5px 0',
	    	        width: 580,
	    	        defaults: {width: 420},
	    	        items: [{
	                	xtype: 'textfield',
	                	id: 'source-concept',
	            		name: 'source concept',
	            		allowBlank: false,
	                	fieldLabel: 'source concept',
	                	readOnly: true,
	                	value: source
	                },{
	                	xtype: 'textfield',
	                	id: 'target-concept',
	            		name: 'target concept',
	            		allowBlank: false,
	                	fieldLabel: 'target concept',
	                	readOnly: true,
	                	value: target
	                }, {
	                	xtype: 'combo',
	                	id: 'semanticbridgechoice',
	            		name: 'semantic bridge',
	                	fieldLabel: 'semantic bridge',
	                	mode: 'local',
	                	store: this.bridgeStore,
	                	displayField: 'url',
	                	typeAhead: true,
	                	forceSelection: true,
	                	emptyText: 'Select a semantic bridge ...',
	                	selectOnFocus: true
	                }]
	    	    }],
	    	    buttons: [{
	    	    	text: 'setup',
	    	    	handler: function() {

	    	    		// Benutzerauswahl der SemBrücke
    					var selectedIndex = Ext.getCmp('semanticbridgechoice').selectedIndex;
    	    		
    					// alles korrekt ausgewählt? -> SemBrücke ausführen
    					if (sourceNode && targetNode) {
    						var data = this.bridgeStore.getAt(selectedIndex);
    						var coordinates = targetNode.absoluteXY();
    						var magnet = sourceNode.getDefaultMagnet();
    						var cPoint = magnet ? magnet.bounds.center() : option.connectedShape.bounds.midPoint();

    						// Connector hinzufügen
    				    	var option = {
				    			type: 'http://b3mn.org/stencilset/bpmn1.1#semanticBridge',
//				    			position: {x: (coordinates.x + cPoint.x), y: (coordinates.y + cPoint.y)},
				    			namespace: 'http://b3mn.org/stencilset/bpmn1.1#',
			        			parent: targetNode,
			        			connectedShape: sourceNode
								// connectingType: uiObj-Class
								// draggin: false,
								// template: a template shape that the newly created inherits properties from.
			        		}
			        		
    				    	/*
    				    	 * Ausnahme:
    				    	 * selbsthinzugefügte dürfen keine Events werfen, da sie breits alle notwendigen Informationen haben
    				    	 */ 
    				    	this.ignoreShapeAddedEvent = true;
    				    	
    				    	// Connector erzeugen
			        		var semBridge = this.facade.createShape(option);
			        		semBridge.setProperty('oryx-source', source);
			        		semBridge.setProperty('oryx-target', target);
			        		semBridge.setProperty('oryx-url', data.get('url'));
			        		semBridge.setProperty('oryx-name', data.get('name'));
			        		
			        		// andocken
			        		semBridge.dockers.first().setDockedShape(sourceNode);
			        		semBridge.dockers.first().setReferencePoint(sourceNode.getDefaultMagnet().bounds.center());
			        		semBridge.dockers.last().setDockedShape(targetNode);
			        		semBridge.dockers.last().setReferencePoint(targetNode.getDefaultMagnet().bounds.center());
			        					        		
			        		this.facade.getCanvas().update();

			        		// auswählen
							this.facade.setSelection(new Array(semBridge));
			        		
			        		// jetzt müssen wir wieder auf Events warten
			        		this.ignoreShapeAddedEvent = false;
			        		
			        		this.startProgressBar('Please wait ...', '... executing Semantic Bridge  ...');
			        		this.addSemanticBridgeServerCall(semBridge);
			        		var response = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
			        		this.handleSemanticBridgeResponse(response, true);
			        	    this.stopProgressBar(true);
			        		
			        		window.hide();
			    		}	    	    		
	    	    	}.bind(this)
	    	    }, {
	    	    	text: 'cancel',
	    	    	handler: function() {
	    	    		window.hide();
	    	    	}
	    	    }],
	            height: 180
	        });
	        window.on('hide', function(){
	        	window.destroy(true);
				delete window;
			});
			
	        // Show the window
	        window.show();
        }
	},
	
	/**
	 * Eigenschaften der Semantischen Brücke ändern
	 */
	editSemanticBridge: function() {
		var nodes		= this.facade.getSelection();
		var name		= nodes[0].properties['oryx-name'];
		var url			= nodes[0].properties['oryx-url'];
        var source		= nodes[0].properties['oryx-source'];
        var target		= nodes[0].properties['oryx-target'];
        var version		= nodes[0].properties['oryx-version'];
        var description	= nodes[0].properties['oryx-documantation'];
        
        var row 		= this.bridgeStore.find('url', url);
        var record 		= this.bridgeStore.getAt(row);
        
        // rules
		var rulesStore	= new Ext.data.SimpleStore({fields: ['name','rule','comment','added']});
		var Data		= Ext.data.Record.create([{name: 'name'}, {name: 'rule'}, {name: 'comment'}, {name: 'added'}]);

		
        this.startProgressBar('Reading Semantic Bridge ...', '... receiving Information ...');
        
		var message = {
			"id"		: "getrules:::" + url,
			"command"	: "getrules",
			"type"		: "semantic bridge"
		};
        
		// Client -> Server -> Client Kommunikation
		this.addMessageToServer(message);
		var messages = this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL, url).messages;
		for (var i = 0; i < messages.length; i++) {

			// behandelt jede Message nach Standardverfahren
			this.handleStandardServerMessage(messages[i]);
	    
			if (messages[i].rules){
				
				var rules = messages[i].rules;
				for (var j = 0; j < rules.length; j++) {
					rulesStore.add(new Data({name: rules[j].name, comment: rules[j].comment, rule: rules[j].rules, added: false}));
				}
				
			}
		}        
        this.stopProgressBar(true);
        
		// Abfragedialog
        var window = new Ext.Window({
            id: 		'edit-semanticbridge',
            width: 		590,
            title: 		'Semantic Bridge',
            labelWidth: 100,
            modal: 		true,
            resizable: 	true,
            autoHeight: true,
            items: [{
            	xtype:		'form',
        		id: 		'editBridgeForm',
            	labelWidth: 100,
    	        frame: 		false,
    	        title: 		'Properties',
    	        bodyStyle:	'padding:5px 5px 0',
    	        width: 		580,
    	        defaults: 	{width: 420},
    	        items: [{
                	xtype: 		'textfield',
                	id: 		'bridge-name',
            		name: 		'name',
            		allowBlank: false,
                	fieldLabel: 'Name',
                	value: 		name
                },{
                	xtype: 		'textfield',
                	id: 		'bridge-url',
            		name: 		'url',
            		allowBlank: false,
                	fieldLabel: 'Url',
                	disabled: 	true,
                	value: 		url
                },{
                	xtype: 		'textfield',
                	id: 		'source-concept',
            		name: 		'source concept',
            		allowBlank: false,
                	fieldLabel: 'Source Concept',
                	disabled: 	true,
                	value: 		source
                },{
                	xtype: 		'textfield',
                	id: 		'target-concept',
            		name: 		'target concept',
            		allowBlank: false,
                	fieldLabel: 'Target Concept',
                	disabled: 	true,
                	value: 		target
                }, {
                	xtype: 		'textarea',
                	id: 		'bridge-description',
            		name: 		'description',
            		height: 	100,
            		value: 		description,
                	fieldLabel: 'Description'
                }]
    	    }, {
    			xtype: 		'grid',
            	id : 		'rulesGrid',
                title:		'Rules',
                store: 		rulesStore,
                width:		580,
                height: 	200,
    	        tbar: [{
    	        	iconCls: 'add',
    	        	text: 'add Rule',
    	        	handler: function() {
    	        	
    	        	   var addRuleWindow = new Ext.Window({
    	                   id: 		'addRuleWindow',
    	                   width: 		590,
    	                   title: 		'Add new Rule',
    	                   modal: 		true,
    	                   resizable: 	true,
    	                   autoHeight: 	true,
    	                   items: [{
    	                	   xtype:		'form',
    	                	   id: 		'addRuleForm',
	    	                   labelWidth: 100,
	    	           	       frame: 		false,
	    	           	       title: 		'Add your requirements',
	    	           	       bodyStyle:	'padding:5px 5px 0',
	    	           	       width: 		580,
	    	           	       defaults: 	{width: 420},
	    	           	       items: [{
	    	           	    	   xtype: 		'textfield',
	    	           	    	   id: 			'ruleName',
	    	           	    	   name: 		'ruleName',
	    	           	    	   allowBlank: 	false,
	    	           	    	   fieldLabel: 	'Name'
    	                       },{
    	                    	   xtype: 		'textarea',
    	                    	   id: 			'ruleRequirements',
    	                    	   name: 		'ruleRequirements',
    	                    	   height: 		100,
    	                    	   fieldLabel: 'Requirements'
    	                       }],
    	                       buttons: [{
    	                    	   text: 	'ok',
    	                    	   handler: function() {
    	                    	   		rulesStore.add(new Data({name: Ext.getCmp('ruleName').getValue(), comment: Ext.getCmp('ruleRequirements').getValue(), rule: '', added: true}));
    	                    	   		addRuleWindow.hide();
    	                           }
    	                       }, {
    	                    	   text:	'cancel',
    	                    	   handler: function() {
    	                    	   		addRuleWindow.hide();
    	                       	   }
    	                       }]
    	                   }]
    	        	   });
    	               
    	        	   addRuleWindow.on('hide', function(){
    	        		   addRuleWindow.destroy(true);
    	        		   delete addRuleWindow;
    	        	   });
    	        	   addRuleWindow.show();
    	        	}.bind(this)
    	        }],
                autoExpandColumn: 'nameCol',
                columns: [
                     {id: 'nameCol', header: 'Name', sortable: true, dataIndex: 'name'}
//                     {id: 'ruleCol', header: 'Rule', sortable: false, dataIndex: 'rule'}
                ]
            }],
    	    buttons: [{
    	    	text: 	'apply',
    	    	handler: function() {
    	    		
					var commentWindow = this.getCommentWindow();
					commentWindow.show();
					Ext.getCmp('apply-comment').on('click', function() {
	    	    		this.startProgressBar('Updating Semantic Bridge ...', '... sending Updates ...');
	    	    		
	    	    		/* Eigenschaften der Semantische Brücke übernehmen */
	    	    		var message = {
		    				"id"			: "edit:::semantic bridge:::" + url,
		    				"command"		: "edit",
		    				"type"			: "semantic bridge",
		    				"name"			: Ext.getCmp('bridge-name').getValue(),
		    				"description"	: Ext.getCmp('bridge-description').getValue(),
		    				"comment"		: Ext.getCmp('editInformationComment').getValue()
		    			};
	    	    		this.addMessageToServer(message);
	    	    		
	    	    		/* Anforderung für neue Regeln an den Server schicken */
	    	    		rulesStore.each(function(record) {
	    	    			if (record.get('added')) {
			    	    		var message = {
			    	    			"id"			: "addRules:::semantic bridge:::" + url,
			    	    			"command"		: "add",
			    	    			"type"			: "rule",
			    	    			"name"			: record.get('name'),
			    	    			"comment"		: record.get('comment')
			    	    		}
			    	    		this.addMessageToServer(message);
	    	    			}
	    				}.bind(this));
	    	    		
						/* schlussendliche als neue Version abspeichern */
						var message = {
							"id"			: "newVersion:::semantic bridge:::" + url,
							"command"		: "newVersion",
							"type"			: "semantic bridge",
							"name"			: name,
							"version"		: record.get('version')
						};
		    	        this.addMessageToServer(message);
		    	        
		    	        /* abschicken */
		    	        this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
	
		    	        this.stopProgressBar(true);
	
		    	        commentWindow.hide();
		    	        window.hide();
					}.bind(this));
    	    	}.bind(this)
    	    }, {
    	    	text: 'cancel',
    	    	handler: function() {
    	    		window.hide();
    	    	}
    	    }],
            height: 450
        });
        window.on('hide', function(){
        	window.destroy(true);
			delete window;
		});
		
        // Show the window
        window.show();
	},
	
	/**
	 * Builds the JSON value from the data source of datastore
	 */
	buildValue: function(items) {
		this.ontologyStore.commitChanges();
		this.bridgeStore.commitChanges();
		
		if (this.ontologyStore.getCount() == 0 && this.bridgeStore.getCount() == 0) {
			return "";
		}
		
		var jsonString = "[";
		for (var i = 0; i < this.ontologyStore.getCount(); i++) {
			var data = this.ontologyStore.getAt(i);
			jsonString += "{";	
			for (var j = 0; j < items.length; j++) {
				var key = items[j].id();
				jsonString += key + ':' + data.get(key).toJSON();
				if (j < (items.length - 1)) {
					jsonString += ", ";
				}
			}
			jsonString += "}";
			if (i < (this.ontologyStore.getCount() - 1) || this.bridgeStore.getCount() > 0) {
				jsonString += ", ";
			}
		}
		for (var i = 0; i < this.bridgeStore.getCount(); i++) {
			var data = this.bridgeStore.getAt(i);
			jsonString += "{";	
			for (var j = 0; j < items.length; j++) {
				var key = items[j].id();
				jsonString += key + ':' + data.get(key).toJSON();
				if (j < (items.length - 1)) {
					jsonString += ", ";
				}
			}
			jsonString += "}";
			if (i < (this.bridgeStore.getCount() - 1)) {
				jsonString += ", ";
			}
		}
		jsonString += "]";
		
		jsonString = "{'totalCount':" + (this.ontologyStore.getCount() + this.bridgeStore.getCount()).toJSON() + 
			", 'items':" + jsonString + "}";
		
		return jsonString;
	},
	
	// other Workarounds
	FireFox3Fix : function(type){
		var tmpZseed = 9000;
	    if(Ext.isGecko3){ // TODO Temp Fix: FF3
	        if(type){
	            tmpZseed = Ext.WindowMgr.zseed;
	            Ext.WindowMgr.zseed = 9900;
	        } else {
	            Ext.WindowMgr.zseed = tmpZseed;
	        }
	    }
	}
});