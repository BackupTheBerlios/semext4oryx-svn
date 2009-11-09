/**
 * @author martin.czuchra
 */

XMLNS = {
	ATOM:	"http://www.w3.org/2005/Atom",
	XHTML:	"http://www.w3.org/1999/xhtml",
	ERDF:	"http://purl.org/NET/erdf/profile",
	RDFS:	"http://www.w3.org/2000/01/rdf-schema#",
	RDF:	"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	RAZIEL: "http://b3mn.org/Raziel",

	SCHEMA: ""
};

//TODO kann kickstart sich vielleicht auch um die erzeugung von paketen/
// namespaces k�mmern? z.b. requireNamespace("ORYX.Core.SVG");
var Kickstart = {
 	started: false,
	callbacks: [],
	alreadyLoaded: [],
	PATH: '',

	load: function() { Kickstart.kick(); },

	kick: function() {
		//console.profile("loading");
		if(!Kickstart.started) {
			Kickstart.started = true;
			Kickstart.callbacks.each(function(callback){
				// call the registered callback asynchronously.
				window.setTimeout(callback, 1);
			});
		}
	},

	register: function(callback) {
		//TODO Add some mutual exclusion between kick and register calls.
		with(Kickstart) {
			if(started) window.setTimeout(callback, 1);
			else Kickstart.callbacks.push(callback)
		}
	},

	/**
	 * Loads a js, assuring that it has only been downloaded once.
	 * @param {String} url the script to load.
	 */
	require: function(url) {
		// if not already loaded, include it.
		if(Kickstart.alreadyLoaded.member(url))
			return false;
		return Kickstart.include(url);
	},

	/**
	 * Loads a js, regardless of whether it has only been already downloaded.
	 * @param {String} url the script to load.
	 */
	include: function(url) {

		// prepare a script tag and place it in html head.
		var head = document.getElementsByTagNameNS(XMLNS.XHTML, 'head')[0];
		var s = document.createElementNS(XMLNS.XHTML, "script");
		s.setAttributeNS(XMLNS.XHTML, 'type', 'text/javascript');
	   	s.src = Kickstart.PATH + url;

		//TODO macht es sinn, dass neue skript als letztes kind in den head
		// einzubinden (stichwort reihenfolge der skript tags)?
	   	head.appendChild(s);

		// remember this url.
		Kickstart.alreadyLoaded.push(url);

		return true;
	}
}

// register kickstart as the new onload event listener on current window.
// previous listener(s) are triggered to launch with kickstart.
Event.observe(window, 'load', Kickstart.load);/**
 * @author martin.czuchra
 */

var ERDF = {

	LITERAL: 0x01,
	RESOURCE: 0x02,
	DELIMITERS: ['.', '-'],
	HASH: '#',
	HYPHEN: "-",

	schemas: [],
	callback: undefined,
	log: undefined,

	init: function(callback) {
		
		// init logging.
		//ERDF.log = Log4js.getLogger("oryx");
		//ERDF.log.setLevel(Log4js.Level.ALL);
		//ERDF.log.addAppender(new ConsoleAppender(ERDF.log, false));

		//if(ERDF.log.isTraceEnabled())
		//	ERDF.log.trace("ERDF Parser is initialized.");

		// register callbacks and default schemas.
		ERDF.callback = callback;
		ERDF.registerSchema('schema', XMLNS.SCHEMA);
		ERDF.registerSchema('rdfs', XMLNS.RDFS);
	},

	run: function() {

		//if(ERDF.log.isTraceEnabled())
		//	ERDF.log.trace("ERDF Parser is running.");

		// do the work.
		return ERDF._checkProfile() && ERDF.parse();
	},
	
	parse: function() {
		
		//(ERDF.log.isDebugEnabled())
		//	ERDF.log.debug("Begin parsing document metadata.");
		
		// time measuring
		ERDF.__startTime = new Date();

		var bodies = document.getElementsByTagNameNS(XMLNS.XHTML, 'body');
		var subject = {type: ERDF.RESOURCE, value: ''};

		var result = ERDF._parseDocumentMetadata() &&
			ERDF._parseFromTag(bodies[0], subject);
			
		// time measuring
		ERDF.__stopTime = new Date();

		var duration = (ERDF.__stopTime - ERDF.__startTime)/1000.;
		//alert('ERDF parsing took ' + duration + ' s.');
		
		return result;
	},
	
	_parseDocumentMetadata: function() {

		// get links from head element.
		var heads = document.getElementsByTagNameNS(XMLNS.XHTML, 'head');
		var links = heads[0].getElementsByTagNameNS(XMLNS.XHTML, 'link');
		var metas = heads[0].getElementsByTagNameNS(XMLNS.XHTML, 'meta');

		// process links first, since they could contain schema definitions.
		$A(links).each(function(link) {
			var properties = link.getAttribute('rel');
			var reversedProperties = link.getAttribute('rev');
			var value = link.getAttribute('href');
			
			ERDF._parseTriplesFrom(
				ERDF.RESOURCE, '',
				properties,
				ERDF.RESOURCE, value);
				
			ERDF._parseTriplesFrom(
				ERDF.RESOURCE, value,
				reversedProperties,
				ERDF.RESOURCE, '');
		});

		// continue with metas.
		$A(metas).each(function(meta) {
			var property = meta.getAttribute('name');
			var value = meta.getAttribute('content');
			
			ERDF._parseTriplesFrom(
				ERDF.RESOURCE, '',
				property,
				ERDF.LITERAL, value);
		});

		return true;
	},
	
	_parseFromTag: function(node, subject, depth) {
		
		// avoid parsing non-xhtml content.
		if(node.namespaceURI != XMLNS.XHTML) { return; }
		
		// housekeeping.
		if(!depth) depth=0;
		var id = node.getAttribute('id');

		// some logging.
		//if(ERDF.log.isTraceEnabled())
		//	ERDF.log.trace(">".times(depth) + " Parsing " + node.nodeName + " ("+node.nodeType+") for data on " +
		//		((subject.type == ERDF.RESOURCE) ? ('&lt;' + subject.value + '&gt;') : '') +
		//		((subject.type == ERDF.LITERAL) ? '"' + subject.value + '"' : ''));
		
		/* triple finding! */
		
		// in a-tags...
		if(node.nodeName.endsWith(':a') || node.nodeName == 'a') {
			var properties = node.getAttribute('rel');
			var reversedProperties = node.getAttribute('rev');
			var value = node.getAttribute('href');
			var title = node.getAttribute('title');
			var content = node.textContent;

			// rel triples
			ERDF._parseTriplesFrom(
				subject.type, subject.value,
				properties,
				ERDF.RESOURCE, value,
				function(triple) {
					var label = title? title : content;
					
					// label triples
					ERDF._parseTriplesFrom(
						triple.object.type, triple.object.value,
						'rdfs.label',
						ERDF.LITERAL, label);
				});

			// rev triples
			ERDF._parseTriplesFrom(
				subject.type, subject.value,
				reversedProperties,
				ERDF.RESOURCE, '');
				
			// type triples
			ERDF._parseTypeTriplesFrom(
				subject.type, subject.value,
				properties);

		// in img-tags...
		} else if(node.nodeName.endsWith(':img') || node.nodeName == 'img') {
			var properties = node.getAttribute('class');
			var value = node.getAttribute('src');
			var alt = node.getAttribute('alt');

			ERDF._parseTriplesFrom(
				subject.type, subject.value,
				properties,
				ERDF.RESOURCE, value,
				function(triple) {
					var label = alt;
					
					// label triples
					ERDF._parseTriplesFrom(
						triple.object.type, triple.object.value,
						'rdfs.label',
						ERDF.LITERAL, label);
				});

		}
		
		// in every tag
		var properties = node.getAttribute('class');
		var title = node.getAttribute('title');
		var content = node.textContent;
		var label = title ? title : content;
		
		// regular triples
		ERDF._parseTriplesFrom(
			subject.type, subject.value,
			properties,
			ERDF.LITERAL, label);

		if(id) subject = {type: ERDF.RESOURCE, value: ERDF.HASH+id};
		
		// type triples
		ERDF._parseTypeTriplesFrom(
			subject.type, subject.value,
			properties);

		// parse all children that are element nodes.
		var children = node.childNodes;
		if(children) $A(children).each(function(_node) {
			if(_node.nodeType == _node.ELEMENT_NODE)
				ERDF._parseFromTag(_node, subject, depth+1); });
	},
	
	_parseTriplesFrom: function(subjectType, subject, properties,
		objectType, object, callback) {
		
		if(!properties) return;
		properties.toLowerCase().split(' ').each( function(property) {
			
			//if(ERDF.log.isTraceEnabled())
			//	ERDF.log.trace("Going for property " + property);

			var schema = ERDF.schemas.find( function(schema) {
				return false || ERDF.DELIMITERS.find( function(delimiter) {
					return property.startsWith(schema.prefix + delimiter);
				});
			});
			
			if(schema && object) {
				property = property.substring(
					schema.prefix.length+1, property.length);
				var triple = ERDF.registerTriple(
					new ERDF.Resource(subject),
					{prefix: schema.prefix, name: property},
					(objectType == ERDF.RESOURCE) ?
						new ERDF.Resource(object) :
						new ERDF.Literal(object));
						
				if(callback) callback(triple);
			}
		});
	},
	
	_parseTypeTriplesFrom: function(subjectType, subject, properties, callback) {
		
		if(!properties) return;
		properties.toLowerCase().split(' ').each( function(property) {
			
			//if(ERDF.log.isTraceEnabled())
			//	ERDF.log.trace("Going for property " + property);
				
			var schema = ERDF.schemas.find( function(schema) {
				return false || ERDF.DELIMITERS.find( function(delimiter) {
					return property.startsWith(ERDF.HYPHEN + schema.prefix + delimiter);
				});
			});
			
			if(schema && subject) {
				property = property.substring(schema.prefix.length+2, property.length);
				var triple = ERDF.registerTriple(
					(subjectType == ERDF.RESOURCE) ?
						new ERDF.Resource(subject) :
						new ERDF.Literal(subject),
					{prefix: 'rdf', name: 'type'},
					new ERDF.Resource(schema.namespace+property));
				if(callback) callback(triple);
			}
		});
	},
	
	/**
	 * Checks for ERDF profile declaration in head of document.
	 */
	_checkProfile: function() {

		// get profiles from head element.
		var heads = document.getElementsByTagNameNS(XMLNS.XHTML, 'head');
		var profiles = heads[0].getAttribute("profile");
		var found = false;

		// if erdf profile is contained.
		if(profiles && profiles.split(" ").member(XMLNS.ERDF)) {

			// pass check.
			//if(ERDF.log.isTraceEnabled())
			//	ERDF.log.trace("Found ERDF profile " + XMLNS.ERDF);
			return true;
			
		} else {
		
			// otherwise fail check.
			//if(ERDF.log.isFatalEnabled())
			//	ERDF.log.fatal("No ERDF profile found.");
			return false;
		}
	},
	
	__stripHashes: function(s) {
		return (s && s.substring(0, 1)=='#') ? s.substring(1, s.length) : s;
	},
	
	registerSchema: function(prefix, namespace) {
		
		// TODO check whether already registered, if so, complain.
		ERDF.schemas.push({
			prefix: prefix,
			namespace: namespace
		});
		
		//if(ERDF.log.isDebugEnabled())
		//	ERDF.log.debug("Prefix '"+prefix+"' for '"+namespace+"' registered.");
	},
	
	registerTriple: function(subject, predicate, object) {
		
		// if prefix is schema, this is a schema definition.
		if(predicate.prefix.toLowerCase() == 'schema')
			this.registerSchema(predicate.name, object.value);
			
		var triple = new ERDF.Triple(subject, predicate, object);
		ERDF.callback(triple);
		
		//if(ERDF.log.isInfoEnabled())
		//	ERDF.log.info(triple)
		
		// return the registered triple.
		return triple;
	},
	
	__enhanceObject: function() {
		
		/* Resource state querying methods */
		this.isResource = function() {
			return this.type == ERDF.RESOURCE };
		this.isLocal = function() {
			return this.isResource() && this.value.startsWith('#') };
		this.isCurrentDocument = function() {
			return this.isResource() && (this.value == '') };
		
		/* Resource getter methods.*/
		this.getId = function() {
			return this.isLocal() ? ERDF.__stripHashes(this.value) : false; };

		/* Liiteral state querying methods  */
		this.isLiteral = function() {
			return this.type == ERDF.LIITERAL };
	},
	
	serialize: function(literal) {
		
		if(!literal){
			return "";
		}else if(literal.constructor == String) {
			return literal;
		} else if(literal.constructor == Boolean) {
			return literal? 'true':'false';
		} else {
			return literal.toString();
		}
	}
};


ERDF.Triple = function(subject, predicate, object) {
	
	this.subject = subject;
	this.predicate = predicate;
	this.object = object;
	
	this.toString = function() {
		
		return "[ERDF.Triple] " +
			this.subject.toString() + ' ' +
			this.predicate.prefix + ':' + this.predicate.name + ' ' +
			this.object.toString();
		};
};

ERDF.Resource = function(uri) {
	
	this.type = ERDF.RESOURCE;
	this.value = uri;
	ERDF.__enhanceObject.apply(this);
	
	this.toString = function() {
		return '&lt;' + this.value + '&gt;';
	}
	
};

ERDF.Literal = function(literal) {
	
	this.type = ERDF.LITERAL;
	this.value = ERDF.serialize(literal);
	ERDF.__enhanceObject.apply(this);

	this.toString = function() {
		return '"' + this.value + '"';
	}
};/**
 * @author martin.czuchra
 */

/*
 * Save and triple generation behaviour. Use this area to configure
 * data management to your needs.
 */
var USE_ASYNCHRONOUS_REQUESTS =		true;
var DISCARD_UNUSED_TRIPLES =			true;
var PREFER_SPANS_OVER_DIVS =			true;
var PREFER_TITLE_OVER_TEXTNODE =		false;
var RESOURCE_ID_PREFIX =				'resource';

var SHOW_DEBUG_ALERTS_WHEN_SAVING =	false;
var SHOW_EXTENDED_DEBUG_INFORMATION =	false;

/*
 * Back end specific workarounds.
 */

var USE_ARESS_WORKAROUNDS =		true;

/*
 * Data management constants. Do not change these, as they are used
 * both internally and externally to communicate on events and to identify
 * command object actions in triple production and embedding rules.
 */

// Resource constants
var RESOURCE_CREATED =			0x01;
var RESOURCE_REMOVED =			0x02;
var RESOURCE_SAVED =				0x04;
var RESOURCE_RELOADED =			0x08;
var RESOURCE_SYNCHRONIZED = 		0x10;

// Triple constants
var TRIPLE_REMOVE =	0x01;
var TRIPLE_ADD =		0x02;
var TRIPLE_RELOAD =	0x04;
var TRIPLE_SAVE =		0x08;

var PROCESSDATA_REF = 'processdata';

// HTTP status code constants
//
//// 2xx
//const 200_OK =			'Ok';
//const 201_CREATED =		'Created';
//const 202_ACCEPTED =		'Accepted';
//const 204_NO_CONTENT =	'No Content';
//
//// 3xx
//const 301_MOVED_PERMANENTLY =	'Moved Permanently';
//const 302_MOVED_TEMPORARILY =	'Moved Temporarily';
//const 304_NOT_MODIFIED =		'Not Modified';
//
//// 4xx
//const 400_BAD_REQUEST =	'Bad Request';
//const 401_UNAUTHORIZED =	'Unauthorized';
//const 403_FORBIDDEN =		'Forbidden';
//const 404_NOT_FOUND =		'Not Found';
//const 409_CONFLICT =		'Conflict';
//
//// 5xx
//const 500_INTERNAL_SERVER_ERROR =		'Internal Server Error';
//const 501_NOT_IMPLEMENTED =			'Not Implemented';
//const 502_BAD_GATEWAY =				'Bad Gateway';
//const 503_SERVICE_UNAVAILABLE =		'Service Unavailable';
//
/**
 * The Data Management object. Use this one when interacting with page internal
 * data. Initialize data management by DataManager.init();
 */
var DataManager = {
	
	/**
	 * The init method should be called once in the DataManagers lifetime.
	 * It causes the DataManager to initialize itself, the erdf parser, do all
	 * neccessary registrations and configurations, to run the parser and
	 * from then on deliver all resulting triples.
	 * No parameters needed are needed in a call to this method.
	 */
	init: function() {
		ERDF.init(DataManager._registerTriple);
		DataManager.__synclocal();
	},
	
	/**
	 * This triple array is meant to be the whole knowledge of the DataManager.
	 */
	_triples: [],
	
	/**
	 * This method is meant for callback from erdf parsing. It is not to be
	 * used in another way than to add triples to the triple store.
	 * @param {Object} triple the triple to add to the triple store.
	 */
	_registerTriple: function(triple) {
		DataManager._triples.push(triple)
	},
	
	/**
	 * The __synclocal method is for internal usage only.
	 * It performs synchronization with the local document, that is, the triple
	 * store is adjustet to the content of the document, which could have been
	 * changed by any other applications running on the same page.
	 */
	__synclocal: function() {
		DataManager._triples = [];
		ERDF.run();
	},
	
	/**
	 * Makes the shape passed into this method synchronize itself with the DOM.
	 * This method returns the shapes resource object for further manipulation.
	 * @param {Object} shape
	 */
	__synchronizeShape: function(shape) {

		var r = ResourceManager.getResource(shape.resourceId);
		var serialize = shape.serialize();

		// store all serialize values
		serialize.each( function(ser) {
			
			var resource = (ser.type == 'resource');
			var _triple = new ERDF.Triple(
				new ERDF.Resource(shape.resourceId),
				{prefix: ser.prefix, name: ser.name},
				resource ?
					new ERDF.Resource(ser.value) :
					new ERDF.Literal(ser.value)
			);
			DataManager.setObject(_triple);
		});
		
		return r;
	},

	__storeShape: function(shape) {
		
		// first synchronize the shape,
		var resource = DataManager.__synchronizeShape(shape);
		
		// then save the synchronized dom.
		resource.save();
	},
		
	__forceExistance: function(shape) {
		
		if(!$(shape.resourceId)) {
			
			if(!$$('.' + PROCESSDATA_REF)[0])
				DataManager.graft(XMLNS.XHTML,
					document.getElementsByTagNameNS(XMLNS.XHTML, 'body').item(0), ['div', {'class': PROCESSDATA_REF, 'style':'display:none;'}]);
				
			// object is literal
			DataManager.graft(XMLNS.XHTML,
				$$('.' + PROCESSDATA_REF)[0], [
				
				'div', {'id': shape.resourceId}
			]);
			
		} else {
			var resource = $(shape.resourceId)
			var children = $A(resource.childNodes)
			children.each( function(child) {
				resource.removeChild(child);
			});
		};
	},
	
	__persistShape: function(shape) {

		// a shape serialization.
		var shapeData = shape.serialize();
		
		// initialize a triple array and construct a shape resource
		// to be used in triple generation.
		var triplesArray = [];
		var shapeResource = new ERDF.Resource(shape.resourceId);

		// remove all triples for this particular shape's resource
		DataManager.removeTriples( DataManager.query(
			shapeResource, undefined, undefined));

		// for each data set in the shape's serialization
		shapeData.each( function(data) {

			// construct a triple's value
			var value = (data.type == 'resource') ?
				new ERDF.Resource(data.value) :
				new ERDF.Literal(data.value);

			// construct triple and add it to the DOM.
			DataManager.addTriple( new ERDF.Triple(
				shapeResource,
				{prefix: data.prefix, name: data.name},
				value
			));
		});
	},
	
	__persistDOM: function(facade) {

		// getChildShapes gets all shapes (nodes AND edges), deep flag
		// makes it return a flattened child hierarchy.
		
		var canvas = facade.getCanvas();
		var shapes = canvas.getChildShapes(true);
		var result = '';
		
		// persist all shapes.
		shapes.each( function(shape) {
			DataManager.__forceExistance(shape);
		});
		//DataManager.__synclocal();
		
		DataManager.__renderCanvas(facade);
		result += DataManager.serialize(
				$(ERDF.__stripHashes(facade.getCanvas().resourceId)), true);
				
		shapes.each( function(shape) {
			
			DataManager.__persistShape(shape);
			result += DataManager.serialize(
				$(ERDF.__stripHashes(shape.resourceId)), true);
		});
		
		//result += DataManager.__renderCanvas(facade);
		
		return result;
	},

	__renderCanvas: function(facade) {

		var canvas = facade.getCanvas();
		var stencilSets = facade.getStencilSets();
		var shapes = canvas.getChildShapes(true);
		
		DataManager.__forceExistance(canvas);
		
		DataManager.__persistShape(canvas);
		
		var shapeResource = new ERDF.Resource(canvas.resourceId);

		// remove all triples for this particular shape's resource
		DataManager.removeTriples( DataManager.query(
			shapeResource, undefined, undefined));

		DataManager.addTriple( new ERDF.Triple(
			shapeResource,
			{prefix: "oryx", name: "mode"},
			new ERDF.Literal("writable")
		));

		DataManager.addTriple( new ERDF.Triple(
			shapeResource,
			{prefix: "oryx", name: "mode"},
			new ERDF.Literal("fullscreen")
		));

		stencilSets.values().each(function(stencilset) {
			DataManager.addTriple( new ERDF.Triple(
				shapeResource,
				{prefix: "oryx", name: "stencilset"},
				new ERDF.Resource(stencilset.source())
			));
			
			stencilset.extensions().keys().each(function(extension) {
				DataManager.addTriple( new ERDF.Triple(
					shapeResource,
					{prefix: "oryx", name: "ssextension"},
					new ERDF.Literal(extension)
				));
			});
		});
						
		shapes.each(function(shape) {
			DataManager.addTriple( new ERDF.Triple(
				shapeResource,
				{prefix: "oryx", name: "render"},
				new ERDF.Resource("#" + shape.resourceId)
			));
		});
	},

	__counter: 0,
	__provideId: function() {
		
		while($(RESOURCE_ID_PREFIX+DataManager.__counter))
			DataManager.__counter++;
			
		return RESOURCE_ID_PREFIX+DataManager.__counter;
	},
		
	serializeDOM: function(facade) {
		
		return DataManager.__persistDOM(facade);
	},
	
	syncGlobal: function(facade) {
		
		return DataManager.__syncglobal(facade);
	},
	
	/**
	 * This method is used to synchronize local DOM with remote resources.
	 * Local changes are commited to the server, and remote changes are
	 * performed to the local document.
	 * @param {Object} facade The facade of the editor that holds certain
	 * resource representations as shapes.
	 */
	__syncglobal: function(facade) {

		// getChildShapes gets all shapes (nodes AND edges), deep flag
		// makes it return a flattened child hierarchy.
		
		var canvas = facade.getCanvas();
		var shapes = canvas.getChildShapes(true);

		// create dummy resource representations in the dom
		// for all shapes that were newly created.

		shapes.select( function(shape) {

			// select shapes without resource id.

			return !($(shape.resourceId));

		}).each( function(shape) {

			// create new resources for them.
			if(USE_ARESS_WORKAROUNDS) {
				
				/*
				 * This is a workaround due to a bug in aress. Resources are
				 * ignoring changes to raziel:type property once they are
				 * created. As long as this is not fixed, the resource is now
				 * being created using a randomly guessed id, this temporary id
				 * is then used in references and the appropriate div is being
				 * populated with properties.
				 * 
				 * AFTER THIS PHASE THE DATA IS INCONSISTENT AS REFERENCES POINT
				 * TO IDS THAT ARE UNKNOWN TO THE BACK END.
				 * 
				 * After the resource is actually created in aress, it gets an id
				 * that is persistent. All shapes are then being populated with the
				 * correct id references and stored on the server.
				 * 
				 * AFTER THE SAVE PROCESS HAS RETURNED, THE DATA IS CONSISTENT
				 * REGARDING THE ID REFERENCES AGAIN.
				 */
				
				var razielType = shape.properties['raziel-type'];
				
				var div = '<div xmlns="http://www.w3.org/1999/xhtml">' +
					'<span class="raziel-type">'+razielType+'</span></div>';

				var r = ResourceManager.__createResource(div);
				shape.resourceId = r.id();
				
			} else {
		
				var r = ResourceManager.__createResource();
				shape.resourceId = r.id();
			}

		});

		shapes.each( function(shape) {
			
			// store all shapes.
			DataManager.__storeShape(shape);
		});
	},
	
	/**
	 * This method serializes a single div into a string that satisfies the
	 * client/server communication protocol. It ingnores all elements that have
	 * an attribute named class that includes 'transient'.
	 * @param {Object} node the element to serialize.
	 * @param {Object} preserveNamespace whether to preserve the parent's
	 *                 namespace. If you are not sure about namespaces, provide
	 *                 just the element to be serialized.
	 */
	serialize: function(node, preserveNamespace) {

		if (node.nodeType == node.ELEMENT_NODE) {
			// serialize an element node.
			
			var children = $A(node.childNodes);
			var attributes = $A(node.attributes);
			var clazz = new String(node.getAttribute('class'));
			var ignore = clazz.split(' ').member('transient');

			// ignore transients.

			if(ignore)
				return '';

			// start serialization.
			
			var result = '<' + node.nodeName;
			
			// preserve namespace?
			if(!preserveNamespace) 
				result += ' xmlns="' + (node.namespaceURI ? node.namespaceURI : XMLNS.XHTML) + '" xmlns:oryx="http://oryx-editor.org"';
			
			// add all attributes.
			
			attributes.each(function(attribute) {
				result += ' ' + attribute.nodeName + '="' +
					attribute.nodeValue + '"';});
			
			// close if no children.
			
			if(children.length == 0)
				result += '/>';
				
			else {
				
				// serialize all children.
				
				result += '>';
				children.each(function(_node) {
					result += DataManager.serialize(_node, true)});
				result += '</' + node.nodeName + '>'
			}

			return result;
			
		} else if (node.nodeType == node.TEXT_NODE) {
			
			// serialize a text node.
			return  node.nodeValue;
		}
		
		//TODO serialize cdata areas also.
		//TODO work on namespace awareness.
	},

	addTriple: function(triple) {

		// assert the subject is a resource
		
		if(!triple.subject.type == ERDF.LITERAL)
			throw 'Cannot add the triple ' + triple.toString() +
				' because the subject is not a resource.'
		
		// get the element which represents this triple's subject.
		var elementId = ERDF.__stripHashes(triple.subject.value);
		var element = $(elementId);
				
		// assert the subject is inside this document.
		if(!element)
			throw 'Cannot add the triple ' + triple.toString() +
				' because the subject "'+elementId+'" is not in the document.';

		if(triple.object.type == ERDF.LITERAL)

			// object is literal
			DataManager.graft(XMLNS.XHTML, element, [
				'span', {'class': (triple.predicate.prefix + "-" +
					triple.predicate.name)}, triple.object.value.escapeHTML()
			]);
			
		else {

			// object is resource
			DataManager.graft(XMLNS.XHTML, element, [
				'a', {'rel': (triple.predicate.prefix + "-" +
					triple.predicate.name), 'href': triple.object.value}
			]);
			
		}

		return true;
	},
	
	removeTriples: function(triples) {

		// alert('Removing ' +triples.length+' triples.');

		// from all the triples select those ...
		var removed = triples.select(

			function(triple) {
				
				// TODO remove also from triple store.
				// ... that were actually removed.
				return DataManager.__removeTriple(triple);
			});
		
		// sync and return removed triples.
		// DataManager.__synclocal();
		return removed;
	},
	
	removeTriple: function(triple) {
		
		// remember whether the triple was actually removed.
		var result = DataManager.__removeTriple(triple);

		// sync and return removed triples.
		// DataManager.__synclocal();
		return result;
	},

	__removeTriple: function(triple) {
		
		// assert the subject is a resource
		if(!triple.subject.type == ERDF.LITERAL)
		
			throw 'Cannot remove the triple ' + triple.toString() +
				' because the subject is not a resource.';

		// get the element which represents this triple's subject.
		var elementId = ERDF.__stripHashes(triple.subject.value);
		var element = $(elementId);

		// assert the subject is inside this document.
		if(!element)
		
			throw 'Cannot remove the triple ' + triple.toString() +
				' because the subject is not in the document.';
	  
		if(triple.object.type == ERDF.LITERAL) {
	  
  			// continue searching actively for the triple.
			var result = DataManager.__removeTripleRecursively(triple, element);
			return result;
		}
	},

	__removeTripleRecursively: function(triple, continueFrom) {  

		// return when this node is not an element node.
		if(continueFrom.nodeType != continueFrom.ELEMENT_NODE)
			return false;
		
		var classes = new String(continueFrom.getAttribute('class'));
		var children = $A(continueFrom.childNodes);
		
		if(classes.include(triple.predicate.prefix + '-' + triple.predicate.name)) {
		  
			var content = continueFrom.textContent;
			if(	(triple.object.type == ERDF.LITERAL) &&
				(triple.object.value == content))

				continueFrom.parentNode.removeChild(continueFrom);
			
			return true;
		  
		} else {
		 
			children.each(function(_node) {
			DataManager.__removeTripleRecursively(triple, _node)});
			return false;
		}

	},

	/**
	 * graft() function
	 * Originally by Sean M. Burke from interglacial.com, altered for usage with
	 * SVG and namespace (xmlns) support. Be sure you understand xmlns before
	 * using this funtion, as it creates all grafted elements in the xmlns
	 * provided by you and all element's attribures in default xmlns. If you
	 * need to graft elements in a certain xmlns and wish to assign attributes
	 * in both that and another xmlns, you will need to do stepwise grafting,
	 * adding non-default attributes yourself or you'll have to enhance this
	 * function. Latter, I would appreciate: martin�apfelfabrik.de
	 * @param {Object} namespace The namespace in which
	 * 					elements should be grafted.
	 * @param {Object} parent The element that should contain the grafted
	 * 					structure after the function returned.
	 * @param {Object} t the crafting structure.
	 * @param {Object} doc the document in which grafting is performed.
	 */
	graft: function(namespace, parent, t, doc) {
		
	    doc = (doc || (parent && parent.ownerDocument) || document);
	    var e;
	    if(t === undefined) {
	        echo( "Can't graft an undefined value");
	    } else if(t.constructor == String) {
	        e = doc.createTextNode( t );
	    } else {
	        for(var i = 0; i < t.length; i++) {
	            if( i === 0 && t[i].constructor == String ) {
					var snared = t[i].match( /^([a-z][a-z0-9]*)\.([^\s\.]+)$/i );
	                if( snared ) {
	                    e = doc.createElementNS(namespace, snared[1]);
	                    e.setAttributeNS(null, 'class', snared[2] );
	                    continue;
	                }
	                snared = t[i].match( /^([a-z][a-z0-9]*)$/i );
	                if( snared ) {
	                    e = doc.createElementNS(namespace, snared[1]);  // but no class
	                    continue;
	                }
	
	                // Otherwise:
	                e = doc.createElementNS(namespace, "span");
	                e.setAttribute(null, "class", "namelessFromLOL" );
	            }
	
	            if( t[i] === undefined ) {
	                echo("Can't graft an undefined value in a list!");
	            } else if( t[i].constructor == String || t[i].constructor == Array) {
	                this.graft(namespace, e, t[i], doc );
	            } else if(  t[i].constructor == Number ) {
	                this.graft(namespace, e, t[i].toString(), doc );
	            } else if(  t[i].constructor == Object ) {
	                // hash's properties => element's attributes
	                for(var k in t[i]) { e.setAttributeNS(null, k, t[i][k] ); }
	            } else if(  t[i].constructor == Boolean ) {
	                this.graft(namespace, e, t[i] ? 'true' : 'false', doc );
				} else
					throw "Object " + t[i] + " is inscrutable as an graft arglet.";
	        }
	    }
		
		if(parent) parent.appendChild(e);
	
	    return Element.extend(e); // return the topmost created node
	},

	setObject: function(triple) {

		/**
		 * Erwartungen von Arvid an diese Funktion:
		 * - Es existiert genau ein triple mit dem Subjekt und Praedikat,
		 *   das uebergeben wurde, und dieses haelt uebergebenes Objekt.
		 */

		var triples = DataManager.query(
			triple.subject,
			triple.predicate,
			undefined
		);
		
		DataManager.removeTriples(triples);

		DataManager.addTriple(triple);

		return true;
	},
	
	query: function(subject, predicate, object) {

		/*
		 * Typical triple.
		 *	{value: subject, type: subjectType},
		 *	{prefix: schema.prefix, name: property},
		 *	{value: object, type: objectType});
		 */	
		 	
		return DataManager._triples.select(function(triple) {
			
			var select = ((subject) ?
				(triple.subject.type == subject.type) &&
				(triple.subject.value == subject.value) : true);
			if(predicate) {
				select = select && ((predicate.prefix) ?
					(triple.predicate.prefix == predicate.prefix) : true);
				select = select && ((predicate.name) ?
					(triple.predicate.name == predicate.name) : true);
			}
			select = select && ((object) ?
				(triple.object.type == object.type) &&
				(triple.object.value == object.value) : true);
			return select;
		});
	}
}

Kickstart.register(DataManager.init);

function assert(expr, m) { if(!expr) throw m; };

function DMCommand(action, triple) {
	
	// store action and triple.
	this.action = action;
	this.triple = triple;
	
	this.toString = function() {
		return 'Command('+action+', '+triple+')';
	};
}

function DMCommandHandler(nextHandler) {
	
	/**
	 * Private method to set the next handler in the Chain of Responsibility
	 * (see http://en.wikipedia.org/wiki/Chain-of-responsibility_pattern for
	 * details).
	 * @param {DMCommandHandler} handler The handler that is next in the chain.
	 */
	this.__setNext = function(handler) {
		var _next = this.__next;
		this.__next = nextHandler;
		return _next ? _next : true;
	};
	this.__setNext(nextHandler);

	/**
	 * Invokes the next handler. If there is no next handler, this method
	 * returns false, otherwise it forwards the result of the handling.
	 * @param {Object} command The command object to be processed.
	 */
	this.__invokeNext = function(command) {
		return this.__next ? this.__next.handle(command) : false;
	};
	
	/**
	 * Handles a command. The abstract method process() is called with the
	 * command object that has been passed. If the process method catches the
	 * command (returns true on completion), the handle() method returns true.
	 * If the process() method doesn't catch the command, the next handler will
	 * be invoked.
	 * @param {Object} command The command object to be processed.
	 */
	this.handle = function(command) {
		return this.process(command) ? true : this.__invokeNext(command);
	}
	
	/**
	 * Empty process() method returning false. If javascript knew abstract
	 * class members, this would be one.
	 * @param {Object} command The command object to process.
	 */
	this.process = function(command) { return false; };
};

/**
 * This Handler manages the addition and the removal of meta elements in the
 * head of the document.
 * @param {DMCommandHandler} next The handler that is next in the chain.
 */
function MetaTagHandler(next) {
	
	DMCommandHandler.apply(this, [next]);
	this.process = function(command) {
		
		with(command.triple) {
			
			/* assert prerequisites */
			if( !(
				(subject instanceof ERDF.Resource) &&
				(subject.isCurrentDocument()) &&
				(object instanceof ERDF.Literal)
			))	return false;
		}
		
	};
};

var chain =	new MetaTagHandler();
var command = new DMCommand(TRIPLE_ADD, new ERDF.Triple(
	new ERDF.Resource(''),
	'rdf:tool',
	new ERDF.Literal('')
));

/*
if(chain.handle(command))
	alert('Handled!');
*/

ResourceManager = {
	
	__corrupt: false,
	__latelyCreatedResource: undefined,
	__listeners: $H(),
	__token: 1,
	
	addListener: function(listener, mask) {

		if(!(listener instanceof Function))
			throw 'Resource event listener is not a function!';
		if(!(mask))
			throw 'Invalid mask for resource event listener registration.';

		// construct controller and token.
		var controller = {listener: listener, mask: mask};
		var token = ResourceManager.__token++;
		
		// add new listener.
		ResourceManager.__listeners[token] = controller;
		
		// return the token generated.
		return token;
	},
	
	removeListener: function(token) {
		
		// remove the listener with the token and return it.
		return ResourceManager.__listners.remove(token);
	},
	
	__Event: function(action, resourceId) {
		this.action = action;
		this.resourceId = resourceId;
	},
	
	__dispatchEvent: function(event) {
		
		// get all listeners. for each listener, ...
		ResourceManager.__listeners.values().each(function(controller) {
			
			// .. if listener subscribed to this type of event ...
			if(event.action & controller.mask)
				return controller.listener(event);
		});
	},

	getResource: function(id) {

		// get all possible resources for this.
		id = ERDF.__stripHashes(id);
		var resources = DataManager.query(
			new ERDF.Resource('#'+id),
			{prefix: 'raziel', name: 'entry'},
			undefined
		);

		// check for consistency.
		if((resources.length == 1) && (resources[0].object.isResource())) {
			var entryUrl = resources[0].object.value;
			return new ResourceManager.__Resource(id, entryUrl);
		}

		// else throw an error message.
		throw ('Resource with id ' +id+ ' not recognized as such. ' +
			((resources.length > 1) ?
				' There is more than one raziel:entry URL.' :
				' There is no raziel:entry URL.'));

		return false;
	},

	__createResource: function(alternativeDiv) {
		
		var collectionUrls = DataManager.query(
			new ERDF.Resource(''),
			// TODO This will become raziel:collection in near future.
			{prefix: 'raziel', name: 'collection'},
			undefined
		);

		// check for consistency.
		
		if(	(collectionUrls.length == 1) &&
			(collectionUrls[0].object.isResource())) {

			// get the collection url.
			
			var collectionUrl = collectionUrls[0].object.value;
			var resource = undefined;
			
			// if there is an old id, serialize the dummy div from there,
			// otherwise create a dummy div on the fly.
			
			var serialization = alternativeDiv? alternativeDiv : 
					'<div xmlns="http://www.w3.org/1999/xhtml"></div>';
					
			ResourceManager.__request(
				'POST', collectionUrl, serialization,

				// on success
				function() {
					
					// get div and id that have been generated by the server.
					
					var response = (this.responseXML);
					var div = response.childNodes[0];
					var id = div.getAttribute('id');
					
					// store div in DOM
					if(!$$('.' + PROCESSDATA_REF)[0])
						DataManager.graft(XMLNS.XHTML,
							document.getElementsByTagNameNS(XMLNS.XHTML, 'body').item(0), ['div', {'class': PROCESSDATA_REF, 'style':'display:none;'}]);
				
					$$('.' + PROCESSDATA_REF)[0].appendChild(div.cloneNode(true));

					// parse local erdf data once more.
					
					DataManager.__synclocal();
					
					// get new resource object.

					resource = new ResourceManager.getResource(id);

					// set up an action informing of the creation.
					
					ResourceManager.__resourceActionSucceeded(
						this, RESOURCE_CREATED, undefined);
				},

				function() { ResourceManager.__resourceActionFailed(
					this, RESOURCE_CREATED, undefined);},
				false
			);
			
			return resource;
		}
		
		// else
		throw 'Could not create resource! raziel:collection URL is missing!';
		return false;

	},
	
	__Resource: function(id, url) {
		
		this.__id = id;
		this.__url = url;
		
		/*
		 * Process URL is no longer needed to refer to the shape element on the
		 * canvas. AReSS uses the id's to gather information on fireing
		 * behaviour now.
		 */
		
//		// find the process url.		
//		var processUrl = undefined;
//		
//		var urls = DataManager.query(
//			new ERDF.Resource('#'+this.__id),
//			{prefix: 'raziel', name: 'process'},
//			undefined
//		);
//		
//		if(urls.length == 0) { throw 'The resource with the id ' +id+ ' has no process url.'};
//		
//		urls.each( function(triple) {
//			
//			// if there are more urls, use the last one.
//			processUrl = triple.object.value;
//		});
//		
//		this.__processUrl = processUrl;
//
//		// convenience function for getting the process url.
//		this.processUrl = function() {
//			return this.__processUrl;
//		}


		// convenience finction for getting the id.
		this.id = function() {
			return this.__id;
		}

		// convenience finction for getting the entry url.
		this.url = function() {
			return this.__url;
		}
		
		this.reload = function() {
			var _url = this.__url;
			var _id = this.__id;
			ResourceManager.__request(
				'GET', _url, null,
				function() { ResourceManager.__resourceActionSucceeded(
					this, RESOURCE_RELOADED, _id); },
				function() { ResourceManager.__resourceActionFailed(
					this, RESURCE_RELOADED, _id); },
				USE_ASYNCHRONOUS_REQUESTS
			);
		};
		
		this.save = function(synchronize) {
			var _url = this.__url;
			var _id = this.__id;
			data = DataManager.serialize($(_id));
			ResourceManager.__request(
				'PUT', _url, data,
				function() { ResourceManager.__resourceActionSucceeded(
					this, synchronize ? RESOURCE_SAVED | RESOURCE_SYNCHRONIZED : RESOURCE_SAVED, _id); },
				function() { ResourceManager.__resourceActionFailed(
					this, synchronize ? RESOURCE_SAVED | RESOURCE_SYNCHRONIZED : RESOURCE.SAVED, _id); },
				USE_ASYNCHRONOUS_REQUESTS
			);
		};
		
		this.remove = function() {
			var _url = this.__url;
			var _id = this.__id;
			ResourceManager.__request(
				'DELETE', _url, null,
				function() { ResourceManager.__resourceActionSucceeded(
					this, RESOURCE_REMOVED, _id); },
				function() { ResourceManager.__resourceActionFailed(
					this, RESOURCE_REMOVED, _id);},
				USE_ASYNCHRONOUS_REQUESTS
			);
		};
	},

	request: function(url, requestOptions) {

		var options = {
			method:       'get',
			asynchronous: true,
			parameters:   {}
		};

		Object.extend(options, requestOptions || {});
 		
		var params = Hash.toQueryString(options.parameters);
		if (params) 
			url += (url.include('?') ? '&' : '?') + params;
   
		return ResourceManager.__request(
			options.method, 
			url, 
			options.data, 
			(options.onSuccess instanceof Function ? function() { options.onSuccess(this); } : undefined ), 
			(options.onFailure instanceof Function ? function() { options.onFailure(this); } : undefined ), 
			options.asynchronous && USE_ASYNCHRONOUS_REQUESTS,
			options.headers);
	},
	
	__request: function(method, url, data, success, error, async, headers) {
		
		// get a request object
		var httpRequest = Try.these(

			/* do the Mozilla/Safari/Opera stuff */
			function() { return new XMLHttpRequest(); },
			
			/* do the IE stuff */
			function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
			function() { return new ActiveXObject("Microsoft.XMLHTTP") }
		);

		// if there is no request object ...
        if (!httpRequest) {
			if(!this.__corrupt)
				throw 'This browser does not provide any AJAX functionality. You will not be able to use the software provided with the page you are viewing. Please consider installing appropriate extensions.';
			this.__corrupt = true;
			return false;
        }
		
		if(success instanceof Function)
			httpRequest.onload = success;
		if(error instanceof Function) {
			httpRequest.onerror = error;
		}
		
		var h = $H(headers)
		h.keys().each(function(key) {
			
			httpRequest.setRequestHeader(key, h[key]);
		}); 
		
		try {

			if(SHOW_DEBUG_ALERTS_WHEN_SAVING)
			
				alert(method + ' ' + url + '\n' +
					SHOW_EXTENDED_DEBUG_INFORMATION ? data : '');

			// TODO Remove synchronous calls to the server as soon as xenodot
			// handles asynchronous requests without failure.
	        httpRequest.open(method, url, !async?false:true);
	        httpRequest.send(data);
			
		} catch(e) {
			return false;
		}
		return true;
    },

	__resourceActionSucceeded: function(transport, action, id) {
		
		var status = transport.status;
		var response = transport.responseText;
		
		if(SHOW_DEBUG_ALERTS_WHEN_SAVING)

			alert(status + ' ' + url + '\n' +
				SHOW_EXTENDED_DEBUG_INFORMATION ? data : '');

		// if the status code is not in 2xx, throw an error.
		if(status >= 300)
			throw 'The server responded with an error: ' + status + '\n' + (SHOW_EXTENDED_DEBUG_INFORMATION ? + data : 'If you need additional information here, including the data sent by the server, consider setting SHOW_EXTENDED_DEBUG_INFORMATION to true.');

		switch(action) {
			
			case RESOURCE_REMOVED:

				// get div and id
				var response = (transport.responseXML);
				var div = response.childNodes[0];
				var id = div.getAttribute('id');
				
				// remove the resource from DOM
				var localDiv = document.getElementById(id);
				localDiv.parentNode.removeChild(localDiv);
				break;

			case RESOURCE_CREATED:

				// nothing remains to be done.
				break;
	
			case RESOURCE_SAVED | RESOURCE_SYNCHRONIZED:

				DataManager.__synclocal();

			case RESOURCE_SAVED:

				// nothing remains to be done.
				break;

			case RESOURCE_RELOADED:
			
				// get div and id
				var response = (transport.responseXML);
				var div = response.childNodes[0];
				var id = div.getAttribute('id');
				
				// remove the local resource representation from DOM
				var localDiv = document.getElementById(id)
				localDiv.parentNode.removeChild(localDiv);
				
				// store div in DOM
				if(!$$(PROCESSDATA_REF)[0])
					DataManager.graft(XMLNS.XHTML,
						document.getElementsByTagNameNS(XMLNS.XHTML, 'body').item(0), ['div', {'class': PROCESSDATA_REF, 'style':'display:none;'}]);
				
				$$(PROCESSDATA_REF)[0].appendChild(div.cloneNode(true));
				DataManager.__synclocal();
				break;

			default:
				DataManager.__synclocal();

		}
		 
		// dispatch to all listeners ...
		ResourceManager.__dispatchEvent(

			// ... an event describing the change that happened here.
			new ResourceManager.__Event(action, id)
		);
	},

	__resourceActionFailed: function(transport, action, id) {
		throw "Fatal: Resource action failed. There is something horribly " +
			"wrong with either the server, the transport protocol or your " +
			"online status. Sure you're online?";
	}
}/**
 * @author martin.czuchra
 */
ORYX.CONFIG = {
	
	VERSION_URL:				ORYX.PATH + "VERSION",
	LICENSE_URL:				ORYX.PATH + "LICENSE",
	
	/* Editor-Mode */
	MODE_READONLY:				"readonly",
	MODE_FULLSCREEN:			"fullscreen",
		
	/* Plugins */
	PLUGINS_ENABLED:			true,
	PLUGINS_CONFIG:				"plugins.xml",
	PLUGINS_FOLDER:				"Plugins/",
	PDF_EXPORT_URL:				"/oryx/pdf",
	PNML_EXPORT_URL:			"/oryx/pnml",
	SIMPLE_PNML_EXPORT_URL:		"/oryx/simplepnmlexporter",
	DESYNCHRONIZABILITY_URL:	"/oryx/desynchronizability",
	IBPMN2BPMN_URL:				"/oryx/ibpmn2bpmn",
	SYNTAXCHECKER_URL:			"/oryx/syntaxchecker",
	VALIDATOR_URL:				"/oryx/validator",
	AUTO_LAYOUTER_URL:			"/oryx/layouter",
	SS_EXTENSIONS_FOLDER:		"/oryx/stencilsets/extensions/",
	SS_EXTENSIONS_CONFIG:		"/oryx/stencilsets/extensions/extensions.json",	
	ORYX_NEW_URL:				"/new",	
	STEP_THROUGH:				"/oryx/stepthrough",
	STEP_THROUGH_CHECKER:		"/oryx/stepthroughchecker",
	XFORMS_EXPORT_URL:			"/oryx/xformsexport",
	XFORMS_EXPORT_ORBEON_URL:	"/oryx/xformsexport-orbeon",
	XFORMS_IMPORT_URL:			"/oryx/xformsimport",
	BPEL_EXPORT_URL:			"/oryx/bpelexporter",
	BPEL4CHOR_EXPORT_URL:		"/oryx/bpel4chorexporter",
	TREEGRAPH_SUPPORT:			"/oryx/treegraphsupport",
	XPDL4CHOR2BPEL4CHOR_TRANSFORMATION_URL: "/oryx/xpdl4chor2bpel4chor",
	/* Diplomarbeit */
	SEMANTIC_EXTENSION_URL:		"/oryx/semanticext",
	SEMANTIC_BRIDGE_URL:		"/oryx/semanticbridge",
	
	
	/* Namespaces */
	NAMESPACE_ORYX:				"http://www.b3mn.org/oryx",
	NAMESPACE_SVG:				"http://www.w3.org/2000/svg",

	/* UI */
	CANVAS_WIDTH:				1485, 
	CANVAS_HEIGHT:				1050,
	CANVAS_RESIZE_INTERVAL:		300,
	SELECTED_AREA_PADDING:		4,
	CANVAS_BACKGROUND_COLOR:	"none",
	GRID_DISTANCE:				30,
	GRID_ENABLED:				true,
	ZOOM_OFFSET:				0.1,
	DEFAULT_SHAPE_MARGIN:		60,
	SCALERS_SIZE:				7,
	MINIMUM_SIZE:				20,
	MAXIMUM_SIZE:				10000,
	OFFSET_MAGNET:				15,
	OFFSET_EDGE_LABEL_TOP:		14,
	OFFSET_EDGE_LABEL_BOTTOM:	12,
	COPY_MOVE_OFFSET:			30,
	
	BORDER_OFFSET:				14,

	/* Shape-Menu Align */
	SHAPEMENU_RIGHT:			"Oryx_Right",
	SHAPEMENU_BOTTOM:			"Oryx_Bottom",
	SHAPEMENU_LEFT:				"Oryx_Left",
	SHAPEMENU_TOP:				"Oryx_Top",

	/* Property type names */
	TYPE_STRING:				"string",
	TYPE_BOOLEAN:				"boolean",
	TYPE_INTEGER:				"integer",
	TYPE_FLOAT:					"float",
	TYPE_COLOR:					"color",
	TYPE_DATE:					"date",
	TYPE_CHOICE:				"choice",
	TYPE_URL:					"url",
	TYPE_COMPLEX:				"complex",
	TYPE_TEXT:					"text",
	
	/* Vertical line distance of multiline labels */
	LABEL_LINE_DISTANCE:		2,
	LABEL_DEFAULT_LINE_HEIGHT:	12,

	/* Editor constants come here */
	EDITOR_ALIGN_BOTTOM:		0x01,
	EDITOR_ALIGN_MIDDLE:		0x02,
	EDITOR_ALIGN_TOP:			0x04,
	EDITOR_ALIGN_LEFT:			0x08,
	EDITOR_ALIGN_CENTER:		0x10,
	EDITOR_ALIGN_RIGHT:			0x20,

	/* Event types */
	EVENT_MOUSEDOWN:			"mousedown",
	EVENT_MOUSEUP:				"mouseup",
	EVENT_MOUSEOVER:			"mouseover",
	EVENT_MOUSEOUT:				"mouseout",
	EVENT_MOUSEMOVE:			"mousemove",
	EVENT_DBLCLICK:				"dblclick",
	EVENT_KEYDOWN:				"keydown",
	EVENT_KEYUP:				"keyup",

	EVENT_LOADED:				"editorloaded",
	
	EVENT_EXECUTE_COMMANDS:			"executeCommands",
	EVENT_STENCIL_SET_LOADED:		"stencilSetLoaded",
	EVENT_SELECTION_CHANGED:		"selectionchanged",
	EVENT_CANVAS_SHAPEADDED:		"shapeadded",
	EVENT_PROPERTY_CHANGED:			"propertyChanged",
	EVENT_DRAGDROP_START:			"dragdrop.start",
	EVENT_DRAGDROP_END:				"dragdrop.end",
	EVENT_DRAGDOCKER_DOCKED:		"dragDocker.docked",
	EVENT_HIGHLIGHT_SHOW:			"highlight.showHighlight",
	EVENT_HIGHLIGHT_HIDE:			"highlight.hideHighlight",
	EVENT_LOADING_ENABLE:			"loading.enable",
	EVENT_LOADING_DISABLE:			"loading.disable",
	EVENT_LOADING_STATUS:			"loading.status",
	EVENT_OVERLAY_SHOW:				"overlay.show",
	EVENT_OVERLAY_HIDE:				"overlay.hide",
	EVENT_ARRANGEMENT_TOP:			"arrangement.setToTop",
	EVENT_ARRANGEMENT_BACK:			"arrangement.setToBack",
	EVENT_ARRANGEMENT_FORWARD:		"arrangement.setForward",
	EVENT_ARRANGEMENT_BACKWARD:		"arrangement.setBackward",
	EVENT_PROPWINDOW_PROP_CHANGED:	"propertyWindow.propertyChanged",
	EVENT_LAYOUT_ROWS:				"layout.rows",
	EVENT_LAYOUT_BPEL:				"layout.BPEL",
	EVENT_LAYOUT_BPEL_VERTICAL:     "layout.BPEL.vertical",
	EVENT_LAYOUT_BPEL_HORIZONTAL:   "layout.BPEL.horizontal",
	EVENT_LAYOUT_BPEL_SINGLECHILD:  "layout.BPEL.singlechild",
	EVENT_LAYOUT_BPEL_AUTORESIZE:	"layout.BPEL.autoresize",
	EVENT_AUTOLAYOUT_LAYOUT:		"autolayout.layout",
	EVENT_UNDO_EXECUTE:				"undo.execute",
	EVENT_UNDO_ROLLBACK:			"undo.rollback",
	EVENT_SHOW_PROPERTYWINDOW:		"propertywindow.show",
	
	/* Event hinzugefügt */
	EVENT_MODEL_BEFORE_SAVE:		"model.beforesave",
	
	/* Selection Shapes Highlights */
	SELECTION_HIGHLIGHT_SIZE:				5,
	SELECTION_HIGHLIGHT_COLOR:				"#4444FF",
	SELECTION_HIGHLIGHT_COLOR2:				"#9999FF",
	
	SELECTION_HIGHLIGHT_STYLE_CORNER: 		"corner",
	SELECTION_HIGHLIGHT_STYLE_RECTANGLE: 	"rectangle",
	
	SELECTION_VALID_COLOR:					"#00FF00",
	SELECTION_INVALID_COLOR:				"#FF0000",


	DOCKER_DOCKED_COLOR:		"#00FF00",
	DOCKER_UNDOCKED_COLOR:		"#FF0000",
	DOCKER_SNAP_OFFSET:			10,
		
	/* Copy & Paste */
	EDIT_OFFSET_PASTE:			10,

	/* Key-Codes */
	KEY_CODE_X: 				88,
	KEY_CODE_C: 				67,
	KEY_CODE_V: 				86,
	KEY_CODE_DELETE: 			46,
	KEY_CODE_META:				224,
	KEY_CODE_BACKSPACE:			8,
	KEY_CODE_LEFT:				37,
	KEY_CODE_RIGHT:				39,
	KEY_CODE_UP:				38,
	KEY_CODE_DOWN:				40,

	// TODO Determine where the lowercase constants are still used and remove them from here.
	KEY_Code_enter:				12,
	KEY_Code_left:				37,
	KEY_Code_right:				39,
	KEY_Code_top:				38,
	KEY_Code_bottom:			40,
};/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}


/**
 * EditPathHandler
 * 
 * Edit SVG paths' coordinates according to specified from-to movement and
 * horizontal and vertical scaling factors. 
 * The resulting path's d attribute is stored in instance variable d.
 * 
 * @constructor
 */
ORYX.Core.SVG.EditPathHandler = Clazz.extend({
	
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);
		
		this.x = 0;
		this.y = 0;
		this.oldX = 0;
		this.oldY = 0;
		this.deltaWidth = 1;
		this.deltaHeight = 1;
		
		this.d = "";
	},
	
	/**
	 * init
	 * 
	 * @param {float} x Target point's x-coordinate
	 * @param {float} y Target point's y-coordinate
	 * @param {float} oldX Reference point's x-coordinate
	 * @param {float} oldY Reference point's y-coordinate
	 * @param {float} deltaWidth Horizontal scaling factor
	 * @param {float} deltaHeight Vertical scaling factor
	 */
	init: function(x, y, oldX, oldY, deltaWidth, deltaHeight) {
		this.x = x;
		this.y = y;
		this.oldX = oldX;
		this.oldY = oldY;
		this.deltaWidth = deltaWidth;
		this.deltaHeight = deltaHeight;
		
		this.d = "";
	},

	/**
	 * editPointsAbs
	 * 
	 * @param {Array} points Array of absolutePoints
	 */
	editPointsAbs: function(points) {
		if(points instanceof Array) {
			var newPoints = [];
			var x, y;
			for(var i = 0; i < points.length; i++) {
				x = (parseFloat(points[i]) - this.oldX)*this.deltaWidth + this.x;
				i++;
				y = (parseFloat(points[i]) - this.oldY)*this.deltaHeight + this.y;
				newPoints.push(x);
				newPoints.push(y);
			}
			
			return newPoints;
		} else {
			//TODO error
		}
	},
	
	/**
	 * editPointsRel
	 * 
	 * @param {Array} points Array of absolutePoints
	 */
	editPointsRel: function(points) {
		if(points instanceof Array) {
			var newPoints = [];
			var x, y;
			for(var i = 0; i < points.length; i++) {
				x = parseFloat(points[i])*this.deltaWidth;
				i++;
				y = parseFloat(points[i])*this.deltaHeight;
				newPoints.push(x);
				newPoints.push(y);
			}
			
			return newPoints;
		} else {
			//TODO error
		}
	},

	/**
	 * arcAbs - A
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcAbs: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
	    var pointsAbs = this.editPointsAbs([x, y]);
		var pointsRel = this.editPointsRel([rx, ry]);
		
		this.d = this.d.concat(" A" + pointsRel[0] + " " + pointsRel[1] + 
								" " + xAxisRotation + " " + largeArcFlag + 
								" " + sweepFlag + " " + pointsAbs[0] + " " +
								pointsAbs[1] + " ");					
	},

	/**
	 * arcRel - a
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcRel: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
		var pointsRel = this.editPointsRel([rx, ry, x, y]);
		
		this.d = this.d.concat(" a" + pointsRel[0] + " " + pointsRel[1] + 
								" " + xAxisRotation + " " + largeArcFlag + 
								" " + sweepFlag + " " + pointsRel[2] + " " +
								pointsRel[3] + " ");	
	},

	/**
	 * curvetoCubicAbs - C
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicAbs: function(x1, y1, x2, y2, x, y) {
	    var pointsAbs = this.editPointsAbs([x1, y1, x2, y2, x, y]);
		
		this.d = this.d.concat(" C" + pointsAbs[0] + " " + pointsAbs[1] + 
								" " + pointsAbs[2] + " " + pointsAbs[3] + 
								" " + pointsAbs[4] + " " + pointsAbs[5] + " ");	
	},

	/**
	 * curvetoCubicRel - c
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicRel: function(x1, y1, x2, y2, x, y) {
	    var pointsRel = this.editPointsRel([x1, y1, x2, y2, x, y]);
		
		this.d = this.d.concat(" c" + pointsRel[0] + " " + pointsRel[1] + 
								" " + pointsRel[2] + " " + pointsRel[3] + 
								" " + pointsRel[4] + " " + pointsRel[5] + " ");	
	},

	/**
	 * linetoHorizontalAbs - H
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalAbs: function(x) {
	    var pointsAbs = this.editPointsAbs([x, 0]);
		
		this.d = this.d.concat(" H" + pointsAbs[0] + " ");	
	},

	/**
	 * linetoHorizontalRel - h
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalRel: function(x) {
	    var pointsRel = this.editPointsRel([x, 0]);
		
		this.d = this.d.concat(" h" + pointsRel[0] + " ");	
	},

	/**
	 * linetoAbs - L
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoAbs: function(x, y) {
	    var pointsAbs = this.editPointsAbs([x, y]);
		
		this.d = this.d.concat(" L" + pointsAbs[0] + " " + pointsAbs[1] + " ");
	},

	/**
	 * linetoRel - l
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoRel: function(x, y) {
	    var pointsRel = this.editPointsRel([x, y]);
		
		this.d = this.d.concat(" l" + pointsRel[0] + " " + pointsRel[1] + " ");
	},

	/**
	 * movetoAbs - M
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoAbs: function(x, y) {
	    var pointsAbs = this.editPointsAbs([x, y]);
		
		this.d = this.d.concat(" M" + pointsAbs[0] + " " + pointsAbs[1] + " ");
	},

	/**
	 * movetoRel - m
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoRel: function(x, y) {
	    var pointsRel;
		if(this.d === "") {
			pointsRel = this.editPointsAbs([x, y]);
		} else {
			pointsRel = this.editPointsRel([x, y]);
		}
		
		this.d = this.d.concat(" m" + pointsRel[0] + " " + pointsRel[1] + " ");
	},

	/**
	 * curvetoQuadraticAbs - Q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticAbs: function(x1, y1, x, y) {
	    var pointsAbs = this.editPointsAbs([x1, y1, x, y]);
		
		this.d = this.d.concat(" Q" + pointsAbs[0] + " " + pointsAbs[1] + " " +
								pointsAbs[2] + " " + pointsAbs[3] + " ");
	},

	/**
	 * curvetoQuadraticRel - q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticRel: function(x1, y1, x, y) {
	    var pointsRel = this.editPointsRel([x1, y1, x, y]);
		
		this.d = this.d.concat(" q" + pointsRel[0] + " " + pointsRel[1] + " " +
								pointsRel[2] + " " + pointsRel[3] + " ");
	},

	/**
	 * curvetoCubicSmoothAbs - S
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothAbs: function(x2, y2, x, y) {
	    var pointsAbs = this.editPointsAbs([x2, y2, x, y]);
		
		this.d = this.d.concat(" S" + pointsAbs[0] + " " + pointsAbs[1] + " " +
								pointsAbs[2] + " " + pointsAbs[3] + " ");
	},

	/**
	 * curvetoCubicSmoothRel - s
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothRel: function(x2, y2, x, y) {
	    var pointsRel = this.editPointsRel([x2, y2, x, y]);
		
		this.d = this.d.concat(" s" + pointsRel[0] + " " + pointsRel[1] + " " +
								pointsRel[2] + " " + pointsRel[3] + " ");
	},

	/**
	 * curvetoQuadraticSmoothAbs - T
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothAbs: function(x, y) {
	    var pointsAbs = this.editPointsAbs([x, y]);
		
		this.d = this.d.concat(" T" + pointsAbs[0] + " " + pointsAbs[1] + " ");
	},

	/**
	 * curvetoQuadraticSmoothRel - t
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothRel: function(x, y) {
	    var pointsRel = this.editPointsRel([x, y]);
		
		this.d = this.d.concat(" t" + pointsRel[0] + " " + pointsRel[1] + " ");
	},

	/**
	 * linetoVerticalAbs - V
	 * 
	 * @param {Number} y
	 */
	linetoVerticalAbs: function(y) {
	    var pointsAbs = this.editPointsAbs([0, y]);
		
		this.d = this.d.concat(" V" + pointsAbs[1] + " ");
	},

	/**
	 * linetoVerticalRel - v
	 * 
	 * @param {Number} y
	 */
	linetoVerticalRel: function(y) {
	    var pointsRel = this.editPointsRel([0, y]);
		
		this.d = this.d.concat(" v" + pointsRel[1] + " ");
	},

	/**
	 * closePath - z or Z
	 */
	closePath: function() {
	    this.d = this.d.concat(" z");
	}

});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}


/**
 * MinMaxPathHandler
 * 
 * Determine the minimum and maximum of a SVG path's absolute coordinates.
 * For relative coordinates the absolute value is computed for consideration.
 * The values are stored in attributes minX, minY, maxX, and maxY.
 * 
 * @constructor
 */
ORYX.Core.SVG.MinMaxPathHandler = Clazz.extend({
	
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);
		
		this.minX = undefined;
		this.minY = undefined;
		this.maxX = undefined;
		this.maxY = undefined;
		
		this._lastAbsX = undefined;
		this._lastAbsY = undefined;
	},

	/**
	 * Store minimal and maximal coordinates of passed points to attributes minX, maxX, minY, maxY
	 * 
	 * @param {Array} points Array of absolutePoints
	 */
	calculateMinMax: function(points) {
		if(points instanceof Array) {
			var x, y;
			for(var i = 0; i < points.length; i++) {
				x = parseFloat(points[i]);
				i++;
				y = parseFloat(points[i]);
				
				this.minX = (this.minX !== undefined) ? Math.min(this.minX, x) : x;
				this.maxX = (this.maxX !== undefined) ? Math.max(this.maxX, x) : x;
				this.minY = (this.minY !== undefined) ? Math.min(this.minY, y) : y;
				this.maxY = (this.maxY !== undefined) ? Math.max(this.maxY, y) : y;
					
				this._lastAbsX = x;
				this._lastAbsY = y;
			}
		} else {
			//TODO error
		}
	},

	/**
	 * arcAbs - A
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcAbs: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
	    this.calculateMinMax([x, y]);
	},

	/**
	 * arcRel - a
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcRel: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
	    this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoCubicAbs - C
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicAbs: function(x1, y1, x2, y2, x, y) {
	    this.calculateMinMax([x1, y1, x2, y2, x, y]);
	},

	/**
	 * curvetoCubicRel - c
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicRel: function(x1, y1, x2, y2, x, y) {
	    this.calculateMinMax([this._lastAbsX + x1, this._lastAbsY + y1,
							  this._lastAbsX + x2, this._lastAbsY + y2,
							  this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * linetoHorizontalAbs - H
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalAbs: function(x) {
	    this.calculateMinMax([x, this._lastAbsY]);
	},

	/**
	 * linetoHorizontalRel - h
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalRel: function(x) {
	    this.calculateMinMax([this._lastAbsX + x, this._lastAbsY]);
	},

	/**
	 * linetoAbs - L
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoAbs: function(x, y) {
	    this.calculateMinMax([x, y]);
	},

	/**
	 * linetoRel - l
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoRel: function(x, y) {
	    this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * movetoAbs - M
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoAbs: function(x, y) {
	    this.calculateMinMax([x, y]);
	},

	/**
	 * movetoRel - m
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoRel: function(x, y) {
	    if(this._lastAbsX && this._lastAbsY) {
			this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
		} else {
			this.calculateMinMax([x, y]);
		}
	},

	/**
	 * curvetoQuadraticAbs - Q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticAbs: function(x1, y1, x, y) {
	    this.calculateMinMax([x1, y1, x, y]);
	},

	/**
	 * curvetoQuadraticRel - q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticRel: function(x1, y1, x, y) {
	    this.calculateMinMax([this._lastAbsX + x1, this._lastAbsY + y1, this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoCubicSmoothAbs - S
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothAbs: function(x2, y2, x, y) {
	    this.calculateMinMax([x2, y2, x, y]);
	},

	/**
	 * curvetoCubicSmoothRel - s
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothRel: function(x2, y2, x, y) {
	    this.calculateMinMax([this._lastAbsX + x2, this._lastAbsY + y2, this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoQuadraticSmoothAbs - T
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothAbs: function(x, y) {
	    this.calculateMinMax([x, y]);
	},

	/**
	 * curvetoQuadraticSmoothRel - t
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothRel: function(x, y) {
	    this.calculateMinMax([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * linetoVerticalAbs - V
	 * 
	 * @param {Number} y
	 */
	linetoVerticalAbs: function(y) {
	    this.calculateMinMax([this._lastAbsX, y]);
	},

	/**
	 * linetoVerticalRel - v
	 * 
	 * @param {Number} y
	 */
	linetoVerticalRel: function(y) {
	    this.calculateMinMax([this._lastAbsX, this._lastAbsY + y]);
	},

	/**
	 * closePath - z or Z
	 */
	closePath: function() {
	    return;// do nothing
	}

});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}


/**
 * PathHandler
 * 
 * Determine absolute points of a SVG path. The coordinates are stored 
 * sequentially in the attribute points (x-coordinates at even indices,
 * y-coordinates at odd indices).
 * 
 * @constructor
 */
ORYX.Core.SVG.PointsPathHandler = Clazz.extend({
	
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);
		
		this.points = [];
		
		this._lastAbsX = undefined;
		this._lastAbsY = undefined;
	},

	/**
	 * addPoints
	 * 
	 * @param {Array} points Array of absolutePoints
	 */
	addPoints: function(points) {
		if(points instanceof Array) {
			var x, y;
			for(var i = 0; i < points.length; i++) {
				x = parseFloat(points[i]);
				i++;
				y = parseFloat(points[i]);
				
				this.points.push(x);
				this.points.push(y);
				//this.points.push({x:x, y:y});
					
				this._lastAbsX = x;
				this._lastAbsY = y;
			}
		} else {
			//TODO error
		}
	},

	/**
	 * arcAbs - A
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcAbs: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * arcRel - a
	 * 
	 * @param {Number} rx
	 * @param {Number} ry
	 * @param {Number} xAxisRotation
	 * @param {Boolean} largeArcFlag
	 * @param {Boolean} sweepFlag
	 * @param {Number} x
	 * @param {Number} y
	 */
	arcRel: function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoCubicAbs - C
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicAbs: function(x1, y1, x2, y2, x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * curvetoCubicRel - c
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicRel: function(x1, y1, x2, y2, x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * linetoHorizontalAbs - H
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalAbs: function(x) {
	    this.addPoints([x, this._lastAbsY]);
	},

	/**
	 * linetoHorizontalRel - h
	 * 
	 * @param {Number} x
	 */
	linetoHorizontalRel: function(x) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY]);
	},

	/**
	 * linetoAbs - L
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoAbs: function(x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * linetoRel - l
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	linetoRel: function(x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * movetoAbs - M
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoAbs: function(x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * movetoRel - m
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	movetoRel: function(x, y) {
	    if(this._lastAbsX && this._lastAbsY) {
			this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
		} else {
			this.addPoints([x, y]);
		}
	},

	/**
	 * curvetoQuadraticAbs - Q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticAbs: function(x1, y1, x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * curvetoQuadraticRel - q
	 * 
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticRel: function(x1, y1, x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoCubicSmoothAbs - S
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothAbs: function(x2, y2, x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * curvetoCubicSmoothRel - s
	 * 
	 * @param {Number} x2
	 * @param {Number} y2
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoCubicSmoothRel: function(x2, y2, x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * curvetoQuadraticSmoothAbs - T
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothAbs: function(x, y) {
	    this.addPoints([x, y]);
	},

	/**
	 * curvetoQuadraticSmoothRel - t
	 * 
	 * @param {Number} x
	 * @param {Number} y
	 */
	curvetoQuadraticSmoothRel: function(x, y) {
	    this.addPoints([this._lastAbsX + x, this._lastAbsY + y]);
	},

	/**
	 * linetoVerticalAbs - V
	 * 
	 * @param {Number} y
	 */
	linetoVerticalAbs: function(y) {
	    this.addPoints([this._lastAbsX, y]);
	},

	/**
	 * linetoVerticalRel - v
	 * 
	 * @param {Number} y
	 */
	linetoVerticalRel: function(y) {
	    this.addPoints([this._lastAbsX, this._lastAbsY + y]);
	},

	/**
	 * closePath - z or Z
	 */
	closePath: function() {
	    return;// do nothing
	}

});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 *
 * Config variables
 */
NAMESPACE_ORYX = "http://www.b3mn.org/oryx";
NAMESPACE_SVG = "http://www.w3.org/2000/svg/";

/**
 * @classDescription This class wraps the manipulation of a SVG marker.
 * @namespace ORYX.Core.SVG
 * uses Inheritance (Clazz)
 * uses Prototype 1.5.0
 *
 */

/**
 * Init package
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}

ORYX.Core.SVG.SVGMarker = Clazz.extend({

	/**
	 * Constructor
	 * @param markerElement {SVGMarkerElement}
	 */
	construct: function(markerElement) {
		arguments.callee.$.construct.apply(this, arguments);

		this.id = undefined;
		this.element = markerElement;
		this.refX = undefined;
		this.refY = undefined;
		this.markerWidth = undefined;
		this.markerHeight = undefined;
		this.oldRefX = undefined;
		this.oldRefY = undefined;
		this.oldMarkerWidth = undefined;
		this.oldMarkerHeight = undefined;
		this.optional = false;
		this.enabled = true;
		this.minimumLength = undefined;
		this.resize = false;

		this.svgShapes = [];

		this._init(); //initialisation of all the properties declared above.
	},

	/**
	 * Initializes the values that are defined in the constructor.
	 */
	_init: function() {
		//check if this.element is a SVGMarkerElement
		if(!( this.element == "[object SVGMarkerElement]")) {
			throw "SVGMarker: Argument is not an instance of SVGMarkerElement.";
		}

		this.id = this.element.getAttributeNS(null, "id");
		
		//init svg marker attributes
		var refXValue = this.element.getAttributeNS(null, "refX");
		if(refXValue) {
			this.refX = parseFloat(refXValue);
		} else {
			this.refX = 0;
		}
		var refYValue = this.element.getAttributeNS(null, "refY");
		if(refYValue) {
			this.refY = parseFloat(refYValue);
		} else {
			this.refY = 0;
		}
		var markerWidthValue = this.element.getAttributeNS(null, "markerWidth");
		if(markerWidthValue) {
			this.markerWidth = parseFloat(markerWidthValue);
		} else {
			this.markerWidth = 3;
		}
		var markerHeightValue = this.element.getAttributeNS(null, "markerHeight");
		if(markerHeightValue) {
			this.markerHeight = parseFloat(markerHeightValue);
		} else {
			this.markerHeight = 3;
		}

		this.oldRefX = this.refX;
		this.oldRefY = this.refY;
		this.oldMarkerWidth = this.markerWidth;
		this.oldMarkerHeight = this.markerHeight;

		//init oryx attributes
		var optionalAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "optional");
		if(optionalAttr) {
			optionalAttr = optionalAttr.strip();
			this.optional = (optionalAttr.toLowerCase() === "yes");
		} else {
			this.optional = false;
		}

		var enabledAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "enabled");
		if(enabledAttr) {
			enabledAttr = enabledAttr.strip();
			this.enabled = !(enabledAttr.toLowerCase() === "no");
		} else {
			this.enabled = true;
		}

		var minLengthAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "minimumLength");
		if(minLengthAttr) {
			this.minimumLength = parseFloat(minLengthAttr);
		}

		var resizeAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "resize");
		if(resizeAttr) {
			resizeAttr = resizeAttr.strip();
			this.resize = (resizeAttr.toLowerCase() === "yes");
		} else {
			this.resize = false;
		}

		//init SVGShape objects
		//this.svgShapes = this._getSVGShapes(this.element);
	},

	/**
	 *
	 */
	_getSVGShapes: function(svgElement) {
		if(svgElement.hasChildNodes) {
			var svgShapes = [];
			var me = this;
			$A(svgElement.childNodes).each(function(svgChild) {
				try {
					var svgShape = new ORYX.Core.SVG.SVGShape(svgChild);
					svgShapes.push(svgShape);
				} catch (e) {
					svgShapes = svgShapes.concat(me._getSVGShapes(svgChild));
				}
			});
			return svgShapes;
		}
	},

	/**
	 * Writes the changed values into the SVG marker.
	 */
	update: function() {
		//TODO mache marker resizebar!!! aber erst wenn der rest der connectingshape funzt!

//		//update marker attributes
//		if(this.refX != this.oldRefX) {
//			this.element.setAttributeNS(null, "refX", this.refX);
//		}
//		if(this.refY != this.oldRefY) {
//			this.element.setAttributeNS(null, "refY", this.refY);
//		}
//		if(this.markerWidth != this.oldMarkerWidth) {
//			this.element.setAttributeNS(null, "markerWidth", this.markerWidth);
//		}
//		if(this.markerHeight != this.oldMarkerHeight) {
//			this.element.setAttributeNS(null, "markerHeight", this.markerHeight);
//		}
//
//		//update SVGShape objects
//		var widthDelta = this.markerWidth / this.oldMarkerWidth;
//		var heightDelta = this.markerHeight / this.oldMarkerHeight;
//		if(widthDelta != 1 && heightDelta != 1) {
//			this.svgShapes.each(function(svgShape) {
//
//			});
//		}

		//update old values to prepare the next update
		this.oldRefX = this.refX;
		this.oldRefY = this.refY;
		this.oldMarkerWidth = this.markerWidth;
		this.oldMarkerHeight = this.markerHeight;
	},
	
	toString: function() { return (this.element) ? "SVGMarker " + this.element.id : "SVGMarker " + this.element;}
 });/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 *
 * Config variables
 */
NAMESPACE_ORYX = "http://www.b3mn.org/oryx";
NAMESPACE_SVG = "http://www.w3.org/2000/svg/";

/**
 * @classDescription This class wraps the manipulation of a SVG basic shape or a path.
 * @namespace ORYX.Core.SVG
 * uses Inheritance (Clazz)
 * uses Prototype 1.5.0
 * uses PathParser by Kevin Lindsey (http://kevlindev.com/)
 * uses MinMaxPathHandler
 * uses EditPathHandler
 *
 */

//init package
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}

ORYX.Core.SVG.SVGShape = Clazz.extend({

	/**
	 * Constructor
	 * @param svgElem {SVGElement} An SVGElement that is a basic shape or a path.
	 */
	construct: function(svgElem) {
		arguments.callee.$.construct.apply(this, arguments);

		this.type;
		this.element = svgElem;
		this.x = undefined;
		this.y = undefined;
		this.width = undefined;
		this.height = undefined;
		this.oldX = undefined;
		this.oldY = undefined;
		this.oldWidth = undefined;
		this.oldHeight = undefined;
		this.radiusX = undefined;
		this.radiusY = undefined;
		this.isHorizontallyResizable = false;
		this.isVerticallyResizable = false;
		//this.anchors = [];
		this.anchorLeft = false;
		this.anchorRight = false;
		this.anchorTop = false;
		this.anchorBottom = false;
		
		//attributes of path elements of edge objects
		this.allowDockers = true;
		this.resizeMarkerMid = false;

		this.editPathParser;
		this.editPathHandler;

		this.init(); //initialisation of all the properties declared above.
	},

	/**
	 * Initializes the values that are defined in the constructor.
	 */
	init: function() {

		/**initialize position and size*/
		if(ORYX.Editor.checkClassType(this.element, SVGRectElement) || ORYX.Editor.checkClassType(this.element, SVGImageElement)) {
			this.type = "Rect";
			
			var xAttr = this.element.getAttributeNS(null, "x");
			if(xAttr) {
				this.oldX = parseFloat(xAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var yAttr = this.element.getAttributeNS(null, "y");
			if(yAttr) {
				this.oldY = parseFloat(yAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var widthAttr = this.element.getAttributeNS(null, "width");
			if(widthAttr) {
				this.oldWidth = parseFloat(widthAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var heightAttr = this.element.getAttributeNS(null, "height");
			if(heightAttr) {
				this.oldHeight = parseFloat(heightAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}

		} else if(ORYX.Editor.checkClassType(this.element, SVGCircleElement)) {
			this.type = "Circle";
			
			var cx = undefined;
			var cy = undefined;
			//var r = undefined;

			var cxAttr = this.element.getAttributeNS(null, "cx");
			if(cxAttr) {
				cx = parseFloat(cxAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var cyAttr = this.element.getAttributeNS(null, "cy");
			if(cyAttr) {
				cy = parseFloat(cyAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var rAttr = this.element.getAttributeNS(null, "r");
			if(rAttr) {
				//r = parseFloat(rAttr);
				this.radiusX = parseFloat(rAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			this.oldX = cx - this.radiusX;
			this.oldY = cy - this.radiusX;
			this.oldWidth = 2*this.radiusX;
			this.oldHeight = 2*this.radiusX;

		} else if(ORYX.Editor.checkClassType(this.element, SVGEllipseElement)) {
			this.type = "Ellipse";
			
			var cx = undefined;
			var cy = undefined;
			//var rx = undefined;
			//var ry = undefined;
			var cxAttr = this.element.getAttributeNS(null, "cx");
			if(cxAttr) {
				cx = parseFloat(cxAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var cyAttr = this.element.getAttributeNS(null, "cy");
			if(cyAttr) {
				cy = parseFloat(cyAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var rxAttr = this.element.getAttributeNS(null, "rx");
			if(rxAttr) {
				this.radiusX = parseFloat(rxAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var ryAttr = this.element.getAttributeNS(null, "ry");
			if(ryAttr) {
				this.radiusY = parseFloat(ryAttr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			this.oldX = cx - this.radiusX;
			this.oldY = cy - this.radiusY;
			this.oldWidth = 2*this.radiusX;
			this.oldHeight = 2*this.radiusY;

		} else if(ORYX.Editor.checkClassType(this.element, SVGLineElement)) {
			this.type = "Line";
			
			var x1 = undefined;
			var y1 = undefined;
			var x2 = undefined;
			var y2 = undefined;
			var x1Attr = this.element.getAttributeNS(null, "x1");
			if(x1Attr) {
				x1 = parseFloat(x1Attr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var y1Attr = this.element.getAttributeNS(null, "y1");
			if(y1Attr) {
				y1 = parseFloat(y1Attr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var x2Attr = this.element.getAttributeNS(null, "x2");
			if(x2Attr) {
				x2 = parseFloat(x2Attr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			var y2Attr = this.element.getAttributeNS(null, "y2");
			if(y2Attr) {
				y2 = parseFloat(y2Attr);
			} else {
				throw "Missing attribute in element " + this.element;
			}
			this.oldX = Math.min(x1,x2);
			this.oldY = Math.min(y1,y2);
			this.oldWidth = Math.abs(x1-x2);
			this.oldHeight = Math.abs(y1-y2);

		} else if(ORYX.Editor.checkClassType(this.element, SVGPolylineElement) || ORYX.Editor.checkClassType(this.element, SVGPolygonElement)) {
			this.type = "Polyline";
			
			var points = this.element.getAttributeNS(null, "points");

			if(points) {
				points = points.replace(/,/g , " ");
				var pointsArray = points.split(" ");
				pointsArray = pointsArray.without("");

				if(pointsArray && pointsArray.length && pointsArray.length > 1) {
					var minX = parseFloat(pointsArray[0]);
					var minY = parseFloat(pointsArray[1]);
					var maxX = parseFloat(pointsArray[0]);
					var maxY = parseFloat(pointsArray[1]);

					for(var i = 0; i < pointsArray.length; i++) {
						minX = Math.min(minX, parseFloat(pointsArray[i]));
						maxX = Math.max(maxX, parseFloat(pointsArray[i]));
						i++;
						minY = Math.min(minY, parseFloat(pointsArray[i]));
						maxY = Math.max(maxY, parseFloat(pointsArray[i]));
					}

					this.oldX = minX;
					this.oldY = minY;
					this.oldWidth = maxX-minX;
					this.oldHeight = maxY-minY;
				} else {
					throw "Missing attribute in element " + this.element;
				}
			} else {
				throw "Missing attribute in element " + this.element;
			}

		} else if(ORYX.Editor.checkClassType(this.element, SVGPathElement)) {
			this.type = "Path";
			
			this.editPathParser = new PathParser();
			this.editPathHandler = new ORYX.Core.SVG.EditPathHandler();
			this.editPathParser.setHandler(this.editPathHandler);
		
			var parser = new PathParser();
			var handler = new ORYX.Core.SVG.MinMaxPathHandler();
			parser.setHandler(handler);
			parser.parsePath(this.element);

			this.oldX = handler.minX;
			this.oldY = handler.minY;
			this.oldWidth = handler.maxX - handler.minX;
			this.oldHeight = handler.maxY - handler.minY;

			delete parser;
			delete handler;
		} else {
			throw "Element is not a shape.";
		}

		/** initialize attributes of oryx namespace */
		//resize
		var resizeAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "resize");
		if(resizeAttr) {
			resizeAttr = resizeAttr.toLowerCase();
			if(resizeAttr.match(/horizontal/)) {
				this.isHorizontallyResizable = true;
			} else {
				this.isHorizontallyResizable = false;
			}
			if(resizeAttr.match(/vertical/)) {
				this.isVerticallyResizable = true;
			} else {
				this.isVerticallyResizable = false;
			}
		} else {
			this.isHorizontallyResizable = false;
			this.isVerticallyResizable = false;
		}

		//anchors
		var anchorAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "anchors");
		if(anchorAttr) {
			anchorAttr = anchorAttr.replace("/,/g", " ");
			var anchors = anchorAttr.split(" ").without("");
			
			for(var i = 0; i < anchors.length; i++) {
				switch(anchors[i].toLowerCase()) {
					case "left":
						this.anchorLeft = true;
						break;
					case "right":
						this.anchorRight = true;
						break;
					case "top":
						this.anchorTop = true;
						break;
					case "bottom":
						this.anchorBottom = true;
						break;
				}
			}
		}
		
		//allowDockers and resizeMarkerMid
		if(ORYX.Editor.checkClassType(this.element, SVGPathElement)) {
			var allowDockersAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "allowDockers"); 
			if(allowDockersAttr) {
				if(allowDockersAttr.toLowerCase() === "no") {
					this.allowDockers = false; 
				} else {
					this.allowDockers = true;
				}
			}
			
			var resizeMarkerMidAttr = this.element.getAttributeNS(NAMESPACE_ORYX, "resizeMarker-mid"); 
			if(resizeMarkerMidAttr) {
				if(resizeMarkerMidAttr.toLowerCase() === "yes") {
					this.resizeMarkerMid = true; 
				} else {
					this.resizeMarkerMid = false;
				}
			}
		}	
			
		this.x = this.oldX;
		this.y = this.oldY;
		this.width = this.oldWidth;
		this.height = this.oldHeight;
	},

	/**
	 * Writes the changed values into the SVG element.
	 */
	update: function() {
		
		if(this.x !== this.oldX || this.y !== this.oldY || this.width !== this.oldWidth || this.height !== this.oldHeight) {
			switch(this.type) {
				case "Rect":
					if(this.x !== this.oldX) this.element.setAttributeNS(null, "x", this.x);
					if(this.y !== this.oldY) this.element.setAttributeNS(null, "y", this.y);
				 	if(this.width !== this.oldWidth) this.element.setAttributeNS(null, "width", this.width);
					if(this.height !== this.oldHeight) this.element.setAttributeNS(null, "height", this.height);
					break;
				case "Circle":
					//calculate the radius
					//var r;
//					if(this.width/this.oldWidth <= this.height/this.oldHeight) {
//						this.radiusX = ((this.width > this.height) ? this.width : this.height)/2.0;
//					} else {
					 	this.radiusX = ((this.width < this.height) ? this.width : this.height)/2.0;
					//}
	
					this.element.setAttributeNS(null, "cx", this.x + this.width/2.0);
					this.element.setAttributeNS(null, "cy", this.y + this.height/2.0);
					this.element.setAttributeNS(null, "r", this.radiusX);
					break;
				case "Ellipse":
					this.radiusX = this.width/2;
					this.radiusY = this.height/2;
	
					this.element.setAttributeNS(null, "cx", this.x + this.radiusX);
					this.element.setAttributeNS(null, "cy", this.y + this.radiusY);
					this.element.setAttributeNS(null, "rx", this.radiusX);
					this.element.setAttributeNS(null, "ry", this.radiusY);
					break;
				case "Line":
					if(this.x !== this.oldX)
						this.element.setAttributeNS(null, "x1", this.x);
						
					if(this.y !== this.oldY)
						this.element.setAttributeNS(null, "y1", this.y);
						
					if(this.x !== this.oldX || this.width !== this.oldWidth)
						this.element.setAttributeNS(null, "x2", this.x + this.width);
					
					if(this.y !== this.oldY || this.height !== this.oldHeight)
						this.element.setAttributeNS(null, "y2", this.y + this.height);
					break;
				case "Polyline":
					var points = this.element.getAttributeNS(null, "points");
					if(points) {
						points = points.replace(/,/g, " ").split(" ").without("");
	
						if(points && points.length && points.length > 1) {
	
							//TODO what if oldWidth == 0?
							var widthDelta = (this.oldWidth === 0) ? 0 : this.width / this.oldWidth;
						    var heightDelta = (this.oldHeight === 0) ? 0 : this.height / this.oldHeight;
	
							var updatedPoints = "";
						    for(var i = 0; i < points.length; i++) {
								var x = (parseFloat(points[i])-this.oldX)*widthDelta + this.x;
								i++;
								var y = (parseFloat(points[i])-this.oldY)*heightDelta + this.y;
		    					updatedPoints += x + " " + y + " ";
						    }
							this.element.setAttributeNS(null, "points", updatedPoints);
						} else {
							//TODO error
						}
					} else {
						//TODO error
					}
					break;
				case "Path":
					//calculate scaling delta
					//TODO what if oldWidth == 0?
					var widthDelta = (this.oldWidth === 0) ? 0 : this.width / this.oldWidth;
					var heightDelta = (this.oldHeight === 0) ? 0 : this.height / this.oldHeight;
	
					//use path parser to edit each point of the path
					this.editPathHandler.init(this.x, this.y, this.oldX, this.oldY, widthDelta, heightDelta);
					this.editPathParser.parsePath(this.element);
	
					//change d attribute of path
					this.element.setAttributeNS(null, "d", this.editPathHandler.d);
					break;
			}

			this.oldX = this.x;
			this.oldY = this.y;
			this.oldWidth = this.width;
			this.oldHeight = this.height;
		}
	},
	
	isPointIncluded: function(pointX, pointY) {

		// Check if there are the right arguments and if the node is visible
		if(!pointX || !pointY || !this.isVisible()) {
			return false;
		}

		switch(this.type) {
			case "Rect":
				return (pointX >= this.x && pointX <= this.x + this.width &&
						pointY >= this.y && pointY <= this.y+this.height);
				break;
			case "Circle":
				//calculate the radius
//				var r;
//				if(this.width/this.oldWidth <= this.height/this.oldHeight) {
//					r = ((this.width > this.height) ? this.width : this.height)/2.0;
//				} else {
//				 	r = ((this.width < this.height) ? this.width : this.height)/2.0;
//				}
				return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.width/2.0, this.y + this.height/2.0, this.radiusX, this.radiusX);
				break;
			case "Ellipse":
				return ORYX.Core.Math.isPointInEllipse(pointX, pointY, this.x + this.radiusX, this.y + this.radiusY, this.radiusX, this.radiusY);			
				break;
			case "Line":
				return ORYX.Core.Math.isPointInLine(pointX, pointY, this.x, this.y, this.x + this.width, this.y + this.height);
				break;
			case "Polyline":
				var points = this.element.getAttributeNS(null, "points");
	
				if(points) {
					points = points.replace(/,/g , " ").split(" ").without("");
	
					points = points.collect(function(n) {
						return parseFloat(n);
					});
					
					return ORYX.Core.Math.isPointInPolygone(pointX, pointY, points);
				} else {
					return false;
				}
				break;
			case "Path":
				var parser = new PathParser();
				var handler = new ORYX.Core.SVG.PointsPathHandler();
				parser.setHandler(handler);
				parser.parsePath(this.element);
	
				return ORYX.Core.Math.isPointInPolygone(pointX, pointY, handler.points);

				break;
			default:
				return false;
		}
	},

	isVisible: function(elem) {
			
		if (!elem) {
			elem = this.element;
		}

		if ( elem.ownerSVGElement ) {
			if (ORYX.Editor.checkClassType(elem, SVGGElement)) {
				if (elem.className && elem.className.baseVal == "me") 
					return true;
			}

			var attr = elem.getAttributeNS(null, "display");
			if(!attr)
				return this.isVisible(elem.parentNode);
			else if (attr == "none") 
				return false;
			else 
				return true;
		}

		return true;
	},

	toString: function() { return (this.element) ? "SVGShape " + this.element.id : "SVGShape " + this.element;}
 });/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.SVG) {ORYX.Core.SVG = {};}

/**
 * @classDescription Class for adding text to a shape.
 * 
 */
ORYX.Core.SVG.Label = Clazz.extend({
	
	/**
	 * Constructor
	 * @param options {Object} :
	 * 	textElement
	 * 
	 */
	construct: function(options) {
		arguments.callee.$.construct.apply(this, arguments);
		
		if(!options.textElement) {
			throw "Label: No parameter textElement." 
		} else if (!ORYX.Editor.checkClassType( options.textElement, SVGTextElement ) ) {
			throw "Label: Parameter textElement is not an SVGTextElement."	
		}
		
		this.invisibleRenderPoint = -5000;
		
		this.node = options.textElement;
		
		
		this.node.setAttributeNS(null, 'stroke-width', '0pt');
		this.node.setAttributeNS(null, 'letter-spacing', '-0.01px');
		
		this.shapeId = options.shapeId;
		
		this.id;
		
		this.fitToElemId;
		
		this.edgePosition;
		
		this.x;
		this.y;
		this.oldX;
		this.oldY;
		
		this.isVisible = true;
		
		this._text;
		this._verticalAlign;
		this._horizontalAlign;
		this._rotate;
		this._rotationPoint;
		
		//this.anchors = [];
		this.anchorLeft;
		this.anchorRight;
		this.anchorTop;
		this.anchorBottom;
		
		this._isChanged = true;

		//if the text element already has an id, don't change it.
		var _id = this.node.getAttributeNS(null, 'id');
		if(_id) {
			this.id = _id;
		}
		
		//initialization	
		
		//set referenced element the text is fit to
		this.fitToElemId = this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, 'fittoelem');
		if(this.fitToElemId)
			this.fitToElemId = this.shapeId + this.fitToElemId;
		
		//set alignment	
		var alignValues = this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, 'align');
		if(alignValues) {
			alignValues = alignValues.replace(/,/g, " ");
			alignValues = alignValues.split(" ");
			alignValues = alignValues.without("");
			
			alignValues.each((function(alignValue) {
				switch (alignValue) {
					case 'top':
					case 'middle':
					case 'bottom':
						if(!this._verticalAlign) {this._verticalAlign = alignValue;}
						break;
					case 'left':
					case 'center':
					case 'right':
						if(!this._horizontalAlign) {this._horizontalAlign = alignValue;}
						break;
				}
			}).bind(this));
		}
		
		//set edge position (only in case the label belongs to an edge)
		this.edgePosition = this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, 'edgePosition');
		if(this.edgePosition) {
			this.edgePosition = this.edgePosition.toLowerCase();
		}
		
		//set rotation
		var rotateValue = this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, 'rotate');
		if(rotateValue) {
			try {
				this._rotate = parseFloat(rotateValue);
			} catch (e) {
				this._rotate = 0;
			}
		} else {
			this._rotate = 0;
		}
		
		//anchors
		var anchorAttr = this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, "anchors");
		if(anchorAttr) {
			anchorAttr = anchorAttr.replace("/,/g", " ");
			var anchors = anchorAttr.split(" ").without("");
			
			for(var i = 0; i < anchors.length; i++) {
				switch(anchors[i].toLowerCase()) {
					case "left":
						this.anchorLeft = true;
						break;
					case "right":
						this.anchorRight = true;
						break;
					case "top":
						this.anchorTop = true;
						break;
					case "bottom":
						this.anchorBottom = true;
						break;
				}
			}
		}
		
		//if no alignment defined, set default alignment
		if(!this._verticalAlign) { this._verticalAlign = 'bottom'; }
		if(!this._horizontalAlign) { this._horizontalAlign = 'left'; }

		var xValue = this.node.getAttributeNS(null, 'x');
		if(xValue) {
			this.x = parseFloat(xValue);
			this.oldX = this.x;
		} else {
			//TODO error
		}
		
		var yValue = this.node.getAttributeNS(null, 'y');
		if(yValue) {
			this.y = parseFloat(yValue);
			this.oldY = this.y;
		} else {
			//TODO error
		}
		
		//set initial text
		this.text(this.node.textContent);
	},
	
	changed: function() {
		this._isChanged = true;
	},
	
	/**
	 * Update the SVG text element.
	 */
	update: function() {
		if(this._isChanged || this.x !== this.oldX || this.y !== this.oldY) {
			if (this.isVisible) {
				this._isChanged = false;
				
				this.node.setAttributeNS(null, 'x', this.x);
				this.node.setAttributeNS(null, 'y', this.y);
				
				//this.node.setAttributeNS(null, 'font-size', this._fontSize);
				//this.node.setAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX, 'align', this._horizontalAlign + " " + this._verticalAlign);
				
				//set horizontal alignment
				switch (this._horizontalAlign) {
					case 'left':
						this.node.setAttributeNS(null, 'text-anchor', 'start');
						break;
					case 'center':
						this.node.setAttributeNS(null, 'text-anchor', 'middle');
						break;
					case 'right':
						this.node.setAttributeNS(null, 'text-anchor', 'end');
						break;
				}
				
				this.oldX = this.x;
				this.oldY = this.y;
				
				//set rotation
				if (this._rotate !== undefined) {
					if (this._rotationPoint) 
						this.node.setAttributeNS(null, 'transform', 'rotate(' + this._rotate + ' ' + this._rotationPoint.x + ' ' + this._rotationPoint.y + ')');
					else 
						this.node.setAttributeNS(null, 'transform', 'rotate(' + this._rotate + ' ' + this.x + ' ' + this.y + ')');
				}
				
				var textLines = this._text.split("\n");
				while (textLines.last() == "") 
					textLines.remove(textLines.last());
				
				this.node.textContent = "";
				
				if (this.node.ownerDocument) {
					textLines.each((function(textLine, index){
						var tspan = this.node.ownerDocument.createElementNS(ORYX.CONFIG.NAMESPACE_SVG, 'tspan');
						tspan.textContent = textLine;
						tspan.setAttributeNS(null, 'x', this.invisibleRenderPoint);
						tspan.setAttributeNS(null, 'y', this.invisibleRenderPoint);
						
						//append tspan to text node
						this.node.appendChild(tspan);
					}).bind(this));
					
					//Work around for Mozilla bug 293581
					if (this.isVisible) {
						this.node.setAttributeNS(null, 'visibility', 'hidden');
					}
					
					if (this.fitToElemId) 
						window.setTimeout(this._checkFittingToReferencedElem.bind(this), 0);
					else 
						window.setTimeout(this._positionText.bind(this), 0);
				}
			} else {
				this.node.textContent = "";
			}
		}
	},
	
	_checkFittingToReferencedElem: function() {
		try {
			var tspans = $A(this.node.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG, 'tspan'));
			
			//only do this in firefox 3. all other browsers do not support word wrapping!!!!!
			if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent) && new Number(RegExp.$1)>=3) {
				var newtspans = [];
				
				var refNode = this.node.ownerDocument.getElementById(this.fitToElemId);
				
				if (refNode) {
				
					var refbb = refNode.getBBox();
					
					for (var j = 0; j < tspans.length; j++) {
						var tspan = tspans[j];
						
						var textLength = tspan.getComputedTextLength();
						
						if (textLength > refbb.width) {
						
							var startIndex = 0;
							var lastSeperatorIndex = 0;
							
							var numOfChars = this.getTrimmedTextLength(tspan.textContent);
							for (var i = 0; i < numOfChars; i++) {
								var sslength = tspan.getSubStringLength(startIndex, i - startIndex);
								
								if (sslength > refbb.width - 2) {
									var newtspan = this.node.ownerDocument.createElementNS(ORYX.CONFIG.NAMESPACE_SVG, 'tspan');
									if (lastSeperatorIndex <= startIndex) {
										lastSeperatorIndex = (i == 0) ? i : i-1;
										newtspan.textContent = tspan.textContent.slice(startIndex, lastSeperatorIndex);
										//lastSeperatorIndex = i;
									}
									else {
										newtspan.textContent = tspan.textContent.slice(startIndex, ++lastSeperatorIndex);
									}
									
									newtspan.setAttributeNS(null, 'x', this.invisibleRenderPoint);
									newtspan.setAttributeNS(null, 'y', this.invisibleRenderPoint);
									
									//insert tspan to text node
									//this.node.insertBefore(newtspan, tspan);
									newtspans.push(newtspan);
									
									startIndex = lastSeperatorIndex;
									
								}
								else {
									var curChar = tspan.textContent.charAt(i);
									if (curChar == ' ' ||
									curChar == '-' ||
									curChar == "." ||
									curChar == "," ||
									curChar == ";" ||
									curChar == ":") {
										lastSeperatorIndex = i;
									}
								}
							}
							
							tspan.textContent = tspan.textContent.slice(startIndex);
						}
						
						newtspans.push(tspan);
					}
					
					while (this.node.hasChildNodes()) 
						this.node.removeChild(this.node.childNodes[0]);
					
					while (newtspans.length > 0) {
						this.node.appendChild(newtspans.shift());
					}
				}
			}
		} catch (e) {
			//console.log(e);
		}
		
		window.setTimeout(this._positionText.bind(this), 0);
	},
	
	/**
	 * This is a work around method for Mozilla bug 293581.
	 * Before the method getComputedTextLength works, the text has to be rendered.
	 */
	_positionText: function() {
		try {
			var tspans = this.node.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG, 'tspan');
			
			//trying to get an inherited font-size attribute
			//NO CSS CONSIDERED!
			var fontSize = this.getInheritedFontSize(this.node); 
			
			if (!fontSize) {
				//because this only works in firefox 3, all other browser use the default line height
				if (tspans[0] && /Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent) && new Number(RegExp.$1) >= 3) {
					fontSize = tspans[0].getExtentOfChar(0).height;
				}
				else {
					fontSize = ORYX.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
				}
				
				//handling of unsupported method in webkit
				if (fontSize <= 0) {
					fontSize = ORYX.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
				}
			}
			
			$A(tspans).each((function(tspan, index){
				
				//set vertical position
				var dy = 0;
				switch (this._verticalAlign) {
					case 'bottom':
						dy = -(tspans.length - index - 1) * (fontSize);
						break;
					case 'middle':
						dy = -(tspans.length / 2.0 - index - 1) * (fontSize);
						dy -= ORYX.CONFIG.LABEL_LINE_DISTANCE / 2;
						break;
					case 'top':
						dy = index * (fontSize);
						dy += fontSize;
						break;
				}
				
				tspan.setAttributeNS(null, 'dy', dy);
				
				tspan.setAttributeNS(null, 'x', this.x);
				tspan.setAttributeNS(null, 'y', this.y);
				
			}).bind(this));
			
		} catch(e) {
			this._isChanged = true;
		}
		
		
		if(this.isVisible) {
			this.node.setAttributeNS(null, 'visibility', 'inherit');
		}				
	},
	
	/**
	 * If no parameter is provided, this method returns the current text.
	 * @param text {String} Optional. Replaces the old text with this one.
	 */
	text: function() {
		switch (arguments.length) {
			case 0:
				return this._text
				break;
			
			case 1:
				var oldText = this._text;
				if(arguments[0]) {
					this._text = arguments[0].toString();
				} else {
					this._text = "";
				}
				if(oldText !== this._text) {
					this._isChanged = true;
				}
				break;
				
			default: 
				//TODO error
				break;
		}
	},
	
	verticalAlign: function() {
		switch(arguments.length) {
			case 0:
				return this._verticalAlign;
			case 1:
				if(['top', 'middle', 'bottom'].member(arguments[0])) {
					var oldValue = this._verticalAlign;
					this._verticalAlign = arguments[0];
					if(this._verticalAlign !== oldValue) {
						this._isChanged = true;
					}
				}
				break;
				
			default:
				//TODO error
				break;
		}
	},
	
	horizontalAlign: function() {
		switch(arguments.length) {
			case 0:
				return this._horizontalAlign;
			case 1:
				if(['left', 'center', 'right'].member(arguments[0])) {
					var oldValue = this._horizontalAlign;
					this._horizontalAlign = arguments[0];
					if(this._horizontalAlign !== oldValue) {
						this._isChanged = true;
					}	
				}
				break;
				
			default:
				//TODO error
				break;
		}
	},
	
	rotate: function() {
		switch(arguments.length) {
			case 0:
				return this._rotate;
			case 1:
				if (this._rotate != arguments[0]) {
					this._rotate = arguments[0];
					this._rotationPoint = undefined;
					this._isChanged = true;
				}
			case 2:
				if(this._rotate != arguments[0] ||
				   !this._rotationPoint ||
				   this._rotationPoint.x != arguments[1].x ||
				   this._rotationPoint.y != arguments[1].y) {
					this._rotate = arguments[0];
					this._rotationPoint = arguments[1];
					this._isChanged = true;
				}
				
		}
	},
	
	hide: function() {
		if(this.isVisible) {
			this.isVisible = false;
			this._isChanged = true;
		}
	},
	
	show: function() {
		if(!this.isVisible) {
			this.isVisible = true;
			this._isChanged = true;
		}
	},
	
	/**
	 * iterates parent nodes till it finds a SVG font-size
	 * attribute.
	 * @param {SVGElement} node
	 */
	getInheritedFontSize: function(node) {
		if(!node || !node.getAttributeNS)
			return;
			
		var attr = node.getAttributeNS(null, "font-size");
		if(attr) {
			return parseFloat(attr);
		} else if(!ORYX.Editor.checkClassType(node, SVGSVGElement)) {
			return this.getInheritedFontSize(node.parentNode);
		}
	},
	
	/**
	 * Get trimmed text length for use with
	 * getExtentOfChar and getSubStringLength.
	 * @param {String} text
	 */
	getTrimmedTextLength: function(text) {
		text = text.strip().gsub('  ', ' ');
		
		var oldLength;
		do {
			oldLength = text.length;
			text = text.gsub('  ', ' ');
		} while (oldLength > text.length);

		return text.length;
	},
	
	toString: function() { return "Label " + this.id }
 });/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespace
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.StencilSet) {ORYX.Core.StencilSet = {};}

/**
 * Class Stencil
 * uses Prototpye 1.5.0
 * uses Inheritance
 * 
 * This class represents one stencil of a stencil set.
 */
ORYX.Core.StencilSet.Stencil = Clazz.extend({

	/**
	 * Constructor
	 */
	construct: function(jsonStencil, namespace, source, stencilSet, propertyPackages) {
		arguments.callee.$.construct.apply(this, arguments); // super();
		
		// check arguments and set defaults.
		if(!jsonStencil) throw "Stencilset seems corrupt.";
		if(!namespace) throw "Stencil does not provide namespace.";
		if(!source) throw "Stencil does not provide SVG source.";
		if(!stencilSet) throw "Fatal internal error loading stencilset.";
		//if(!propertyPackages) throw "Fatal internal error loading stencilset.";
		
		this._source = source;
		this._jsonStencil = jsonStencil;
		this._stencilSet = stencilSet;
		this._namespace = namespace;
		//this._propertyPackages = propertyPackages;
		
		this._view;
		this._properties = new Hash();

		// check stencil consistency and set defaults.
		/*with(this._jsonStencil) {
			
			if(!type) throw "Stencil does not provide type.";
			if((type != "edge") && (type != "node"))
				throw "Stencil type must be 'edge' or 'node'.";
			if(!id || id == "") throw "Stencil does not provide valid id.";
			if(!title || title == "")
				throw "Stencil does not provide title";
			if(!description) { description = ""; };
			if(!groups) { groups = []; }
			if(!roles) { roles = []; }

			// add id of stencil to its roles
			roles.push(id);
		}*/
		
		//init all JSON values
		if(!this._jsonStencil.type || !(this._jsonStencil.type === "edge" || this._jsonStencil.type === "node")) {
			throw "ORYX.Core.StencilSet.Stencil(construct): Type is not defined.";
		}
		if(!this._jsonStencil.id || this._jsonStencil.id === "") {
			throw "ORYX.Core.StencilSet.Stencil(construct): Id is not defined.";
		}
		if(!this._jsonStencil.title || this._jsonStencil.title === "") {
			throw "ORYX.Core.StencilSet.Stencil(construct): Title is not defined.";
		}

		if(!this._jsonStencil.description) { this._jsonStencil.description = ""; };
		if(!this._jsonStencil.groups) { this._jsonStencil.groups = []; }
		if(!this._jsonStencil.roles) { this._jsonStencil.roles = []; }
		
		//add id of stencil to its roles
		this._jsonStencil.roles.push(this._jsonStencil.id);

		//prepend namespace to each role
		this._jsonStencil.roles.each((function(role, index) {
			this._jsonStencil.roles[index] = namespace + role;
		}).bind(this));

		//delete duplicate roles
		this._jsonStencil.roles = this._jsonStencil.roles.uniq();

		//make id unique by prepending namespace of stencil set
		this._jsonStencil.id = namespace + this._jsonStencil.id;

		this.postProcessProperties();
		
		// init serialize callback
		if(!this._jsonStencil.serialize) {
			this._jsonStencil.serialize = function(shape, data) { return data;};
		}
		
		// init deserialize callback
		if(!this._jsonStencil.deserialize) {
			this._jsonStencil.deserialize = function(shape, data) { return data;};
		}
		
		// init layout callback
		if(!this._jsonStencil.layout) {
			this._jsonStencil.layout = function(shape) { return true; };
		}
		
		//TODO does not work correctly, if the url does not exist
		//How to guarantee that the view is loaded correctly before leaving the constructor???
		var url = source + "view/" + jsonStencil.view;
		// override content type when this is webkit.
		
		/*
		if(Prototype.Browser.WebKit) {
			
			var req = new XMLHttpRequest;
			req.open("GET", url, false);
			req.overrideMimeType('text/xml');
			req.send(null);
			req.onload = (function() { _loadSVGOnSuccess(req.responseXML); }).bind(this);

		// else just do it.
		} else
		*/
		
		if(this._jsonStencil.view.trim().match(/</)) {
			var parser	= new DOMParser();		
			var xml 	= parser.parseFromString( this._jsonStencil.view ,"text/xml");
			
			//check if result is a SVG document
			if( ORYX.Editor.checkClassType( xml.documentElement, SVGSVGElement )) {
	
				this._view = xml.documentElement;
				
				//updating link to images
				var imageElems = this._view.getElementsByTagNameNS("http://www.w3.org/2000/svg", "image");
				$A(imageElems).each((function(imageElem) {
					var link = imageElem.getAttributeNodeNS("http://www.w3.org/1999/xlink", "href");
					if(link && link.value.indexOf("://") == -1) {
						link.textContent = this._source + "view/" + link.value;
					}
				}).bind(this));
			} else {
				throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnSuccess): The response is not a SVG document."
			}
		} else {
			new Ajax.Request(
				url, {
					asynchronous:false, method:'get',
					onSuccess:this._loadSVGOnSuccess.bind(this),
					onFailure:this._loadSVGOnFailure.bind(this)
			});
		}
	},

	postProcessProperties: function() {

		// add image path to icon
		if(this._jsonStencil.icon && this._jsonStencil.icon.indexOf("://") === -1) {
			this._jsonStencil.icon = this._source + "icons/" + this._jsonStencil.icon;
		} else {
			this._jsonStencil.icon = "";
		}
		
		// init properties
		if(this._jsonStencil.properties && this._jsonStencil.properties instanceof Array) {
			this._jsonStencil.properties.each((function(prop) {
				var oProp = new ORYX.Core.StencilSet.Property(prop, this._namespace, this);
				this._properties[oProp.prefix() + "-" + oProp.id()] = oProp;
			}).bind(this));
		}
		
		// init property packages
		/*if(this._jsonStencil.propertyPackages && this._jsonStencil.propertyPackages instanceof Array) {
			this._jsonStencil.propertyPackages.each((function(ppId) {
				var pp = this._propertyPackages[ppId];
				
				pp.each((function(prop){
					var oProp = new ORYX.Core.StencilSet.Property(prop, this._namespace, this);
					this._properties[oProp.prefix() + "-" + oProp.id()] = oProp;
				}).bind(this));
			}).bind(this));
		}*/
	},

	/**
	 * @param {ORYX.Core.StencilSet.Stencil} stencil
	 * @return {Boolean} True, if stencil has the same namespace and type.
	 */
	equals: function(stencil) {
		return (this.id() === stencil.id());
	},

	stencilSet: function() {
		return this._stencilSet;
	},

	type: function() {
		return this._jsonStencil.type;
	},

	namespace: function() {
		return this._namespace;
	},

	id: function() {
		return this._jsonStencil.id;
	},

	title: function() {
		return ORYX.Core.StencilSet.getTranslation(this._jsonStencil, "title");
	},

	description: function() {
		return ORYX.Core.StencilSet.getTranslation(this._jsonStencil, "description");
	},
	
	groups: function() {
		return ORYX.Core.StencilSet.getTranslation(this._jsonStencil, "groups");
	},

	view: function() {
		return this._view.cloneNode(true) || this._view;
	},

	icon: function() {
		return this._jsonStencil.icon;
	},
	
	hasMultipleRepositoryEntries: function() {
		return (this.getRepositoryEntries().length > 0);
	},
	
	getRepositoryEntries: function() {
		return (this._jsonStencil.repositoryEntries) ?
			$A(this._jsonStencil.repositoryEntries) : $A([]);
	},
	
	properties: function() {
		return this._properties.values();
	},

	property: function(id) {
		return this._properties[id];
	},

	roles: function() {
		return this._jsonStencil.roles;
	},

	serialize: function(shape, data) {
		return this._jsonStencil.serialize(shape, data);
	},
	
	deserialize: function(shape, data) {
		return this._jsonStencil.deserialize(shape, data);
	},
	
	layout: function(shape, targetShape) {
		return this._jsonStencil.layout(shape, targetShape);
	},
	
	addProperty: function(property, namespace) {
		if(property && namespace) {
			var oProp = new ORYX.Core.StencilSet.Property(property, namespace, this);
			this._properties[oProp.prefix() + "-" + oProp.id()] = oProp;
		}
	},
	
	removeProperty: function(propertyId) {
		if(propertyId) {
			var oProp = this._properties.values().find(function(prop) {
				return (propertyId == prop.id());
			});
			if(oProp)
				delete this._properties[oProp.prefix() + "-" + oProp.id()];
		}
	},

	_loadSVGOnSuccess: function(result) {
		
		var xml = null;
		
		/*
		 * We want to get a dom object for the requested file. Unfortunately,
		 * safari has some issues here. this is meant as a fallback for all
		 * browsers that don't recognize the svg mimetype as XML but support
		 * data: urls on Ajax calls.
		 */
		
		// responseXML != undefined.
		// if(!(result.responseXML))
		
			// get the dom by data: url.
			// xml = _evenMoreEvilHack(result.responseText, 'text/xml');
		
		// else
		
			// get it the usual way.
			xml = result.responseXML;

		//check if result is a SVG document
		if( ORYX.Editor.checkClassType( xml.documentElement, SVGSVGElement )) {

			this._view = xml.documentElement;
			
			//updating link to images
			var imageElems = this._view.getElementsByTagNameNS("http://www.w3.org/2000/svg", "image");
			$A(imageElems).each((function(imageElem) {
				var link = imageElem.getAttributeNodeNS("http://www.w3.org/1999/xlink", "href");
				if(link && link.value.indexOf("://") == -1) {
					link.textContent = this._source + "view/" + link.value;
				}
			}).bind(this));
		} else {
			throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnSuccess): The response is not a SVG document."
		}
	},

	_loadSVGOnFailure: function(result) {
		throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnFailure): Loading SVG document failed."
	},

	toString: function() { return "Stencil " + this.title() + " (" + this.id() + ")"; }
});

/**
 * Transform a string into an xml document, the Safari way, as long as
 * the nightlies are broken. Even more evil version.
 * @param {Object} str
 * @param {Object} contentType
 */
function _evenMoreEvilHack(str, contentType) {
	
	/*
	 * This even more evil hack was taken from
	 * http://web-graphics.com/mtarchive/001606.php#chatty004999
	 */
	
	if (window.ActiveXObject) {
		var d = new ActiveXObject("MSXML.DomDocument");
		d.loadXML(str);
		return d;
	} else if (window.XMLHttpRequest) {
		var req = new XMLHttpRequest;
		req.open("GET", "data:" + (contentType || "application/xml") +
						";charset=utf-8," + encodeURIComponent(str), false);
		if (req.overrideMimeType) {
			req.overrideMimeType(contentType);
		}
		req.send(null);
		return req.responseXML;
	}
}

/**
 * Transform a string into an xml document, the Safari way, as long as
 * the nightlies are broken.
 * @param {Object} result the xml document object.
 */
function _evilSafariHack(serializedXML) {
	
	/*
	 *  The Dave way. Taken from:
	 *  http://web-graphics.com/mtarchive/001606.php
	 *  
	 *  There is another possibility to parse XML in Safari, by implementing
	 *  the DOMParser in javascript. However, in the latest nightlies of
	 *  WebKit, DOMParser is already available, but still buggy. So, this is
	 *  the best compromise for the time being.
	 */		
	
	var xml = serializedXML;
	var url = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
	var dom = null;
	
	// your standard AJAX stuff
	var req = new XMLHttpRequest();
	req.open("GET", url);
	req.onload = function() { dom = req.responseXML; }
	req.send(null);
	
	return dom;
}
	
/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
/**
 * Init namespace
 */
if (!ORYX) {
    var ORYX = {};
}
if (!ORYX.Core) {
    ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
    ORYX.Core.StencilSet = {};
}

/**
 * Class Property
 * uses Prototpye 1.5.0
 * uses Inheritance
 */
ORYX.Core.StencilSet.Property = Clazz.extend({

    /**
     * Constructor
     */
    construct: function(jsonProp, namespace, stencil){
        arguments.callee.$.construct.apply(this, arguments);
        
        this._jsonProp = jsonProp || ORYX.Log.error("Parameter jsonProp is not defined.");
        this._namespace = namespace || ORYX.Log.error("Parameter namespace is not defined.");
        this._stencil = stencil || ORYX.Log.error("Parameter stencil is not defined.");
        
        this._items = new Hash();
        this._complexItems = new Hash();
        
        jsonProp.id = jsonProp.id || ORYX.Log.error("ORYX.Core.StencilSet.Property(construct): Id is not defined.");
		jsonProp.id = jsonProp.id.toLowerCase();
		
        if (!jsonProp.type) {
            ORYX.Log.info("Type is not defined for stencil '%0', id '%1'. Falling back to 'String'.", stencil, jsonProp.id);
            jsonProp.type = "string";
        }
        else {
            jsonProp.type = jsonProp.type.toLowerCase();
        }
        
        jsonProp.prefix = jsonProp.prefix || "oryx";
        jsonProp.title = jsonProp.title || "";
        jsonProp.value = jsonProp.value || "";
        jsonProp.description = jsonProp.description || "";
        jsonProp.readonly = jsonProp.readonly || false;
        if(jsonProp.optional != false)
        	jsonProp.optional = true;
        
        //init refToView
        if (this._jsonProp.refToView) {
            if (!(this._jsonProp.refToView instanceof Array)) {
                this._jsonProp.refToView = [this._jsonProp.refToView];
            }
        }
        else {
            this._jsonProp.refToView = [];
        }
        
        if (jsonProp.min === undefined || jsonProp.min === null) {
            jsonProp.min = Number.MIN_VALUE;
        }
        
        if (jsonProp.max === undefined || jsonProp.max === null) {
            jsonProp.max = Number.MAX_VALUE;
        }
        
        if (!jsonProp.fillOpacity) {
            jsonProp.fillOpacity = false;
        }
        
        if (!jsonProp.strokeOpacity) {
            jsonProp.strokeOpacity = false;
        }
        
        if (jsonProp.length === undefined || jsonProp.length === null) {
            jsonProp.length = Number.MAX_VALUE;
        }
        
        if (!jsonProp.wrapLines) {
            jsonProp.wrapLines = false;
        }
        
        if (!jsonProp.dateFormat) {
            jsonProp.dataFormat = "m/d/y";
        }
        
        if (!jsonProp.fill) {
            jsonProp.fill = false;
        }
        
        if (!jsonProp.stroke) {
            jsonProp.stroke = false;
        }
        
        if (jsonProp.type === ORYX.CONFIG.TYPE_CHOICE) {
            if (jsonProp.items && jsonProp.items instanceof Array) {
                jsonProp.items.each((function(jsonItem){
                	// why is the item's value used as the key???
                    this._items[jsonItem.value] = new ORYX.Core.StencilSet.PropertyItem(jsonItem, namespace, this);
                }).bind(this));
            }
            else {
                throw "ORYX.Core.StencilSet.Property(construct): No property items defined."
            }
            // extended by Kerstin (start)
        }
        else 
            if (jsonProp.type === ORYX.CONFIG.TYPE_COMPLEX) {
                if (jsonProp.complexItems && jsonProp.complexItems instanceof Array) {
                    jsonProp.complexItems.each((function(jsonComplexItem){
                        this._complexItems[jsonComplexItem.id] = new ORYX.Core.StencilSet.ComplexPropertyItem(jsonComplexItem, namespace, this);
                    }).bind(this));
                }
                else {
                    throw "ORYX.Core.StencilSet.Property(construct): No complex property items defined."
                }
            }
        // extended by Kerstin (end)
    },
    
    /**
     * @param {ORYX.Core.StencilSet.Property} property
     * @return {Boolean} True, if property has the same namespace and id.
     */
    equals: function(property){
        return (this._namespace === property.namespace() &&
        this.id() === property.id()) ? true : false;
    },
    
    namespace: function(){
        return this._namespace;
    },
    
    stencil: function(){
        return this._stencil;
    },
    
    id: function(){
        return this._jsonProp.id;
    },
    
    prefix: function(){
        return this._jsonProp.prefix;
    },
    
    type: function(){
        return this._jsonProp.type;
    },
    
    title: function(){
        return ORYX.Core.StencilSet.getTranslation(this._jsonProp, "title");
    },
    
    value: function(){
        return this._jsonProp.value;
    },
    
    readonly: function(){
        return this._jsonProp.readonly;
    },
    
    optional: function(){
        return this._jsonProp.optional;
    },
    
    description: function(){
        return ORYX.Core.StencilSet.getTranslation(this._jsonProp, "description");
    },
    
    /**
     * An optional link to a SVG element so that the property affects the
     * graphical representation of the stencil.
     */
    refToView: function(){
        return this._jsonProp.refToView;
    },
    
    /**
     * If type is integer or float, min is the lower bounds of value.
     */
    min: function(){
        return this._jsonProp.min;
    },
    
    /**
     * If type ist integer or float, max is the upper bounds of value.
     */
    max: function(){
        return this._jsonProp.max;
    },
    
    /**
     * If type is float, this method returns if the fill-opacity property should
     *  be set.
     *  @return {Boolean}
     */
    fillOpacity: function(){
        return this._jsonProp.fillOpacity;
    },
    
    /**
     * If type is float, this method returns if the stroke-opacity property should
     *  be set.
     *  @return {Boolean}
     */
    strokeOpacity: function(){
        return this._jsonProp.strokeOpacity;
    },
    
    /**
     * If type is string or richtext, length is the maximum length of the text.
     * TODO how long can a string be.
     */
    length: function(){
        return this._jsonProp.length ? this._jsonProp.length : Number.MAX_VALUE;
    },
    
    wrapLines: function(){
        return this._jsonProp.wrapLines;
    },
    
    /**
     * If type is date, dateFormat specifies the format of the date. The format
     * specification of the ext library is used:
     *
     * Format  Output      Description
     *	------  ----------  --------------------------------------------------------------
     *	  d      10         Day of the month, 2 digits with leading zeros
     *	  D      Wed        A textual representation of a day, three letters
     *	  j      10         Day of the month without leading zeros
     *	  l      Wednesday  A full textual representation of the day of the week
     *	  S      th         English ordinal day of month suffix, 2 chars (use with j)
     *	  w      3          Numeric representation of the day of the week
     *	  z      9          The julian date, or day of the year (0-365)
     *	  W      01         ISO-8601 2-digit week number of year, weeks starting on Monday (00-52)
     *	  F      January    A full textual representation of the month
     *	  m      01         Numeric representation of a month, with leading zeros
     *	  M      Jan        Month name abbreviation, three letters
     *	  n      1          Numeric representation of a month, without leading zeros
     *	  t      31         Number of days in the given month
     *	  L      0          Whether its a leap year (1 if it is a leap year, else 0)
     *	  Y      2007       A full numeric representation of a year, 4 digits
     *	  y      07         A two digit representation of a year
     *	  a      pm         Lowercase Ante meridiem and Post meridiem
     *	  A      PM         Uppercase Ante meridiem and Post meridiem
     *	  g      3          12-hour format of an hour without leading zeros
     *	  G      15         24-hour format of an hour without leading zeros
     *	  h      03         12-hour format of an hour with leading zeros
     *	  H      15         24-hour format of an hour with leading zeros
     *	  i      05         Minutes with leading zeros
     *	  s      01         Seconds, with leading zeros
     *	  O      -0600      Difference to Greenwich time (GMT) in hours
     *	  T      CST        Timezone setting of the machine running the code
     *	  Z      -21600     Timezone offset in seconds (negative if west of UTC, positive if east)
     *
     * Example:
     *  F j, Y, g:i a  ->  January 10, 2007, 3:05 pm
     */
    dateFormat: function(){
        return this._jsonProp.dateFormat;
    },
    
    /**
     * If type is color, this method returns if the fill property should
     *  be set.
     *  @return {Boolean}
     */
    fill: function(){
        return this._jsonProp.fill;
    },
    
    /**
     * If type is color, this method returns if the stroke property should
     *  be set.
     *  @return {Boolean}
     */
    stroke: function(){
        return this._jsonProp.stroke;
    },
    
    /**
     * If type is choice, items is a hash map with all alternative values
     * (PropertyItem objects) with id as keys.
     */
    items: function(){
        return this._items.values();
    },
    
    item: function(value){
        return this._items[value];
    },
    
    toString: function(){
        return "Property " + this.title() + " (" + this.id() + ")";
    },
    
    // extended by Kerstin (start)
    complexItems: function(){
        return this._complexItems.values();
    },
    
    complexItem: function(id){
        return this._complexItems[id];
    }
    // extended by Kerstin (end)
});
/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespace
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.StencilSet) {ORYX.Core.StencilSet = {};}

/**
 * Class Stencil
 * uses Prototpye 1.5.0
 * uses Inheritance
 */
ORYX.Core.StencilSet.PropertyItem = Clazz.extend({

	/**
	 * Constructor
	 */
	construct: function(jsonItem, namespace, property) {
		arguments.callee.$.construct.apply(this, arguments);

		if(!jsonItem) {
			throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter jsonItem is not defined.";
		}
		if(!namespace) {
			throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter namespace is not defined.";
		}
		if(!property) {
			throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter property is not defined.";
		}
		
		this._jsonItem = jsonItem;
		this._namespace = namespace;
		this._property = property;
		
		//init all values
		if(!jsonItem.value) {
			throw "ORYX.Core.StencilSet.PropertyItem(construct): Value is not defined.";
		}
		
		if(this._jsonItem.refToView) {
			if(!(this._jsonItem.refToView instanceof Array)) {
				this._jsonItem.refToView = [this._jsonItem.refToView];
			}
		} else {
			this._jsonItem.refToView = [];
		}
	},

	/**
	 * @param {ORYX.Core.StencilSet.PropertyItem} item
	 * @return {Boolean} True, if item has the same namespace and id.
	 */
	equals: function(item) {
		return (this.property().equals(item.property()) &&
			this.value() === item.value());
	},

	namespace: function() {
		return this._namespace;
	},

	property: function() {
		return this._property;
	},

	value: function() {
		return this._jsonItem.value;
	},

	refToView: function() {
		return this._jsonItem.refToView;
	},

	toString: function() { return "PropertyItem " + this.property() + " (" + this.value() + ")"; }
});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.StencilSet) {ORYX.Core.StencilSet = {};}

/**
 * Class Stencil
 * uses Prototpye 1.5.0
 * uses Inheritance
 */
ORYX.Core.StencilSet.ComplexPropertyItem = Clazz.extend({

	/**
	 * Constructor
	 */
	construct: function(jsonItem, namespace, property) {
		arguments.callee.$.construct.apply(this, arguments);

		if(!jsonItem) {
			throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter jsonItem is not defined.";
		}
		if(!namespace) {
			throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter namespace is not defined.";
		}
		if(!property) {
			throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter property is not defined.";
		}
		
		this._jsonItem = jsonItem;
		this._namespace = namespace;
		this._property = property;
		this._items = new Hash();
		
		//init all values
		if(!jsonItem.name) {
			throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Name is not defined.";
		}
		
		if(!jsonItem.type) {
			throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Type is not defined.";
		} else {
			jsonItem.type = jsonItem.type.toLowerCase();
		}
		
		if(jsonItem.type === ORYX.CONFIG.TYPE_CHOICE) {
			if(jsonItem.items && jsonItem.items instanceof Array) {
				jsonItem.items.each((function(item) {
					this._items[item.value] = new ORYX.Core.StencilSet.PropertyItem(item, namespace, this);
				}).bind(this));
			} else {
				throw "ORYX.Core.StencilSet.Property(construct): No property items defined."
			}
		}
	},

	/**
	 * @param {ORYX.Core.StencilSet.PropertyItem} item
	 * @return {Boolean} True, if item has the same namespace and id.
	 */
	equals: function(item) {
		return (this.property().equals(item.property()) &&
			this.name() === item.name());
	},

	namespace: function() {
		return this._namespace;
	},

	property: function() {
		return this._property;
	},

	name: function() {
		return ORYX.Core.StencilSet.getTranslation(this._jsonItem, "name");
	},
	
	id: function() {
		return this._jsonItem.id;
	},
	
	type: function() {
		return this._jsonItem.type;
	},
	
	optional: function() {
		return this._jsonItem.optional;
	},
	
	width: function() {
		return this._jsonItem.width;
	},
	
	value: function() {
		return this._jsonItem.value;
	},
	
	items: function() {
		return this._items.values();
	},
	
	disable: function() {
		return this._jsonItem.disable;
	}
});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.StencilSet) {ORYX.Core.StencilSet = {};}

/**
 * Class Rules
 * uses Prototpye 1.5.0
 * uses Inheritance
 *
 * This class implements the API to check the stencil sets' rules.
 */
ORYX.Core.StencilSet.Rules = {

	/**
	 * Constructor
	 */
	construct: function() {
		arguments.callee.$.construct.apply(this, arguments);

		this._stencilSets = [];
		this._stencils = [];
		
		this._cachedConnectSET = new Hash();
		this._cachedConnectSE = new Hash();
		this._cachedConnectTE = new Hash();
		this._cachedCardSE = new Hash();
		this._cachedCardTE = new Hash();
		this._cachedContainPC = new Hash();
		
		this._connectionRules = new Hash();
		this._cardinalityRules = new Hash();
		this._containmentRules = new Hash();
	},

	initializeRules: function(stencilSet) {
		
		var existingSS = this._stencilSets.find(function(ss) {
							return (ss.namespace() == stencilSet.namespace());
						});
		if (existingSS) {
			//reinitialize all rules
			var stencilsets = this._stencilSets.clone();
			stencilsets = stencilsets.without(existingSS);
			stencilsets.push(stencilSet);
			
			this._stencilSets = [];
			this._stencils = [];
			
			this._cachedConnectSET = new Hash();
			this._cachedConnectSE = new Hash();
			this._cachedConnectTE = new Hash();
			this._cachedCardSE = new Hash();
			this._cachedCardTE = new Hash();
			this._cachedContainPC = new Hash();
			
			this._connectionRules = new Hash();
			this._cardinalityRules = new Hash();
			this._containmentRules = new Hash();
			
			stencilsets.each(function(ss){
				this.initializeRules(ss);
			}.bind(this));
			return;
		}
		else {
			this._stencilSets.push(stencilSet);
			
			var jsonRules = stencilSet.jsonRules();
			var namespace = stencilSet.namespace();
			
			this._stencils = this._stencils.concat(stencilSet.stencils());
			
			//init connection rules
			var cr = this._connectionRules;
			if (jsonRules.connectionRules) {
				jsonRules.connectionRules.each((function(rules){
					if (this._isRoleOfOtherNamespace(rules.role)) {
						if (!cr[rules.role]) {
							cr[rules.role] = new Hash();
						}
					}
					else {
						if (!cr[namespace + rules.role]) 
							cr[namespace + rules.role] = new Hash();
					}
					
					rules.connects.each((function(connect){
						var toRoles = [];
						if (connect.to) {
							if (!(connect.to instanceof Array)) {
								connect.to = [connect.to];
							}
							connect.to.each((function(to){
								if (this._isRoleOfOtherNamespace(to)) {
									toRoles.push(to);
								}
								else {
									toRoles.push(namespace + to);
								}
							}).bind(this));
						}
						
						var role, from;
						if (this._isRoleOfOtherNamespace(rules.role)) 
							role = rules.role;
						else 
							role = namespace + rules.role;
						
						if (this._isRoleOfOtherNamespace(connect.from)) 
							from = connect.from;
						else 
							from = namespace + connect.from;
						
						if (!cr[role][from]) 
							cr[role][from] = toRoles;
						else 
							cr[role][from] = cr[role][from].concat(toRoles);
						
					}).bind(this));
				}).bind(this));
			}
			
			//init cardinality rules
			var cardr = this._cardinalityRules;
			if (jsonRules.cardinalityRules) {
				jsonRules.cardinalityRules.each((function(rules){
					var cardrKey;
					if (this._isRoleOfOtherNamespace(rules.role)) {
						cardrKey = rules.role;
					}
					else {
						cardrKey = namespace + rules.role;
					}
					
					if (!cardr[cardrKey]) {
						cardr[cardrKey] = {};
						for (i in rules) {
							cardr[cardrKey][i] = rules[i];
						}
					}
					
					var oe = new Hash();
					if (rules.outgoingEdges) {
						rules.outgoingEdges.each((function(rule){
							if (this._isRoleOfOtherNamespace(rule.role)) {
								oe[rule.role] = rule;
							}
							else {
								oe[namespace + rule.role] = rule;
							}
						}).bind(this));
					}
					cardr[cardrKey].outgoingEdges = oe;
					var ie = new Hash();
					if (rules.incomingEdges) {
						rules.incomingEdges.each((function(rule){
							if (this._isRoleOfOtherNamespace(rule.role)) {
								ie[rule.role] = rule;
							}
							else {
								ie[namespace + rule.role] = rule;
							}
						}).bind(this));
					}
					cardr[cardrKey].incomingEdges = ie;
				}).bind(this));
			}
			
			//init containment rules
			var conr = this._containmentRules;
			if (jsonRules.containmentRules) {
				jsonRules.containmentRules.each((function(rules){
					var conrKey;
					if (this._isRoleOfOtherNamespace(rules.role)) {
						conrKey = rules.role;
					}
					else {
						conrKey = namespace + rules.role;
					}
					if (!conr[conrKey]) {
						conr[conrKey] = [];
					}
					rules.contains.each((function(containRole){
						if (this._isRoleOfOtherNamespace(containRole)) {
							conr[conrKey].push(containRole);
						}
						else {
							conr[conrKey].push(namespace + containRole);
						}
					}).bind(this));
				}).bind(this));
			}
		}
	},
	
	_cacheConnect: function(args) {
		result = this._canConnect(args);
		
		if (args.sourceStencil && args.targetStencil) {
			var source = this._cachedConnectSET[args.sourceStencil.id()];
			
			if(!source) {
				source = new Hash();
				this._cachedConnectSET[args.sourceStencil.id()] = source;
			}
			
			var edge = source[args.edgeStencil.id()];
			
			if(!edge) {
				edge = new Hash();
				source[args.edgeStencil.id()] = edge;
			}
			
			edge[args.targetStencil.id()] = result;
			
		} else if (args.sourceStencil) {
			var source = this._cachedConnectSE[args.sourceStencil.id()];
			
			if(!source) {
				source = new Hash();
				this._cachedConnectSE[args.sourceStencil.id()] = source;
			}
			
			source[args.edgeStencil.id()] = result;

		} else {
			var target = this._cachedConnectTE[args.targetStencil.id()];
			
			if(!target) {
				target = new Hash();
				this._cachedConnectTE[args.targetStencil.id()] = target;
			}
			
			target[args.edgeStencil.id()] = result;
		}
		
		return result;
	},
	
	_cacheCard: function(args) {
			
		if(args.sourceStencil) {
			var source = this._cachedCardSE[args.sourceStencil.id()]
			
			if(!source) {
				source = new Hash();
				this._cachedCardSE[args.sourceStencil.id()] = source;
			}
			
			var max = this._getMaximumNumberOfOutgoingEdge(args);
			if(max == undefined)
				max = -1;
				
			source[args.edgeStencil.id()] = max;
		}	
		
		if(args.targetStencil) {
			var target = this._cachedCardTE[args.targetStencil.id()]
			
			if(!target) {
				target = new Hash();
				this._cachedCardTE[args.targetStencil.id()] = target;
			}
			
			var max = this._getMaximumNumberOfIncomingEdge(args);
			if(max == undefined)
				max = -1;
				
			target[args.edgeStencil.id()] = max;
		}
	},
	
	_cacheContain: function(args) {
		
		var result = [this._canContain(args), 
					  this._getMaximumOccurrence(args.containingStencil, args.containedStencil)]
		
		if(result[1] == undefined) 
			result[1] = -1;
		
		var children = this._cachedContainPC[args.containingStencil.id()];
		
		if(!children) {
			children = new Hash();
			this._cachedContainPC[args.containingStencil.id()] = children;
		}
		
		children[args.containedStencil.id()] = result;
		
		return result;
	},

	/** Begin connection rules' methods */
	
	/**
	 * 
	 * @param {Object} args
	 *  sourceStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  sourceShape:   ORYX.Core.Shape | undefined
	 *  
	 *  At least sourceStencil or sourceShape has to be specified
	 *  
	 * @return {Array} Array of stencils of edges that can be outgoing edges of
	 * 				   the source.
	 */
	outgoingEdgeStencils: function(args) {
		//check arguments
		if(!args.sourceShape && !args.sourceStencil) {
			return [];
		}
		
		//init arguments
		if(args.sourceShape) {
			args.sourceStencil = args.sourceShape.getStencil();
		}
		
		var _edges = [];
		
		//test each edge, if it can connect to source
		this._stencils.each((function(stencil) {
			if(stencil.type() === "edge") {
				var newArgs = Object.clone(args);
				newArgs.edgeStencil = stencil;
				if(this.canConnect(newArgs)) {
					_edges.push(stencil);
				}
			}
		}).bind(this));

		return _edges;
	},

	/**
	 * 
	 * @param {Object} args
	 *  targetStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  targetShape:   ORYX.Core.Shape | undefined
	 *  
	 *  At least targetStencil or targetShape has to be specified
	 *  
	 * @return {Array} Array of stencils of edges that can be incoming edges of
	 * 				   the target.
	 */
	incomingEdgeStencils: function(args) {
		//check arguments
		if(!args.targetShape && !args.targetStencil) {
			return [];
		}
		
		//init arguments
		if(args.targetShape) {
			args.targetStencil = args.targetShape.getStencil();
		}
		
		var _edges = [];
		
		//test each edge, if it can connect to source
		this._stencils.each((function(stencil) {
			if(stencil.type() === "edge") {
				var newArgs = Object.clone(args);
				newArgs.edgeStencil = stencil;
				if(this.canConnect(newArgs)) {
					_edges.push(stencil);
				}
			}
		}).bind(this));

		return _edges;
	},
	
	/**
	 * 
	 * @param {Object} args
	 *  edgeStencil:   ORYX.Core.StencilSet.Stencil | undefined
	 *  edgeShape:     ORYX.Core.Edge | undefined
	 *  targetStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  targetShape:   ORYX.Core.Node | undefined
	 *  
	 *  At least edgeStencil or edgeShape has to be specified!!!
	 *  
	 *  @return {Array} Returns an array of stencils that can be source of 
	 *  				the specified edge.
	 */
	sourceStencils: function(args) {
		//check arguments
		if(!args || 
		   !args.edgeShape && !args.edgeStencil) {
			return [];
		}
		
		//init arguments
		if(args.targetShape) {
			args.targetStencil = args.targetShape.getStencil();
		}
		
		if(args.edgeShape) {
			args.edgeStencil = args.edgeShape.getStencil();
		}
		
		var _sources = [];
		
		//check each stencil, if it can be a source
		this._stencils.each((function(stencil) {
			var newArgs = Object.clone(args);
			newArgs.sourceStencil = stencil;
			if(this.canConnect(newArgs)) {
				_sources.push(stencil);
			}
		}).bind(this));

		return _sources;
	},
	
	/**
	 * 
	 * @param {Object} args
	 *  edgeStencil:   ORYX.Core.StencilSet.Stencil | undefined
	 *  edgeShape:     ORYX.Core.Edge | undefined
	 *  sourceStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  sourceShape:   ORYX.Core.Node | undefined
	 *  
	 *  At least edgeStencil or edgeShape has to be specified!!!
	 *  
	 *  @return {Array} Returns an array of stencils that can be target of 
	 *  				the specified edge.
	 */
	targetStencils: function(args) {
		//check arguments
		if(!args || 
		   !args.edgeShape && !args.edgeStencil) {
			return [];
		}
		
		//init arguments
		if(args.sourceShape) {
			args.sourceStencil = args.sourceShape.getStencil();
		}
		
		if(args.edgeShape) {
			args.edgeStencil = args.edgeShape.getStencil();
		}
		
		var _targets = [];
		
		//check stencil, if it can be a target
		this._stencils.each((function(stencil) {
			var newArgs = Object.clone(args);
			newArgs.targetStencil = stencil;
			if(this.canConnect(newArgs)) {
				_targets.push(stencil);
			}
		}).bind(this));

		return _targets;
	},

	/**
	 * 
	 * @param {Object} args
	 *  edgeStencil:   ORYX.Core.StencilSet.Stencil
	 *  edgeShape:     ORYX.Core.Edge |undefined
	 *  sourceStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  sourceShape:   ORYX.Core.Node |undefined
	 *  targetStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  targetShape:   ORYX.Core.Node |undefined
	 *  
	 *  At least source or target has to be specified!!!
	 *  
	 *  @return {Boolean} Returns, if the edge can connect source and target.
	 */
	canConnect: function(args) {	
		//check arguments
		if(!args ||
		   (!args.sourceShape && !args.sourceStencil &&
		    !args.targetShape && !args.targetStencil) ||
		    !args.edgeShape && !args.edgeStencil) {
		   	return false; 
		}
		
		//init arguments
		if(args.sourceShape) {
			args.sourceStencil = args.sourceShape.getStencil();
		}
		if(args.targetShape) {
			args.targetStencil = args.targetShape.getStencil();
		}
		if(args.edgeShape) {
			args.edgeStencil = args.edgeShape.getStencil();
		}
		
		var result;
		
		if(args.sourceStencil && args.targetStencil) {
			var source = this._cachedConnectSET[args.sourceStencil.id()];
			
			if(!source)
				result = this._cacheConnect(args);
			else {
				var edge = source[args.edgeStencil.id()];

				if(!edge)
					result = this._cacheConnect(args);
				else {	
					var target = edge[args.targetStencil.id()];

					if(target == undefined)
						result = this._cacheConnect(args);
					else
						result = target;
				}
			}
		} else if (args.sourceStencil) {	
			var source = this._cachedConnectSE[args.sourceStencil.id()];
			
			if(!source)
				result = this._cacheConnect(args);
			else {
				var edge = source[args.edgeStencil.id()];
					
				if(edge == undefined)
					result = this._cacheConnect(args);
				else
					result = edge;
			}
		} else { //args.targetStencil
			var target = this._cachedConnectTE[args.targetStencil.id()];
			
			if(!target)
				result = this._cacheConnect(args);
			else {
				var edge = target[args.edgeStencil.id()];
					
				if(edge == undefined)
					result = this._cacheConnect(args);
				else
					result = edge;
			}
		}	
			
		//check cardinality
		if (result) {
			if(args.sourceShape) {
				var source = this._cachedCardSE[args.sourceStencil.id()];
				
				if(!source) {
					this._cacheCard(args);
					source = this._cachedCardSE[args.sourceStencil.id()];
				}
				
				var max = source[args.edgeStencil.id()];
				
				if(max == undefined) {
					this._cacheCard(args);
				}
				
				max = source[args.edgeStencil.id()];
				
				if(max != -1) {
					result = args.sourceShape.getOutgoingShapes().all(function(cs) {
								if((cs.getStencil().id() === args.edgeStencil.id()) && 
								   ((args.edgeShape) ? cs !== args.edgeShape : true)) {
									max--;
									return (max > 0) ? true : false;
								} else {
									return true;
								}
							});
				}
			} 
			
			if (args.targetShape) {
				var target = this._cachedCardTE[args.targetStencil.id()];
				
				if(!target) {
					this._cacheCard(args);
					target = this._cachedCardTE[args.targetStencil.id()];
				}
				
				var max = target[args.edgeStencil.id()];
				
				if(max == undefined) {
					this._cacheCard(args);
				}
				
				max = target[args.edgeStencil.id()];
				
				if(max != -1) {
					result = args.targetShape.getIncomingShapes().all(function(cs){
								if ((cs.getStencil().id() === args.edgeStencil.id()) &&
								((args.edgeShape) ? cs !== args.edgeShape : true)) {
									max--;
									return (max > 0) ? true : false;
								}
								else {
									return true;
								}
							});
				}
			}
		}
		
		return result;
	},
	
	/**
	 * 
	 * @param {Object} args
	 *  edgeStencil:   ORYX.Core.StencilSet.Stencil
	 *  edgeShape:     ORYX.Core.Edge |undefined
	 *  sourceStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  sourceShape:   ORYX.Core.Node |undefined
	 *  targetStencil: ORYX.Core.StencilSet.Stencil | undefined
	 *  targetShape:   ORYX.Core.Node |undefined
	 *  
	 *  At least source or target has to be specified!!!
	 *  
	 *  @return {Boolean} Returns, if the edge can connect source and target.
	 */
	_canConnect: function(args) {
		//check arguments
		if(!args ||
		   (!args.sourceShape && !args.sourceStencil &&
		    !args.targetShape && !args.targetStencil) ||
		    !args.edgeShape && !args.edgeStencil) {
		   	return false; 
		}
		
		//init arguments
		if(args.sourceShape) {
			args.sourceStencil = args.sourceShape.getStencil();
		}
		if(args.targetShape) {
			args.targetStencil = args.targetShape.getStencil();
		}
		if(args.edgeShape) {
			args.edgeStencil = args.edgeShape.getStencil();
		}

		//1. check connection rules
		var resultCR;
		
		//get all connection rules for this edge
		var edgeRules = this._getConnectionRulesOfEdgeStencil(args.edgeStencil);

		//check connection rules, if the source can be connected to the target 
		// with the specified edge.
		if(edgeRules.keys().length === 0) {
			resultCR = false;
		} else {
			if(args.sourceStencil) {
				resultCR = args.sourceStencil.roles().any(function(sourceRole) {
					var targetRoles = edgeRules[sourceRole];

					if(!targetRoles) {return false;}
		
					if(args.targetStencil) {
						return (targetRoles.any(function(targetRole) {
							return args.targetStencil.roles().member(targetRole);
						}));
					} else {
						return true;
					}
				});
			} else { //!args.sourceStencil -> there is args.targetStencil
				resultCR = edgeRules.values().any(function(targetRoles) {
					return args.targetStencil.roles().any(function(targetRole) {
						return targetRoles.member(targetRole);
					});
				});
			}
		}
		
		return resultCR;
	},

	/** End connection rules' methods */


	/** Begin containment rules' methods */

	/**
	 * 
	 * @param {Object} args
	 *  containingStencil: ORYX.Core.StencilSet.Stencil
	 *  containingShape:   ORYX.Core.AbstractShape
	 *  containedStencil:  ORYX.Core.StencilSet.Stencil
	 *  containedShape:    ORYX.Core.Shape
	 */
	canContain: function(args) {
		if(!args ||
		   !args.containingStencil && !args.containingShape ||
		   !args.containedStencil && !args.containedShape) {
		   	return false;
		}
		
		//init arguments
		if(args.containedShape) {
			args.containedStencil = args.containedShape.getStencil();
		}
		
		if(args.containingShape) {
			args.containingStencil = args.containingShape.getStencil();
		}
		
		if(args.containingStencil.type() == 'edge' || args.containedStencil.type() == 'edge')
			return false;
		
		var childValues;
		
		var parent = this._cachedContainPC[args.containingStencil.id()];
		
		if(!parent)
			childValues = this._cacheContain(args);
		else {
			childValues = parent[args.containedStencil.id()];
			
			if(!childValues)
				childValues = this._cacheContain(args);
		}

		if(!childValues[0])
			return false;
		else if (childValues[1] == -1)
			return true;
		else {
			if(args.containingShape) {
				var max = childValues[1];
				return args.containingShape.getChildShapes(false).all(function(as) {
					if(as.getStencil().id() === args.containedStencil.id()) {
						max--;
						return (max > 0) ? true : false;
					} else {
						return true;
					}
				});
			} else {
				return true;
			}
		}
	},
	
	/**
	 * 
	 * @param {Object} args
	 *  containingStencil: ORYX.Core.StencilSet.Stencil
	 *  containingShape:   ORYX.Core.AbstractShape
	 *  containedStencil:  ORYX.Core.StencilSet.Stencil
	 *  containedShape:    ORYX.Core.Shape
	 */
	_canContain: function(args) {
		if(!args ||
		   !args.containingStencil && !args.containingShape ||
		   !args.containedStencil && !args.containedShape) {
		   	return false;
		}
		
		//init arguments
		if(args.containedShape) {
			args.containedStencil = args.containedShape.getStencil();
		}
		
		if(args.containingShape) {
			args.containingStencil = args.containingShape.getStencil();
		}
		
		if(args.containingShape) {
			if(args.containingShape instanceof ORYX.Core.Edge) {
				//edges cannot contain other shapes
				return false;
			}
		}

		
		var result;
		
		//check containment rules
		result = args.containingStencil.roles().any((function(role) {
			var roles = this._containmentRules[role];
			if(roles) {
				return roles.any(function(role) {
					return args.containedStencil.roles().member(role);
				});
			} else {
				return false;
			}
		}).bind(this));
		
		return result;
	},
	
	/** End containment rules' methods */


	/** Helper methods */

	/**
	 * 
	 * @param {String} role
	 * 
	 * @return {Array} Returns an array of stencils that can act as role.
	 */
	_stencilsWithRole: function(role) {
		return this._stencils.findAll(function(stencil) {
			return (stencil.roles().member(role)) ? true : false;
		});
	},
	
	/**
	 * 
	 * @param {String} role
	 * 
	 * @return {Array} Returns an array of stencils that can act as role and
	 * 				   have the type 'edge'.
	 */
	_edgesWithRole: function(role) {
		return this._stencils.findAll(function(stencil) {
			return (stencil.roles().member(role) && stencil.type() === "edge") ? true : false;
		});
	},
	
	/**
	 * 
	 * @param {String} role
	 * 
	 * @return {Array} Returns an array of stencils that can act as role and
	 * 				   have the type 'node'.
	 */
	_nodesWithRole: function(role) {
		return this._stencils.findAll(function(stencil) {
			return (stencil.roles().member(role) && stencil.type() === "node") ? true : false;
		});
	},

	/**
	 * 
	 * @param {ORYX.Core.StencilSet.Stencil} parent
	 * @param {ORYX.Core.StencilSet.Stencil} child
	 * 
	 * @returns {Boolean} Returns the maximum occurrence of shapes of the 
	 * 					  stencil's type inside the parent.
	 */
	_getMaximumOccurrence: function(parent, child) {
		var max;
		child.roles().each((function(role) {
			var cardRule = this._cardinalityRules[role];
			if(cardRule && cardRule.maximumOccurrence) {
				if(max) {
					max = Math.min(max, cardRule.maximumOccurrence);
				} else {
					max = cardRule.maximumOccurrence;
				}
			}
		}).bind(this));

		return max;
	},


	/**
	 * 
	 * @param {Object} args
	 *  sourceStencil: ORYX.Core.Node
	 *  edgeStencil: ORYX.Core.StencilSet.Stencil
	 *  
	 *  @return {Boolean} Returns, the maximum number of outgoing edges of 
	 *  				  the type specified by edgeStencil of the sourceShape.
	 */
	_getMaximumNumberOfOutgoingEdge: function(args) {
		if(!args ||
		   !args.sourceStencil ||
		   !args.edgeStencil) {
		   	return false;
		}
		
		var max;
		args.sourceStencil.roles().each((function(role) {
			var cardRule = this._cardinalityRules[role];

			if(cardRule && cardRule.outgoingEdges) {
				args.edgeStencil.roles().each(function(edgeRole) {
					var oe = cardRule.outgoingEdges[edgeRole];

					if(oe && oe.maximum) {
						if(max) {
							max = Math.min(max, oe.maximum);
						} else {
							max = oe.maximum;
						}
					}
				});
			}
		}).bind(this));

		return max;
	},
	
	/**
	 * 
	 * @param {Object} args
	 *  targetStencil: ORYX.Core.StencilSet.Stencil
	 *  edgeStencil: ORYX.Core.StencilSet.Stencil
	 *  
	 *  @return {Boolean} Returns the maximum number of incoming edges of 
	 *  				  the type specified by edgeStencil of the targetShape.
	 */
	_getMaximumNumberOfIncomingEdge: function(args) {
		if(!args ||
		   !args.targetStencil ||
		   !args.edgeStencil) {
		   	return false;
		}
		
		var max;
		args.targetStencil.roles().each((function(role) {
			var cardRule = this._cardinalityRules[role];
			if(cardRule && cardRule.incomingEdges) {
				args.edgeStencil.roles().each(function(edgeRole) {
					var ie = cardRule.incomingEdges[edgeRole];
					if(ie && ie.maximum) {
						if(max) {
							max = Math.min(max, ie.maximum);
						} else {
							max = ie.maximum;
						}
					}
				});
			}
		}).bind(this));

		return max;
	},
	
	/**
	 * 
	 * @param {ORYX.Core.StencilSet.Stencil} edgeStencil
	 * 
	 * @return {Hash} Returns a hash map of all connection rules for edgeStencil.
	 */
	_getConnectionRulesOfEdgeStencil: function(edgeStencil) {
		var edgeRules = new Hash();
		edgeStencil.roles().each((function(role) {
			if(this._connectionRules[role]) {
				this._connectionRules[role].each(function(cr) {
					if(edgeRules[cr.key]) {
						edgeRules[cr.key] = edgeRules[cr.key].concat(cr.value);
					} else {
						edgeRules[cr.key] = cr.value;
					}
				});
			}
		}).bind(this));
		
		return edgeRules;
	},
	
	_isRoleOfOtherNamespace: function(role) {
		return (role.indexOf("#") > 0);
	},

	toString: function() { return "Rules"; }
}
ORYX.Core.StencilSet.Rules = Clazz.extend(ORYX.Core.StencilSet.Rules);

/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
/**
 * Init namespace
 */
if (!ORYX) {
    var ORYX = {};
}
if (!ORYX.Core) {
    ORYX.Core = {};
}
if (!ORYX.Core.StencilSet) {
    ORYX.Core.StencilSet = {};
}

/**
 * This class represents a stencil set. It offers methods for accessing
 *  the attributes of the stencil set description JSON file and the stencil set's
 *  stencils.
 */
ORYX.Core.StencilSet.StencilSet = Clazz.extend({

    /**
     * Constructor
     * @param source {URL} A reference to the stencil set specification.
     *
     */
    construct: function(source){
        arguments.callee.$.construct.apply(this, arguments);
        
        if (!source) {
            throw "ORYX.Core.StencilSet.StencilSet(construct): Parameter 'source' is not defined.";
        }
        
        if (source.endsWith("/")) {
            source = source.substr(0, source.length - 1);
        }
		
		this._extensions = new Hash();
        
        this._source = source;
        this._baseUrl = source.substring(0, source.lastIndexOf("/") + 1);
        
        this._jsonObject = {};
        
        this._stencils = new Hash();
		this._availableStencils = new Hash();
        
        new Ajax.Request(source, {
            asynchronous: false,
            method: 'get',
            onSuccess: this._init.bind(this),
            onFailure: this._cancelInit.bind(this)
        });
        if (this.errornous) 
            throw "Loading stencil set " + source + " failed.";
    },
    
    /**
     * Finds a root stencil in this stencil set. There may be many of these. If
     * there are, the first one found will be used. In Firefox, this is the
     * topmost definition in the stencil set description file.
     */
    findRootStencilName: function(){
    
        // find any stencil that may be root.
        var rootStencil = this._stencils.values().find(function(stencil){
            return stencil._jsonStencil.mayBeRoot
        });
        
		// if there is none, just guess the first.
		if (!rootStencil) {
			ORYX.Log.warn("Did not find any stencil that may be root. Taking a guess.");
			rootStencil = this._stencils.values()[0];
		}

        // return its id.
        return rootStencil.id();
    },
    
    /**
     * @param {ORYX.Core.StencilSet.StencilSet} stencilSet
     * @return {Boolean} True, if stencil set has the same namespace.
     */
    equals: function(stencilSet){
        return (this.namespace() === stencilSet.namespace());
    },
    
	/**
	 * 
	 * @param {Oryx.Core.StencilSet.Stencil} rootStencil If rootStencil is defined, it only returns stencils
	 * 			that could be (in)direct child of that stencil.
	 */
    stencils: function(rootStencil, rules){
		if(rootStencil && rules) {
			var stencils = this._availableStencils.values();
			var containers = [rootStencil];
			var checkedContainers = [];
			
			var result = [];
			
			while (containers.size() > 0) {
				var container = containers.pop();
				checkedContainers.push(container);
				var children = stencils.findAll(function(stencil){
					var args = {
						containingStencil: container,
						containedStencil: stencil
					};
					return rules.canContain(args);
				});
				for(var i = 0; i < children.size(); i++) {
					if (!checkedContainers.member(children[i])) {
						containers.push(children[i]);
					}
				}
				result = result.concat(children).uniq();
			}
			var edges = stencils.findAll(function(stencil) {
				return stencil.type() == "edge";
			});
			result = result.concat(edges);

			return result;
		} else {
        	return this._availableStencils.values();
		}
    },
    
    nodes: function(){
        return this._availableStencils.values().findAll(function(stencil){
            return (stencil.type() === 'node')
        });
    },
    
    edges: function(){
        return this._availableStencils.values().findAll(function(stencil){
            return (stencil.type() === 'edge')
        });
    },
    
    stencil: function(id){
        return this._stencils[id];
    },
    
    title: function(){
        return ORYX.Core.StencilSet.getTranslation(this._jsonObject, "title");
    },
    
    description: function(){
        return ORYX.Core.StencilSet.getTranslation(this._jsonObject, "description");
    },
    
    namespace: function(){
        return this._jsonObject ? this._jsonObject.namespace : null;
    },
    
    jsonRules: function(){
        return this._jsonObject ? this._jsonObject.rules : null;
    },
    
    source: function(){
        return this._source;
    },
	
	extensions: function() {
		return this._extensions;
	},
	
	addExtension: function(url) {
		
		new Ajax.Request(url, {
            method: 'GET',
            asynchronous: false,
			onSuccess: (function(transport) {
				this.addExtensionDirectly(transport.responseText);
			}).bind(this),
			onFailure: (function(transport) {
				ORYX.Log.debug("Loading stencil set extension file failed. The request returned an error." + transport);
			}).bind(this),
			onException: (function(transport) {
				ORYX.Log.debug("Loading stencil set extension file failed. The request returned an error." + transport);
			}).bind(this)
		
		});
	},
	
	addExtensionDirectly: function(str){

		try {
			eval("var jsonExtension = " + str);

			if(!(jsonExtension["extends"].endsWith("#")))
					jsonExtension["extends"] += "#";
					
			if(jsonExtension["extends"] == this.namespace()) {
				this._extensions[jsonExtension.namespace] = jsonExtension;
		
				//load new stencils
				if(jsonExtension.stencils) {
					$A(jsonExtension.stencils).each(function(stencil) {
						var oStencil = new ORYX.Core.StencilSet.Stencil(stencil, this.namespace(), this._baseUrl, this);            
						this._stencils[oStencil.id()] = oStencil;
						this._availableStencils[oStencil.id()] = oStencil;
					}.bind(this));
					
					
				}
				
				//load additional properties
				if (jsonExtension.properties) {
					var stencils = this._stencils.values();
					
					stencils.each(function(stencil){
						var roles = stencil.roles();
						
						jsonExtension.properties.each(function(prop){
							prop.roles.any(function(role){
								role = jsonExtension["extends"] + role;
								if (roles.member(role)) {
									prop.properties.each(function(property){
										stencil.addProperty(property, jsonExtension.namespace);
									});
									
									return true;
								}
								else 
									return false;
							})
						})
					}.bind(this));
				}
				
				//remove stencil properties
				if(jsonExtension.removeproperties) {
					jsonExtension.removeproperties.each(function(remprop) {
						var stencil = this.stencil(jsonExtension["extends"] + remprop.stencil);
						if(stencil) {
							remprop.properties.each(function(propId) {
								stencil.removeProperty(propId);
							});
						}
					}.bind(this));
				}
				
				//remove stencils
				if(jsonExtension.removestencils) {
					$A(jsonExtension.removestencils).each(function(remstencil) {
						delete this._availableStencils[jsonExtension["extends"] + remstencil];
					}.bind(this));
				}
			}
		} catch (e) {
			ORYX.Log.debug("StencilSet.addExtension: Something went wrong when initialising the stencil set extension. " + e);
		}	
	},
    
    __handleStencilset: function(response){
    
        try {
            // using eval instead of prototype's parsing,
            // since there are functions in this JSON.
            eval("this._jsonObject =" + response.responseText);
        } 
        catch (e) {
            throw "Stenciset corrupt: " + e;
        }
        
        // assert it was parsed.
        if (!this._jsonObject) {
            throw "Error evaluating stencilset. It may be corrupt.";
        }
        
        with (this._jsonObject) {
        
            // assert there is a namespace.
            if (!namespace || namespace === "") 
                throw "Namespace definition missing in stencilset.";
            
            if (!(stencils instanceof Array)) 
                throw "Stencilset corrupt.";
            
            // assert namespace ends with '#'.
            if (!namespace.endsWith("#")) 
                namespace = namespace + "#";
            
            // assert title and description are strings.
            if (!title) 
                title = "";
            if (!description) 
                description = "";
        }
    },
    
    /**
     * This method is called when the HTTP request to get the requested stencil
     * set succeeds. The response is supposed to be a JSON representation
     * according to the stencil set specification.
     * @param {Object} response The JSON representation according to the
     * 			stencil set specification.
     */
    _init: function(response){
    
        // init and check consistency.
        this.__handleStencilset(response);
		
		//var pps = new Hash();
		
		// init property packages
		/*$A(this._jsonObject.propertyPackages).each((function(pp) {
			pps[pp.id] = pp.properties;
		}).bind(this));*/
        
        // init each stencil
        $A(this._jsonObject.stencils).each((function(stencil){
        
            // instantiate normally.
            //var oStencil = new ORYX.Core.StencilSet.Stencil(stencil, this.namespace(), this._baseUrl, this, pps);
            var oStencil = new ORYX.Core.StencilSet.Stencil(stencil, this.namespace(), this._baseUrl, this);            
			this._stencils[oStencil.id()] = oStencil;
			this._availableStencils[oStencil.id()] = oStencil;
            
        }).bind(this));
    },
    
    _cancelInit: function(response){
        this.errornous = true;
    },
    
    toString: function(){
        return "StencilSet " + this.title() + " (" + this.namespace() + ")";
    }
});
/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespace
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.StencilSet) {ORYX.Core.StencilSet = {};}

/**
 * Class StencilSets
 * uses Prototpye 1.5.0
 * uses Inheritance
 *
 * Singleton
 */
//storage for loaded stencil sets by namespace
ORYX.Core.StencilSet._stencilSetsByNamespace = new Hash();

//storage for stencil sets by url
ORYX.Core.StencilSet._stencilSetsByUrl = new Hash();	

//storage for stencil set namespaces by editor instances
ORYX.Core.StencilSet._StencilSetNSByEditorInstance = new Hash();

//storage for rules by editor instances
ORYX.Core.StencilSet._rulesByEditorInstance = new Hash();

/**
 * 
 * @param {String} editorId
 * 
 * @return {Hash} Returns a hash map with all stencil sets that are loaded by
 * 					the editor with the editorId.
 */
ORYX.Core.StencilSet.stencilSets = function(editorId) {
	var stencilSetNSs = ORYX.Core.StencilSet._StencilSetNSByEditorInstance[editorId];
	var stencilSets = new Hash();
	if(stencilSetNSs) {
		stencilSetNSs.each(function(stencilSetNS) {
			var stencilSet = ORYX.Core.StencilSet.stencilSet(stencilSetNS)
			stencilSets[stencilSet.namespace()] = stencilSet;
		});
	}
	return stencilSets;
};

/**
 * 
 * @param {String} namespace
 * 
 * @return {ORYX.Core.StencilSet.StencilSet} Returns the stencil set with the specified
 * 										namespace.
 * 
 * The method can handle namespace strings like
 *  http://www.example.org/stencilset
 *  http://www.example.org/stencilset#
 *  http://www.example.org/stencilset#ANode
 */
ORYX.Core.StencilSet.stencilSet = function(namespace) {
	ORYX.Log.trace("Getting stencil set %0", namespace);
	var splitted = namespace.split("#", 1);
	if(splitted.length === 1) {
		ORYX.Log.trace("Getting stencil set %0", splitted[0]);
		return ORYX.Core.StencilSet._stencilSetsByNamespace[splitted[0] + "#"];
	} else {
		return undefined;
	}
};

/**
 * 
 * @param {String} id
 * 
 * @return {ORYX.Core.StencilSet.Stencil} Returns the stencil specified by the id.
 * 
 * The id must be unique and contains the namespace of the stencil's stencil set.
 * e.g. http://www.example.org/stencilset#ANode
 */
ORYX.Core.StencilSet.stencil = function(id) {
	ORYX.Log.trace("Getting stencil for %0", id);
	var ss = ORYX.Core.StencilSet.stencilSet(id);
	if(ss) {
		return ss.stencil(id);
	} else {

		ORYX.Log.trace("Cannot fild stencil for %0", id);
		return undefined;
	}
};

/**
 * 
 * @param {String} editorId
 * 
 * @return {ORYX.Core.StencilSet.Rules} Returns the rules object for the editor
 * 									specified by its editor id.
 */
ORYX.Core.StencilSet.rules = function(editorId) {
	if(!ORYX.Core.StencilSet._rulesByEditorInstance[editorId]) {
		ORYX.Core.StencilSet._rulesByEditorInstance[editorId] = new ORYX.Core.StencilSet.Rules();;
	}
	return ORYX.Core.StencilSet._rulesByEditorInstance[editorId];
};

/**
 * 
 * @param {String} url
 * @param {String} editorId
 * 
 * Loads a stencil set from url, if it is not already loaded.
 * It also stores which editor instance loads the stencil set and 
 * initializes the Rules object for the editor instance.
 */
ORYX.Core.StencilSet.loadStencilSet = function(url, editorId) {
	var stencilSet = ORYX.Core.StencilSet._stencilSetsByUrl[url];

	if(!stencilSet) {
		//load stencil set
		stencilSet = new ORYX.Core.StencilSet.StencilSet(url);
		
		//store stencil set
		ORYX.Core.StencilSet._stencilSetsByNamespace[stencilSet.namespace()] = stencilSet;
		
		//store stencil set by url
		ORYX.Core.StencilSet._stencilSetsByUrl[url] = stencilSet;
	}
	
	var namespace = stencilSet.namespace();
	
	//store which editorInstance loads the stencil set
	if(ORYX.Core.StencilSet._StencilSetNSByEditorInstance[editorId]) {
		ORYX.Core.StencilSet._StencilSetNSByEditorInstance[editorId].push(namespace);
	} else {
		ORYX.Core.StencilSet._StencilSetNSByEditorInstance[editorId] = [namespace];
	}

	//store the rules for the editor instance
	if(ORYX.Core.StencilSet._rulesByEditorInstance[editorId]) {
		ORYX.Core.StencilSet._rulesByEditorInstance[editorId].initializeRules(stencilSet);
	} else {
		var rules = new ORYX.Core.StencilSet.Rules();
		rules.initializeRules(stencilSet);
		ORYX.Core.StencilSet._rulesByEditorInstance[editorId] = rules;
	}
};

/**
 * Returns the translation of an attribute in jsonObject specified by its name
 * according to navigator.language
 */
ORYX.Core.StencilSet.getTranslation = function(jsonObject, name) {
	var lang = ORYX.I18N.Language.toLowerCase();
	
	var result = jsonObject[name + "_" + lang];
	
	if(result)
		return result;
		
	result = jsonObject[name + "_" + lang.substr(0, 2)];
	
	if(result)
		return result;
		
	return jsonObject[name];
};
/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}


/**
 * @classDescription With Bounds you can set and get position and size of UIObjects.
 */
ORYX.Core.Bounds = Clazz.extend({

	/**
	 * Constructor
	 */
	construct: function() {
		this._changedCallbacks = []; //register a callback with changedCallacks.push(this.method.bind(this));
		this.a = {};
		this.b = {};
		this.set.apply(this, arguments);
		this.suspendChange = false;
		this.changedWhileSuspend = false;
	},
	
	/**
	 * Calls all registered callbacks.
	 */
	_changed: function(sizeChanged) {
		if(!this.suspendChange) {
			this._changedCallbacks.each(function(callback) {
				callback(this, sizeChanged);
			}.bind(this));
			this.changedWhileSuspend = false;
		} else
			this.changedWhileSuspend = true;
	},
	
	/**
	 * Registers a callback that is called, if the bounds changes.
	 * @param callback {Function} The callback function.
	 */
	registerCallback: function(callback) {
		if(!this._changedCallbacks.member(callback)) {
			this._changedCallbacks.push(callback);	
		}
	},
	
	/**
	 * Unregisters a callback.
	 * @param callback {Function} The callback function.
	 */
	unregisterCallback: function(callback) {
			this._changedCallbacks = this._changedCallbacks.without(callback);
	},
	
	/**
	 * Sets position and size of the shape dependent of four coordinates
	 * (set(ax, ay, bx, by);), two points (set({x: ax, y: ay}, {x: bx, y: by});)
	 * or one bound (set({a: {x: ax, y: ay}, b: {x: bx, y: by}});).
	 */
	set: function() {
		
		var changed = false;
		
		switch (arguments.length) {
		
			case 1:
				if(this.a.x !== arguments[0].a.x) {
					changed = true;
					this.a.x = arguments[0].a.x;
				}
				if(this.a.y !== arguments[0].a.y) {
					changed = true;
					this.a.y = arguments[0].a.y;
				}
				if(this.b.x !== arguments[0].b.x) {
					changed = true;
					this.b.x = arguments[0].b.x;
				}
				if(this.b.y !== arguments[0].b.y) {
					changed = true;
					this.b.y = arguments[0].b.y;
				}
				break;
			
			case 2:
				var ax = Math.min(arguments[0].x, arguments[1].x);
				var ay = Math.min(arguments[0].y, arguments[1].y);
				var bx = Math.max(arguments[0].x, arguments[1].x);
				var by = Math.max(arguments[0].y, arguments[1].y);
				if(this.a.x !== ax) {
					changed = true;
					this.a.x = ax;
				}
				if(this.a.y !== ay) {
					changed = true;
					this.a.y = ay;
				}
				if(this.b.x !== bx) {
					changed = true;
					this.b.x = bx;
				}
				if(this.b.y !== by) {
					changed = true;
					this.b.y = by;
				}
				break;
			
			case 4:
				var ax = Math.min(arguments[0], arguments[2]);
				var ay = Math.min(arguments[1], arguments[3]);
				var bx = Math.max(arguments[0], arguments[2]);
				var by = Math.max(arguments[1], arguments[3]);
				if(this.a.x !== ax) {
					changed = true;
					this.a.x = ax;
				}
				if(this.a.y !== ay) {
					changed = true;
					this.a.y = ay;
				}
				if(this.b.x !== bx) {
					changed = true;
					this.b.x = bx;
				}
				if(this.b.y !== by) {
					changed = true;
					this.b.y = by;
				}
				break;
		}
		
		if(changed) {
			this._changed(true);
		}
	},
	
	/**
	 * Moves the bounds so that the point p will be the new upper left corner.
	 * @param {Point} p
	 * or
	 * @param {Number} x
	 * @param {Number} y
	 */
	moveTo: function() {
		
		var currentPosition = this.upperLeft();
		switch (arguments.length) {
			case 1:
				this.moveBy({
					x: arguments[0].x - currentPosition.x,
					y: arguments[0].y - currentPosition.y
				});
				break;
			case 2:
				this.moveBy({
					x: arguments[0] - currentPosition.x,
					y: arguments[1] - currentPosition.y
				});
				break;
			default:
				//TODO error
		}
		
	},
	
	/**
	 * Moves the bounds relatively by p.
	 * @param {Point} p
	 * or
	 * @param {Number} x
	 * @param {Number} y
	 * 
	 */
	moveBy: function() {
		var changed = false;
		
		switch (arguments.length) {
			case 1:
				var p = arguments[0];
				if(p.x !== 0 || p.y !== 0) {
					changed = true;
					this.a.x += p.x;
					this.b.x += p.x;
					this.a.y += p.y;
					this.b.y += p.y;
				}
				break;	
			case 2:
				var x = arguments[0];
				var y = arguments[1];
				if(x !== 0 || y !== 0) {
					changed = true;
					this.a.x += x;
					this.b.x += x;
					this.a.y += y;
					this.b.y += y;
				}
				break;	
			default:
				//TODO error
		}
		
		if(changed) {
			this._changed();
		}
	},
	
	/***
	 * Includes the bounds b into the current bounds.
	 * @param {Bounds} b
	 */
	include: function(b) {
		
		if( (this.a.x === undefined) && (this.a.y === undefined) &&
			(this.b.x === undefined) && (this.b.y === undefined)) {
			return b;
		};
		
		var cx = Math.min(this.a.x,b.a.x);
		var cy = Math.min(this.a.y,b.a.y);
		
		var dx = Math.max(this.b.x,b.b.x);
		var dy = Math.max(this.b.y,b.b.y);

		
		this.set(cx, cy, dx, dy);
	},
	
	/**
	 * Relatively extends the bounds by p.
	 * @param {Point} p
	 */
	extend: function(p) {
		
		if(p.x !== 0 || p.y !== 0) {
			// this is over cross for the case that a and b have same coordinates.
			//((this.a.x > this.b.x) ? this.a : this.b).x += p.x;
			//((this.b.y > this.a.y) ? this.b : this.a).y += p.y;
			this.b.x += p.x;
			this.b.y += p.y;
			
			this._changed(true);
		}
	},
	
	/**
	 * Widens the scope of the bounds by x.
	 * @param {Number} x
	 */
	widen: function(x) {
		if (x !== 0) {
			this.suspendChange = true;
			this.moveBy({x: -x, y: -x});
			this.extend({x: 2*x, y: 2*x});
			this.suspendChange = false;
			if(this.changedWhileSuspend) {
				this._changed(true);
			}
		}
	},
	
	/**
	 * Returns the upper left corner's point regardless of the
	 * bound delimiter points.
	 */
	upperLeft: function() {
		
		return {x:this.a.x, y:this.a.y};
	},
	
	/**
	 * Returns the lower Right left corner's point regardless of the
	 * bound delimiter points.
	 */
	lowerRight: function() {
		
		return {x:this.b.x, y:this.b.y};
	},
	
	/**
	 * @return {Number} Width of bounds.
	 */
	width: function() {
		return this.b.x - this.a.x;
	},
	
	/**
	 * @return {Number} Height of bounds.
	 */
	height: function() {
		return this.b.y - this.a.y;
	},
	
	/**
	 * @return {Point} The center point of this bounds.
	 */
	center: function() {
		return {
			x: (this.a.x + this.b.x)/2.0, 
			y: (this.a.y + this.b.y)/2.0
		};
	},

	
	/**
	 * @return {Point} The center point of this bounds relative to upperLeft.
	 */
	midPoint: function() {
		return {
			x: (this.b.x - this.a.x)/2.0, 
			y: (this.b.y - this.a.y)/2.0
		};
	},
		
	/**
	 * Moves the center point of this bounds to the new position.
	 * @param p {Point} 
	 * or
	 * @param x {Number}
	 * @param y {Number}
	 */
	centerMoveTo: function() {
		var currentPosition = this.center();
		
		switch (arguments.length) {
			
			case 1:
				this.moveBy(arguments[0].x - currentPosition.x,
							arguments[0].y - currentPosition.y);
				break;
			
			case 2:
				this.moveBy(arguments[0] - currentPosition.x,
							arguments[1] - currentPosition.y);
				break;
		}
	},
	
	isIncluded: function(point) {

		var pointX, pointY;

		// Get the the two Points	
		switch(arguments.length) {
			case 1:
				pointX = arguments[0].x;
				pointY = arguments[0].y;
				break;
			case 2:
				pointX = arguments[0];
				pointY = arguments[1];
				break;
			default:
				throw "isIncluded needs one or two arguments";
		}
				
		var ul = this.upperLeft();
		var lr = this.lowerRight();
		
		if(pointX >= ul.x && pointX <= lr.x && pointY >= ul.y && pointY <= lr.y)
			return true;
		else 
			return false;
	},
	
	/**
	 * @return {Bounds} A copy of this bounds.
	 */
	clone: function() {
		
		//Returns a new bounds object without the callback
		// references of the original bounds
		return new ORYX.Core.Bounds(this);
	},
	
	toString: function() {
		
		return "( "+this.a.x+" | "+this.a.y+" )/( "+this.b.x+" | "+this.b.y+" )";
	},
	
	serializeForERDF: function() {

		return this.a.x+","+this.a.y+","+this.b.x+","+this.b.y;
	}
 });/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}

/**
 * @classDescription Top Level uiobject.
 *
 */
ORYX.Core.AbstractShape = {

	/**
	 * Constructor
	 */
	construct: function(options, stencil) {
		
		arguments.callee.$.construct.apply(this, arguments);
		
		this.resourceId = ORYX.Editor.provideId(); //Id of resource in DOM
		
		// stencil reference
		this._stencil = stencil;
		// if the stencil defines a super stencil that should be used for its instances, set it.
		if (this._stencil._jsonStencil.superId){
			stencilId = this._stencil.id()
			superStencilId = stencilId.substring(0, stencilId.indexOf("#") + 1) + stencil._jsonStencil.superId;
			stencilSet =  this._stencil.stencilSet();
			this._stencil = stencilSet.stencil(superStencilId);
		}
		
		//Hash map for all properties. Only stores the values of the properties.
		this.properties = new Hash();
		this.propertiesChanged = new Hash();
		
		//Initialization of property map and initial value.
		this._stencil.properties().each((function(property) {
			var key = property.prefix() + "-" + property.id();
			this.properties[key] = property.value();
			this.propertiesChanged[key] = true;
		}).bind(this));
		
		// if super stencil was defined, also regard stencil's properties:
		stencil.properties().each((function(property) {
			var key = property.prefix() + "-" + property.id();
			this.properties[key] = property.value();
			this.propertiesChanged[key] = true;
		}).bind(this));
		
		
	},

	layout: function() {

	},
	
	/**
	 * Returns the stencil object specifiing the type of the shape.
	 */
	getStencil: function() {
		return this._stencil;
	},
	
	/**
	 * 
	 * @param {Object} resourceId
	 */
	getChildShapeByResourceId: function(resourceId) {

		resourceId = ERDF.__stripHashes(resourceId);
		
		return this.getChildShapes(true).find(function(shape) {
					return shape.resourceId == resourceId
				});
	},
	/**
	 * 
	 * @param {Object} deep
	 * @param {Object} iterator
	 */
	getChildShapes: function(deep, iterator) {
		var result = [];

		this.children.each(function(uiObject) {
			if(uiObject instanceof ORYX.Core.Shape && uiObject.isVisible ) {
				if(iterator) {
					iterator(uiObject);
				}
				result.push(uiObject);
				if(deep) {
					result = result.concat(uiObject.getChildShapes(deep, iterator));
				} 
			}
		});

		return result;
	},
	
	/**
	 * 
	 * @param {Object} deep
	 * @param {Object} iterator
	 */
	getChildNodes: function(deep, iterator) {
		var result = [];

		this.children.each(function(uiObject) {
			if(uiObject instanceof ORYX.Core.Node && uiObject.isVisible) {
				if(iterator) {
					iterator(uiObject);
				}
				result.push(uiObject);
			}
			if(uiObject instanceof ORYX.Core.Shape) {
				if(deep) {
					result = result.concat(uiObject.getChildNodes(deep, iterator));
				}
			}
		});

		return result;
	},
	
	/**
	 * 
	 * @param {Object} deep
	 * @param {Object} iterator
	 */
	getChildEdges: function(deep, iterator) {
		var result = [];

		this.children.each(function(uiObject) {
			if(uiObject instanceof ORYX.Core.Edge && uiObject.isVisible) {
				if(iterator) {
					iterator(uiObject);
				}
				result.push(uiObject);
			}
			if(uiObject instanceof ORYX.Core.Shape) {
				if(deep) {
					result = result.concat(uiObject.getChildEdges(deep, iterator));
				}
			}
		});

		return result;
	},
	
	/**
	 * Returns a sorted array of ORYX.Core.Node objects.
	 * Ordered in z Order, the last object has the highest z Order.
	 */
	//TODO deep iterator
	getAbstractShapesAtPosition: function() {
		var x, y;
		switch (arguments.length) {
			case 1:
				x = arguments[0].x;
				y = arguments[0].y;
				break;
			case 2:	//two or more arguments
				x = arguments[0];
				y = arguments[1];
				break;
			default:
				throw "getAbstractShapesAtPosition needs 1 or 2 arguments!"
		}

		if(this.isPointIncluded(x, y)) {

			var result = [];
			result.push(this);

			//check, if one child is at that position						
			
			
			var childNodes = this.getChildNodes();
			var childEdges = this.getChildEdges();
			
			[childNodes, childEdges].each(function(ne){
				var nodesAtPosition = new Hash();
				
				ne.each(function(node) {
					if(!node.isVisible){ return }
					var candidates = node.getAbstractShapesAtPosition( x , y );
					if(candidates.length > 0) {
						var nodesInZOrder = $A(node.node.parentNode.childNodes);
						var zOrderIndex = nodesInZOrder.indexOf(node.node);
						nodesAtPosition[zOrderIndex] = candidates;
					}
				});
				
				nodesAtPosition.keys().sort().each(function(key) {
					result = result.concat(nodesAtPosition[key]);
				});
 			});
						
			return result;
			
		} else {
			return [];
		}
	},
	
	/**
	 * 
	 * @param key {String} Must be 'prefix-id' of property
	 * @param value {Object} Can be of type String or Number according to property type.
	 */
	setProperty: function(key, value) {
		var oldValue = this.properties[key];
		if(oldValue !== value) {
			this.properties[key] = value;
			this.propertiesChanged[key] = true;
			this._changed();
			
			// Raise an event, to show that the property has changed
			window.setTimeout( function(){

				this._delegateEvent({
						type	: ORYX.CONFIG.EVENT_PROPERTY_CHANGED, 
						name	: key, 
						value	: value,
						oldValue: oldValue
					});
								
			}.bind(this), 10)
		}
	},
	
	/**
	 * Calculate if the point is inside the Shape
	 * @param {Point}
	 */
	isPointIncluded: function(pointX, pointY, absoluteBounds) {
		var absBounds = absoluteBounds ? absoluteBounds : this.absoluteBounds();
		return absBounds.isIncluded(pointX, pointY);
				
	},
	
	/**
	 * Get the serialized object
	 * return Array with hash-entrees (prefix, name, value)
	 * Following values will given:
	 * 		Type
	 * 		Properties
	 */
	serialize: function() {
		var serializedObject = [];
		
		// Add the type
		serializedObject.push({name: 'type', prefix:'oryx', value: this.getStencil().id(), type: 'literal'});	
				
		// Add all properties
		this.getStencil().properties().each((function(property){
			
			var prefix = property.prefix();	// Get prefix
			var name = property.id();		// Get name
			
			//if(typeof this.properties[prefix+'-'+name] == 'boolean' || this.properties[prefix+'-'+name] != "")
				serializedObject.push({name: name, prefix: prefix, value: this.properties[prefix+'-'+name], type: 'literal'});

		}).bind(this));
		
		return serializedObject;
	},
		
		
	deserialize: function(serialze){
		// Search in Serialize
		var initializedDocker = 0;
		serialze.each((function(obj){
			
			var name 	= obj.name;
			var prefix 	= obj.prefix;
			var value 	= obj.value;

			switch(prefix + "-" + name){
				case 'raziel-parent': 
							// Set parent
							if(!this.parent) {break};
							
							// Set outgoing Shape
							var parent = this.getCanvas().getChildShapeByResourceId(value);
							if(parent) {
								parent.add(this);
							}
							
							break;											
				default:
							// Set property
							if(this.properties.keys().member(prefix+"-"+name)) {
								this.setProperty(prefix+"-"+name, unescape(value));
							}
					
			}
		}).bind(this));
	},
	
	toString: function() { return "ORYX.Core.AbstractShape " + this.id }
 };
 ORYX.Core.AbstractShape = ORYX.Core.UIObject.extend(ORYX.Core.AbstractShape);/**
		//}
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}
if(!ORYX.Core.Controls) {ORYX.Core.Controls = {};}


/**
 * @classDescription Abstract base class for all Controls.
 */
ORYX.Core.Controls.Control = ORYX.Core.UIObject.extend({
	
	toString: function() { return "Control " + this.id; }
 });/**
			}
			}*/
 * Copyright (c) 2006
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

/**
 * Init namespaces
 */
if(!ORYX) {var ORYX = {};}
if(!ORYX.Core) {ORYX.Core = {};}


/**
 * @classDescription With Bounds you can set and get position and size of UIObjects.
 */
ORYX.Core.Command = Clazz.extend({

	/**
	 * Constructor
	 */
	construct: function() {

	},
	
	execute: function(){
		throw "Command.execute() has to be implemented!"
	},
	
	rollback: function(){
		throw "Command.rollback() has to be implemented!"
	}
	
	
 });/**
 * Copyright (c) 2008
 * Willi Tscheschner
 * 
 **/

if(!ORYX){ var ORYX = {} }
if(!ORYX.Plugins){ ORYX.Plugins = {} }

/**
   This abstract plugin class can be used to build plugins on.
   It provides some more basic functionality like registering events (on*-handlers)...
   @example
    ORYX.Plugins.MyPlugin = ORYX.Plugins.AbstractPlugin.extend({
        construct: function() {
            // Call super class constructor
            arguments.callee.$.construct.apply(this, arguments);
            
            [...]
        },
        [...]
    });
   
   @class ORYX.Plugins.AbstractPlugin
   @constructor Creates a new instance
   @author Willi Tscheschner
*/
ORYX.Plugins.AbstractPlugin = Clazz.extend({
    /** 
     * The facade which offer editor-specific functionality
     * @type Facade
     * @memberOf ORYX.Plugins.AbstractPlugin.prototype
     */
	facade: null,
	
	construct: function( facade ){
		this.facade = facade;
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED, this.onLoaded.bind(this));
	},
        
    /**
       Overwrite to handle load event. TODO: Document params!!!
       @methodOf ORYX.Plugins.AbstractPlugin.prototype
    */
	onLoaded: function(){},
	
    /**
       Overwrite to handle selection changed event. TODO: Document params!!!
       @methodOf ORYX.Plugins.AbstractPlugin.prototype
    */
	onSelectionChanged: function(){},
	
    /**
       Show overlay on given shape.
       @methodOf ORYX.Plugins.AbstractPlugin.prototype
       @example
       showOverlay(
           myShape,
           { stroke: "green" },
           ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
               "title": "Click the element to execute it!",
               "stroke-width": 2.0,
               "stroke": "black",
               "d": "M0,-5 L5,0 L0,5 Z",
               "line-captions": "round"
           }])
       )
       @param {Oryx.XXX.Shape[]} shapes One shape or array of shapes the overlay should be put on
       @param {Oryx.XXX.Attributes} attributes some attributes...
       @param {Oryx.svg.node} svgNode The svg node which should be used as overlay
       @param {String} [svgNode="NW"] The svg node position where the overlay should be placed
    */
	showOverlay: function(shapes, attributes, svgNode, svgNodePosition ){
		
		if( !(shapes instanceof Array) ){
			shapes = [shapes]
		}
		
		// Define Shapes
		shapes = shapes.map(function(shape){
			var el = shape;
			if( typeof shape == "string" ){
				el = this.facade.getCanvas().getChildShapeByResourceId( shape );
				el = el || this.facade.getCanvas().getChildById( shape, true );
			}
			return el;
		}.bind(this)).compact();
		
		// Define unified id
		if( !this.overlayID ){
			this.overlayID = this.type + ORYX.Editor.provideId();
		}
		
		this.facade.raiseEvent({
			type		: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
			id			: this.overlayID,
			shapes		: shapes,
			attributes 	: attributes,
			node		: svgNode,
			nodePosition: svgNodePosition || "NW"
		});
		
	},
	
    /**
       Hide current overlay.
       @methodOf ORYX.Plugins.AbstractPlugin.prototype
    */
	hideOverlay: function(){
		this.facade.raiseEvent({
			type	: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
			id		: this.overlayID
		});		
	},
	
    /**
       Does a transformation with the given xslt stylesheet.
       @methodOf ORYX.Plugins.AbstractPlugin.prototype
       @param {String} data The data (e.g. eRDF) which should be transformed
       @param {String} stylesheet URL of a stylesheet which should be used for transforming data.
    */
	doTransform: function( data, stylesheet ) {		
		
		if( !stylesheet || !data ){
			return ""
		}

        var parser 		= new DOMParser();
        var parsedData 	= parser.parseFromString(data, "text/xml");
        var xsltPath 	= stylesheet;
        var xsltProcessor = new XSLTProcessor();
        var xslRef 		= document.implementation.createDocument("", "", null);
        xslRef.async 	= false;
        xslRef.load(xsltPath);
        xsltProcessor.importStylesheet(xslRef);
        
        try {
        	
            var newData 		= xsltProcessor.transformToDocument(parsedData);
            var serializedData 	= (new XMLSerializer()).serializeToString(newData);
            
            // Firefox 2 to 3 problem?!
            serializedData = !serializedData.startsWith("<?xml") ? "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serializedData : serializedData;
            
            return serializedData;
            
        }catch (error) {
            return -1;
        }
        
	},
	
	/**
	 * Opens a new window that shows the given XML content.
	 * @methodOf ORYX.Plugins.AbstractPlugin.prototype
	 * @param {Object} content The XML content to be shown.
	 * @example
	 * openDownloadWindow( "my.xml", "<exampleXML />" );
	 */
	openXMLWindow: function(content) {
		var win = window.open(
		   'data:application/xml,' + encodeURIComponent(
		     content
		   ),
		   '_blank', "resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes"
		);
	},
	
    /**
     * Opens a download window for downloading the given content.
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     * @param {String} filename The content's file name
     * @param {String} content The content to download
     */
	openDownloadWindow: function(filename, content) {
		var win = window.open("");
		if (win != null) {
			win.document.open();
			win.document.write("<html><body>");
			var submitForm = win.document.createElement("form");
			win.document.body.appendChild(submitForm);
			
			var createHiddenElement = function(name, value) {
				var newElement = document.createElement("input");
				newElement.name=name;
				newElement.type="hidden";
				newElement.value = value;
				return newElement
			}
			
			submitForm.appendChild( createHiddenElement("download", content) );
			submitForm.appendChild( createHiddenElement("file", filename) );
			
			
			submitForm.method = "POST";
			win.document.write("</body></html>");
			win.document.close();
			submitForm.action= ORYX.PATH + "/download";
			submitForm.submit();
		}		
	},
    
    /**
     * Serializes DOM.
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     * @type {String} Serialized DOM
     */
    getSerializedDOM: function(){
        // Force to set all resource IDs
        var serializedDOM = DataManager.serializeDOM( this.facade );

        //add namespaces
        serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" ' +
        'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
        'xmlns:ext="http://b3mn.org/2007/ext" ' +
        'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
        'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
        '<head profile="http://purl.org/NET/erdf/profile">' +
        '<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
        '<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
        '<link rel="schema.b3mn" href="http://b3mn.org" />' +
        '<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
        '<link rel="schema.raziel" href="http://raziel.org/" />' +
        '<base href="' +
        location.href.split("?")[0] +
        '" />' +
        '</head><body>' +
        serializedDOM +
        '</body></html>';
        
        return serializedDOM;
    },
    
    /**
     * Extracts RDF from DOM.
     * @methodOf ORYX.Plugins.AbstractPlugin.prototype
     * @type {String} Extracted RFD. Null if there are transformation errors.
     */
    getRDFFromDOM: function(){
        //convert to RDF
        var parser = new DOMParser();
        var parsedDOM = parser.parseFromString(this.getSerializedDOM(), "text/xml");
        var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
        var xsltProcessor = new XSLTProcessor();
        var xslRef = document.implementation.createDocument("", "", null);
        xslRef.async = false;
        xslRef.load(xsltPath);
        xsltProcessor.importStylesheet(xslRef);
        try {
            var rdf = xsltProcessor.transformToDocument(parsedDOM);
            return (new XMLSerializer()).serializeToString(rdf);
        } catch (error) {
            Ext.Msg.alert("Oryx", error);
            return null;
        }
    }
});/**
 * Copyright (c) 2008
 * Stefan Krumnow
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Supports creating and editing ad-hoc completion conditions
 * 
 */
ORYX.Plugins.AdHocCC = Clazz.extend({

	facade: undefined,
	UNSAVED_RESOURCE: "unsaved",

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		this.facade = facade;
		
		this.facade.offer({
			'name':ORYX.I18N.AdHocCC.compl,
			'functionality': this.editCC.bind(this),
			'group': ORYX.I18N.AdHocCC.group,
			'icon': ORYX.PATH + "images/adhoc.gif",
			'description': ORYX.I18N.AdHocCC.complDesc,
			'index': 0,
			'minShape': 1,
			'maxShape': 1
			// ISSUE: Should the Context Area this Plugin is creating be removed?
		});
	},
	
	
	/**
	 * Opens a Dialog that can be used to edit an ad-hoc activity's completion condition
	 * 
	 */
	editCC: function(){	
	
		/*
		 * 	check pre conditions
		 */ 
		var elements = this.facade.getSelection();
		if (elements.length != 1) {
			// Should not happen!
			this.openErroDialog(ORYX.I18N.AdHocCC.notOne);
			return ; 
		}
		var adHocActivity = elements[0];
		if (adHocActivity._stencil.id() != "http://b3mn.org/stencilset/bpmnexec#Subprocess" || !adHocActivity.properties['oryx-isadhoc']){
			this.openErroDialog(ORYX.I18N.AdHocCC.nodAdHocCC); 
			return ;
		}
	
		/*
		 * 	load relevant data
		 */ 	
		var oldCC = adHocActivity.properties['oryx-adhoccompletioncondition'];
		var taskArrayFields = ['resourceID', 'resourceName'];
		var taskArray = []; 
		var stateArrayFields = ['state'];
		var stateArray = [ ['ready'], ['skipped'], ['completed'] ];
		var dataArrayFields = ['resourceID_FieldName', 'dataNameAndFieldName'];
		var dataArray = [];

		var parser = new DOMParser();
		
		var childNodes = adHocActivity.getChildNodes();
		for (var i = 0; i < childNodes.length; i++) {
			var child = childNodes[i];
			if (child._stencil.id() == "http://b3mn.org/stencilset/bpmnexec#Task") {
				var resourceName = child.properties['oryx-name'];
				var resourceID = child.resourceId;
				if (typeof resourceID == "undefined") {
					DataManager.__persistDOM(this.facade);
					resourceID = child.resourceId;
					if (typeof resourceID == "undefined") {
						resourceID = this.UNSAVED_RESOURCE;
						resourceName = resourceName + " (unsaved)";
					}
				}
				taskArray.push([resourceID, resourceName]);
			}
			else if (child._stencil.id() == "http://b3mn.org/stencilset/bpmnexec#DataObject") {
				var resourceName = child.properties['oryx-name'];
				var resourceID = child.resourceId;
				if (typeof resourceID == "undefined") {
					DataManager.__persistDOM(this.facade);
					resourceID = child.resourceId;
					if (typeof resourceID == "undefined") {
						resourceID = this.UNSAVED_RESOURCE;
						resourceName = resourceName + " (unsaved)";
					}
				}
				var dataModelString = child.properties['oryx-datamodel'];
				var dataModel = parser.parseFromString(dataModelString,"text/xml");
				var rootXMLNode = dataModel.childNodes[0];
				if (rootXMLNode != null){
					var childXMLNodes = rootXMLNode.childNodes;
					for (var j = 0; j < childXMLNodes.length; j++) {
						var dataFieldTagName = childXMLNodes[j].attributes['name'].nodeValue;
						if (dataFieldTagName != null) {
							dataArray.push([[resourceID, dataFieldTagName], resourceName + "/" + dataFieldTagName]);
						}
					}
				}
			}
		}
				
		/*
		 * 	initialiaze UI
		 */ 
		var taskStore = new Ext.data.SimpleStore({
   			fields: taskArrayFields,
    		data : taskArray
		});
		
		var stateStore = new Ext.data.SimpleStore({
   			fields: stateArrayFields,
    		data : stateArray
		});
		
		var dataStore = new Ext.data.SimpleStore({
   			fields: dataArrayFields,
    		data : dataArray
		});
		
		var taskCombo = new Ext.form.ComboBox({
    		store: taskStore,
			valueField: taskArrayFields[0],
			displayField: taskArrayFields[1],
    		emptyText: ORYX.I18N.AdHocCC.selectTask,
			typeAhead: true,
    		mode: 'local',
    		triggerAction: 'all',
   			selectOnFocus: true,
			editable: false,
			width: 180
		});
		
		var stateCombo = new Ext.form.ComboBox({
    		store: stateStore,
    		displayField: stateArrayFields[0],
    		emptyText: ORYX.I18N.AdHocCC.selectState,
			typeAhead: true,
    		mode: 'local',
    		triggerAction: 'all',
   			selectOnFocus: true,
			editable: false,
			width: 180
		});

		var addStateExprButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.addExp,
			handler: function(){
				var task = taskCombo.getValue();
				var state = stateCombo.getValue();
				if (task != this.UNSAVED_RESOURCE && task != "" && state != "") {
					this.addStringToTextArea(textArea, "stateExpression('"+task+"', '"+state+"')");
					taskCombo.setValue("");
					stateCombo.setValue("");
				}
			}.bind(this)
		});
		
		var dataCombo = new Ext.form.ComboBox({
    		store: dataStore,
			valueField: dataArrayFields[0],
    		displayField: dataArrayFields[1],
    		emptyText: ORYX.I18N.AdHocCC.selectDataField,
			typeAhead: true,
    		mode: 'local',
    		triggerAction: 'all',
   			selectOnFocus: true,
			editable: false,
			width: 180
		});
		
		var valueField = new Ext.form.TextField({
			width: 180,
			emptyText: ORYX.I18N.AdHocCC.enterEqual,
		});
		
		var addDataExprButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.addExp,
			handler: function(){
				var data = dataCombo.getValue();
				var value = valueField.getValue();
				if (data != null && data[0] != this.UNSAVED_RESOURCE && value != "") {
					this.addStringToTextArea(textArea, "dataExpression('"+data[0]+"', '"+data[1]+"', '"+value+"')");
					dataCombo.setValue("");
					valueField.setValue("");
				}
			}.bind(this)
		});
		
		var addAndButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.and, 
			minWidth: 50,
			handler: function(){
				this.addStringToTextArea(textArea, "&");
			}.bind(this)
		});
					
		var addOrButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.or, 
			minWidth: 50,
			handler: function(){
				this.addStringToTextArea(textArea, "|");
			}.bind(this)
		});
		
		var addLPButton = new Ext.Button({
			text: "(", 
			minWidth: 50,
			handler: function(){
				this.addStringToTextArea(textArea, "(");
			}.bind(this)
		});
					
		var addRPButton = new Ext.Button({
			text: ")", 
			minWidth: 50,
			handler: function(){
				this.addStringToTextArea(textArea, ")");
			}.bind(this)
		});
		
		var addNotButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.not, 
			minWidth: 50,
			handler: function(){
				this.addStringToTextArea(textArea, "!");
			}.bind(this)
		});
		
		var textArea = new Ext.form.TextArea({
			width: 418,
			height: 100,
			value: oldCC
		});
		
		var clearButton = new Ext.Button({
			text: ORYX.I18N.AdHocCC.clearCC,
			handler: function(){
				textArea.setValue("");
			}
		});
		
		var win = new Ext.Window({ 
			width: 450,
			//minWidth: 400,
			height: 485,
			//minHeight: 450,
			resizable: false,
			minimizable: false,
			modal: true,
			autoScroll: true,
			title: ORYX.I18N.AdHocCC.editCC,
			layout: 'table',
			defaults: {
		        bodyStyle:'padding:3px;background-color:transparent;border-width:0px'
		    },
			layoutConfig: {
		        columns: 7
		    },
			items: [
				{ items: [new Ext.form.Label({text: ORYX.I18N.AdHocCC.addExecState, style: 'font-size:12px;'})], colspan: 7},
				{}, {items: [taskCombo], colspan: 6},
				{}, {items: [stateCombo], colspan: 4}, {items: [addStateExprButton]}, {},
				{colspan: 7},
				{ items: [new Ext.form.Label({text: ORYX.I18N.AdHocCC.addDataExp, style: 'font-size:12px;'})], colspan: 7},	
				{}, {items: [dataCombo], colspan: 6},
				{}, {items: [valueField], colspan: 4}, {items: [addDataExprButton]}, {},
				{colspan: 7},
				{ items: [new Ext.form.Label({text: ORYX.I18N.AdHocCC.addLogOp, style: 'font-size:12px;'})], colspan: 7},	
				{}, {items: [addAndButton]}, {items: [addOrButton]}, {items: [addLPButton]}, {items: [addRPButton]}, {items: [addNotButton]}, {},
				{colspan: 7},
				{ items: [new Ext.form.Label({text: ORYX.I18N.AdHocCC.curCond, style: 'font-size:12px;'})], colspan: 7},
				{}, {items: [textArea], colspan: 5}, {},
				{colspan: 5}, {items: [clearButton]}, {}
			],
			buttons: [
				{
		        	text: 'Apply',
		        	handler: function(){
		            	win.hide();
						adHocActivity.properties['oryx-adhoccompletioncondition'] = textArea.getValue();
						// ISSUE: This might be done more elegant using a refresh-event implemented in the property window plugin
						this.facade.setSelection([]);
						this.facade.setSelection(elements);
		        	}.bind(this)
		    	},
				{
		        	text: 'Cancel',
		        	handler: function(){win.hide();}
		    	}
			],
	    	keys: [{
	        	key: 27,  // Esc
	        	fn: function(){win.hide();}
	    	}]
		});
		win.show();	
	},
	
	
	/**
	 * Adds an string into a text area
	 * 
	 * NOTE: This implementation does only work with Gecko browsers (e.g. Mozilla Firefox)
	 * 
	 * @param {TextField} textArea
	 * @param {String} string
	 */
	addStringToTextArea: function(textArea, string){
		var selectionStart = textArea.getEl().dom.selectionStart;
		var selectionEnd = textArea.getEl().dom.selectionEnd;
		var currentValue = textArea.getValue();
		textArea.setValue(currentValue.substring(0, selectionStart)+string+currentValue.substring(selectionEnd));
		textArea.getEl().dom.selectionStart = selectionStart + string.length;
		textArea.getEl().dom.selectionEnd = textArea.getEl().dom.selectionStart;
	},
	
	/**
	 * Opens an error dialog
	 * 
	 * @param {String} errorMsg
	 */
	openErroDialog: function(errorMsg){
		Ext.MessageBox.show({
           title: 'Error',
           msg: errorMsg,
           buttons: Ext.MessageBox.OK,
           icon: Ext.MessageBox.ERROR
       });
	}	
	
});
/**
		}).bind(this));	
/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

/**
 * Supports EPCs by offering a syntax check and export and import ability..
 *
 *
 */
ORYX.Plugins.AMLSupport = Clazz.extend({

    facade: undefined,
    
    /**
     * Offers the plugin functionality:
     *
     */
    construct: function(facade){
        this.facade = facade;
        
        this.facade.offer({
            'name': ORYX.I18N.AMLSupport.imp,
            'functionality': this.importAML.bind(this),
            'group': ORYX.I18N.AMLSupport.group,
            'icon': ORYX.PATH + "images/aris_import_icon.png",
            'description': ORYX.I18N.AMLSupport.impDesc,
            'index': 3,
            'minShape': 0,
            'maxShape': 0
        });
        
        
        this.AMLServletURL = '/amlsupport';
    },
    
    
    /**
     * Imports an AML description
     *
     */
    importAML: function(){
        this._showUploadDialog(this.loadDiagrams.bind(this));
    },
    
    
    /**
     * Shows all included diagrams and imports them
     *
     */
    loadDiagrams: function(erdf){
		
		//if parameter does not start with <, it is an error message.
		if(!erdf.startsWith("<")) {
			Ext.Msg.alert("Oryx", ORYX.I18N.AMLSupport.failed + erdf);
            ORYX.Log.warn("Import AML failed: " + erdf);
			return;
		}
		
        var doc;
        try {
			// Get the dom-structure
            doc = this.parseToDoc(erdf);
            
            
            // Get the several process diagrams
            var values = $A(doc.firstChild.childNodes).collect(function(node){
                return {
                    title: this.getChildNodesByClassName(node.firstChild, 'oryx-title')[0].textContent,
                    data: node
                }
            }.bind(this))
			
            // Sort the values
            values.sort(function(a, b){
                return a.title > b.title
            })
            
            this._showPanel(values, function(result){
            
                if (result.length > 1) {
                
                    var requestsSuccessfull = true;
                    
                    var loadedDiagrams = [];
                    
                    // Generate for every diagram a new url
                    result.each(function(item){
                    
                        // Set url, dummy data, and params for the request, to get a new url
                        var url = '/backend/poem' + ORYX.CONFIG.ORYX_NEW_URL + "?stencilset=/stencilsets/epc/epc.json";
                        var dummyData = '<div class="processdata"><div class="-oryx-canvas" id="oryx-canvas123" style="display: none; width:1200px; height:600px;"><a href="/stencilsets/epc/epc.json" rel="oryx-stencilset"></a><span class="oryx-mode">writeable</span><span class="oryx-mode">fullscreen</span></div></div>';
                        var dummySVG = '<svg/>';
                        var params = {
                            data: dummyData,
                            svg: dummySVG,
                            title: item.name,
                            summary: "",
                            type: "http://b3mn.org/stencilset/epc#"
                        };
                        
                        // Send the request
                        requestsSuccessfull = this.sendRequest(url, params, function(transport){
                        
                            var loc = transport.getResponseHeader('location');
                            var id = this.getNodesByClassName(item.data, "div", "-oryx-canvas")[0].getAttribute("id");
                            
                            loadedDiagrams.push({
                                name: item.name,
                                data: item.data,
                                url: loc,
                                id: id
                            });
                            
                        }.bind(this));
                        
                        // If an error during the reqest occurs, return
                        if (!requestsSuccessfull) {
                            throw $break
                        }
                        
                    }.bind(this));
                    
                    // If an error during the reqest occurs, return
                    if (!requestsSuccessfull) {
                        return
                    }
                    
                    
                    // Replace all IDs within every process diagrams with the new url
                    // First, find all 'oryx-uriref' spans
                    var allURIRefs = loadedDiagrams.collect(function(item){
                        return $A(this.getNodesByClassName(item.data, "span", "oryx-refuri"))
                    }.bind(this)).flatten()
					
                    // Second, replace it, if there is a url for it, otherwise, delete the link
                    allURIRefs.each(function(uriRef){
                    
                        if (uriRef.textContent.length == 0) {
                            return
                        }
                        
                        var findURL = loadedDiagrams.find(function(item){
                            return uriRef.textContent == item.id
                        })
                        
                        uriRef.textContent = findURL ? findURL.url : "";
                        
                    })
                    
                    
                    
                    // Send all diagrams to the server
                    loadedDiagrams.each(function(item){
                    
                        // Get the URL
                        var url = item.url;
                        // Define the svg
                        var dummySVG = '<svg/>';
                        // Get the data
                        var data = DataManager.serialize(item.data);
                        data = "<div " + data.slice(data.search("class"));
                        // Set the parameter for the request
                        var params = {
                            data: data,
                            svg: dummySVG
                        };
                        
                        // Send the request
                        requestsSuccessfull = this.sendRequest(url, params);
                        
                        
                        // If an error during the reqest occurs, return
                        if (!requestsSuccessfull) {
                            throw $break
                        }
                        
                    }.bind(this));
                    
                    // If an error during the reqest occurs, return
                    if (!requestsSuccessfull) {
                        return
                    }
                    
                    // Show the results	
                    this._showResultPanel(loadedDiagrams.collect(function(item){
                        return {
                            name: item.name,
                            url: item.url
                        }
                    }));
                    
                }
                else {
                
                    var erdfDOM = result[0].data;
                    
					// Delete all uri-refs
                    $A(this.getNodesByClassName(erdfDOM, "span", "oryx-refuri")).each(function(node){
                        node.textContent = ""
                    });
					
					// Import the erdf strucutre
					this.facade.importERDF(erdfDOM);
                
                }  
                
            }.bind(this))
            
        } 
        catch (e) {
            Ext.Msg.alert("Oryx", ORYX.I18N.AMLSupport.failed2 + e);
            ORYX.Log.warn("Import AML failed: " + e);
        }
        
    },
    
    
    /**
     *
     *
     * @param {Object} url
     * @param {Object} params
     * @param {Object} successcallback
     */
    sendRequest: function(url, params, successcallback){
    
        var suc = false;
        
        new Ajax.Request(url, {
            method: 'POST',
            asynchronous: false,
            parameters: params,
            onSuccess: function(transport){
            
                suc = true;
                
                if (successcallback) {
                    successcallback(transport)
                }
                
            }
.bind(this)            ,
            
            onFailure: function(transport){
            
                Ext.Msg.alert("Oryx", ORYX.I18N.AMLSupport.failed2);
                ORYX.Log.warn("Import AML failed: " + transport.responseText);
                
            }
.bind(this)            ,
            
            on403: function(transport){
            
                Ext.Msg.alert("Oryx", ORYX.I18N.AMLSupport.noRights);
                ORYX.Log.warn("Import AML failed: " + transport.responseText);
                
            }
.bind(this)
        });
        
        
        return suc;
        
    },
    
    
    /**
     * Give all child nodes with the given class name
     *
     * @param {Object} doc
     * @param {Object} id
     */
    getChildNodesByClassName: function(doc, id){
    
        return $A(doc.childNodes).findAll(function(el){
            return $A(el.attributes).any(function(attr){
                return attr.nodeName == 'class' && attr.nodeValue == id
            })
        })
        
    },
    
    /**
     * Give all child nodes with the given class name
     *
     * @param {Object} doc
     * @param {Object} id
     */
    getNodesByClassName: function(doc, tagName, className){
    
        return $A(doc.getElementsByTagName(tagName)).findAll(function(el){
            return $A(el.attributes).any(function(attr){
                return attr.nodeName == 'class' && attr.nodeValue == className
            })
        })
        
    },
    
    /**
     * Parses the erdf string to an xml-document
     *
     * @param {Object} erdfString
     */
    parseToDoc: function(erdfString){
    
        erdfString = erdfString.startsWith('<?xml') ? erdfString : '<?xml version="1.0" encoding="utf-8"?>' + erdfString + '';
        
        var parser = new DOMParser();
        
        return parser.parseFromString(erdfString, "text/xml");
        
    },
    
    
    /**
     * Opens a upload dialog.
     *
     */
    _showUploadDialog: function(successCallback){
    
        var form = new Ext.form.FormPanel({
            frame: true,
            bodyStyle: 'padding:5px;',
            defaultType: 'textfield',
            labelAlign: 'left',
            buttonAlign: 'right',
            fileUpload: true,
            enctype: 'multipart/form-data',
            items: [{
                text: ORYX.I18N.AMLSupport.panelText,
                style: 'font-size:12px;margin-bottom:10px;display:block;',
                xtype: 'label'
            }, {
                fieldLabel: ORYX.I18N.AMLSupport.file,
                inputType: 'file',
                labelStyle: 'width:50px;',
                itemCls: 'ext_specific_window_overflow'
            }]
        });
        
        var dialog = new Ext.Window({
            autoCreate: true,
            title: ORYX.I18N.AMLSupport.importBtn,
            height: 'auto',
            width: 420,
            modal: true,
            collapsible: false,
            fixedcenter: true,
            shadow: true,
            proxyDrag: true,
            resizable: false,
            items: [form],
            buttons: [{
                text: ORYX.I18N.AMLSupport.impText,
                handler: function(){
                
                    var loadMask = new Ext.LoadMask(Ext.getBody(), {
                        msg: ORYX.I18N.AMLSupport.get
                    });
                    loadMask.show();
                    
                    form.form.submit({
                        url: ORYX.PATH + this.AMLServletURL,
                        success: function(f, a){
                        
                            loadMask.hide();
                            dialog.hide();
                            successCallback(a.result);
                            
                        }
.bind(this)                        ,
                        failure: function(f, a){
                        
                            loadMask.hide();
                            dialog.hide();
                            
                            Ext.MessageBox.show({
                                title: 'Error',
                                msg: a.response.responseText.substring(a.response.responseText.indexOf("content:'") + 9, a.response.responseText.indexOf("'}")),
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.ERROR
                            });
                        }
                    });
                }
.bind(this)
            }, {
                text: ORYX.I18N.AMLSupport.close,
                handler: function(){
                    dialog.hide();
                }
.bind(this)
            }]
        });
        
        dialog.on('hide', function(){
            dialog.destroy(true);
            delete dialog;
        });
        dialog.show();
    },
    
    _showPanel: function(values, successCallback){
    
    
        // Extract the data
        var data = [];
        values.each(function(value){
            data.push([value.title, value.data])
        });
        
        // Create a new Selection Model
        var sm = new Ext.grid.CheckboxSelectionModel({
            header: '',
            //singleSelect	:true
        });
        // Create a new Grid with a selection box
        var grid = new Ext.grid.GridPanel({
            //ddGroup          	: 'gridPanel',
            //enableDragDrop   	: true,
            //cls				: 'ext_specialize_gridPanel_aml',
            store: new Ext.data.SimpleStore({
                data: data,
                fields: ['title']
            }),
            cm: new Ext.grid.ColumnModel([sm, {
                header: ORYX.I18N.AMLSupport.title,
                width: 260,
                sortable: true,
                dataIndex: 'title'
            }, ]),
            sm: sm,
            frame: true,
            width: 300,
            height: 300,
            iconCls: 'icon-grid',
            //draggable: true
        });
        
        // Create a new Panel
        var panel = new Ext.Panel({
            items: [{
                xtype: 'label',
                html: ORYX.I18N.AMLSupport.selectDiagrams,
                style: 'margin:5px;display:block'
            }, grid],
            height: 'auto',
            frame: true
        })
        
        // Create a new Window
        var extWindow = new Ext.Window({
            width: 327,
            height: 'auto',
            title: 'Oryx',
            floating: true,
            shim: true,
            modal: true,
            resizable: false,
            autoHeight: true,
            items: [panel],
            buttons: [{
                text: ORYX.I18N.AMLSupport.impText,
                handler: function(){
                
                    var loadMask = new Ext.LoadMask(Ext.getBody(), {
                        msg: ORYX.I18N.AMLSupport.impProgress
                    });
                    loadMask.show();
                    
                    var selectionModel = grid.getSelectionModel();
                    var result = selectionModel.selections.items.collect(function(item){
                        return {
                            name: item.json[0],
                            data: item.json[1]
                        };
                    })
                    extWindow.close();
                    
                    window.setTimeout(function(){
                    
                        successCallback(result);
                        loadMask.hide();
                        
                    }
.bind(this), 100);
                    
                    
                }
.bind(this)
            }, {
                text: ORYX.I18N.AMLSupport.cancel,
                handler: function(){
                    extWindow.close();
                }
.bind(this)
            }]
        })
        
        // Show the window
        extWindow.show();
        
    },
    
    _showResultPanel: function(values){
    
    
        // Extract the data
        var data = [];
        values.each(function(value){
            data.push([value.name, '<a href="' + value.url + '" target="_blank">' + value.url + '</a>'])
        });
        
        
        // Create a new Grid with a selection box
        var grid = new Ext.grid.GridPanel({
            store: new Ext.data.SimpleStore({
                data: data,
                fields: ['name', 'url']
            }),
            cm: new Ext.grid.ColumnModel([{
                header: ORYX.I18N.AMLSupport.name,
                width: 260,
                sortable: true,
                dataIndex: 'name'
            }, {
                header: "URL",
                width: 300,
                sortable: true,
                dataIndex: 'url'
            }]),
            frame: true,
            width: 500,
            height: 300,
            iconCls: 'icon-grid'
        });
        
        // Create a new Panel
        var panel = new Ext.Panel({
            items: [{
                xtype: 'label',
                text: ORYX.I18N.AMLSupport.allImported,
                style: 'margin:5px;display:block'
            }, grid],
            height: 'auto',
            frame: true
        })
        
        // Create a new Window
        var extWindow2 = new Ext.Window({
            width: 'auto',
            title: 'Oryx',
            floating: true,
            shim: true,
            modal: true,
            resizable: false,
            autoHeight: true,
            items: [panel],
            buttons: [{
                text: ORYX.I18N.AMLSupport.ok,
                handler: function(){
                
                    extWindow2.close()
                    
                }
.bind(this)
            }]
        })
        
        // Show the window
        extWindow2.show();
        
    },
    /**
     *
     * @param {Object} message
     */
    throwErrorMessage: function(message){
        Ext.Msg.alert('Oryx', message)
    },

});
/**
  		var serializedDOM = DataManager.__persistDOM(this.facade);
  		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
       	  '<html xmlns="http://www.w3.org/1999/xhtml" '    +
            'xmlns:b3mn="http://b3mn.org/2007/b3mn" '    +
            'xmlns:ext="http://b3mn.org/2007/ext" '    +
            'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" '  +
            'xmlns:atom="http://b3mn.org/2007/atom+xhtml">'   +
          	'<head profile="http://purl.org/NET/erdf/profile">'   +
         	'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
            '<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
            '<link rel="schema.b3mn" href="http://b3mn.org" />'   +
            '<link rel="schema.oryx" href="http://oryx-editor.org/" />'  +
            '<link rel="schema.raziel" href="http://raziel.org/" />'  +
       	  '</body></html>';
	    //convert to RDF
			new Ajax.Request(ORYX.CONFIG.AUTO_LAYOUTER_URL, {
 * Copyright (c) 2008
 * Matthias Weidlich
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Transforms a BPEL process into its BPMN representation.
 * 
 * 
 */
ORYX.Plugins.BPEL2BPMN = Clazz.extend({

	facade: undefined,

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		this.facade = facade;
		
		this.facade.offer({
			'name':"Transform BPEL into BPMN",
			'functionality': this.transform.bind(this),
			'group': "BPEL2BPMN",
			'icon': ORYX.PATH + "images/epc_export.png",
			'description': "Transform a BPEL process into its BPMN representation",
			'index': 1,
			'minShape': 0,
			'maxShape': 0});
			
	},

	
	/**
	 * Trigger the actual BPEL 2 BPMN transformation.
	 */
	transform: function(){
		this.openUploadDialog();
	},
	
	/**
	 * Opens a upload dialog.
	 * (adapted from the epcSupport plugin)
	 * 
	 */
	openUploadDialog: function(){
		
		var form = new Ext.form.FormPanel({
			frame : true,
			defaultType : 'textfield',
		 	waitMsgTarget : true,
		  	labelAlign : 'left',
		  	buttonAlign: 'right',
		  	fileUpload : true,
		  	enctype : 'multipart/form-data',
		  	items : [
		  	{
		    	fieldLabel : 'File',
		    	inputType : 'file',
				allowBlank: false
		  	}]
		});

		var submit =form.addButton({
			text:"Submit",
			handler: function()
			{
				form.form.submit({
		      		url: ORYX.PATH + '/bpel2bpmn',
		      		waitMsg: "Transforming...",
		      		success: function(f,a){
						dialog.hide();
						var resultString = '{' + a.result + '}';
						var resultObject = resultString.evalJSON();
						
						var eRDF = resultObject.content;
						var successfulValidation = resultObject.successValidation;
						var validationError = resultObject.validationError;
						
						eRDF = '<?xml version="1.0" encoding="utf-8"?><div>'+eRDF+'</div>';
						var parser	= new DOMParser();			
						
						this.facade.importERDF(parser.parseFromString(eRDF ,"text/xml"));
						
						this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_AUTOLAYOUT_LAYOUT});

						
		      		}.bind(this),
					failure: function(f,a){
						dialog.hide();
						Ext.MessageBox.show({
           					title: 'Error',
          	 				msg: a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9, a.response.responseText.indexOf("'}")),
           					buttons: Ext.MessageBox.OK,
           					icon: Ext.MessageBox.ERROR
       					});
		      		}
		  		});
		  	}.bind(this)
		})

		var dialog = new Ext.Window({ 
			autoCreate: true, 
			title: 'Upload File', 
			height: 130, 
			width: 400, 
			modal:true,
			collapsible:false,
			fixedcenter: true, 
			shadow:true, 
			proxyDrag: true,
			resizable:false,
			items: [new Ext.form.Label({text: "Select a BPEL (.bpel) file and transform it to BPMN.", style: 'font-size:12px;'}),form]
		});
		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});
		dialog.show();
	},


	

	
});/**
 * Copyright (c) 2008
 * Zhen Peng
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();
	
ORYX.Plugins.BPEL4ChorSupport = Clazz.extend({

	facade: undefined,
	
	dialogSupport: undefined,

	/**
	 * Offers the plugin functionality:
	 */
	construct: function(facade) {
		
		this.facade = facade;

		this.dialogSupport = new ORYX.Plugins.TransformationDownloadDialog();
		
	    this.facade.offer({
			'name':ORYX.I18N.BPEL4ChorSupport.exp,
			'functionality': this.exportProcess.bind(this),
			'group': ORYX.I18N.BPEL4ChorSupport.group,
			'icon':  ORYX.PATH + "images/bpel4chor_export_icon.png",
			'description': ORYX.I18N.BPEL4ChorSupport.expDesc,
			'index': 0,
			'minShape': 0,
			'maxShape': 0
		});
			
        this.facade.offer({
			'name':ORYX.I18N.BPEL4ChorSupport.imp,
			'functionality': this.importProcess.bind(this),
			'group': ORYX.I18N.BPEL4ChorSupport.group,
			'icon':  ORYX.PATH + "images/bpel4chor_import_icon.png",
			'description': ORYX.I18N.BPEL4ChorSupport.impDesc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){ return false}
		});
		
		this.facade.offer({
			'name':ORYX.I18N.BPEL4ChorSupport.gen,
			'functionality': this.generate.bind(this),
			'group': ORYX.I18N.BPEL4ChorSupport.group,
			'icon':  ORYX.PATH + "images/bpel4chor_generator.png",
			'description': ORYX.I18N.BPEL4ChorSupport.genDesc,
			'index': 2,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){ return false}
		});
	},
	
	/***************************** export **********************************/	
		
	exportProcess: function(){
	
		// raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
            
		// asynchronously ...
        window.setTimeout((function(){
			
			// ... save synchronously
            this.exportSynchronously();
			
			// raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
			
        }).bind(this), 10);

		return true;
    },
    
    exportSynchronously: function() {

        var resource = location.href;
		
		//get current DOM content
		var serializedDOM = DataManager.__persistDOM(this.facade);
		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';
		
		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
			if (!serialized_rdf.startsWith("<?xml")) {
				serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
			}
			  
			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.BPEL4CHOR_EXPORT_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: resource,
					data: serialized_rdf
				},
                onSuccess: function(response){
                	this.displayResult(response.responseText);
				}.bind(this)
			});
                	
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}
    
	},
	
	
	/**
	 * Builds up the data that will be shown in the result dialog of
	 * the BPEL4Chor transformation.
	 * For this purpose the process names are determined and
	 * it is checked if the topology and process were generated
	 * successfully.
	 * 
	 * @param {String} topology    The generated topology 
	 * @param {String[]} processes The generated processes
	 */
	buildTransData: function(topology, grounding, processes) {
		var data = [
		    ["topology", topology, this.dialogSupport.getResultInfo(topology)],
		    ["grounding", grounding, this.dialogSupport.getResultInfo(grounding)]
		];
		
		for (var i = 0; i < processes.length; i++) {
			var name = this.dialogSupport.getProcessName(processes[i]);
			if (name == undefined) {
				name = "Process " + (i+1);
			}
			data[i+2] = [name, processes[i], this.dialogSupport.getResultInfo(processes[i])];
		}	
		
		return data;
	},
	
	
	/**
	 * Analyzes the result of the servlet call.
	 * 
	 * If an fault occured or the answer is undefined, the error is shown
	 * using a message dialog.
	 * 
	 * If the first result starts with "ParserError" the error is shown using an 
	 * error dialog. Otherwise the result is shown using the result dialog.
	 * 
	 * @param {Object} result - the result of the transformation servlet (JSON)
	 */
	displayResult: function(result) {
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});

		var resultString = '(' + result + ')';
		
		//alert (resultString);
		
		var resultObject;
		
		try {
			resultObject = eval(resultString);
		} catch (e1) {
			alert("Error during evaluation of result: " + e1 + "\r\n" + resultString);
		}
		
		if ((!resultObject.res) || (resultObject.res.length == 0)) {
			this.dialogSupport.openMessageDialog(ORYX.I18N.TransformationDownloadDialog.error,ORYX.I18N.TransformationDownloadDialog.noResult);
		} else if (resultObject.res[0].content.indexOf("Parser Error")>0) {
			this.dialogSupport.openErrorDialog(resultObject.res[0].content);
		} else {
			var topology = resultObject.res[0].content;
			var grounding = resultObject.res[1].content;
			var processes = new Array();
			for (var i = 2; i < resultObject.res.length; i++) {
				processes[i-2] = resultObject.res[i].content;
			}
			var data = this.buildTransData(topology,grounding,processes);
			
			this.dialogSupport.openResultDialog(data);
		}
	},
	
	/***************************** import **********************************/
	
	importProcess: function(){
		this.openUploadDialog ();
	},
	
	/**
	 * Opens a upload dialog.
	 */
	openUploadDialog: function(){
		
	},
	
	loadERDF: function(erdfString){
								
		var parser = new DOMParser();			
		var doc    = parser.parseFromString(erdfString ,"text/xml");
		
		alert(erdfString);
		this.facade.importERDF( doc );

	},
	
	/***************************** generate **********************************/
	generate : function(){
		
	}
	
	
	
});
	/**
 * Copyright (c) 2008
 * Zhen Peng
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.BPELLayouting = Clazz.extend({

	facade: undefined,
	
	isEnabled : undefined,
	
	/**
	 *	Constructor
	 *	@param {Object} Facade: The Facade of the Editor
	 */
	construct: function(facade) {
		this.facade = facade;
		
		this.isEnabled = true;
		
		this.facade.offer({
			'name':ORYX.I18N.BPELSupport.enable,
			'functionality': this.enableBpelLayout.bind(this),
			'group': ORYX.I18N.BPELLayout.group,
			'icon': ORYX.PATH + "images/bpel_layout_enable.png",
			'description': ORYX.I18N.BPELLayout.enDesc,
			'index': 0,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){ return !(this.isEnabled)}.bind(this)
		});
		
		this.facade.offer({
			'name':ORYX.I18N.BPELSupport.disable,
			'functionality': this.disableBpelLayout.bind(this),
			'group': ORYX.I18N.BPELLayout.group,
			'icon': ORYX.PATH + "images/bpel_layout_disable.png",
			'description': ORYX.I18N.BPELLayout.disDesc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0,
			'isEnabled': function(){ return this.isEnabled}.bind(this)
		});
	
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL, this.handleLayoutEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_VERTICAL, this.handleLayoutVerticalEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_HORIZONTAL, this.handleLayoutHorizontalEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_SINGLECHILD, this.handleSingleChildLayoutEvent.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_AUTORESIZE, this.handleAutoResizeLayoutEvent.bind(this));
	},
	
	/**************************** plug-in control ****************************/
	
	disableBpelLayout : function(){
		
		this.isEnabled = false;
	},
	
	enableBpelLayout : function(){
		
		this.isEnabled = true;
		
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text: 'Auto Layouting...'});
		
		//adjust all immediate child nodes(grand-children are adjusted recursively)
		nodes = this.facade.getCanvas().getChildNodes();
		for (var i = 0; i < nodes.size(); i++) {
			node = nodes[i];
			if (node.getStencil().id() == node.getStencil().namespace() + "process"){
				this._adjust_node(node);
			}
		}
		
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
	},
	
	_adjust_node : function (node){
		
		// handle children first
		// that means, the innermost children should be at first arranged,
		var nodes = node.getChildNodes();
		for (var i = 0; i < nodes.size(); i++) {
			this._adjust_node(nodes[i]);
		};
		
		// handle the current node
		this._handleLayoutEventAdapter (node);
		//alert (node.getStencil().id());
		
	},
	
	_handleLayoutEventAdapter : function(node){
		
		if (node.getStencil().id() == node.getStencil().namespace() + "process"
	 		|| node.getStencil().id() == node.getStencil().namespace() + "invoke" 
	    	|| node.getStencil().id() == node.getStencil().namespace() + "scope"){
	    		
			this._handleLayoutEvent (node);
			
		} else if (node.getStencil().id() == node.getStencil().namespace() + "assign"
			|| node.getStencil().id() == node.getStencil().namespace() + "eventHandlers"
			|| node.getStencil().id() == node.getStencil().namespace() + "faultHandlers"
			|| node.getStencil().id() == node.getStencil().namespace() + "compensationHandler"
			|| node.getStencil().id() == node.getStencil().namespace() + "terminationHandler"){
			
			this._handleLayoutVerticalEvent (node);
			
		} else if  (node.getStencil().id() == node.getStencil().namespace() + "if"
			|| node.getStencil().id() == node.getStencil().namespace() + "sequence"
			|| node.getStencil().id() == node.getStencil().namespace() + "pick"){
			
			this._handleLayoutHorizontalEvent (node);
			
		} else if (node.getStencil().id() == node.getStencil().namespace() + "onMessage"
			|| node.getStencil().id() == node.getStencil().namespace() + "if_branch"
			|| node.getStencil().id() == node.getStencil().namespace() + "else_branch"
			|| node.getStencil().id() == node.getStencil().namespace() + "while"
			|| node.getStencil().id() == node.getStencil().namespace() + "repeatUntil"
			|| node.getStencil().id() == node.getStencil().namespace() + "forEach"
			|| node.getStencil().id() == node.getStencil().namespace() + "onAlarm"
			|| node.getStencil().id() == node.getStencil().namespace() + "onEvent"
			|| node.getStencil().id() == node.getStencil().namespace() + "catch"
			|| node.getStencil().id() == node.getStencil().namespace() + "catchAll"){
			
			this._handleSingleChildLayoutEvent (node);
			
		} else if (node.getStencil().id() == node.getStencil().namespace() + "flow"){
			
			this._handleAutoResizeLayoutEvent (node);
		} else {
			// other shapes cann't contein any children shapes.
			return;
		}
	
	},
	
	
	/***************************** Event Handler *****************************/
	
	handleLayoutEvent: function(event) {
		this._handleLayoutEvent (event.shape);
	},
	
	handleLayoutVerticalEvent: function(event) {
		this._handleLayoutVerticalEvent (event.shape);
	},
	
	handleLayoutHorizontalEvent: function(event) {
		this._handleLayoutHorizontalEvent (event.shape);
	},
	
	handleSingleChildLayoutEvent: function(event) {
		this._handleSingleChildLayoutEvent (event.shape);
	},
	
	handleAutoResizeLayoutEvent: function(event) {
		this._handleAutoResizeLayoutEvent (event.shape);
	},
	
		
	/************************* Auto Layout Processes ****************************/
	
	/**
	 *  realize special BPEL layouting:
	 *  main activity: placed left,
	 *  Handler: placed right.
	 */
	_handleLayoutEvent: function(shape) {
		
		if (this.isEnabled == false) {
			return;
		}
		
     	var elements = shape.getChildShapes(false);
     	
     	// if Autolayout is not required, do nothing.
		if (!this._requiredAutoLayout (shape)){
     		return;
     	};
     	
		// If there are no elements
		if(!elements || elements.length == 0) {
			this._resetBounds(shape);
			this._update(shape);
			return;
		};
		
     	var eventHandlers = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "eventHandlers");
			});
		
		var faultHandlers = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "faultHandlers");
			});
			
		var compensationHandler = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "compensationHandler");
			});	

		var terminationHandler = elements.find(function(node) {
				return (node.getStencil().id() == node.getStencil().namespace() + "terminationHandler");
			});
			
		var otherElements = elements.findAll(function(node){
				return (node !== eventHandlers && node !== faultHandlers 
				&& node !== compensationHandler && node !== terminationHandler)
			});
		
		var nextLeftBound = 30;
		var nextUpperBound = 30;
		
		// handle Activity
		if (otherElements){
			
			// Sort top-down
			otherElements = otherElements.sortBy(function(element){
				return element.bounds.upperLeft().y;
			});
			
			// move some certain elements to the last child position
			// if it "true" returns, that means, the arrangement of elements
			// is changed, we should sort all elements again
			if (this._moveSomeElementToLastPosition(otherElements)){
				// Sort again
				otherElements = otherElements.sortBy(function(element){
					return element.bounds.upperLeft().y;
				});
			}
			
			var lastUpperYPosition = 0;
			var elementWidth;
			var maxElementWidth = 0;
			
			// Arrange shapes like Layout-Vertical
			otherElements.each (function(element){
		
				var ul = element.bounds.upperLeft();
				var oldUlY = ul.y;
			
				ul.y = lastUpperYPosition + 30;
				lastUpperYPosition = ul.y + element.bounds.height();
			
				if (ul.y != oldUlY) {
					element.bounds.moveTo(30, ul.y);
				};
				
				elementWidth = element.bounds.width();
				if (elementWidth > maxElementWidth){
					maxElementWidth = elementWidth;
				}
			});
			
			nextLeftBound = 30 + maxElementWidth + 30;
		
		}
		
		var width;
		var maxWidth = 0;
		
		// handle EventHanlders
		if (eventHandlers){
			eventHandlers.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = eventHandlers.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this._getRightestBoundOfAllChildren(eventHandlers)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		// handle FaultHandlers
		if (faultHandlers){
			faultHandlers.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = faultHandlers.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this._getRightestBoundOfAllChildren(faultHandlers)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		// handle CompensationHandler
		if (compensationHandler){
			compensationHandler.bounds.moveTo(nextLeftBound, nextUpperBound);
			nextUpperBound = compensationHandler.bounds.lowerRight().y + 10;
			
			// record maximal width
			width = this._getRightestBoundOfAllChildren(compensationHandler)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		
		// handle TerminationHandler
     	if (terminationHandler){
			terminationHandler.bounds.moveTo(nextLeftBound, nextUpperBound);
			
			// record maximal width
			width = this._getRightestBoundOfAllChildren(terminationHandler)+ 30;
			if (width > maxWidth){
				maxWidth = width;
			}
		}
		
		// resize all the handlers with the same width
		if (width > 0){
			var ul;
			var lr;
			
			if (eventHandlers){	
				width = eventHandlers.bounds.width();
				if (width !== maxWidth){
					ul = eventHandlers.bounds.upperLeft();
					lr = eventHandlers.bounds.lowerRight();
					eventHandlers.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
					//eventHandlers._changed();
				}
			}

			if (faultHandlers){
				width = faultHandlers.bounds.width();
				if (width !== maxWidth){
					ul = faultHandlers.bounds.upperLeft();
					lr = faultHandlers.bounds.lowerRight();
					faultHandlers.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
					//faultHandlers._changed();
				}
			}

			if (compensationHandler){
				width = compensationHandler.bounds.width();
				if (width !== maxWidth){
					ul = compensationHandler.bounds.upperLeft();
					lr = compensationHandler.bounds.lowerRight();
					compensationHandler.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
					//compensationHandler._changed();
				}
			}
			
	     	if (terminationHandler){
				width = terminationHandler.bounds.width();
				if (width !== maxWidth){
					ul = terminationHandler.bounds.upperLeft();
					lr = terminationHandler.bounds.lowerRight();
					terminationHandler.bounds.set(ul.x, ul.y, ul.x + maxWidth, lr.y);
					//terminationHandler._changed();
				}
			}
		}
		
		this._autoResizeLayout(shape);
		
		this._update(shape);
		
		return;
		
	},
	
	_getRightestBoundOfAllChildren : function(shape){
		var elements = shape.getChildShapes(false);
     	
		// If there are no elements
		if(!elements || elements.length == 0) {
			// 160 is the default width of hanlders
			return 130;
		};
			
		// Sort left-right
		elements = elements.sortBy(function(element){
			return element.bounds.lowerRight().x;
		});
		
		return elements.last().bounds.lowerRight().x;
	},
	
	_handleLayoutVerticalEvent: function(shape) {
		
		if (this.isEnabled == false) {
			return;
		}
		
		var elements = shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this._requiredAutoLayout (shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this._resetBounds(shape);
			return;
		};
		
		// Sort top-down
		elements = elements.sortBy(function(element){
			return element.bounds.upperLeft().y;
		});
		
					
		// move some certain elements to the last child position
		// if it "true" returns, that means, the arrangement of elements
		// is changed, we should sort all elements again
		if (this._moveSomeElementToLastPosition(elements)){
			// Sort again
			elements = elements.sortBy(function(element){
				return element.bounds.upperLeft().y;
			});
		}
		
		var lastUpperYPosition = 0;
		// Arrange shapes
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			var oldUlY = ul.y;
			
			ul.y = lastUpperYPosition + 30;
			lastUpperYPosition = ul.y + element.bounds.height();
			
			if ((ul.y != oldUlY)) {
				element.bounds.moveTo(30, ul.y);
			}
		});
		
		this._autoResizeLayout(shape);
	
		return;
	},
	
	_handleLayoutHorizontalEvent: function(shape) {

		if (this.isEnabled == false) {
			return;
		}
		
		var elements = shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this._requiredAutoLayout (shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this._resetBounds(shape);
			return;
		};
					
		
		// Sort left-right
		elements = elements.sortBy(function(element){
			return element.bounds.upperLeft().x;
		});
		
		// move some certain elements to the last child position
		// if it "true" returns, that means, the arrangement of elements
		// is changed, we should sort all elements again
		if (this._moveSomeElementToLastPosition(elements)){
			// Sort again
			elements = elements.sortBy(function(element){
				return element.bounds.upperLeft().x;
			});
		}
		
		var lastLeftXPosition = 0;
		
		// Arrange shapes on rows (align left)
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			var oldUlX = ul.x;
			
			ul.x = lastLeftXPosition + 30;
			lastLeftXPosition = ul.x + element.bounds.width();

			if ((ul.x != oldUlX)) {
				element.bounds.moveTo(ul.x, 30);
			}
		});
		
		this._autoResizeLayout(shape);
			
		return;
	},
	
	
	
	_handleSingleChildLayoutEvent: function(shape) {
     	
		if (this.isEnabled == false) {
			return;
		}
		
		var elements = shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this._requiredAutoLayout (shape)){
     		return;
     	};
		
		// If there are no elements
		if(!elements || elements.length == 0) {
			this._resetBounds(shape);
			return;
		};
		
		elements.first().bounds.moveTo(30, 30);
		
		this._autoResizeLayout(shape);
		
		return;
	},
	
	_handleAutoResizeLayoutEvent: function(shape) {
		
		if (this.isEnabled == false) {
			return;
		};
		
		var elements = shape.getChildShapes(false);
		
		// if Autolayout is not required, do nothing.
		if (!this._requiredAutoLayout (shape)){
     		return;
     	};
		
		elements.each(function(element){
		
			var ul = element.bounds.upperLeft();
			
			if ((ul.x < 30)) {
				element.bounds.moveTo(30, ul.y);
				ul = element.bounds.upperLeft();
			}
			
			if ((ul.y < 30)) {
				element.bounds.moveTo(ul.x, 30);
			}
		});
		
		this._autoResizeLayout(shape);
	},
	
	/**
	 * Resizes the shape to the bounds of the child shapes 
	 */
	_autoResizeLayout: function(shape) {
		
		var elements = shape.getChildShapes(false);
		
		if (elements.length > 0) {

		    elements = elements.sortBy(function(element){
				return element.bounds.lowerRight().x;
		    });
		    
			var rightBound = elements.last().bounds.lowerRight().x;
                 
		    elements = elements.sortBy(function(element){
				return element.bounds.lowerRight().y;
		    });
		    
			var lowerBound = elements.last().bounds.lowerRight().y;
			
			var ul = shape.bounds.upperLeft();
			var lr = shape.bounds.lowerRight();
			
			//handle "flow" specially.
			if (shape.getStencil().id() ==shape.getStencil().namespace() + "flow"){
			 	
			 	if (lr.x < ul.x + rightBound + 30){
			 		shape.bounds.set(ul.x, ul.y, ul.x + rightBound + 30, lr.y);
			 		lr.x = ul.x + rightBound + 30;
			 		//shape._changed();
			 	};
			 	
			 	if (lr.y < ul.y + lowerBound + 30){
			 		shape.bounds.set(ul.x, ul.y, lr.x, ul.y + lowerBound + 30);
			 		//shape._changed();
			 	};			 	
			 } else {
			 	if (lr.x != ul.x + rightBound + 30 || lr.y != ul.y + lowerBound + 30){
			 		shape.bounds.set(ul.x, ul.y, ul.x + rightBound + 30, ul.y + lowerBound + 30);
			 		//shape._changed();
			 	};
			 };
		};
		
		return;
	},
	
	_resetBounds: function (shape) {

		// all the shapes without children will be reseted
		var ul = shape.bounds.upperLeft();
		var lr = shape.bounds.lowerRight();
		
		if (shape.getStencil().id() == shape.getStencil().namespace() + "process"){
			if (shape.getStencil().namespace() == "http://b3mn.org/stencilset/bpel#"){
				if (lr.x != ul.x + 600 || lr.y != ul.y + 500){
					shape.bounds.set(ul.x, ul.y, ul.x + 600, ul.y + 500);
					//shape._changed();
				};
			} else if (shape.getStencil().namespace() == "http://b3mn.org/stencilset/bpel4chor#"){
				if (lr.x != ul.x + 690 || lr.y != ul.y + 200){
					shape.bounds.set(ul.x, ul.y, ul.x + 690, ul.y + 200);
					//shape._changed();
				};
			} else {
				return;
			}
		} else if (shape.getStencil().id() == shape.getStencil().namespace() + "flow"){
			if (lr.x != ul.x + 290 || lr.y != ul.y + 250){
				shape.bounds.set(ul.x, ul.y, ul.x + 290, ul.y + 250);
				//shape._changed();
			};
		} else if (this._isHandlers(shape)){
			if (lr.x != ul.x + 160 || lr.y != ul.y + 80){
				shape.bounds.set(ul.x, ul.y, ul.x + 160, ul.y + 80);
				//shape._changed();
			};
		} else {
			if (lr.x != ul.x + 100 || lr.y != ul.y + 80){
				shape.bounds.set(ul.x, ul.y, ul.x + 100, ul.y + 80);
				//shape._changed();
			};	
		};

	},
	
	_isHandlers: function (shape) {
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "eventHandlers"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "faultHandlers"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "compensationHandler"){
	  		return true;
	  	};
	  	
	  	if (shape.getStencil().id() == shape.getStencil().namespace() + "terminationHandler"){
	  		return true;
	  	};
		
	  	return false;
	},
	
	_requiredAutoLayout: function(shape) {
		
		var key = "oryx-autolayout";
		var autolayout = shape.properties[key];
		
		if (autolayout == null){
			return true;
		};
		
		if (autolayout){
			return true;
		};
		
		return false;
	},
	
	/**
	 * find a element with the role "lastChild", that means, this shape should be
	 * the last child of their parent, e.g.: "else" in "if-block". then move these elements
	 * to the last position of the set.
	 * 
	 * 
	 * @param {} elements : the set of all elements
	 * @pre      all the elements in set are already once arranged, so we just put the 
	 *           "lastChild" after the current last one. 
	 * @return   if the arrangement of elements is changed.
	 */
	_moveSomeElementToLastPosition: function (elements){
		var lastChild = elements.find(function(node) {
			 	return (Array.indexOf(node.getStencil().roles(), node.getStencil().namespace() + "lastChild")>= 0);
			});	
		
		// if there are not such element or it's already the last child,
		// do nothing.	
		if (!lastChild || lastChild == elements.last()){
			return false;
		}
		
		// move it after the current last child
		ulOfCurrentLastChild = elements.last().bounds.upperLeft();
		lastChild.bounds.moveTo(ulOfCurrentLastChild.x + 1, ulOfCurrentLastChild.y + 1);
		
		return true;
	},
	
	_update : function(shape){
		// update the canvas only wenn the current node "process" is, with this we can
		// make sure that, each time just once update after all the nodes are arranged
		// and we must check, whether the node "process" changed is, if not, don't update,
		// otherwise, an endless loop may occur, wenn there are more than three nesting level 
		// in a shape.
		if (shape.getStencil().id() == shape.getStencil().namespace() + "process"
		&& shape.isChanged){
			this.facade.getCanvas().update();
		}
	}
});/**
 * Copyright (c) 2008
 * Zhen Peng
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();
	
ORYX.Plugins.BPELSupport = Clazz.extend({

	facade: undefined,

	dialogSupport: undefined,
	
	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		
		this.facade = facade;

		this.dialogSupport = new ORYX.Plugins.TransformationDownloadDialog();

	    this.facade.offer({
			'name':ORYX.I18N.BPELSupport.exp,
			'functionality': this.exportProcess.bind(this),
			'group': ORYX.I18N.BPELSupport.group,
			'icon': ORYX.PATH + "images/bpel_export_icon.png",
			'description': ORYX.I18N.BPELSupport.expDesc,
			'index': 0,
			'minShape': 0,
			'maxShape': 0
		});
			
        this.facade.offer({
			'name':ORYX.I18N.BPELSupport.imp,
			'functionality': this.importProcess.bind(this),
			'group': ORYX.I18N.BPELSupport.group,
			'icon': ORYX.PATH + "images/bpel_import_icon.png",
			'description': ORYX.I18N.BPELSupport.impDesc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0
		});
	},
	
	/***************************** export **********************************/
	
	exportProcess: function(){
	
		// raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
            
		// asynchronously ...
        window.setTimeout((function(){
			
			// ... save synchronously
            this.exportSynchronously();
			
			// raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
			
        }).bind(this), 10);

		return true;
    },
    
    exportSynchronously: function() {

        var resource = location.href;
		
		//get current DOM content
		var serializedDOM = DataManager.__persistDOM(this.facade);
		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';
		
		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
			if (!serialized_rdf.startsWith("<?xml")) {
				serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
			}
			  
			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.BPEL_EXPORT_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: resource,
					data: serialized_rdf
				},
                onSuccess: function(response){
					this.displayResult(response.responseText);
                }.bind(this)
			});
                	
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}
    
	},
	
	
	/**
	 * Analyzes the result of the servlet call.
	 * 
	 * If an fault occured or the answer is undefined, the error is shown
	 * using a message dialog.
	 * 
	 * If the first result starts with "ParserError" the error is shown using an 
	 * error dialog. Otherwise the result is shown using the result dialog.
	 * 
	 * @param {Object} result - the result of the transformation servlet (JSON)
	 */
	displayResult: function(result) {
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});

		var resultString = '(' + result + ')';
		
		var resultObject;
		
		try {
			resultObject = eval(resultString);
		} catch (e1) {
			alert("Error during evaluation of result: " + e1 + "\r\n" + resultString);
		}
		
		if ((!resultObject.res) || (resultObject.res.length == 0)) {
			this.dialogSupport.openMessageDialog(ORYX.I18N.TransformationDownloadDialog.error,ORYX.I18N.TransformationDownloadDialog.noResult);
		} else if (resultObject.res[0].success == "false") {
			this.dialogSupport.openErrorDialog(resultObject.res[0].content);
		} else {
			var processes = new Array();
			for (var i = 0; i < resultObject.res.length; i++) {
				processes[i] = resultObject.res[i].content;
			}
			var data = this.buildTransData(processes);
			this.dialogSupport.openResultDialog(data);
		}
	},
	
	/**
	 * Builds up the data that will be shown in the result dialog of
	 * the BPEL transformation.
	 * For this purpose the process names are determined and
	 * it is checked if the process were generated
	 * successfully.
	 * 
	 * @param {String[]} processes The generated processes
	 */
	buildTransData: function(processes) {
		var data = [];
		
		for (var i = 0; i < processes.length; i++) {
			var name = this.dialogSupport.getProcessName(processes[i]);
			if (name == undefined) {
				name = "Process " + (i+1);
			}
			data[i] = [name, processes[i], this.dialogSupport.getResultInfo(processes[i])];
		}	
		
		return data;
	},

	/***************************** import **********************************/
	
	importProcess: function(){
		this.openUploadDialog ();
	},
	
	/**
	 * Opens a upload dialog.
	 * 
	 */
	openUploadDialog: function(){
		
		var form = new Ext.form.FormPanel({
			frame : 		true,
			bodyStyle:		'padding:5px;',
			defaultType : 	'textfield',
		  	labelAlign : 	'left',
		  	buttonAlign: 	'right',
		  	fileUpload : 	true,
		  	enctype : 		'multipart/form-data',
		  	items : [
		  	{
		    	text : 		ORYX.I18N.BPELSupport.selectFile, 
				style : 	'font-size:12px;margin-bottom:10px;display:block;',
				xtype : 	'label'
		  	},{
		    	fieldLabel : 	ORYX.I18N.BPELSupport.file,
		    	inputType : 	'file',
				labelStyle :	'width:50px;',
				itemCls :		'ext_specific_window_overflow'
		  	}]
		});


		var displayPanel = new Ext.form.FormPanel({
			frame : 		true,
			bodyStyle:		'padding:5px;',
			defaultType : 	'textfield',
		  	labelAlign : 	'left',
		  	buttonAlign: 	'right',
		  	fileUpload : 	true,
		  	enctype : 		'multipart/form-data',
		  	items : [
		  	{
		    	text : 		ORYX.I18N.BPELSupport.content, 
				style : 	'font-size:12px;margin-bottom:10px;display:block;',
				xtype : 	'label'
		  	}, {
	            xtype: 'textarea',
	            width: '160',
	            height: '350',
	            hideLabel: true,
	            anchor: '100% -63'
	        }]
		});
		
		var dialog = new Ext.Window({ 
			autoCreate:     true, 
			title: 		ORYX.I18N.BPELSupport.impPanel, 
			height: 	'auto', 
			width: 		'auto', 
			modal:		true,
			collapsible:false,
			fixedcenter:true, 
			shadow:		true, 
			proxyDrag: 	true,
			resizable:	false,
			items: [form, displayPanel],
			buttons:[
				{
					text:ORYX.I18N.BPELSupport.impBtn,
					handler: function(){
						
							
						var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:ORYX.I18N.BPELSupport.progressImp});
						loadMask.show();
												
						form.form.submit({
				      		url: ORYX.PATH + '/bpelimporter',
				      		success: function(f,a){
								
								dialog.hide();
								// Get the erdf string					
								var erdf = a.result;
								erdf = erdf.startsWith('<?xml') ? erdf : '<?xml version="1.0" encoding="utf-8"?><div>'+erdf+'</div>';	
								// Load the eRDF to the editor
								this.loadERDF(erdf);
								// Hide the waiting panel
								loadMask.hide();
								
				      		}.bind(this),
							failure: function(f,a){
								dialog.hide();
								loadMask.hide();
								Ext.MessageBox.show({
		           					title: ORYX.I18N.BPELSupport.error,
		          	 				msg: ORYX.I18N.BPELSupport.impFailed + a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9, a.response.responseText.indexOf("'}")),
		           					buttons: Ext.MessageBox.OK,
		           					icon: Ext.MessageBox.ERROR
		       					});
				      		}
				  		});
					}.bind(this)
				},{
					text:ORYX.I18N.BPELSupport.close,
					handler:function(){
						dialog.hide();
					}.bind(this)
				}
			]
		});

		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});
		
		dialog.show();
	
		// Adds the change event handler to file upload filed 
		form.items.items[1].getEl().dom.addEventListener('change',function(evt){
				var text = evt.target.files[0].getAsBinary();
				displayPanel.items.items[1].setValue( text );
			}, true)
	},
	
	loadERDF: function(erdfString){
								
		var parser = new DOMParser();			
		var doc    = parser.parseFromString(erdfString ,"text/xml");
		
		//alert(erdfString);
		this.facade.importERDF( doc );

	}

	
});
	/**
/**
 * Copyright (c) 2008
 * Kai Schlichting
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
Ext.ns("Oryx.Plugins");

ORYX.Plugins.BPMNImport = Clazz.extend({
    converterUrl: "/oryx/bpmn2pn",
    
    // Offers the plugin functionality
    construct: function(facade){
    
        this.facade = facade;
       
        this.importBpmn();
    },
    
    /**
     * General helper method for parsing a param out of current location url
     * E.g. "http://oryx.org?param=value", getParamFromUrl("param") => "value"
     * @param {Object} name
     */
    getParamFromUrl: function(name){
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null) {
            return null;
        }
        else {
            return results[1];
        }
    },
    
    /**
     * Posts rdf (BPNM) to server and loads erdf (Petri net) into canvas
     * @param {Object} bpmnRdf
     */
    bpmnToPn: function(bpmnRdf){
        Ext.Msg.updateProgress(0.66, ORYX.I18N.BPMN2PNConverter.progress.convertingModel);
        Ext.Ajax.request({
            url: this.converterUrl,
            method: 'POST',
            success: function(request){
                var parser = new DOMParser();
                Ext.Msg.updateProgress(1.0, ORYX.I18N.BPMN2PNConverter.progress.renderingModel);
                var doc = parser.parseFromString(request.responseText, "text/xml");
                this.facade.importERDF(doc);
                Ext.Msg.hide();
            }.createDelegate(this),
            failure: function(){
                Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error, ORYX.I18N.BPMN2PNConverter.errors.server);
            },
            params: {
                rdf: bpmnRdf
            }
        });
    },
    
    /**
     * Loads rdf of given bpmn url
     */
    importBpmn: function(){
        var importBPMNUrl = this.getParamFromUrl("importBPMN");
        
        if(!importBPMNUrl) return; //return if no model to import is given
        
        Ext.Msg.progress(ORYX.I18N.BPMN2PNConverter.progress.status, 
                         ORYX.I18N.BPMN2PNConverter.progress.importingModel
        );
        Ext.Msg.updateProgress(0.33, ORYX.I18N.BPMN2PNConverter.progress.fetchingModel);
        
        Ext.Ajax.request({
            url: this.getRdfUrl(importBPMNUrl),
            success: function(request){
                var bpmnRdf = request.responseText;
                this.bpmnToPn(bpmnRdf);
            }.createDelegate(this),
            failure: function(request){
                Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error, ORYX.I18N.BPMN2PNConverter.errors.noRights)
            },
            method: "GET"
        })
    },
    
    /**
     * getRdfUrl("http://localhost:8080/backend/poem/model/7/self") 
     * => "http://localhost:8080/backend/poem/model/7/rdf"
     * getRdfUrl("http://localhost:8080/backend/poem/model/7/rdf" => "http://localhost:8080/backend/poem/model/7/rdf")
     * @param {String} url
     */
    getRdfUrl: function(url){
        return url.replace(/\/self(\/)?$/, "/rdf")
    }
});

ORYX.Plugins.PNExport = Clazz.extend({
    // Offers the plugin functionality
    construct: function(facade){
    
        this.facade = facade;
       
        this.facade.offer({
            'name': ORYX.I18N.BPMN2PNConverter.name,
            'functionality': this.exportIt.bind(this),
            'group': ORYX.I18N.BPMN2PNConverter.group,
            dropDownGroupIcon: ORYX.PATH + "images/export2.png",
            'description': ORYX.I18N.BPMN2PNConverter.desc,
            'index': 3,
            'minShape': 0,
            'maxShape': 0
        });
    },
    
    exportIt: function(){
        //Throw error if model hasn't been saved before
        if(location.href.include( ORYX.CONFIG.ORYX_NEW_URL )){
            Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error, ORYX.I18N.BPMN2PNConverter.errors.notSaved);
            return;
        }
        ORYX.Plugins.SyntaxChecker.instance.resetErrors();
        ORYX.Plugins.SyntaxChecker.instance.checkForErrors({
            context: "bpmn2pn",
            onNoErrors: function(){
                this.openPetriNetEditor();
            }.bind(this)
        })
    },
    
    /**
     * Opens petri net editor with bpmn model import
     * @methodOf: ORYX.Plugins.BPMNImport.prototype
     */
    openPetriNetEditor: function(){
        window.open("/backend/poem/new?stencilset=/stencilsets/petrinets/petrinet.json&importBPMN=" + location.href);
    }
});/**
/**
 * Copyright (c) 2008, Gero Decker
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.DesynchronizabilityOverlay = Clazz.extend({

    facade: undefined,
    
    construct: function(facade){
		
        this.facade = facade;
        
		this.active = false;
		this.el 	= undefined;
		this.callback = undefined;
		
        this.facade.offer({
            'name': ORYX.I18N.DesynchronizabilityOverlay.name,
            'functionality': this.showOverlay.bind(this),
            'group': ORYX.I18N.DesynchronizabilityOverlay.group,
            'icon': ORYX.PATH + "images/bpmn2pn.png",
            'description': ORYX.I18N.DesynchronizabilityOverlay.desc,
            'index': 3,
            'minShape': 0,
            'maxShape': 0
        });
		
    },
    
	showOverlay: function(){

		if (this.active) {
			
			this.facade.raiseEvent({
				type: 	ORYX.CONFIG.EVENT_OVERLAY_HIDE,
				id: 	"desynchronizability"
			});
			this.active = !this.active;				

		} else {
			
			// Force to set all resource IDs
			var serializedDOM = DataManager.serializeDOM( this.facade );

		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';

		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
//			serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
			
			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.DESYNCHRONIZABILITY_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: location.href,
					data: serialized_rdf
				},
				onSuccess: function(request){
						var resp = request.responseText.evalJSON();

						if (resp.conflicttransitions) {
						if (resp.conflicttransitions.length > 0) {
						
							// Get all Valid ResourceIDs and collect all shapes
							var transitionshapes = resp.conflicttransitions.collect(function(res){ return this.facade.getCanvas().getChildShapeByResourceId( res ) }.bind(this)).compact();

							this.facade.raiseEvent({
								type: 			ORYX.CONFIG.EVENT_OVERLAY_SHOW,
								id: 			"desynchronizability",
								shapes: 		transitionshapes,
								attributes: 	{fill: "red", stroke: "black"}
							});

							this.active = !this.active;				

						} else {

							Ext.Msg.alert("Oryx", ORYX.I18N.DesynchronizabilityOverlay.sync);
							// var win = window.open('data:text/plain,' +request.responseText, '_blank', "resizable=yes,width=640,height=480,toolbar=0,scrollbars=yes");
						}
						} else if (resp.syntaxerrors) {

							// Get all Valid ResourceIDs and collect all shapes
//							var shapes = transitions.collect(function(res){ return this.facade.getCanvas().getChildShapeByResourceId( res ) }.bind(this)).compact();

							Ext.Msg.alert("Oryx", ORYX.I18N.DesynchronizabilityOverlay.error.replace(/1/, resp.syntaxerrors.length));

//							this.active = !this.active;				

						} else {
							Ext.Msg.alert("Oryx", ORYX.I18N.DesynchronizabilityOverlay.invalid);
						}
				}.bind(this)
			});
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}

		}
		
	}	
    
});
/**
/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();


/**
 * Implements a mapping from EPC Models to BPMN Models
 *
 *
 */
ORYX.Plugins.EPC2BPMN = Clazz.extend({

    facade: undefined,
    
	EPC_NAMESPACE: 'http://b3mn.org/stencilset/epc#',
	BPMN1_0_NAMESPACE: 'http://b3mn.org/stencilset/bpmn#',
	BPMN1_1_NAMESPACE: 'http://b3mn.org/stencilset/bpmn1.1#',
    
	
    // Offers the plugin functionality
    construct: function(facade){
		
        this.facade = facade;
        Facade = facade;
        
		this.isBPMN1_0 = this.facade.getStencilSets().keys().include(this.BPMN1_0_NAMESPACE);
		this.isBPMN1_1 = this.facade.getStencilSets().keys().include(this.BPMN1_1_NAMESPACE);
		
		if( !this.isBPMN1_0 && !this.isBPMN1_1){ return }
		
		this.facade.offer({
            'name': "EPC to BPMN transform",
            'functionality': this.startTransform.bind(this),
            'group': "epc",
            'icon': ORYX.PATH + "images/epc_export.png",
            'description': "Import from EPC",
            'index': 1,
            'minShape': 0,
            'maxShape': 0
        });
        
    },
    
    
    /**
     * Transforming from EPC to BPMN
     */
    startTransform: function(){
	
		this.showPanel( this.sendRequest.bind(this) );
	
	},
	
	/**
	 * Sends the Request out to the EPC-Model with the given url in the options
	 * 
	 * @param {Object} options
	 */
	sendRequest: function(options){

		var waitingpanel = new Ext.Window({id:'oryx-loading-panel_epc2bpmn',bodyStyle:'padding: 8px',title:'Oryx',width:230,height:55,modal:true,resizable:false,closable:false,frame:true,html:'<span style="font-size:11px;">Please wait while Oryx is importing...</span>'})
		waitingpanel.show()
		
		if( !options || !options.url ){ return }


		//this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_LOADING_ENABLE,text: 'Import' });
				
		var url = "./engineproxy?url=" + options.url;
				
        new Ajax.Request( url , {
            method: 'GET',
            onSuccess: function(request){
				
				// asynchronously ...
	            window.setTimeout((function(){
	         
			 		try{
						this.doTransform( request.responseText, options);
					} catch(e) {
						Ext.Msg.alert("Oryx","An Error is occured while importing!");
					}
					
					Ext.getCmp("oryx-loading-panel_epc2bpmn").close();

					// If autolayout is needed, it will be calles 'asychronly'
					if (options.autolayout) {
						window.setTimeout((function(){
							this.facade.raiseEvent({type: ORYX.CONFIG.EVENT_AUTOLAYOUT_LAYOUT});
						}).bind(this), 100);
					}
	            }).bind(this), 100);
		

			}.bind(this),
			onFailure: function(request){
				
				// Disable the loading panel
				this.facade.raiseEvent({ type: ORYX.CONFIG.EVENT_LOADING_DISABLE});	
				
				Ext.Msg.alert("Oryx", "Request to server failed!");
			
			}.bind(this)
        });
		   
    },
    
	/**
	 * 
	 * Does actually the Tranformation with an given ERDS-String and some advanced options
	 * 
	 * @param {Object} erdfString
	 * @param {Object} options
	 */
    doTransform: function( erdfString , options){

		var elements = this.parseToObject( erdfString );
		
		var shapes = [];
		
		if( !elements ){
			return 
		}
		var getEPCElementById = function(id){ return elements.find(function(el){ return el.id == id })}
		var deleteShape = function(thisEpc){
							var fShape = shapes.find(function(sh){ return sh.epc == thisEpc });
							if( fShape ){
								fShape.shape.parent.remove( fShape.shape );
								shapes = shapes.without( fShape )
							}
						}	
		var eventsMappingsThrow 	= options && options.events_throw ? options.events_throw.split(";").compact().without("").without(" ").collect(function(s){return s.toLowerCase()}) : [];
		var eventsMappingsCatch		= options && options.events_catch ? options.events_catch.split(";").compact().without("").without(" ").collect(function(s){return s.toLowerCase()}) : [];

		var isIncludedInMappingEventThrow	= function(s){ return eventsMappingsThrow.any(function(map){return map.split(" ").all(function(word){ return s.toLowerCase().include(word) })})}
		var isIncludedInMappingEventCatch	= function(s){ return eventsMappingsCatch.any(function(map){return map.split(" ").all(function(word){ return s.toLowerCase().include(word) })})}
		
		
		
		// ------------------------------------------
		// 1. Rule: Map - Function --> Task
		//
		
		// 
		var functions = elements.findAll(function(el){ return el.type.endsWith("Function")})
		functions.each(function(epc){
			// Create a new Task
			var shape = this.createElement("Task", epc, true);
			// Map Title -> Name
			shape.setProperty(	"oryx-name", 			epc.title);
			// Map Description -> Documentation
			shape.setProperty(	"oryx-documentation", 	epc.description);
			
			shapes.push({shape: shape, epc:epc})
		}.bind(this))
		
		
		// ------------------------------------------
		// 2. Rule: Events
		//
		
		// 			
		var events = elements.findAll(function(el){ return el.type.endsWith("Event")})
		
		// ------------------------------------------
		// 2a. Rule: Map - Events without an incoming edge --> StartEvent
		//
		
		// 
		var startevents	= events.findAll(function(ev){ return !elements.any(function(el){ return el.outgoing && el.outgoing.any(function(out){ return out.slice(1) == ev.id }) }) })
		startevents.each(function(epc){		
		
			// If its inculded in the mapping, set the type to StartMessageEvent, otherwise is it a StartEvent
			var startEventType = isIncludedInMappingEventCatch(epc.title) ? "StartMessageEvent" : "StartEvent";
			
			// Create a new Task
			var shape = this.createElement(startEventType, epc, true);
			// Map Title, Description -> Documentation
			if( startEventType == "StartMessageEvent"){
				shape.setProperty(	"oryx-message", epc.title );
			} else {
				shape.setProperty(	"oryx-documentation", epc.title + " - "+ epc.description);			
			}
			shapes.push({shape: shape, epc:epc})
		}.bind(this));		
		
		
		// ------------------------------------------
		// 2b. Rule: Map - Events without an outgoing edge --> EndEvent
		//
		
				
		// 		
		var endevents	= events.findAll(function(ev){ return !ev.outgoing })
		endevents.each(function(epc){

			// If its inculded in the mapping, set the type to StartMessageEvent, otherwise is it a StartEvent
			var endEventType = this.isBPMN1_1 && isIncludedInMappingEventThrow(epc.title) ? "MessageEndEvent" : "EndEvent";
			
			// Create a new Task
			var shape = this.createElement(endEventType, epc, true);
			
			//var fcTitle = deletePreviousFunction( epc )
			
			// Map Title, Description -> Documentation			
			if( endEventType == "MessageEndEvent"){
				shape.setProperty(	"oryx-message", epc.title );
			} else {
				shape.setProperty(	"oryx-documentation", epc.title + " - "+ epc.description);			
			}

			// Set the end event type of message
			if(  this.isBPMN1_0 && isIncludedInMappingEventThrow(epc.title)){
				shape.setProperty(	"oryx-result", "Message");
				shape.setProperty(	"oryx-message", epc.title );
			}
			shapes.push({shape: shape, epc:epc})
			
		}.bind(this));	


		// ------------------------------------------
		// extention Rule: Map - Events to Message Events which are defined in the advance settings
		//
		
		// 	
		var intermediateEvents		= [].without.apply(events, startevents.concat(endevents))
		intermediateEventsCatch		= intermediateEvents.findAll(function(epc){ return isIncludedInMappingEventCatch(epc.title)})
		intermediateEventsCatch.each(function(epc){
			var type = this.isBPMN1_1 ? "IntermediateMessageEventCatching" : "IntermediateMessageEvent";
			// Create a new Task
			var shape = this.createElement(type, epc, true);
			// Map Title -> Message
			shape.setProperty(	"oryx-message", epc.title );
			//shape.setProperty(	"oryx-message", epc.title + " - "+ epc.description);

			shapes.push({shape: shape, epc:epc})
			
		}.bind(this));
			

		intermediateFunctionsThrow		= functions.findAll(function(epc){ return isIncludedInMappingEventThrow(epc.title)})
		intermediateFunctionsThrow.each(function(epc){
			
			deleteShape( epc )
			
			var type = this.isBPMN1_1 ? "IntermediateMessageEventThrowing" : "IntermediateMessageEvent";
			
			var fEdge = epc.outgoing ? getEPCElementById( epc.outgoing[0].slice(1) ) : null;
			if( fEdge && fEdge.outgoing){
				var fEvent = getEPCElementById(fEdge.outgoing[0].slice(1));
				if(fEvent && fEvent.type.endsWith("Event") && !fEvent.outgoing && isIncludedInMappingEventThrow(fEvent.title)){
					deleteShape( fEvent );
					type = this.isBPMN1_1 ? "MessageEndEvent" : "EndEvent";
				}
			}
			
			// Create a new Task
			var shape = this.createElement(type, epc, true);
			
			// Map Title -> Message
			shape.setProperty(	"oryx-message", epc.title );
			//shape.setProperty(	"oryx-message", epc.title + " - "+ epc.description);
			
			if(  this.isBPMN1_0 && type == "EndEvent"){
				shape.setProperty(	"oryx-result", "Message");
			}
			
			shapes.push({shape: shape, epc:epc})
					
		}.bind(this));						
		// ------------------------------------------
		// 3. Rule: Map - Connector --> Gateway
		//
		
		// 	
		var connectors	= elements.findAll(function(el){ return el.type.endsWith("Connector") })
		connectors.each(function(epc){
			
			// Set the BPMN Type
			var type = "Exclusive_Databased_Gateway";
			if(epc.type.endsWith("AndConnector")){ 		type = "AND_Gateway"; } 
			else if(epc.type.endsWith("OrConnector")){ 	type = "OR_Gateway";  }
			
			if( type == "Exclusive_Databased_Gateway" && epc.outgoing && epc.outgoing.all(function(out){  return intermediateEventsCatch.include(getEPCElementById(getEPCElementById(out.slice(1)).outgoing[0].slice(1))) })){
				type = "Exclusive_Eventbased_Gateway";
			}
			// Create a new Task
			var shape = this.createElement(type, epc, true);

			shapes.push({shape: shape, epc:epc})
		}.bind(this))				


				
		// ------------------------------------------
		// 2c. Rule: Map - Events directly after an Split Connectors (except AND-Connector) --> Conditions on the Edges after the Gateway
		//
		
		// 	
		connectors.each(function(epc){
			if(epc.outgoing && epc.outgoing.length > 1 && !epc.type.endsWith("AndConnector")){

				epc.outgoing.each(function(out){
					var next = getEPCElementById(out.slice(1));
					// If its an edge
					if( next.type.endsWith("ControlFlow") && next.outgoing){
						
						next.outgoing.each(function(out2){
							var nextnext = getEPCElementById(out2.slice(1));
							if(nextnext.type.endsWith("Event")){
								next["expression"] = nextnext.title
							}
						})
						
					}					
				})
			}
		}.bind(this))	
		
				

		// ------------------------------------------
		// 5. Rule: Map - Data --> Data Object		
		//
		
		// 	
		var datas = elements.findAll(function(el){ return el.type.endsWith("Data")})
		datas.each(function(epc){
			// Create a new Task
			var shape = this.createElement("DataObject", epc, true);
			// Map Title -> Name
			shape.setProperty(	"oryx-name", 			epc.title);
			// Map Description -> Documentation
			shape.setProperty(	"oryx-documentation", 	epc.description);
			
			shapes.push({shape: shape, epc:epc})
		}.bind(this))


		// ------------------------------------------
		// 6. Rule: Map - System --> Annotation		
		//
		
		// 					
		var systems = elements.findAll(function(el){ return el.type.endsWith("System")})
		systems.each(function(epc){
			// Create a new Task
			var shape = this.createElement("TextAnnotation", epc, true);
			// Map Title -> Text
			shape.setProperty(	"oryx-text", "Used System: " + epc.title);
						
			shapes.push({shape: shape, epc:epc})
		}.bind(this))



		// ------------------------------------------
		// 7. Rule: Map - ProcessLink --> Sub-Process
		//
		
		// 
		var processlinks = elements.findAll(function(el){ return el.type.endsWith("ProcessInterface")})
		processlinks.each(function(epc){
			
			var type = this.isBPMN1_1 ? "collapsedSubprocess" : "Subprocess";
			// Create a new Task
			var shape = this.createElement(type, epc, true);
			// Map Title -> Name
			shape.setProperty(	"oryx-name", 			epc.title);
			// Map Description -> Documentation
			shape.setProperty(	"oryx-documentation", 	epc.description);
			// Map URL -> SubProcessRef
			shape.setProperty(	"raziel-entry",		 	epc.refuri);
			
			shapes.push({shape: shape, epc:epc})
		}.bind(this))		
	
		

		// ------------------------------------------
		// 4. Rule: Map - Organization/Position --> Pool
		//
		
		// 
		var organizations 		= options.organization ? elements.findAll(function(el){ return el.type.endsWith("Organization") || el.type.endsWith("Position")}) : [];
		var organizationNames 	= organizations.collect(function(epc){ return epc.title }).uniq().sort();
		organizations			= organizationNames.collect(function(name){ return organizations.findAll(function(epc){ return epc.title == name}) });
		
		if( organizations.length > 0 ){
			
			var pool 		= this.createElement("Pool");
			
			var lanes 		= [];
			var addedShapes	= [];
			
			organizations.each(function(epcs){
				// Create a new Task
				var lane = this.createElement("Lane");
				// Map Title -> Name
				lane.setProperty(	"oryx-name", epcs[0].title);
				pool.add( lane );
				lanes.push({shape: lane, epc:epcs[0]});
				
				epcs.each(function(epc){

					var prevFunctions = epc.outgoing ? epc.outgoing.collect(function(out){ return getEPCElementById(out.slice(1)).outgoing[0].slice(1) }) : [];
				
					var allRelatedFunctions = shapes.findAll(function(shape){ return shape.epc.type.endsWith("Function") || shape.epc.type.endsWith("ProcessInterface") })
					allRelatedFunctions = allRelatedFunctions.findAll(function(shape){ return  prevFunctions.include(shape.epc.id) || (shape.epc.outgoing && shape.epc.outgoing.any(function(out){ return getEPCElementById(out.slice(1)).outgoing.first().slice(1) == epc.id}))})
					
					allRelatedFunctions.each(function(shape){
						lane.add(shape.shape)
						addedShapes.push(shape)
					})
											
				});
			}.bind(this));	
			
			var notAddedShapes = [].without.apply(shapes, addedShapes);

			// Get all function which are not added to a pool yet
			var notAddedFunctions = notAddedShapes.findAll(function(shape){ return shape.epc.type.endsWith("Function")  || shape.epc.type.endsWith("ProcessInterface") });
			if( notAddedFunctions.length > 0 ){
				// Create a new empty pool
				var emptyLane	= this.createElement("Lane");
				pool.add( emptyLane );
				// Add all functions to this pool
				notAddedFunctions.each(function(shape){
					emptyLane.add( shape.shape )
					addedShapes.push(shape);				
				})			
			}

			var notAddedShapes = [].without.apply(shapes, addedShapes);			
			
			// Finds all shapes which are in the 'notAddedShapes'-Array 
			// but aren't in the 'addedShapes'-Array
			var findNextShapesWhichAreNotAdded = function(outgoings){
				
				if( !outgoings ){ return [] }
				
				var res = [];
				
				outgoings.each(function(out){
					// Find one following shape
					var sh = shapes.find(function(el){ return el.epc.id == out.slice(1) })
					
					if (sh) {
						// Lookup in the addedShapes array
						if (addedShapes.indexOf(sh) >= 0) {
							throw $break
						}
						
						if (notAddedShapes.indexOf(sh) >= 0) {
							res.push(sh)
						}
						
						res = res.concat( findNextShapesWhichAreNotAdded( sh.epc.outgoing ) )
					} else {
						res = res.concat( findNextShapesWhichAreNotAdded( getEPCElementById(out.slice(1)).outgoing ) );
					}
					
				});

				return res;
			}

			// Go thru all added shapes (mainly Functions) 
			// and find all following shapes which are not in the added shapes array
			// and add these to the same pool like this
			addedShapes.each(function(shape){
				var nextShapes = findNextShapesWhichAreNotAdded(shape.epc.outgoing)
				
				nextShapes.each(function(nextShape){
					shape.shape.parent.add( nextShape.shape )
					notAddedShapes = notAddedShapes.without( nextShape );	
				})
			});		


			var findNextShapeWhichIsAdded = function(outgoings){
				
				if( !outgoings ){ return [] }
				var res;
				
				outgoings.each(function(out){
					var sh = shapes.find(function(el){ return el.epc.id == out.slice(1) })
					
					if (sh) {
						// Lookup in the addedShapes array
						if (addedShapes.indexOf(sh) >= 0) {
							res = sh;
							throw $break
						}
						res = findNextShapeWhichIsAdded( sh.epc.outgoing );
					} else {
						res = findNextShapeWhichIsAdded( getEPCElementById(out.slice(1)).outgoing );
					}
					
				});

				return res;
			}			
			// For every shapes which couldn't be a following shape
			// (like a start event) add these to this following shape.
			notAddedShapes.each(function(shape){
				
				var nextShape = findNextShapeWhichIsAdded( shape.epc.outgoing );
				if( nextShape ){
					nextShape.shape.parent.add( shape.shape )
					addedShapes.push( shape );						
				}
			})
			
		
		}
		
					
		// --------------------------
		// Generate all Edges
		//
		
		// Function for finding the following shape which is already instanceiated
		var findFollowingShape = function(edge){
			if( !edge || !edge.outgoing){ return null }
			
			var nextElement = edge
			var nextShape;
			
			while(!nextShape){
				
				// Get the following shape
				nextElement = elements.find(function(el){ return nextElement.outgoing && nextElement.outgoing.any(function(out){ return out.slice(1) == el.id } )})
				// Look up if there is an instanciated shape
				nextShape 	= shapes.find(function(el){ return el.epc === nextElement })
				
				if( !nextElement || !nextElement.outgoing){
					break
				}
			}
			
			return nextShape
		}

		
		var edges = []
		// Push all edges to the array which come up in the available shapes		
		shapes.each(function(from){ 
			if(from.epc.outgoing){
				from.epc.outgoing.each(function(out){
					var edge = elements.find(function(epc){ return ( epc.type.endsWith("ControlFlow") || epc.type.endsWith("Relation") ) && epc.id == out.slice(1)}) 
					var next = findFollowingShape( edge );
					if( edge && next){				
						edges.push({
							from: 	from, 
							edge:	edge,
							to: 	next
						})
					}				
				})				
			}				
		})	
		
		// Create all the edges
		edges.each(function(edge){
			// Create a new Edge
			var shape
			if( edge.edge.type.endsWith("Relation") ) {
				if(edge.edge.informationflow.toLowerCase() == "true"){
					shape = this.createElement("Association_Unidirectional", edge.edge);				
				} else {
					shape = this.createElement("Association_Undirected", edge.edge);					
				}
			} else {
				shape = this.createElement("SequenceFlow", edge.edge);
			}
			
			var from 	= edge.from.shape;
			var to 		= edge.to.shape;
			// Set the docker
			shape.dockers.first().setDockedShape( from );
			shape.dockers.first().setReferencePoint({x: from.bounds.width() / 2.0, y: from.bounds.height() / 2.0});
			//shape.dockers.first().update()

			shape.dockers.last().setDockedShape( to );
			shape.dockers.last().setReferencePoint({x: to.bounds.width() / 2.0, y: to.bounds.height() / 2.0});
			//shape.dockers.last().update()
			
			// If there is an expression, it will be setted
			if( edge.edge.expression ){
				shape.setProperty("oryx-conditionexpression", edge.edge.expression)
			}
			
			shapes.push({shape: shape, epc:edge.edge})
		}.bind(this))		


		// --------------------------
		// UPDATE
		//		
		this.facade.getCanvas().update();
		
	},
	
	/**
	 * Creates a BPMN-Shape with the given type
	 * 
	 * @param {Object} bpmnType
	 * @param {Object} epcElement
	 * @param {Object} setBounds
	 */
	createElement: function(bpmnType, epcElement, setBounds, alternativeBPMNType){

		// Create a new Stencil		
		var ssn 	= this.facade.getStencilSets().keys()[0];						
		var stencil = ORYX.Core.StencilSet.stencil(ssn + bpmnType);
	
		if( !stencil && alternativeBPMNType ){
			stencil = ORYX.Core.StencilSet.stencil(ssn + alternativeBPMNType);
		}

		if( !stencil ){
			return null;
		}
			
		// Create a new Shape
		var newShape = (stencil.type() == "node") ?
										new ORYX.Core.Node(
											{'eventHandlerCallback':this.facade.raiseEvent },
											stencil) :
										new ORYX.Core.Edge(
											{'eventHandlerCallback':this.facade.raiseEvent },
											stencil);

		// Add the shape to the canvas
		this.facade.getCanvas().add(newShape);
		
		if( epcElement && epcElement.bounds && setBounds){
			// Set the bounds
			newShape.bounds.centerMoveTo( epcElement.bounds.center )
		}
		
		return newShape;
					
	},
	
	/**
	 * Parsed the given ERDF-String to a Array with the individual
	 * EPC-Objects
	 * 
	 * @param {Object} erdfString
	 */
	parseToObject: function ( erdfString ){

		var parser	= new DOMParser();			
		var doc		= parser.parseFromString( erdfString ,"text/xml");

		var getElementByIdFromDiv = function(id){ return $A(doc.getElementsByTagName('div')).find(function(el){return el.getAttribute("id")== id})}

		// Get the oryx-editor div
		var editorNode 	= getElementByIdFromDiv('oryxcanvas');
		editorNode 		= editorNode ? editorNode : getElementByIdFromDiv('oryx-canvas123');

		var hasEPC = editorNode ? $A(editorNode.childNodes).any(function(node){return node.nodeName.toLowerCase() == "a" && node.getAttribute('rel') == 'oryx-stencilset' && node.getAttribute('href').endsWith('epc/epc.json')}) : null;

		if( !hasEPC ){
			this.throwErrorMessage('Imported model is not an EPC model!');
			return null
		}


		// Get all ids from the canvas node for rendering
		var renderNodes = $A(editorNode.childNodes).collect(function(el){ return el.nodeName.toLowerCase() == "a" && el.getAttribute('rel') == 'oryx-render' ? el.getAttribute('href').slice(1) : null}).compact()
		// Collect all nodes from the ids
		renderNodes = renderNodes.collect(function(el){return getElementByIdFromDiv(el)});

		// Function for extract all eRDF-Attributes and give them back as an Object
		var parseAttribute = function(node){
		    var res = {}
			// Set the resource id
			if(node.getAttribute("id")){
				res["id"] = node.getAttribute("id");
			}
			
			// Set all attributes
		    $A(node.childNodes).each( function(node){ 
				if( node.nodeName.toLowerCase() == "span" && node.getAttribute('class')){
		            var key = node.getAttribute('class').slice(5);
					res[key] = node.firstChild ? node.firstChild.nodeValue : '';
		        	if( key == "bounds" ){
						var ba = $A(res[key].split(",")).collect(function(el){return Number(el)})
						res[key] = {a:{x:ba[0], y:ba[1]},b:{x:ba[2], y:ba[3]},center:{x:ba[0]+((ba[2]-ba[0])/2),y:ba[1]+((ba[3]-ba[1])/2)}}
					}
				} else if( node.nodeName.toLowerCase() == "a" && node.getAttribute('rel')){
		            var key = node.getAttribute('rel').split("-")[1];
					if( !res[key] ){
						res[key] = [];
					}
					
		            res[key].push( node.getAttribute('href') )
		        }
		    })
		    return res
		}

		// Collect all Attributes out of the Nodes
		return renderNodes.collect(function(el){return parseAttribute(el)});
				
	},
	
	/**
	 * 
	 * @param {Object} message
	 */
	throwErrorMessage: function(message){
		Ext.Msg.alert( 'Oryx', message )
	},
	
	/** ********************************************************
	 * 
	 * UI-WINDOW
	 * 
	 * ********************************************************
	 * 
	 * Shows the Popup Window where u can specify the url
	 * and some advanced parameter
	 * 
	 * @param {Object} callback
	 */
	showPanel: function( callback ){
			
		Ext.QuickTips.init();
		
		var mainForm = new Ext.form.FormPanel({
						id:				'transform-epc-bpmn-id-main',
					    labelWidth: 	40,
					    defaultType: 	'textfield',
					    bodyStyle:		'padding:5px',
					    defaults: 		{width: 300, msgTarget: 'side'},
					    items: [{
								text:'For the import and transformation from EPC to BPMN please set the URL to the EPC model.', 
								xtype:'label',
								style:'padding-bottom:10px;display:block',
								width:"100%"
							},{
								fieldLabel: 'URL',
								name: 		'last',
								//vtype: 		'url',
								allowBlank: false
							}]
					});
		
		
		var advanceForm = new Ext.form.FormPanel({
					    id:				'transform-epc-bpmn-id-advance',
					    collapsed:		true,
					    labelWidth: 	30,
					    defaultType: 	'textfield',
					    bodyStyle:		'padding:15px',
						defaults:		{width: 300,msgTarget: 'side',labelSeparator:''},
					    items: [{
								text:	'Event-Mapping',
								xtype: 	'label',
								cls:	'transform-epc-bpmn-title'
					        },{
								text:	'If u like to transform indivual event from EPC to event in BPMN, please give keyword regarding to these (separated with a \';\').',
								xtype: 	'label',
								width:	'100%',
								style:	'margin-bottom:10px;display:block;'
					        },{
								labelStyle: 'background:transparent url(stencilsets/bpmn/icons/intermediate-message.png) no-repeat scroll 0px -1px;width:30px;height:20px',
					            name: 	'events_catch'
					        },{
								labelStyle: !this.isBPMN1_0 ? 'background:transparent url(stencilsets/bpmn/icons/intermediate-message.png) no-repeat scroll 0px -30px;width:30px;height:20px' : 'display:none',
					            name: 	'events_throw',
								style:	this.isBPMN1_0 ? "display:none;" : ""
					        },{
								text:	'Organization',
								xtype: 	'label',
								style:	'margin-top:10px;display:block;',
								cls:	'transform-epc-bpmn-title'
					        },{
								text:	'Should the organizational units and roles maped to a pool/lane? (Required Auto-Layout)',
								xtype: 	'label',
								width:	'100%',
								style:	'margin-bottom:10px;display:block;'
					        },{
								boxLabel: 'Organization',
								name: 	'autolayout',
								id:		'transform-epc-bpmn-id-organization',
								xtype:	'checkbox',
								labelStyle:	'width:30px;height:20px'
					        },{
								text:	'Auto-Layout',
								xtype: 	'label',
								style:	'margin-top:10px;display:block;',
								cls:	'transform-epc-bpmn-title'
					        },{
								text:	'By enable the autolayout, the model will be auto layouted afterwards with the AutoLayout Plugin. (Needs a while)',
								xtype: 	'label',
								width:	'100%',
								style:	'margin-bottom:10px;display:block;'
					        },{
								boxLabel: 'Auto-Layout',
								name: 	'autolayout',
								id:		'transform-epc-bpmn-id-autolayout',
								xtype:	'checkbox',
								labelStyle:	'width:30px;height:20px'
					        }]
					});

		Ext.getCmp('transform-epc-bpmn-id-organization').on('check', function(obj, check){
			if(check){
				Ext.getCmp('transform-epc-bpmn-id-autolayout').setValue( true );
				Ext.getCmp('transform-epc-bpmn-id-autolayout').disable();
			} else {
				Ext.getCmp('transform-epc-bpmn-id-autolayout').enable();
			}
		})
		
		
		var groupButton = {
			            text:			'Advanced Settings',
			            xtype:			'button',
			            enableToggle:	true,
						cls:			'transform-epc-bpmn-group-button',
			            handler:function(d){
			                var d = Ext.getCmp('transform-epc-bpmn-id-advance');
			                if(d.collapsed){
			                    d.expand();
			                } else {
			                    d.collapse();
			                }
			            }
			        }
					
		
		var windowPanel = new Ext.Window({
					    title:			"Oryx - Transform EPC to BPMN",
					    width:			400,
						id:				'transform-epc-bpmn-id-panel',
						cls:			'transform-epc-bpmn-window',
					    items: 			new Ext.Panel({frame:true,autoHeight:true,items:[mainForm, groupButton , advanceForm]}),
						floating:		true,
						shim:			true,
						modal:			true,
						resizable:		false,
						autoHeight:		true,			    
						buttons:[{
								text:	'Import',
								handler: function(){
									var res = {};
									
									var urlField = Ext.getCmp('transform-epc-bpmn-id-main').findByType('textfield')[0]
									
									if( urlField.validate() ){
										res.url 			= urlField.getValue();
									}
									
									if( !Ext.getCmp('transform-epc-bpmn-id-advance').collapsed ){
										res.events_catch	= Ext.getCmp('transform-epc-bpmn-id-advance').findByType('textfield')[0].getValue();
										if( this.isBPMN1_1 ){
											res.events_throw = Ext.getCmp('transform-epc-bpmn-id-advance').findByType('textfield')[1].getValue();
										}
										res.organization	= Ext.getCmp('transform-epc-bpmn-id-advance').findByType('checkbox')[0].getValue();
										res.autolayout 		= Ext.getCmp('transform-epc-bpmn-id-advance').findByType('checkbox')[1].getValue();
									}
									
									Ext.getCmp('transform-epc-bpmn-id-panel').close();
								
									callback( res );
								}.bind(this)
							},{
								text:	'Cancel',
								handler: function(){
									Ext.getCmp('transform-epc-bpmn-id-panel').close();
								}
							}]  
					})
						
		windowPanel.show()		
	}
	
});


var Facade = undefined;
/**
 * Copyright (c) 2008
 * Stefan Krumnow
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Supports EPCs by offering a syntax check and export and import ability..
 * 
 * 
 */
ORYX.Plugins.EPCSupport = Clazz.extend({

	facade: undefined,

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		this.facade = facade;
		
		this.facade.offer({
			'name':ORYX.I18N.EPCSupport.exp,
			'functionality': this.exportEPC.bind(this),
			'group': ORYX.I18N.EPCSupport.group,
			'icon': ORYX.PATH + "images/epml_export_icon.png",
			'description': ORYX.I18N.EPCSupport.expDesc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0});
			
		this.facade.offer({
			'name':ORYX.I18N.EPCSupport.imp,
			'functionality': this.importEPC.bind(this),
			'group': ORYX.I18N.EPCSupport.group,
			'icon': ORYX.PATH + "images/epml_import_icon.png",
			'description': ORYX.I18N.EPCSupport.impDesc,
			'index': 2,
			'minShape': 0,
			'maxShape': 0});
	
	},

	
	/**
	 * Imports an AML or EPML description
	 */
	importEPC: function(){
		this.openUploadDialog();
	},		

	
	/**
	 * Exports the diagram into an AML or EPML file
	 */
	exportEPC: function(){

		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE, text:ORYX.I18N.EPCSupport.progressExp});
		var xmlSerializer = new XMLSerializer();

		
		// TODO: a Syntax Syntax-Check should be triggered, here.
		 
		// TODO: get process' name
		var resource = "Oryx-EPC";
		
		// Force to set all resource IDs
		var serializedDOM = DataManager.serializeDOM( this.facade );

		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'<div id="generatedProcessInfos"><span class="oryx-id">' + resource + '</span>' + 
		'<span class="oryx-name">' + resource + '</span></div>' +
		'</body></html>';
		
		/*
		 * Transform eRDF -> RDF
		 */
		var erdf2rdfXslt = ORYX.PATH + "/lib/extract-rdf.xsl";

		var rdfResultString;
		rdfResult = this.transformString(serializedDOM, erdf2rdfXslt, true);
		if (rdfResult instanceof String) {
			rdfResultString = rdfResult;
			rdfResult = null;
		} else {
			rdfResultString = xmlSerializer.serializeToString(rdfResult);
			if (!rdfResultString.startsWith("<?xml")) {
				rdfResultString = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + rdfResultString;
			}
		}
		
		/*
		 * Transform RDF -> EPML
		 */
		var rdf2epmlXslt = ORYX.PATH + "/xslt/RDF2EPML.xslt";
		
		var epmlResult = this.transformDOM(rdfResult, rdf2epmlXslt, true);
		var epmlResultString;
		if (epmlResult instanceof String) {
			epmlResultString = epmlResult;
			epmlResult = null;
		} else {
			epmlResultString = xmlSerializer.serializeToString(epmlResult);
			if (!epmlResultString.startsWith("<?xml")) {
				epmlResultString = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + epmlResultString;
			}
		}
		
		this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
		
		// At the moment, only EPML is going to be returned.
		this.openDownloadWindow(resource + ".epml", epmlResultString);
    },
	
	/**
	 * Transforms the given string via xslt.
	 * 
	 * @param {String} string
	 * @param {String} xsltPath
	 * @param {Boolean} getDOM
	 */
	transformString: function(string_, xsltPath, getDOM){
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(string_,"text/xml");	
		
		return this.transformDOM(parsedDOM, xsltPath, getDOM);
	},
	
	/**
	 * Transforms the given dom via xslt.
	 * 
	 * @param {Object} domContent
	 * @param {String} xsltPath
	 * @param {Boolean} getDOM
	 */
	transformDOM: function(domContent, xsltPath, getDOM){	
		if (domContent == null) {
			return new String("Parse Error: \nThe given dom content is null.");
		}
		var result;
		var resultString;
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		
		xsltProcessor.importStylesheet(xslRef);
		try {
			result = xsltProcessor.transformToDocument(domContent);
		} catch (error){
			return new String("Parse Error: "+error.name + "\n" + error.message);
		}
		if (getDOM){
			return result;
		}
		resultString = (new XMLSerializer()).serializeToString(result);
		return resultString;
	},

	/**
	 * Opens a upload dialog.
	 * 
	 */
	openUploadDialog: function(){
		
		var form = new Ext.form.FormPanel({
			frame : 		true,
			bodyStyle:		'padding:5px;',
			defaultType : 	'textfield',
		  	labelAlign : 	'left',
		  	buttonAlign: 	'right',
		  	fileUpload : 	true,
		  	enctype : 		'multipart/form-data',
		  	items : [
		  	{
		    	text : 		ORYX.I18N.EPCSupport.selectFile, 
				style : 	'font-size:12px;margin-bottom:10px;display:block;',
				xtype : 	'label'
		  	},{
		    	fieldLabel : 	ORYX.I18N.EPCSupport.file,
		    	inputType : 	'file',
				labelStyle :	'width:50px;',
				itemCls :		'ext_specific_window_overflow'
		  	}]
		});


		var dialog = new Ext.Window({ 
			autoCreate: true, 
			title: 		ORYX.I18N.EPCSupport.impPanel, 
			height: 	'auto', 
			width: 		'auto', 
			modal:		true,
			collapsible:false,
			fixedcenter:true, 
			shadow:		true, 
			proxyDrag: 	true,
			resizable:	false,
			items: [form],
			buttons:[
				{
					text:ORYX.I18N.EPCSupport.impBtn,
					handler: function(){
						
							
						var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:ORYX.I18N.EPCSupport.progressImp});
						loadMask.show();
												
						form.form.submit({
				      		url: ORYX.PATH + '/epc-upload',
				      		success: function(f,a){
								
								dialog.hide();
								
								// Get the erdf string					
								var erdf = a.result;
								erdf = erdf.startsWith('<?xml') ? erdf : '<?xml version="1.0" encoding="utf-8"?><div>'+erdf+'</div>';	
								// Load the content to the editor
								this.loadContent(erdf);
								// Hide the waiting panel
								loadMask.hide();
								
				      		}.bind(this),
							failure: function(f,a){
								dialog.hide();
								loadMask.hide();
								Ext.MessageBox.show({
		           					title: ORYX.I18N.EPCSupport.error,
		          	 				msg: a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9, a.response.responseText.indexOf("'}")),
		           					buttons: Ext.MessageBox.OK,
		           					icon: Ext.MessageBox.ERROR
		       					});
				      		}
				  		});
					}.bind(this)
				},{
					text:ORYX.I18N.EPCSupport.close,
					handler:function(){
						dialog.hide();
					}.bind(this)
				}
			]
		});

		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});
		dialog.show();
	},
	
	/**
	 * Creates a hidden form element to communicate parameter values
	 * to a php file.
	 * 
	 * @param {Object} name  The name of the hidden field
	 * @param {Object} value The value of the hidden field
	 */
	createHiddenElement: function(name, value) {
		var newElement = document.createElement("input");
		newElement.name=name;
		newElement.type="hidden";
		newElement.value = value;
		return newElement
	},
	
	/**
	 * Returns the file name to the given result-entry.
	 * 
	 * @param {String} entry.
	 */
	getFileName: function(entry) {
		var l = entry.length;
		if (l > 5){
			if (entry.substr(l-5, 5) == "(AML)"){
				return entry.substr(0, l-6);
			}
		}
		return entry
	},
	
	/**
	 * Opens a download window for downloading the given content.
	 * 
	 * Creates a submit form to communicate the contents to the 
	 * download.php file.
	 * 
	 * @param {Object} content The content to be downloaded. If it is a zip 
	 *                         file, then this should be an array of contents.
	 * @param {Object} zip     True, if it is a zip file, false otherwise
	 */
	openDownloadWindow: function(file, content) {
		var win = window.open("");
		if (win != null) {
			win.document.open();
			win.document.write("<html><body>");
			var submitForm = win.document.createElement("form");
			win.document.body.appendChild(submitForm);
			
			var file = this.getFileName(file);
			submitForm.appendChild( this.createHiddenElement("download", content));
			submitForm.appendChild( this.createHiddenElement("file", file));
			
			
			submitForm.method = "POST";
			win.document.write("</body></html>");
			win.document.close();
			submitForm.action= ORYX.PATH + "/download";
			submitForm.submit();
		}		
	},
	
	
	/**
	 * Loads the imported string into the oryx
	 * 
	 * @param {Object} content
	 */
	loadContent: function( content ){
		
		var parser	= new DOMParser();			
		var doc 	= parser.parseFromString( content ,"text/xml");
		
		this.facade.importERDF( doc );
		
	}
	
});/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Supports EPCs by offering a syntax check and export and import ability..
 * 
 * 
 */
ORYX.Plugins.ERDFSupport = Clazz.extend({

	facade: undefined,
	
	ERDFServletURL: '/erdfsupport',

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		
		this.facade = facade;
			
			
		this.facade.offer({
			'name':				ORYX.I18N.ERDFSupport.exp,
			'functionality': 	this.exportERDF.bind(this),
			'group': 			ORYX.I18N.ERDFSupport.group,
			'icon': 			ORYX.PATH + "images/erdf_export_icon.png",
			'description': 		ORYX.I18N.ERDFSupport.expDesc,
			'index': 			0,
			'minShape': 		0,
			'maxShape': 		0
		});
					
		this.facade.offer({
			'name':				ORYX.I18N.ERDFSupport.imp,
			'functionality': 	this.importERDF.bind(this),
			'group': 			ORYX.I18N.ERDFSupport.group,
			'icon': 			ORYX.PATH + "images/erdf_import_icon.png",
			'description': 		ORYX.I18N.ERDFSupport.impDesc,
			'index': 			1,
			'minShape': 		0,
			'maxShape': 		0
		});

	},

	
	/**
	 * Imports an AML description
	 * 
	 */
	importERDF: function(){
		this._showImportDialog();
	},		

	
	/**
	 * Imports an AML description
	 * 
	 */
	exportERDF: function(){
		
		var s 	= this.facade.getERDF();
		
		//this.openXMLWindow( s );
		this.openDownloadWindow(window.document.title + ".xml", s);
	},	

	
	
	/**
	 * 
	 * 
	 * @param {Object} url
	 * @param {Object} params
	 * @param {Object} successcallback
	 */
	sendRequest: function( url, params, successcallback, failedcallback ){

		var suc = false;

		new Ajax.Request(url, {
            method			: 'POST',
            asynchronous	: false,
            parameters		: params,
			onSuccess		: function(transport) {
				
				suc = true;
				
				if(successcallback){
					successcallback( transport.result )	
				}
				
			}.bind(this),
			
			onFailure		: function(transport) {

				if(failedcallback){
					
					failedcallback();
					
				} else {
					Ext.Msg.alert("Oryx", ORYX.I18N.ERDFSupport.impFailed);
					ORYX.log.warn("Import ERDF failed: " + transport.responseText);	
				}
				
			}.bind(this)		
		});
		
		
		return suc;
							
	},


	loadERDF: function( erdfString, success, failed ){
		
		var s 	= erdfString;
		s 		= s.startsWith('<?xml') ? s : '<?xml version="1.0" encoding="utf-8"?>'+s+'';	
						
		var parser	= new DOMParser();			
		var doc 	=  parser.parseFromString( s ,"text/xml");
							
		if( doc.firstChild.tagName == "parsererror" ){

			Ext.MessageBox.show({
					title: 		ORYX.I18N.ERDFSupport.error,
 					msg: 		ORYX.I18N.ERDFSupport.impFailed2 + doc.firstChild.textContent.escapeHTML(),
					buttons: 	Ext.MessageBox.OK,
					icon: 		Ext.MessageBox.ERROR
				});
																
			if(failed)
				failed();
				
		} else if( !this.hasStencilSet(doc) ){
			
			if(failed)
				failed();		
		
		} else {
			
			this.facade.importERDF( doc );
			
			if(success)
				success();
		
		}
	},

	hasStencilSet: function( doc ){
		
		var getElementsByClassNameFromDiv 	= function(doc, id){ return $A(doc.getElementsByTagName('div')).findAll(function(el){ return $A(el.attributes).any(function(attr){ return attr.nodeName == 'class' && attr.nodeValue == id }) })	}

		// Get Canvas Node
		var editorNode 		= getElementsByClassNameFromDiv( doc, '-oryx-canvas')[0];
		
		if( !editorNode ){
			this.throwWarning(ORYX.I18N.ERDFSupport.noCanvas);
			return false
		}
		
		var stencilSetNode 	= $A(editorNode.getElementsByTagName('a')).find(function(node){ return node.getAttribute('rel') == 'oryx-stencilset'});

		if( !stencilSetNode ){
			this.throwWarning(ORYX.I18N.ERDFSupport.noSS);
			return false
		}
		
		var stencilSetUrl	= stencilSetNode.getAttribute('href').split("/")
		stencilSetUrl		= stencilSetUrl[stencilSetUrl.length-2] + "/" + stencilSetUrl[stencilSetUrl.length-1];
		
		var isLoaded = this.facade.getStencilSets().values().any(function(ss){ return ss.source().endsWith( stencilSetUrl ) })
		if( !isLoaded ){
			this.throwWarning(ORYX.I18N.ERDFSupport.wrongSS);
			return false
		}
				
		return true;
	},
	
	throwWarning: function( text ){
		Ext.MessageBox.show({
					title: 		'Oryx',
 					msg: 		text,
					buttons: 	Ext.MessageBox.OK,
					icon: 		Ext.MessageBox.WARNING
				});
	},
	
	/**
	 * Opens a new window that shows the given XML content.
	 * 
	 * @param {Object} content The XML content to be shown.
	 */
	openXMLWindow: function(content) {
		var win = window.open(
		   'data:application/xml,' + encodeURIComponent(
		     content
		   ),
		   '_blank', "resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes"
		);
	},
	
	/**
	 * Opens a download window for downloading the given content.
	 * 
	 */
	openDownloadWindow: function(file, content) {
		var win = window.open("");
		if (win != null) {
			win.document.open();
			win.document.write("<html><body>");
			var submitForm = win.document.createElement("form");
			win.document.body.appendChild(submitForm);
			
			submitForm.appendChild( this.createHiddenElement("download", content));
			submitForm.appendChild( this.createHiddenElement("file", file));
			
			
			submitForm.method = "POST";
			win.document.write("</body></html>");
			win.document.close();
			submitForm.action= ORYX.PATH + "/download";
			submitForm.submit();
		}		
	},
	
	/**
	 * Creates a hidden form element to communicate parameter values.
	 * 
	 * @param {Object} name  The name of the hidden field
	 * @param {Object} value The value of the hidden field
	 */
	createHiddenElement: function(name, value) {
		var newElement = document.createElement("input");
		newElement.name=name;
		newElement.type="hidden";
		newElement.value = value;
		return newElement
	},

	/**
	 * Opens a upload dialog.
	 * 
	 */
	_showImportDialog: function( successCallback ){
	
	    var form = new Ext.form.FormPanel({
			baseCls: 		'x-plain',
	        labelWidth: 	50,
	        defaultType: 	'textfield',
	        items: [{
	            text : 		ORYX.I18N.ERDFSupport.selectFile, 
				style : 	'font-size:12px;margin-bottom:10px;display:block;',
	            anchor:		'100%',
				xtype : 	'label' 
	        },{
	            fieldLabel: ORYX.I18N.ERDFSupport.file,
	            name: 		'subject',
				inputType : 'file',
				style : 	'margin-bottom:10px;display:block;',
				itemCls :	'ext_specific_window_overflow'
	        }, {
	            xtype: 'textarea',
	            hideLabel: true,
	            name: 'msg',
	            anchor: '100% -63'  
	        }]
	    });



		// Create the panel
		var dialog = new Ext.Window({ 
			autoCreate: true, 
			layout: 	'fit',
			plain:		true,
			bodyStyle: 	'padding:5px;',
			title: 		ORYX.I18N.ERDFSupport.impERDF, 
			height: 	350, 
			width:		500,
			modal:		true,
			fixedcenter:true, 
			shadow:		true, 
			proxyDrag: 	true,
			resizable:	true,
			items: 		[form],
			buttons:[
				{
					text:ORYX.I18N.ERDFSupport.impBtn,
					handler:function(){
						
						var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:ORYX.I18N.ERDFSupport.impProgress});
						loadMask.show();
						
						window.setTimeout(function(){
					
							
							var erdfString =  form.items.items[2].getValue();
							this.loadERDF(erdfString, function(){loadMask.hide();dialog.hide()}.bind(this), function(){loadMask.hide();}.bind(this))
														
														
							
						}.bind(this), 100);
			
					}.bind(this)
				},{
					text:ORYX.I18N.ERDFSupport.close,
					handler:function(){
						
						dialog.hide();
					
					}.bind(this)
				}
			]
		});
		
		// Destroy the panel when hiding
		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});


		// Show the panel
		dialog.show();
		
				
		// Adds the change event handler to 
		form.items.items[1].getEl().dom.addEventListener('change',function(evt){
				var text = evt.target.files[0].getAsText('UTF-8');
				form.items.items[2].setValue( text );
			}, true)

	}
	
});/**
				   'style="border:none;display:block;width:575px;height:460px;"/>' +
				   '\n\n<pre style="display:inline;">Version: </pre>' + 
				   '<iframe src="' + ORYX.CONFIG.VERSION_URL + '" type="text/plain" ' + 
				   'style="border:none;overflow:hidden;display:inline;width:40px;height:20px;"/>';
/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Supports EPCs by offering a syntax check and export and import ability..
 * 
 * 
 */
ORYX.Plugins.IBPMN2BPMN = Clazz.extend({

	facade: undefined,
	
	TransformServletURL: './ibpmn2bpmn',

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {
		
		this.facade = facade;
			
			
		this.facade.offer({
			'name':				"Transform from iBPMN to BPMN",
			'functionality': 	this.transform.bind(this),
			'group': 			"Transform",
			'icon': 			ORYX.PATH + "images/erdf_export_icon.png",
			'description': 		"Transformation from iBPMN to BPMN",
			'index': 			0,
			'minShape': 		0,
			'maxShape': 		0
		});


	},

	
	/**
	 * Imports an AML description
	 * 
	 */
	transform: function(){
		this._showImportDialog();
	},		

	
	
	/**
	 * 
	 * 
	 * @param {Object} url
	 * @param {Object} params
	 * @param {Object} successcallback
	 */
	sendRequest: function( url, params, successcallback, failedcallback ){

		var suc = false;

		new Ajax.Request(url, {
            method			: 'POST',
            asynchronous	: false,
            parameters		: params,
			onSuccess		: function(transport) {
				
				suc = true;
				
				if(successcallback){
					successcallback( transport.responseText )	
				}
				
			}.bind(this),
			
			onFailure		: function(transport) {

				if(failedcallback){
					
					failedcallback( );
					
				} else {
					Ext.Msg.alert("Oryx", ORYX.I18N.ERDFSupport.impFailed);
					ORYX.log.warn("Transform failed: " + transport.responseText);	
				}
				
			}.bind(this)		
		});
		
		
		return suc;
							
	},


	transformToBPMN: function( rdfString, success, failed ){
		
		var s 	= rdfString;
		s 		= s.startsWith('<?xml') ? s : '<?xml version="1.0" encoding="utf-8"?>'+s+'';	
						
		var parser	= new DOMParser();			
		var doc 	=  parser.parseFromString( s ,"text/xml");
							
		if( doc.firstChild.tagName == "parsererror" ){

			Ext.MessageBox.show({
					title: 		"Parse Error",
 					msg: 		"The given RDF is not xml valid.",
					buttons: 	Ext.MessageBox.OK,
					icon: 		Ext.MessageBox.ERROR
				});
																
			if(failed)
				failed();
				
		} else {
			
			/**
			 * SUCCESSCALLBACK for positive return while transformation
			 * 
			 */
			var transformSuccessCallback = function( e ){
				
				e = '<?xml version="1.0" encoding="utf-8"?><div>'+e+'</div>';

				var parser	= new DOMParser();			
				var doc 	=  parser.parseFromString( e ,"text/xml");
				
				this.facade.importERDF( doc );
				
			}.bind(this);
			

			var parser = new DOMParser();
			var parsedDOM = parser.parseFromString(s, "text/xml");
			var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
			var xsltProcessor = new XSLTProcessor();
			var xslRef = document.implementation.createDocument("", "", null);
			xslRef.async = false;
			xslRef.load(xsltPath);
			xsltProcessor.importStylesheet(xslRef);
			try {
				var rdf = xsltProcessor.transformToDocument(parsedDOM);
				var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
				if (!serialized_rdf.startsWith("<?xml")) {
					serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
				}
						
				// Send request
				this.sendRequest( this.TransformServletURL, {data:serialized_rdf}, transformSuccessCallback)
			
			}catch(e){}
		
			if(success)
				success();
		
		}
	},

	

	/**
	 * Opens a upload dialog.
	 * 
	 */
	_showImportDialog: function( successCallback ){
	
	    var form = new Ext.form.FormPanel({
			baseCls: 		'x-plain',
	        labelWidth: 	50,
	        defaultType: 	'textfield',
	        items: [{
	            text : 		ORYX.I18N.ERDFSupport.selectFile, 
				style : 	'font-size:12px;margin-bottom:10px;display:block;',
	            anchor:		'100%',
				xtype : 	'label' 
	        },{
	            fieldLabel: ORYX.I18N.ERDFSupport.file,
	            name: 		'subject',
				inputType : 'file',
				style : 	'margin-bottom:10px;display:block;',
				itemCls :	'ext_specific_window_overflow'
	        }, {
	            xtype: 'textarea',
	            hideLabel: true,
	            name: 'msg',
	            anchor: '100% -63'  
	        }]
	    });



		// Create the panel
		var dialog = new Ext.Window({ 
			autoCreate: true, 
			layout: 	'fit',
			plain:		true,
			bodyStyle: 	'padding:5px;',
			title: 		ORYX.I18N.ERDFSupport.impERDF, 
			height: 	350, 
			width:		500,
			modal:		true,
			fixedcenter:true, 
			shadow:		true, 
			proxyDrag: 	true,
			resizable:	true,
			items: 		[form],
			buttons:[
				{
					text:ORYX.I18N.ERDFSupport.impBtn,
					handler:function(){
						
						var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:ORYX.I18N.ERDFSupport.impProgress});
						loadMask.show();
						
						window.setTimeout(function(){
					
							
							var rdfString =  form.items.items[2].getValue();
							this.transformToBPMN(rdfString, function(){loadMask.hide();dialog.hide()}.bind(this), function(){loadMask.hide();}.bind(this))
														
														
							
						}.bind(this), 100);
			
					}.bind(this)
				},{
					text:ORYX.I18N.ERDFSupport.close,
					handler:function(){
						
						dialog.hide();
					
					}.bind(this)
				}
			]
		});
		
		// Destroy the panel when hiding
		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});


		// Show the panel
		dialog.show();
		
				
		// Adds the change event handler to 
		form.items.items[1].getEl().dom.addEventListener('change',function(evt){
				var text = evt.target.files[0].getAsBinary();
				form.items.items[2].setValue( text );
			}, true)

	}
	
});
	}
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * HOW to USE the OVERLAY PLUGIN:
 * 	You can use it via the event mechanism from the editor
 * 	by using facade.raiseEvent( <option> )
 * 
 * 	As an example please have a look in the overlayexample.js
 * 
 * 	The option object should/have to have following attributes:
 * 
 * 	Key				Value-Type							Description
 * 	================================================================
 * 
 *	type 			ORYX.CONFIG.EVENT_OVERLAY_SHOW | ORYX.CONFIG.EVENT_OVERLAY_HIDE		This is the type of the event	
 *	id				<String>							You have to use an unified id for later on hiding this overlay
 *	shapes 			<ORYX.Core.Shape[]>					The Shapes where the attributes should be changed
 *	attributes 		<Object>							An object with svg-style attributes as key-value pair
 *	node			<SVGElement>						An SVG-Element could be specified for adding this to the Shape
 *	nodePosition	"N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW"|"START"|"END"	The position for the SVG-Element relative to the 
 *														specified Shape. "START" and "END" are just using for a Edges, then
 *														the relation is the start or ending Docker of this edge.
 *	
 * 
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.Overlay = Clazz.extend({

    facade: undefined,
	
	styleNode: undefined,
    
    construct: function(facade){
		
        this.facade = facade;

		this.changes = [];

		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_SHOW, this.show.bind(this));
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_HIDE, this.hide.bind(this));	

		this.styleNode = document.createElement('style')
		this.styleNode.setAttributeNS(null, 'type', 'text/css')
		
		document.getElementsByTagName('head')[0].appendChild( this.styleNode )

    },
	
	/**
	 * Show the overlay for specific nodes
	 * @param {Object} options
	 * 
	 * 	String				options.id		- MUST - Define the id of the overlay (is needed for the hiding of this overlay)		
	 *	ORYX.Core.Shape[] 	options.shapes 	- MUST - Define the Shapes for the changes
	 * 	attr-name:value		options.changes	- Defines all the changes which should be shown
	 * 
	 * 
	 */
	show: function( options ){
		
		// Checks if all arguments are available
		if( 	!options || 
				!options.shapes || !options.shapes instanceof Array ||
				!options.id	|| !options.id instanceof String || options.id.length == 0) { 
				
					return
					
		}
		
		//if( this.changes[options.id]){
		//	this.hide( options )
		//}
			

		// Checked if attributes are setted
		if( options.attributes ){
			
			// FOR EACH - Shape
			options.shapes.each(function(el){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				this.setAttributes( el.node , options.attributes )
				
			}.bind(this))

		}	
		
		// Checks if node is setted and if this is an SVGElement		
		if ( options.node && options.node instanceof SVGElement) {
			
			options["_temps"] = []
						
			// FOR EACH - Node
			options.shapes.each(function(el, index){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				var _temp = {}
				_temp.svg = options.dontCloneNode ? options.node : options.node.cloneNode( true );
				
				// Add the svg node to the ORYX-Shape
				el.node.firstChild.appendChild( _temp.svg )		
				
				// If
				if (el instanceof ORYX.Core.Edge && !options.nodePosition) {
					options['nodePosition'] = "START"
				}
						
				// If the node position is setted, it has to be transformed
				if( options.nodePosition ){
					
					var b = el.bounds;
					var p = options.nodePosition.toUpperCase();
					
					// Check the values of START and END
					if( el instanceof ORYX.Core.Node && p == "START"){
						p = "NW";
					} else if(el instanceof ORYX.Core.Node && p == "END"){
						p = "SE";
					} else if(el instanceof ORYX.Core.Edge && p == "START"){
						b = el.getDockers().first().bounds
					} else if(el instanceof ORYX.Core.Edge && p == "END"){
						b = el.getDockers().last().bounds
					}

					// Create a callback for the changing the position 
					// depending on the position string
					_temp.callback = function(){
						
						var x = 0; var y = 0;
						
						if( p == "NW" ){
							// Do Nothing
						} else if( p == "N" ) {
							x = b.width() / 2;
						} else if( p == "NE" ) {
							x = b.width();
						} else if( p == "E" ) {
							x = b.width(); y = b.height() / 2;
						} else if( p == "SE" ) {
							x = b.width(); y = b.height();
						} else if( p == "S" ) {
							x = b.width() / 2; y = b.height();
						} else if( p == "SW" ) {
							y = b.height();
						} else if( p == "W" ) {
							y = b.height() / 2;
						} else if( p == "START" || p == "END") {
							x = b.width() / 2; y = b.height() / 2;
						} else {
							return
						}
						
						if( el instanceof ORYX.Core.Edge){
							x  += b.upperLeft().x ; y  += b.upperLeft().y ;
						}
						
						_temp.svg.setAttributeNS(null, "transform", "translate(" + x + ", " + y + ")")
					
					}.bind(this)
					
					_temp.element = el;
					_temp.callback();
					
					b.registerCallback( _temp.callback );
					
				}
				
				
				options._temps.push( _temp )	
				
			}.bind(this))
			
			
			
		}		
	

		// Store the changes
		if( !this.changes[options.id] ){
			this.changes[options.id] = [];
		}
		
		this.changes[options.id].push( options );
				
	},
	
	/**
	 * Hide the overlay with the spefic id
	 * @param {Object} options
	 */
	hide: function( options ){
		
		// Checks if all arguments are available
		if( 	!options || 
				!options.id	|| !options.id instanceof String || options.id.length == 0 ||
				!this.changes[options.id]) { 
				
					return
					
		}		
		
		
		// Delete all added attributes
		// FOR EACH - Shape
		this.changes[options.id].each(function(option){
			
			option.shapes.each(function(el, index){
				
				// Checks if the node is a Shape
				if( !el instanceof ORYX.Core.Shape){ return }
				
				this.deleteAttributes( el.node )
							
			}.bind(this));

	
			if( option._temps ){
				
				option._temps.each(function(tmp){
					// Delete the added Node, if there is one
					if( tmp.svg && tmp.svg.parentNode ){
						tmp.svg.parentNode.removeChild( tmp.svg )
					}
		
					// If 
					if( tmp.callback && tmp.element){
						// It has to be unregistered from the edge
						tmp.element.bounds.unregisterCallback( tmp.callback )
					}
							
				}.bind(this))
				
			}
		
			
		}.bind(this));

		
		this.changes[options.id] = null;
		
		
	},
	
	
	setAttributes: function( node, attributes ) {
		
		
		// Get all the childs from ME
		var childs = this.getAllChilds( node.firstChild.firstChild )
		
		var ids = []
		
		// Add all Attributes which have relation to another node in this document and concate the pure id out of it
		// This is for example important for the markers of a edge
		childs.each(function(e){ ids.push( $A(e.attributes).findAll(function(attr){ return attr.nodeValue.startsWith('url(#')}) )})
		ids = ids.flatten().compact();
		ids = ids.collect(function(s){return s.nodeValue}).uniq();
		ids = ids.collect(function(s){return s.slice(5, s.length-1)})
		
		// Add the node ID to the id
		ids.unshift( node.id + ' .me')
		
		var attr				= $H(attributes);
        var attrValue			= attr.toJSON().gsub(',', ';').gsub('"', '');
        var attrMarkerValue		= attributes.stroke ? attrValue.slice(0, attrValue.length-1) + "; fill:" + attributes.stroke + ";}" : attrValue;
        var attrTextValue;
        if( attributes.fill ){
        	attributes.fill		= "black";
        	attrTextValue		= $H(attributes).toJSON().gsub(',', ';').gsub('"', '');
        }
                	
        // Create the CSS-Tags Style out of the ids and the attributes
        csstags = ids.collect(function(s, i){return "#" + s + " * " + (!i? attrValue : attrMarkerValue) + "" + (attrTextValue ? " #" + s + " text * " + attrTextValue : "") })
		
		// Join all the tags
		var s = csstags.join(" ") + "\n" 
		
		// And add to the end of the style tag
		this.styleNode.innerHTML += s;
		
		
	},
	
	deleteAttributes: function( node ) {
				
		var el 	= this.styleNode.innerHTML.split("\n");
		el 		= el.findAll(function(e){ return !e.startsWith( '#' + node.id ) });
		
		this.styleNode.innerHTML = el.join("\n")
		
		
	},
	
	getAllChilds: function( node ){
		
		var childs = $A(node.childNodes)
		
		$A(node.childNodes).each(function( e ){ 
		        childs.push( this.getAllChilds( e ) )
		}.bind(this))

    	return childs.flatten();
	}

    
});

/**
 * Copyright (c) 2008
 * Lutz Gericke
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

function gup(name){
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) 
        return "";
    else 
        return results[1];
}

ORYX.Plugins.Pnmlexport = Clazz.extend({

    facade: undefined,
    
    construct: function(facade){
        this.facade = facade;
        
        this.facade.offer({
            'name': ORYX.I18N.Pnmlexport.name,
            'functionality': this.exportIt.bind(this),
            'group': ORYX.I18N.Pnmlexport.group,
            'icon': ORYX.PATH + "images/bpmn2pn_deploy.png",
            'description': ORYX.I18N.Pnmlexport.desc,
            'index': 2,
            'minShape': 0,
            'maxShape': 0
        });
        
    },
    
    exportIt: function(){
    
        // raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
        
        // asynchronously ...
        window.setTimeout((function(){
        
            // ... save synchronously
            this.exportSynchronously();
            
            // raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
            
        }).bind(this), 10);
        
        return true;
    },
    
    exportSynchronously: function(){
    
        var resource = location.href;
        
        //get current DOM content
        var serializedDOM = DataManager.__persistDOM(this.facade);
        //add namespaces
        serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" ' +
        'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
        'xmlns:ext="http://b3mn.org/2007/ext" ' +
        'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
        'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
        '<head profile="http://purl.org/NET/erdf/profile">' +
        '<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
        '<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
        '<link rel="schema.b3mn" href="http://b3mn.org" />' +
        '<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
        '<link rel="schema.raziel" href="http://raziel.org/" />' +
        '<base href="' +
        location.href.split("?")[0] +
        '" />' +
        '</head><body>' +
        serializedDOM +
        '</body></html>';
        
        //convert to RDF
        var parser = new DOMParser();
        var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
        var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
        var xsltProcessor = new XSLTProcessor();
        var xslRef = document.implementation.createDocument("", "", null);
        xslRef.async = false;
        xslRef.load(xsltPath);
        xsltProcessor.importStylesheet(xslRef);
        try {
            var rdf = xsltProcessor.transformToDocument(parsedDOM);
            var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
            //serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
            
            var diagramTitle = gup('resource');
            
            // Send the request to the server.
            new Ajax.Request(ORYX.CONFIG.PNML_EXPORT_URL, {
                method: 'POST',
                asynchronous: false,
                parameters: {
                    resource: resource,
                    data: serialized_rdf,
                    title: diagramTitle
                },
                onSuccess: function(request){
                    var pnmlfile = request.responseText;
                    if (pnmlfile.indexOf("RDF to BPMN failed with Exception:") == 0) {
                        //open error window
                        alert(pnmlfile); //errormessage
                    }
                    else {
                        var absolutepath = "http://" + location.host + "/oryx/" + pnmlfile;
                        var output = "<h2>Process: " +
                        self.document.title +
                        "</h2><a target=\"_blank\" href=\"" +
                        absolutepath;

                        var win = new Ext.Window({
                            width: 320,
                            height: 240,
                            resizable: false,
                            minimizable: false,
                            modal: true,
                            autoScroll: true,
                            title: 'Deployment successful',
                            html: output,
                            buttons: [{
                                text: 'OK',
                                handler: function(){
                                    win.hide();
                                }
                            }]
                        });
                        win.show();

                    }
                }
            });
            
        } 
        catch (error) {
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
            alert(error);
        }
    }
});
/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

/**
 * Supports EPCs by offering a syntax check and export and import ability..
 * 
 * 
 */
ORYX.Plugins.ProcessLink = Clazz.extend({

	facade: undefined,

	/**
	 * Offers the plugin functionality:
	 * 
	 */
	construct: function(facade) {

		this.facade = facade;
		
		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_PROPERTY_CHANGED, this.propertyChanged.bind(this) );
		
	},


	/**
	 * 
	 * @param {Object} option
	 */
	propertyChanged: function( option, node){

		if( option.name !== "oryx-refuri" || !node instanceof ORYX.Core.Node ){ return }
		
		
		if( option.value && option.value.length > 0 && option.value != "undefined"){
			
			this.show( node, option.value );
					
		} else {

			this.hide( node );

		}				

	},
	
	/**
	 * Shows the Link for a particular shape with a specific url
	 * 
	 * @param {Object} shape
	 * @param {Object} url
	 */
	show: function( shape, url){

		
		// Generate the svg-representation of a link
		var link  = ORYX.Editor.graft("http://www.w3.org/2000/svg", null ,
					[ 'a',
						{'target': '_blank'},
						['path', 
							{ "stroke-width": 1.0, "stroke":"#00DD00", "fill": "#00AA00", "d":  "M3,3 l0,-2.5 l7.5,0 l0,-2.5 l7.5,4.5 l-7.5,3.5 l0,-2.5 l-8,0", "line-captions": "round"}
						]
					]);

		var link  = ORYX.Editor.graft("http://www.w3.org/2000/svg", null ,
					[ 'a',
						{'target': '_blank'},
						['path', { "style": "fill:none;stroke-width:0.5px; stroke:#000000", "d": "M7,4 l0,2"}],
						['path', { "style": "fill:none;stroke-width:0.5px; stroke:#000000", "d": "M4,8 l-2,0 l0,6"}],
						['path', { "style": "fill:none;stroke-width:0.5px; stroke:#000000", "d": "M10,8 l2,0 l0,6"}],
						['rect', { "style": "fill:#96ff96;stroke:#000000;stroke-width:1", "width": 6, "height": 4, "x": 4, "y": 0}],
						['rect', { "style": "fill:#ffafff;stroke:#000000;stroke-width:1", "width": 6, "height": 4, "x": 4, "y": 6}],
						['rect', { "style": "fill:#96ff96;stroke:#000000;stroke-width:1", "width": 6, "height": 4, "x": 0, "y": 12}],
						['rect', { "style": "fill:#96ff96;stroke:#000000;stroke-width:1", "width": 6, "height": 4, "x": 8, "y": 12}],
						['rect', { "style": "fill:none;stroke:none;pointer-events:all", "width": 14, "height": 16, "x": 0, "y": 0}]
					]);
							
	
		// Set the link with the special namespace
		link.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url);
		
		
		// Shows the link in the overlay					
		this.facade.raiseEvent({
					type: 			ORYX.CONFIG.EVENT_OVERLAY_SHOW,
					id: 			"arissupport.urlref_" + shape.id,
					shapes: 		[shape],
					node:			link,
					nodePosition:	"SE"
				});	
							
	},	

	/**
	 * Hides the Link for a particular shape
	 * 
	 * @param {Object} shape
	 */
	hide: function( shape ){

		this.facade.raiseEvent({
					type: 			ORYX.CONFIG.EVENT_OVERLAY_HIDE,
					id: 			"arissupport.urlref_" + shape.id
				});	
							
	}		
});/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/


if(!ORYX.Plugins) {
	ORYX.Plugins = new Object();
}

ORYX.Plugins.PropertyWindow = {

	facade: undefined,

	construct: function(facade) {
		// Reference to the Editor-Interface
		this.facade = facade;

		this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHOW_PROPERTYWINDOW, this.init.bind(this));
		this.init();
	},
	
	init: function(){
		// The current Element whos Properties will shown
		this.currentElement = undefined;

		// The parent div-node of the grid
		this.node = ORYX.Editor.graft("http://www.w3.org/1999/xhtml",
			null,
			['div']);

		// If the current property in focus is of type 'Date', the date format
		// is stored here.
		this.currentDateFormat;

		// the properties array
		this.properties = [];

		// creating the column model of the grid.
		this.columnModel = new Ext.grid.ColumnModel([
			{
				//id: 'name',
				header: 	ORYX.I18N.PropertyWindow.name,
				dataIndex: 	'name',
				width: 		90,
				sortable: 	true
	        },{
				//id: 'value',
				header: 	ORYX.I18N.PropertyWindow.value,
				dataIndex: 	'value',
				id:			'propertywindow_column_value',
				width: 		90,
				editor: 	new Ext.form.TextField({allowBlank: false}),
				renderer: 	this.renderer.bind(this)
	        }
		])

		// creating the store for the model.
        this.dataSource = new Ext.data.Store({
			proxy: new Ext.data.MemoryProxy(this.properties),
			reader: new Ext.data.ArrayReader({}, [
				{name: 'name'},
				{name: 'value'},
				{name: 'gridProperties'}
			])
        });
		this.dataSource.load();
		
		this.grid = new Ext.grid.EditorGridPanel({
			clicksToEdit: 1,
			stripeRows: true,
			autoExpandColumn: "propertywindow_column_value",
			width:'auto',
			// the column model
			colModel: this.columnModel,
			
			// the data store
			store: this.dataSource
			
		});

		region = this.facade.addToRegion('east', new Ext.Panel({
			width: 200,
			layout: "fit",
			border: false,
			//title: 'Properties',
			items: [
				this.grid
			]
		}), ORYX.I18N.PropertyWindow.title)

		// Register on Events
		this.grid.on('beforeedit', this.beforeEdit, this, true);
		this.grid.on('afteredit', this.afterEdit, this, true);
		//this.grid.on(ORYX.CONFIG.EVENT_KEYDOWN, this.keyDown, this, true);
		
		// Renderer the Grid
		this.grid.enableColumnMove = false;
		//this.grid.render();

		// Sort as Default the first column
		//this.dataSource.sort('name');

	},

	
	specialKeyDown: function(field, event) {
		// If there is a TextArea and the Key is an Enter
		if(field instanceof Ext.form.TextArea && event.button == ORYX.CONFIG.KEY_Code_enter) {
			// Abort the Event
			return false
		}
	},
	
	renderer: function(value) {
		if(value instanceof Date) {
			// TODO: Date-Schema is not generic
			value = value.dateFormat(ORYX.I18N.PropertyWindow.dateFormat);
		} else if(String(value).search("<a href='") < 0) {
			// Shows the Value in the Grid in each Line
			value = String(value).gsub("<", "&lt;");
			value = String(value).gsub(">", "&gt;");
			value = String(value).gsub("%", "&#37;");
			value = String(value).gsub("&", "&amp;");
		}

		return value;
	},

	beforeEdit: function(option) {

		var editorGrid 		= this.dataSource.getAt(option.row).data.gridProperties.editor;
		var editorRenderer 	= this.dataSource.getAt(option.row).data.gridProperties.renderer;

		if(editorGrid) {
			// Disable KeyDown
			this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);

			option.grid.getColumnModel().setEditor(1, editorGrid);
			
			// Render the editor to the grid, therefore the editor is also available 
			// for the first and last row
			editorGrid.render(this.grid);
			
			//option.grid.getColumnModel().setRenderer(1, editorRenderer);
			editorGrid.setSize(option.grid.getColumnModel().getColumnWidth(1), editorGrid.height);
		} else {
			return false;
		}
	},

	afterEdit: function(option) {


		//Ext1.0: option.grid.getDataSource().commitChanges();
		option.grid.getStore().commitChanges();

		var name 		= option.record.data.gridProperties.propId;
		var currentEl 	= this.currentElement;
		var oldValue	= currentEl.properties[name]; 
		var newValue	= option.value;
		var facade		= this.facade;

		console.log(newValue)
		// Implement the specific command for property change
		var commandClass = ORYX.Core.Command.extend({
			construct: function(){
				this.el 		= currentEl;
				this.oldValue 	= oldValue;
				this.newValue 	= newValue;
				this.facade		= facade;
			},			
			execute: function(){
				this.el.setProperty(name, this.newValue);
				//this.el.update();
				this.facade.getCanvas().update();
				this.facade.setSelection([this.el]);
			},
			rollback: function(){
				this.el.setProperty(name, this.oldValue);
				//this.el.update();
				this.facade.getCanvas().update();
				this.facade.setSelection([this.el]);
			}
		})		
		// Instanciated the class
		var command = new commandClass();
		
		// Execute the command
		this.facade.executeCommands([command]);
		
		
		//this.currentElement.update();

		// extended by Kerstin (start)
		this.facade.raiseEvent({
			type 	:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED, 
			element	: this.currentElement,
			name	: name,
			value	: option.value
		});
		// extended by Kerstin (end)
	},

	// extended by Kerstin (start)	
	dialogClosed: function(field) {
		// reopen the text field of the complex list field again
		this.scope.grid.startEditing(this.row, this.col);
	},
	// extended by Kerstin (end)

	onSelectionChanged: function(event) {
		
		// Get the only one element
		var element = event.elements.length == 1 ? 
							event.elements.first():
							undefined;
		
		// If there is a subSelection the get the sub selection					
		element = !element && event.subSelection ?
							event.subSelection : 
							element;
		
		element = !element ? this.facade.getCanvas() : 
							 element;
							
		// Create the Properties
		this.createProperties(element);
	},
	
	createProperties: function(element) {

		this.grid.stopEditing();

		/*if (this.currentElement == element) {
			return;
		}*/

		this.currentElement = element;
		this.properties = [];

		if(this.currentElement) {

			// add new property lines
			var ce = this.currentElement;
			
			this.currentElement.getStencil().properties().each((function(pair, index) {

				var key = pair.prefix() + "-" + pair.id();
				
				// Get the property pair
				var name		= pair.title();
				var attribute	= ce.properties[key];

				var editorGrid = undefined;
				var editorRenderer = null;

				if(!pair.readonly()){
					switch(pair.type()) {
						case ORYX.CONFIG.TYPE_STRING:
							// If the Text is MultiLine
							if(pair.wrapLines()) {
								// Set the Editor as TextArea
								editorGrid = new Ext.Editor(new Ext.form.TextArea({alignment: "tl-tl", allowBlank: pair.optional(),  msgTarget:'title', maxLength:pair.length()}));
							} else {
								// If not, set the Editor as InputField
								editorGrid = new Ext.Editor(new Ext.form.TextField({allowBlank: pair.optional(),  msgTarget:'title', maxLength:pair.length()}));
							}
							break;
						case ORYX.CONFIG.TYPE_BOOLEAN:
							// Set the Editor as a CheckBox
							editorGrid = new Ext.Editor(new Ext.form.Checkbox());
							break;
						case ORYX.CONFIG.TYPE_INTEGER:
							// Set as an Editor for Integers
							editorGrid = new Ext.Editor(new Ext.form.NumberField({allowBlank: pair.optional(), allowDecimals:false, msgTarget:'title', minValue: pair.min(), maxValue: pair.max()}));
							break;
						case ORYX.CONFIG.TYPE_FLOAT:
							// Set as an Editor for Float
							editorGrid = new Ext.Editor(new Ext.form.NumberField({ allowBlank: pair.optional(), allowDecimals:true, msgTarget:'title', minValue: pair.min(), maxValue: pair.max()}));
							break;
						case ORYX.CONFIG.TYPE_COLOR:
							// Set as a ColorPicker
							// Ext1.0 editorGrid = new gEdit(new form.ColorField({ allowBlank: pair.optional(),  msgTarget:'title' }));
							editorGrid = new Ext.Editor(new Ext.ux.ColorField({ allowBlank: pair.optional(),  msgTarget:'title' }));
							break;
						case ORYX.CONFIG.TYPE_CHOICE:
							var items = pair.items();
							// Generate a new list
							//var optionTmpl = new Ext.Template('<option value="{value}">{value}</option>');
							
							var options = ['select', {style:'display:none'}];
							items.each(function(value){ options.push(['option', {value:value.value()}, value.value()])})
							var select = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", null, options);
							// Set the grid Editor
							editorGrid = new Ext.Editor(new Ext.form.ComboBox({ typeAhead: true, triggerAction: 'all', transform:select, lazyRender:true,  msgTarget:'title'}));
							break;
						case ORYX.CONFIG.TYPE_DATE:
							var currFormat = ORYX.I18N.PropertyWindow.dateFormat
							if(!(attribute instanceof Date))
								attribute = Date.parseDate(attribute, currFormat)
							editorGrid = new Ext.Editor(new Ext.form.DateField({ allowBlank: pair.optional(), format:currFormat,  msgTarget:'title'}));
							break;

						case ORYX.CONFIG.TYPE_TEXT:
							
							var cf = new Ext.form.ComplexTextField({
								allowBlank: pair.optional(),
								dataSource:this.dataSource,
								grid:this.grid,
								row:index,
							cf.on('dialogClosed', this.dialogClosed, {scope:this, row:index, col:1});							
							editorGrid = new Ext.Editor(cf);
							break;
							
						// extended by Kerstin (start)
						case ORYX.CONFIG.TYPE_COMPLEX:
							
							var cf = new Ext.form.ComplexListField({ allowBlank: pair.optional()}, pair.complexItems(), key, this.facade);
							cf.on('dialogClosed', this.dialogClosed, {scope:this, row:index, col:1});							
							editorGrid = new Ext.Editor(cf);
							break;
						// extended by Kerstin (end)
						
						
						default:
							editorGrid = new Ext.Editor(new Ext.form.TextField({ allowBlank: pair.optional(),  msgTarget:'title', maxLength:pair.length()}));
					}


					// Register Event to enable KeyDown
					editorGrid.on('beforehide', this.facade.enableEvent.bind(this, ORYX.CONFIG.EVENT_KEYDOWN));
					editorGrid.on('specialkey', this.specialKeyDown.bind(this));

				} else if(pair.type() === ORYX.CONFIG.TYPE_URL){
					attribute = String(attribute).search("http") !== 0 ? ("http://" + attribute) : attribute;
					attribute = "<a href='" + attribute + "' target='_blank'>" + attribute.split("://")[1] + "</a>"
				}

				// Push to the properties-array
				this.properties.push([name, attribute, {
					editor: editorGrid, 
					propId: key, 
					type: pair.type(), 
					renderer: editorRenderer
				}])

			}).bind(this));
		}

		this.setProperties(this.properties);
	},

	setProperties: function(properties) {
		this.dataSource.loadData(properties);
	}
}
ORYX.Plugins.PropertyWindow = Clazz.extend(ORYX.Plugins.PropertyWindow);



/**
 * Editor for complex type
 * 
 * When starting to edit the editor, it creates a new dialog where new attributes
 * can be specified which generates json out of this and put this 
 * back to the input field.
 * 
 * This is implemented from Kerstin Pfitzner
 * 
 * @param {Object} config
 * @param {Object} items
 * @param {Object} key
 * @param {Object} facade
 */


Ext.form.ComplexListField = function(config, items, key, facade){
    Ext.form.ComplexListField.superclass.constructor.call(this, config);
	this.items 	= items;
	this.key 	= key;
	this.facade = facade;
};

/**
 * This is a special trigger field used for complex properties.
 * The trigger field opens a dialog that shows a list of properties.
 * The entered values will be stored as trigger field value in the JSON format.
 */
Ext.extend(Ext.form.ComplexListField, Ext.form.TriggerField,  {
	/**
     * @cfg {String} triggerClass
     * An additional CSS class used to style the trigger button.  The trigger will always get the
     * class 'x-form-trigger' and triggerClass will be <b>appended</b> if specified.
     */
    triggerClass:	'x-form-complex-trigger',
	readOnly:		true,
	emptyText: 		ORYX.I18N.PropertyWindow.clickIcon,
		
	/**
	 * Builds the JSON value from the data source of the grid in the dialog.
	 */
	buildValue: function() {
		var ds = this.grid.getStore();
		ds.commitChanges();
		
		if (ds.getCount() == 0) {
			return "";
		}
		
		var jsonString = "[";
		for (var i = 0; i < ds.getCount(); i++) {
			var data = ds.getAt(i);		
			jsonString += "{";	
			for (var j = 0; j < this.items.length; j++) {
				var key = this.items[j].id();
				jsonString += key + ':' + data.get(key).toJSON();
				if (j < (this.items.length - 1)) {
					jsonString += ", ";
				}
			}
			jsonString += "}";
			if (i < (ds.getCount() - 1)) {
				jsonString += ", ";
			}
		}
		jsonString += "]";
		
		jsonString = "{'totalCount':" + ds.getCount().toJSON() + 
			", 'items':" + jsonString + "}";
		return jsonString;
	},
	
	/**
	 * Returns the field key.
	 */
	getFieldKey: function() {
		return this.key;
	},
	
	/**
	 * Returns the actual value of the trigger field.
	 * If the table does not contain any values the empty
	 * string will be returned.
	 */
    getValue : function(){
		// return actual value if grid is active
		if (this.grid) {
			return this.buildValue();			
		} else if (this.data == undefined) {
			return "";
		} else {
			return this.data;
		}
    },
	
	/**
	 * Sets the value of the trigger field.
	 * In this case this sets the data that will be shown in
	 * the grid of the dialog.
	 * 
	 * @param {Object} value The value to be set (JSON format or empty string)
	 */
	setValue: function(value) {	
		if (value.length > 0) {
			// set only if this.data not set yet
			// only to initialize the grid
			if (this.data == undefined) {
				this.data = value;
			}
		}
	},
	
	/**
	 * Returns false. In this way key events will not be propagated
	 * to other elements.
	 * 
	 * @param {Object} event The keydown event.
	 */
	keydownHandler: function(event) {
		return false;
	},
	
	/**
	 * The listeners of the dialog. 
	 * 
	 * If the dialog is hidded, a dialogClosed event will be fired.
	 * This has to be used by the parent element of the trigger field
	 * to reenable the trigger field (focus gets lost when entering values
	 * in the dialog).
	 */
    dialogListeners : {
        show : function(){ // retain focus styling
            this.onFocus();	
			this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN, this.keydownHandler.bind(this));
			this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
			return;
        },
        hide : function(){


            var dl = this.dialogListeners;
            this.dialog.un("show", dl.show,  this);
            this.dialog.un("hide", dl.hide,  this);
			
			this.dialog.destroy(true);
			this.grid.destroy(true);
			delete this.grid;
			delete this.dialog;
			
			this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_KEYDOWN, this.keydownHandler.bind(this));
			this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
			
			// store data and notify parent about the closed dialog
			// parent has to handel this event and start editing the text field again
			this.fireEvent('dialogClosed');
			
			Ext.form.ComplexListField.superclass.setValue.call(this, this.data);
        }
    },	
	
	/**
	 * Builds up the initial values of the grid.
	 * 
	 * @param {Object} recordType The record type of the grid.
	 * @param {Object} items      The initial items of the grid (columns)
	 */
	buildInitial: function(recordType, items) {
		var initial = new Hash();
		
		for (var i = 0; i < items.length; i++) {
			var id = items[i].id();
			initial[id] = items[i].value();
		}
		
		var RecordTemplate = Ext.data.Record.create(recordType);
		return new RecordTemplate(initial);
	},
	
	/**
	 * Builds up the column model of the grid. The parent element of the
	 * grid.
	 * 
	 * Sets up the editors for the grid columns depending on the 
	 * type of the items.
	 * 
	 * @param {Object} parent The 
	 */
	buildColumnModel: function(parent) {
		var cols = [];
		for (var i = 0; i < this.items.length; i++) {
			var id 		= this.items[i].id();
			var header 	= this.items[i].name();
			var width 	= this.items[i].width();
			var type 	= this.items[i].type();
			var editor;
			
			if (type == ORYX.CONFIG.TYPE_STRING) {
				editor = new Ext.form.TextField({ allowBlank : this.items[i].optional()});
			} else if (type == ORYX.CONFIG.TYPE_CHOICE) {				
				var items = this.items[i].items();
				var select = ORYX.Editor.graft("http://www.w3.org/1999/xhtml", parent, ['select', {style:'display:none'}]);
				var optionTmpl = new Ext.Template('<option value="{value}">{value}</option>');
				items.each(function(value){ 
					optionTmpl.append(select, {value:value.value()}); 
				});				
				
				editor = new Ext.form.ComboBox(
					{ typeAhead: true, triggerAction: 'all', transform:select, lazyRender:true,  msgTarget:'title'});			
			} else if (type == ORYX.CONFIG.TYPE_BOOLEAN) {
				editor = new Ext.form.Checkbox();
			}
					
			cols.push({
				id: 		id,
				header: 	header,
				dataIndex: 	id,
				resizable: 	true,
				editor: 	editor
	        });
			
		}
		return new Ext.grid.ColumnModel(cols);
	},
	
	/**
	 * After a cell was edited the changes will be commited.
	 * 
	 * @param {Object} option The option that was edited.
	 */
	afterEdit: function(option) {
		option.grid.getStore().commitChanges();
	},
		
	/**
	 * Before a cell is edited it has to be checked if this 
	 * cell is disabled by another cell value. If so, the cell editor will
	 * be disabled.
	 * 
	 * @param {Object} option The option to be edited.
	 */
	beforeEdit: function(option) {

		var state = this.grid.getView().getScrollState();
		
		var col = option.column;
		var row = option.row;
		var editId = this.grid.getColumnModel().config[col].id;
		// check if there is an item in the row, that disables this cell
		for (var i = 0; i < this.items.length; i++) {
			// check each item that defines a "disable" property
			var item = this.items[i];
			var disables = item.disable();
			if (disables != undefined) {
				
				// check if the value of the column of this item in this row is equal to a disabling value
				var value = this.grid.getStore().getAt(row).get(item.id());
				for (var j = 0; j < disables.length; j++) {
					var disable = disables[j];
					if (disable.value == value) {
						
						for (var k = 0; k < disable.items.length; k++) {
							// check if this value disables the cell to select 
							// (id is equals to the id of the column to edit)
							var disItem = disable.items[k];
							if (disItem == editId) {
								this.grid.getColumnModel().getCellEditor(col, row).disable();
								return;
							}
						}
					}
				}		
			}
		}
		this.grid.getColumnModel().getCellEditor(col, row).enable();
		//this.grid.getView().restoreScroll(state);
	},
	
    /**
     * If the trigger was clicked a dialog has to be opened
     * to enter the values for the complex property.
     */
    onTriggerClick : function(){
        if(this.disabled){
            return;
        }	
		
		//if(!this.dialog) { 
		
			var dialogWidth = 0;
			var recordType 	= [];
			
			for (var i = 0; i < this.items.length; i++) {
				var id 		= this.items[i].id();
				var width 	= this.items[i].width();
				var type 	= this.items[i].type();	
					
				if (type == ORYX.CONFIG.TYPE_CHOICE) {
					type = ORYX.CONFIG.TYPE_STRING;
				}
						
				dialogWidth += width;
				recordType[i] = {name:id, type:type};
			}			
			
			if (dialogWidth > 800) {
				dialogWidth = 800;
			}
			dialogWidth += 22;
			
			var data = this.data;
			if (data == "") {
				// empty string can not be parsed
				data = "{}";
			}
			
			
			var ds = new Ext.data.Store({
		        proxy: new Ext.data.MemoryProxy(eval("(" + data + ")")),				
				reader: new Ext.data.JsonReader({
		            root: 'items',
		            totalProperty: 'totalCount'
		        	}, recordType)
	        });
			ds.load();
					
				
			var cm = this.buildColumnModel();
			
			this.grid = new Ext.grid.EditorGridPanel({
				store:		ds,
		        cm:			cm,
				stripeRows: true,
				clicksToEdit : 1,
				autoHeight:true,
		        selModel: 	new Ext.grid.CellSelectionModel()
		    });	
			
									
			//var gridHead = this.grid.getView().getHeaderPanel(true);
			var toolbar = new Ext.Toolbar(
			[{
				text: ORYX.I18N.PropertyWindow.add,
				handler: function(){
					var ds = this.grid.getStore();
					var index = ds.getCount();
					this.grid.stopEditing();
					var p = this.buildInitial(recordType, this.items);
					ds.insert(index, p);
					ds.commitChanges();
					this.grid.startEditing(index, 0);
				}.bind(this)
			},{
				text: ORYX.I18N.PropertyWindow.rem,
		        handler : function(){
					var ds = this.grid.getStore();
					var selection = this.grid.getSelectionModel().getSelectedCell();
					if (selection == undefined) {
						return;
					}
					this.grid.getSelectionModel().clearSelections();
		            this.grid.stopEditing();					
					var record = ds.getAt(selection[0]);
					ds.remove(record);
					ds.commitChanges();           
				}.bind(this)
			}]);			
		
			// Basic Dialog
			this.dialog = new Ext.Window({ 
				autoCreate: true, 
				title: ORYX.I18N.PropertyWindow.complex, 
				height: 350, 
				width: dialogWidth, 
				modal:true,
				collapsible:false,
				fixedcenter: true, 
				shadow:true, 
				proxyDrag: true,
				keys:[{
					key: 27,
					fn: function(){
						this.dialog.hide
					}.bind(this)
				}],
				items:[toolbar, this.grid],
				bodyStyle:"background-color:#FFFFFF",
				buttons: [{
	                text: ORYX.I18N.PropertyWindow.ok,
	                handler: function(){
	                    this.grid.stopEditing();	
						// store dialog input
						this.data = this.buildValue();
						this.dialog.hide()
	                }.bind(this)
	            }, {
	                text: ORYX.I18N.PropertyWindow.cancel,
	                handler: function(){
	                	this.dialog.hide()
	                }.bind(this)
	            }]
			});		
				
			this.dialog.on(Ext.apply({}, this.dialogListeners, {
	       		scope:this
	        }));
		
			this.dialog.show();	
		
	
			this.grid.on('beforeedit', 	this.beforeEdit, 	this, true);
			this.grid.on('afteredit', 	this.afterEdit, 	this, true);
			
			this.grid.render();			
	    
		/*} else {
			this.dialog.show();		
		}*/
		
	}
});





Ext.form.ComplexTextField = Ext.extend(Ext.form.TriggerField,  {

		
    /**
     * If the trigger was clicked a dialog has to be opened
     * to enter the values for the complex property.
     */
    onTriggerClick : function(){
		
        if(this.disabled){
            return;
        }	
		        
		var grid = new Ext.form.TextArea({
	        anchor		: '100% 100%',
			value		: unescape(this.value),
		
		
		// Basic Dialog
		var dialog = new Ext.Window({ 
			layout		: 'anchor',
			autoCreate	: true, 
			title		: ORYX.I18N.PropertyWindow.text, 
			height		: 350, 
			width		: 300, 
			modal		: true,
			collapsible	: false,
			fixedcenter	: true, 
			shadow		: true, 
			proxyDrag	: true,
			keys:[{
				key	: 27,
				fn	: function(){
						dialog.hide()
				}.bind(this)
			}],
			items		:[grid],
			listeners	:{
				hide: function(){
					this.fireEvent('dialogClosed');
					//this.focus.defer(10, this);
					dialog.destroy();
				}.bind(this)				
			},
			buttons		: [{
                text: ORYX.I18N.PropertyWindow.ok,
                handler: function(){	 
					// store dialog input
					var value = escape(grid.getValue());
					this.setValue(value);
					
					this.dataSource.getAt(this.row).set('value', value)
					this.dataSource.commitChanges()

					dialog.hide()
                }.bind(this)
            }, {
                text: ORYX.I18N.PropertyWindow.cancel,
                handler: function(){
                	dialog.hide()
                }.bind(this)
            }]
		});		
				
		dialog.show();		
		grid.render();

		this.grid.stopEditing();
		grid.focus( false, 100 );
		
	}
});
/**
 * Copyright (c) 2008-2009, Steffen Ryll
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.QueryEvaluator = Clazz.extend({

    facade: undefined,
    
    construct: function(facade){
		
        this.facade = facade;
        
		this.active 		= false;
		this.raisedEventIds = [];
		
        this.facade.offer({
            'name': ORYX.I18N.QueryEvaluator.name,
            'functionality': this.showOverlay.bind(this),
            'group': ORYX.I18N.QueryEvaluator.group,
            'icon': ORYX.PATH + "images/xforms_export.png",
            'description': ORYX.I18N.QueryEvaluator.desc,
            'index': 0,
			'toggle': true,
            'minShape': 0,
            'maxShape': 0
        });
		
    },
    
	showOverlay: function(button, pressed){

		if (!pressed) {
			
/*			this.raisedEventIds.each(function(id){
				this.facade.raiseEvent({
						type: 	ORYX.CONFIG.EVENT_OVERLAY_HIDE,
						id: 	id
					});
			}.bind(this))
*/
			this.raisedEventIds = [];
			this.active 		= !this.active;
			
			return;
		} 
		
		var options = {
			command : 'undef'
		}
		
		var optionsPopup = new Ext.Window({
			layout      : 'fit',
            width       : 500,
            height      : 350,
            closable	: true,
            plain       : true,
			modal		: true,
			id			: 'optionsPopup',
			
			buttons: [{
				text	: 'Submit',
				handler	: function(){
					// set options
					options = formPanel.getForm().getValues(false);
					
					optionsPopup.close();
					this.issueQuery(options);
				}.bind(this)
			}, {
                text     : 'Abort',
                handler  : function(){
                    optionsPopup.close();
                }.bind(this)
            }]

		})
		
		var modelIdField = new Ext.form.TextField({
			fieldLabel	: 'Model ID',
			name		: 'modelID',
			grow		: true,
//			hideLabel	: true
		});
		modelIdField.hide();
		
		var checkListener = function(field, checked){
			// keep checked states of all relevant fields in this array 
			if (!this.fieldStates) {
				this.fieldStates = [];
			}
			var found = false;
			var mustShowField = false;
			var i, f;
			for (i = 0; i < this.fieldStates.length; i++){
				f =  this.fieldStates[i];
				// update field entry
				if (f.field === field) {
					found = true;
					f.checked = checked;
				}
				// and at the same time check whether at least one field is checked
				mustShowField = mustShowField || f.checked;
			}
			if (!found) {
				// was not used before, so add to array
				this.fieldStates.push({
					field	: field,
					checked	: checked
				});
				mustShowField = true;
			}
			// change field visibility, if necessary
			if (mustShowField){
				modelIdField.show();
			} else {
				modelIdField.hide();
			}
		}
		
		var formPanel = new Ext.form.FormPanel({
			frame		: true,
			title		: 'Query options',
			bodyStyle	: 'padding:0 10px 0;',
			items		: [{
				// create a radio button group
				xtype		: 'fieldset',
            	autoHeight	: true,
				columns		: 1,
				allowBlank	: false,
				defaultType	: 'radio',
				items		: [
                    {
						boxLabel	: 'Process query', 
						fieldLabel	: 'Query Type', 
						name		: 'command', 
						inputValue	: 'processQuery', 
						checked: true},
					{
						boxLabel	: 'Test whether query matches specific model', 
						labelSeparator: '', 
						name		: 'command', 
						inputValue	: 'testQueryAgainstModel', 
						listeners	: {
							'check': checkListener.bind(this)
						} 
					},
                    {
						boxLabel	: 'Run query against specific model', 
						labelSeparator: '',
						name		: 'command',
						inputValue	: 'runQueryAgainstModel',
						listeners	: {
							'check': checkListener.bind(this)
						}
					},
                    {
						boxLabel	: 'Process MultiQuery', 
						labelSeparator: '', 
						name		: 'command', 
						inputValue	: 'processMultiQuery'},
					{
						xtype		: 'checkbox',
						fieldLabel	: 'Stop after first match in a model was found',
						name		: 'stopAtFirstMatch',
						checked		: true,
					}
                ]
			}]
		});
		formPanel.add(modelIdField);
		
		optionsPopup.add(formPanel);
		optionsPopup.show();
		
		button.toggle();
	},
	
	issueQuery : function(options){
		// Force to set all resource IDs
		var serializedDOM = DataManager.serializeDOM( this.facade );

		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';

		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
//			serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;

			this.facade.raiseEvent({
	            type: ORYX.CONFIG.EVENT_LOADING_ENABLE,
				text: "Waiting for server"  //ORYX.I18N.Save.saving
	        });
			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.QUERYEVAL_URL, {
				method: 'POST',
				asynchronous: true,
				parameters: {
					resource	: location.href,
					command		: options.command,
					modelID		: options.modelID,
					stopAtFirstMatch: options.stopAtFirstMatch,
					data		: serialized_rdf
				},
                onSuccess: function(response){
                    this.facade.raiseEvent({
						type:ORYX.CONFIG.EVENT_LOADING_DISABLE
					});
					
					var respXML = response.responseXML;
                    var root = respXML.firstChild;
                    var processList = new Array();
                    var nodecnt, graph;
                    var pchildren = root.getElementsByTagName("ProcessGraph");
                    
                    // puts all matching process models into array processList with model ID 
                    // and model elements
					for (nodecnt = 0; nodecnt < pchildren.length; nodecnt++) {
                        graph = pchildren.item(nodecnt);
                        var graphID = graph.getAttributeNode("modelID").nodeValue;
                        processList.push({
							id 			: graphID,
							elements 	: this.processResultGraph(graph),
							metadata	: ''
						});
                        
                    }
					this.processProcessList(processList);
                }.bind(this),
				
				onFailure: function(response){
					this.facade.raiseEvent({
						type:ORYX.CONFIG.EVENT_LOADING_DISABLE
					});
					Ext.Msg.alert("Oryx", "Server encountered an error (" + response.statusText + ").\n"
						+ response.responseText);
				}.bind(this)
			});
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}

	},
	
	raiseOverlay: function(shape, errorMsg) {
		
		var id = "queryeval." + this.raisedEventIds.length;
		
		var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null ,
			['path', {
				"title":errorMsg, "stroke-width": 5.0, "stroke":"red", "d":  "M20,-5 L5,-20 M5,-5 L20,-20", "line-captions": "round"
				}]);

/*		this.facade.raiseEvent({
			type: 			ORYX.CONFIG.EVENT_OVERLAY_SHOW,
			id: 			id,
			shapes: 		[shape],
			node:			cross,
			nodePosition:	shape instanceof ORYX.Core.Edge ? "START" : "NW"
		});		
*/		
		this.raisedEventIds.push(id);
		
		return cross;		
	},
	
    processResultGraph: function(xmlNode){
        var graphElements = new Array();
		
		for (var k = 0; k < xmlNode.childNodes.length; k++) {
            var node = xmlNode.childNodes.item(k);
            if (!(node instanceof Text)) {
                if (node.hasAttribute("id")) { // it is a node
					graphElements.push({
						nodeType : node.nodeName,
						nodeId : node.getAttributeNode("id").nodeValue
					});
					
				} else if ((node.hasAttribute("from"))
						&& node.hasAttribute("to")) { // it is an edge
					graphElements.push({
						edgeType : node.nodeName,
						from : node.getAttributeNode("from").nodeValue,
						to : node.getAttributeNode("to").nodeValue
					});
				}
            }
        }
		return graphElements;
    },
	
	/**
	 * 
	 * @param {Array} processList; 
	 * 		elements' fields: id location identifier for process
	 * 						  elements array of graph nodes/edges
	 */
	processProcessList: function(processList){
		if(processList.length == 0) {
			Ext.Msg.alert("Oryx", "Found no matching processes!");
			return;
		} 
		
		// load process model meta data
		processList.each(this.getModelMetaData.bind(this));
		
		// transform array of objects into array of arrays
		var data = [];
		processList.each(function( pair ){
/*			var stencilset = pair.value.type;
			// Try to display stencilset title instead of uri
			this.facade.modelCache.getModelTypes().each(function(type){
				if (stencilset == type.namespace) {
					stencilset = type.title;
					return;
				}
			}.bind(this));
*/			
			data.push( [ pair.id, pair.metadata.thumbnailUri + "?" + Math.random(), unescape(pair.metadata.title), '' /*stencilset*/, 'Unknown' ] )
		}.bind(this));

		
		// following is mostly UI logic
		var myProcsPopup = new Ext.Window({
			layout      : 'fit',
            width       : 500,
            height      : 300,
            closable	: true,
            plain       : true,
			modal		: true,
			id			: 'procResPopup',
			
			buttons: [{
                text     : 'Close',
                handler  : function(){
                    myProcsPopup.close();
                }
            }]

		})
		
		var tableModel = new Ext.data.SimpleStore({
			fields: [
				{name: 'id'}, //, type: 'string', mapping: 'metadata.id'},
				{name: 'icon'}, //, mapping: 'metadata.icon'},
				{name: 'title'}, //, mapping: 'metadata.title'},
				{name: 'type'}, //, mapping: 'metadata.type'},
				{name: 'author'}, //, mapping: 'metadata.author'},
//				{name: 'elements', type: 'auto', mapping: 'elements'}
			],
			data : data
		});
//		tableModel.loadData(processList);
		
/*		var iconPanel = new Ext.grid.GridPanel({
			store:	tableModel,
			columns: [
				{id: 'id', header: "ID", width: 360, dataIndex: 'id'},
				{header: "Elements", width: 300, dataIndex: 'elements'}
			],
			stripeRows: true,
	        autoExpandColumn: 'id',
	        height:350,
	        width:600,
	        title:'Array Grid'
		}); */
		var iconPanel = new Ext.Panel({
			border	: false,
	        items	: new this.dataGridPanel({store: tableModel //, listeners:{click:this._onSelectionChange.bind(this), dblclick:this._onDblClick.bind(this)}
			})
	    });
		
		// grid.getSelectionModel().selectFirstRow();
		

		myProcsPopup.add(iconPanel);
		// iconPanel.show();
		
		myProcsPopup.show();
	},
	
	getModelMetaData : function(processEntry) {
		var metaUri = processEntry.id.replace(/\/rdf$/, '/meta');
		new Ajax.Request(metaUri, 
			 {
				method			: "get",
				asynchronous 	: false,
				onSuccess		: function(transport) {
					processEntry.metadata = transport.responseText.evalJSON();
				}.bind(this),
				onFailure		: function() {
					alert("Error loading model meta data.")
				}.bind(this)
			});
	},
	
	dataGridPanel : Ext.extend(Ext.DataView, {
		multiSelect		: true,
		//simpleSelect	: true, 
	    cls				: 'repository_iconview',
	    itemSelector	: 'dd',
	    overClass		: 'over',
		selectedClass	: 'selected',
	    tpl : new Ext.XTemplate(
	        '<div>',
				'<dl>',
	            '<tpl for=".">',
					'<dd>',
					'<div class="image"><img src="{icon}" title="{title}"/></div>',
		            '<div><span class="title" title="{[ values.title.length + (values.type.length*0.8) > 30 ? values.title : "" ]}">{[ values.title.truncate(30 - (values.type.length*0.8)) ]}</span><span class="author" unselectable="on">({type})</span></div>',
		            '<div><span class="type">{author}</span></div>',
					'</dd>',
	            '</tpl>',
				'</dl>',
	        '</div>'
	    )
	}), 
	

    
});

});/**
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
});/**
		})) {
/**
 * Copyright (c) 2006
 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner, Gero Decker
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.SimplePnmlexport = Clazz.extend({

    facade: undefined,
    
    construct: function(facade){
        this.facade = facade;
        
        this.facade.offer({
            'name': ORYX.I18N.SimplePnmlexport.name,
            'functionality': this.exportIt.bind(this),
            'group': ORYX.I18N.SimplePnmlexport.group,
            dropDownGroupIcon: ORYX.PATH + "images/export2.png",
            'description': ORYX.I18N.SimplePnmlexport.desc,
            'index': 1,
            'minShape': 0,
            'maxShape': 0
        });
        
    },

    exportIt: function(){

		// raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
            
		// asynchronously ...
        window.setTimeout((function(){
			
			// ... save synchronously
            this.exportSynchronously();
			
			// raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
			
        }).bind(this), 10);

		return true;
    },

    exportSynchronously: function() {

        var resource = location.href;
		
		//get current DOM content
		var serializedDOM = DataManager.__persistDOM(this.facade);
		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';
		
		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
			if (!serialized_rdf.startsWith("<?xml")) {
				serialized_rdf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;
			}
			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.SIMPLE_PNML_EXPORT_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: resource,
					data: serialized_rdf
				},
				onSuccess: function(request){
						var win = window.open('data:text/xml,' +request.responseText, '_blank', "resizable=yes,width=640,height=480,toolbar=0,scrollbars=yes");
				}
			});
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}
	}
});/*
/**
 * Copyright (c) 2008, Gero Decker, refactored by Kai Schlichting
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

/**
   This plugin is a generic syntax checker for different diagram types.
   Needs server communication.
   @class ORYX.Plugins.SyntaxChecker
   @constructor Creates a new instance
   @extends ORYX.Plugins.AbstractPlugin
*/
ORYX.Plugins.SyntaxChecker = ORYX.Plugins.AbstractPlugin.extend({
    
    /**@private*/
    construct: function(){
        arguments.callee.$.construct.apply(this, arguments);
        
        /** 
         * Returns the syntax checker instatiated by Oryx. This can be used to interact
         * with syntax checker from other plugins.
         * @memberOf ORYX.Plugins.SyntaxChecker
         */
        ORYX.Plugins.SyntaxChecker.instance = this;
        
        this.active = false;
        this.raisedEventIds = [];
        
        this.facade.offer({
            'name': ORYX.I18N.SyntaxChecker.name,
            'functionality': this.perform.bind(this),
            'group': ORYX.I18N.SyntaxChecker.group,
            'icon': ORYX.PATH + "images/checker_syntax.png",
            'description': ORYX.I18N.SyntaxChecker.desc,
            'index': 0,
            'toggle': true,
            'minShape': 0,
            'maxShape': 0
        });
    },
    
    perform: function(button, pressed){
        if (!pressed) {
            this.resetErrors();
        } else {
            this.checkForErrors({
                onNoErrors: function(){
                    button.toggle();
                    this.active = !this.active;
                    Ext.Msg.alert("Oryx", ORYX.I18N.SyntaxChecker.noErrors);
                },
                onErrors: function(){
                },
                onFailure: function(){
                    button.toggle();
                    this.active = !this.active;
                    Ext.Msg.alert("Oryx", ORYX.I18N.SyntaxChecker.invalid);
                }
            });      
        }
    },
    
    /**
     * Performs request to server to check for errors on current model.
     * @methodOf ORYX.Plugins.SyntaxChecker.prototype
     * @param {Object} options Configuration hash
     * @param {String} context A context send to the syntax checker servlet
     * @param {Function} [options.onNoErrors] Raised when model has no errors.
     * @param {Function} [options.onErrors] Raised when model has errors.
     * @param {Function} [options.onFailure] Raised when server communcation failed.
     */
    checkForErrors: function(options){
        if(!options)
            options = {};
            
        Ext.Msg.wait(ORYX.I18N.SyntaxChecker.checkingMessage);
        
        // Send the request to the server.
        new Ajax.Request(ORYX.CONFIG.SYNTAXCHECKER_URL, {
            method: 'POST',
            asynchronous: false,
            parameters: {
                resource: location.href,
                data: this.getRDFFromDOM(),
                context: options.context
            },
            onSuccess: function(request){
                var resp = request.responseText.evalJSON();
                
                if (resp instanceof Object) {
                    resp = $H(resp)
                    if (resp.size() > 0) {
                        this.showErrors(resp);
                 
                        if(options.onErrors) options.onErrors();
                    }
                    else {
                        if(options.onNoErrors) options.onNoErrors();
                    }
                }
                else {
                    if(options.onFailure) options.onFailure();
                }
                Ext.Msg.hide();
            }.bind(this),
            onFailure: function(){
                Ext.Msg.hide();
                if(options.onFailure) options.onFailure();
            }
        });
    },
    
    /**
     * Shows overlays for each given error
     * @methodOf ORYX.Plugins.SyntaxChecker.prototype
     * @param {Hash|Object} errors
     * @example
     * showErrors({
     *     myShape1: "This has an error!",
     *     myShape2: "Another error!"
     * })
     */
    showErrors: function(errors){
        // If normal object is given, convert to hash
        if(!(errors instanceof Hash)){
            errors = new Hash(errors);
        }
        
        // Get all Valid ResourceIDs and collect all shapes
        errors.keys().each(function(value){
            var sh = this.facade.getCanvas().getChildShapeByResourceId(value);
            if (sh) {
                this.raiseOverlay(sh, errors[value]);
            }
        }.bind(this));
        this.active = !this.active;
    },
    
    /**
     * Resets all (displayed) errors
     * @methodOf ORYX.Plugins.SyntaxChecker.prototype
     */
    resetErrors: function(){
        this.raisedEventIds.each(function(id){
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
                id: id
            });
        }.bind(this))
        
        this.raisedEventIds = [];
        this.active = !this.active;
    },
    
    raiseOverlay: function(shape, errorMsg){
        var id = "syntaxchecker." + this.raisedEventIds.length;
        
        var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
            "title": errorMsg,
            "stroke-width": 5.0,
            "stroke": "red",
            "d": "M20,-5 L5,-20 M5,-5 L20,-20",
            "line-captions": "round"
        }]);
        
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
            id: id,
            shapes: [shape],
            node: cross,
            nodePosition: shape instanceof ORYX.Core.Edge ? "START" : "NW"
        });
        
        this.raisedEventIds.push(id);
        
        return cross;
    }
});
/**
 * Copyright (c) 2007
 * Kerstin Pfitzner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/


if(!ORYX.Plugins) {
	ORYX.Plugins = new Object();
}


ORYX.Plugins.TransformationDownloadDialog = {

	construct: function() {
	},
	
	

	
	/**
	 * Opens a message dialog with the given title that shows
	 * the content. The dialog just shows a message and has a 
	 * "OK" button to be closed.
	 * 
	 * @param {String} title   The title of the dialog
	 * @param {String} content The content to be shown in the dialog
	 */
	openMessageDialog: function(title, content) {
		
		var dialog = new Ext.Window({ 
			autoCreate: true, 
			title: title, 
			modal:true,
			height: 120,
			width: 400,
			collapsible:false,
			fixedcenter: true, 
			shadow:true, 
			resizable:true,
			proxyDrag: true,
			autoScroll:true,
			buttonAlign:"center",
            bodyStyle:'padding:10px',
            html:'<span class="ext-mb-text">' + content + '</span>'
                        
		});
		//dialog.addKeyListener(27, dialog.hide, dialog);
		dialog.addButton('OK', dialog.hide, dialog);
		dialog.on('hide', function(){
			dialog.destroy(true);
			delete dialog;
		});
		
		dialog.show();
	},
	
	
	/**
	 * Opens an error dialog that shows the given content.
	 * The error is shown in a text area.
	 * 
	 * @param {String} content The error to be shown
	 */
	openErrorDialog: function(content) {
		// Basic Dialog
		var text = new Ext.form.TextArea({
			id:'error-field',
			fieldLabel: ORYX.I18N.TransformationDownloadDialog.error,
			name: 'desc',
			height: 405,
			width: 633,
			preventScrollbars: true,
			value: content,
			readOnly:true
        });
		
		var dialog = new Ext.Window({ 
			autoCreate: true, 
			title: ORYX.I18N.TransformationDownloadDialog.errorParsing, 
			modal:true,
			height: 450,
			width: 650,
			collapsible:false,
			fixedcenter: true, 
			shadow:true, 
			resizable:false,
			proxyDrag: true,
			autoScroll:false
		});
		//dialog.addKeyListener(27, dialog.hide, dialog);
		dialog.on('hide', function(){
			dialog.destroy(true);
			text.destroy(true);
			delete dialog;
			delete text;
		});
		text.render(dialog.body);
		
		dialog.show();
	},
	
	
	/**
	 * Opens a dialog that presents the results of a transformation.
	 * The dialog shows a list containing the resulting XML files.
	 * Each file can be shown in a new window or downloaded.
     *
	 * @param {Object} data The data to be shown in the dialog
	 * Format: array with three elements: 
	 *   * file - the file
	 *   * result - the content of file, may also be an error message.
	 *   * info - status of the result: "success" or "error"
	 */
	openResultDialog: function(data) {

		var ds = new Ext.data.Store({
	        proxy: new Ext.data.MemoryProxy(data),
	        reader: new Ext.data.ArrayReader({}, [
	               {name: 'file', type: 'string'},
	               {name: 'result', type: 'string'},
	               {name: 'info', type: 'string'}
	        	])
		});
		
		ds.load();

		// renderer
		var infoRenderer = function (val){
            if(val == "success"){
                return '<span style="color:green;">' + val + '</span>';
            }else if(val == "error"){
                return '<span style="color:red;">' + val + '</span>';
            }
            return val;
        };
	
		var cm = new Ext.grid.ColumnModel([
		    {id:'file',header: "File", width: 200, sortable: false, dataIndex: 'file', resizable: false},
		    {header: "Info", width: 75, sortable: false, dataIndex: 'info', renderer: infoRenderer, resizable: false} 
		]);
				
		var grid = new Ext.grid.GridPanel({
			store:ds,
	        cm: cm,
	        sm: new Ext.grid.RowSelectionModel({ 	singleSelect:true }),
			autoWidth: true
	    });
		
	    var toolbar = new Ext.Toolbar();
		
		var dialog = new Ext.Window({ 
			autoCreate: true, 
			title: ORYX.I18N.TransformationDownloadDialog.transResult, 
			autoHeight: true, 
			width: 297, 
			modal:true,
			collapsible:false,
			fixedcenter: true, 
			shadow:true, 
			proxyDrag: true,
			resizable:false,
			items:[toolbar, grid]
		});
	
		dialog.on('hide', function(){
			dialog.destroy(true);
			grid.destroy(true);
			delete dialog;
			delete grid;
		});
		dialog.show();
		
		toolbar.add({
			icon: 'images/view.png', // icons can also be specified inline
	        cls: 'x-btn-icon',
    	    tooltip: ORYX.I18N.TransformationDownloadDialog.showFile,
			handler: function() {
				var ds = grid.getStore();
				var selection = grid.getSelectionModel().getSelected();
				if (selection == undefined) {
					return;
				}
				var show = selection.get("result");
				if (selection.get("info") == "success") {
					this.openXMLWindow(show);
				} else {
					this.openErrorWindow(show);
				}
			}.bind(this)
		});
		toolbar.add({
			icon: 'images/disk.png', // icons can also be specified inline
	        cls: 'x-btn-icon',
    	    tooltip: ORYX.I18N.TransformationDownloadDialog.downloadFile,
			handler: function() {
				var ds = grid.getStore();
				var selection = grid.getSelectionModel().getSelected();
				if (selection == undefined) {
					return;
				}
				this.openDownloadWindow(selection, false);
			}.bind(this)
		});
		toolbar.add({
			icon: 'images/disk_multi.png', // icons can also be specified inline
	        cls: 'x-btn-icon',
    	    tooltip: ORYX.I18N.TransformationDownloadDialog.downloadAll,
			handler: function() {
				var ds = grid.getStore();				
				this.openDownloadWindow(ds.getRange(0, ds.getCount()), true);
			}.bind(this)
		});			
		
		// Select the first row
		grid.getSelectionModel().selectFirstRow();
	},
	
	
	/**
	 * Opens a new window that shows the given XML content.
	 * 
	 * @param {Object} content The XML content to be shown.
	 */
	openXMLWindow: function(content) {
		var win = window.open(
		   'data:application/xml,' + encodeURIComponent([
		     content
		   ].join('\r\n')),
		   '_blank', "resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes"
		);
	},
	
	
	/**
	 * Opens a window that shows the given text content.
	 * 
	 * @param {Object} content The text content to be shown.
	 */
	openErrorWindow: function(content) {
		var win = window.open(
		   'data:text/html,' + encodeURIComponent([
		     "<html><body><pre>" + content + "</pre></body></html>"
		   ].join('\r\n')),
		   '_blank', "resizable=yes,width=800,height=300,toolbar=0,scrollbars=yes"
		);
	},
	
	
	/**
	 * Creates a hidden form element to communicate parameter values
	 * to a php file.
	 * 
	 * @param {Object} name  The name of the hidden field
	 * @param {Object} value The value of the hidden field
	 */
	createHiddenElement: function(name, value) {
		var newElement = document.createElement("input");
		newElement.name=name;
		newElement.type="hidden";
		newElement.value = value;
		return newElement
	},
	
	
	/**
	 * Adds a file extension to the given file name. If the file
	 * has the name "topology" or "XPDL4Chor" an .xml extension will
	 * be added. Otherwise a .bpel extension will be added
	 * 
	 * @param {Object} file The file name to add the extension to.
	 */
	addFileExtension: function(file) {
		if ((file == "topology") || (file == "XPDL4Chor")) {
			return file + ".xml";
		} else {
			return file + ".bpel";
		}
	},
	
	
	/**
	 * Opens a download window for downloading the given content.
	 * 
	 * Creates a submit form to send the contents to the 
	 * Oryx Legacy File Download Servlet (MultiDownloader).
	 * 
	 * @param {Object} content The content to be downloaded. If it is a zip 
	 *                         file, then this should be an array of contents.
	 * @param {Object} zip     True, if it is a zip file, false otherwise
	 */
	openDownloadWindow: function(content, zip) {
		var win = window.open("");
		if (win != null) {
			win.document.open();
			win.document.write("<html><body>");
			var submitForm = win.document.createElement("form");
			win.document.body.appendChild(submitForm);
			
			if (zip) {
				for (var i = 0; i < content.length; i++) {
					var file = this.addFileExtension(content[i].get("file"));
					submitForm.appendChild( this.createHiddenElement("download_" + i, content[i].get("result")));
					submitForm.appendChild( this.createHiddenElement("file_" + i, file));
				}
			} else {
				var file = this.addFileExtension(content.get("file"));
				submitForm.appendChild( this.createHiddenElement("download", content.get("result")));
				submitForm.appendChild( this.createHiddenElement("file", file));
			}
			
			submitForm.method = "POST";
			win.document.write("</body></html>");
			win.document.close();
			submitForm.action= "download";
			submitForm.submit();
		}		
	},
	
		
	/**
	 * Determines if the result is an XML file or not.
	 * For this purpose it is determined if the given
	 * result starts with "<?xml".
	 * 
	 * @param {Object} result The result to be checked.
	 * @return "success" if it is an XML file, "error" otherwise
	 */
	getResultInfo: function(result) {
		if (!result) {
			return "error";
		} else if (result.substr(0, 5) == "<?xml") {
			return "success";
		}
		
		return "error";
	},

	
	/**
	 * Determines the process name for a given process
	 * string. 
	 * 
	 * @param {String} process The BPEL4Chor process.
	 */
	getProcessName: function(process) {
		var parser	= new DOMParser();
		var doc		= parser.parseFromString(process,"text/xml");
		var name 	= doc.documentElement.getAttribute("name");
		return name;
	}
}

ORYX.Plugins.TransformationDownloadDialog = Clazz.extend(ORYX.Plugins.TransformationDownloadDialog);
/**
 * Copyright (c) 2008
 * Willi Tscheschner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.TreeGraphSupport = Clazz.extend({

    facade: undefined,
    
	/**
	 * 
	 * @param {Object} facade
	 */
    construct: function(facade){
        
		// Save the facade
		this.facade = facade;
        
		// Offer new functionality
        this.facade.offer({
            'name'				: ORYX.I18N.TreeGraphSupport.syntaxCheckName,
            'functionality'		: this.syntaxCheck.bind(this),
            'group'				: ORYX.I18N.TreeGraphSupport.group,
            'icon'				: ORYX.PATH + "images/checker_syntax.png",
            'description'		: ORYX.I18N.TreeGraphSupport.syntaxCheckDesc,
            'index'				: 1,
            'minShape'			: 0,
            'maxShape'			: 0
        });
        
    },
    
	/**
	 * 
	 */
    syntaxCheck: function() {
		this.facade.raiseEvent({
			type: 			ORYX.CONFIG.EVENT_OVERLAY_HIDE,
			id: 			"treegraph",
		});
		
		
         // Send the request to the server.
        new Ajax.Request(ORYX.CONFIG.TREEGRAPH_SUPPORT, {
            method: 'POST',
            asynchronous: false,
            parameters: {
                data: this.facade.getERDF()
            },
            onSuccess: function(request){
            	var resp = request.responseText.evalJSON();

				if (resp instanceof Array ) {
					if (resp.length > 0) {
					
						// Get all Valid ResourceIDs and collect all shapes
						resp.each(function( value ){ 
						
							var sh = this.facade.getCanvas().getChildShapeByResourceId( value );

							if( sh ){
								
								this.highlightShape(sh);
								
							}
						}.bind(this));
					}
				}
	            Ext.Msg.show({
	            	title	: 'Oryx',
	            	msg		: request.responseText,
	            	icon		: Ext.MessageBox.INFO
	            });
            }.bind(this),
            	

                        
			onFailure: function(request){
            	Ext.Msg.show({
				   title	: 'Oryx',
				   msg		: 'An error occurs while sending request!',
				   icon		: Ext.MessageBox.WARNING
				});
            }
        });

    },
    
	highlightShape: function(shape){
		// Creates overlay for an enabled shape
		// display is beeing ignored
		if(!(shape instanceof ORYX.Core.Shape)) return;
		
		var attr;
		if(shape instanceof ORYX.Core.Edge) {
			attr = {stroke: "red"};
		}
		else {
			attr = {fill: "red", stroke:"black", "stroke-width": 2};
		}
		
		

											
		this.facade.raiseEvent({
				type: 			ORYX.CONFIG.EVENT_OVERLAY_SHOW,
				id: 			"treegraph",
				shapes: 		[shape],
				attributes: 	attr,
			});
	}
});

/**
 * Copyright (c) 2008, Kai Schlichting
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/
if (!ORYX.Plugins) 
    ORYX.Plugins = new Object();

ORYX.Plugins.Validator = Clazz.extend({
    construct: function(facade){
        this.facade = facade;
        
        this.active = false;
        this.raisedEventIds = [];
        
        this.facade.offer({
            'name': ORYX.I18N.Validator.name,
            'functionality': this.load.bind(this),
            'group': "Verification",
            'icon': ORYX.PATH + "images/checker_validation.png",
            'description': ORYX.I18N.Validator.description,
            'index': 1,
            'toggle': true,
            'minShape': 0,
            'maxShape': 0
        });
    },
    
    load: function(button, pressed){
        if (!pressed) {
            this.hideOverlays();
            this.active = !this.active;
        }
        else {
            this.validate();
        }
    },
    
    hideOverlays: function(){
        this.raisedEventIds.each(function(id){
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_OVERLAY_HIDE,
                id: id
            });
        }
.bind(this));
        
        this.raisedEventIds = [];
    },
    
    getRdf: function(){
        // Force to set all resource IDs
        var serializedDOM = DataManager.serializeDOM(this.facade);
        
        //add namespaces
        serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml" ' +
        'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
        'xmlns:ext="http://b3mn.org/2007/ext" ' +
        'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
        'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
        '<head profile="http://purl.org/NET/erdf/profile">' +
        '<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
        '<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
        '<link rel="schema.b3mn" href="http://b3mn.org" />' +
        '<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
        '<link rel="schema.raziel" href="http://raziel.org/" />' +
        '<base href="' +
        location.href.split("?")[0] +
        '" />' +
        '</head><body>' +
        serializedDOM +
        '</body></html>';
        
        //convert to RDF
        var parser = new DOMParser();
        var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
        var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
        var xsltProcessor = new XSLTProcessor();
        var xslRef = document.implementation.createDocument("", "", null);
        xslRef.async = false;
        xslRef.load(xsltPath);
        xsltProcessor.importStylesheet(xslRef);
        
        var rdf = xsltProcessor.transformToDocument(parsedDOM);
        var serialized_rdf = (new XMLSerializer()).serializeToString(rdf);
        
        return serialized_rdf;
    },
    
    validate: function(){
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE,
            text: ORYX.I18N.Validator.checking
        });
      
        // Send the request to the server.
        new Ajax.Request(ORYX.CONFIG.VALIDATOR_URL, {
            method: 'POST',
            asynchronous: false,
            parameters: {
                resource: location.href,
                data: this.getRdf()
            },
            onSuccess: function(request){
                var result = Ext.decode(request.responseText);
                
                // This should be implemented by child instances of validator 
                this.handleValidationResponse(result);
                
                this.facade.raiseEvent({
                    type: ORYX.CONFIG.EVENT_LOADING_DISABLE
                });
            }
.bind(this),
            onFailure: function(){
                this.facade.raiseEvent({
                    type: ORYX.CONFIG.EVENT_LOADING_DISABLE
                });
            }.bind(this)
        });
    },
    
    showOverlay: function(shape, errorMsg){
    
        var id = "syntaxchecker." + this.raisedEventIds.length;
        
        var cross = ORYX.Editor.graft("http://www.w3.org/2000/svg", null, ['path', {
            "title": errorMsg,
            "stroke-width": 5.0,
            "stroke": "red",
            "d": "M20,-5 L5,-20 M5,-5 L20,-20",
            "line-captions": "round"
        }]);
        
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_OVERLAY_SHOW,
            id: id,
            shapes: [shape],
            node: cross,
            nodePosition: shape instanceof ORYX.Core.Edge ? "START" : "NW"
        });
        
        this.raisedEventIds.push(id);
        
        return cross;
    }
});

ORYX.Plugins.BPMNValidator = Ext.extend(ORYX.Plugins.Validator, {
    handleValidationResponse: function(result){
        var conflictingNodes = result.conflictingNodes;
        var leadsToEnd = result.leadsToEnd;
        
        if (!leadsToEnd) {
            Ext.Msg.alert("Oryx", "The process will never reach a final state!");
        }
        else if (conflictingNodes.size() > 0) {
            conflictingNodes.each(function(node){
                sh = this.facade.getCanvas().getChildShapeByResourceId(node.id);
                if (sh) {
                    this.showOverlay(sh, "Some following pathes will never reach a final state!");
                }
            }
.bind(this));
            this.active = !this.active;
        }
        else {
            Ext.Msg.alert("Oryx", "No validation errors found!")
        }
    }
});

ORYX.Plugins.EPCValidator = Ext.extend(ORYX.Plugins.Validator, {
  getLabelOfShape: function(node){
    if(node.properties["oryx-title"] === ""){
      return node.id;
    } else {
      return node.properties["oryx-title"];
    }
  },
  findShapeById: function(id){
    return this.facade.getCanvas().getChildShapeByResourceId(id);
  },
  
    handleValidationResponse: function(result){
      //TODO use Ext XTemplate
        var isSound = result.isSound;
        var badStartArcs = result.badStartArcs;
        var badEndArcs = result.badEndArcs;
        var goodInitialMarkings = result.goodInitialMarkings;
        var goodFinalMarkings = result.goodFinalMarkings;
        
        var message = "";
        
        if (isSound) {
          message += "<p><b>The EPC is sound, no problems found!</b></p>";
        } else {
          message += "<p><b>The EPC is <i>NOT</i> sound!</b></p>";
        }
        
        message += "<hr />";
        
        var arrayOfArraysToMessage = function(arrayOfArrays, formatter){
          var message = "<ul>"
          arrayOfArrays.each(function(array){
            message += "<li> - ";
            array.each(function(element){
              message += '"' + formatter(element) + '" ';
            });
            message += "</li>";
          });
          message += "</ul>";
          return message;
        }
        var arrayToMessage = function(array, formatter){
          var message = "<ul>"
          array.each(function(element){
            message += "<li> - " + formatter(element) + "</li>";
          });
          message += "</ul>";
          return message;
        }
        
        message += "<p>There are "+ goodInitialMarkings.length +" initial markings which does not run into a deadlock.</p>";
        message += arrayOfArraysToMessage(goodInitialMarkings, function(arc){
          return this.getLabelOfShape(this.findShapeById(arc.id).getIncomingShapes()[0]);
        }.createDelegate(this));
        message += "<p>The initial markings do not include "+ badStartArcs.length +" start nodes.</p>";
        message += arrayToMessage(badStartArcs, function(arc){
          return this.getLabelOfShape(this.findShapeById(arc.id).getIncomingShapes()[0]);
        }.createDelegate(this));
        
        message += "<hr />";
        
        message += "<p>There are "+ goodFinalMarkings.length +" final markings which can be reached from the initial markings.</p>";
        message += arrayOfArraysToMessage(goodFinalMarkings, function(arc){
          return this.getLabelOfShape(this.findShapeById(arc.id).getOutgoingShapes()[0]);
        }.createDelegate(this));
        message += "<p>The final markings do not include "+ badEndArcs.length +" end nodes.</p>";
        message += arrayToMessage(badEndArcs, function(arc){
          return this.getLabelOfShape(this.findShapeById(arc.id).getOutgoingShapes()[0]);
        }.createDelegate(this))
        
        message += "<hr />";
        
        message += "<p><i>Remark: Set titles of functions and events to get some nicer output (names instead of ids)</i></p>"
        
        Ext.Msg.alert('Validation Result', message);
    }
});/**
 * Copyright (c) 2008
 * Jan-Felix Schwarz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.XFormsExport = Clazz.extend({
	
	CSS_URL: "http://oryx-editor.org/oryx/css/xforms_default.css",

	facade: undefined,

	construct: function(facade) {
		this.facade = facade;

		this.facade.offer({
			'name':ORYX.I18N.XFormsSerialization.exportXForms,
			'functionality': this.exportIt.bind(this),
			'group': ORYX.I18N.XFormsSerialization.group,
			'icon': ORYX.PATH + "images/xforms_export.png",
			'description': ORYX.I18N.XFormsSerialization.exportXFormsDesc,
			'index': 1,
			'minShape': 0,
			'maxShape': 0});
	},

	exportIt: function(){

		// raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
		
		//this.checkClientXFormsSupport();
            
		// asynchronously ...
        window.setTimeout((function(){
			
			// ... save synchronously
            this.exportSynchronously();
			
			// raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
			
        }).bind(this), 10);

		return true;
    },

    exportSynchronously: function() {

        var resource = location.href;
		
		//get current DOM content
		var serializedDOM = DataManager.__persistDOM(this.facade);
		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';
		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf 	= (new XMLSerializer()).serializeToString(rdf);
			serialized_rdf 		= serialized_rdf.startsWith("<?xml") ? serialized_rdf : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;

			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.XFORMS_EXPORT_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: resource,
					data: serialized_rdf,
					css: this.CSS_URL
				},
				onSuccess: function(request){
					
						var win = window.open("data:text/xml," +
								request.responseText, 
								"_blank", 
								"resizable=yes,width=640,height=480,toolbar=0,scrollbars=yes");
						
				}
			});
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}
	},
	
	checkClientXFormsSupport: function() {
		if(!clientSupportsXForms) {
			
			var output = ORYX.I18N.XFormsSerialization.noClientXFormsSupportDesc;

			var win = new Ext.Window({
                            width: 320,
                            height: 240,
                            resizable: false,
                            minimizable: false,
                            modal: true,
                            autoScroll: true,
                            title: ORYX.I18N.XFormsSerialization.noClientXFormsSupport,
                            html: output,
                            buttons: [{
                                text: ORYX.I18N.XFormsSerialization.ok,
                                handler: function(){
                                    win.hide();
                                }
                            }]
                        });
        	win.show();
			
		}
	}

});

/**
 * Copyright (c) 2008
 * Jan-Felix Schwarz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

if(!ORYX.Plugins)
	ORYX.Plugins = new Object();

ORYX.Plugins.XFormsExportOrbeon = Clazz.extend({
	
	CSS_URL: "http://localhost:8081/oryx/css/xforms_orbeon.css",

	facade: undefined,

	construct: function(facade) {
		this.facade = facade;

		this.facade.offer({
			'name':ORYX.I18N.XFormsSerialization.exportXForms,
			'functionality': this.exportIt.bind(this),
			'group': ORYX.I18N.XFormsSerialization.group,
			'icon': ORYX.PATH + "images/xforms_export.png",
			'description': 'XForms export for Orbeon',
			'index': 1,
			'minShape': 0,
			'maxShape': 0});
	},

	exportIt: function(){

		// raise loading enable event
        this.facade.raiseEvent({
            type: ORYX.CONFIG.EVENT_LOADING_ENABLE
        });
		
		//this.checkClientXFormsSupport();
            
		// asynchronously ...
        window.setTimeout((function(){
			
			// ... save synchronously
            this.exportSynchronously();
			
			// raise loading disable event.
            this.facade.raiseEvent({
                type: ORYX.CONFIG.EVENT_LOADING_DISABLE
            });
			
        }).bind(this), 10);

		return true;
    },

    exportSynchronously: function() {

        var resource = location.href;
		
		//get current DOM content
		var serializedDOM = DataManager.__persistDOM(this.facade);
		//add namespaces
		serializedDOM = '<?xml version="1.0" encoding="utf-8"?>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" ' +
		'xmlns:b3mn="http://b3mn.org/2007/b3mn" ' +
		'xmlns:ext="http://b3mn.org/2007/ext" ' +
		'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
		'xmlns:atom="http://b3mn.org/2007/atom+xhtml">' +
		'<head profile="http://purl.org/NET/erdf/profile">' +
		'<link rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />' +
		'<link rel="schema.dcTerms" href="http://purl.org/dc/terms/ " />' +
		'<link rel="schema.b3mn" href="http://b3mn.org" />' +
		'<link rel="schema.oryx" href="http://oryx-editor.org/" />' +
		'<link rel="schema.raziel" href="http://raziel.org/" />' +
		'<base href="' +
		location.href.split("?")[0] +
		'" />' +
		'</head><body>' +
		serializedDOM +
		'</body></html>';
		//convert to RDF
		var parser = new DOMParser();
		var parsedDOM = parser.parseFromString(serializedDOM, "text/xml");
		var xsltPath = ORYX.PATH + "lib/extract-rdf.xsl";
		var xsltProcessor = new XSLTProcessor();
		var xslRef = document.implementation.createDocument("", "", null);
		xslRef.async = false;
		xslRef.load(xsltPath);
		xsltProcessor.importStylesheet(xslRef);
		try {
			var rdf = xsltProcessor.transformToDocument(parsedDOM);
			var serialized_rdf 	= (new XMLSerializer()).serializeToString(rdf);
			serialized_rdf 		= serialized_rdf.startsWith("<?xml") ? serialized_rdf : "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + serialized_rdf;

			// Send the request to the server.
			new Ajax.Request(ORYX.CONFIG.XFORMS_EXPORT_ORBEON_URL, {
				method: 'POST',
				asynchronous: false,
				parameters: {
					resource: resource,
					data: serialized_rdf,
					css: this.CSS_URL
				},
				onSuccess: function(request){
					
						var win = window.open("");
						win.document.write(request.responseText);
						
				},
				onFailure: function(request){
					var win = window.open("");
					win.document.write(request.responseText);
				}
			});
			
		} catch (error){
			this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
			Ext.Msg.alert("Oryx", error);
	 	}
	},
	
	checkClientXFormsSupport: function() {
		if(!clientSupportsXForms) {
			
			var output = ORYX.I18N.XFormsSerialization.noClientXFormsSupportDesc;

			var win = new Ext.Window({
                            width: 320,
                            height: 240,
                            resizable: false,
                            minimizable: false,
                            modal: true,
                            autoScroll: true,
                            title: ORYX.I18N.XFormsSerialization.noClientXFormsSupport,
			
		}
	}


