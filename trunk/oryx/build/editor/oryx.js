XMLNS={ATOM:"http://www.w3.org/2005/Atom",XHTML:"http://www.w3.org/1999/xhtml",ERDF:"http://purl.org/NET/erdf/profile",RDFS:"http://www.w3.org/2000/01/rdf-schema#",RDF:"http://www.w3.org/1999/02/22-rdf-syntax-ns#",RAZIEL:"http://b3mn.org/Raziel",SCHEMA:""};
var Kickstart={started:false,callbacks:[],alreadyLoaded:[],PATH:"",load:function(){
Kickstart.kick();
},kick:function(){
if(!Kickstart.started){
Kickstart.started=true;
Kickstart.callbacks.each(function(_1){
window.setTimeout(_1,1);
});
}
},register:function(_2){
with(Kickstart){
if(started){
window.setTimeout(_2,1);
}else{
Kickstart.callbacks.push(_2);
}
}
},require:function(_3){
if(Kickstart.alreadyLoaded.member(_3)){
return false;
}
return Kickstart.include(_3);
},include:function(_4){
var _5=document.getElementsByTagNameNS(XMLNS.XHTML,"head")[0];
var s=document.createElementNS(XMLNS.XHTML,"script");
s.setAttributeNS(XMLNS.XHTML,"type","text/javascript");
s.src=Kickstart.PATH+_4;
_5.appendChild(s);
Kickstart.alreadyLoaded.push(_4);
return true;
}};
Event.observe(window,"load",Kickstart.load);
var ERDF={LITERAL:1,RESOURCE:2,DELIMITERS:[".","-"],HASH:"#",HYPHEN:"-",schemas:[],callback:undefined,log:undefined,init:function(_7){
ERDF.callback=_7;
ERDF.registerSchema("schema",XMLNS.SCHEMA);
ERDF.registerSchema("rdfs",XMLNS.RDFS);
},run:function(){
return ERDF._checkProfile()&&ERDF.parse();
},parse:function(){
ERDF.__startTime=new Date();
var _8=document.getElementsByTagNameNS(XMLNS.XHTML,"body");
var _9={type:ERDF.RESOURCE,value:""};
var _a=ERDF._parseDocumentMetadata()&&ERDF._parseFromTag(_8[0],_9);
ERDF.__stopTime=new Date();
var _b=(ERDF.__stopTime-ERDF.__startTime)/1000;
return _a;
},_parseDocumentMetadata:function(){
var _c=document.getElementsByTagNameNS(XMLNS.XHTML,"head");
var _d=_c[0].getElementsByTagNameNS(XMLNS.XHTML,"link");
var _e=_c[0].getElementsByTagNameNS(XMLNS.XHTML,"meta");
$A(_d).each(function(_f){
var _10=_f.getAttribute("rel");
var _11=_f.getAttribute("rev");
var _12=_f.getAttribute("href");
ERDF._parseTriplesFrom(ERDF.RESOURCE,"",_10,ERDF.RESOURCE,_12);
ERDF._parseTriplesFrom(ERDF.RESOURCE,_12,_11,ERDF.RESOURCE,"");
});
$A(_e).each(function(_13){
var _14=_13.getAttribute("name");
var _15=_13.getAttribute("content");
ERDF._parseTriplesFrom(ERDF.RESOURCE,"",_14,ERDF.LITERAL,_15);
});
return true;
},_parseFromTag:function(_16,_17,_18){
if(_16.namespaceURI!=XMLNS.XHTML){
return;
}
if(!_18){
_18=0;
}
var id=_16.getAttribute("id");
if(_16.nodeName.endsWith(":a")||_16.nodeName=="a"){
var _1a=_16.getAttribute("rel");
var _1b=_16.getAttribute("rev");
var _1c=_16.getAttribute("href");
var _1d=_16.getAttribute("title");
var _1e=_16.textContent;
ERDF._parseTriplesFrom(_17.type,_17.value,_1a,ERDF.RESOURCE,_1c,function(_1f){
var _20=_1d?_1d:_1e;
ERDF._parseTriplesFrom(_1f.object.type,_1f.object.value,"rdfs.label",ERDF.LITERAL,_20);
});
ERDF._parseTriplesFrom(_17.type,_17.value,_1b,ERDF.RESOURCE,"");
ERDF._parseTypeTriplesFrom(_17.type,_17.value,_1a);
}else{
if(_16.nodeName.endsWith(":img")||_16.nodeName=="img"){
var _1a=_16.getAttribute("class");
var _1c=_16.getAttribute("src");
var alt=_16.getAttribute("alt");
ERDF._parseTriplesFrom(_17.type,_17.value,_1a,ERDF.RESOURCE,_1c,function(_22){
var _23=alt;
ERDF._parseTriplesFrom(_22.object.type,_22.object.value,"rdfs.label",ERDF.LITERAL,_23);
});
}
}
var _1a=_16.getAttribute("class");
var _1d=_16.getAttribute("title");
var _1e=_16.textContent;
var _24=_1d?_1d:_1e;
ERDF._parseTriplesFrom(_17.type,_17.value,_1a,ERDF.LITERAL,_24);
if(id){
_17={type:ERDF.RESOURCE,value:ERDF.HASH+id};
}
ERDF._parseTypeTriplesFrom(_17.type,_17.value,_1a);
var _25=_16.childNodes;
if(_25){
$A(_25).each(function(_26){
if(_26.nodeType==_26.ELEMENT_NODE){
ERDF._parseFromTag(_26,_17,_18+1);
}
});
}
},_parseTriplesFrom:function(_27,_28,_29,_2a,_2b,_2c){
if(!_29){
return;
}
_29.toLowerCase().split(" ").each(function(_2d){
var _2e=ERDF.schemas.find(function(_2f){
return false||ERDF.DELIMITERS.find(function(_30){
return _2d.startsWith(_2f.prefix+_30);
});
});
if(_2e&&_2b){
_2d=_2d.substring(_2e.prefix.length+1,_2d.length);
var _31=ERDF.registerTriple(new ERDF.Resource(_28),{prefix:_2e.prefix,name:_2d},(_2a==ERDF.RESOURCE)?new ERDF.Resource(_2b):new ERDF.Literal(_2b));
if(_2c){
_2c(_31);
}
}
});
},_parseTypeTriplesFrom:function(_32,_33,_34,_35){
if(!_34){
return;
}
_34.toLowerCase().split(" ").each(function(_36){
var _37=ERDF.schemas.find(function(_38){
return false||ERDF.DELIMITERS.find(function(_39){
return _36.startsWith(ERDF.HYPHEN+_38.prefix+_39);
});
});
if(_37&&_33){
_36=_36.substring(_37.prefix.length+2,_36.length);
var _3a=ERDF.registerTriple((_32==ERDF.RESOURCE)?new ERDF.Resource(_33):new ERDF.Literal(_33),{prefix:"rdf",name:"type"},new ERDF.Resource(_37.namespace+_36));
if(_35){
_35(_3a);
}
}
});
},_checkProfile:function(){
var _3b=document.getElementsByTagNameNS(XMLNS.XHTML,"head");
var _3c=_3b[0].getAttribute("profile");
var _3d=false;
if(_3c&&_3c.split(" ").member(XMLNS.ERDF)){
return true;
}else{
return false;
}
},__stripHashes:function(s){
return (s&&s.substring(0,1)=="#")?s.substring(1,s.length):s;
},registerSchema:function(_3f,_40){
ERDF.schemas.push({prefix:_3f,namespace:_40});
},registerTriple:function(_41,_42,_43){
if(_42.prefix.toLowerCase()=="schema"){
this.registerSchema(_42.name,_43.value);
}
var _44=new ERDF.Triple(_41,_42,_43);
ERDF.callback(_44);
return _44;
},__enhanceObject:function(){
this.isResource=function(){
return this.type==ERDF.RESOURCE;
};
this.isLocal=function(){
return this.isResource()&&this.value.startsWith("#");
};
this.isCurrentDocument=function(){
return this.isResource()&&(this.value=="");
};
this.getId=function(){
return this.isLocal()?ERDF.__stripHashes(this.value):false;
};
this.isLiteral=function(){
return this.type==ERDF.LIITERAL;
};
},serialize:function(_45){
if(!_45){
return "";
}else{
if(_45.constructor==String){
return _45;
}else{
if(_45.constructor==Boolean){
return _45?"true":"false";
}else{
return _45.toString();
}
}
}
}};
ERDF.Triple=function(_46,_47,_48){
this.subject=_46;
this.predicate=_47;
this.object=_48;
this.toString=function(){
return "[ERDF.Triple] "+this.subject.toString()+" "+this.predicate.prefix+":"+this.predicate.name+" "+this.object.toString();
};
};
ERDF.Resource=function(uri){
this.type=ERDF.RESOURCE;
this.value=uri;
ERDF.__enhanceObject.apply(this);
this.toString=function(){
return "&lt;"+this.value+"&gt;";
};
};
ERDF.Literal=function(_4a){
this.type=ERDF.LITERAL;
this.value=ERDF.serialize(_4a);
ERDF.__enhanceObject.apply(this);
this.toString=function(){
return "\""+this.value+"\"";
};
};
var USE_ASYNCHRONOUS_REQUESTS=true;
var DISCARD_UNUSED_TRIPLES=true;
var PREFER_SPANS_OVER_DIVS=true;
var PREFER_TITLE_OVER_TEXTNODE=false;
var RESOURCE_ID_PREFIX="resource";
var SHOW_DEBUG_ALERTS_WHEN_SAVING=false;
var SHOW_EXTENDED_DEBUG_INFORMATION=false;
var USE_ARESS_WORKAROUNDS=true;
var RESOURCE_CREATED=1;
var RESOURCE_REMOVED=2;
var RESOURCE_SAVED=4;
var RESOURCE_RELOADED=8;
var RESOURCE_SYNCHRONIZED=16;
var TRIPLE_REMOVE=1;
var TRIPLE_ADD=2;
var TRIPLE_RELOAD=4;
var TRIPLE_SAVE=8;
var PROCESSDATA_REF="processdata";
var DataManager={init:function(){
ERDF.init(DataManager._registerTriple);
DataManager.__synclocal();
},_triples:[],_registerTriple:function(_4b){
DataManager._triples.push(_4b);
},__synclocal:function(){
DataManager._triples=[];
ERDF.run();
},__synchronizeShape:function(_4c){
var r=ResourceManager.getResource(_4c.resourceId);
var _4e=_4c.serialize();
_4e.each(function(ser){
var _50=(ser.type=="resource");
var _51=new ERDF.Triple(new ERDF.Resource(_4c.resourceId),{prefix:ser.prefix,name:ser.name},_50?new ERDF.Resource(ser.value):new ERDF.Literal(ser.value));
DataManager.setObject(_51);
});
return r;
},__storeShape:function(_52){
var _53=DataManager.__synchronizeShape(_52);
_53.save();
},__forceExistance:function(_54){
if(!$(_54.resourceId)){
if(!$$("."+PROCESSDATA_REF)[0]){
DataManager.graft(XMLNS.XHTML,document.getElementsByTagNameNS(XMLNS.XHTML,"body").item(0),["div",{"class":PROCESSDATA_REF,"style":"display:none;"}]);
}
DataManager.graft(XMLNS.XHTML,$$("."+PROCESSDATA_REF)[0],["div",{"id":_54.resourceId}]);
}else{
var _55=$(_54.resourceId);
var _56=$A(_55.childNodes);
_56.each(function(_57){
_55.removeChild(_57);
});
}
},__persistShape:function(_58){
var _59=_58.serialize();
var _5a=[];
var _5b=new ERDF.Resource(_58.resourceId);
DataManager.removeTriples(DataManager.query(_5b,undefined,undefined));
_59.each(function(_5c){
var _5d=(_5c.type=="resource")?new ERDF.Resource(_5c.value):new ERDF.Literal(_5c.value);
DataManager.addTriple(new ERDF.Triple(_5b,{prefix:_5c.prefix,name:_5c.name},_5d));
});
},__persistDOM:function(_5e){
var _5f=_5e.getCanvas();
var _60=_5f.getChildShapes(true);
var _61="";
_60.each(function(_62){
DataManager.__forceExistance(_62);
});
DataManager.__renderCanvas(_5e);
_61+=DataManager.serialize($(ERDF.__stripHashes(_5e.getCanvas().resourceId)),true);
_60.each(function(_63){
DataManager.__persistShape(_63);
_61+=DataManager.serialize($(ERDF.__stripHashes(_63.resourceId)),true);
});
return _61;
},__renderCanvas:function(_64){
var _65=_64.getCanvas();
var _66=_64.getStencilSets();
var _67=_65.getChildShapes(true);
DataManager.__forceExistance(_65);
DataManager.__persistShape(_65);
var _68=new ERDF.Resource(_65.resourceId);
DataManager.removeTriples(DataManager.query(_68,undefined,undefined));
DataManager.addTriple(new ERDF.Triple(_68,{prefix:"oryx",name:"mode"},new ERDF.Literal("writable")));
DataManager.addTriple(new ERDF.Triple(_68,{prefix:"oryx",name:"mode"},new ERDF.Literal("fullscreen")));
_66.values().each(function(_69){
DataManager.addTriple(new ERDF.Triple(_68,{prefix:"oryx",name:"stencilset"},new ERDF.Resource(_69.source())));
_69.extensions().keys().each(function(_6a){
DataManager.addTriple(new ERDF.Triple(_68,{prefix:"oryx",name:"ssextension"},new ERDF.Literal(_6a)));
});
});
_67.each(function(_6b){
DataManager.addTriple(new ERDF.Triple(_68,{prefix:"oryx",name:"render"},new ERDF.Resource("#"+_6b.resourceId)));
});
},__counter:0,__provideId:function(){
while($(RESOURCE_ID_PREFIX+DataManager.__counter)){
DataManager.__counter++;
}
return RESOURCE_ID_PREFIX+DataManager.__counter;
},serializeDOM:function(_6c){
return DataManager.__persistDOM(_6c);
},syncGlobal:function(_6d){
return DataManager.__syncglobal(_6d);
},__syncglobal:function(_6e){
var _6f=_6e.getCanvas();
var _70=_6f.getChildShapes(true);
_70.select(function(_71){
return !($(_71.resourceId));
}).each(function(_72){
if(USE_ARESS_WORKAROUNDS){
var _73=_72.properties["raziel-type"];
var div="<div xmlns=\"http://www.w3.org/1999/xhtml\">"+"<span class=\"raziel-type\">"+_73+"</span></div>";
var r=ResourceManager.__createResource(div);
_72.resourceId=r.id();
}else{
var r=ResourceManager.__createResource();
_72.resourceId=r.id();
}
});
_70.each(function(_76){
DataManager.__storeShape(_76);
});
},serialize:function(_77,_78){
if(_77.nodeType==_77.ELEMENT_NODE){
var _79=$A(_77.childNodes);
var _7a=$A(_77.attributes);
var _7b=new String(_77.getAttribute("class"));
var _7c=_7b.split(" ").member("transient");
if(_7c){
return "";
}
var _7d="<"+_77.nodeName;
if(!_78){
_7d+=" xmlns=\""+(_77.namespaceURI?_77.namespaceURI:XMLNS.XHTML)+"\" xmlns:oryx=\"http://oryx-editor.org\"";
}
_7a.each(function(_7e){
_7d+=" "+_7e.nodeName+"=\""+_7e.nodeValue+"\"";
});
if(_79.length==0){
_7d+="/>";
}else{
_7d+=">";
_79.each(function(_7f){
_7d+=DataManager.serialize(_7f,true);
});
_7d+="</"+_77.nodeName+">";
}
return _7d;
}else{
if(_77.nodeType==_77.TEXT_NODE){
return _77.nodeValue;
}
}
},addTriple:function(_80){
if(!_80.subject.type==ERDF.LITERAL){
throw "Cannot add the triple "+_80.toString()+" because the subject is not a resource.";
}
var _81=ERDF.__stripHashes(_80.subject.value);
var _82=$(_81);
if(!_82){
throw "Cannot add the triple "+_80.toString()+" because the subject \""+_81+"\" is not in the document.";
}
if(_80.object.type==ERDF.LITERAL){
DataManager.graft(XMLNS.XHTML,_82,["span",{"class":(_80.predicate.prefix+"-"+_80.predicate.name)},_80.object.value.escapeHTML()]);
}else{
DataManager.graft(XMLNS.XHTML,_82,["a",{"rel":(_80.predicate.prefix+"-"+_80.predicate.name),"href":_80.object.value}]);
}
return true;
},removeTriples:function(_83){
var _84=_83.select(function(_85){
return DataManager.__removeTriple(_85);
});
return _84;
},removeTriple:function(_86){
var _87=DataManager.__removeTriple(_86);
return _87;
},__removeTriple:function(_88){
if(!_88.subject.type==ERDF.LITERAL){
throw "Cannot remove the triple "+_88.toString()+" because the subject is not a resource.";
}
var _89=ERDF.__stripHashes(_88.subject.value);
var _8a=$(_89);
if(!_8a){
throw "Cannot remove the triple "+_88.toString()+" because the subject is not in the document.";
}
if(_88.object.type==ERDF.LITERAL){
var _8b=DataManager.__removeTripleRecursively(_88,_8a);
return _8b;
}
},__removeTripleRecursively:function(_8c,_8d){
if(_8d.nodeType!=_8d.ELEMENT_NODE){
return false;
}
var _8e=new String(_8d.getAttribute("class"));
var _8f=$A(_8d.childNodes);
if(_8e.include(_8c.predicate.prefix+"-"+_8c.predicate.name)){
var _90=_8d.textContent;
if((_8c.object.type==ERDF.LITERAL)&&(_8c.object.value==_90)){
_8d.parentNode.removeChild(_8d);
}
return true;
}else{
_8f.each(function(_91){
DataManager.__removeTripleRecursively(_8c,_91);
});
return false;
}
},graft:function(_92,_93,t,doc){
doc=(doc||(_93&&_93.ownerDocument)||document);
var e;
if(t===undefined){
echo("Can't graft an undefined value");
}else{
if(t.constructor==String){
e=doc.createTextNode(t);
}else{
for(var i=0;i<t.length;i++){
if(i===0&&t[i].constructor==String){
var _98=t[i].match(/^([a-z][a-z0-9]*)\.([^\s\.]+)$/i);
if(_98){
e=doc.createElementNS(_92,_98[1]);
e.setAttributeNS(null,"class",_98[2]);
continue;
}
_98=t[i].match(/^([a-z][a-z0-9]*)$/i);
if(_98){
e=doc.createElementNS(_92,_98[1]);
continue;
}
e=doc.createElementNS(_92,"span");
e.setAttribute(null,"class","namelessFromLOL");
}
if(t[i]===undefined){
echo("Can't graft an undefined value in a list!");
}else{
if(t[i].constructor==String||t[i].constructor==Array){
this.graft(_92,e,t[i],doc);
}else{
if(t[i].constructor==Number){
this.graft(_92,e,t[i].toString(),doc);
}else{
if(t[i].constructor==Object){
for(var k in t[i]){
e.setAttributeNS(null,k,t[i][k]);
}
}else{
if(t[i].constructor==Boolean){
this.graft(_92,e,t[i]?"true":"false",doc);
}else{
throw "Object "+t[i]+" is inscrutable as an graft arglet.";
}
}
}
}
}
}
}
}
if(_93){
_93.appendChild(e);
}
return Element.extend(e);
},setObject:function(_9a){
var _9b=DataManager.query(_9a.subject,_9a.predicate,undefined);
DataManager.removeTriples(_9b);
DataManager.addTriple(_9a);
return true;
},query:function(_9c,_9d,_9e){
return DataManager._triples.select(function(_9f){
var _a0=((_9c)?(_9f.subject.type==_9c.type)&&(_9f.subject.value==_9c.value):true);
if(_9d){
_a0=_a0&&((_9d.prefix)?(_9f.predicate.prefix==_9d.prefix):true);
_a0=_a0&&((_9d.name)?(_9f.predicate.name==_9d.name):true);
}
_a0=_a0&&((_9e)?(_9f.object.type==_9e.type)&&(_9f.object.value==_9e.value):true);
return _a0;
});
}};
Kickstart.register(DataManager.init);
function assert(_a1,m){
if(!_a1){
throw m;
}
}
function DMCommand(_a3,_a4){
this.action=_a3;
this.triple=_a4;
this.toString=function(){
return "Command("+_a3+", "+_a4+")";
};
}
function DMCommandHandler(_a5){
this.__setNext=function(_a6){
var _a7=this.__next;
this.__next=_a5;
return _a7?_a7:true;
};
this.__setNext(_a5);
this.__invokeNext=function(_a8){
return this.__next?this.__next.handle(_a8):false;
};
this.handle=function(_a9){
return this.process(_a9)?true:this.__invokeNext(_a9);
};
this.process=function(_aa){
return false;
};
}
function MetaTagHandler(_ab){
DMCommandHandler.apply(this,[_ab]);
this.process=function(_ac){
with(_ac.triple){
if(!((subject instanceof ERDF.Resource)&&(subject.isCurrentDocument())&&(object instanceof ERDF.Literal))){
return false;
}
}
};
}
var chain=new MetaTagHandler();
var command=new DMCommand(TRIPLE_ADD,new ERDF.Triple(new ERDF.Resource(""),"rdf:tool",new ERDF.Literal("")));
ResourceManager={__corrupt:false,__latelyCreatedResource:undefined,__listeners:$H(),__token:1,addListener:function(_ad,_ae){
if(!(_ad instanceof Function)){
throw "Resource event listener is not a function!";
}
if(!(_ae)){
throw "Invalid mask for resource event listener registration.";
}
var _af={listener:_ad,mask:_ae};
var _b0=ResourceManager.__token++;
ResourceManager.__listeners[_b0]=_af;
return _b0;
},removeListener:function(_b1){
return ResourceManager.__listners.remove(_b1);
},__Event:function(_b2,_b3){
this.action=_b2;
this.resourceId=_b3;
},__dispatchEvent:function(_b4){
ResourceManager.__listeners.values().each(function(_b5){
if(_b4.action&_b5.mask){
return _b5.listener(_b4);
}
});
},getResource:function(id){
id=ERDF.__stripHashes(id);
var _b7=DataManager.query(new ERDF.Resource("#"+id),{prefix:"raziel",name:"entry"},undefined);
if((_b7.length==1)&&(_b7[0].object.isResource())){
var _b8=_b7[0].object.value;
return new ResourceManager.__Resource(id,_b8);
}
throw ("Resource with id "+id+" not recognized as such. "+((_b7.length>1)?" There is more than one raziel:entry URL.":" There is no raziel:entry URL."));
return false;
},__createResource:function(_b9){
var _ba=DataManager.query(new ERDF.Resource(""),{prefix:"raziel",name:"collection"},undefined);
if((_ba.length==1)&&(_ba[0].object.isResource())){
var _bb=_ba[0].object.value;
var _bc=undefined;
var _bd=_b9?_b9:"<div xmlns=\"http://www.w3.org/1999/xhtml\"></div>";
ResourceManager.__request("POST",_bb,_bd,function(){
var _be=(this.responseXML);
var div=_be.childNodes[0];
var id=div.getAttribute("id");
if(!$$("."+PROCESSDATA_REF)[0]){
DataManager.graft(XMLNS.XHTML,document.getElementsByTagNameNS(XMLNS.XHTML,"body").item(0),["div",{"class":PROCESSDATA_REF,"style":"display:none;"}]);
}
$$("."+PROCESSDATA_REF)[0].appendChild(div.cloneNode(true));
DataManager.__synclocal();
_bc=new ResourceManager.getResource(id);
ResourceManager.__resourceActionSucceeded(this,RESOURCE_CREATED,undefined);
},function(){
ResourceManager.__resourceActionFailed(this,RESOURCE_CREATED,undefined);
},false);
return _bc;
}
throw "Could not create resource! raziel:collection URL is missing!";
return false;
},__Resource:function(id,url){
this.__id=id;
this.__url=url;
this.id=function(){
return this.__id;
};
this.url=function(){
return this.__url;
};
this.reload=function(){
var _c3=this.__url;
var _id=this.__id;
ResourceManager.__request("GET",_c3,null,function(){
ResourceManager.__resourceActionSucceeded(this,RESOURCE_RELOADED,_id);
},function(){
ResourceManager.__resourceActionFailed(this,RESURCE_RELOADED,_id);
},USE_ASYNCHRONOUS_REQUESTS);
};
this.save=function(_c5){
var _c6=this.__url;
var _id=this.__id;
data=DataManager.serialize($(_id));
ResourceManager.__request("PUT",_c6,data,function(){
ResourceManager.__resourceActionSucceeded(this,_c5?RESOURCE_SAVED|RESOURCE_SYNCHRONIZED:RESOURCE_SAVED,_id);
},function(){
ResourceManager.__resourceActionFailed(this,_c5?RESOURCE_SAVED|RESOURCE_SYNCHRONIZED:RESOURCE.SAVED,_id);
},USE_ASYNCHRONOUS_REQUESTS);
};
this.remove=function(){
var _c8=this.__url;
var _id=this.__id;
ResourceManager.__request("DELETE",_c8,null,function(){
ResourceManager.__resourceActionSucceeded(this,RESOURCE_REMOVED,_id);
},function(){
ResourceManager.__resourceActionFailed(this,RESOURCE_REMOVED,_id);
},USE_ASYNCHRONOUS_REQUESTS);
};
},request:function(url,_cb){
var _cc={method:"get",asynchronous:true,parameters:{}};
Object.extend(_cc,_cb||{});
var _cd=Hash.toQueryString(_cc.parameters);
if(_cd){
url+=(url.include("?")?"&":"?")+_cd;
}
return ResourceManager.__request(_cc.method,url,_cc.data,(_cc.onSuccess instanceof Function?function(){
_cc.onSuccess(this);
}:undefined),(_cc.onFailure instanceof Function?function(){
_cc.onFailure(this);
}:undefined),_cc.asynchronous&&USE_ASYNCHRONOUS_REQUESTS,_cc.headers);
},__request:function(_ce,url,_d0,_d1,_d2,_d3,_d4){
var _d5=Try.these(function(){
return new XMLHttpRequest();
},function(){
return new ActiveXObject("Msxml2.XMLHTTP");
},function(){
return new ActiveXObject("Microsoft.XMLHTTP");
});
if(!_d5){
if(!this.__corrupt){
throw "This browser does not provide any AJAX functionality. You will not be able to use the software provided with the page you are viewing. Please consider installing appropriate extensions.";
}
this.__corrupt=true;
return false;
}
if(_d1 instanceof Function){
_d5.onload=_d1;
}
if(_d2 instanceof Function){
_d5.onerror=_d2;
}
var h=$H(_d4);
h.keys().each(function(key){
_d5.setRequestHeader(key,h[key]);
});
try{
if(SHOW_DEBUG_ALERTS_WHEN_SAVING){
alert(_ce+" "+url+"\n"+SHOW_EXTENDED_DEBUG_INFORMATION?_d0:"");
}
_d5.open(_ce,url,!_d3?false:true);
_d5.send(_d0);
}
catch(e){
return false;
}
return true;
},__resourceActionSucceeded:function(_d8,_d9,id){
var _db=_d8.status;
var _dc=_d8.responseText;
if(SHOW_DEBUG_ALERTS_WHEN_SAVING){
alert(_db+" "+url+"\n"+SHOW_EXTENDED_DEBUG_INFORMATION?data:"");
}
if(_db>=300){
throw "The server responded with an error: "+_db+"\n"+(SHOW_EXTENDED_DEBUG_INFORMATION?+data:"If you need additional information here, including the data sent by the server, consider setting SHOW_EXTENDED_DEBUG_INFORMATION to true.");
}
switch(_d9){
case RESOURCE_REMOVED:
var _dc=(_d8.responseXML);
var div=_dc.childNodes[0];
var id=div.getAttribute("id");
var _de=document.getElementById(id);
_de.parentNode.removeChild(_de);
break;
case RESOURCE_CREATED:
break;
case RESOURCE_SAVED|RESOURCE_SYNCHRONIZED:
DataManager.__synclocal();
case RESOURCE_SAVED:
break;
case RESOURCE_RELOADED:
var _dc=(_d8.responseXML);
var div=_dc.childNodes[0];
var id=div.getAttribute("id");
var _de=document.getElementById(id);
_de.parentNode.removeChild(_de);
if(!$$(PROCESSDATA_REF)[0]){
DataManager.graft(XMLNS.XHTML,document.getElementsByTagNameNS(XMLNS.XHTML,"body").item(0),["div",{"class":PROCESSDATA_REF,"style":"display:none;"}]);
}
$$(PROCESSDATA_REF)[0].appendChild(div.cloneNode(true));
DataManager.__synclocal();
break;
default:
DataManager.__synclocal();
}
ResourceManager.__dispatchEvent(new ResourceManager.__Event(_d9,id));
},__resourceActionFailed:function(_df,_e0,id){
throw "Fatal: Resource action failed. There is something horribly "+"wrong with either the server, the transport protocol or your "+"online status. Sure you're online?";
}};
var Clazz=function(){
};
Clazz.prototype.construct=function(){
};
Clazz.extend=function(def){
var _e3=function(){
if(arguments[0]!==Clazz){
this.construct.apply(this,arguments);
}
};
var _e4=new this(Clazz);
var _e5=this.prototype;
for(var n in def){
var _e7=def[n];
if(_e7 instanceof Function){
_e7.$=_e5;
}
_e4[n]=_e7;
}
_e3.prototype=_e4;
_e3.extend=this.extend;
return _e3;
};
function printf(){
var _e8=arguments[0];
for(var i=1;i<arguments.length;i++){
_e8=_e8.replace("%"+(i-1),arguments[i]);
}
return _e8;
}
var ORYX_LOGLEVEL_TRACE=5;
var ORYX_LOGLEVEL_DEBUG=4;
var ORYX_LOGLEVEL_INFO=3;
var ORYX_LOGLEVEL_WARN=2;
var ORYX_LOGLEVEL_ERROR=1;
var ORYX_LOGLEVEL_FATAL=0;
var ORYX_LOGLEVEL=0;
var ORYX_CONFIGURATION_DELAY=100;
var ORYX_CONFIGURATION_WAIT_ATTEMPTS=10;
if(!ORYX){
var ORYX={};
}
ORYX=Object.extend(ORYX,{PATH:"/oryx/",CONFIGURATION:"config.js",URLS:[],alreadyLoaded:[],configrationRetries:0,Version:"0.1.1",availablePlugins:[],Log:{__appenders:[{append:function(_ea){
console.log(_ea);
}}],trace:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_TRACE){
ORYX.Log.__log("TRACE",arguments);
}
},debug:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_DEBUG){
ORYX.Log.__log("DEBUG",arguments);
}
},info:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_INFO){
ORYX.Log.__log("INFO",arguments);
}
},warn:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_WARN){
ORYX.Log.__log("WARN",arguments);
}
},error:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_ERROR){
ORYX.Log.__log("ERROR",arguments);
}
},fatal:function(){
if(ORYX_LOGLEVEL>=ORYX_LOGLEVEL_FATAL){
ORYX.Log.__log("FATAL",arguments);
}
},__log:function(_eb,_ec){
_ec[0]=(new Date()).getTime()+" "+_eb+" "+_ec[0];
var _ed=printf.apply(null,_ec);
ORYX.Log.__appenders.each(function(_ee){
_ee.append(_ed);
});
},addAppender:function(_ef){
ORYX.Log.__appenders.push(_ef);
}},load:function(){
var _f0=new Ext.Window({id:"oryx-loading-panel",bodyStyle:"padding: 8px;background:white",title:"Oryx",width:"auto",height:"auto",modal:true,resizable:false,closable:false,html:"<span style=\"font-size:11px;\">"+ORYX.I18N.Oryx.pleaseWait+"</span>"});
_f0.show();
ORYX.Log.debug("Oryx begins loading procedure.");
if((typeof Prototype=="undefined")||(typeof Element=="undefined")||(typeof Element.Methods=="undefined")||parseFloat(Prototype.Version.split(".")[0]+"."+Prototype.Version.split(".")[1])<1.5){
throw ("Oryx requires the Prototype JavaScript framework >= 1.5.3");
}
ORYX.Log.debug("Prototype > 1.5 found.");
ORYX._load();
},_load:function(){
ORYX.loadPlugins();
},loadPlugins:function(){
if(ORYX.CONFIG.PLUGINS_ENABLED){
ORYX._loadPlugins();
}else{
ORYX.Log.warn("Ignoring plugins, loading Oryx core only.");
}
init();
},_loadPlugins:function(){
var _f1=ORYX.PATH+ORYX.CONFIG.PLUGINS_CONFIG;
ORYX.Log.debug("Loading plugin configuration from '%0'.",_f1);
new Ajax.Request(_f1,{asynchronous:false,method:"get",onSuccess:function(_f2){
ORYX.Log.info("Plugin configuration file loaded.");
var _f3=_f2.responseXML;
var _f4=[];
var _f5=$A(_f3.getElementsByTagName("properties"));
_f5.each(function(p){
var _f7=$A(p.childNodes);
_f7.each(function(_f8){
var _f9=new Hash();
var _fa=$A(_f8.attributes);
_fa.each(function(_fb){
_f9[_fb.nodeName]=_fb.nodeValue;
});
if(_fa.length>0){
_f4.push(_f9);
}
});
});
var _fc=_f3.getElementsByTagName("plugin");
$A(_fc).each(function(_fd){
var _fe=new Hash();
$A(_fd.attributes).each(function(_ff){
_fe[_ff.nodeName]=_ff.nodeValue;
});
if(!_fe["name"]){
ORYX.Log.error("A plugin is not providing a name. Ingnoring this plugin.");
return;
}
if(!_fe["source"]){
ORYX.Log.error("Plugin with name '%0' doesn't provide a source attribute.",_fe["name"]);
return;
}
var _100=_fd.getElementsByTagName("property");
var _101=[];
$A(_100).each(function(prop){
var _103=new Hash();
var _104=$A(prop.attributes);
_104.each(function(attr){
_103[attr.nodeName]=attr.nodeValue;
});
if(_104.length>0){
_101.push(_103);
}
});
_101=_101.concat(_f4);
_fe["properties"]=_101;
var _106=_fd.getElementsByTagName("requires");
var _107;
$A(_106).each(function(req){
var _109=$A(req.attributes).find(function(attr){
return attr.name=="namespace";
});
if(_109&&_109.nodeValue){
if(!_107){
_107={namespaces:[]};
}
_107.namespaces.push(_109.nodeValue);
}
});
if(_107){
_fe["requires"]=_107;
}
var _10b=_fd.getElementsByTagName("notUsesIn");
var _10c;
$A(_10b).each(function(not){
var _10e=$A(not.attributes).find(function(attr){
return attr.name=="namespace";
});
if(_10e&&_10e.nodeValue){
if(!_10c){
_10c={namespaces:[]};
}
_10c.namespaces.push(_10e.nodeValue);
}
});
if(_10c){
_fe["notUsesIn"]=_10c;
}
var url=ORYX.PATH+ORYX.CONFIG.PLUGINS_FOLDER+_fe["source"];
ORYX.Log.debug("Requireing '%0'",url);
ORYX.Log.info("Plugin '%0' successfully loaded.",_fe["name"]);
ORYX.availablePlugins.push(_fe);
});
},onFailure:this._loadPluginsOnFails});
},_loadPluginsOnFails:function(_111){
ORYX.Log.error("Plugin configuration file not available.");
}});
ORYX.Log.debug("Registering Oryx with Kickstart");
Kickstart.register(ORYX.load);
ORYX.CONFIG={VERSION_URL:ORYX.PATH+"VERSION",LICENSE_URL:ORYX.PATH+"LICENSE",MODE_READONLY:"readonly",MODE_FULLSCREEN:"fullscreen",PLUGINS_ENABLED:true,PLUGINS_CONFIG:"plugins.xml",PLUGINS_FOLDER:"Plugins/",PDF_EXPORT_URL:"/oryx/pdf",PNML_EXPORT_URL:"/oryx/pnml",SIMPLE_PNML_EXPORT_URL:"/oryx/simplepnmlexporter",DESYNCHRONIZABILITY_URL:"/oryx/desynchronizability",IBPMN2BPMN_URL:"/oryx/ibpmn2bpmn",SYNTAXCHECKER_URL:"/oryx/syntaxchecker",VALIDATOR_URL:"/oryx/validator",AUTO_LAYOUTER_URL:"/oryx/layouter",SS_EXTENSIONS_FOLDER:"/oryx/stencilsets/extensions/",SS_EXTENSIONS_CONFIG:"/oryx/stencilsets/extensions/extensions.json",ORYX_NEW_URL:"/new",STEP_THROUGH:"/oryx/stepthrough",STEP_THROUGH_CHECKER:"/oryx/stepthroughchecker",XFORMS_EXPORT_URL:"/oryx/xformsexport",XFORMS_EXPORT_ORBEON_URL:"/oryx/xformsexport-orbeon",XFORMS_IMPORT_URL:"/oryx/xformsimport",BPEL_EXPORT_URL:"/oryx/bpelexporter",BPEL4CHOR_EXPORT_URL:"/oryx/bpel4chorexporter",TREEGRAPH_SUPPORT:"/oryx/treegraphsupport",XPDL4CHOR2BPEL4CHOR_TRANSFORMATION_URL:"/oryx/xpdl4chor2bpel4chor",SEMANTIC_EXTENSION_URL:"/oryx/semanticext",SEMANTIC_BRIDGE_URL:"/oryx/semanticbridge",NAMESPACE_ORYX:"http://www.b3mn.org/oryx",NAMESPACE_SVG:"http://www.w3.org/2000/svg",CANVAS_WIDTH:1485,CANVAS_HEIGHT:1050,CANVAS_RESIZE_INTERVAL:300,SELECTED_AREA_PADDING:4,CANVAS_BACKGROUND_COLOR:"none",GRID_DISTANCE:30,GRID_ENABLED:true,ZOOM_OFFSET:0.1,DEFAULT_SHAPE_MARGIN:60,SCALERS_SIZE:7,MINIMUM_SIZE:20,MAXIMUM_SIZE:10000,OFFSET_MAGNET:15,OFFSET_EDGE_LABEL_TOP:14,OFFSET_EDGE_LABEL_BOTTOM:12,COPY_MOVE_OFFSET:30,BORDER_OFFSET:14,SHAPEMENU_RIGHT:"Oryx_Right",SHAPEMENU_BOTTOM:"Oryx_Bottom",SHAPEMENU_LEFT:"Oryx_Left",SHAPEMENU_TOP:"Oryx_Top",TYPE_STRING:"string",TYPE_BOOLEAN:"boolean",TYPE_INTEGER:"integer",TYPE_FLOAT:"float",TYPE_COLOR:"color",TYPE_DATE:"date",TYPE_CHOICE:"choice",TYPE_URL:"url",TYPE_COMPLEX:"complex",TYPE_TEXT:"text",LABEL_LINE_DISTANCE:2,LABEL_DEFAULT_LINE_HEIGHT:12,EDITOR_ALIGN_BOTTOM:1,EDITOR_ALIGN_MIDDLE:2,EDITOR_ALIGN_TOP:4,EDITOR_ALIGN_LEFT:8,EDITOR_ALIGN_CENTER:16,EDITOR_ALIGN_RIGHT:32,EVENT_MOUSEDOWN:"mousedown",EVENT_MOUSEUP:"mouseup",EVENT_MOUSEOVER:"mouseover",EVENT_MOUSEOUT:"mouseout",EVENT_MOUSEMOVE:"mousemove",EVENT_DBLCLICK:"dblclick",EVENT_KEYDOWN:"keydown",EVENT_KEYUP:"keyup",EVENT_LOADED:"editorloaded",EVENT_EXECUTE_COMMANDS:"executeCommands",EVENT_STENCIL_SET_LOADED:"stencilSetLoaded",EVENT_SELECTION_CHANGED:"selectionchanged",EVENT_CANVAS_SHAPEADDED:"shapeadded",EVENT_PROPERTY_CHANGED:"propertyChanged",EVENT_DRAGDROP_START:"dragdrop.start",EVENT_DRAGDROP_END:"dragdrop.end",EVENT_DRAGDOCKER_DOCKED:"dragDocker.docked",EVENT_HIGHLIGHT_SHOW:"highlight.showHighlight",EVENT_HIGHLIGHT_HIDE:"highlight.hideHighlight",EVENT_LOADING_ENABLE:"loading.enable",EVENT_LOADING_DISABLE:"loading.disable",EVENT_LOADING_STATUS:"loading.status",EVENT_OVERLAY_SHOW:"overlay.show",EVENT_OVERLAY_HIDE:"overlay.hide",EVENT_ARRANGEMENT_TOP:"arrangement.setToTop",EVENT_ARRANGEMENT_BACK:"arrangement.setToBack",EVENT_ARRANGEMENT_FORWARD:"arrangement.setForward",EVENT_ARRANGEMENT_BACKWARD:"arrangement.setBackward",EVENT_PROPWINDOW_PROP_CHANGED:"propertyWindow.propertyChanged",EVENT_LAYOUT_ROWS:"layout.rows",EVENT_LAYOUT_BPEL:"layout.BPEL",EVENT_LAYOUT_BPEL_VERTICAL:"layout.BPEL.vertical",EVENT_LAYOUT_BPEL_HORIZONTAL:"layout.BPEL.horizontal",EVENT_LAYOUT_BPEL_SINGLECHILD:"layout.BPEL.singlechild",EVENT_LAYOUT_BPEL_AUTORESIZE:"layout.BPEL.autoresize",EVENT_AUTOLAYOUT_LAYOUT:"autolayout.layout",EVENT_UNDO_EXECUTE:"undo.execute",EVENT_UNDO_ROLLBACK:"undo.rollback",EVENT_SHOW_PROPERTYWINDOW:"propertywindow.show",EVENT_MODEL_BEFORE_SAVE:"model.beforesave",SELECTION_HIGHLIGHT_SIZE:5,SELECTION_HIGHLIGHT_COLOR:"#4444FF",SELECTION_HIGHLIGHT_COLOR2:"#9999FF",SELECTION_HIGHLIGHT_STYLE_CORNER:"corner",SELECTION_HIGHLIGHT_STYLE_RECTANGLE:"rectangle",SELECTION_VALID_COLOR:"#00FF00",SELECTION_INVALID_COLOR:"#FF0000",DOCKER_DOCKED_COLOR:"#00FF00",DOCKER_UNDOCKED_COLOR:"#FF0000",DOCKER_SNAP_OFFSET:10,EDIT_OFFSET_PASTE:10,KEY_CODE_X:88,KEY_CODE_C:67,KEY_CODE_V:86,KEY_CODE_DELETE:46,KEY_CODE_META:224,KEY_CODE_BACKSPACE:8,KEY_CODE_LEFT:37,KEY_CODE_RIGHT:39,KEY_CODE_UP:38,KEY_CODE_DOWN:40,KEY_Code_enter:12,KEY_Code_left:37,KEY_Code_right:39,KEY_Code_top:38,KEY_Code_bottom:40,};
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.EditPathHandler=Clazz.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.x=0;
this.y=0;
this.oldX=0;
this.oldY=0;
this.deltaWidth=1;
this.deltaHeight=1;
this.d="";
},init:function(x,y,oldX,oldY,_116,_117){
this.x=x;
this.y=y;
this.oldX=oldX;
this.oldY=oldY;
this.deltaWidth=_116;
this.deltaHeight=_117;
this.d="";
},editPointsAbs:function(_118){
if(_118 instanceof Array){
var _119=[];
var x,y;
for(var i=0;i<_118.length;i++){
x=(parseFloat(_118[i])-this.oldX)*this.deltaWidth+this.x;
i++;
y=(parseFloat(_118[i])-this.oldY)*this.deltaHeight+this.y;
_119.push(x);
_119.push(y);
}
return _119;
}else{
}
},editPointsRel:function(_11d){
if(_11d instanceof Array){
var _11e=[];
var x,y;
for(var i=0;i<_11d.length;i++){
x=parseFloat(_11d[i])*this.deltaWidth;
i++;
y=parseFloat(_11d[i])*this.deltaHeight;
_11e.push(x);
_11e.push(y);
}
return _11e;
}else{
}
},arcAbs:function(rx,ry,_124,_125,_126,x,y){
var _129=this.editPointsAbs([x,y]);
var _12a=this.editPointsRel([rx,ry]);
this.d=this.d.concat(" A"+_12a[0]+" "+_12a[1]+" "+_124+" "+_125+" "+_126+" "+_129[0]+" "+_129[1]+" ");
},arcRel:function(rx,ry,_12d,_12e,_12f,x,y){
var _132=this.editPointsRel([rx,ry,x,y]);
this.d=this.d.concat(" a"+_132[0]+" "+_132[1]+" "+_12d+" "+_12e+" "+_12f+" "+_132[2]+" "+_132[3]+" ");
},curvetoCubicAbs:function(x1,y1,x2,y2,x,y){
var _139=this.editPointsAbs([x1,y1,x2,y2,x,y]);
this.d=this.d.concat(" C"+_139[0]+" "+_139[1]+" "+_139[2]+" "+_139[3]+" "+_139[4]+" "+_139[5]+" ");
},curvetoCubicRel:function(x1,y1,x2,y2,x,y){
var _140=this.editPointsRel([x1,y1,x2,y2,x,y]);
this.d=this.d.concat(" c"+_140[0]+" "+_140[1]+" "+_140[2]+" "+_140[3]+" "+_140[4]+" "+_140[5]+" ");
},linetoHorizontalAbs:function(x){
var _142=this.editPointsAbs([x,0]);
this.d=this.d.concat(" H"+_142[0]+" ");
},linetoHorizontalRel:function(x){
var _144=this.editPointsRel([x,0]);
this.d=this.d.concat(" h"+_144[0]+" ");
},linetoAbs:function(x,y){
var _147=this.editPointsAbs([x,y]);
this.d=this.d.concat(" L"+_147[0]+" "+_147[1]+" ");
},linetoRel:function(x,y){
var _14a=this.editPointsRel([x,y]);
this.d=this.d.concat(" l"+_14a[0]+" "+_14a[1]+" ");
},movetoAbs:function(x,y){
var _14d=this.editPointsAbs([x,y]);
this.d=this.d.concat(" M"+_14d[0]+" "+_14d[1]+" ");
},movetoRel:function(x,y){
var _150;
if(this.d===""){
_150=this.editPointsAbs([x,y]);
}else{
_150=this.editPointsRel([x,y]);
}
this.d=this.d.concat(" m"+_150[0]+" "+_150[1]+" ");
},curvetoQuadraticAbs:function(x1,y1,x,y){
var _155=this.editPointsAbs([x1,y1,x,y]);
this.d=this.d.concat(" Q"+_155[0]+" "+_155[1]+" "+_155[2]+" "+_155[3]+" ");
},curvetoQuadraticRel:function(x1,y1,x,y){
var _15a=this.editPointsRel([x1,y1,x,y]);
this.d=this.d.concat(" q"+_15a[0]+" "+_15a[1]+" "+_15a[2]+" "+_15a[3]+" ");
},curvetoCubicSmoothAbs:function(x2,y2,x,y){
var _15f=this.editPointsAbs([x2,y2,x,y]);
this.d=this.d.concat(" S"+_15f[0]+" "+_15f[1]+" "+_15f[2]+" "+_15f[3]+" ");
},curvetoCubicSmoothRel:function(x2,y2,x,y){
var _164=this.editPointsRel([x2,y2,x,y]);
this.d=this.d.concat(" s"+_164[0]+" "+_164[1]+" "+_164[2]+" "+_164[3]+" ");
},curvetoQuadraticSmoothAbs:function(x,y){
var _167=this.editPointsAbs([x,y]);
this.d=this.d.concat(" T"+_167[0]+" "+_167[1]+" ");
},curvetoQuadraticSmoothRel:function(x,y){
var _16a=this.editPointsRel([x,y]);
this.d=this.d.concat(" t"+_16a[0]+" "+_16a[1]+" ");
},linetoVerticalAbs:function(y){
var _16c=this.editPointsAbs([0,y]);
this.d=this.d.concat(" V"+_16c[1]+" ");
},linetoVerticalRel:function(y){
var _16e=this.editPointsRel([0,y]);
this.d=this.d.concat(" v"+_16e[1]+" ");
},closePath:function(){
this.d=this.d.concat(" z");
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.MinMaxPathHandler=Clazz.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.minX=undefined;
this.minY=undefined;
this.maxX=undefined;
this.maxY=undefined;
this._lastAbsX=undefined;
this._lastAbsY=undefined;
},calculateMinMax:function(_16f){
if(_16f instanceof Array){
var x,y;
for(var i=0;i<_16f.length;i++){
x=parseFloat(_16f[i]);
i++;
y=parseFloat(_16f[i]);
this.minX=(this.minX!==undefined)?Math.min(this.minX,x):x;
this.maxX=(this.maxX!==undefined)?Math.max(this.maxX,x):x;
this.minY=(this.minY!==undefined)?Math.min(this.minY,y):y;
this.maxY=(this.maxY!==undefined)?Math.max(this.maxY,y):y;
this._lastAbsX=x;
this._lastAbsY=y;
}
}else{
}
},arcAbs:function(rx,ry,_175,_176,_177,x,y){
this.calculateMinMax([x,y]);
},arcRel:function(rx,ry,_17c,_17d,_17e,x,y){
this.calculateMinMax([this._lastAbsX+x,this._lastAbsY+y]);
},curvetoCubicAbs:function(x1,y1,x2,y2,x,y){
this.calculateMinMax([x1,y1,x2,y2,x,y]);
},curvetoCubicRel:function(x1,y1,x2,y2,x,y){
this.calculateMinMax([this._lastAbsX+x1,this._lastAbsY+y1,this._lastAbsX+x2,this._lastAbsY+y2,this._lastAbsX+x,this._lastAbsY+y]);
},linetoHorizontalAbs:function(x){
this.calculateMinMax([x,this._lastAbsY]);
},linetoHorizontalRel:function(x){
this.calculateMinMax([this._lastAbsX+x,this._lastAbsY]);
},linetoAbs:function(x,y){
this.calculateMinMax([x,y]);
},linetoRel:function(x,y){
this.calculateMinMax([this._lastAbsX+x,this._lastAbsY+y]);
},movetoAbs:function(x,y){
this.calculateMinMax([x,y]);
},movetoRel:function(x,y){
if(this._lastAbsX&&this._lastAbsY){
this.calculateMinMax([this._lastAbsX+x,this._lastAbsY+y]);
}else{
this.calculateMinMax([x,y]);
}
},curvetoQuadraticAbs:function(x1,y1,x,y){
this.calculateMinMax([x1,y1,x,y]);
},curvetoQuadraticRel:function(x1,y1,x,y){
this.calculateMinMax([this._lastAbsX+x1,this._lastAbsY+y1,this._lastAbsX+x,this._lastAbsY+y]);
},curvetoCubicSmoothAbs:function(x2,y2,x,y){
this.calculateMinMax([x2,y2,x,y]);
},curvetoCubicSmoothRel:function(x2,y2,x,y){
this.calculateMinMax([this._lastAbsX+x2,this._lastAbsY+y2,this._lastAbsX+x,this._lastAbsY+y]);
},curvetoQuadraticSmoothAbs:function(x,y){
this.calculateMinMax([x,y]);
},curvetoQuadraticSmoothRel:function(x,y){
this.calculateMinMax([this._lastAbsX+x,this._lastAbsY+y]);
},linetoVerticalAbs:function(y){
this.calculateMinMax([this._lastAbsX,y]);
},linetoVerticalRel:function(y){
this.calculateMinMax([this._lastAbsX,this._lastAbsY+y]);
},closePath:function(){
return;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.PointsPathHandler=Clazz.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.points=[];
this._lastAbsX=undefined;
this._lastAbsY=undefined;
},addPoints:function(_1ad){
if(_1ad instanceof Array){
var x,y;
for(var i=0;i<_1ad.length;i++){
x=parseFloat(_1ad[i]);
i++;
y=parseFloat(_1ad[i]);
this.points.push(x);
this.points.push(y);
this._lastAbsX=x;
this._lastAbsY=y;
}
}else{
}
},arcAbs:function(rx,ry,_1b3,_1b4,_1b5,x,y){
this.addPoints([x,y]);
},arcRel:function(rx,ry,_1ba,_1bb,_1bc,x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},curvetoCubicAbs:function(x1,y1,x2,y2,x,y){
this.addPoints([x,y]);
},curvetoCubicRel:function(x1,y1,x2,y2,x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},linetoHorizontalAbs:function(x){
this.addPoints([x,this._lastAbsY]);
},linetoHorizontalRel:function(x){
this.addPoints([this._lastAbsX+x,this._lastAbsY]);
},linetoAbs:function(x,y){
this.addPoints([x,y]);
},linetoRel:function(x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},movetoAbs:function(x,y){
this.addPoints([x,y]);
},movetoRel:function(x,y){
if(this._lastAbsX&&this._lastAbsY){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
}else{
this.addPoints([x,y]);
}
},curvetoQuadraticAbs:function(x1,y1,x,y){
this.addPoints([x,y]);
},curvetoQuadraticRel:function(x1,y1,x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},curvetoCubicSmoothAbs:function(x2,y2,x,y){
this.addPoints([x,y]);
},curvetoCubicSmoothRel:function(x2,y2,x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},curvetoQuadraticSmoothAbs:function(x,y){
this.addPoints([x,y]);
},curvetoQuadraticSmoothRel:function(x,y){
this.addPoints([this._lastAbsX+x,this._lastAbsY+y]);
},linetoVerticalAbs:function(y){
this.addPoints([this._lastAbsX,y]);
},linetoVerticalRel:function(y){
this.addPoints([this._lastAbsX,this._lastAbsY+y]);
},closePath:function(){
return;
}});
NAMESPACE_ORYX="http://www.b3mn.org/oryx";
NAMESPACE_SVG="http://www.w3.org/2000/svg/";
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.SVGMarker=Clazz.extend({construct:function(_1eb){
arguments.callee.$.construct.apply(this,arguments);
this.id=undefined;
this.element=_1eb;
this.refX=undefined;
this.refY=undefined;
this.markerWidth=undefined;
this.markerHeight=undefined;
this.oldRefX=undefined;
this.oldRefY=undefined;
this.oldMarkerWidth=undefined;
this.oldMarkerHeight=undefined;
this.optional=false;
this.enabled=true;
this.minimumLength=undefined;
this.resize=false;
this.svgShapes=[];
this._init();
},_init:function(){
if(!(this.element=="[object SVGMarkerElement]")){
throw "SVGMarker: Argument is not an instance of SVGMarkerElement.";
}
this.id=this.element.getAttributeNS(null,"id");
var _1ec=this.element.getAttributeNS(null,"refX");
if(_1ec){
this.refX=parseFloat(_1ec);
}else{
this.refX=0;
}
var _1ed=this.element.getAttributeNS(null,"refY");
if(_1ed){
this.refY=parseFloat(_1ed);
}else{
this.refY=0;
}
var _1ee=this.element.getAttributeNS(null,"markerWidth");
if(_1ee){
this.markerWidth=parseFloat(_1ee);
}else{
this.markerWidth=3;
}
var _1ef=this.element.getAttributeNS(null,"markerHeight");
if(_1ef){
this.markerHeight=parseFloat(_1ef);
}else{
this.markerHeight=3;
}
this.oldRefX=this.refX;
this.oldRefY=this.refY;
this.oldMarkerWidth=this.markerWidth;
this.oldMarkerHeight=this.markerHeight;
var _1f0=this.element.getAttributeNS(NAMESPACE_ORYX,"optional");
if(_1f0){
_1f0=_1f0.strip();
this.optional=(_1f0.toLowerCase()==="yes");
}else{
this.optional=false;
}
var _1f1=this.element.getAttributeNS(NAMESPACE_ORYX,"enabled");
if(_1f1){
_1f1=_1f1.strip();
this.enabled=!(_1f1.toLowerCase()==="no");
}else{
this.enabled=true;
}
var _1f2=this.element.getAttributeNS(NAMESPACE_ORYX,"minimumLength");
if(_1f2){
this.minimumLength=parseFloat(_1f2);
}
var _1f3=this.element.getAttributeNS(NAMESPACE_ORYX,"resize");
if(_1f3){
_1f3=_1f3.strip();
this.resize=(_1f3.toLowerCase()==="yes");
}else{
this.resize=false;
}
},_getSVGShapes:function(_1f4){
if(_1f4.hasChildNodes){
var _1f5=[];
var me=this;
$A(_1f4.childNodes).each(function(_1f7){
try{
var _1f8=new ORYX.Core.SVG.SVGShape(_1f7);
_1f5.push(_1f8);
}
catch(e){
_1f5=_1f5.concat(me._getSVGShapes(_1f7));
}
});
return _1f5;
}
},update:function(){
this.oldRefX=this.refX;
this.oldRefY=this.refY;
this.oldMarkerWidth=this.markerWidth;
this.oldMarkerHeight=this.markerHeight;
},toString:function(){
return (this.element)?"SVGMarker "+this.element.id:"SVGMarker "+this.element;
}});
NAMESPACE_ORYX="http://www.b3mn.org/oryx";
NAMESPACE_SVG="http://www.w3.org/2000/svg/";
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.SVGShape=Clazz.extend({construct:function(_1f9){
arguments.callee.$.construct.apply(this,arguments);
this.type;
this.element=_1f9;
this.x=undefined;
this.y=undefined;
this.width=undefined;
this.height=undefined;
this.oldX=undefined;
this.oldY=undefined;
this.oldWidth=undefined;
this.oldHeight=undefined;
this.radiusX=undefined;
this.radiusY=undefined;
this.isHorizontallyResizable=false;
this.isVerticallyResizable=false;
this.anchorLeft=false;
this.anchorRight=false;
this.anchorTop=false;
this.anchorBottom=false;
this.allowDockers=true;
this.resizeMarkerMid=false;
this.editPathParser;
this.editPathHandler;
this.init();
},init:function(){
if(ORYX.Editor.checkClassType(this.element,SVGRectElement)||ORYX.Editor.checkClassType(this.element,SVGImageElement)){
this.type="Rect";
var _1fa=this.element.getAttributeNS(null,"x");
if(_1fa){
this.oldX=parseFloat(_1fa);
}else{
throw "Missing attribute in element "+this.element;
}
var _1fb=this.element.getAttributeNS(null,"y");
if(_1fb){
this.oldY=parseFloat(_1fb);
}else{
throw "Missing attribute in element "+this.element;
}
var _1fc=this.element.getAttributeNS(null,"width");
if(_1fc){
this.oldWidth=parseFloat(_1fc);
}else{
throw "Missing attribute in element "+this.element;
}
var _1fd=this.element.getAttributeNS(null,"height");
if(_1fd){
this.oldHeight=parseFloat(_1fd);
}else{
throw "Missing attribute in element "+this.element;
}
}else{
if(ORYX.Editor.checkClassType(this.element,SVGCircleElement)){
this.type="Circle";
var cx=undefined;
var cy=undefined;
var _200=this.element.getAttributeNS(null,"cx");
if(_200){
cx=parseFloat(_200);
}else{
throw "Missing attribute in element "+this.element;
}
var _201=this.element.getAttributeNS(null,"cy");
if(_201){
cy=parseFloat(_201);
}else{
throw "Missing attribute in element "+this.element;
}
var _202=this.element.getAttributeNS(null,"r");
if(_202){
this.radiusX=parseFloat(_202);
}else{
throw "Missing attribute in element "+this.element;
}
this.oldX=cx-this.radiusX;
this.oldY=cy-this.radiusX;
this.oldWidth=2*this.radiusX;
this.oldHeight=2*this.radiusX;
}else{
if(ORYX.Editor.checkClassType(this.element,SVGEllipseElement)){
this.type="Ellipse";
var cx=undefined;
var cy=undefined;
var _200=this.element.getAttributeNS(null,"cx");
if(_200){
cx=parseFloat(_200);
}else{
throw "Missing attribute in element "+this.element;
}
var _201=this.element.getAttributeNS(null,"cy");
if(_201){
cy=parseFloat(_201);
}else{
throw "Missing attribute in element "+this.element;
}
var _203=this.element.getAttributeNS(null,"rx");
if(_203){
this.radiusX=parseFloat(_203);
}else{
throw "Missing attribute in element "+this.element;
}
var _204=this.element.getAttributeNS(null,"ry");
if(_204){
this.radiusY=parseFloat(_204);
}else{
throw "Missing attribute in element "+this.element;
}
this.oldX=cx-this.radiusX;
this.oldY=cy-this.radiusY;
this.oldWidth=2*this.radiusX;
this.oldHeight=2*this.radiusY;
}else{
if(ORYX.Editor.checkClassType(this.element,SVGLineElement)){
this.type="Line";
var x1=undefined;
var y1=undefined;
var x2=undefined;
var y2=undefined;
var _209=this.element.getAttributeNS(null,"x1");
if(_209){
x1=parseFloat(_209);
}else{
throw "Missing attribute in element "+this.element;
}
var _20a=this.element.getAttributeNS(null,"y1");
if(_20a){
y1=parseFloat(_20a);
}else{
throw "Missing attribute in element "+this.element;
}
var _20b=this.element.getAttributeNS(null,"x2");
if(_20b){
x2=parseFloat(_20b);
}else{
throw "Missing attribute in element "+this.element;
}
var _20c=this.element.getAttributeNS(null,"y2");
if(_20c){
y2=parseFloat(_20c);
}else{
throw "Missing attribute in element "+this.element;
}
this.oldX=Math.min(x1,x2);
this.oldY=Math.min(y1,y2);
this.oldWidth=Math.abs(x1-x2);
this.oldHeight=Math.abs(y1-y2);
}else{
if(ORYX.Editor.checkClassType(this.element,SVGPolylineElement)||ORYX.Editor.checkClassType(this.element,SVGPolygonElement)){
this.type="Polyline";
var _20d=this.element.getAttributeNS(null,"points");
if(_20d){
_20d=_20d.replace(/,/g," ");
var _20e=_20d.split(" ");
_20e=_20e.without("");
if(_20e&&_20e.length&&_20e.length>1){
var minX=parseFloat(_20e[0]);
var minY=parseFloat(_20e[1]);
var maxX=parseFloat(_20e[0]);
var maxY=parseFloat(_20e[1]);
for(var i=0;i<_20e.length;i++){
minX=Math.min(minX,parseFloat(_20e[i]));
maxX=Math.max(maxX,parseFloat(_20e[i]));
i++;
minY=Math.min(minY,parseFloat(_20e[i]));
maxY=Math.max(maxY,parseFloat(_20e[i]));
}
this.oldX=minX;
this.oldY=minY;
this.oldWidth=maxX-minX;
this.oldHeight=maxY-minY;
}else{
throw "Missing attribute in element "+this.element;
}
}else{
throw "Missing attribute in element "+this.element;
}
}else{
if(ORYX.Editor.checkClassType(this.element,SVGPathElement)){
this.type="Path";
this.editPathParser=new PathParser();
this.editPathHandler=new ORYX.Core.SVG.EditPathHandler();
this.editPathParser.setHandler(this.editPathHandler);
var _214=new PathParser();
var _215=new ORYX.Core.SVG.MinMaxPathHandler();
_214.setHandler(_215);
_214.parsePath(this.element);
this.oldX=_215.minX;
this.oldY=_215.minY;
this.oldWidth=_215.maxX-_215.minX;
this.oldHeight=_215.maxY-_215.minY;
delete _214;
delete _215;
}else{
throw "Element is not a shape.";
}
}
}
}
}
}
var _216=this.element.getAttributeNS(NAMESPACE_ORYX,"resize");
if(_216){
_216=_216.toLowerCase();
if(_216.match(/horizontal/)){
this.isHorizontallyResizable=true;
}else{
this.isHorizontallyResizable=false;
}
if(_216.match(/vertical/)){
this.isVerticallyResizable=true;
}else{
this.isVerticallyResizable=false;
}
}else{
this.isHorizontallyResizable=false;
this.isVerticallyResizable=false;
}
var _217=this.element.getAttributeNS(NAMESPACE_ORYX,"anchors");
if(_217){
_217=_217.replace("/,/g"," ");
var _218=_217.split(" ").without("");
for(var i=0;i<_218.length;i++){
switch(_218[i].toLowerCase()){
case "left":
this.anchorLeft=true;
break;
case "right":
this.anchorRight=true;
break;
case "top":
this.anchorTop=true;
break;
case "bottom":
this.anchorBottom=true;
break;
}
}
}
if(ORYX.Editor.checkClassType(this.element,SVGPathElement)){
var _219=this.element.getAttributeNS(NAMESPACE_ORYX,"allowDockers");
if(_219){
if(_219.toLowerCase()==="no"){
this.allowDockers=false;
}else{
this.allowDockers=true;
}
}
var _21a=this.element.getAttributeNS(NAMESPACE_ORYX,"resizeMarker-mid");
if(_21a){
if(_21a.toLowerCase()==="yes"){
this.resizeMarkerMid=true;
}else{
this.resizeMarkerMid=false;
}
}
}
this.x=this.oldX;
this.y=this.oldY;
this.width=this.oldWidth;
this.height=this.oldHeight;
},update:function(){
if(this.x!==this.oldX||this.y!==this.oldY||this.width!==this.oldWidth||this.height!==this.oldHeight){
switch(this.type){
case "Rect":
if(this.x!==this.oldX){
this.element.setAttributeNS(null,"x",this.x);
}
if(this.y!==this.oldY){
this.element.setAttributeNS(null,"y",this.y);
}
if(this.width!==this.oldWidth){
this.element.setAttributeNS(null,"width",this.width);
}
if(this.height!==this.oldHeight){
this.element.setAttributeNS(null,"height",this.height);
}
break;
case "Circle":
this.radiusX=((this.width<this.height)?this.width:this.height)/2;
this.element.setAttributeNS(null,"cx",this.x+this.width/2);
this.element.setAttributeNS(null,"cy",this.y+this.height/2);
this.element.setAttributeNS(null,"r",this.radiusX);
break;
case "Ellipse":
this.radiusX=this.width/2;
this.radiusY=this.height/2;
this.element.setAttributeNS(null,"cx",this.x+this.radiusX);
this.element.setAttributeNS(null,"cy",this.y+this.radiusY);
this.element.setAttributeNS(null,"rx",this.radiusX);
this.element.setAttributeNS(null,"ry",this.radiusY);
break;
case "Line":
if(this.x!==this.oldX){
this.element.setAttributeNS(null,"x1",this.x);
}
if(this.y!==this.oldY){
this.element.setAttributeNS(null,"y1",this.y);
}
if(this.x!==this.oldX||this.width!==this.oldWidth){
this.element.setAttributeNS(null,"x2",this.x+this.width);
}
if(this.y!==this.oldY||this.height!==this.oldHeight){
this.element.setAttributeNS(null,"y2",this.y+this.height);
}
break;
case "Polyline":
var _21b=this.element.getAttributeNS(null,"points");
if(_21b){
_21b=_21b.replace(/,/g," ").split(" ").without("");
if(_21b&&_21b.length&&_21b.length>1){
var _21c=(this.oldWidth===0)?0:this.width/this.oldWidth;
var _21d=(this.oldHeight===0)?0:this.height/this.oldHeight;
var _21e="";
for(var i=0;i<_21b.length;i++){
var x=(parseFloat(_21b[i])-this.oldX)*_21c+this.x;
i++;
var y=(parseFloat(_21b[i])-this.oldY)*_21d+this.y;
_21e+=x+" "+y+" ";
}
this.element.setAttributeNS(null,"points",_21e);
}else{
}
}else{
}
break;
case "Path":
var _21c=(this.oldWidth===0)?0:this.width/this.oldWidth;
var _21d=(this.oldHeight===0)?0:this.height/this.oldHeight;
this.editPathHandler.init(this.x,this.y,this.oldX,this.oldY,_21c,_21d);
this.editPathParser.parsePath(this.element);
this.element.setAttributeNS(null,"d",this.editPathHandler.d);
break;
}
this.oldX=this.x;
this.oldY=this.y;
this.oldWidth=this.width;
this.oldHeight=this.height;
}
},isPointIncluded:function(_222,_223){
if(!_222||!_223||!this.isVisible()){
return false;
}
switch(this.type){
case "Rect":
return (_222>=this.x&&_222<=this.x+this.width&&_223>=this.y&&_223<=this.y+this.height);
break;
case "Circle":
return ORYX.Core.Math.isPointInEllipse(_222,_223,this.x+this.width/2,this.y+this.height/2,this.radiusX,this.radiusX);
break;
case "Ellipse":
return ORYX.Core.Math.isPointInEllipse(_222,_223,this.x+this.radiusX,this.y+this.radiusY,this.radiusX,this.radiusY);
break;
case "Line":
return ORYX.Core.Math.isPointInLine(_222,_223,this.x,this.y,this.x+this.width,this.y+this.height);
break;
case "Polyline":
var _224=this.element.getAttributeNS(null,"points");
if(_224){
_224=_224.replace(/,/g," ").split(" ").without("");
_224=_224.collect(function(n){
return parseFloat(n);
});
return ORYX.Core.Math.isPointInPolygone(_222,_223,_224);
}else{
return false;
}
break;
case "Path":
var _226=new PathParser();
var _227=new ORYX.Core.SVG.PointsPathHandler();
_226.setHandler(_227);
_226.parsePath(this.element);
return ORYX.Core.Math.isPointInPolygone(_222,_223,_227.points);
break;
default:
return false;
}
},isVisible:function(elem){
if(!elem){
elem=this.element;
}
if(elem.ownerSVGElement){
if(ORYX.Editor.checkClassType(elem,SVGGElement)){
if(elem.className&&elem.className.baseVal=="me"){
return true;
}
}
var attr=elem.getAttributeNS(null,"display");
if(!attr){
return this.isVisible(elem.parentNode);
}else{
if(attr=="none"){
return false;
}else{
return true;
}
}
}
return true;
},toString:function(){
return (this.element)?"SVGShape "+this.element.id:"SVGShape "+this.element;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.SVG){
ORYX.Core.SVG={};
}
ORYX.Core.SVG.Label=Clazz.extend({construct:function(_22a){
arguments.callee.$.construct.apply(this,arguments);
if(!_22a.textElement){
throw "Label: No parameter textElement.";
}else{
if(!ORYX.Editor.checkClassType(_22a.textElement,SVGTextElement)){
throw "Label: Parameter textElement is not an SVGTextElement.";
}
}
this.invisibleRenderPoint=-5000;
this.node=_22a.textElement;
this.node.setAttributeNS(null,"stroke-width","0pt");
this.node.setAttributeNS(null,"letter-spacing","-0.01px");
this.shapeId=_22a.shapeId;
this.id;
this.fitToElemId;
this.edgePosition;
this.x;
this.y;
this.oldX;
this.oldY;
this.isVisible=true;
this._text;
this._verticalAlign;
this._horizontalAlign;
this._rotate;
this._rotationPoint;
this.anchorLeft;
this.anchorRight;
this.anchorTop;
this.anchorBottom;
this._isChanged=true;
var _id=this.node.getAttributeNS(null,"id");
if(_id){
this.id=_id;
}
this.fitToElemId=this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"fittoelem");
if(this.fitToElemId){
this.fitToElemId=this.shapeId+this.fitToElemId;
}
var _22c=this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"align");
if(_22c){
_22c=_22c.replace(/,/g," ");
_22c=_22c.split(" ");
_22c=_22c.without("");
_22c.each((function(_22d){
switch(_22d){
case "top":
case "middle":
case "bottom":
if(!this._verticalAlign){
this._verticalAlign=_22d;
}
break;
case "left":
case "center":
case "right":
if(!this._horizontalAlign){
this._horizontalAlign=_22d;
}
break;
}
}).bind(this));
}
this.edgePosition=this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"edgePosition");
if(this.edgePosition){
this.edgePosition=this.edgePosition.toLowerCase();
}
var _22e=this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"rotate");
if(_22e){
try{
this._rotate=parseFloat(_22e);
}
catch(e){
this._rotate=0;
}
}else{
this._rotate=0;
}
var _22f=this.node.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"anchors");
if(_22f){
_22f=_22f.replace("/,/g"," ");
var _230=_22f.split(" ").without("");
for(var i=0;i<_230.length;i++){
switch(_230[i].toLowerCase()){
case "left":
this.anchorLeft=true;
break;
case "right":
this.anchorRight=true;
break;
case "top":
this.anchorTop=true;
break;
case "bottom":
this.anchorBottom=true;
break;
}
}
}
if(!this._verticalAlign){
this._verticalAlign="bottom";
}
if(!this._horizontalAlign){
this._horizontalAlign="left";
}
var _232=this.node.getAttributeNS(null,"x");
if(_232){
this.x=parseFloat(_232);
this.oldX=this.x;
}else{
}
var _233=this.node.getAttributeNS(null,"y");
if(_233){
this.y=parseFloat(_233);
this.oldY=this.y;
}else{
}
this.text(this.node.textContent);
},changed:function(){
this._isChanged=true;
},update:function(){
if(this._isChanged||this.x!==this.oldX||this.y!==this.oldY){
if(this.isVisible){
this._isChanged=false;
this.node.setAttributeNS(null,"x",this.x);
this.node.setAttributeNS(null,"y",this.y);
switch(this._horizontalAlign){
case "left":
this.node.setAttributeNS(null,"text-anchor","start");
break;
case "center":
this.node.setAttributeNS(null,"text-anchor","middle");
break;
case "right":
this.node.setAttributeNS(null,"text-anchor","end");
break;
}
this.oldX=this.x;
this.oldY=this.y;
if(this._rotate!==undefined){
if(this._rotationPoint){
this.node.setAttributeNS(null,"transform","rotate("+this._rotate+" "+this._rotationPoint.x+" "+this._rotationPoint.y+")");
}else{
this.node.setAttributeNS(null,"transform","rotate("+this._rotate+" "+this.x+" "+this.y+")");
}
}
var _234=this._text.split("\n");
while(_234.last()==""){
_234.remove(_234.last());
}
this.node.textContent="";
if(this.node.ownerDocument){
_234.each((function(_235,_236){
var _237=this.node.ownerDocument.createElementNS(ORYX.CONFIG.NAMESPACE_SVG,"tspan");
_237.textContent=_235;
_237.setAttributeNS(null,"x",this.invisibleRenderPoint);
_237.setAttributeNS(null,"y",this.invisibleRenderPoint);
this.node.appendChild(_237);
}).bind(this));
if(this.isVisible){
this.node.setAttributeNS(null,"visibility","hidden");
}
if(this.fitToElemId){
window.setTimeout(this._checkFittingToReferencedElem.bind(this),0);
}else{
window.setTimeout(this._positionText.bind(this),0);
}
}
}else{
this.node.textContent="";
}
}
},_checkFittingToReferencedElem:function(){
try{
var _238=$A(this.node.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"tspan"));
if(/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)&&new Number(RegExp.$1)>=3){
var _239=[];
var _23a=this.node.ownerDocument.getElementById(this.fitToElemId);
if(_23a){
var _23b=_23a.getBBox();
for(var j=0;j<_238.length;j++){
var _23d=_238[j];
var _23e=_23d.getComputedTextLength();
if(_23e>_23b.width){
var _23f=0;
var _240=0;
var _241=this.getTrimmedTextLength(_23d.textContent);
for(var i=0;i<_241;i++){
var _243=_23d.getSubStringLength(_23f,i-_23f);
if(_243>_23b.width-2){
var _244=this.node.ownerDocument.createElementNS(ORYX.CONFIG.NAMESPACE_SVG,"tspan");
if(_240<=_23f){
_240=(i==0)?i:i-1;
_244.textContent=_23d.textContent.slice(_23f,_240);
}else{
_244.textContent=_23d.textContent.slice(_23f,++_240);
}
_244.setAttributeNS(null,"x",this.invisibleRenderPoint);
_244.setAttributeNS(null,"y",this.invisibleRenderPoint);
_239.push(_244);
_23f=_240;
}else{
var _245=_23d.textContent.charAt(i);
if(_245==" "||_245=="-"||_245=="."||_245==","||_245==";"||_245==":"){
_240=i;
}
}
}
_23d.textContent=_23d.textContent.slice(_23f);
}
_239.push(_23d);
}
while(this.node.hasChildNodes()){
this.node.removeChild(this.node.childNodes[0]);
}
while(_239.length>0){
this.node.appendChild(_239.shift());
}
}
}
}
catch(e){
}
window.setTimeout(this._positionText.bind(this),0);
},_positionText:function(){
try{
var _246=this.node.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"tspan");
var _247=this.getInheritedFontSize(this.node);
if(!_247){
if(_246[0]&&/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)&&new Number(RegExp.$1)>=3){
_247=_246[0].getExtentOfChar(0).height;
}else{
_247=ORYX.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
}
if(_247<=0){
_247=ORYX.CONFIG.LABEL_DEFAULT_LINE_HEIGHT;
}
}
$A(_246).each((function(_248,_249){
var dy=0;
switch(this._verticalAlign){
case "bottom":
dy=-(_246.length-_249-1)*(_247);
break;
case "middle":
dy=-(_246.length/2-_249-1)*(_247);
dy-=ORYX.CONFIG.LABEL_LINE_DISTANCE/2;
break;
case "top":
dy=_249*(_247);
dy+=_247;
break;
}
_248.setAttributeNS(null,"dy",dy);
_248.setAttributeNS(null,"x",this.x);
_248.setAttributeNS(null,"y",this.y);
}).bind(this));
}
catch(e){
this._isChanged=true;
}
if(this.isVisible){
this.node.setAttributeNS(null,"visibility","inherit");
}
},text:function(){
switch(arguments.length){
case 0:
return this._text;
break;
case 1:
var _24b=this._text;
if(arguments[0]){
this._text=arguments[0].toString();
}else{
this._text="";
}
if(_24b!==this._text){
this._isChanged=true;
}
break;
default:
break;
}
},verticalAlign:function(){
switch(arguments.length){
case 0:
return this._verticalAlign;
case 1:
if(["top","middle","bottom"].member(arguments[0])){
var _24c=this._verticalAlign;
this._verticalAlign=arguments[0];
if(this._verticalAlign!==_24c){
this._isChanged=true;
}
}
break;
default:
break;
}
},horizontalAlign:function(){
switch(arguments.length){
case 0:
return this._horizontalAlign;
case 1:
if(["left","center","right"].member(arguments[0])){
var _24d=this._horizontalAlign;
this._horizontalAlign=arguments[0];
if(this._horizontalAlign!==_24d){
this._isChanged=true;
}
}
break;
default:
break;
}
},rotate:function(){
switch(arguments.length){
case 0:
return this._rotate;
case 1:
if(this._rotate!=arguments[0]){
this._rotate=arguments[0];
this._rotationPoint=undefined;
this._isChanged=true;
}
case 2:
if(this._rotate!=arguments[0]||!this._rotationPoint||this._rotationPoint.x!=arguments[1].x||this._rotationPoint.y!=arguments[1].y){
this._rotate=arguments[0];
this._rotationPoint=arguments[1];
this._isChanged=true;
}
}
},hide:function(){
if(this.isVisible){
this.isVisible=false;
this._isChanged=true;
}
},show:function(){
if(!this.isVisible){
this.isVisible=true;
this._isChanged=true;
}
},getInheritedFontSize:function(node){
if(!node||!node.getAttributeNS){
return;
}
var attr=node.getAttributeNS(null,"font-size");
if(attr){
return parseFloat(attr);
}else{
if(!ORYX.Editor.checkClassType(node,SVGSVGElement)){
return this.getInheritedFontSize(node.parentNode);
}
}
},getTrimmedTextLength:function(text){
text=text.strip().gsub("  "," ");
var _251;
do{
_251=text.length;
text=text.gsub("  "," ");
}while(_251>text.length);
return text.length;
},toString:function(){
return "Label "+this.id;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.Math){
ORYX.Core.Math={};
}
ORYX.Core.Math.midPoint=function(_252,_253){
return {x:(_252.x+_253.x)/2,y:(_252.y+_253.y)/2};
};
ORYX.Core.Math.isPointInLine=function(_254,_255,_256,_257,_258,_259,_25a){
_25a=_25a?Math.abs(_25a):1;
if(_256==_258&&Math.abs(_254-_256)<_25a&&_255<Math.max(_257,_259)&&_255>Math.min(_257,_259)){
return true;
}
if(_257==_259&&Math.abs(_255-_257)<_25a&&_254<Math.max(_256,_258)&&_254>Math.min(_256,_258)){
return true;
}
if(_254>Math.max(_256,_258)||_254<Math.min(_256,_258)){
return false;
}
if(_255>Math.max(_257,_259)||_255<Math.min(_257,_259)){
return false;
}
var s=(_257-_259)/(_256-_258);
return Math.abs(_255-((s*_254)+_257-s*_256))<_25a;
};
ORYX.Core.Math.isPointInEllipse=function(_25c,_25d,cx,cy,rx,ry){
if(cx===undefined||cy===undefined||rx===undefined||ry===undefined){
throw "ORYX.Core.Math.isPointInEllipse needs a ellipse with these properties: x, y, radiusX, radiusY";
}
var tx=(_25c-cx)/rx;
var ty=(_25d-cy)/ry;
return tx*tx+ty*ty<1;
};
ORYX.Core.Math.isPointInPolygone=function(_264,_265,_266){
if(arguments.length<3){
throw "ORYX.Core.Math.isPointInPolygone needs two arguments";
}
var _267=_266.length-1;
if(_266[0]!==_266[_267-1]||_266[1]!==_266[_267]){
_266.push(_266[0]);
_266.push(_266[1]);
}
var _268=0;
var x1,y1,x2,y2,d;
for(var i=0;i<_266.length-3;){
x1=_266[i];
y1=_266[++i];
x2=_266[++i];
y2=_266[i+1];
d=(_265-y1)*(x2-x1)-(_264-x1)*(y2-y1);
if((y1>=_265)!=(y2>=_265)){
_268+=y2-y1>=0?d>=0:d<=0;
}
if(!d&&Math.min(x1,x2)<=_264&&_264<=Math.max(x1,x2)&&Math.min(y1,y2)<=_265&&_265<=Math.max(y1,y2)){
return true;
}
}
return (_268%2)?true:false;
};
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.Stencil=Clazz.extend({construct:function(_26f,_270,_271,_272,_273){
arguments.callee.$.construct.apply(this,arguments);
if(!_26f){
throw "Stencilset seems corrupt.";
}
if(!_270){
throw "Stencil does not provide namespace.";
}
if(!_271){
throw "Stencil does not provide SVG source.";
}
if(!_272){
throw "Fatal internal error loading stencilset.";
}
this._source=_271;
this._jsonStencil=_26f;
this._stencilSet=_272;
this._namespace=_270;
this._view;
this._properties=new Hash();
if(!this._jsonStencil.type||!(this._jsonStencil.type==="edge"||this._jsonStencil.type==="node")){
throw "ORYX.Core.StencilSet.Stencil(construct): Type is not defined.";
}
if(!this._jsonStencil.id||this._jsonStencil.id===""){
throw "ORYX.Core.StencilSet.Stencil(construct): Id is not defined.";
}
if(!this._jsonStencil.title||this._jsonStencil.title===""){
throw "ORYX.Core.StencilSet.Stencil(construct): Title is not defined.";
}
if(!this._jsonStencil.description){
this._jsonStencil.description="";
}
if(!this._jsonStencil.groups){
this._jsonStencil.groups=[];
}
if(!this._jsonStencil.roles){
this._jsonStencil.roles=[];
}
this._jsonStencil.roles.push(this._jsonStencil.id);
this._jsonStencil.roles.each((function(role,_275){
this._jsonStencil.roles[_275]=_270+role;
}).bind(this));
this._jsonStencil.roles=this._jsonStencil.roles.uniq();
this._jsonStencil.id=_270+this._jsonStencil.id;
this.postProcessProperties();
if(!this._jsonStencil.serialize){
this._jsonStencil.serialize=function(_276,data){
return data;
};
}
if(!this._jsonStencil.deserialize){
this._jsonStencil.deserialize=function(_278,data){
return data;
};
}
if(!this._jsonStencil.layout){
this._jsonStencil.layout=function(_27a){
return true;
};
}
var url=_271+"view/"+_26f.view;
if(this._jsonStencil.view.trim().match(/</)){
var _27c=new DOMParser();
var xml=_27c.parseFromString(this._jsonStencil.view,"text/xml");
if(ORYX.Editor.checkClassType(xml.documentElement,SVGSVGElement)){
this._view=xml.documentElement;
var _27e=this._view.getElementsByTagNameNS("http://www.w3.org/2000/svg","image");
$A(_27e).each((function(_27f){
var link=_27f.getAttributeNodeNS("http://www.w3.org/1999/xlink","href");
if(link&&link.value.indexOf("://")==-1){
link.textContent=this._source+"view/"+link.value;
}
}).bind(this));
}else{
throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnSuccess): The response is not a SVG document.";
}
}else{
new Ajax.Request(url,{asynchronous:false,method:"get",onSuccess:this._loadSVGOnSuccess.bind(this),onFailure:this._loadSVGOnFailure.bind(this)});
}
},postProcessProperties:function(){
if(this._jsonStencil.icon&&this._jsonStencil.icon.indexOf("://")===-1){
this._jsonStencil.icon=this._source+"icons/"+this._jsonStencil.icon;
}else{
this._jsonStencil.icon="";
}
if(this._jsonStencil.properties&&this._jsonStencil.properties instanceof Array){
this._jsonStencil.properties.each((function(prop){
var _282=new ORYX.Core.StencilSet.Property(prop,this._namespace,this);
this._properties[_282.prefix()+"-"+_282.id()]=_282;
}).bind(this));
}
},equals:function(_283){
return (this.id()===_283.id());
},stencilSet:function(){
return this._stencilSet;
},type:function(){
return this._jsonStencil.type;
},namespace:function(){
return this._namespace;
},id:function(){
return this._jsonStencil.id;
},title:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonStencil,"title");
},description:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonStencil,"description");
},groups:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonStencil,"groups");
},view:function(){
return this._view.cloneNode(true)||this._view;
},icon:function(){
return this._jsonStencil.icon;
},hasMultipleRepositoryEntries:function(){
return (this.getRepositoryEntries().length>0);
},getRepositoryEntries:function(){
return (this._jsonStencil.repositoryEntries)?$A(this._jsonStencil.repositoryEntries):$A([]);
},properties:function(){
return this._properties.values();
},property:function(id){
return this._properties[id];
},roles:function(){
return this._jsonStencil.roles;
},serialize:function(_285,data){
return this._jsonStencil.serialize(_285,data);
},deserialize:function(_287,data){
return this._jsonStencil.deserialize(_287,data);
},layout:function(_289,_28a){
return this._jsonStencil.layout(_289,_28a);
},addProperty:function(_28b,_28c){
if(_28b&&_28c){
var _28d=new ORYX.Core.StencilSet.Property(_28b,_28c,this);
this._properties[_28d.prefix()+"-"+_28d.id()]=_28d;
}
},removeProperty:function(_28e){
if(_28e){
var _28f=this._properties.values().find(function(prop){
return (_28e==prop.id());
});
if(_28f){
delete this._properties[_28f.prefix()+"-"+_28f.id()];
}
}
},_loadSVGOnSuccess:function(_291){
var xml=null;
xml=_291.responseXML;
if(ORYX.Editor.checkClassType(xml.documentElement,SVGSVGElement)){
this._view=xml.documentElement;
var _293=this._view.getElementsByTagNameNS("http://www.w3.org/2000/svg","image");
$A(_293).each((function(_294){
var link=_294.getAttributeNodeNS("http://www.w3.org/1999/xlink","href");
if(link&&link.value.indexOf("://")==-1){
link.textContent=this._source+"view/"+link.value;
}
}).bind(this));
}else{
throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnSuccess): The response is not a SVG document.";
}
},_loadSVGOnFailure:function(_296){
throw "ORYX.Core.StencilSet.Stencil(_loadSVGOnFailure): Loading SVG document failed.";
},toString:function(){
return "Stencil "+this.title()+" ("+this.id()+")";
}});
function _evenMoreEvilHack(str,_298){
if(window.ActiveXObject){
var d=new ActiveXObject("MSXML.DomDocument");
d.loadXML(str);
return d;
}else{
if(window.XMLHttpRequest){
var req=new XMLHttpRequest;
req.open("GET","data:"+(_298||"application/xml")+";charset=utf-8,"+encodeURIComponent(str),false);
if(req.overrideMimeType){
req.overrideMimeType(_298);
}
req.send(null);
return req.responseXML;
}
}
}
function _evilSafariHack(_29b){
var xml=_29b;
var url="data:text/xml;charset=utf-8,"+encodeURIComponent(xml);
var dom=null;
var req=new XMLHttpRequest();
req.open("GET",url);
req.onload=function(){
dom=req.responseXML;
};
req.send(null);
return dom;
}
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.Property=Clazz.extend({construct:function(_2a0,_2a1,_2a2){
arguments.callee.$.construct.apply(this,arguments);
this._jsonProp=_2a0||ORYX.Log.error("Parameter jsonProp is not defined.");
this._namespace=_2a1||ORYX.Log.error("Parameter namespace is not defined.");
this._stencil=_2a2||ORYX.Log.error("Parameter stencil is not defined.");
this._items=new Hash();
this._complexItems=new Hash();
_2a0.id=_2a0.id||ORYX.Log.error("ORYX.Core.StencilSet.Property(construct): Id is not defined.");
_2a0.id=_2a0.id.toLowerCase();
if(!_2a0.type){
ORYX.Log.info("Type is not defined for stencil '%0', id '%1'. Falling back to 'String'.",_2a2,_2a0.id);
_2a0.type="string";
}else{
_2a0.type=_2a0.type.toLowerCase();
}
_2a0.prefix=_2a0.prefix||"oryx";
_2a0.title=_2a0.title||"";
_2a0.value=_2a0.value||"";
_2a0.description=_2a0.description||"";
_2a0.readonly=_2a0.readonly||false;
if(_2a0.optional!=false){
_2a0.optional=true;
}
if(this._jsonProp.refToView){
if(!(this._jsonProp.refToView instanceof Array)){
this._jsonProp.refToView=[this._jsonProp.refToView];
}
}else{
this._jsonProp.refToView=[];
}
if(_2a0.min===undefined||_2a0.min===null){
_2a0.min=Number.MIN_VALUE;
}
if(_2a0.max===undefined||_2a0.max===null){
_2a0.max=Number.MAX_VALUE;
}
if(!_2a0.fillOpacity){
_2a0.fillOpacity=false;
}
if(!_2a0.strokeOpacity){
_2a0.strokeOpacity=false;
}
if(_2a0.length===undefined||_2a0.length===null){
_2a0.length=Number.MAX_VALUE;
}
if(!_2a0.wrapLines){
_2a0.wrapLines=false;
}
if(!_2a0.dateFormat){
_2a0.dataFormat="m/d/y";
}
if(!_2a0.fill){
_2a0.fill=false;
}
if(!_2a0.stroke){
_2a0.stroke=false;
}
if(_2a0.type===ORYX.CONFIG.TYPE_CHOICE){
if(_2a0.items&&_2a0.items instanceof Array){
_2a0.items.each((function(_2a3){
this._items[_2a3.value]=new ORYX.Core.StencilSet.PropertyItem(_2a3,_2a1,this);
}).bind(this));
}else{
throw "ORYX.Core.StencilSet.Property(construct): No property items defined.";
}
}else{
if(_2a0.type===ORYX.CONFIG.TYPE_COMPLEX){
if(_2a0.complexItems&&_2a0.complexItems instanceof Array){
_2a0.complexItems.each((function(_2a4){
this._complexItems[_2a4.id]=new ORYX.Core.StencilSet.ComplexPropertyItem(_2a4,_2a1,this);
}).bind(this));
}else{
throw "ORYX.Core.StencilSet.Property(construct): No complex property items defined.";
}
}
}
},equals:function(_2a5){
return (this._namespace===_2a5.namespace()&&this.id()===_2a5.id())?true:false;
},namespace:function(){
return this._namespace;
},stencil:function(){
return this._stencil;
},id:function(){
return this._jsonProp.id;
},prefix:function(){
return this._jsonProp.prefix;
},type:function(){
return this._jsonProp.type;
},title:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonProp,"title");
},value:function(){
return this._jsonProp.value;
},readonly:function(){
return this._jsonProp.readonly;
},optional:function(){
return this._jsonProp.optional;
},description:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonProp,"description");
},refToView:function(){
return this._jsonProp.refToView;
},min:function(){
return this._jsonProp.min;
},max:function(){
return this._jsonProp.max;
},fillOpacity:function(){
return this._jsonProp.fillOpacity;
},strokeOpacity:function(){
return this._jsonProp.strokeOpacity;
},length:function(){
return this._jsonProp.length?this._jsonProp.length:Number.MAX_VALUE;
},wrapLines:function(){
return this._jsonProp.wrapLines;
},dateFormat:function(){
return this._jsonProp.dateFormat;
},fill:function(){
return this._jsonProp.fill;
},stroke:function(){
return this._jsonProp.stroke;
},items:function(){
return this._items.values();
},item:function(_2a6){
return this._items[_2a6];
},toString:function(){
return "Property "+this.title()+" ("+this.id()+")";
},complexItems:function(){
return this._complexItems.values();
},complexItem:function(id){
return this._complexItems[id];
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.PropertyItem=Clazz.extend({construct:function(_2a8,_2a9,_2aa){
arguments.callee.$.construct.apply(this,arguments);
if(!_2a8){
throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter jsonItem is not defined.";
}
if(!_2a9){
throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter namespace is not defined.";
}
if(!_2aa){
throw "ORYX.Core.StencilSet.PropertyItem(construct): Parameter property is not defined.";
}
this._jsonItem=_2a8;
this._namespace=_2a9;
this._property=_2aa;
if(!_2a8.value){
throw "ORYX.Core.StencilSet.PropertyItem(construct): Value is not defined.";
}
if(this._jsonItem.refToView){
if(!(this._jsonItem.refToView instanceof Array)){
this._jsonItem.refToView=[this._jsonItem.refToView];
}
}else{
this._jsonItem.refToView=[];
}
},equals:function(item){
return (this.property().equals(item.property())&&this.value()===item.value());
},namespace:function(){
return this._namespace;
},property:function(){
return this._property;
},value:function(){
return this._jsonItem.value;
},refToView:function(){
return this._jsonItem.refToView;
},toString:function(){
return "PropertyItem "+this.property()+" ("+this.value()+")";
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.ComplexPropertyItem=Clazz.extend({construct:function(_2ac,_2ad,_2ae){
arguments.callee.$.construct.apply(this,arguments);
if(!_2ac){
throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter jsonItem is not defined.";
}
if(!_2ad){
throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter namespace is not defined.";
}
if(!_2ae){
throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Parameter property is not defined.";
}
this._jsonItem=_2ac;
this._namespace=_2ad;
this._property=_2ae;
this._items=new Hash();
if(!_2ac.name){
throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Name is not defined.";
}
if(!_2ac.type){
throw "ORYX.Core.StencilSet.ComplexPropertyItem(construct): Type is not defined.";
}else{
_2ac.type=_2ac.type.toLowerCase();
}
if(_2ac.type===ORYX.CONFIG.TYPE_CHOICE){
if(_2ac.items&&_2ac.items instanceof Array){
_2ac.items.each((function(item){
this._items[item.value]=new ORYX.Core.StencilSet.PropertyItem(item,_2ad,this);
}).bind(this));
}else{
throw "ORYX.Core.StencilSet.Property(construct): No property items defined.";
}
}
},equals:function(item){
return (this.property().equals(item.property())&&this.name()===item.name());
},namespace:function(){
return this._namespace;
},property:function(){
return this._property;
},name:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonItem,"name");
},id:function(){
return this._jsonItem.id;
},type:function(){
return this._jsonItem.type;
},optional:function(){
return this._jsonItem.optional;
},width:function(){
return this._jsonItem.width;
},value:function(){
return this._jsonItem.value;
},items:function(){
return this._items.values();
},disable:function(){
return this._jsonItem.disable;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.Rules={construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this._stencilSets=[];
this._stencils=[];
this._cachedConnectSET=new Hash();
this._cachedConnectSE=new Hash();
this._cachedConnectTE=new Hash();
this._cachedCardSE=new Hash();
this._cachedCardTE=new Hash();
this._cachedContainPC=new Hash();
this._connectionRules=new Hash();
this._cardinalityRules=new Hash();
this._containmentRules=new Hash();
},initializeRules:function(_2b1){
var _2b2=this._stencilSets.find(function(ss){
return (ss.namespace()==_2b1.namespace());
});
if(_2b2){
var _2b4=this._stencilSets.clone();
_2b4=_2b4.without(_2b2);
_2b4.push(_2b1);
this._stencilSets=[];
this._stencils=[];
this._cachedConnectSET=new Hash();
this._cachedConnectSE=new Hash();
this._cachedConnectTE=new Hash();
this._cachedCardSE=new Hash();
this._cachedCardTE=new Hash();
this._cachedContainPC=new Hash();
this._connectionRules=new Hash();
this._cardinalityRules=new Hash();
this._containmentRules=new Hash();
_2b4.each(function(ss){
this.initializeRules(ss);
}.bind(this));
return;
}else{
this._stencilSets.push(_2b1);
var _2b6=_2b1.jsonRules();
var _2b7=_2b1.namespace();
this._stencils=this._stencils.concat(_2b1.stencils());
var cr=this._connectionRules;
if(_2b6.connectionRules){
_2b6.connectionRules.each((function(_2b9){
if(this._isRoleOfOtherNamespace(_2b9.role)){
if(!cr[_2b9.role]){
cr[_2b9.role]=new Hash();
}
}else{
if(!cr[_2b7+_2b9.role]){
cr[_2b7+_2b9.role]=new Hash();
}
}
_2b9.connects.each((function(_2ba){
var _2bb=[];
if(_2ba.to){
if(!(_2ba.to instanceof Array)){
_2ba.to=[_2ba.to];
}
_2ba.to.each((function(to){
if(this._isRoleOfOtherNamespace(to)){
_2bb.push(to);
}else{
_2bb.push(_2b7+to);
}
}).bind(this));
}
var role,from;
if(this._isRoleOfOtherNamespace(_2b9.role)){
role=_2b9.role;
}else{
role=_2b7+_2b9.role;
}
if(this._isRoleOfOtherNamespace(_2ba.from)){
from=_2ba.from;
}else{
from=_2b7+_2ba.from;
}
if(!cr[role][from]){
cr[role][from]=_2bb;
}else{
cr[role][from]=cr[role][from].concat(_2bb);
}
}).bind(this));
}).bind(this));
}
var _2bf=this._cardinalityRules;
if(_2b6.cardinalityRules){
_2b6.cardinalityRules.each((function(_2c0){
var _2c1;
if(this._isRoleOfOtherNamespace(_2c0.role)){
_2c1=_2c0.role;
}else{
_2c1=_2b7+_2c0.role;
}
if(!_2bf[_2c1]){
_2bf[_2c1]={};
for(i in _2c0){
_2bf[_2c1][i]=_2c0[i];
}
}
var oe=new Hash();
if(_2c0.outgoingEdges){
_2c0.outgoingEdges.each((function(rule){
if(this._isRoleOfOtherNamespace(rule.role)){
oe[rule.role]=rule;
}else{
oe[_2b7+rule.role]=rule;
}
}).bind(this));
}
_2bf[_2c1].outgoingEdges=oe;
var ie=new Hash();
if(_2c0.incomingEdges){
_2c0.incomingEdges.each((function(rule){
if(this._isRoleOfOtherNamespace(rule.role)){
ie[rule.role]=rule;
}else{
ie[_2b7+rule.role]=rule;
}
}).bind(this));
}
_2bf[_2c1].incomingEdges=ie;
}).bind(this));
}
var conr=this._containmentRules;
if(_2b6.containmentRules){
_2b6.containmentRules.each((function(_2c7){
var _2c8;
if(this._isRoleOfOtherNamespace(_2c7.role)){
_2c8=_2c7.role;
}else{
_2c8=_2b7+_2c7.role;
}
if(!conr[_2c8]){
conr[_2c8]=[];
}
_2c7.contains.each((function(_2c9){
if(this._isRoleOfOtherNamespace(_2c9)){
conr[_2c8].push(_2c9);
}else{
conr[_2c8].push(_2b7+_2c9);
}
}).bind(this));
}).bind(this));
}
}
},_cacheConnect:function(args){
result=this._canConnect(args);
if(args.sourceStencil&&args.targetStencil){
var _2cb=this._cachedConnectSET[args.sourceStencil.id()];
if(!_2cb){
_2cb=new Hash();
this._cachedConnectSET[args.sourceStencil.id()]=_2cb;
}
var edge=_2cb[args.edgeStencil.id()];
if(!edge){
edge=new Hash();
_2cb[args.edgeStencil.id()]=edge;
}
edge[args.targetStencil.id()]=result;
}else{
if(args.sourceStencil){
var _2cb=this._cachedConnectSE[args.sourceStencil.id()];
if(!_2cb){
_2cb=new Hash();
this._cachedConnectSE[args.sourceStencil.id()]=_2cb;
}
_2cb[args.edgeStencil.id()]=result;
}else{
var _2cd=this._cachedConnectTE[args.targetStencil.id()];
if(!_2cd){
_2cd=new Hash();
this._cachedConnectTE[args.targetStencil.id()]=_2cd;
}
_2cd[args.edgeStencil.id()]=result;
}
}
return result;
},_cacheCard:function(args){
if(args.sourceStencil){
var _2cf=this._cachedCardSE[args.sourceStencil.id()];
if(!_2cf){
_2cf=new Hash();
this._cachedCardSE[args.sourceStencil.id()]=_2cf;
}
var max=this._getMaximumNumberOfOutgoingEdge(args);
if(max==undefined){
max=-1;
}
_2cf[args.edgeStencil.id()]=max;
}
if(args.targetStencil){
var _2d1=this._cachedCardTE[args.targetStencil.id()];
if(!_2d1){
_2d1=new Hash();
this._cachedCardTE[args.targetStencil.id()]=_2d1;
}
var max=this._getMaximumNumberOfIncomingEdge(args);
if(max==undefined){
max=-1;
}
_2d1[args.edgeStencil.id()]=max;
}
},_cacheContain:function(args){
var _2d3=[this._canContain(args),this._getMaximumOccurrence(args.containingStencil,args.containedStencil)];
if(_2d3[1]==undefined){
_2d3[1]=-1;
}
var _2d4=this._cachedContainPC[args.containingStencil.id()];
if(!_2d4){
_2d4=new Hash();
this._cachedContainPC[args.containingStencil.id()]=_2d4;
}
_2d4[args.containedStencil.id()]=_2d3;
return _2d3;
},outgoingEdgeStencils:function(args){
if(!args.sourceShape&&!args.sourceStencil){
return [];
}
if(args.sourceShape){
args.sourceStencil=args.sourceShape.getStencil();
}
var _2d6=[];
this._stencils.each((function(_2d7){
if(_2d7.type()==="edge"){
var _2d8=Object.clone(args);
_2d8.edgeStencil=_2d7;
if(this.canConnect(_2d8)){
_2d6.push(_2d7);
}
}
}).bind(this));
return _2d6;
},incomingEdgeStencils:function(args){
if(!args.targetShape&&!args.targetStencil){
return [];
}
if(args.targetShape){
args.targetStencil=args.targetShape.getStencil();
}
var _2da=[];
this._stencils.each((function(_2db){
if(_2db.type()==="edge"){
var _2dc=Object.clone(args);
_2dc.edgeStencil=_2db;
if(this.canConnect(_2dc)){
_2da.push(_2db);
}
}
}).bind(this));
return _2da;
},sourceStencils:function(args){
if(!args||!args.edgeShape&&!args.edgeStencil){
return [];
}
if(args.targetShape){
args.targetStencil=args.targetShape.getStencil();
}
if(args.edgeShape){
args.edgeStencil=args.edgeShape.getStencil();
}
var _2de=[];
this._stencils.each((function(_2df){
var _2e0=Object.clone(args);
_2e0.sourceStencil=_2df;
if(this.canConnect(_2e0)){
_2de.push(_2df);
}
}).bind(this));
return _2de;
},targetStencils:function(args){
if(!args||!args.edgeShape&&!args.edgeStencil){
return [];
}
if(args.sourceShape){
args.sourceStencil=args.sourceShape.getStencil();
}
if(args.edgeShape){
args.edgeStencil=args.edgeShape.getStencil();
}
var _2e2=[];
this._stencils.each((function(_2e3){
var _2e4=Object.clone(args);
_2e4.targetStencil=_2e3;
if(this.canConnect(_2e4)){
_2e2.push(_2e3);
}
}).bind(this));
return _2e2;
},canConnect:function(args){
if(!args||(!args.sourceShape&&!args.sourceStencil&&!args.targetShape&&!args.targetStencil)||!args.edgeShape&&!args.edgeStencil){
return false;
}
if(args.sourceShape){
args.sourceStencil=args.sourceShape.getStencil();
}
if(args.targetShape){
args.targetStencil=args.targetShape.getStencil();
}
if(args.edgeShape){
args.edgeStencil=args.edgeShape.getStencil();
}
var _2e6;
if(args.sourceStencil&&args.targetStencil){
var _2e7=this._cachedConnectSET[args.sourceStencil.id()];
if(!_2e7){
_2e6=this._cacheConnect(args);
}else{
var edge=_2e7[args.edgeStencil.id()];
if(!edge){
_2e6=this._cacheConnect(args);
}else{
var _2e9=edge[args.targetStencil.id()];
if(_2e9==undefined){
_2e6=this._cacheConnect(args);
}else{
_2e6=_2e9;
}
}
}
}else{
if(args.sourceStencil){
var _2e7=this._cachedConnectSE[args.sourceStencil.id()];
if(!_2e7){
_2e6=this._cacheConnect(args);
}else{
var edge=_2e7[args.edgeStencil.id()];
if(edge==undefined){
_2e6=this._cacheConnect(args);
}else{
_2e6=edge;
}
}
}else{
var _2e9=this._cachedConnectTE[args.targetStencil.id()];
if(!_2e9){
_2e6=this._cacheConnect(args);
}else{
var edge=_2e9[args.edgeStencil.id()];
if(edge==undefined){
_2e6=this._cacheConnect(args);
}else{
_2e6=edge;
}
}
}
}
if(_2e6){
if(args.sourceShape){
var _2e7=this._cachedCardSE[args.sourceStencil.id()];
if(!_2e7){
this._cacheCard(args);
_2e7=this._cachedCardSE[args.sourceStencil.id()];
}
var max=_2e7[args.edgeStencil.id()];
if(max==undefined){
this._cacheCard(args);
}
max=_2e7[args.edgeStencil.id()];
if(max!=-1){
_2e6=args.sourceShape.getOutgoingShapes().all(function(cs){
if((cs.getStencil().id()===args.edgeStencil.id())&&((args.edgeShape)?cs!==args.edgeShape:true)){
max--;
return (max>0)?true:false;
}else{
return true;
}
});
}
}
if(args.targetShape){
var _2e9=this._cachedCardTE[args.targetStencil.id()];
if(!_2e9){
this._cacheCard(args);
_2e9=this._cachedCardTE[args.targetStencil.id()];
}
var max=_2e9[args.edgeStencil.id()];
if(max==undefined){
this._cacheCard(args);
}
max=_2e9[args.edgeStencil.id()];
if(max!=-1){
_2e6=args.targetShape.getIncomingShapes().all(function(cs){
if((cs.getStencil().id()===args.edgeStencil.id())&&((args.edgeShape)?cs!==args.edgeShape:true)){
max--;
return (max>0)?true:false;
}else{
return true;
}
});
}
}
}
return _2e6;
},_canConnect:function(args){
if(!args||(!args.sourceShape&&!args.sourceStencil&&!args.targetShape&&!args.targetStencil)||!args.edgeShape&&!args.edgeStencil){
return false;
}
if(args.sourceShape){
args.sourceStencil=args.sourceShape.getStencil();
}
if(args.targetShape){
args.targetStencil=args.targetShape.getStencil();
}
if(args.edgeShape){
args.edgeStencil=args.edgeShape.getStencil();
}
var _2ee;
var _2ef=this._getConnectionRulesOfEdgeStencil(args.edgeStencil);
if(_2ef.keys().length===0){
_2ee=false;
}else{
if(args.sourceStencil){
_2ee=args.sourceStencil.roles().any(function(_2f0){
var _2f1=_2ef[_2f0];
if(!_2f1){
return false;
}
if(args.targetStencil){
return (_2f1.any(function(_2f2){
return args.targetStencil.roles().member(_2f2);
}));
}else{
return true;
}
});
}else{
_2ee=_2ef.values().any(function(_2f3){
return args.targetStencil.roles().any(function(_2f4){
return _2f3.member(_2f4);
});
});
}
}
return _2ee;
},canContain:function(args){
if(!args||!args.containingStencil&&!args.containingShape||!args.containedStencil&&!args.containedShape){
return false;
}
if(args.containedShape){
args.containedStencil=args.containedShape.getStencil();
}
if(args.containingShape){
args.containingStencil=args.containingShape.getStencil();
}
if(args.containingStencil.type()=="edge"||args.containedStencil.type()=="edge"){
return false;
}
var _2f6;
var _2f7=this._cachedContainPC[args.containingStencil.id()];
if(!_2f7){
_2f6=this._cacheContain(args);
}else{
_2f6=_2f7[args.containedStencil.id()];
if(!_2f6){
_2f6=this._cacheContain(args);
}
}
if(!_2f6[0]){
return false;
}else{
if(_2f6[1]==-1){
return true;
}else{
if(args.containingShape){
var max=_2f6[1];
return args.containingShape.getChildShapes(false).all(function(as){
if(as.getStencil().id()===args.containedStencil.id()){
max--;
return (max>0)?true:false;
}else{
return true;
}
});
}else{
return true;
}
}
}
},_canContain:function(args){
if(!args||!args.containingStencil&&!args.containingShape||!args.containedStencil&&!args.containedShape){
return false;
}
if(args.containedShape){
args.containedStencil=args.containedShape.getStencil();
}
if(args.containingShape){
args.containingStencil=args.containingShape.getStencil();
}
if(args.containingShape){
if(args.containingShape instanceof ORYX.Core.Edge){
return false;
}
}
var _2fb;
_2fb=args.containingStencil.roles().any((function(role){
var _2fd=this._containmentRules[role];
if(_2fd){
return _2fd.any(function(role){
return args.containedStencil.roles().member(role);
});
}else{
return false;
}
}).bind(this));
return _2fb;
},_stencilsWithRole:function(role){
return this._stencils.findAll(function(_300){
return (_300.roles().member(role))?true:false;
});
},_edgesWithRole:function(role){
return this._stencils.findAll(function(_302){
return (_302.roles().member(role)&&_302.type()==="edge")?true:false;
});
},_nodesWithRole:function(role){
return this._stencils.findAll(function(_304){
return (_304.roles().member(role)&&_304.type()==="node")?true:false;
});
},_getMaximumOccurrence:function(_305,_306){
var max;
_306.roles().each((function(role){
var _309=this._cardinalityRules[role];
if(_309&&_309.maximumOccurrence){
if(max){
max=Math.min(max,_309.maximumOccurrence);
}else{
max=_309.maximumOccurrence;
}
}
}).bind(this));
return max;
},_getMaximumNumberOfOutgoingEdge:function(args){
if(!args||!args.sourceStencil||!args.edgeStencil){
return false;
}
var max;
args.sourceStencil.roles().each((function(role){
var _30d=this._cardinalityRules[role];
if(_30d&&_30d.outgoingEdges){
args.edgeStencil.roles().each(function(_30e){
var oe=_30d.outgoingEdges[_30e];
if(oe&&oe.maximum){
if(max){
max=Math.min(max,oe.maximum);
}else{
max=oe.maximum;
}
}
});
}
}).bind(this));
return max;
},_getMaximumNumberOfIncomingEdge:function(args){
if(!args||!args.targetStencil||!args.edgeStencil){
return false;
}
var max;
args.targetStencil.roles().each((function(role){
var _313=this._cardinalityRules[role];
if(_313&&_313.incomingEdges){
args.edgeStencil.roles().each(function(_314){
var ie=_313.incomingEdges[_314];
if(ie&&ie.maximum){
if(max){
max=Math.min(max,ie.maximum);
}else{
max=ie.maximum;
}
}
});
}
}).bind(this));
return max;
},_getConnectionRulesOfEdgeStencil:function(_316){
var _317=new Hash();
_316.roles().each((function(role){
if(this._connectionRules[role]){
this._connectionRules[role].each(function(cr){
if(_317[cr.key]){
_317[cr.key]=_317[cr.key].concat(cr.value);
}else{
_317[cr.key]=cr.value;
}
});
}
}).bind(this));
return _317;
},_isRoleOfOtherNamespace:function(role){
return (role.indexOf("#")>0);
},toString:function(){
return "Rules";
}};
ORYX.Core.StencilSet.Rules=Clazz.extend(ORYX.Core.StencilSet.Rules);
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet.StencilSet=Clazz.extend({construct:function(_31b){
arguments.callee.$.construct.apply(this,arguments);
if(!_31b){
throw "ORYX.Core.StencilSet.StencilSet(construct): Parameter 'source' is not defined.";
}
if(_31b.endsWith("/")){
_31b=_31b.substr(0,_31b.length-1);
}
this._extensions=new Hash();
this._source=_31b;
this._baseUrl=_31b.substring(0,_31b.lastIndexOf("/")+1);
this._jsonObject={};
this._stencils=new Hash();
this._availableStencils=new Hash();
new Ajax.Request(_31b,{asynchronous:false,method:"get",onSuccess:this._init.bind(this),onFailure:this._cancelInit.bind(this)});
if(this.errornous){
throw "Loading stencil set "+_31b+" failed.";
}
},findRootStencilName:function(){
var _31c=this._stencils.values().find(function(_31d){
return _31d._jsonStencil.mayBeRoot;
});
if(!_31c){
ORYX.Log.warn("Did not find any stencil that may be root. Taking a guess.");
_31c=this._stencils.values()[0];
}
return _31c.id();
},equals:function(_31e){
return (this.namespace()===_31e.namespace());
},stencils:function(_31f,_320){
if(_31f&&_320){
var _321=this._availableStencils.values();
var _322=[_31f];
var _323=[];
var _324=[];
while(_322.size()>0){
var _325=_322.pop();
_323.push(_325);
var _326=_321.findAll(function(_327){
var args={containingStencil:_325,containedStencil:_327};
return _320.canContain(args);
});
for(var i=0;i<_326.size();i++){
if(!_323.member(_326[i])){
_322.push(_326[i]);
}
}
_324=_324.concat(_326).uniq();
}
var _32a=_321.findAll(function(_32b){
return _32b.type()=="edge";
});
_324=_324.concat(_32a);
return _324;
}else{
return this._availableStencils.values();
}
},nodes:function(){
return this._availableStencils.values().findAll(function(_32c){
return (_32c.type()==="node");
});
},edges:function(){
return this._availableStencils.values().findAll(function(_32d){
return (_32d.type()==="edge");
});
},stencil:function(id){
return this._stencils[id];
},title:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonObject,"title");
},description:function(){
return ORYX.Core.StencilSet.getTranslation(this._jsonObject,"description");
},namespace:function(){
return this._jsonObject?this._jsonObject.namespace:null;
},jsonRules:function(){
return this._jsonObject?this._jsonObject.rules:null;
},source:function(){
return this._source;
},extensions:function(){
return this._extensions;
},addExtension:function(url){
new Ajax.Request(url,{method:"GET",asynchronous:false,onSuccess:(function(_330){
this.addExtensionDirectly(_330.responseText);
}).bind(this),onFailure:(function(_331){
ORYX.Log.debug("Loading stencil set extension file failed. The request returned an error."+_331);
}).bind(this),onException:(function(_332){
ORYX.Log.debug("Loading stencil set extension file failed. The request returned an error."+_332);
}).bind(this)});
},addExtensionDirectly:function(str){
try{
eval("var jsonExtension = "+str);
if(!(jsonExtension["extends"].endsWith("#"))){
jsonExtension["extends"]+="#";
}
if(jsonExtension["extends"]==this.namespace()){
this._extensions[jsonExtension.namespace]=jsonExtension;
if(jsonExtension.stencils){
$A(jsonExtension.stencils).each(function(_334){
var _335=new ORYX.Core.StencilSet.Stencil(_334,this.namespace(),this._baseUrl,this);
this._stencils[_335.id()]=_335;
this._availableStencils[_335.id()]=_335;
}.bind(this));
}
if(jsonExtension.properties){
var _336=this._stencils.values();
_336.each(function(_337){
var _338=_337.roles();
jsonExtension.properties.each(function(prop){
prop.roles.any(function(role){
role=jsonExtension["extends"]+role;
if(_338.member(role)){
prop.properties.each(function(_33b){
_337.addProperty(_33b,jsonExtension.namespace);
});
return true;
}else{
return false;
}
});
});
}.bind(this));
}
if(jsonExtension.removeproperties){
jsonExtension.removeproperties.each(function(_33c){
var _33d=this.stencil(jsonExtension["extends"]+_33c.stencil);
if(_33d){
_33c.properties.each(function(_33e){
_33d.removeProperty(_33e);
});
}
}.bind(this));
}
if(jsonExtension.removestencils){
$A(jsonExtension.removestencils).each(function(_33f){
delete this._availableStencils[jsonExtension["extends"]+_33f];
}.bind(this));
}
}
}
catch(e){
ORYX.Log.debug("StencilSet.addExtension: Something went wrong when initialising the stencil set extension. "+e);
}
},__handleStencilset:function(_340){
try{
eval("this._jsonObject ="+_340.responseText);
}
catch(e){
throw "Stenciset corrupt: "+e;
}
if(!this._jsonObject){
throw "Error evaluating stencilset. It may be corrupt.";
}
with(this._jsonObject){
if(!namespace||namespace===""){
throw "Namespace definition missing in stencilset.";
}
if(!(stencils instanceof Array)){
throw "Stencilset corrupt.";
}
if(!namespace.endsWith("#")){
namespace=namespace+"#";
}
if(!title){
title="";
}
if(!description){
description="";
}
}
},_init:function(_341){
this.__handleStencilset(_341);
$A(this._jsonObject.stencils).each((function(_342){
var _343=new ORYX.Core.StencilSet.Stencil(_342,this.namespace(),this._baseUrl,this);
this._stencils[_343.id()]=_343;
this._availableStencils[_343.id()]=_343;
}).bind(this));
},_cancelInit:function(_344){
this.errornous=true;
},toString:function(){
return "StencilSet "+this.title()+" ("+this.namespace()+")";
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.StencilSet){
ORYX.Core.StencilSet={};
}
ORYX.Core.StencilSet._stencilSetsByNamespace=new Hash();
ORYX.Core.StencilSet._stencilSetsByUrl=new Hash();
ORYX.Core.StencilSet._StencilSetNSByEditorInstance=new Hash();
ORYX.Core.StencilSet._rulesByEditorInstance=new Hash();
ORYX.Core.StencilSet.stencilSets=function(_345){
var _346=ORYX.Core.StencilSet._StencilSetNSByEditorInstance[_345];
var _347=new Hash();
if(_346){
_346.each(function(_348){
var _349=ORYX.Core.StencilSet.stencilSet(_348);
_347[_349.namespace()]=_349;
});
}
return _347;
};
ORYX.Core.StencilSet.stencilSet=function(_34a){
ORYX.Log.trace("Getting stencil set %0",_34a);
var _34b=_34a.split("#",1);
if(_34b.length===1){
ORYX.Log.trace("Getting stencil set %0",_34b[0]);
return ORYX.Core.StencilSet._stencilSetsByNamespace[_34b[0]+"#"];
}else{
return undefined;
}
};
ORYX.Core.StencilSet.stencil=function(id){
ORYX.Log.trace("Getting stencil for %0",id);
var ss=ORYX.Core.StencilSet.stencilSet(id);
if(ss){
return ss.stencil(id);
}else{
ORYX.Log.trace("Cannot fild stencil for %0",id);
return undefined;
}
};
ORYX.Core.StencilSet.rules=function(_34e){
if(!ORYX.Core.StencilSet._rulesByEditorInstance[_34e]){
ORYX.Core.StencilSet._rulesByEditorInstance[_34e]=new ORYX.Core.StencilSet.Rules();
}
return ORYX.Core.StencilSet._rulesByEditorInstance[_34e];
};
ORYX.Core.StencilSet.loadStencilSet=function(url,_350){
var _351=ORYX.Core.StencilSet._stencilSetsByUrl[url];
if(!_351){
_351=new ORYX.Core.StencilSet.StencilSet(url);
ORYX.Core.StencilSet._stencilSetsByNamespace[_351.namespace()]=_351;
ORYX.Core.StencilSet._stencilSetsByUrl[url]=_351;
}
var _352=_351.namespace();
if(ORYX.Core.StencilSet._StencilSetNSByEditorInstance[_350]){
ORYX.Core.StencilSet._StencilSetNSByEditorInstance[_350].push(_352);
}else{
ORYX.Core.StencilSet._StencilSetNSByEditorInstance[_350]=[_352];
}
if(ORYX.Core.StencilSet._rulesByEditorInstance[_350]){
ORYX.Core.StencilSet._rulesByEditorInstance[_350].initializeRules(_351);
}else{
var _353=new ORYX.Core.StencilSet.Rules();
_353.initializeRules(_351);
ORYX.Core.StencilSet._rulesByEditorInstance[_350]=_353;
}
};
ORYX.Core.StencilSet.getTranslation=function(_354,name){
var lang=ORYX.I18N.Language.toLowerCase();
var _357=_354[name+"_"+lang];
if(_357){
return _357;
}
_357=_354[name+"_"+lang.substr(0,2)];
if(_357){
return _357;
}
return _354[name];
};
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Bounds=Clazz.extend({construct:function(){
this._changedCallbacks=[];
this.a={};
this.b={};
this.set.apply(this,arguments);
this.suspendChange=false;
this.changedWhileSuspend=false;
},_changed:function(_358){
if(!this.suspendChange){
this._changedCallbacks.each(function(_359){
_359(this,_358);
}.bind(this));
this.changedWhileSuspend=false;
}else{
this.changedWhileSuspend=true;
}
},registerCallback:function(_35a){
if(!this._changedCallbacks.member(_35a)){
this._changedCallbacks.push(_35a);
}
},unregisterCallback:function(_35b){
this._changedCallbacks=this._changedCallbacks.without(_35b);
},set:function(){
var _35c=false;
switch(arguments.length){
case 1:
if(this.a.x!==arguments[0].a.x){
_35c=true;
this.a.x=arguments[0].a.x;
}
if(this.a.y!==arguments[0].a.y){
_35c=true;
this.a.y=arguments[0].a.y;
}
if(this.b.x!==arguments[0].b.x){
_35c=true;
this.b.x=arguments[0].b.x;
}
if(this.b.y!==arguments[0].b.y){
_35c=true;
this.b.y=arguments[0].b.y;
}
break;
case 2:
var ax=Math.min(arguments[0].x,arguments[1].x);
var ay=Math.min(arguments[0].y,arguments[1].y);
var bx=Math.max(arguments[0].x,arguments[1].x);
var by=Math.max(arguments[0].y,arguments[1].y);
if(this.a.x!==ax){
_35c=true;
this.a.x=ax;
}
if(this.a.y!==ay){
_35c=true;
this.a.y=ay;
}
if(this.b.x!==bx){
_35c=true;
this.b.x=bx;
}
if(this.b.y!==by){
_35c=true;
this.b.y=by;
}
break;
case 4:
var ax=Math.min(arguments[0],arguments[2]);
var ay=Math.min(arguments[1],arguments[3]);
var bx=Math.max(arguments[0],arguments[2]);
var by=Math.max(arguments[1],arguments[3]);
if(this.a.x!==ax){
_35c=true;
this.a.x=ax;
}
if(this.a.y!==ay){
_35c=true;
this.a.y=ay;
}
if(this.b.x!==bx){
_35c=true;
this.b.x=bx;
}
if(this.b.y!==by){
_35c=true;
this.b.y=by;
}
break;
}
if(_35c){
this._changed(true);
}
},moveTo:function(){
var _361=this.upperLeft();
switch(arguments.length){
case 1:
this.moveBy({x:arguments[0].x-_361.x,y:arguments[0].y-_361.y});
break;
case 2:
this.moveBy({x:arguments[0]-_361.x,y:arguments[1]-_361.y});
break;
default:
}
},moveBy:function(){
var _362=false;
switch(arguments.length){
case 1:
var p=arguments[0];
if(p.x!==0||p.y!==0){
_362=true;
this.a.x+=p.x;
this.b.x+=p.x;
this.a.y+=p.y;
this.b.y+=p.y;
}
break;
case 2:
var x=arguments[0];
var y=arguments[1];
if(x!==0||y!==0){
_362=true;
this.a.x+=x;
this.b.x+=x;
this.a.y+=y;
this.b.y+=y;
}
break;
default:
}
if(_362){
this._changed();
}
},include:function(b){
if((this.a.x===undefined)&&(this.a.y===undefined)&&(this.b.x===undefined)&&(this.b.y===undefined)){
return b;
}
var cx=Math.min(this.a.x,b.a.x);
var cy=Math.min(this.a.y,b.a.y);
var dx=Math.max(this.b.x,b.b.x);
var dy=Math.max(this.b.y,b.b.y);
this.set(cx,cy,dx,dy);
},extend:function(p){
if(p.x!==0||p.y!==0){
this.b.x+=p.x;
this.b.y+=p.y;
this._changed(true);
}
},widen:function(x){
if(x!==0){
this.suspendChange=true;
this.moveBy({x:-x,y:-x});
this.extend({x:2*x,y:2*x});
this.suspendChange=false;
if(this.changedWhileSuspend){
this._changed(true);
}
}
},upperLeft:function(){
return {x:this.a.x,y:this.a.y};
},lowerRight:function(){
return {x:this.b.x,y:this.b.y};
},width:function(){
return this.b.x-this.a.x;
},height:function(){
return this.b.y-this.a.y;
},center:function(){
return {x:(this.a.x+this.b.x)/2,y:(this.a.y+this.b.y)/2};
},midPoint:function(){
return {x:(this.b.x-this.a.x)/2,y:(this.b.y-this.a.y)/2};
},centerMoveTo:function(){
var _36d=this.center();
switch(arguments.length){
case 1:
this.moveBy(arguments[0].x-_36d.x,arguments[0].y-_36d.y);
break;
case 2:
this.moveBy(arguments[0]-_36d.x,arguments[1]-_36d.y);
break;
}
},isIncluded:function(_36e){
var _36f,_370;
switch(arguments.length){
case 1:
_36f=arguments[0].x;
_370=arguments[0].y;
break;
case 2:
_36f=arguments[0];
_370=arguments[1];
break;
default:
throw "isIncluded needs one or two arguments";
}
var ul=this.upperLeft();
var lr=this.lowerRight();
if(_36f>=ul.x&&_36f<=lr.x&&_370>=ul.y&&_370<=lr.y){
return true;
}else{
return false;
}
},clone:function(){
return new ORYX.Core.Bounds(this);
},toString:function(){
return "( "+this.a.x+" | "+this.a.y+" )/( "+this.b.x+" | "+this.b.y+" )";
},serializeForERDF:function(){
return this.a.x+","+this.a.y+","+this.b.x+","+this.b.y;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.UIObject={construct:function(_373){
this.isChanged=true;
this.isResized=true;
this.isVisible=true;
this.isSelectable=false;
this.isResizable=false;
this.isMovable=false;
this.id=ORYX.Editor.provideId();
this.parent=undefined;
this.node=undefined;
this.children=[];
this.bounds=new ORYX.Core.Bounds();
this._changedCallback=this._changed.bind(this);
this.bounds.registerCallback(this._changedCallback);
if(_373&&_373.eventHandlerCallback){
this.eventHandlerCallback=_373.eventHandlerCallback;
}
},_changed:function(_374,_375){
this.isChanged=true;
if(this.bounds==_374){
this.isResized=_375;
}
},update:function(){
if(this.isChanged){
this.refresh();
this.isChanged=false;
this.children.each(function(_376){
_376.update();
});
}
},refresh:function(){
},getChildren:function(){
return this.children.clone();
},getId:function(){
return this.id;
},getChildById:function(id,deep){
return this.children.find(function(_379){
if(_379.getId()===id){
return _379;
}else{
if(deep){
var obj=_379.getChildById(id,deep);
if(obj){
return obj;
}
}
}
});
},add:function(_37b){
if(!(this.children.member(_37b))){
if(_37b.parent){
_37b.remove(_37b);
}
this.children.push(_37b);
_37b.parent=this;
_37b.node=this.node.appendChild(_37b.node);
_37b.bounds.registerCallback(this._changedCallback);
}else{
ORYX.Log.info("add: ORYX.Core.UIObject is already a child of this object.");
}
},remove:function(_37c){
if(this.children.member(_37c)){
this.children=this._uiObjects.without(_37c);
_37c.parent=undefined;
_37c.node=this.node.removeChild(_37c.node);
_37c.bounds.unregisterCallback(this._changedCallback);
}else{
ORYX.Log.info("remove: ORYX.Core.UIObject is not a child of this object.");
}
},absoluteBounds:function(){
if(this.parent){
var _37d=this.absoluteXY();
return new ORYX.Core.Bounds(_37d.x,_37d.y,_37d.x+this.bounds.width(),_37d.y+this.bounds.height());
}else{
return this.bounds.clone();
}
},absoluteXY:function(){
if(this.parent){
var pXY=this.parent.absoluteXY();
return {x:pXY.x+this.bounds.upperLeft().x,y:pXY.y+this.bounds.upperLeft().y};
}else{
return {x:this.bounds.upperLeft().x,y:this.bounds.upperLeft().y};
}
},absoluteCenterXY:function(){
if(this.parent){
var pXY=this.parent.absoluteXY();
return {x:pXY.x+this.bounds.center().x,y:pXY.y+this.bounds.center().y};
}else{
return {x:this.bounds.center().x,y:this.bounds.center().y};
}
},hide:function(){
this.node.setAttributeNS(null,"display","none");
this.isVisible=false;
this.children.each(function(_380){
_380.hide();
});
},show:function(){
this.node.setAttributeNS(null,"display","inherit");
this.isVisible=true;
this.children.each(function(_381){
_381.show();
});
},addEventHandlers:function(node){
node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this._delegateEvent.bind(this),false);
node.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this._delegateEvent.bind(this),false);
node.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this._delegateEvent.bind(this),false);
node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER,this._delegateEvent.bind(this),false);
node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT,this._delegateEvent.bind(this),false);
node.addEventListener("click",this._delegateEvent.bind(this),false);
node.addEventListener(ORYX.CONFIG.EVENT_DBLCLICK,this._delegateEvent.bind(this),false);
},_delegateEvent:function(_383){
if(this.eventHandlerCallback){
this.eventHandlerCallback(_383,this);
}
},toString:function(){
return "UIObject "+this.id;
}};
ORYX.Core.UIObject=Clazz.extend(ORYX.Core.UIObject);
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.AbstractShape={construct:function(_384,_385){
arguments.callee.$.construct.apply(this,arguments);
this.resourceId=ORYX.Editor.provideId();
this._stencil=_385;
if(this._stencil._jsonStencil.superId){
stencilId=this._stencil.id();
superStencilId=stencilId.substring(0,stencilId.indexOf("#")+1)+_385._jsonStencil.superId;
stencilSet=this._stencil.stencilSet();
this._stencil=stencilSet.stencil(superStencilId);
}
this.properties=new Hash();
this.propertiesChanged=new Hash();
this._stencil.properties().each((function(_386){
var key=_386.prefix()+"-"+_386.id();
this.properties[key]=_386.value();
this.propertiesChanged[key]=true;
}).bind(this));
_385.properties().each((function(_388){
var key=_388.prefix()+"-"+_388.id();
this.properties[key]=_388.value();
this.propertiesChanged[key]=true;
}).bind(this));
},layout:function(){
},getStencil:function(){
return this._stencil;
},getChildShapeByResourceId:function(_38a){
_38a=ERDF.__stripHashes(_38a);
return this.getChildShapes(true).find(function(_38b){
return _38b.resourceId==_38a;
});
},getChildShapes:function(deep,_38d){
var _38e=[];
this.children.each(function(_38f){
if(_38f instanceof ORYX.Core.Shape&&_38f.isVisible){
if(_38d){
_38d(_38f);
}
_38e.push(_38f);
if(deep){
_38e=_38e.concat(_38f.getChildShapes(deep,_38d));
}
}
});
return _38e;
},getChildNodes:function(deep,_391){
var _392=[];
this.children.each(function(_393){
if(_393 instanceof ORYX.Core.Node&&_393.isVisible){
if(_391){
_391(_393);
}
_392.push(_393);
}
if(_393 instanceof ORYX.Core.Shape){
if(deep){
_392=_392.concat(_393.getChildNodes(deep,_391));
}
}
});
return _392;
},getChildEdges:function(deep,_395){
var _396=[];
this.children.each(function(_397){
if(_397 instanceof ORYX.Core.Edge&&_397.isVisible){
if(_395){
_395(_397);
}
_396.push(_397);
}
if(_397 instanceof ORYX.Core.Shape){
if(deep){
_396=_396.concat(_397.getChildEdges(deep,_395));
}
}
});
return _396;
},getAbstractShapesAtPosition:function(){
var x,y;
switch(arguments.length){
case 1:
x=arguments[0].x;
y=arguments[0].y;
break;
case 2:
x=arguments[0];
y=arguments[1];
break;
default:
throw "getAbstractShapesAtPosition needs 1 or 2 arguments!";
}
if(this.isPointIncluded(x,y)){
var _39a=[];
_39a.push(this);
var _39b=this.getChildNodes();
var _39c=this.getChildEdges();
[_39b,_39c].each(function(ne){
var _39e=new Hash();
ne.each(function(node){
if(!node.isVisible){
return;
}
var _3a0=node.getAbstractShapesAtPosition(x,y);
if(_3a0.length>0){
var _3a1=$A(node.node.parentNode.childNodes);
var _3a2=_3a1.indexOf(node.node);
_39e[_3a2]=_3a0;
}
});
_39e.keys().sort().each(function(key){
_39a=_39a.concat(_39e[key]);
});
});
return _39a;
}else{
return [];
}
},setProperty:function(key,_3a5){
var _3a6=this.properties[key];
if(_3a6!==_3a5){
this.properties[key]=_3a5;
this.propertiesChanged[key]=true;
this._changed();
window.setTimeout(function(){
this._delegateEvent({type:ORYX.CONFIG.EVENT_PROPERTY_CHANGED,name:key,value:_3a5,oldValue:_3a6});
}.bind(this),10);
}
},isPointIncluded:function(_3a7,_3a8,_3a9){
var _3aa=_3a9?_3a9:this.absoluteBounds();
return _3aa.isIncluded(_3a7,_3a8);
},serialize:function(){
var _3ab=[];
_3ab.push({name:"type",prefix:"oryx",value:this.getStencil().id(),type:"literal"});
this.getStencil().properties().each((function(_3ac){
var _3ad=_3ac.prefix();
var name=_3ac.id();
_3ab.push({name:name,prefix:_3ad,value:this.properties[_3ad+"-"+name],type:"literal"});
}).bind(this));
return _3ab;
},deserialize:function(_3af){
var _3b0=0;
_3af.each((function(obj){
var name=obj.name;
var _3b3=obj.prefix;
var _3b4=obj.value;
switch(_3b3+"-"+name){
case "raziel-parent":
if(!this.parent){
break;
}
var _3b5=this.getCanvas().getChildShapeByResourceId(_3b4);
if(_3b5){
_3b5.add(this);
}
break;
default:
if(this.properties.keys().member(_3b3+"-"+name)){
this.setProperty(_3b3+"-"+name,unescape(_3b4));
}
}
}).bind(this));
},toString:function(){
return "ORYX.Core.AbstractShape "+this.id;
}};
ORYX.Core.AbstractShape=ORYX.Core.UIObject.extend(ORYX.Core.AbstractShape);
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Canvas={construct:function(_3b6){
arguments.callee.$.construct.apply(this,arguments);
if(!(_3b6&&_3b6.width&&_3b6.height)){
ORYX.Log.fatal("Canvas is missing mandatory parameters options.width and options.height.");
return;
}
this.resourceId=_3b6.id;
this.nodes=[];
this.edges=[];
this.rootNode=ORYX.Editor.graft("http://www.w3.org/2000/svg",_3b6.parentNode,["svg",{id:this.id,width:_3b6.width,height:_3b6.height},["defs",{}]]);
this.rootNode.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
this.rootNode.setAttribute("xmlns:svg","http://www.w3.org/2000/svg");
this._htmlContainer=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",_3b6.parentNode,["div",{id:"oryx_canvas_htmlContainer",style:"position:absolute; top:5px"}]);
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.rootNode,["g",{},["g",{"class":"stencils"},["g",{"class":"me"}],["g",{"class":"children"}],["g",{"class":"edge"}]],["g",{"class":"svgcontainer"}]]);
this.node.setAttributeNS(null,"stroke","black");
this.node.setAttributeNS(null,"font-family","Verdana, sans-serif");
this.node.setAttributeNS(null,"font-size-adjust","none");
this.node.setAttributeNS(null,"font-style","normal");
this.node.setAttributeNS(null,"font-variant","normal");
this.node.setAttributeNS(null,"font-weight","normal");
this.node.setAttributeNS(null,"line-heigth","normal");
this.node.setAttributeNS(null,"font-size",ORYX.CONFIG.LABEL_DEFAULT_LINE_HEIGHT);
this.bounds.set(0,0,_3b6.width,_3b6.height);
this.addEventHandlers(this.rootNode.parentNode);
this.rootNode.oncontextmenu=function(){
return false;
};
},update:function(){
this.nodes.each(function(node){
this._traverseForUpdate(node);
}.bind(this));
this.getStencil().layout(this);
this.nodes.invoke("_update");
this.edges.invoke("_update",true);
},_traverseForUpdate:function(_3b8){
var _3b9=_3b8.isChanged;
_3b8.getChildNodes(false,function(_3ba){
if(this._traverseForUpdate(_3ba)){
_3b9=true;
}
}.bind(this));
if(_3b9){
_3b8.layout();
return true;
}else{
return false;
}
},layout:function(){
},getChildNodes:function(deep,_3bc){
if(!deep&&!_3bc){
return this.nodes.clone();
}else{
var _3bd=[];
this.nodes.each(function(_3be){
if(_3bc){
_3bc(_3be);
}
_3bd.push(_3be);
if(deep&&_3be instanceof ORYX.Core.Shape){
_3bd=_3bd.concat(_3be.getChildNodes(deep,_3bc));
}
});
return _3bd;
}
},getChildEdges:function(_3bf){
if(_3bf){
this.edges.each(function(edge){
_3bf(edge);
});
}
return this.edges.clone();
},add:function(_3c1){
if(_3c1 instanceof ORYX.Core.UIObject){
if(!(this.children.member(_3c1))){
if(_3c1.parent){
_3c1.parent.remove(_3c1);
}
this.children.push(_3c1);
_3c1.parent=this;
if(_3c1 instanceof ORYX.Core.Shape){
if(_3c1 instanceof ORYX.Core.Edge){
_3c1.addMarkers(this.rootNode.getElementsByTagNameNS(NAMESPACE_SVG,"defs")[0]);
_3c1.node=this.node.childNodes[0].childNodes[2].appendChild(_3c1.node);
this.edges.push(_3c1);
}else{
_3c1.node=this.node.childNodes[0].childNodes[1].appendChild(_3c1.node);
this.nodes.push(_3c1);
}
}else{
_3c1.node=this.node.appendChild(_3c1.node);
}
_3c1.bounds.registerCallback(this._changedCallback);
}else{
ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
}
}else{
ORYX.Log.fatal("add: Parameter is not of type ORYX.Core.UIObject.");
}
},remove:function(_3c2){
if(this.children.member(_3c2)){
this.children=this.children.without(_3c2);
_3c2.parent=undefined;
if(_3c2 instanceof ORYX.Core.Shape){
if(_3c2 instanceof ORYX.Core.Edge){
_3c2.removeMarkers();
_3c2.node=this.node.childNodes[0].childNodes[2].removeChild(_3c2.node);
this.edges=this.edges.without(_3c2);
}else{
_3c2.node=this.node.childNodes[0].childNodes[1].removeChild(_3c2.node);
this.nodes=this.nodes.without(_3c2);
}
}else{
_3c2.node=this.node.removeChild(_3c2.node);
}
_3c2.bounds.unregisterCallback(this._changedCallback);
}else{
ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
}
},getRootNode:function(){
return this.rootNode;
},getSvgContainer:function(){
return this.node.childNodes[1];
},getHTMLContainer:function(){
return this._htmlContainer;
},getShapesWithSharedParent:function(_3c3){
if(!_3c3||_3c3.length<1){
return [];
}
if(_3c3.length==1){
return _3c3;
}
return _3c3.findAll(function(_3c4){
var _3c5=_3c4.parent;
while(_3c5){
if(_3c3.member(_3c5)){
return false;
}
_3c5=_3c5.parent;
}
return true;
});
},setSize:function(size,_3c7){
if(!size||!size.width||!size.height){
return;
}
if(this.rootNode.parentNode){
this.rootNode.parentNode.style.width=size.width+"px";
this.rootNode.parentNode.style.height=size.height+"px";
}
this.rootNode.setAttributeNS(null,"width",size.width);
this.rootNode.setAttributeNS(null,"height",size.height);
if(!_3c7){
this.bounds.set({a:{x:0,y:0},b:{x:size.width,y:size.height}});
}
},getSVGRepresentation:function(_3c8){
var _3c9=this.getRootNode().cloneNode(true);
this._removeInvisibleElements(_3c9);
var x1,y1,x2,y2;
this.getChildShapes(true).each(function(_3ce){
var _3cf=_3ce.absoluteBounds();
var ul=_3cf.upperLeft();
var lr=_3cf.lowerRight();
if(x1==undefined){
x1=ul.x;
y1=ul.y;
x2=lr.x;
y2=lr.y;
}else{
x1=Math.min(x1,ul.x);
y1=Math.min(y1,ul.y);
x2=Math.max(x2,lr.x);
y2=Math.max(y2,lr.y);
}
});
var _3d2=50;
var _3d3,_3d4,tx,ty;
if(x1==undefined){
_3d3=0;
_3d4=0;
tx=0;
ty=0;
}else{
_3d3=x2-x1;
_3d4=y2-y1;
tx=-x1+_3d2/2;
ty=-y1+_3d2/2;
}
_3c9.setAttributeNS(null,"width",_3d3+_3d2);
_3c9.setAttributeNS(null,"height",_3d4+_3d2);
_3c9.childNodes[1].firstChild.setAttributeNS(null,"transform","translate("+tx+", "+ty+")");
_3c9.childNodes[1].removeAttributeNS(null,"transform");
try{
var _3d7=_3c9.childNodes[1].childNodes[1];
_3d7.parentNode.removeChild(_3d7);
}
catch(e){
}
if(_3c8){
$A(_3c9.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"tspan")).each(function(elem){
elem.textContent=elem.textContent.escapeHTML();
});
$A(_3c9.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"text")).each(function(elem){
if(elem.childNodes.length==0){
elem.textContent=elem.textContent.escapeHTML();
}
});
}
return _3c9;
},_removeInvisibleElements:function(_3da){
var _3db=0;
while(_3db<_3da.childNodes.length){
var _3dc=_3da.childNodes[_3db];
if(_3dc.getAttributeNS&&_3dc.getAttributeNS(null,"visibility")==="hidden"){
_3da.removeChild(_3dc);
}else{
this._removeInvisibleElements(_3dc);
_3db++;
}
}
},_delegateEvent:function(_3dd){
if(this.eventHandlerCallback&&(_3dd.target==this.rootNode||_3dd.target==this.rootNode.parentNode)){
this.eventHandlerCallback(_3dd,this);
}
},toString:function(){
return "Canvas "+this.id;
}};
ORYX.Core.Canvas=ORYX.Core.AbstractShape.extend(ORYX.Core.Canvas);
var idCounter=0;
var ID_PREFIX="resource";
function init(){
Ext.BLANK_IMAGE_URL=ORYX.PATH+"lib/ext-2.0.2/resources/images/default/s.gif";
ORYX.Log.debug("Querying editor instances");
ORYX.Editor.setMissingClasses();
DataManager.query(undefined,undefined,{type:ERDF.RESOURCE,value:"http://oryx-editor.org/canvas"}).each(function(c){
var _3df=c.subject.value;
var id=_3df.substring(1,_3df.length);
ORYX.Log.trace("Initializing instance #%0.",id);
new ORYX.Editor(id);
ORYX.Log.trace("Finished Initializing instance #%0.",id);
});
}
if(!ORYX){
var ORYX={};
}
ORYX.Editor={DOMEventListeners:new Hash(),selection:[],zoomLevel:1,id:"",fullscreen:true,construct:function(id){
ORYX.Log.debug("Constructing Editor %0",this.id);
this._eventsQueue=[];
this.loadedPlugins=[];
this.pluginsData=[];
this.movedDrag=undefined;
this.id=id;
this.ss_extensions_def;
this._defineFullscreen();
this._initEventListener();
this._loadStencilSets();
this._createCanvas();
this._generateGUI();
var _3e2=false;
var _3e3=false;
var _3e4=function(){
if(!_3e2||!_3e3){
return;
}
this._finishedLoading();
}.bind(this);
window.setTimeout(function(){
this.loadPlugins();
_3e2=true;
_3e4();
}.bind(this),100);
window.setTimeout(function(){
this.loadContent();
_3e3=true;
_3e4();
}.bind(this),200);
},_finishedLoading:function(){
if(Ext.getCmp("oryx-loading-panel")){
Ext.getCmp("oryx-loading-panel").hide();
}
this.layout.doLayout();
new Ext.dd.DropTarget(this.getCanvas().rootNode.parentNode);
this.handleEvents({type:ORYX.CONFIG.EVENT_LOADED});
},_initEventListener:function(){
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_KEYDOWN,this.catchKeyDownEvents.bind(this),true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_KEYUP,this.catchKeyUpEvents.bind(this),true);
this.DOMEventListeners[ORYX.CONFIG.EVENT_MOUSEDOWN]=[];
this.DOMEventListeners[ORYX.CONFIG.EVENT_MOUSEUP]=[];
this.DOMEventListeners[ORYX.CONFIG.EVENT_MOUSEOVER]=[];
this.DOMEventListeners[ORYX.CONFIG.EVENT_MOUSEOUT]=[];
this.DOMEventListeners[ORYX.CONFIG.EVENT_SELECTION_CHANGED]=[];
this.DOMEventListeners[ORYX.CONFIG.EVENT_MOUSEMOVE]=[];
},_generateGUI:function(){
var _3e5=400;
var _3e6=this.getCanvas().rootNode.parentNode;
this.layout_regions={north:new Ext.Panel({region:"north",autoEl:"div",border:false}),east:new Ext.Panel({region:"east",layout:"fit",autoEl:"div",collapsible:true,split:true,title:"East"}),south:new Ext.Panel({region:"south",autoEl:"div"}),west:new Ext.Panel({region:"west",layout:"fit",autoEl:"div",collapsible:true,split:true,title:"West"}),center:new Ext.Panel({region:"center",autoScroll:true,items:{layout:"fit",autoHeight:true,el:_3e6}})};
for(region in this.layout_regions){
if(region!="center"){
this.layout_regions[region].hide();
}
}
var _3e7={layout:"border",items:[this.layout_regions.north,this.layout_regions.east,this.layout_regions.south,this.layout_regions.west,this.layout_regions.center]};
if(this.fullscreen){
this.layout=new Ext.Viewport(_3e7);
}else{
_3e7.renderTo=this.id;
_3e7.height=_3e5;
this.layout=new Ext.Panel(_3e7);
}
this._generateHeader();
_3e6.parentNode.setAttributeNS(null,"align","center");
_3e6.setAttributeNS(null,"align","left");
this.getCanvas().setSize({width:ORYX.CONFIG.CANVAS_WIDTH,height:ORYX.CONFIG.CANVAS_HEIGHT});
},_generateHeader:function(){
var _3e8=new Ext.Panel({height:30,autoHeight:false,border:false,html:"<div id='oryx_editor_header'><a href=\"http://oryx-editor.org\" target=\"_blank\"><img src='"+ORYX.PATH+"images/oryx.small.gif' border=\"0\" /></a><div style='clear: both;'></div></div>"});
var _3e9=ORYX.MashupAPI&&ORYX.MashupAPI.isUsed;
var _3ea=_3e9?ORYX.MashupAPI.key:"";
var _3eb=_3e9?ORYX.MashupAPI.canRun:false;
var _3ec=_3e9?ORYX.MashupAPI.isModelRemote:true;
var _3ed=_3ec?"<img src='"+ORYX.PATH+"images/page_white_put.png'/>":"";
var _3ee=_3e9?"<span class='mashupinfo'><img src='"+ORYX.PATH+"images/"+(_3eb?"plugin_error":"plugin")+".png'/>"+_3ed+"</span>":"";
var fn=function(val){
var _3f1=ORYX.I18N.Oryx.notLoggedOn;
var user=val&&val.identifier&&val.identifier!="public"?val.identifier.gsub("\"",""):"";
if(user.length<=0){
user=_3f1;
}
var _3f3="<div id='oryx_editor_header'>"+"<a href=\"http://oryx-editor.org\" target=\"_blank\">"+"<img src='"+ORYX.PATH+"images/oryx.small.gif' border=\"0\" />"+"</a>"+"<span class='openid "+(_3f1==user?"not":"")+"'>"+user+_3ee+"</span>"+"<div style='clear: both;'/>"+"</div>";
if(_3e8.body){
_3e8.body.dom.innerHTML=_3f3;
}else{
_3e8.html=_3f3;
}
};
ORYX.Editor.Cookie.onChange(fn);
fn(ORYX.Editor.Cookie.getParams());
this.addToRegion("north",_3e8);
},_defineFullscreen:function(){
this.fullscreen=DataManager.query({type:ERDF.RESOURCE,value:"#"+this.id},{prefix:"oryx",name:"mode"},undefined).any(function(_3f4){
return _3f4.object.value===ORYX.CONFIG.MODE_FULLSCREEN;
});
},addToRegion:function(_3f5,_3f6,_3f7){
if(_3f5.toLowerCase&&this.layout_regions[_3f5.toLowerCase()]){
var _3f8=this.layout_regions[_3f5.toLowerCase()];
_3f8.add(_3f6);
ORYX.Log.debug("original dimensions of region %0: %1 x %2",_3f8.region,_3f8.width,_3f8.height);
if(!_3f8.width&&_3f6.initialConfig&&_3f6.initialConfig.width){
ORYX.Log.debug("resizing width of region %0: %1",_3f8.region,_3f6.initialConfig.width);
_3f8.setWidth(_3f6.initialConfig.width);
}
if(_3f6.initialConfig&&_3f6.initialConfig.height){
ORYX.Log.debug("resizing height of region %0: %1",_3f8.region,_3f6.initialConfig.height);
var _3f9=_3f8.height||0;
_3f8.height=_3f6.initialConfig.height+_3f9;
_3f8.setHeight(_3f6.initialConfig.height+_3f9);
}
if(typeof _3f7=="string"){
_3f8.setTitle(_3f7);
}
_3f8.ownerCt.doLayout();
_3f8.show();
if(Ext.isMac){
ORYX.Editor.resizeFix();
}
return _3f8;
}
return null;
},loadPlugins:function(){
var me=this;
var _3fb=[];
var _3fc=this.getStencilSets().keys();
var _3fd=this._getPluginFacade();
if(ORYX.MashupAPI&&ORYX.MashupAPI.loadablePlugins&&ORYX.MashupAPI.loadablePlugins instanceof Array){
ORYX.availablePlugins=$A(ORYX.availablePlugins).findAll(function(_3fe){
return ORYX.MashupAPI.loadablePlugins.include(_3fe.name);
});
ORYX.MashupAPI.loadablePlugins.each(function(_3ff){
if(!(ORYX.availablePlugins.find(function(val){
return val.name==_3ff;
}))){
ORYX.availablePlugins.push({name:_3ff});
}
});
}
ORYX.availablePlugins.each(function(_401){
ORYX.Log.debug("Initializing plugin '%0'",_401.name);
if((!_401.requires||!_401.requires.namespaces||_401.requires.namespaces.any(function(req){
return _3fc.indexOf(req)>=0;
}))&&(!_401.notUsesIn||!_401.notUsesIn.namespaces||!_401.notUsesIn.namespaces.any(function(req){
return _3fc.indexOf(req)>=0;
}))){
try{
var _404=eval(_401.name);
if(_404){
var _405=new _404(_3fd,_401);
_405.type=_401.name;
_3fb.push(_405);
}
}
catch(e){
ORYX.Log.warn("Plugin %0 is not available",_401.name);
}
}else{
ORYX.Log.info("Plugin need a stencilset which is not loaded'",_401.name);
}
});
_3fb.each(function(_406){
if(_406.registryChanged){
_406.registryChanged(me.pluginsData);
}
if(_406.onSelectionChanged){
me.registerOnEvent(ORYX.CONFIG.EVENT_SELECTION_CHANGED,_406.onSelectionChanged.bind(_406));
}
});
this.loadedPlugins=_3fb;
if(Ext.isMac){
ORYX.Editor.resizeFix();
}
this.setSelection();
},_loadStencilSets:function(){
DataManager.query({type:ERDF.RESOURCE,value:"#"+this.id},{prefix:"oryx",name:"stencilset"},undefined).each((function(_407){
var url=_407.object.value;
ORYX.Core.StencilSet.loadStencilSet(url,this.id);
}).bind(this));
var url=ORYX.CONFIG.SS_EXTENSIONS_CONFIG;
new Ajax.Request(url,{method:"GET",asynchronous:false,onSuccess:(function(_40a){
try{
eval("var jsonObject ="+_40a.responseText);
this.ss_extensions_def=jsonObject;
}
catch(e){
ORYX.Log.error("Editor._loadStencilSets: Something went wrong when initialising stencil set extensions."+e);
}
}).bind(this),onFailure:(function(_40b){
ORYX.Log.error("Editor._loadStencilSets: Loading stencil set extension configuration file failed."+_40b);
}).bind(this)});
},_createCanvas:function(){
var _40c;
var _40d=DataManager.query({type:ERDF.RESOURCE,value:""},{prefix:"oryx",name:"type"},undefined);
if(_40d.length==0){
ORYX.Log.warn("The loaded resource has no property of type 'oryx-type'.");
}
if(_40d.length>1){
ORYX.Log.fatal("Oryx initialisation failed, because the loaded resource has too many properties of type 'oryx-type'.");
}
var _40e=ORYX.Core.StencilSet.stencil((_40c==1)?_40d[0].object.value:this.getStencilSets().values()[0].findRootStencilName());
if(!_40e){
ORYX.Log.fatal("Oryx initialisation failed, because the stencil with the id %0 is not part of one of the loaded stencil sets.",canvasType[0].object);
}
var div=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",null,["div"]);
div.addClassName("ORYX_Editor");
this._canvas=new ORYX.Core.Canvas({width:ORYX.CONFIG.CANVAS_WIDTH,height:ORYX.CONFIG.CANVAS_HEIGHT,"eventHandlerCallback":this.handleEvents.bind(this),id:this.id,parentNode:div},_40e);
},loadContent:function(){
var _410=this.parseToSerializeObjects($(this.id).parentNode,true);
if(_410){
this.loadSerialized(_410);
this.getCanvas().update();
}
},_getPluginFacade:function(){
if(!(this._pluginFacade)){
this._pluginFacade={offer:this.offer.bind(this),getStencilSets:this.getStencilSets.bind(this),getRules:this.getRules.bind(this),loadStencilSet:this.loadStencilSet.bind(this),createShape:this.createShape.bind(this),deleteShape:this.deleteShape.bind(this),getSelection:this.getSelection.bind(this),setSelection:this.setSelection.bind(this),updateSelection:this.updateSelection.bind(this),getCanvas:this.getCanvas.bind(this),importJSON:this.importJSON.bind(this),importERDF:this.importERDF.bind(this),getERDF:this.getERDF.bind(this),executeCommands:this.executeCommands.bind(this),registerOnEvent:this.registerOnEvent.bind(this),unregisterOnEvent:this.unregisterOnEvent.bind(this),raiseEvent:this.handleEvents.bind(this),enableEvent:this.enableEvent.bind(this),disableEvent:this.disableEvent.bind(this),eventCoordinates:this.eventCoordinates.bind(this),addToRegion:this.addToRegion.bind(this)};
}
return this._pluginFacade;
},executeCommands:function(_411){
if(_411 instanceof Array&&_411.length>0&&_411.all(function(_412){
return _412 instanceof ORYX.Core.Command;
})){
this.handleEvents({type:ORYX.CONFIG.EVENT_EXECUTE_COMMANDS,commands:_411});
_411.each(function(_413){
_413.execute();
});
}
},getERDF:function(){
var _414=DataManager.serializeDOM(this._getPluginFacade());
_414="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_414+"</body></html>";
return _414;
},importJSON:function(_415,_416){
_415.each(function(_417){
if(_417.shape&&_417.shape instanceof ORYX.Core.Canvas){
return;
}
var id=_417.id;
_417.id=ORYX.Editor.provideId();
_415.each(function(_419){
_419.serialize.each(function(ser){
if(ser.value=="#"+id){
ser.value="#"+_417.id;
}
});
});
}.bind(this));
var _41b=ORYX.Core.Command.extend({construct:function(_41c,_41d,_41e,_41f){
this.jsonObject=_41c;
this.noSelection=_41e;
this.facade=_41f;
this.shapes;
this.connections=[];
this.parents=new Hash();
this.selection=this.facade.getSelection();
this.loadSerialized=_41d;
},execute:function(){
if(!this.shapes){
this.shapes=this.loadSerialized(this.jsonObject);
this.shapes.each(function(_420){
if(_420.getDockers){
var _421=_420.getDockers();
if(_421){
if(_421.length>0){
this.connections.push([_421.first(),_421.first().getDockedShape(),_421.first().referencePoint]);
}
if(_421.length>1){
this.connections.push([_421.last(),_421.last().getDockedShape(),_421.last().referencePoint]);
}
}
}
this.parents[_420.id]=_420.parent;
}.bind(this));
}else{
this.shapes.each(function(_422){
this.parents[_422.id].add(_422);
}.bind(this));
this.connections.each(function(con){
con[0].setDockedShape(con[1]);
con[0].setReferencePoint(con[2]);
});
}
this.facade.getCanvas().update();
if(!this.noSelection){
this.facade.setSelection(this.shapes);
}else{
this.facade.updateSelection();
}
},rollback:function(){
var _424=this.facade.getSelection();
this.shapes.each(function(_425){
_424=_424.without(_425);
this.facade.deleteShape(_425);
}.bind(this));
this.facade.getCanvas().update();
this.facade.setSelection(_424);
}});
var _426=new _41b(_415,this.loadSerialized.bind(this),_416,this._getPluginFacade());
this.executeCommands([_426]);
return _426.shapes.clone();
},importERDF:function(_427){
var _428=this.parseToSerializeObjects(_427);
if(_428){
return this.importJSON(_428,true);
}
},parseToSerializeObjects:function(_429){
var _42a=function(doc,id){
return $A(doc.getElementsByTagName("div")).findAll(function(el){
return $A(el.attributes).any(function(attr){
return attr.nodeName=="class"&&attr.nodeValue==id;
});
});
};
var _42f=function(doc,id){
return $A(doc.getElementsByTagName("div")).find(function(el){
return el.getAttribute("id")==id;
});
};
var _433=function(doc,id){
return $A(doc.getElementsByTagName("a")).findAll(function(el){
return el.getAttribute("href")=="#"+id;
});
};
var _437=_42a(_429,"-oryx-canvas")[0];
if(!_437){
ORYX.Log.warn("Import ERDF: No canvas node was found!");
return false;
}
var _438=$A(_437.childNodes).collect(function(el){
return el.nodeName.toLowerCase()=="a"&&el.getAttribute("rel")=="oryx-render"?el.getAttribute("href").slice(1):null;
}).compact();
_438=_438.collect(function(el){
return _42f(_429,el);
}.bind(this));
var _43b=0;
var _43c=ORYX.Editor.provideId;
_438.push(_437);
var _43d=function(node){
var res={type:undefined,id:undefined,serialize:[]};
if(node.getAttribute("id")){
res.id=node.getAttribute("id");
}
if(node.getAttribute("class")=="-oryx-canvas"){
res["shape"]=this.getCanvas();
}
$A(node.childNodes).each(function(node){
if(node.nodeName.toLowerCase()=="span"&&node.getAttribute("class")){
var name=node.getAttribute("class").split("-");
var _442=node.firstChild?String(node.firstChild.nodeValue).strip():"";
res.serialize.push({name:name[1],prefix:name[0],value:_442});
if(name[1]=="type"){
res.type=_442;
}
}else{
if(node.nodeName.toLowerCase()=="a"&&node.getAttribute("rel")){
var name=node.getAttribute("rel").split("-");
var _442=node.getAttribute("href");
res.serialize.push({name:name[1],prefix:name[0],value:_442});
}
}
});
return res.type||res.shape?res:null;
}.bind(this);
return _438.collect(function(el){
return _43d(el);
}.bind(this)).compact();
},loadSerialized:function(_444){
var _445=this.getCanvas();
_444.each(function(pair){
if(pair.shape&&pair.shape instanceof ORYX.Core.Canvas){
pair.serialize.any(function(ser){
if(ser.name=="ssextension"&&ser.prefix=="oryx"){
this.loadSSExtension(ser.value);
}
}.bind(this));
}
}.bind(this));
_444.each(function(ser){
if(ser.shape&&ser.shape instanceof ORYX.Core.Canvas){
return;
}
try{
var _449=ORYX.Core.StencilSet.stencil(ser.type);
var _44a=(_449.type()=="node")?new ORYX.Core.Node({"eventHandlerCallback":this.handleEvents.bind(this)},_449):new ORYX.Core.Edge({"eventHandlerCallback":this.handleEvents.bind(this)},_449);
_44a.resourceId=ser.id;
_445.add(_44a);
ser["shape"]=_44a;
}
catch(e){
ORYX.Log.warn("LoadingContent: Stencil could not create.");
}
}.bind(this));
_444.each(function(pair){
if(pair.shape){
pair.shape.deserialize(pair.serialize);
}
}.bind(this));
var _44c=0;
var _44d=0;
var _44e=100;
_445.getChildShapes(true,function(_44f){
var b=_44f.bounds;
_44c=Math.max(_44c,b.lowerRight().x+_44e);
_44d=Math.max(_44d,b.lowerRight().y+_44e);
});
if(_445.bounds.width()<_44c||_445.bounds.height()<_44d){
_445.setSize({width:Math.max(_445.bounds.width(),_44c),height:Math.max(_445.bounds.height(),_44d)});
}
return _444.reject(function(item){
return (item.shape instanceof ORYX.Core.Canvas);
}).pluck("shape");
},loadSSExtension:function(_452){
if(this.ss_extensions_def){
var _453=this.ss_extensions_def.extensions.find(function(ex){
return (ex.namespace==_452);
});
if(!_453){
return;
}
var _455=this.getStencilSets()[_453["extends"]];
if(!_455){
return;
}
_455.addExtension(ORYX.CONFIG.SS_EXTENSIONS_FOLDER+_453["definition"]);
this.getRules().initializeRules(_455);
this._getPluginFacade().raiseEvent({type:ORYX.CONFIG.EVENT_STENCIL_SET_LOADED});
}
},disableEvent:function(_456){
if(this.DOMEventListeners.keys().member(_456)){
var _457=this.DOMEventListeners.remove(_456);
this.DOMEventListeners["disable_"+_456]=_457;
}
},enableEvent:function(_458){
if(this.DOMEventListeners.keys().member("disable_"+_458)){
var _459=this.DOMEventListeners.remove("disable_"+_458);
this.DOMEventListeners[_458]=_459;
}
},registerOnEvent:function(_45a,_45b){
if(!(this.DOMEventListeners.keys().member(_45a))){
this.DOMEventListeners[_45a]=[];
}
this.DOMEventListeners[_45a].push(_45b);
},unregisterOnEvent:function(_45c,_45d){
if(this.DOMEventListeners.keys().member(_45c)){
this.DOMEventListeners[_45c]=this.DOMEventListeners[_45c].without(_45d);
}else{
}
},getSelection:function(){
return this.selection;
},getStencilSets:function(){
return ORYX.Core.StencilSet.stencilSets(this.id);
},getRules:function(){
return ORYX.Core.StencilSet.rules(this.id);
},loadStencilSet:function(_45e){
try{
ORYX.Core.StencilSet.loadStencilSet(_45e,this.id);
this.handleEvents({type:ORYX.CONFIG.EVENT_STENCIL_SET_LOADED});
}
catch(e){
ORYX.Log.warn("Requesting stencil set file failed. ("+e+")");
}
},offer:function(_45f){
if(!this.pluginsData.member(_45f)){
this.pluginsData.push(_45f);
}
},setSelection:function(_460,_461){
if(!_460){
_460=[];
}
if(_460.first() instanceof ORYX.Core.Canvas){
_460=[];
}
this.selection=_460;
this._subSelection=_461;
this.handleEvents({type:ORYX.CONFIG.EVENT_SELECTION_CHANGED,elements:_460,subSelection:_461});
},updateSelection:function(){
this.setSelection(this.selection);
},getCanvas:function(){
return this._canvas;
},createShape:function(_462){
if(_462&&_462.serialize&&_462.serialize instanceof Array){
var type=_462.serialize.find(function(obj){
return (obj.prefix+"-"+obj.name)=="oryx-type";
});
var _465=ORYX.Core.StencilSet.stencil(type.value);
if(_465.type()=="node"){
var _466=new ORYX.Core.Node({"eventHandlerCallback":this.handleEvents.bind(this)},_465);
}else{
var _466=new ORYX.Core.Edge({"eventHandlerCallback":this.handleEvents.bind(this)},_465);
}
this.getCanvas().add(_466);
_466.deserialize(_462.serialize);
this._getPluginFacade().raiseEvent({type:ORYX.CONFIG.EVENT_CANVAS_SHAPEADDED,shape:_466,option:_462});
return _466;
}
if(!_462||!_462.type||!_462.namespace){
throw "To create a new shape you have to give an argument with type and namespace";
}
var _467=this.getCanvas();
var _466;
var _468=_462.type;
var sset=ORYX.Core.StencilSet.stencilSet(_462.namespace);
if(sset.stencil(_468).type()=="node"){
_466=new ORYX.Core.Node({"eventHandlerCallback":this.handleEvents.bind(this)},sset.stencil(_468));
}else{
_466=new ORYX.Core.Edge({"eventHandlerCallback":this.handleEvents.bind(this)},sset.stencil(_468));
}
if(_462.template){
_466._jsonStencil.properties=_462.template._jsonStencil.properties;
_466.postProcessProperties();
}
if(_462.parent&&_466 instanceof ORYX.Core.Node){
_462.parent.add(_466);
}else{
_467.add(_466);
}
var _46a=_462.position?_462.position:{x:100,y:200};
var con;
if(_462.connectingType&&_462.connectedShape&&!(_466 instanceof ORYX.Core.Edge)){
con=new ORYX.Core.Edge({"eventHandlerCallback":this.handleEvents.bind(this)},sset.stencil(_462.connectingType));
con.dockers.first().setDockedShape(_462.connectedShape);
var _46c=_462.connectedShape.getDefaultMagnet();
var _46d=_46c?_46c.bounds.center():_462.connectedShape.bounds.midPoint();
con.dockers.first().setReferencePoint(_46d);
con.dockers.last().setDockedShape(_466);
con.dockers.last().setReferencePoint(_466.getDefaultMagnet().bounds.center());
_467.add(con);
}
if(_466 instanceof ORYX.Core.Edge&&_462.connectedShape){
_466.dockers.first().setDockedShape(_462.connectedShape);
if(_462.connectedShape instanceof ORYX.Core.Node){
_466.dockers.first().setReferencePoint(_462.connectedShape.getDefaultMagnet().bounds.center());
_466.dockers.last().bounds.centerMoveTo(_46a);
}else{
_466.dockers.first().setReferencePoint(_462.connectedShape.bounds.midPoint());
}
}else{
var b=_466.bounds;
if(_466 instanceof ORYX.Core.Node&&_466.dockers.length==1){
b=_466.dockers.first().bounds;
}
b.centerMoveTo(_46a);
var upL=b.upperLeft();
b.moveBy(-Math.min(upL.x,0),-Math.min(upL.y,0));
var lwR=b.lowerRight();
b.moveBy(-Math.max(lwR.x-_467.bounds.width(),0),-Math.max(lwR.y-_467.bounds.height(),0));
}
if(_466 instanceof ORYX.Core.Edge){
_466._update(false);
}
if(!(_466 instanceof ORYX.Core.Edge)){
this.setSelection([_466]);
}
if(con&&con.alignDockers){
con.alignDockers();
}
if(_466.alignDockers){
_466.alignDockers();
}
this._getPluginFacade().raiseEvent({type:ORYX.CONFIG.EVENT_CANVAS_SHAPEADDED,shape:_466,option:_462});
return _466;
},deleteShape:function(_471){
_471.parent.remove(_471);
_471.getOutgoingShapes().each(function(os){
var _473=os.getDockers().first();
if(_473&&_473.getDockedShape()==_471){
_473.setDockedShape(undefined);
}
});
_471.getIncomingShapes().each(function(is){
var _475=is.getDockers().last();
if(_475&&_475.getDockedShape()==_471){
_475.setDockedShape(undefined);
}
});
_471.getDockers().each(function(_476){
_476.setDockedShape(undefined);
});
},_executeEvents:function(){
this._queueRunning=true;
while(this._eventsQueue.length>0){
var val=this._eventsQueue.shift();
if(this.DOMEventListeners.keys().member(val.event.type)){
this.DOMEventListeners[val.event.type].each((function(_478){
_478(val.event,val.arg);
}).bind(this));
}
}
this._queueRunning=false;
},handleEvents:function(_479,_47a){
ORYX.Log.trace("Dispatching event type %0 on %1",_479.type,_47a);
switch(_479.type){
case ORYX.CONFIG.EVENT_MOUSEDOWN:
this._handleMouseDown(_479,_47a);
break;
case ORYX.CONFIG.EVENT_MOUSEMOVE:
this._handleMouseMove(_479,_47a);
break;
case ORYX.CONFIG.EVENT_MOUSEUP:
this._handleMouseUp(_479,_47a);
break;
case ORYX.CONFIG.EVENT_MOUSEOVER:
this._handleMouseHover(_479,_47a);
break;
case ORYX.CONFIG.EVENT_MOUSEOUT:
this._handleMouseOut(_479,_47a);
break;
}
this._eventsQueue.push({event:_479,arg:_47a});
if(!this._queueRunning){
this._executeEvents();
}
return false;
},catchKeyUpEvents:function(){
this.__currentKey=null;
},catchKeyDownEvents:function(_47b){
if(!_47b){
_47b=window.event;
}
var _47c=_47b.which||_47b.keyCode;
if(this.__currentKey==ORYX.CONFIG.KEY_CODE_META){
_47b.appleMetaKey=true;
}
this.__currentKey=_47c;
ORYX.Log.debug("Key %0 was pressed. metaKey is %1",_47c,_47b.appleMetaKey);
this.handleEvents.apply(this,arguments);
},_handleMouseDown:function(_47d,_47e){
var _47f=this.getCanvas();
var _480=_47d.currentTarget;
var _481=_47e;
var _482=(_481!==null)&&(_481!==undefined)&&(_481.isSelectable);
var _483=(_481!==null)&&(_481!==undefined)&&(_481.isMovable);
var _484=_47d.shiftKey||_47d.ctrlKey;
var _485=this.selection.length===0;
var _486=this.selection.member(_481);
if(_482&&_485){
this.setSelection([_481]);
ORYX.Log.trace("Rule #1 applied for mouse down on %0",_480.id);
}else{
if(_482&&!_485&&!_484&&!_486){
this.setSelection([_481]);
ORYX.Log.trace("Rule #3 applied for mouse down on %0",_480.id);
}else{
if(_482&&_484&&!_486){
var _487=this.selection.clone();
_487.push(_481);
this.setSelection(_487);
ORYX.Log.trace("Rule #4 applied for mouse down on %0",_480.id);
}else{
if(_482&&_486&&_484){
var _487=this.selection.clone();
this.setSelection(_487.without(_481));
ORYX.Log.trace("Rule #6 applied for mouse down on %0",_481.id);
}else{
if(!_482&&!_483){
this.setSelection([]);
ORYX.Log.trace("Rule #2 applied for mouse down on %0",_480.id);
return;
}else{
if(!_482&&_483&&!(_481 instanceof ORYX.Core.Controls.Docker)){
ORYX.Log.trace("Rule #7 applied for mouse down on %0",_480.id);
}else{
if(_482&&_486&&!_484){
this._subSelection=this._subSelection!=_481?_481:undefined;
this.setSelection(this.selection,this._subSelection);
ORYX.Log.trace("Rule #8 applied for mouse down on %0",_480.id);
}
}
}
}
}
}
}
Event.stop(_47d);
return;
},_handleMouseMove:function(_488,_489){
return;
},_handleMouseUp:function(_48a,_48b){
var _48c=this.getCanvas();
var _48d=_48b;
var _48e=this.eventCoordinates(_48a);
},_handleMouseHover:function(_48f,_490){
return;
},_handleMouseOut:function(_491,_492){
return;
},eventCoordinates:function(_493){
var _494=this.getCanvas();
var _495=_494.node.ownerSVGElement.createSVGPoint();
_495.x=_493.clientX;
_495.y=_493.clientY;
var _496=_494.node.getScreenCTM();
return _495.matrixTransform(_496.inverse());
}};
ORYX.Editor=Clazz.extend(ORYX.Editor);
ORYX.Editor.graft=function(_497,_498,t,doc){
doc=(doc||(_498&&_498.ownerDocument)||document);
var e;
if(t===undefined){
throw "Can't graft an undefined value";
}else{
if(t.constructor==String){
e=doc.createTextNode(t);
}else{
for(var i=0;i<t.length;i++){
if(i===0&&t[i].constructor==String){
var _49d;
_49d=t[i].match(/^([a-z][a-z0-9]*)\.([^\s\.]+)$/i);
if(_49d){
e=doc.createElementNS(_497,_49d[1]);
e.setAttributeNS(null,"class",_49d[2]);
continue;
}
_49d=t[i].match(/^([a-z][a-z0-9]*)$/i);
if(_49d){
e=doc.createElementNS(_497,_49d[1]);
continue;
}
e=doc.createElementNS(_497,"span");
e.setAttribute(null,"class","namelessFromLOL");
}
if(t[i]===undefined){
throw "Can't graft an undefined value in a list!";
}else{
if(t[i].constructor==String||t[i].constructor==Array){
this.graft(_497,e,t[i],doc);
}else{
if(t[i].constructor==Number){
this.graft(_497,e,t[i].toString(),doc);
}else{
if(t[i].constructor==Object){
for(var k in t[i]){
e.setAttributeNS(null,k,t[i][k]);
}
}else{
}
}
}
}
}
}
}
if(_498){
_498.appendChild(e);
}else{
}
return e;
};
ORYX.Editor.provideId=function(){
var res=[],hex="0123456789ABCDEF";
for(var i=0;i<36;i++){
res[i]=Math.floor(Math.random()*16);
}
res[14]=4;
res[19]=(res[19]&3)|8;
for(var i=0;i<36;i++){
res[i]=hex[res[i]];
}
res[8]=res[13]=res[18]=res[23]="-";
return "oryx_"+res.join("");
};
ORYX.Editor.resizeFix=function(){
if(!ORYX.Editor._resizeFixTimeout){
ORYX.Editor._resizeFixTimeout=window.setTimeout(function(){
window.resizeBy(1,1);
window.resizeBy(-1,-1);
ORYX.Editor._resizefixTimeout=null;
},100);
}
};
ORYX.Editor.Cookie={callbacks:[],onChange:function(_4a2,_4a3){
this.callbacks.push(_4a2);
this.start(_4a3);
},start:function(_4a4){
if(this.pe){
return;
}
var _4a5=document.cookie;
this.pe=new PeriodicalExecuter(function(){
if(_4a5!=document.cookie){
_4a5=document.cookie;
this.callbacks.each(function(_4a6){
_4a6(this.getParams());
}.bind(this));
}
}.bind(this),(_4a4||10000)/1000);
},stop:function(){
if(this.pe){
this.pe.stop();
this.pe=null;
}
},getParams:function(){
var res={};
var p=document.cookie;
p.split("; ").each(function(_4a9){
res[_4a9.split("=")[0]]=_4a9.split("=")[1];
});
return res;
},toString:function(){
return document.cookie;
}};
ORYX.Editor.SVGClassElementsAreAvailable=true;
ORYX.Editor.setMissingClasses=function(){
try{
SVGElement;
}
catch(e){
ORYX.Editor.SVGClassElementsAreAvailable=false;
SVGSVGElement=document.createElementNS("http://www.w3.org/2000/svg","svg").toString();
SVGGElement=document.createElementNS("http://www.w3.org/2000/svg","g").toString();
SVGPathElement=document.createElementNS("http://www.w3.org/2000/svg","path").toString();
SVGTextElement=document.createElementNS("http://www.w3.org/2000/svg","text").toString();
SVGRectElement=document.createElementNS("http://www.w3.org/2000/svg","rect").toString();
SVGImageElement=document.createElementNS("http://www.w3.org/2000/svg","image").toString();
SVGCircleElement=document.createElementNS("http://www.w3.org/2000/svg","circle").toString();
SVGEllipseElement=document.createElementNS("http://www.w3.org/2000/svg","ellipse").toString();
SVGLineElement=document.createElementNS("http://www.w3.org/2000/svg","line").toString();
SVGPolylineElement=document.createElementNS("http://www.w3.org/2000/svg","polyline").toString();
SVGPolygonElement=document.createElementNS("http://www.w3.org/2000/svg","polygon").toString();
}
};
ORYX.Editor.checkClassType=function(_4aa,_4ab){
if(ORYX.Editor.SVGClassElementsAreAvailable){
return _4aa instanceof _4ab;
}else{
return _4aa==_4ab;
}
};
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.UIEnableDrag=function(_4ac,_4ad,_4ae){
this.uiObj=_4ad;
var upL=_4ad.bounds.upperLeft();
var a=_4ad.node.getScreenCTM();
this.faktorXY={x:a.a,y:a.d};
this.scrollNode=_4ad.node.ownerSVGElement.parentNode.parentNode;
this.offSetPosition={x:Event.pointerX(_4ac)-(upL.x*this.faktorXY.x),y:Event.pointerY(_4ac)-(upL.y*this.faktorXY.y)};
this.offsetScroll={x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
this.dragCallback=ORYX.Core.UIDragCallback.bind(this);
this.disableCallback=ORYX.Core.UIDisableDrag.bind(this);
this.movedCallback=_4ae?_4ae.movedCallback:undefined;
this.upCallback=_4ae?_4ae.upCallback:undefined;
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.disableCallback,true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.dragCallback,false);
};
ORYX.Core.UIDragCallback=function(_4b1){
var _4b2={x:Event.pointerX(_4b1)-this.offSetPosition.x,y:Event.pointerY(_4b1)-this.offSetPosition.y};
_4b2.x-=this.offsetScroll.x-this.scrollNode.scrollLeft;
_4b2.y-=this.offsetScroll.y-this.scrollNode.scrollTop;
_4b2.x/=this.faktorXY.x;
_4b2.y/=this.faktorXY.y;
this.uiObj.bounds.moveTo(_4b2);
if(this.movedCallback){
this.movedCallback(_4b1);
}
Event.stop(_4b1);
};
ORYX.Core.UIDisableDrag=function(_4b3){
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.dragCallback,false);
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.disableCallback,true);
if(this.upCallback){
this.upCallback(_4b3);
}
this.upCallback=undefined;
this.movedCallback=undefined;
Event.stop(_4b3);
};
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Shape={construct:function(_4b4,_4b5){
arguments.callee.$.construct.apply(this,arguments);
this.dockers=[];
this.magnets=[];
this._defaultMagnet;
this.incoming=[];
this.outgoing=[];
this.nodes=[];
this._dockerChangedCallback=this._dockerChanged.bind(this);
this._labels=new Hash();
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["g",{id:this.id},["g",{"class":"stencils"},["g",{"class":"me"}],["g",{"class":"children",style:"overflow:hidden"}],["g",{"class":"edge"}]],["g",{"class":"controls"},["g",{"class":"dockers"}],["g",{"class":"magnets"}]]]);
},update:function(){
},_update:function(){
},refresh:function(){
arguments.callee.$.refresh.apply(this,arguments);
if(this.node.ownerDocument){
var me=this;
this.propertiesChanged.each((function(_4b7){
if(_4b7.value){
var prop=this.properties[_4b7.key];
var _4b9=this.getStencil().property(_4b7.key);
this.propertiesChanged[_4b7.key]=false;
if(_4b9.type()==ORYX.CONFIG.TYPE_CHOICE){
_4b9.refToView().each((function(ref){
if(ref!==""){
var _4bb=this._labels[this.id+ref];
if(_4bb){
_4bb.text(prop);
}
}
}).bind(this));
_4b9.items().each((function(item){
item.refToView().each((function(_4bd){
if(_4bd==""){
this.propertiesChanged[_4b7.key]=true;
return;
}
var _4be=this.node.ownerDocument.getElementById(this.id+_4bd);
if(!_4be){
this.propertiesChanged[_4b7.key]=true;
return;
}
_4be.setAttributeNS(null,"display",((prop==item.value())?"inherit":"none"));
if(ORYX.Editor.checkClassType(_4be,SVGImageElement)){
_4be.setAttributeNS("http://www.w3.org/1999/xlink","href",_4be.getAttributeNS("http://www.w3.org/1999/xlink","href"));
}
}).bind(this));
}).bind(this));
}else{
_4b9.refToView().each((function(ref){
if(ref===""){
this.propertiesChanged[_4b7.key]=true;
return;
}
var _4c0=this.id+ref;
var _4c1=this.node.ownerDocument.getElementById(_4c0);
if(!_4c1||!(_4c1.ownerSVGElement)){
if(_4b9.type()===ORYX.CONFIG.TYPE_URL){
var _4c2=this.node.ownerDocument.getElementsByTagNameNS("http://www.w3.org/2000/svg","a");
_4c1=$A(_4c2).find(function(elem){
return elem.getAttributeNS(null,"id")===_4c0;
});
if(!_4c1){
this.propertiesChanged[_4b7.key]=true;
return;
}
}else{
this.propertiesChanged[_4b7.key]=true;
return;
}
}
switch(_4b9.type()){
case ORYX.CONFIG.TYPE_BOOLEAN:
if(typeof prop=="string"){
_4c1.setAttributeNS(null,"display",((prop=="true")?"inherit":"none"));
}else{
_4c1.setAttributeNS(null,"display",((prop)?"inherit":"none"));
}
break;
case ORYX.CONFIG.TYPE_COLOR:
if(_4b9.fill()){
_4c1.setAttributeNS(null,"fill",prop);
}
if(_4b9.stroke()){
_4c1.setAttributeNS(null,"stroke",prop);
}
break;
case ORYX.CONFIG.TYPE_STRING:
var _4c4=this._labels[_4c0];
if(_4c4){
_4c4.text(prop);
}
break;
case ORYX.CONFIG.TYPE_INTEGER:
var _4c4=this._labels[_4c0];
if(_4c4){
_4c4.text(prop);
}
break;
case ORYX.CONFIG.TYPE_FLOAT:
if(_4b9.fillOpacity()){
_4c1.setAttributeNS(null,"fill-opacity",prop);
}
if(_4b9.strokeOpacity()){
_4c1.setAttributeNS(null,"stroke-opacity",prop);
}
if(!_4b9.fillOpacity()&&!_4b9.strokeOpacity()){
var _4c4=this._labels[_4c0];
if(_4c4){
_4c4.text(prop);
}
}
break;
case ORYX.CONFIG.TYPE_URL:
var _4c5=_4c1.getAttributeNodeNS("http://www.w3.org/1999/xlink","xlink:href");
if(_4c5){
_4c5.textContent=prop;
}else{
_4c1.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",prop);
}
break;
}
}).bind(this));
}
}
}).bind(this));
this._labels.values().each(function(_4c6){
_4c6.update();
});
}
},layout:function(){
if(this instanceof ORYX.Core.Node){
this.getStencil().layout(this);
}
},getLabels:function(){
return this._labels.values();
},getDockers:function(){
return this.dockers;
},getMagnets:function(){
return this.magnets;
},getDefaultMagnet:function(){
if(this._defaultMagnet){
return this._defaultMagnet;
}else{
if(this.magnets.length>0){
return this.magnets[0];
}else{
return undefined;
}
}
},getParentShape:function(){
return this.parent;
},getIncomingShapes:function(_4c7){
if(_4c7){
this.incoming.each(_4c7);
}
return this.incoming;
},getOutgoingShapes:function(_4c8){
if(_4c8){
this.outgoing.each(_4c8);
}
return this.outgoing;
},getAllDockedShapes:function(_4c9){
var _4ca=this.incoming.concat(this.outgoing);
if(_4c9){
_4ca.each(_4c9);
}
return _4ca;
},getCanvas:function(){
if(this.parent instanceof ORYX.Core.Canvas){
return this.parent;
}else{
if(this.parent instanceof ORYX.Core.Shape){
return this.parent.getCanvas();
}else{
return undefined;
}
}
},getChildNodes:function(deep,_4cc){
if(!deep&&!_4cc){
return this.nodes.clone();
}else{
var _4cd=[];
this.nodes.each(function(_4ce){
if(!_4ce.isVisible){
return;
}
if(_4cc){
_4cc(_4ce);
}
_4cd.push(_4ce);
if(deep&&_4ce instanceof ORYX.Core.Shape){
_4cd=_4cd.concat(_4ce.getChildNodes(deep,_4cc));
}
});
return _4cd;
}
},add:function(_4cf,_4d0){
if(_4cf instanceof ORYX.Core.UIObject&&!(_4cf instanceof ORYX.Core.Edge)){
if(!(this.children.member(_4cf))){
if(_4cf.parent){
_4cf.parent.remove(_4cf);
}
if(_4d0!=undefined){
this.children.splice(_4d0,0,_4cf);
}else{
this.children.push(_4cf);
}
_4cf.parent=this;
var _4d1;
if(_4cf instanceof ORYX.Core.Node){
_4d1=this.node.childNodes[0].childNodes[1];
this.nodes.push(_4cf);
}else{
if(_4cf instanceof ORYX.Core.Controls.Control){
var _4d2=this.node.childNodes[1];
if(_4cf instanceof ORYX.Core.Controls.Docker){
_4d1=_4d2.childNodes[0];
this.dockers.push(_4cf);
}else{
if(_4cf instanceof ORYX.Core.Controls.Magnet){
_4d1=_4d2.childNodes[1];
this.magnets.push(_4cf);
}else{
_4d1=_4d2;
}
}
}else{
_4d1=this.node;
}
}
if(_4d0!=undefined&&_4d0<_4d1.childNodes.length){
_4cf.node=_4d1.insertBefore(_4cf.node,_4d1.childNodes[_4d0]);
}else{
_4cf.node=_4d1.appendChild(_4cf.node);
}
this._changed();
}else{
ORYX.Log.warn("add: ORYX.Core.UIObject is already a child of this object.");
}
}else{
ORYX.Log.warn("add: Parameter is not of type ORYX.Core.UIObject.");
}
},remove:function(_4d3){
if(this.children.member(_4d3)){
this.children=this.children.without(_4d3);
_4d3.parent=undefined;
if(_4d3 instanceof ORYX.Core.Shape){
if(_4d3 instanceof ORYX.Core.Edge){
_4d3.removeMarkers();
_4d3.node=this.node.childNodes[0].childNodes[2].removeChild(_4d3.node);
}else{
_4d3.node=this.node.childNodes[0].childNodes[1].removeChild(_4d3.node);
this.nodes=this.nodes.without(_4d3);
}
}else{
if(_4d3 instanceof ORYX.Core.Controls.Control){
if(_4d3 instanceof ORYX.Core.Controls.Docker){
_4d3.node=this.node.childNodes[1].childNodes[0].removeChild(_4d3.node);
this.dockers=this.dockers.without(_4d3);
}else{
if(_4d3 instanceof ORYX.Core.Controls.Magnet){
_4d3.node=this.node.childNodes[1].childNodes[1].removeChild(_4d3.node);
this.magnets=this.magnets.without(_4d3);
}else{
_4d3.node=this.node.childNodes[1].removeChild(_4d3.node);
}
}
}
}
this._changed();
}else{
ORYX.Log.warn("remove: ORYX.Core.UIObject is not a child of this object.");
}
},getIntersectionPoint:function(){
var _4d4,_4d5,_4d6,_4d7;
switch(arguments.length){
case 2:
_4d4=arguments[0].x;
_4d5=arguments[0].y;
_4d6=arguments[1].x;
_4d7=arguments[1].y;
break;
case 4:
_4d4=arguments[0];
_4d5=arguments[1];
_4d6=arguments[2];
_4d7=arguments[3];
break;
default:
throw "getIntersectionPoints needs two or four arguments";
}
var _4d8,_4d9,_4da,_4db;
var _4dc=this.absoluteBounds();
if(this.isPointIncluded(_4d4,_4d5,_4dc)){
_4d8=_4d4;
_4d9=_4d5;
}else{
_4da=_4d4;
_4db=_4d5;
}
if(this.isPointIncluded(_4d6,_4d7,_4dc)){
_4d8=_4d6;
_4d9=_4d7;
}else{
_4da=_4d6;
_4db=_4d7;
}
if(!_4d8||!_4d9||!_4da||!_4db){
return undefined;
}
var _4dd=0;
var _4de=0;
var _4df,_4e0;
var _4e1=1;
var i=0;
while(true){
var _4dd=Math.min(_4d8,_4da)+((Math.max(_4d8,_4da)-Math.min(_4d8,_4da))/2);
var _4de=Math.min(_4d9,_4db)+((Math.max(_4d9,_4db)-Math.min(_4d9,_4db))/2);
if(this.isPointIncluded(_4dd,_4de,_4dc)){
_4d8=_4dd;
_4d9=_4de;
}else{
_4da=_4dd;
_4db=_4de;
}
var _4e3=Math.sqrt(Math.pow(_4d8-_4da,2)+Math.pow(_4d9-_4db,2));
_4df=_4d8+((_4da-_4d8)/_4e3),_4e0=_4d9+((_4db-_4d9)/_4e3);
if(!this.isPointIncluded(_4df,_4e0,_4dc)){
break;
}
}
return {x:_4df,y:_4e0};
},isPointIncluded:function(){
return false;
},isPointOverOffset:function(){
return this.isPointIncluded.apply(this,arguments);
},_dockerChanged:function(){
},createDocker:function(){
var _4e4=new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback});
_4e4.bounds.registerCallback(this._dockerChangedCallback);
this.add(_4e4);
return _4e4;
},serialize:function(){
var _4e5=arguments.callee.$.serialize.apply(this);
_4e5.push({name:"bounds",prefix:"oryx",value:this.bounds.serializeForERDF(),type:"literal"});
this.getOutgoingShapes().each((function(_4e6){
_4e5.push({name:"outgoing",prefix:"raziel",value:"#"+ERDF.__stripHashes(_4e6.resourceId),type:"resource"});
}).bind(this));
_4e5.push({name:"parent",prefix:"raziel",value:"#"+ERDF.__stripHashes(this.parent.resourceId),type:"resource"});
return _4e5;
},deserialize:function(_4e7){
arguments.callee.$.deserialize.apply(this,arguments);
var _4e8=_4e7.find(function(ser){
return (ser.prefix+"-"+ser.name)=="oryx-bounds";
});
if(_4e8){
var b=_4e8.value.replace(/,/g," ").split(" ").without("");
if(this instanceof ORYX.Core.Edge){
this.dockers.first().bounds.centerMoveTo(parseFloat(b[0]),parseFloat(b[1]));
this.dockers.last().bounds.centerMoveTo(parseFloat(b[2]),parseFloat(b[3]));
}else{
this.bounds.set(parseFloat(b[0]),parseFloat(b[1]),parseFloat(b[2]),parseFloat(b[3]));
}
}
},_init:function(_4eb){
this._adjustIds(_4eb,0);
},_adjustIds:function(_4ec,_4ed){
if(_4ec instanceof Element){
var eid=_4ec.getAttributeNS(null,"id");
if(eid&&eid!==""){
_4ec.setAttributeNS(null,"id",this.id+eid);
}else{
_4ec.setAttributeNS(null,"id",this.id+"_"+this.id+"_"+_4ed);
_4ed++;
}
if(_4ec.hasChildNodes()){
for(var i=0;i<_4ec.childNodes.length;i++){
_4ed=this._adjustIds(_4ec.childNodes[i],_4ed);
}
}
}
return _4ed;
},toString:function(){
return "ORYX.Core.Shape "+this.getId();
}};
ORYX.Core.Shape=ORYX.Core.AbstractShape.extend(ORYX.Core.Shape);
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.Controls){
ORYX.Core.Controls={};
}
ORYX.Core.Controls.Control=ORYX.Core.UIObject.extend({toString:function(){
return "Control "+this.id;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.Controls){
ORYX.Core.Controls={};
}
ORYX.Core.Controls.Docker=ORYX.Core.Controls.Control.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.isMovable=true;
this.bounds.set(0,0,16,16);
this.referencePoint=undefined;
this._dockedShapeBounds=undefined;
this._dockedShape=undefined;
this._oldRefPoint1=undefined;
this._oldRefPoint2=undefined;
this.anchorLeft;
this.anchorRight;
this.anchorTop;
this.anchorBottom;
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["g"]);
this._dockerNode=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["g",{"pointer-events":"all"},["circle",{cx:"8",cy:"8",r:"8",stroke:"none",fill:"none"}],["circle",{cx:"8",cy:"8",r:"3",stroke:"black",fill:"red","stroke-width":"1"}]]);
this._referencePointNode=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["g",{"pointer-events":"none"},["circle",{cx:this.bounds.upperLeft().x,cy:this.bounds.upperLeft().y,r:3,fill:"red","fill-opacity":0.4}]]);
this.hide();
this.addEventHandlers(this.node);
this._updateCallback=this._changed.bind(this);
},update:function(){
if(this._dockedShape){
if(this._dockedShapeBounds&&this._dockedShape instanceof ORYX.Core.Node){
var _4f0=this._dockedShapeBounds.width();
var _4f1=this._dockedShapeBounds.height();
if(!_4f0){
_4f0=1;
}
if(!_4f1){
_4f1=1;
}
var _4f2=this._dockedShape.bounds.width()/_4f0;
var _4f3=this._dockedShape.bounds.height()/_4f1;
if(_4f2!==1||_4f3!==1){
this.referencePoint.x*=_4f2;
this.referencePoint.y*=_4f3;
}
this._dockedShapeBounds=this._dockedShape.bounds.clone();
}
var _4f4=this.parent.dockers.indexOf(this);
var _4f5=this;
var _4f6=this.parent.dockers.length>1?(_4f4===0?this.parent.dockers[_4f4+1]:this.parent.dockers[_4f4-1]):undefined;
var _4f7=_4f5.getDockedShape()?_4f5.getAbsoluteReferencePoint():_4f5.bounds.center();
var _4f8=_4f6&&_4f6.getDockedShape()?_4f6.getAbsoluteReferencePoint():_4f6?_4f6.bounds.center():undefined;
if(!_4f8){
var _4f9=this._dockedShape.absoluteCenterXY();
var _4fa=this._dockedShape.bounds.width()*this._dockedShape.bounds.height();
_4f8={x:_4f7.x+(_4f9.x-_4f7.x)*-_4fa,y:_4f7.y+(_4f9.y-_4f7.y)*-_4fa};
}
var _4fb=undefined;
_4fb=this._dockedShape.getIntersectionPoint(_4f7,_4f8);
if(!_4fb){
_4fb=this.getAbsoluteReferencePoint();
}
if(this.parent&&this.parent.parent){
var _4fc=this.parent.parent.absoluteXY();
_4fb.x-=_4fc.x;
_4fb.y-=_4fc.y;
}
this.bounds.centerMoveTo(_4fb);
this._oldRefPoint1=_4f7;
this._oldRefPoint2=_4f8;
}
arguments.callee.$.update.apply(this,arguments);
},refresh:function(){
arguments.callee.$.refresh.apply(this,arguments);
var p=this.bounds.upperLeft();
this._dockerNode.setAttributeNS(null,"transform","translate("+p.x+", "+p.y+")");
p=Object.clone(this.referencePoint);
if(p&&this._dockedShape){
var upL;
if(this.parent instanceof ORYX.Core.Edge){
upL=this._dockedShape.absoluteXY();
}else{
upL=this._dockedShape.bounds.upperLeft();
}
p.x+=upL.x;
p.y+=upL.y;
}else{
p=this.bounds.center();
}
this._referencePointNode.setAttributeNS(null,"transform","translate("+p.x+", "+p.y+")");
},setReferencePoint:function(_4ff){
if(this.referencePoint!==_4ff&&(!this.referencePoint||!_4ff||this.referencePoint.x!==_4ff.x||this.referencePoint.y!==_4ff.y)){
this.referencePoint=_4ff;
this._changed();
}
},getAbsoluteReferencePoint:function(){
if(!this.referencePoint||!this._dockedShape){
return undefined;
}else{
var _500=this._dockedShape.absoluteXY();
return {x:this.referencePoint.x+_500.x,y:this.referencePoint.y+_500.y};
}
},setDockedShape:function(_501){
if(this._dockedShape){
this._dockedShape.bounds.unregisterCallback(this._updateCallback);
if(this===this.parent.dockers.first()){
this.parent.incoming=this.parent.incoming.without(this._dockedShape);
this._dockedShape.outgoing=this._dockedShape.outgoing.without(this.parent);
}else{
if(this===this.parent.dockers.last()){
this.parent.outgoing=this.parent.outgoing.without(this._dockedShape);
this._dockedShape.incoming=this._dockedShape.incoming.without(this.parent);
}
}
}
this._dockedShape=_501;
this._dockedShapeBounds=undefined;
var _502=undefined;
if(this._dockedShape){
if(this===this.parent.dockers.first()){
this.parent.incoming.push(_501);
_501.outgoing.push(this.parent);
}else{
if(this===this.parent.dockers.last()){
this.parent.outgoing.push(_501);
_501.incoming.push(this.parent);
}
}
var _503=this.bounds;
var _504=_501.absoluteXY();
_502={x:_503.center().x-_504.x,y:_503.center().y-_504.y};
this._dockedShapeBounds=this._dockedShape.bounds.clone();
this._dockedShape.bounds.registerCallback(this._updateCallback);
this.setDockerColor(ORYX.CONFIG.DOCKER_DOCKED_COLOR);
}else{
this.setDockerColor(ORYX.CONFIG.DOCKER_UNDOCKED_COLOR);
}
this.setReferencePoint(_502);
this._changed();
},getDockedShape:function(){
return this._dockedShape;
},setDockerColor:function(_505){
this._dockerNode.lastChild.setAttributeNS(null,"fill",_505);
},hide:function(){
this.node.setAttributeNS(null,"visibility","hidden");
this.children.each(function(_506){
_506.hide();
});
},show:function(){
this.node.setAttributeNS(null,"visibility","visible");
this.children.each(function(_507){
_507.show();
});
},toString:function(){
return "Docker "+this.id;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
if(!ORYX.Core.Controls){
ORYX.Core.Controls={};
}
ORYX.Core.Controls.Magnet=ORYX.Core.Controls.Control.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.anchorLeft;
this.anchorRight;
this.anchorTop;
this.anchorBottom;
this.bounds.set(0,0,16,16);
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["g",{"pointer-events":"all"},["circle",{cx:"8",cy:"8",r:"4",stroke:"none",fill:"red","fill-opacity":"0.3"}],]);
this.hide();
},update:function(){
arguments.callee.$.update.apply(this,arguments);
},_update:function(){
arguments.callee.$.update.apply(this,arguments);
},refresh:function(){
arguments.callee.$.refresh.apply(this,arguments);
var p=this.bounds.upperLeft();
this.node.setAttributeNS(null,"transform","translate("+p.x+", "+p.y+")");
},show:function(){
arguments.callee.$.show.apply(this,arguments);
},toString:function(){
return "Magnet "+this.id;
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Node={construct:function(_509,_50a){
arguments.callee.$.construct.apply(this,arguments);
this.isSelectable=true;
this.isMovable=true;
this._dockerUpdated=false;
this._oldBounds=new ORYX.Core.Bounds();
this._svgShapes=[];
this.minimumSize=undefined;
this.maximumSize=undefined;
this.isHorizontallyResizable=false;
this.isVerticallyResizable=false;
this.dataId=undefined;
this._init(this._stencil.view());
},_update:function(){
this.dockers.invoke("update");
if(this.isChanged){
var _50b=this.bounds;
var _50c=this._oldBounds;
if(this.isResized){
var _50d=_50b.width()/_50c.width();
var _50e=_50b.height()/_50c.height();
this._svgShapes.each(function(_50f){
if(_50f.isHorizontallyResizable){
_50f.width=_50f.oldWidth*_50d;
}
if(_50f.isVerticallyResizable){
_50f.height=_50f.oldHeight*_50e;
}
var _510;
var _511=_50f.anchorLeft;
var _512=_50f.anchorRight;
if(_512){
_510=_50c.width()-(_50f.oldX+_50f.oldWidth);
if(_511){
_50f.width=_50b.width()-_50f.x-_510;
}else{
_50f.x=_50b.width()-(_510+_50f.width);
}
}else{
if(!_511){
_50f.x=_50d*_50f.oldX;
if(!_50f.isHorizontallyResizable){
_50f.x=_50f.x+_50f.width*_50d/2-_50f.width/2;
}
}
}
var _513=_50f.anchorTop;
var _514=_50f.anchorBottom;
if(_514){
_510=_50c.height()-(_50f.oldY+_50f.oldHeight);
if(_513){
_50f.height=_50b.height()-_50f.y-_510;
}else{
_50f.y=_50b.height()-(_510+_50f.height);
}
}else{
if(!_513){
_50f.y=_50e*_50f.oldY;
if(!_50f.isVerticallyResizable){
_50f.y=_50f.y+_50f.width*_50e/2-_50f.width/2;
}
}
}
});
var p={x:0,y:0};
if(!this.isHorizontallyResizable&&_50b.width()!==_50c.width()){
p.x=_50c.width()-_50b.width();
}
if(!this.isVerticallyResizable&&_50b.height()!==_50c.height()){
p.y=_50c.height()-_50b.height();
}
if(p.x!==0||p.y!==0){
_50b.extend(p);
}
p={x:0,y:0};
var _516,_517;
if(this.minimumSize){
ORYX.Log.debug("Shape (%0)'s min size: (%1x%2)",this,this.minimumSize.width,this.minimumSize.height);
_516=this.minimumSize.width-_50b.width();
if(_516>0){
p.x+=_516;
}
_517=this.minimumSize.height-_50b.height();
if(_517>0){
p.y+=_517;
}
}
if(this.maximumSize){
ORYX.Log.debug("Shape (%0)'s max size: (%1x%2)",this,this.maximumSize.width,this.maximumSize.height);
_516=_50b.width()-this.maximumSize.width;
if(_516>0){
p.x-=_516;
}
_517=_50b.height()-this.maximumSize.height;
if(_517>0){
p.y-=_517;
}
}
if(p.x!==0||p.y!==0){
_50b.extend(p);
}
var _50d=_50b.width()/_50c.width();
var _50e=_50b.height()/_50c.height();
var _518,_519,_51a,_51b,_51c,newX,newY;
this.magnets.each(function(_51f){
_518=_51f.anchorLeft;
_519=_51f.anchorRight;
_51a=_51f.anchorTop;
_51b=_51f.anchorBottom;
_51c=_51f.bounds.center();
if(_518){
newX=_51c.x;
}else{
if(_519){
newX=_50b.width()-(_50c.width()-_51c.x);
}else{
newX=_51c.x*_50d;
}
}
if(_51a){
newY=_51c.y;
}else{
if(_51b){
newY=_50b.height()-(_50c.height()-_51c.y);
}else{
newY=_51c.y*_50e;
}
}
if(_51c.x!==newX||_51c.y!==newY){
_51f.bounds.centerMoveTo(newX,newY);
}
});
this.getLabels().each(function(_520){
_518=_520.anchorLeft;
_519=_520.anchorRight;
_51a=_520.anchorTop;
_51b=_520.anchorBottom;
if(_518){
}else{
if(_519){
_520.x=_50b.width()-(_50c.width()-_520.oldX);
}else{
_520.x*=_50d;
}
}
if(_51a){
}else{
if(_51b){
_520.y=_50b.height()-(_50c.height()-_520.oldY);
}else{
_520.y*=_50e;
}
}
});
var _521=this.dockers[0];
if(_521){
_521.bounds.unregisterCallback(this._dockerChangedCallback);
if(!this._dockerUpdated){
_521.bounds.centerMoveTo(this.bounds.center());
this._dockerUpdated=false;
}
_521.update();
_521.bounds.registerCallback(this._dockerChangedCallback);
}
this.isResized=false;
}
this.refresh();
this.isChanged=false;
this._oldBounds=this.bounds.clone();
}
this.children.each(function(_522){
if(!(_522 instanceof ORYX.Core.Controls.Docker)){
_522._update();
}
});
},refresh:function(){
arguments.callee.$.refresh.apply(this,arguments);
var x=this.bounds.upperLeft().x;
var y=this.bounds.upperLeft().y;
this.node.firstChild.setAttributeNS(null,"transform","translate("+x+", "+y+")");
this.node.childNodes[1].childNodes[1].setAttributeNS(null,"transform","translate("+x+", "+y+")");
this._svgShapes.each(function(_525){
_525.update();
});
},_dockerChanged:function(){
var _526=this.dockers[0];
this.bounds.centerMoveTo(_526.bounds.center());
this._dockerUpdated=true;
},_initSVGShapes:function(_527){
var _528=[];
try{
var _529=new ORYX.Core.SVG.SVGShape(_527);
_528.push(_529);
}
catch(e){
}
if(_527.hasChildNodes()){
for(var i=0;i<_527.childNodes.length;i++){
_528=_528.concat(this._initSVGShapes(_527.childNodes[i]));
}
}
return _528;
},isPointIncluded:function(_52b,_52c,_52d){
var _52e=_52d&&_52d instanceof ORYX.Core.Bounds?_52d:this.absoluteBounds();
if(!_52e.isIncluded(_52b,_52c)){
return false;
}else{
}
var ul=_52e.upperLeft();
var x=_52b-ul.x;
var y=_52c-ul.y;
var i=0;
do{
var _533=this._svgShapes[i++].isPointIncluded(x,y);
}while(!_533&&i<this._svgShapes.length);
return _533;
},isPointOverOffset:function(_534,_535){
var _536=arguments.callee.$.isPointOverOffset.apply(this,arguments);
if(_536){
var _537=this.absoluteBounds();
_537.widen(-ORYX.CONFIG.BORDER_OFFSET);
if(!_537.isIncluded(_534,_535)){
return true;
}
}
return false;
},serialize:function(){
var _538=arguments.callee.$.serialize.apply(this);
this.dockers.each((function(_539){
if(_539.getDockedShape()){
var _53a=_539.referencePoint;
_53a=_53a?_53a:_539.bounds.center();
_538.push({name:"docker",prefix:"oryx",value:$H(_53a).values().join(","),type:"literal"});
}
}).bind(this));
try{
_538=this.getStencil().serialize(this,_538);
}
catch(e){
}
return _538;
},deserialize:function(data){
arguments.callee.$.deserialize.apply(this,[data]);
try{
data=this.getStencil().deserialize(this,data);
}
catch(e){
}
var _53c=data.findAll(function(ser){
return (ser.prefix+"-"+ser.name)=="raziel-outgoing";
});
_53c.each((function(obj){
if(!this.parent){
return;
}
var next=this.getCanvas().getChildShapeByResourceId(obj.value);
if(next){
if(next instanceof ORYX.Core.Edge){
next.dockers.first().setDockedShape(this);
next.dockers.first().setReferencePoint(next.dockers.first().bounds.center());
}else{
if(next.dockers.length>0){
next.dockers.first().setDockedShape(this);
}
}
}
}).bind(this));
if(this.dockers.length===1){
var _540;
_540=data.find(function(_541){
return (_541.prefix+"-"+_541.name==="oryx-docker");
});
if(_540){
var _542=_540.value.replace(/,/g," ").split(" ").without("");
if(_542.length===2&&this.dockers[0].getDockedShape()){
this.dockers[0].setReferencePoint({x:parseFloat(_542[0]),y:parseFloat(_542[1])});
}else{
this.dockers[0].bounds.centerMoveTo(parseFloat(_542[0]),parseFloat(_542[1]));
}
}
}
},_init:function(_543){
arguments.callee.$._init.apply(this,arguments);
var _544=_543.getElementsByTagName("g")[0];
var _545=_543.ownerDocument.createAttributeNS(null,"title");
_545.nodeValue=this.getStencil().title();
_544.setAttributeNode(_545);
var _546=_543.ownerDocument.createAttributeNS(ORYX.CONFIG.NAMESPACE_SVG,"id");
_546.nodeValue=this.id;
_544.setAttributeNode(_546);
var _547=this.node.childNodes[0].childNodes[0];
_544=_547.appendChild(_544);
this.addEventHandlers(_544);
var _548=_544.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"minimumSize");
if(_548){
_548=_548.replace("/,/g"," ");
var _549=_548.split(" ");
_549=_549.without("");
if(_549.length>1){
this.minimumSize={width:parseFloat(_549[0]),height:parseFloat(_549[1])};
}else{
this.minimumSize={width:1,height:1};
}
}
var _54a=_544.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"maximumSize");
if(_54a){
_54a=_54a.replace("/,/g"," ");
var _54b=_54a.split(" ");
_54b=_54b.without("");
if(_54b.length>1){
this.maximumSize={width:parseFloat(_54b[0]),height:parseFloat(_54b[1])};
}
}
if(this.minimumSize&&this.maximumSize&&(this.minimumSize.width>this.maximumSize.width||this.minimumSize.height>this.maximumSize.height)){
throw this+": Minimum Size must be greater than maxiumSize.";
}
this._svgShapes=this._initSVGShapes(_544);
var _54c={x:undefined,y:undefined};
var _54d={x:undefined,y:undefined};
var me=this;
this._svgShapes.each(function(_54f){
_54c.x=(_54c.x!==undefined)?Math.min(_54c.x,_54f.x):_54f.x;
_54c.y=(_54c.y!==undefined)?Math.min(_54c.y,_54f.y):_54f.y;
_54d.x=(_54d.x!==undefined)?Math.max(_54d.x,_54f.x+_54f.width):_54f.x+_54f.width;
_54d.y=(_54d.y!==undefined)?Math.max(_54d.y,_54f.y+_54f.height):_54f.y+_54f.height;
if(_54f.isHorizontallyResizable){
me.isHorizontallyResizable=true;
me.isResizable=true;
}
if(_54f.isVerticallyResizable){
me.isVerticallyResizable=true;
me.isResizable=true;
}
if(_54f.anchorTop&&_54f.anchorBottom){
me.isVerticallyResizable=true;
me.isResizable=true;
}
if(_54f.anchorLeft&&_54f.anchorRight){
me.isHorizontallyResizable=true;
me.isResizable=true;
}
});
this._svgShapes.each(function(_550){
_550.x-=_54c.x;
_550.y-=_54c.y;
_550.update();
});
var _551=_54c.x;
var _552=_54c.y;
_54d.x-=_551;
_54d.y-=_552;
_54c.x=0;
_54c.y=0;
if(_54d.x===0){
_54d.x=1;
}
if(_54d.y===0){
_54d.y=1;
}
this._oldBounds.set(_54c,_54d);
this.bounds.set(_54c,_54d);
var _553=_543.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_ORYX,"magnets");
if(_553&&_553.length>0){
_553=$A(_553[0].getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_ORYX,"magnet"));
var me=this;
_553.each(function(_554){
var _555=new ORYX.Core.Controls.Magnet({eventHandlerCallback:me.eventHandlerCallback});
var cx=parseFloat(_554.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"cx"));
var cy=parseFloat(_554.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"cy"));
_555.bounds.centerMoveTo({x:cx-_551,y:cy-_552});
var _558=_554.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"anchors");
if(_558){
_558=_558.replace("/,/g"," ");
_558=_558.split(" ").without("");
for(var i=0;i<_558.length;i++){
switch(_558[i].toLowerCase()){
case "left":
_555.anchorLeft=true;
break;
case "right":
_555.anchorRight=true;
break;
case "top":
_555.anchorTop=true;
break;
case "bottom":
_555.anchorBottom=true;
break;
}
}
}
me.add(_555);
if(!this._defaultMagnet){
var _55a=_554.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"default");
if(_55a&&_55a.toLowerCase()==="yes"){
me._defaultMagnet=_555;
}
}
});
}else{
var _55b=new ORYX.Core.Controls.Magnet();
_55b.bounds.centerMoveTo(this.bounds.width()/2,this.bounds.height()/2);
this.add(_55b);
}
var _55c=_543.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_ORYX,"docker");
if(_55c&&_55c.length>0){
_55c=_55c[0];
var _55d=this.createDocker();
var cx=parseFloat(_55c.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"cx"));
var cy=parseFloat(_55c.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"cy"));
_55d.bounds.centerMoveTo({x:cx-_551,y:cy-_552});
var _560=_55c.getAttributeNS(ORYX.CONFIG.NAMESPACE_ORYX,"anchors");
if(_560){
_560=_560.replace("/,/g"," ");
_560=_560.split(" ").without("");
for(var i=0;i<_560.length;i++){
switch(_560[i].toLowerCase()){
case "left":
_55d.anchorLeft=true;
break;
case "right":
_55d.anchorRight=true;
break;
case "top":
_55d.anchorTop=true;
break;
case "bottom":
_55d.anchorBottom=true;
break;
}
}
}
}
var _562=_544.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"text");
$A(_562).each((function(_563){
var _564=new ORYX.Core.SVG.Label({textElement:_563,shapeId:this.id});
_564.x-=_551;
_564.y-=_552;
this._labels[_564.id]=_564;
}).bind(this));
},createDocker:function(){
var _565=new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback});
_565.bounds.registerCallback(this._dockerChangedCallback);
this.dockers.push(_565);
_565.parent=this;
_565.bounds.registerCallback(this._changedCallback);
return _565;
},toString:function(){
return this._stencil.title()+" "+this.id;
}};
ORYX.Core.Node=ORYX.Core.Shape.extend(ORYX.Core.Node);
NAMESPACE_SVG="http://www.w3.org/2000/svg";
NAMESPACE_ORYX="http://www.b3mn.org/oryx";
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Edge={construct:function(_566,_567){
arguments.callee.$.construct.apply(this,arguments);
this.isMovable=true;
this.isSelectable=true;
this._dockerUpdated=false;
this._markers=new Hash();
this._paths=[];
this._interactionPaths=[];
this._dockersByPath=new Hash();
this._markersByPath=new Hash();
var _568=this.node.childNodes[0].childNodes[0];
_568=ORYX.Editor.graft("http://www.w3.org/2000/svg",_568,["g",{"pointer-events":"painted"}]);
this.addEventHandlers(_568);
this._oldBounds=this.bounds.clone();
this._init(this._stencil.view());
if(_567 instanceof Array){
this.deserialize(_567);
}
},_update:function(_569){
if(this._dockerUpdated||this.isChanged||_569){
this.dockers.invoke("update");
if(this.bounds.width()===0||this.bounds.height()===0){
this.bounds.moveBy({x:this.bounds.width()===0?-1:0,y:this.bounds.height()===0?-1:0});
this.bounds.extend({x:this.bounds.width()===0?2:0,y:this.bounds.height()===0?2:0});
}
var upL=this.bounds.upperLeft();
var _56b=this._oldBounds.upperLeft();
var _56c=this._oldBounds.width()===0?this.bounds.width():this._oldBounds.width();
var _56d=this._oldBounds.height()===0?this.bounds.height():this._oldBounds.height();
var _56e=upL.x-_56b.x;
var _56f=upL.y-_56b.y;
var _570=this.bounds.width()/_56c;
var _571=this.bounds.height()/_56d;
this.dockers.each((function(_572){
_572.bounds.unregisterCallback(this._dockerChangedCallback);
if(!this._dockerUpdated){
_572.bounds.moveBy(_56e,_56f);
if(_570!==1||_571!==1){
var relX=_572.bounds.upperLeft().x-upL.x;
var relY=_572.bounds.upperLeft().y-upL.y;
_572.bounds.moveTo(upL.x+relX*_570,upL.y+relY*_571);
}
}
_572.update();
_572.bounds.registerCallback(this._dockerChangedCallback);
}).bind(this));
if(this._dockerUpdated){
var a=this.dockers.first().bounds.center();
var b=this.dockers.first().bounds.center();
this.dockers.each((function(_577){
var _578=_577.bounds.center();
a.x=Math.min(a.x,_578.x);
a.y=Math.min(a.y,_578.y);
b.x=Math.max(b.x,_578.x);
b.y=Math.max(b.y,_578.y);
}).bind(this));
this.bounds.set(Object.clone(a),Object.clone(b));
}
this.getLabels().each(function(_579){
switch(_579.edgePosition){
case "starttop":
var _57a=this._getAngle(this.dockers[0],this.dockers[1]);
var pos=this.dockers.first().bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("left");
_579.verticalAlign("bottom");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("right");
_579.verticalAlign("bottom");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(180-_57a,pos);
}
break;
case "startbottom":
var _57a=this._getAngle(this.dockers[0],this.dockers[1]);
var pos=this.dockers.first().bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("left");
_579.verticalAlign("top");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("right");
_579.verticalAlign("top");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(180-_57a,pos);
}
break;
case "midtop":
var _57c=this.dockers.length;
if(_57c%2==0){
var _57a=this._getAngle(this.dockers[_57c/2-1],this.dockers[_57c/2]);
var pos1=this.dockers[_57c/2-1].bounds.center();
var pos2=this.dockers[_57c/2].bounds.center();
var pos={x:(pos1.x+pos2.x)/2,y:(pos1.y+pos2.y)/2};
_579.horizontalAlign("center");
_579.verticalAlign("bottom");
_579.x=pos.x;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
if(_57a<=90||_57a>270){
_579.rotate(360-_57a,pos);
}else{
_579.rotate(180-_57a,pos);
}
}else{
var _57f=parseInt(_57c/2);
var _57a=this._getAngle(this.dockers[_57f],this.dockers[_57f+1]);
var pos=this.dockers[_57f].bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("left");
_579.verticalAlign("bottom");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("right");
_579.verticalAlign("bottom");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(180-_57a,pos);
}
}
break;
case "midbottom":
var _57c=this.dockers.length;
if(_57c%2==0){
var _57a=this._getAngle(this.dockers[_57c/2-1],this.dockers[_57c/2]);
var pos1=this.dockers[_57c/2-1].bounds.center();
var pos2=this.dockers[_57c/2].bounds.center();
var pos={x:(pos1.x+pos2.x)/2,y:(pos1.y+pos2.y)/2};
_579.horizontalAlign("center");
_579.verticalAlign("top");
_579.x=pos.x;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
if(_57a<=90||_57a>270){
_579.rotate(360-_57a,pos);
}else{
_579.rotate(180-_57a,pos);
}
}else{
var _57f=parseInt(_57c/2);
var _57a=this._getAngle(this.dockers[_57f],this.dockers[_57f+1]);
var pos=this.dockers[_57f].bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("left");
_579.verticalAlign("top");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("right");
_579.verticalAlign("top");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(180-_57a,pos);
}
}
break;
case "endtop":
var _580=this.dockers.length;
var _57a=this._getAngle(this.dockers[_580-2],this.dockers[_580-1]);
var pos=this.dockers.last().bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("right");
_579.verticalAlign("bottom");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("left");
_579.verticalAlign("bottom");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.y=pos.y-ORYX.CONFIG.OFFSET_EDGE_LABEL_TOP;
_579.rotate(180-_57a,pos);
}
break;
case "endbottom":
var _580=this.dockers.length;
var _57a=this._getAngle(this.dockers[_580-2],this.dockers[_580-1]);
var pos=this.dockers.last().bounds.center();
if(_57a<=90||_57a>270){
_579.horizontalAlign("right");
_579.verticalAlign("top");
_579.x=pos.x-ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(360-_57a,pos);
}else{
_579.horizontalAlign("left");
_579.verticalAlign("top");
_579.x=pos.x+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.y=pos.y+ORYX.CONFIG.OFFSET_EDGE_LABEL_BOTTOM;
_579.rotate(180-_57a,pos);
}
break;
}
}.bind(this));
this.refresh();
this.isChanged=false;
this._dockerUpdated=false;
this._oldBounds=this.bounds.clone();
}
},refresh:function(){
arguments.callee.$.refresh.apply(this,arguments);
var _581;
this._paths.each((function(path,_583){
var _584=this._dockersByPath[path.id];
var c=undefined;
var d=undefined;
if(_581){
d="M"+_581.x+" "+_581.y;
}else{
c=_584[0].bounds.center();
_581=c;
d="M"+c.x+" "+c.y;
}
for(var i=1;i<_584.length;i++){
c=_584[i].bounds.center();
d=d+"L"+c.x+" "+c.y+" ";
_581=c;
}
path.setAttributeNS(null,"d",d);
this._interactionPaths[_583].setAttributeNS(null,"d",d);
}).bind(this));
},getIntersectionPoint:function(){
var _588=Math.floor(this.dockers.length/2);
return ORYX.Core.Math.midPoint(this.dockers[_588-1].bounds.center(),this.dockers[_588].bounds.center());
},isPointIncluded:function(_589,_58a){
var _58b=this.absoluteBounds().isIncluded(_589,_58a);
var _58c=undefined;
if(_58b&&this.dockers.length>0){
var i=0;
var _58e,_58f;
do{
_58e=this.dockers[i].bounds.center();
_58f=this.dockers[++i].bounds.center();
_58c=ORYX.Core.Math.isPointInLine(_589,_58a,_58e.x,_58e.y,_58f.x,_58f.y,5);
}while(!_58c&&i<this.dockers.length-1);
}
return _58c;
},isPointOverOffset:function(){
return false;
},_getAngle:function(_590,_591){
var p1=_590.absoluteCenterXY();
var p2=_591.absoluteCenterXY();
if(p1.x==p2.x&&p1.y==p2.y){
return 0;
}
var _594=Math.asin(Math.sqrt(Math.pow(p1.y-p2.y,2))/(Math.sqrt(Math.pow(p2.x-p1.x,2)+Math.pow(p1.y-p2.y,2))))*180/Math.PI;
if(p2.x>=p1.x&&p2.y<=p1.y){
return _594;
}else{
if(p2.x<p1.x&&p2.y<=p1.y){
return 180-_594;
}else{
if(p2.x<p1.x&&p2.y>p1.y){
return 180+_594;
}else{
return 360-_594;
}
}
}
},alignDockers:function(){
this._update(true);
var _595=this.dockers.first().bounds.center();
var _596=this.dockers.last().bounds.center();
var _597=_596.x-_595.x;
var _598=_596.y-_595.y;
var _599=this.dockers.length-1;
this.dockers.each((function(_59a,_59b){
var part=_59b/_599;
_59a.bounds.unregisterCallback(this._dockerChangedCallback);
_59a.bounds.moveTo(_595.x+part*_597,_595.y+part*_598);
_59a.bounds.registerCallback(this._dockerChangedCallback);
}).bind(this));
this._dockerChanged();
},addDocker:function(_59d,_59e){
var _59f;
var _5a0;
this._dockersByPath.any((function(pair){
return pair.value.any((function(_5a2,_5a3){
if(!_59f){
_59f=_5a2;
return false;
}else{
var _5a4=_59f.bounds.center();
var _5a5=_5a2.bounds.center();
if(ORYX.Core.Math.isPointInLine(_59d.x,_59d.y,_5a4.x,_5a4.y,_5a5.x,_5a5.y,10)){
var path=this._paths.find(function(path){
return path.id===pair.key;
});
if(path){
var _5a8=path.getAttributeNS(NAMESPACE_ORYX,"allowDockers");
if(_5a8&&_5a8.toLowerCase()==="no"){
return true;
}
}
var _5a9=(_59e)?_59e:this.createDocker();
if(_59e){
this.add(_5a9);
}
_5a9.bounds.centerMoveTo(_59d);
pair.value.splice(_5a3,0,_5a9);
this.dockers=this.dockers.without(_5a9);
this.dockers.splice(this.dockers.indexOf(_59f)+1,0,_5a9);
_5a0=_5a9;
return true;
}else{
_59f=_5a2;
return false;
}
}
}).bind(this));
}).bind(this));
return _5a0;
},removeDocker:function(_5aa){
if(this.dockers.length>2&&!(this.dockers.first()===_5aa)){
this._dockersByPath.any((function(pair){
if(pair.value.member(_5aa)){
if(_5aa===pair.value.last()){
return true;
}else{
this.remove(_5aa);
this._dockersByPath[pair.key]=pair.value.without(_5aa);
this.isChanged=true;
this._dockerChanged();
return true;
}
}
return false;
}).bind(this));
}
},_init:function(_5ac){
arguments.callee.$._init.apply(this,arguments);
var _5ad,_5ae,_5af,_5b0;
var defs=_5ac.getElementsByTagNameNS(NAMESPACE_SVG,"defs");
if(defs.length>0){
defs=defs[0];
var _5b2=$A(defs.getElementsByTagNameNS(NAMESPACE_SVG,"marker"));
var _5b3;
var me=this;
_5b2.each(function(_5b5){
try{
_5b3=new ORYX.Core.SVG.SVGMarker(_5b5.cloneNode(true));
me._markers[_5b3.id]=_5b3;
var _5b6=$A(_5b3.element.getElementsByTagNameNS(NAMESPACE_SVG,"text"));
var _5b7;
_5b6.each(function(_5b8){
_5b7=new ORYX.Core.SVG.Label({textElement:_5b8,shapeId:this.id});
me._labels[_5b7.id]=_5b7;
});
}
catch(e){
}
});
}
var gs=_5ac.getElementsByTagNameNS(NAMESPACE_SVG,"g");
if(gs.length<=0){
throw "Edge: No g element found.";
}
var g=gs[0];
g.setAttributeNS(null,"id",null);
var _5bb=true;
$A(g.childNodes).each((function(path,_5bd){
if(ORYX.Editor.checkClassType(path,SVGPathElement)){
path=path.cloneNode(false);
var _5be=this.id+"_"+_5bd;
path.setAttributeNS(null,"id",_5be);
this._paths.push(path);
var _5bf=[];
var _5c0=path.getAttributeNS(null,"marker-start");
if(_5c0&&_5c0!==""){
_5c0=_5c0.strip();
_5c0=_5c0.replace(/^url\(#/,"");
var _5c1=this.id.concat(_5c0.replace(/\)$/,""));
path.setAttributeNS(null,"marker-start","url(#"+_5c1+")");
_5bf.push(this._markers[_5c1]);
}
_5c0=path.getAttributeNS(null,"marker-mid");
if(_5c0&&_5c0!==""){
_5c0=_5c0.strip();
_5c0=_5c0.replace(/^url\(#/,"");
var _5c2=this.id.concat(_5c0.replace(/\)$/,""));
path.setAttributeNS(null,"marker-mid","url(#"+_5c2+")");
_5bf.push(this._markers[_5c2]);
}
_5c0=path.getAttributeNS(null,"marker-end");
if(_5c0&&_5c0!==""){
_5c0=_5c0.strip();
_5c0=_5c0.replace(/^url\(#/,"");
var _5c3=this.id.concat(_5c0.replace(/\)$/,""));
path.setAttributeNS(null,"marker-end","url(#"+_5c3+")");
_5bf.push(this._markers[_5c3]);
}
this._markersByPath[_5be]=_5bf;
var _5c4=new PathParser();
var _5c5=new ORYX.Core.SVG.PointsPathHandler();
_5c4.setHandler(_5c5);
_5c4.parsePath(path);
if(_5c5.points.length<4){
throw "Edge: Path has to have two or more points specified.";
}
this._dockersByPath[_5be]=[];
for(var i=0;i<_5c5.points.length;i+=2){
var x=_5c5.points[i];
var y=_5c5.points[i+1];
if(_5bb||i>0){
var _5c9=new ORYX.Core.Controls.Docker({eventHandlerCallback:this.eventHandlerCallback});
_5c9.bounds.centerMoveTo(x,y);
_5c9.bounds.registerCallback(this._dockerChangedCallback);
this.add(_5c9);
this._dockersByPath[_5be].push(_5c9);
if(_5ad){
_5ad=Math.min(x,_5ad);
_5ae=Math.min(y,_5ae);
}else{
_5ad=x;
_5ae=y;
}
if(_5af){
_5af=Math.max(x,_5af);
_5b0=Math.max(y,_5b0);
}else{
_5af=x;
_5b0=y;
}
}
}
_5bb=false;
}
}).bind(this));
this.bounds.set(_5ad,_5ae,_5af,_5b0);
if(this.bounds.width()===0||this.bounds.height()===0){
this.bounds.extend({x:this.bounds.width()===0?2:0,y:this.bounds.height()===0?2:0});
this.bounds.moveBy({x:this.bounds.width()===0?-1:0,y:this.bounds.height()===0?-1:0});
}
this._oldBounds=this.bounds.clone();
this._paths.reverse();
var _5ca=[];
this._paths.each((function(path){
_5ca.push(this.node.childNodes[0].childNodes[0].childNodes[0].appendChild(path));
}).bind(this));
this._paths=_5ca;
this._paths.each((function(path){
var _5cd=path.cloneNode(false);
_5cd.setAttributeNS(null,"id",undefined);
_5cd.setAttributeNS(null,"stroke-width",10);
_5cd.setAttributeNS(null,"visibility","hidden");
_5cd.setAttributeNS(null,"stroke-dasharray",null);
_5cd.setAttributeNS(null,"stroke","black");
_5cd.setAttributeNS(null,"fill","none");
this._interactionPaths.push(this.node.childNodes[0].childNodes[0].childNodes[0].appendChild(_5cd));
}).bind(this));
this._paths.reverse();
this._interactionPaths.reverse();
var _5ce=_5ac.getElementsByTagNameNS(ORYX.CONFIG.NAMESPACE_SVG,"text");
$A(_5ce).each((function(_5cf){
var _5d0=new ORYX.Core.SVG.Label({textElement:_5cf,shapeId:this.id});
this.node.childNodes[0].childNodes[0].appendChild(_5d0.node);
this._labels[_5d0.id]=_5d0;
}).bind(this));
this.node.setAttributeNS(null,"title",this.getStencil().title());
this.propertiesChanged.each(function(pair){
pair.value=true;
});
},addMarkers:function(defs){
this._markers.each(function(_5d3){
if(!defs.ownerDocument.getElementById(_5d3.value.id)){
_5d3.value.element=defs.appendChild(_5d3.value.element);
}
});
},removeMarkers:function(){
var _5d4=this.node.ownerSVGElement;
if(_5d4){
var defs=_5d4.getElementsByTagNameNS(NAMESPACE_SVG,"defs");
if(defs.length>0){
defs=defs[0];
this._markers.each(function(_5d6){
var _5d7=defs.ownerDocument.getElementById(_5d6.value.id);
if(_5d7){
_5d6.value.element=defs.removeChild(_5d6.value.element);
}
});
}
}
},_dockerChanged:function(){
this._dockerUpdated=true;
},serialize:function(){
var _5d8=arguments.callee.$.serialize.apply(this);
var _5d9="";
this._dockersByPath.each((function(pair){
pair.value.each(function(_5db){
var _5dc=_5db.getDockedShape()&&_5db.referencePoint?_5db.referencePoint:_5db.bounds.center();
_5d9=_5d9.concat(_5dc.x+" "+_5dc.y+" ");
});
_5d9+=" # ";
}).bind(this));
_5d8.push({name:"dockers",prefix:"oryx",value:_5d9,type:"literal"});
var _5dd=this.dockers.last();
var _5de=_5dd.getDockedShape();
if(_5de){
_5d8.push({name:"target",prefix:"raziel",value:"#"+ERDF.__stripHashes(_5de.resourceId),type:"resource"});
}
try{
_5d8=this.getStencil().serialize(this,_5d8);
}
catch(e){
}
return _5d8;
},deserialize:function(data){
try{
data=this.getStencil().deserialize(this,data);
}
catch(e){
}
var _5e0=data.find(function(ser){
return (ser.prefix+"-"+ser.name)=="raziel-target";
});
var _5e2;
if(_5e0){
_5e2=this.getCanvas().getChildShapeByResourceId(_5e0.value);
}
var _5e3=data.findAll(function(ser){
return (ser.prefix+"-"+ser.name)=="raziel-outgoing";
});
_5e3.each((function(obj){
if(!this.parent){
return;
}
var next=this.getCanvas().getChildShapeByResourceId(obj.value);
if(next){
if(next==_5e2){
this.dockers.last().setDockedShape(next);
this.dockers.last().setReferencePoint({x:next.bounds.width()/2,y:next.bounds.height()/2});
}else{
if(next instanceof ORYX.Core.Edge){
next.dockers.first().setDockedShape(this);
}
}
}
}).bind(this));
arguments.callee.$.deserialize.apply(this,[data]);
var _5e7=data.find(function(obj){
return (obj.prefix==="oryx"&&obj.name==="dockers");
});
if(_5e7){
var _5e9=_5e7.value.split("#").without("").without(" ");
_5e9.each((function(data,_5eb){
var _5ec=data.replace(/,/g," ").split(" ").without("");
if(_5ec.length%2===0){
var path=this._paths[_5eb];
if(path){
if(_5eb===0){
while(this._dockersByPath[path.id].length>2){
this.removeDocker(this._dockersByPath[path.id][1]);
}
}else{
while(this._dockersByPath[path.id].length>1){
this.removeDocker(this._dockersByPath[path.id][0]);
}
}
var _5ee=this._dockersByPath[path.id];
if(_5eb===0){
var x=parseFloat(_5ec.shift());
var y=parseFloat(_5ec.shift());
if(_5ee.first().getDockedShape()){
_5ee.first().setReferencePoint({x:x,y:y});
}else{
_5ee.first().bounds.centerMoveTo(x,y);
}
}
y=parseFloat(_5ec.pop());
x=parseFloat(_5ec.pop());
if(_5ee.last().getDockedShape()){
_5ee.last().setReferencePoint({x:x,y:y});
}else{
_5ee.last().bounds.centerMoveTo(x,y);
}
for(var i=0;i<_5ec.length;i++){
x=parseFloat(_5ec[i]);
y=parseFloat(_5ec[++i]);
var _5f2=this.createDocker();
_5f2.bounds.centerMoveTo(x,y);
_5ee.splice(_5ee.length-1,0,_5f2);
this.dockers=this.dockers.without(_5f2);
this.dockers.splice(this.dockers.indexOf(_5ee.last()),0,_5f2);
}
}
}
}).bind(this));
}else{
this.alignDockers();
}
this._changed();
},toString:function(){
return this.getStencil().title()+" "+this.id;
}};
ORYX.Core.Edge=ORYX.Core.Shape.extend(ORYX.Core.Edge);
if(!ORYX){
var ORYX={};
}
if(!ORYX.Core){
ORYX.Core={};
}
ORYX.Core.Command=Clazz.extend({construct:function(){
},execute:function(){
throw "Command.execute() has to be implemented!";
},rollback:function(){
throw "Command.rollback() has to be implemented!";
}});
if(!ORYX){
var ORYX={};
}
if(!ORYX.Plugins){
ORYX.Plugins={};
}
ORYX.Plugins.AbstractPlugin=Clazz.extend({facade:null,construct:function(_5f3){
this.facade=_5f3;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED,this.onLoaded.bind(this));
},onLoaded:function(){
},onSelectionChanged:function(){
},showOverlay:function(_5f4,_5f5,_5f6,_5f7){
if(!(_5f4 instanceof Array)){
_5f4=[_5f4];
}
_5f4=_5f4.map(function(_5f8){
var el=_5f8;
if(typeof _5f8=="string"){
el=this.facade.getCanvas().getChildShapeByResourceId(_5f8);
el=el||this.facade.getCanvas().getChildById(_5f8,true);
}
return el;
}.bind(this)).compact();
if(!this.overlayID){
this.overlayID=this.type+ORYX.Editor.provideId();
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:this.overlayID,shapes:_5f4,attributes:_5f5,node:_5f6,nodePosition:_5f7||"NW"});
},hideOverlay:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:this.overlayID});
},doTransform:function(data,_5fb){
if(!_5fb||!data){
return "";
}
var _5fc=new DOMParser();
var _5fd=_5fc.parseFromString(data,"text/xml");
var _5fe=_5fb;
var _5ff=new XSLTProcessor();
var _600=document.implementation.createDocument("","",null);
_600.async=false;
_600.load(_5fe);
_5ff.importStylesheet(_600);
try{
var _601=_5ff.transformToDocument(_5fd);
var _602=(new XMLSerializer()).serializeToString(_601);
_602=!_602.startsWith("<?xml")?"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_602:_602;
return _602;
}
catch(error){
return -1;
}
},openXMLWindow:function(_603){
var win=window.open("data:application/xml,"+encodeURIComponent(_603),"_blank","resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes");
},openDownloadWindow:function(_605,_606){
var win=window.open("");
if(win!=null){
win.document.open();
win.document.write("<html><body>");
var _608=win.document.createElement("form");
win.document.body.appendChild(_608);
var _609=function(name,_60b){
var _60c=document.createElement("input");
_60c.name=name;
_60c.type="hidden";
_60c.value=_60b;
return _60c;
};
_608.appendChild(_609("download",_606));
_608.appendChild(_609("file",_605));
_608.method="POST";
win.document.write("</body></html>");
win.document.close();
_608.action=ORYX.PATH+"/download";
_608.submit();
}
},getSerializedDOM:function(){
var _60d=DataManager.serializeDOM(this.facade);
_60d="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_60d+"</body></html>";
return _60d;
},getRDFFromDOM:function(){
var _60e=new DOMParser();
var _60f=_60e.parseFromString(this.getSerializedDOM(),"text/xml");
var _610=ORYX.PATH+"lib/extract-rdf.xsl";
var _611=new XSLTProcessor();
var _612=document.implementation.createDocument("","",null);
_612.async=false;
_612.load(_610);
_611.importStylesheet(_612);
try{
var rdf=_611.transformToDocument(_60f);
return (new XMLSerializer()).serializeToString(rdf);
}
catch(error){
Ext.Msg.alert("Oryx",error);
return null;
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.AdHocCC=Clazz.extend({facade:undefined,UNSAVED_RESOURCE:"unsaved",construct:function(_614){
this.facade=_614;
this.facade.offer({"name":ORYX.I18N.AdHocCC.compl,"functionality":this.editCC.bind(this),"group":ORYX.I18N.AdHocCC.group,"icon":ORYX.PATH+"images/adhoc.gif","description":ORYX.I18N.AdHocCC.complDesc,"index":0,"minShape":1,"maxShape":1});
},editCC:function(){
var _615=this.facade.getSelection();
if(_615.length!=1){
this.openErroDialog(ORYX.I18N.AdHocCC.notOne);
return;
}
var _616=_615[0];
if(_616._stencil.id()!="http://b3mn.org/stencilset/bpmnexec#Subprocess"||!_616.properties["oryx-isadhoc"]){
this.openErroDialog(ORYX.I18N.AdHocCC.nodAdHocCC);
return;
}
var _617=_616.properties["oryx-adhoccompletioncondition"];
var _618=["resourceID","resourceName"];
var _619=[];
var _61a=["state"];
var _61b=[["ready"],["skipped"],["completed"]];
var _61c=["resourceID_FieldName","dataNameAndFieldName"];
var _61d=[];
var _61e=new DOMParser();
var _61f=_616.getChildNodes();
for(var i=0;i<_61f.length;i++){
var _621=_61f[i];
if(_621._stencil.id()=="http://b3mn.org/stencilset/bpmnexec#Task"){
var _622=_621.properties["oryx-name"];
var _623=_621.resourceId;
if(typeof _623=="undefined"){
DataManager.__persistDOM(this.facade);
_623=_621.resourceId;
if(typeof _623=="undefined"){
_623=this.UNSAVED_RESOURCE;
_622=_622+" (unsaved)";
}
}
_619.push([_623,_622]);
}else{
if(_621._stencil.id()=="http://b3mn.org/stencilset/bpmnexec#DataObject"){
var _622=_621.properties["oryx-name"];
var _623=_621.resourceId;
if(typeof _623=="undefined"){
DataManager.__persistDOM(this.facade);
_623=_621.resourceId;
if(typeof _623=="undefined"){
_623=this.UNSAVED_RESOURCE;
_622=_622+" (unsaved)";
}
}
var _624=_621.properties["oryx-datamodel"];
var _625=_61e.parseFromString(_624,"text/xml");
var _626=_625.childNodes[0];
if(_626!=null){
var _627=_626.childNodes;
for(var j=0;j<_627.length;j++){
var _629=_627[j].attributes["name"].nodeValue;
if(_629!=null){
_61d.push([[_623,_629],_622+"/"+_629]);
}
}
}
}
}
}
var _62a=new Ext.data.SimpleStore({fields:_618,data:_619});
var _62b=new Ext.data.SimpleStore({fields:_61a,data:_61b});
var _62c=new Ext.data.SimpleStore({fields:_61c,data:_61d});
var _62d=new Ext.form.ComboBox({store:_62a,valueField:_618[0],displayField:_618[1],emptyText:ORYX.I18N.AdHocCC.selectTask,typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,editable:false,width:180});
var _62e=new Ext.form.ComboBox({store:_62b,displayField:_61a[0],emptyText:ORYX.I18N.AdHocCC.selectState,typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,editable:false,width:180});
var _62f=new Ext.Button({text:ORYX.I18N.AdHocCC.addExp,handler:function(){
var task=_62d.getValue();
var _631=_62e.getValue();
if(task!=this.UNSAVED_RESOURCE&&task!=""&&_631!=""){
this.addStringToTextArea(_632,"stateExpression('"+task+"', '"+_631+"')");
_62d.setValue("");
_62e.setValue("");
}
}.bind(this)});
var _633=new Ext.form.ComboBox({store:_62c,valueField:_61c[0],displayField:_61c[1],emptyText:ORYX.I18N.AdHocCC.selectDataField,typeAhead:true,mode:"local",triggerAction:"all",selectOnFocus:true,editable:false,width:180});
var _634=new Ext.form.TextField({width:180,emptyText:ORYX.I18N.AdHocCC.enterEqual,});
var _635=new Ext.Button({text:ORYX.I18N.AdHocCC.addExp,handler:function(){
var data=_633.getValue();
var _637=_634.getValue();
if(data!=null&&data[0]!=this.UNSAVED_RESOURCE&&_637!=""){
this.addStringToTextArea(_632,"dataExpression('"+data[0]+"', '"+data[1]+"', '"+_637+"')");
_633.setValue("");
_634.setValue("");
}
}.bind(this)});
var _638=new Ext.Button({text:ORYX.I18N.AdHocCC.and,minWidth:50,handler:function(){
this.addStringToTextArea(_632,"&");
}.bind(this)});
var _639=new Ext.Button({text:ORYX.I18N.AdHocCC.or,minWidth:50,handler:function(){
this.addStringToTextArea(_632,"|");
}.bind(this)});
var _63a=new Ext.Button({text:"(",minWidth:50,handler:function(){
this.addStringToTextArea(_632,"(");
}.bind(this)});
var _63b=new Ext.Button({text:")",minWidth:50,handler:function(){
this.addStringToTextArea(_632,")");
}.bind(this)});
var _63c=new Ext.Button({text:ORYX.I18N.AdHocCC.not,minWidth:50,handler:function(){
this.addStringToTextArea(_632,"!");
}.bind(this)});
var _632=new Ext.form.TextArea({width:418,height:100,value:_617});
var _63d=new Ext.Button({text:ORYX.I18N.AdHocCC.clearCC,handler:function(){
_632.setValue("");
}});
var win=new Ext.Window({width:450,height:485,resizable:false,minimizable:false,modal:true,autoScroll:true,title:ORYX.I18N.AdHocCC.editCC,layout:"table",defaults:{bodyStyle:"padding:3px;background-color:transparent;border-width:0px"},layoutConfig:{columns:7},items:[{items:[new Ext.form.Label({text:ORYX.I18N.AdHocCC.addExecState,style:"font-size:12px;"})],colspan:7},{},{items:[_62d],colspan:6},{},{items:[_62e],colspan:4},{items:[_62f]},{},{colspan:7},{items:[new Ext.form.Label({text:ORYX.I18N.AdHocCC.addDataExp,style:"font-size:12px;"})],colspan:7},{},{items:[_633],colspan:6},{},{items:[_634],colspan:4},{items:[_635]},{},{colspan:7},{items:[new Ext.form.Label({text:ORYX.I18N.AdHocCC.addLogOp,style:"font-size:12px;"})],colspan:7},{},{items:[_638]},{items:[_639]},{items:[_63a]},{items:[_63b]},{items:[_63c]},{},{colspan:7},{items:[new Ext.form.Label({text:ORYX.I18N.AdHocCC.curCond,style:"font-size:12px;"})],colspan:7},{},{items:[_632],colspan:5},{},{colspan:5},{items:[_63d]},{}],buttons:[{text:"Apply",handler:function(){
win.hide();
_616.properties["oryx-adhoccompletioncondition"]=_632.getValue();
this.facade.setSelection([]);
this.facade.setSelection(_615);
}.bind(this)},{text:"Cancel",handler:function(){
win.hide();
}}],keys:[{key:27,fn:function(){
win.hide();
}}]});
win.show();
},addStringToTextArea:function(_63f,_640){
var _641=_63f.getEl().dom.selectionStart;
var _642=_63f.getEl().dom.selectionEnd;
var _643=_63f.getValue();
_63f.setValue(_643.substring(0,_641)+_640+_643.substring(_642));
_63f.getEl().dom.selectionStart=_641+_640.length;
_63f.getEl().dom.selectionEnd=_63f.getEl().dom.selectionStart;
},openErroDialog:function(_644){
Ext.MessageBox.show({title:"Error",msg:_644,buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.AddDocker=Clazz.extend({construct:function(_645){
this.facade=_645;
this.facade.offer({"name":ORYX.I18N.AddDocker.add,"functionality":this.enableAddDocker.bind(this),"group":ORYX.I18N.AddDocker.group,"icon":ORYX.PATH+"images/vector_add.png","description":ORYX.I18N.AddDocker.addDesc,"index":1,"toggle":true,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.AddDocker.del,"functionality":this.enableDeleteDocker.bind(this),"group":ORYX.I18N.AddDocker.group,"icon":ORYX.PATH+"images/vector_delete.png","description":ORYX.I18N.AddDocker.delDesc,"index":2,"toggle":true,"minShape":0,"maxShape":0});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
},enableAddDocker:function(_646,_647){
this.addDockerButton=_646;
if(_647&&this.deleteDockerButton){
this.deleteDockerButton.toggle(false);
}
},enableDeleteDocker:function(_648,_649){
this.deleteDockerButton=_648;
if(_649&&this.addDockerButton){
this.addDockerButton.toggle(false);
}
},enabledAdd:function(){
return this.addDockerButton?this.addDockerButton.pressed:false;
},enabledDelete:function(){
return this.deleteDockerButton?this.deleteDockerButton.pressed:false;
},handleMouseDown:function(_64a,_64b){
if(this.enabledAdd()&&_64b instanceof ORYX.Core.Edge){
this.newDockerCommand({edge:_64b,position:this.facade.eventCoordinates(_64a)});
}else{
if(this.enabledDelete()&&_64b instanceof ORYX.Core.Controls.Docker&&_64b.parent instanceof ORYX.Core.Edge){
this.newDockerCommand({edge:_64b.parent,docker:_64b});
}else{
if(this.enabledAdd()){
this.addDockerButton.toggle(false);
}else{
if(this.enabledDelete()){
this.deleteDockerButton.toggle(false);
}
}
}
}
},newDockerCommand:function(_64c){
if(!_64c.edge){
return;
}
var _64d=ORYX.Core.Command.extend({construct:function(_64e,_64f,edge,_651,pos,_653){
this.addEnabled=_64e;
this.deleteEnabled=_64f;
this.edge=edge;
this.docker=_651;
this.pos=pos;
this.facade=_653;
},execute:function(){
if(this.addEnabled){
this.docker=this.edge.addDocker(this.pos,this.docker);
}else{
if(this.deleteEnabled){
this.pos=this.docker.bounds.center();
this.edge.removeDocker(this.docker);
}
}
this.facade.getCanvas().update();
this.facade.updateSelection();
},rollback:function(){
if(this.addEnabled){
if(this.docker instanceof ORYX.Core.Controls.Docker){
this.edge.removeDocker(this.docker);
}
}else{
if(this.deleteEnabled){
this.docker=this.edge.addDocker(this.pos,this.docker);
}
}
this.facade.getCanvas().update();
this.facade.updateSelection();
}});
var _654=new _64d(this.enabledAdd(),this.enabledDelete(),_64c.edge,_64c.docker,_64c.position,this.facade);
this.facade.executeCommands([_654]);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.SSExtensionLoader={construct:function(_655){
this.facade=_655;
this.facade.offer({"name":ORYX.I18N.SSExtensionLoader.add,"functionality":this.addSSExtension.bind(this),"group":ORYX.I18N.SSExtensionLoader.group,"icon":ORYX.PATH+"images/add.png","description":ORYX.I18N.SSExtensionLoader.addDesc,"index":1,"minShape":0,"maxShape":0});
},addSSExtension:function(_656){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.SSExtensionLoader.loading});
var url=ORYX.CONFIG.SS_EXTENSIONS_CONFIG;
new Ajax.Request(url,{method:"GET",asynchronous:false,onSuccess:(function(_658){
try{
eval("var jsonObject = "+_658.responseText);
var _659=this.facade.getStencilSets();
var _65a=jsonObject.extensions.findAll(function(_65b){
var _65c=_659[_65b["extends"]];
if(_65c){
return !_65c.extensions()[_65b.namespace];
}else{
return false;
}
});
if(_65a.size()==0){
Ext.Msg.alert("Oryx",ORYX.I18N.SSExtensionLoader.noExt);
}else{
this._showPanel(_65a,this._loadExtensions.bind(this));
}
}
catch(e){
Ext.Msg.alert("Oryx",ORYX.I18N.SSExtensionLoader.failed1);
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),onFailure:(function(_65d){
Ext.Msg.alert("Oryx",ORYX.I18N.SSExtensionLoader.failed2);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this)});
},_loadExtensions:function(_65e){
var _65f=this.facade.getStencilSets();
var _660=false;
_65e.each(function(_661){
var _662=_65f[_661["extends"]];
if(_662){
_662.addExtension(ORYX.CONFIG.SS_EXTENSIONS_FOLDER+_661.definition);
this.facade.getRules().initializeRules(_662);
_660=true;
}
}.bind(this));
if(_660){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_STENCIL_SET_LOADED});
var _663=this.facade.getSelection();
this.facade.setSelection();
this.facade.setSelection(_663);
}
},_showPanel:function(_664,_665){
var data=[];
_664.each(function(_667){
data.push([_667.title,_667.definition,_667["extends"]]);
});
var sm=new Ext.grid.CheckboxSelectionModel();
var grid=new Ext.grid.GridPanel({id:"oryx_new_stencilset_extention_grid",store:new Ext.data.SimpleStore({data:data,fields:["title","definition","extends"]}),cm:new Ext.grid.ColumnModel([sm,{header:ORYX.I18N.SSExtensionLoader.panelTitle,width:200,sortable:true,dataIndex:"title"},]),sm:sm,frame:true,width:200,height:200,iconCls:"icon-grid"});
var _66a=new Ext.Panel({items:[{xtype:"label",text:ORYX.I18N.SSExtensionLoader.panelText,style:"margin:10px;display:block"},grid],frame:true,buttons:[{text:ORYX.I18N.SSExtensionLoader.labelImport,handler:function(){
var _66b=Ext.getCmp("oryx_new_stencilset_extention_grid").getSelectionModel();
var _66c=_66b.selections.items.collect(function(item){
return item.data;
});
Ext.getCmp("oryx_new_stencilset_extention_window").close();
_665(_66c);
}.bind(this)},{text:ORYX.I18N.SSExtensionLoader.labelCancel,handler:function(){
Ext.getCmp("oryx_new_stencilset_extention_window").close();
}.bind(this)}]});
var _66e=new Ext.Window({id:"oryx_new_stencilset_extention_window",width:227,title:"Oryx",floating:true,shim:true,modal:true,resizable:false,autoHeight:true,items:[_66a]});
_66e.show();
}};
ORYX.Plugins.SSExtensionLoader=Clazz.extend(ORYX.Plugins.SSExtensionLoader);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.AddStencilSet={construct:function(_66f){
this.facade=_66f;
this.facade.offer({"name":"Add Stencil Set","functionality":this.addStencilSet.bind(this),"group":"StencilSet","icon":ORYX.PATH+"images/add.png","description":"Add a stencil set.","index":1,"minShape":0,"maxShape":0});
},addStencilSet:function(){
var url=Ext.Msg.prompt("Oryx","Enter relative url of the stencil set's JSON file:",(function(btn,url){
if(btn=="ok"&&url){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:"Loading Stencil Set"});
window.setTimeout(function(){
this.facade.loadStencilSet(url);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}.bind(this),100);
}
}).bind(this));
}};
ORYX.Plugins.AddStencilSet=Clazz.extend(ORYX.Plugins.AddStencilSet);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.AMLSupport=Clazz.extend({facade:undefined,construct:function(_673){
this.facade=_673;
this.facade.offer({"name":ORYX.I18N.AMLSupport.imp,"functionality":this.importAML.bind(this),"group":ORYX.I18N.AMLSupport.group,"icon":ORYX.PATH+"images/aris_import_icon.png","description":ORYX.I18N.AMLSupport.impDesc,"index":3,"minShape":0,"maxShape":0});
this.AMLServletURL="/amlsupport";
},importAML:function(){
this._showUploadDialog(this.loadDiagrams.bind(this));
},loadDiagrams:function(erdf){
if(!erdf.startsWith("<")){
Ext.Msg.alert("Oryx",ORYX.I18N.AMLSupport.failed+erdf);
ORYX.Log.warn("Import AML failed: "+erdf);
return;
}
var doc;
try{
doc=this.parseToDoc(erdf);
var _676=$A(doc.firstChild.childNodes).collect(function(node){
return {title:this.getChildNodesByClassName(node.firstChild,"oryx-title")[0].textContent,data:node};
}.bind(this));
_676.sort(function(a,b){
return a.title>b.title;
});
this._showPanel(_676,function(_67a){
if(_67a.length>1){
var _67b=true;
var _67c=[];
_67a.each(function(item){
var url="/backend/poem"+ORYX.CONFIG.ORYX_NEW_URL+"?stencilset=/stencilsets/epc/epc.json";
var _67f="<div class=\"processdata\"><div class=\"-oryx-canvas\" id=\"oryx-canvas123\" style=\"display: none; width:1200px; height:600px;\"><a href=\"/stencilsets/epc/epc.json\" rel=\"oryx-stencilset\"></a><span class=\"oryx-mode\">writeable</span><span class=\"oryx-mode\">fullscreen</span></div></div>";
var _680="<svg/>";
var _681={data:_67f,svg:_680,title:item.name,summary:"",type:"http://b3mn.org/stencilset/epc#"};
_67b=this.sendRequest(url,_681,function(_682){
var loc=_682.getResponseHeader("location");
var id=this.getNodesByClassName(item.data,"div","-oryx-canvas")[0].getAttribute("id");
_67c.push({name:item.name,data:item.data,url:loc,id:id});
}.bind(this));
if(!_67b){
throw $break;
}
}.bind(this));
if(!_67b){
return;
}
var _685=_67c.collect(function(item){
return $A(this.getNodesByClassName(item.data,"span","oryx-refuri"));
}.bind(this)).flatten();
_685.each(function(_687){
if(_687.textContent.length==0){
return;
}
var _688=_67c.find(function(item){
return _687.textContent==item.id;
});
_687.textContent=_688?_688.url:"";
});
_67c.each(function(item){
var url=item.url;
var _68c="<svg/>";
var data=DataManager.serialize(item.data);
data="<div "+data.slice(data.search("class"));
var _68e={data:data,svg:_68c};
_67b=this.sendRequest(url,_68e);
if(!_67b){
throw $break;
}
}.bind(this));
if(!_67b){
return;
}
this._showResultPanel(_67c.collect(function(item){
return {name:item.name,url:item.url};
}));
}else{
var _690=_67a[0].data;
$A(this.getNodesByClassName(_690,"span","oryx-refuri")).each(function(node){
node.textContent="";
});
this.facade.importERDF(_690);
}
}.bind(this));
}
catch(e){
Ext.Msg.alert("Oryx",ORYX.I18N.AMLSupport.failed2+e);
ORYX.Log.warn("Import AML failed: "+e);
}
},sendRequest:function(url,_693,_694){
var suc=false;
new Ajax.Request(url,{method:"POST",asynchronous:false,parameters:_693,onSuccess:function(_696){
suc=true;
if(_694){
_694(_696);
}
}.bind(this),onFailure:function(_697){
Ext.Msg.alert("Oryx",ORYX.I18N.AMLSupport.failed2);
ORYX.Log.warn("Import AML failed: "+_697.responseText);
}.bind(this),on403:function(_698){
Ext.Msg.alert("Oryx",ORYX.I18N.AMLSupport.noRights);
ORYX.Log.warn("Import AML failed: "+_698.responseText);
}.bind(this)});
return suc;
},getChildNodesByClassName:function(doc,id){
return $A(doc.childNodes).findAll(function(el){
return $A(el.attributes).any(function(attr){
return attr.nodeName=="class"&&attr.nodeValue==id;
});
});
},getNodesByClassName:function(doc,_69e,_69f){
return $A(doc.getElementsByTagName(_69e)).findAll(function(el){
return $A(el.attributes).any(function(attr){
return attr.nodeName=="class"&&attr.nodeValue==_69f;
});
});
},parseToDoc:function(_6a2){
_6a2=_6a2.startsWith("<?xml")?_6a2:"<?xml version=\"1.0\" encoding=\"utf-8\"?>"+_6a2+"";
var _6a3=new DOMParser();
return _6a3.parseFromString(_6a2,"text/xml");
},_showUploadDialog:function(_6a4){
var form=new Ext.form.FormPanel({frame:true,bodyStyle:"padding:5px;",defaultType:"textfield",labelAlign:"left",buttonAlign:"right",fileUpload:true,enctype:"multipart/form-data",items:[{text:ORYX.I18N.AMLSupport.panelText,style:"font-size:12px;margin-bottom:10px;display:block;",xtype:"label"},{fieldLabel:ORYX.I18N.AMLSupport.file,inputType:"file",labelStyle:"width:50px;",itemCls:"ext_specific_window_overflow"}]});
var _6a6=new Ext.Window({autoCreate:true,title:ORYX.I18N.AMLSupport.importBtn,height:"auto",width:420,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,resizable:false,items:[form],buttons:[{text:ORYX.I18N.AMLSupport.impText,handler:function(){
var _6a7=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.AMLSupport.get});
_6a7.show();
form.form.submit({url:ORYX.PATH+this.AMLServletURL,success:function(f,a){
_6a7.hide();
_6a6.hide();
_6a4(a.result);
}.bind(this),failure:function(f,a){
_6a7.hide();
_6a6.hide();
Ext.MessageBox.show({title:"Error",msg:a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9,a.response.responseText.indexOf("'}")),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
}});
}.bind(this)},{text:ORYX.I18N.AMLSupport.close,handler:function(){
_6a6.hide();
}.bind(this)}]});
_6a6.on("hide",function(){
_6a6.destroy(true);
delete _6a6;
});
_6a6.show();
},_showPanel:function(_6ac,_6ad){
var data=[];
_6ac.each(function(_6af){
data.push([_6af.title,_6af.data]);
});
var sm=new Ext.grid.CheckboxSelectionModel({header:"",});
var grid=new Ext.grid.GridPanel({store:new Ext.data.SimpleStore({data:data,fields:["title"]}),cm:new Ext.grid.ColumnModel([sm,{header:ORYX.I18N.AMLSupport.title,width:260,sortable:true,dataIndex:"title"},]),sm:sm,frame:true,width:300,height:300,iconCls:"icon-grid",});
var _6b2=new Ext.Panel({items:[{xtype:"label",html:ORYX.I18N.AMLSupport.selectDiagrams,style:"margin:5px;display:block"},grid],height:"auto",frame:true});
var _6b3=new Ext.Window({width:327,height:"auto",title:"Oryx",floating:true,shim:true,modal:true,resizable:false,autoHeight:true,items:[_6b2],buttons:[{text:ORYX.I18N.AMLSupport.impText,handler:function(){
var _6b4=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.AMLSupport.impProgress});
_6b4.show();
var _6b5=grid.getSelectionModel();
var _6b6=_6b5.selections.items.collect(function(item){
return {name:item.json[0],data:item.json[1]};
});
_6b3.close();
window.setTimeout(function(){
_6ad(_6b6);
_6b4.hide();
}.bind(this),100);
}.bind(this)},{text:ORYX.I18N.AMLSupport.cancel,handler:function(){
_6b3.close();
}.bind(this)}]});
_6b3.show();
},_showResultPanel:function(_6b8){
var data=[];
_6b8.each(function(_6ba){
data.push([_6ba.name,"<a href=\""+_6ba.url+"\" target=\"_blank\">"+_6ba.url+"</a>"]);
});
var grid=new Ext.grid.GridPanel({store:new Ext.data.SimpleStore({data:data,fields:["name","url"]}),cm:new Ext.grid.ColumnModel([{header:ORYX.I18N.AMLSupport.name,width:260,sortable:true,dataIndex:"name"},{header:"URL",width:300,sortable:true,dataIndex:"url"}]),frame:true,width:500,height:300,iconCls:"icon-grid"});
var _6bc=new Ext.Panel({items:[{xtype:"label",text:ORYX.I18N.AMLSupport.allImported,style:"margin:5px;display:block"},grid],height:"auto",frame:true});
var _6bd=new Ext.Window({width:"auto",title:"Oryx",floating:true,shim:true,modal:true,resizable:false,autoHeight:true,items:[_6bc],buttons:[{text:ORYX.I18N.AMLSupport.ok,handler:function(){
_6bd.close();
}.bind(this)}]});
_6bd.show();
},throwErrorMessage:function(_6be){
Ext.Msg.alert("Oryx",_6be);
},});
Array.prototype.insertFrom=function(from,to){
to=Math.max(0,to);
from=Math.min(Math.max(0,from),this.length-1);
var el=this[from];
var old=this.without(el);
var newA=old.slice(0,to);
newA.push(el);
if(old.length>to){
newA=newA.concat(old.slice(to));
}
return newA;
};
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Arrangement=Clazz.extend({facade:undefined,construct:function(_6c4){
this.facade=_6c4;
this.facade.offer({"name":ORYX.I18N.Arrangement.btf,"functionality":this.setZLevel.bind(this,this.setToTop),"group":ORYX.I18N.Arrangement.groupZ,"icon":ORYX.PATH+"images/shape_move_front.png","description":ORYX.I18N.Arrangement.btfDesc,"index":1,"minShape":1});
this.facade.offer({"name":ORYX.I18N.Arrangement.btb,"functionality":this.setZLevel.bind(this,this.setToBack),"group":ORYX.I18N.Arrangement.groupZ,"icon":ORYX.PATH+"images/shape_move_back.png","description":ORYX.I18N.Arrangement.btbDesc,"index":2,"minShape":1});
this.facade.offer({"name":ORYX.I18N.Arrangement.bf,"functionality":this.setZLevel.bind(this,this.setForward),"group":ORYX.I18N.Arrangement.groupZ,"icon":ORYX.PATH+"images/shape_move_forwards.png","description":ORYX.I18N.Arrangement.bfDesc,"index":3,"minShape":1});
this.facade.offer({"name":ORYX.I18N.Arrangement.bb,"functionality":this.setZLevel.bind(this,this.setBackward),"group":ORYX.I18N.Arrangement.groupZ,"icon":ORYX.PATH+"images/shape_move_backwards.png","description":ORYX.I18N.Arrangement.bbDesc,"index":4,"minShape":1});
this.facade.offer({"name":ORYX.I18N.Arrangement.ab,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_BOTTOM]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_bottom.png","description":ORYX.I18N.Arrangement.abDesc,"index":1,"minShape":2});
this.facade.offer({"name":ORYX.I18N.Arrangement.am,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_MIDDLE]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_middle.png","description":ORYX.I18N.Arrangement.amDesc,"index":2,"minShape":2});
this.facade.offer({"name":ORYX.I18N.Arrangement.at,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_TOP]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_top.png","description":ORYX.I18N.Arrangement.atDesc,"index":3,"minShape":2});
this.facade.offer({"name":ORYX.I18N.Arrangement.al,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_LEFT]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_left.png","description":ORYX.I18N.Arrangement.alDesc,"index":4,"minShape":2});
this.facade.offer({"name":ORYX.I18N.Arrangement.ac,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_CENTER]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_center.png","description":ORYX.I18N.Arrangement.acDesc,"index":5,"minShape":2});
this.facade.offer({"name":ORYX.I18N.Arrangement.ar,"functionality":this.alignShapes.bind(this,[ORYX.CONFIG.EDITOR_ALIGN_RIGHT]),"group":ORYX.I18N.Arrangement.groupA,"icon":ORYX.PATH+"images/shape_align_right.png","description":ORYX.I18N.Arrangement.arDesc,"index":6,"minShape":2});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENT_TOP,this.setZLevel.bind(this,this.setToTop));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENT_BACK,this.setZLevel.bind(this,this.setToBack));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENT_FORWARD,this.setZLevel.bind(this,this.setForward));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_ARRANGEMENT_BACKWARD,this.setZLevel.bind(this,this.setBackward));
},setZLevel:function(_6c5,_6c6){
var _6c7=ORYX.Core.Command.extend({construct:function(_6c8,_6c9,_6ca){
this.callback=_6c8;
this.elements=_6c9;
this.elAndIndex=_6c9.map(function(el){
return {el:el,previous:el.parent.children[el.parent.children.indexOf(el)-1]};
});
this.facade=_6ca;
},execute:function(){
this.callback(this.elements);
this.facade.setSelection(this.elements);
},rollback:function(){
var _6cc=this.elAndIndex.sortBy(function(el){
var _6ce=el.el;
var t=$A(_6ce.node.parentNode.childNodes);
return t.indexOf(_6ce.node);
});
for(var i=0;i<_6cc.length;i++){
var el=_6cc[i].el;
var p=el.parent;
var _6d3=p.children.indexOf(el);
var _6d4=p.children.indexOf(_6cc[i].previous);
_6d4=_6d4||0;
p.children=p.children.insertFrom(_6d3,_6d4);
el.node.parentNode.insertBefore(el.node,el.node.parentNode.childNodes[_6d4+1]);
}
this.facade.setSelection(this.elements);
}});
var _6d5=new _6c7(_6c5,this.facade.getSelection(),this.facade);
if(_6c6.excludeCommand){
_6d5.execute();
}else{
this.facade.executeCommands([_6d5]);
}
},setToTop:function(_6d6){
var _6d7=_6d6.sortBy(function(_6d8,_6d9){
var t=$A(_6d8.node.parentNode.childNodes);
return t.indexOf(_6d8.node);
});
_6d7.each(function(_6db){
var p=_6db.parent;
p.children=p.children.without(_6db);
p.children.push(_6db);
_6db.node.parentNode.appendChild(_6db.node);
});
},setToBack:function(_6dd){
var _6de=_6dd.sortBy(function(_6df,_6e0){
var t=$A(_6df.node.parentNode.childNodes);
return t.indexOf(_6df.node);
});
_6de=_6de.reverse();
_6de.each(function(_6e2){
var p=_6e2.parent;
p.children=p.children.without(_6e2);
p.children.unshift(_6e2);
_6e2.node.parentNode.insertBefore(_6e2.node,_6e2.node.parentNode.firstChild);
});
},setBackward:function(_6e4){
var _6e5=_6e4.sortBy(function(_6e6,_6e7){
var t=$A(_6e6.node.parentNode.childNodes);
return t.indexOf(_6e6.node);
});
_6e5=_6e5.reverse();
var _6e9=_6e5.findAll(function(el){
return !_6e5.some(function(_6eb){
return _6eb.node==el.node.previousSibling;
});
});
_6e9.each(function(el){
if(el.node.previousSibling===null){
return;
}
var p=el.parent;
var _6ee=p.children.indexOf(el);
p.children=p.children.insertFrom(_6ee,_6ee-1);
el.node.parentNode.insertBefore(el.node,el.node.previousSibling);
});
},setForward:function(_6ef){
var _6f0=_6ef.sortBy(function(_6f1,_6f2){
var t=$A(_6f1.node.parentNode.childNodes);
return t.indexOf(_6f1.node);
});
var _6f4=_6f0.findAll(function(el){
return !_6f0.some(function(_6f6){
return _6f6.node==el.node.nextSibling;
});
});
_6f4.each(function(el){
var _6f8=el.node.nextSibling;
if(_6f8===null){
return;
}
var _6f9=el.parent.children.indexOf(el);
var p=el.parent;
p.children=p.children.insertFrom(_6f9,_6f9+1);
el.node.parentNode.insertBefore(_6f8,el.node);
});
},alignShapes:function(way){
var _6fc=this.facade.getSelection();
_6fc=this.facade.getCanvas().getShapesWithSharedParent(_6fc);
_6fc=_6fc.findAll(function(_6fd){
return (_6fd instanceof ORYX.Core.Node);
});
_6fc=_6fc.findAll(function(_6fe){
var d=_6fe.getIncomingShapes();
return d.length==0||!_6fc.include(d[0]);
});
if(_6fc.length<2){
return;
}
var _700=_6fc[0].absoluteBounds().clone();
_6fc.each(function(_701){
_700.include(_701.absoluteBounds().clone());
});
var _702=ORYX.Core.Command.extend({construct:function(_703,_704,way,_706){
this.elements=_703;
this.bounds=_704;
this.way=way;
this.facade=_706;
this.orgPos=[];
},execute:function(){
this.elements.each(function(_707,_708){
this.orgPos[_708]=_707.bounds.upperLeft();
var _709=this.bounds.clone();
if(_707.parent&&!(_707.parent instanceof ORYX.Core.Canvas)){
var upL=_707.parent.absoluteBounds().upperLeft();
_709.moveBy(-upL.x,-upL.y);
}
switch(this.way){
case ORYX.CONFIG.EDITOR_ALIGN_BOTTOM:
_707.bounds.moveTo({x:_707.bounds.upperLeft().x,y:_709.b.y-_707.bounds.height()});
break;
case ORYX.CONFIG.EDITOR_ALIGN_MIDDLE:
_707.bounds.moveTo({x:_707.bounds.upperLeft().x,y:(_709.a.y+_709.b.y-_707.bounds.height())/2});
break;
case ORYX.CONFIG.EDITOR_ALIGN_TOP:
_707.bounds.moveTo({x:_707.bounds.upperLeft().x,y:_709.a.y});
break;
case ORYX.CONFIG.EDITOR_ALIGN_LEFT:
_707.bounds.moveTo({x:_709.a.x,y:_707.bounds.upperLeft().y});
break;
case ORYX.CONFIG.EDITOR_ALIGN_CENTER:
_707.bounds.moveTo({x:(_709.a.x+_709.b.x-_707.bounds.width())/2,y:_707.bounds.upperLeft().y});
break;
case ORYX.CONFIG.EDITOR_ALIGN_RIGHT:
_707.bounds.moveTo({x:_709.b.x-_707.bounds.width(),y:_707.bounds.upperLeft().y});
break;
}
}.bind(this));
this.facade.getCanvas().update();
this.facade.updateSelection();
},rollback:function(){
this.elements.each(function(_70b,_70c){
_70b.bounds.moveTo(this.orgPos[_70c]);
}.bind(this));
this.facade.getCanvas().update();
this.facade.updateSelection();
}});
var _70d=new _702(_6fc,_700,parseInt(way),this.facade);
this.facade.executeCommands([_70d]);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.AutoLayout=Clazz.extend({facade:undefined,construct:function(_70e){
this.facade=_70e;
this.returned_layout=[];
this.facade.offer({"name":"AutoLayout","functionality":this.automatic_layout.bind(this),"group":"Alignment","icon":ORYX.PATH+"images/auto_layout.png","description":"automatic layouting","index":0,"minShape":0,"maxShape":0});
_70e.registerOnEvent(ORYX.CONFIG.EVENT_AUTOLAYOUT_LAYOUT,this.force_automatic_layout.bind(this));
},adjust_node:function(node){
var r_id=node.resourceId;
if(this.returned_layout[r_id]){
var n_b=this.returned_layout[r_id];
node.bounds.set({x:n_b.x,y:n_b.y},{x:(n_b.width+n_b.x),y:(n_b.height+n_b.y)});
}
a_b=node.bounds;
var _712=node.getChildNodes();
for(var i=0;i<_712.size();i++){
this.adjust_node(_712[i]);
}
},set_new_bounds:function(){
nodes=this.facade.getCanvas().getChildNodes();
for(var i=0;i<nodes.size();i++){
this.adjust_node(nodes[i]);
nodes[i]._changed();
}
this.facade.getCanvas().update();
},automatic_layout:function(){
Ext.Msg.confirm("Oryx","It is recommended to save the current model before running the automatic layouting, since it may produce unwanted results!\nStart layouting?",this._automatic_layout,this);
},force_automatic_layout:function(){
this._automatic_layout("yes");
},_automatic_layout:function(_715){
if(_715!="yes"){
return;
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:"Auto Layouting"});
var _716=DataManager.__persistDOM(this.facade);
_716="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.slice(0,location.href.lastIndexOf("/"))+"\" />"+"</head><body>"+_716+"</body></html>";
var _717=new DOMParser();
var _718=_717.parseFromString(_716,"text/xml");
var _719=ORYX.PATH+"lib/extract-rdf.xsl";
var _71a=new XSLTProcessor();
var _71b=document.implementation.createDocument("","",null);
_71b.async=false;
_71b.load(_719);
_71a.importStylesheet(_71b);
try{
var rdf=_71a.transformToDocument(_718);
var _71d=(new XMLSerializer()).serializeToString(rdf);
_71d="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_71d;
new Ajax.Request(ORYX.CONFIG.AUTO_LAYOUTER_URL,{method:"POST",parameters:{"rdf":_71d},onSuccess:function(_71e){
this.returned_layout=eval("("+_71e.responseText+")");
if(!this.returned_layout.error){
this.set_new_bounds();
}else{
Ext.Msg.alert("Oryx","An error occurred in the server:\n"+this.returned_layout.error);
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}.bind(this),onFailure:function(_71f){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx","Request to server failed!");
}.bind(this)});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx","Layouting failed.",error);
}
},});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPEL2BPMN=Clazz.extend({facade:undefined,construct:function(_720){
this.facade=_720;
this.facade.offer({"name":"Transform BPEL into BPMN","functionality":this.transform.bind(this),"group":"BPEL2BPMN","icon":ORYX.PATH+"images/epc_export.png","description":"Transform a BPEL process into its BPMN representation","index":1,"minShape":0,"maxShape":0});
},transform:function(){
this.openUploadDialog();
},openUploadDialog:function(){
var form=new Ext.form.FormPanel({frame:true,defaultType:"textfield",waitMsgTarget:true,labelAlign:"left",buttonAlign:"right",fileUpload:true,enctype:"multipart/form-data",items:[{fieldLabel:"File",inputType:"file",allowBlank:false}]});
var _722=form.addButton({text:"Submit",handler:function(){
form.form.submit({url:ORYX.PATH+"/bpel2bpmn",waitMsg:"Transforming...",success:function(f,a){
dialog.hide();
var _725="{"+a.result+"}";
var _726=_725.evalJSON();
var eRDF=_726.content;
var _728=_726.successValidation;
var _729=_726.validationError;
eRDF="<?xml version=\"1.0\" encoding=\"utf-8\"?><div>"+eRDF+"</div>";
var _72a=new DOMParser();
this.facade.importERDF(_72a.parseFromString(eRDF,"text/xml"));
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_AUTOLAYOUT_LAYOUT});
}.bind(this),failure:function(f,a){
_72d.hide();
Ext.MessageBox.show({title:"Error",msg:a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9,a.response.responseText.indexOf("'}")),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
}});
}.bind(this)});
var _72d=new Ext.Window({autoCreate:true,title:"Upload File",height:130,width:400,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,resizable:false,items:[new Ext.form.Label({text:"Select a BPEL (.bpel) file and transform it to BPMN.",style:"font-size:12px;"}),form]});
_72d.on("hide",function(){
_72d.destroy(true);
delete _72d;
});
_72d.show();
},});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPEL4ChorSupport=Clazz.extend({facade:undefined,dialogSupport:undefined,construct:function(_72e){
this.facade=_72e;
this.dialogSupport=new ORYX.Plugins.TransformationDownloadDialog();
this.facade.offer({"name":ORYX.I18N.BPEL4ChorSupport.exp,"functionality":this.exportProcess.bind(this),"group":ORYX.I18N.BPEL4ChorSupport.group,"icon":ORYX.PATH+"images/bpel4chor_export_icon.png","description":ORYX.I18N.BPEL4ChorSupport.expDesc,"index":0,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.BPEL4ChorSupport.imp,"functionality":this.importProcess.bind(this),"group":ORYX.I18N.BPEL4ChorSupport.group,"icon":ORYX.PATH+"images/bpel4chor_import_icon.png","description":ORYX.I18N.BPEL4ChorSupport.impDesc,"index":1,"minShape":0,"maxShape":0,"isEnabled":function(){
return false;
}});
this.facade.offer({"name":ORYX.I18N.BPEL4ChorSupport.gen,"functionality":this.generate.bind(this),"group":ORYX.I18N.BPEL4ChorSupport.group,"icon":ORYX.PATH+"images/bpel4chor_generator.png","description":ORYX.I18N.BPEL4ChorSupport.genDesc,"index":2,"minShape":0,"maxShape":0,"isEnabled":function(){
return false;
}});
},exportProcess:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _72f=location.href;
var _730=DataManager.__persistDOM(this.facade);
_730="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_730+"</body></html>";
var _731=new DOMParser();
var _732=_731.parseFromString(_730,"text/xml");
var _733=ORYX.PATH+"lib/extract-rdf.xsl";
var _734=new XSLTProcessor();
var _735=document.implementation.createDocument("","",null);
_735.async=false;
_735.load(_733);
_734.importStylesheet(_735);
try{
var rdf=_734.transformToDocument(_732);
var _737=(new XMLSerializer()).serializeToString(rdf);
if(!_737.startsWith("<?xml")){
_737="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_737;
}
new Ajax.Request(ORYX.CONFIG.BPEL4CHOR_EXPORT_URL,{method:"POST",asynchronous:false,parameters:{resource:_72f,data:_737},onSuccess:function(_738){
this.displayResult(_738.responseText);
}.bind(this)});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
},buildTransData:function(_739,_73a,_73b){
var data=[["topology",_739,this.dialogSupport.getResultInfo(_739)],["grounding",_73a,this.dialogSupport.getResultInfo(_73a)]];
for(var i=0;i<_73b.length;i++){
var name=this.dialogSupport.getProcessName(_73b[i]);
if(name==undefined){
name="Process "+(i+1);
}
data[i+2]=[name,_73b[i],this.dialogSupport.getResultInfo(_73b[i])];
}
return data;
},displayResult:function(_73f){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
var _740="("+_73f+")";
var _741;
try{
_741=eval(_740);
}
catch(e1){
alert("Error during evaluation of result: "+e1+"\r\n"+_740);
}
if((!_741.res)||(_741.res.length==0)){
this.dialogSupport.openMessageDialog(ORYX.I18N.TransformationDownloadDialog.error,ORYX.I18N.TransformationDownloadDialog.noResult);
}else{
if(_741.res[0].content.indexOf("Parser Error")>0){
this.dialogSupport.openErrorDialog(_741.res[0].content);
}else{
var _742=_741.res[0].content;
var _743=_741.res[1].content;
var _744=new Array();
for(var i=2;i<_741.res.length;i++){
_744[i-2]=_741.res[i].content;
}
var data=this.buildTransData(_742,_743,_744);
this.dialogSupport.openResultDialog(data);
}
}
},importProcess:function(){
this.openUploadDialog();
},openUploadDialog:function(){
},loadERDF:function(_747){
var _748=new DOMParser();
var doc=_748.parseFromString(_747,"text/xml");
alert(_747);
this.facade.importERDF(doc);
},generate:function(){
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPELLayouting=Clazz.extend({facade:undefined,isEnabled:undefined,construct:function(_74a){
this.facade=_74a;
this.isEnabled=true;
this.facade.offer({"name":ORYX.I18N.BPELSupport.enable,"functionality":this.enableBpelLayout.bind(this),"group":ORYX.I18N.BPELLayout.group,"icon":ORYX.PATH+"images/bpel_layout_enable.png","description":ORYX.I18N.BPELLayout.enDesc,"index":0,"minShape":0,"maxShape":0,"isEnabled":function(){
return !(this.isEnabled);
}.bind(this)});
this.facade.offer({"name":ORYX.I18N.BPELSupport.disable,"functionality":this.disableBpelLayout.bind(this),"group":ORYX.I18N.BPELLayout.group,"icon":ORYX.PATH+"images/bpel_layout_disable.png","description":ORYX.I18N.BPELLayout.disDesc,"index":1,"minShape":0,"maxShape":0,"isEnabled":function(){
return this.isEnabled;
}.bind(this)});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL,this.handleLayoutEvent.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_VERTICAL,this.handleLayoutVerticalEvent.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_HORIZONTAL,this.handleLayoutHorizontalEvent.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_SINGLECHILD,this.handleSingleChildLayoutEvent.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_BPEL_AUTORESIZE,this.handleAutoResizeLayoutEvent.bind(this));
},disableBpelLayout:function(){
this.isEnabled=false;
},enableBpelLayout:function(){
this.isEnabled=true;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:"Auto Layouting..."});
nodes=this.facade.getCanvas().getChildNodes();
for(var i=0;i<nodes.size();i++){
node=nodes[i];
if(node.getStencil().id()==node.getStencil().namespace()+"process"){
this._adjust_node(node);
}
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
},_adjust_node:function(node){
var _74d=node.getChildNodes();
for(var i=0;i<_74d.size();i++){
this._adjust_node(_74d[i]);
}
this._handleLayoutEventAdapter(node);
},_handleLayoutEventAdapter:function(node){
if(node.getStencil().id()==node.getStencil().namespace()+"process"||node.getStencil().id()==node.getStencil().namespace()+"invoke"||node.getStencil().id()==node.getStencil().namespace()+"scope"){
this._handleLayoutEvent(node);
}else{
if(node.getStencil().id()==node.getStencil().namespace()+"assign"||node.getStencil().id()==node.getStencil().namespace()+"eventHandlers"||node.getStencil().id()==node.getStencil().namespace()+"faultHandlers"||node.getStencil().id()==node.getStencil().namespace()+"compensationHandler"||node.getStencil().id()==node.getStencil().namespace()+"terminationHandler"){
this._handleLayoutVerticalEvent(node);
}else{
if(node.getStencil().id()==node.getStencil().namespace()+"if"||node.getStencil().id()==node.getStencil().namespace()+"sequence"||node.getStencil().id()==node.getStencil().namespace()+"pick"){
this._handleLayoutHorizontalEvent(node);
}else{
if(node.getStencil().id()==node.getStencil().namespace()+"onMessage"||node.getStencil().id()==node.getStencil().namespace()+"if_branch"||node.getStencil().id()==node.getStencil().namespace()+"else_branch"||node.getStencil().id()==node.getStencil().namespace()+"while"||node.getStencil().id()==node.getStencil().namespace()+"repeatUntil"||node.getStencil().id()==node.getStencil().namespace()+"forEach"||node.getStencil().id()==node.getStencil().namespace()+"onAlarm"||node.getStencil().id()==node.getStencil().namespace()+"onEvent"||node.getStencil().id()==node.getStencil().namespace()+"catch"||node.getStencil().id()==node.getStencil().namespace()+"catchAll"){
this._handleSingleChildLayoutEvent(node);
}else{
if(node.getStencil().id()==node.getStencil().namespace()+"flow"){
this._handleAutoResizeLayoutEvent(node);
}else{
return;
}
}
}
}
}
},handleLayoutEvent:function(_750){
this._handleLayoutEvent(_750.shape);
},handleLayoutVerticalEvent:function(_751){
this._handleLayoutVerticalEvent(_751.shape);
},handleLayoutHorizontalEvent:function(_752){
this._handleLayoutHorizontalEvent(_752.shape);
},handleSingleChildLayoutEvent:function(_753){
this._handleSingleChildLayoutEvent(_753.shape);
},handleAutoResizeLayoutEvent:function(_754){
this._handleAutoResizeLayoutEvent(_754.shape);
},_handleLayoutEvent:function(_755){
if(this.isEnabled==false){
return;
}
var _756=_755.getChildShapes(false);
if(!this._requiredAutoLayout(_755)){
return;
}
if(!_756||_756.length==0){
this._resetBounds(_755);
this._update(_755);
return;
}
var _757=_756.find(function(node){
return (node.getStencil().id()==node.getStencil().namespace()+"eventHandlers");
});
var _759=_756.find(function(node){
return (node.getStencil().id()==node.getStencil().namespace()+"faultHandlers");
});
var _75b=_756.find(function(node){
return (node.getStencil().id()==node.getStencil().namespace()+"compensationHandler");
});
var _75d=_756.find(function(node){
return (node.getStencil().id()==node.getStencil().namespace()+"terminationHandler");
});
var _75f=_756.findAll(function(node){
return (node!==_757&&node!==_759&&node!==_75b&&node!==_75d);
});
var _761=30;
var _762=30;
if(_75f){
_75f=_75f.sortBy(function(_763){
return _763.bounds.upperLeft().y;
});
if(this._moveSomeElementToLastPosition(_75f)){
_75f=_75f.sortBy(function(_764){
return _764.bounds.upperLeft().y;
});
}
var _765=0;
var _766;
var _767=0;
_75f.each(function(_768){
var ul=_768.bounds.upperLeft();
var _76a=ul.y;
ul.y=_765+30;
_765=ul.y+_768.bounds.height();
if(ul.y!=_76a){
_768.bounds.moveTo(30,ul.y);
}
_766=_768.bounds.width();
if(_766>_767){
_767=_766;
}
});
_761=30+_767+30;
}
var _76b;
var _76c=0;
if(_757){
_757.bounds.moveTo(_761,_762);
_762=_757.bounds.lowerRight().y+10;
_76b=this._getRightestBoundOfAllChildren(_757)+30;
if(_76b>_76c){
_76c=_76b;
}
}
if(_759){
_759.bounds.moveTo(_761,_762);
_762=_759.bounds.lowerRight().y+10;
_76b=this._getRightestBoundOfAllChildren(_759)+30;
if(_76b>_76c){
_76c=_76b;
}
}
if(_75b){
_75b.bounds.moveTo(_761,_762);
_762=_75b.bounds.lowerRight().y+10;
_76b=this._getRightestBoundOfAllChildren(_75b)+30;
if(_76b>_76c){
_76c=_76b;
}
}
if(_75d){
_75d.bounds.moveTo(_761,_762);
_76b=this._getRightestBoundOfAllChildren(_75d)+30;
if(_76b>_76c){
_76c=_76b;
}
}
if(_76b>0){
var ul;
var lr;
if(_757){
_76b=_757.bounds.width();
if(_76b!==_76c){
ul=_757.bounds.upperLeft();
lr=_757.bounds.lowerRight();
_757.bounds.set(ul.x,ul.y,ul.x+_76c,lr.y);
}
}
if(_759){
_76b=_759.bounds.width();
if(_76b!==_76c){
ul=_759.bounds.upperLeft();
lr=_759.bounds.lowerRight();
_759.bounds.set(ul.x,ul.y,ul.x+_76c,lr.y);
}
}
if(_75b){
_76b=_75b.bounds.width();
if(_76b!==_76c){
ul=_75b.bounds.upperLeft();
lr=_75b.bounds.lowerRight();
_75b.bounds.set(ul.x,ul.y,ul.x+_76c,lr.y);
}
}
if(_75d){
_76b=_75d.bounds.width();
if(_76b!==_76c){
ul=_75d.bounds.upperLeft();
lr=_75d.bounds.lowerRight();
_75d.bounds.set(ul.x,ul.y,ul.x+_76c,lr.y);
}
}
}
this._autoResizeLayout(_755);
this._update(_755);
return;
},_getRightestBoundOfAllChildren:function(_76f){
var _770=_76f.getChildShapes(false);
if(!_770||_770.length==0){
return 130;
}
_770=_770.sortBy(function(_771){
return _771.bounds.lowerRight().x;
});
return _770.last().bounds.lowerRight().x;
},_handleLayoutVerticalEvent:function(_772){
if(this.isEnabled==false){
return;
}
var _773=_772.getChildShapes(false);
if(!this._requiredAutoLayout(_772)){
return;
}
if(!_773||_773.length==0){
this._resetBounds(_772);
return;
}
_773=_773.sortBy(function(_774){
return _774.bounds.upperLeft().y;
});
if(this._moveSomeElementToLastPosition(_773)){
_773=_773.sortBy(function(_775){
return _775.bounds.upperLeft().y;
});
}
var _776=0;
_773.each(function(_777){
var ul=_777.bounds.upperLeft();
var _779=ul.y;
ul.y=_776+30;
_776=ul.y+_777.bounds.height();
if((ul.y!=_779)){
_777.bounds.moveTo(30,ul.y);
}
});
this._autoResizeLayout(_772);
return;
},_handleLayoutHorizontalEvent:function(_77a){
if(this.isEnabled==false){
return;
}
var _77b=_77a.getChildShapes(false);
if(!this._requiredAutoLayout(_77a)){
return;
}
if(!_77b||_77b.length==0){
this._resetBounds(_77a);
return;
}
_77b=_77b.sortBy(function(_77c){
return _77c.bounds.upperLeft().x;
});
if(this._moveSomeElementToLastPosition(_77b)){
_77b=_77b.sortBy(function(_77d){
return _77d.bounds.upperLeft().x;
});
}
var _77e=0;
_77b.each(function(_77f){
var ul=_77f.bounds.upperLeft();
var _781=ul.x;
ul.x=_77e+30;
_77e=ul.x+_77f.bounds.width();
if((ul.x!=_781)){
_77f.bounds.moveTo(ul.x,30);
}
});
this._autoResizeLayout(_77a);
return;
},_handleSingleChildLayoutEvent:function(_782){
if(this.isEnabled==false){
return;
}
var _783=_782.getChildShapes(false);
if(!this._requiredAutoLayout(_782)){
return;
}
if(!_783||_783.length==0){
this._resetBounds(_782);
return;
}
_783.first().bounds.moveTo(30,30);
this._autoResizeLayout(_782);
return;
},_handleAutoResizeLayoutEvent:function(_784){
if(this.isEnabled==false){
return;
}
var _785=_784.getChildShapes(false);
if(!this._requiredAutoLayout(_784)){
return;
}
_785.each(function(_786){
var ul=_786.bounds.upperLeft();
if((ul.x<30)){
_786.bounds.moveTo(30,ul.y);
ul=_786.bounds.upperLeft();
}
if((ul.y<30)){
_786.bounds.moveTo(ul.x,30);
}
});
this._autoResizeLayout(_784);
},_autoResizeLayout:function(_788){
var _789=_788.getChildShapes(false);
if(_789.length>0){
_789=_789.sortBy(function(_78a){
return _78a.bounds.lowerRight().x;
});
var _78b=_789.last().bounds.lowerRight().x;
_789=_789.sortBy(function(_78c){
return _78c.bounds.lowerRight().y;
});
var _78d=_789.last().bounds.lowerRight().y;
var ul=_788.bounds.upperLeft();
var lr=_788.bounds.lowerRight();
if(_788.getStencil().id()==_788.getStencil().namespace()+"flow"){
if(lr.x<ul.x+_78b+30){
_788.bounds.set(ul.x,ul.y,ul.x+_78b+30,lr.y);
lr.x=ul.x+_78b+30;
}
if(lr.y<ul.y+_78d+30){
_788.bounds.set(ul.x,ul.y,lr.x,ul.y+_78d+30);
}
}else{
if(lr.x!=ul.x+_78b+30||lr.y!=ul.y+_78d+30){
_788.bounds.set(ul.x,ul.y,ul.x+_78b+30,ul.y+_78d+30);
}
}
}
return;
},_resetBounds:function(_790){
var ul=_790.bounds.upperLeft();
var lr=_790.bounds.lowerRight();
if(_790.getStencil().id()==_790.getStencil().namespace()+"process"){
if(_790.getStencil().namespace()=="http://b3mn.org/stencilset/bpel#"){
if(lr.x!=ul.x+600||lr.y!=ul.y+500){
_790.bounds.set(ul.x,ul.y,ul.x+600,ul.y+500);
}
}else{
if(_790.getStencil().namespace()=="http://b3mn.org/stencilset/bpel4chor#"){
if(lr.x!=ul.x+690||lr.y!=ul.y+200){
_790.bounds.set(ul.x,ul.y,ul.x+690,ul.y+200);
}
}else{
return;
}
}
}else{
if(_790.getStencil().id()==_790.getStencil().namespace()+"flow"){
if(lr.x!=ul.x+290||lr.y!=ul.y+250){
_790.bounds.set(ul.x,ul.y,ul.x+290,ul.y+250);
}
}else{
if(this._isHandlers(_790)){
if(lr.x!=ul.x+160||lr.y!=ul.y+80){
_790.bounds.set(ul.x,ul.y,ul.x+160,ul.y+80);
}
}else{
if(lr.x!=ul.x+100||lr.y!=ul.y+80){
_790.bounds.set(ul.x,ul.y,ul.x+100,ul.y+80);
}
}
}
}
},_isHandlers:function(_793){
if(_793.getStencil().id()==_793.getStencil().namespace()+"eventHandlers"){
return true;
}
if(_793.getStencil().id()==_793.getStencil().namespace()+"faultHandlers"){
return true;
}
if(_793.getStencil().id()==_793.getStencil().namespace()+"compensationHandler"){
return true;
}
if(_793.getStencil().id()==_793.getStencil().namespace()+"terminationHandler"){
return true;
}
return false;
},_requiredAutoLayout:function(_794){
var key="oryx-autolayout";
var _796=_794.properties[key];
if(_796==null){
return true;
}
if(_796){
return true;
}
return false;
},_moveSomeElementToLastPosition:function(_797){
var _798=_797.find(function(node){
return (Array.indexOf(node.getStencil().roles(),node.getStencil().namespace()+"lastChild")>=0);
});
if(!_798||_798==_797.last()){
return false;
}
ulOfCurrentLastChild=_797.last().bounds.upperLeft();
_798.bounds.moveTo(ulOfCurrentLastChild.x+1,ulOfCurrentLastChild.y+1);
return true;
},_update:function(_79a){
if(_79a.getStencil().id()==_79a.getStencil().namespace()+"process"&&_79a.isChanged){
this.facade.getCanvas().update();
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPELSupport=Clazz.extend({facade:undefined,dialogSupport:undefined,construct:function(_79b){
this.facade=_79b;
this.dialogSupport=new ORYX.Plugins.TransformationDownloadDialog();
this.facade.offer({"name":ORYX.I18N.BPELSupport.exp,"functionality":this.exportProcess.bind(this),"group":ORYX.I18N.BPELSupport.group,"icon":ORYX.PATH+"images/bpel_export_icon.png","description":ORYX.I18N.BPELSupport.expDesc,"index":0,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.BPELSupport.imp,"functionality":this.importProcess.bind(this),"group":ORYX.I18N.BPELSupport.group,"icon":ORYX.PATH+"images/bpel_import_icon.png","description":ORYX.I18N.BPELSupport.impDesc,"index":1,"minShape":0,"maxShape":0});
},exportProcess:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _79c=location.href;
var _79d=DataManager.__persistDOM(this.facade);
_79d="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_79d+"</body></html>";
var _79e=new DOMParser();
var _79f=_79e.parseFromString(_79d,"text/xml");
var _7a0=ORYX.PATH+"lib/extract-rdf.xsl";
var _7a1=new XSLTProcessor();
var _7a2=document.implementation.createDocument("","",null);
_7a2.async=false;
_7a2.load(_7a0);
_7a1.importStylesheet(_7a2);
try{
var rdf=_7a1.transformToDocument(_79f);
var _7a4=(new XMLSerializer()).serializeToString(rdf);
if(!_7a4.startsWith("<?xml")){
_7a4="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_7a4;
}
new Ajax.Request(ORYX.CONFIG.BPEL_EXPORT_URL,{method:"POST",asynchronous:false,parameters:{resource:_79c,data:_7a4},onSuccess:function(_7a5){
this.displayResult(_7a5.responseText);
}.bind(this)});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
},displayResult:function(_7a6){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
var _7a7="("+_7a6+")";
var _7a8;
try{
_7a8=eval(_7a7);
}
catch(e1){
alert("Error during evaluation of result: "+e1+"\r\n"+_7a7);
}
if((!_7a8.res)||(_7a8.res.length==0)){
this.dialogSupport.openMessageDialog(ORYX.I18N.TransformationDownloadDialog.error,ORYX.I18N.TransformationDownloadDialog.noResult);
}else{
if(_7a8.res[0].success=="false"){
this.dialogSupport.openErrorDialog(_7a8.res[0].content);
}else{
var _7a9=new Array();
for(var i=0;i<_7a8.res.length;i++){
_7a9[i]=_7a8.res[i].content;
}
var data=this.buildTransData(_7a9);
this.dialogSupport.openResultDialog(data);
}
}
},buildTransData:function(_7ac){
var data=[];
for(var i=0;i<_7ac.length;i++){
var name=this.dialogSupport.getProcessName(_7ac[i]);
if(name==undefined){
name="Process "+(i+1);
}
data[i]=[name,_7ac[i],this.dialogSupport.getResultInfo(_7ac[i])];
}
return data;
},importProcess:function(){
this.openUploadDialog();
},openUploadDialog:function(){
var form=new Ext.form.FormPanel({frame:true,bodyStyle:"padding:5px;",defaultType:"textfield",labelAlign:"left",buttonAlign:"right",fileUpload:true,enctype:"multipart/form-data",items:[{text:ORYX.I18N.BPELSupport.selectFile,style:"font-size:12px;margin-bottom:10px;display:block;",xtype:"label"},{fieldLabel:ORYX.I18N.BPELSupport.file,inputType:"file",labelStyle:"width:50px;",itemCls:"ext_specific_window_overflow"}]});
var _7b1=new Ext.form.FormPanel({frame:true,bodyStyle:"padding:5px;",defaultType:"textfield",labelAlign:"left",buttonAlign:"right",fileUpload:true,enctype:"multipart/form-data",items:[{text:ORYX.I18N.BPELSupport.content,style:"font-size:12px;margin-bottom:10px;display:block;",xtype:"label"},{xtype:"textarea",width:"160",height:"350",hideLabel:true,anchor:"100% -63"}]});
var _7b2=new Ext.Window({autoCreate:true,title:ORYX.I18N.BPELSupport.impPanel,height:"auto",width:"auto",modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,resizable:false,items:[form,_7b1],buttons:[{text:ORYX.I18N.BPELSupport.impBtn,handler:function(){
var _7b3=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.BPELSupport.progressImp});
_7b3.show();
form.form.submit({url:ORYX.PATH+"/bpelimporter",success:function(f,a){
_7b2.hide();
var erdf=a.result;
erdf=erdf.startsWith("<?xml")?erdf:"<?xml version=\"1.0\" encoding=\"utf-8\"?><div>"+erdf+"</div>";
this.loadERDF(erdf);
_7b3.hide();
}.bind(this),failure:function(f,a){
_7b2.hide();
_7b3.hide();
Ext.MessageBox.show({title:ORYX.I18N.BPELSupport.error,msg:ORYX.I18N.BPELSupport.impFailed+a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9,a.response.responseText.indexOf("'}")),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
}});
}.bind(this)},{text:ORYX.I18N.BPELSupport.close,handler:function(){
_7b2.hide();
}.bind(this)}]});
_7b2.on("hide",function(){
_7b2.destroy(true);
delete _7b2;
});
_7b2.show();
form.items.items[1].getEl().dom.addEventListener("change",function(evt){
var text=evt.target.files[0].getAsBinary();
_7b1.items.items[1].setValue(text);
},true);
},loadERDF:function(_7bb){
var _7bc=new DOMParser();
var doc=_7bc.parseFromString(_7bb,"text/xml");
this.facade.importERDF(doc);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPMN11DiamondSwitch=Clazz.extend({construct:function(_7be){
this.facade=_7be;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED,this.handleDockerDocked.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,this.handlePropertyChanged.bind(this));
},handleDockerDocked:function(_7bf){
var edge=_7bf.parent;
var _7c1=_7bf.target;
if(edge.getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#SequenceFlow"){
var _7c2=_7c1.getStencil().groups().find(function(_7c3){
if(_7c3=="Gateways"){
return _7c3;
}
});
if(!_7c2&&(edge.properties["oryx-conditiontype"]=="Expression")){
edge.setProperty("oryx-showdiamondmarker",true);
}else{
edge.setProperty("oryx-showdiamondmarker",false);
}
this.facade.getCanvas().update();
}
},handlePropertyChanged:function(_7c4){
var _7c5=_7c4.element;
var _7c6=_7c4.name;
var _7c7=_7c4.value;
if((_7c5.getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#SequenceFlow")&&(_7c6==="oryx-conditiontype")){
if(_7c7!="Expression"){
_7c5.setProperty("oryx-showdiamondmarker",false);
}else{
var _7c8=_7c5.getIncomingShapes();
if(!_7c8){
_7c5.setProperty("oryx-showdiamondmarker",true);
}
var _7c9=_7c8.find(function(_7ca){
var _7cb=_7ca.getStencil().groups().find(function(_7cc){
if(_7cc=="Gateways"){
return _7cc;
}
});
if(_7cb){
return _7cb;
}
});
if(!_7c9){
_7c5.setProperty("oryx-showdiamondmarker",true);
}else{
_7c5.setProperty("oryx-showdiamondmarker",false);
}
}
this.facade.getCanvas().update();
}
}});
Ext.ns("Oryx.Plugins");
ORYX.Plugins.BPMNImport=Clazz.extend({converterUrl:"/oryx/bpmn2pn",construct:function(_7cd){
this.facade=_7cd;
this.importBpmn();
},getParamFromUrl:function(name){
name=name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
var _7cf="[\\?&]"+name+"=([^&#]*)";
var _7d0=new RegExp(_7cf);
var _7d1=_7d0.exec(window.location.href);
if(_7d1==null){
return null;
}else{
return _7d1[1];
}
},bpmnToPn:function(_7d2){
Ext.Msg.updateProgress(0.66,ORYX.I18N.BPMN2PNConverter.progress.convertingModel);
Ext.Ajax.request({url:this.converterUrl,method:"POST",success:function(_7d3){
var _7d4=new DOMParser();
Ext.Msg.updateProgress(1,ORYX.I18N.BPMN2PNConverter.progress.renderingModel);
var doc=_7d4.parseFromString(_7d3.responseText,"text/xml");
this.facade.importERDF(doc);
Ext.Msg.hide();
}.createDelegate(this),failure:function(){
Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error,ORYX.I18N.BPMN2PNConverter.errors.server);
},params:{rdf:_7d2}});
},importBpmn:function(){
var _7d6=this.getParamFromUrl("importBPMN");
if(!_7d6){
return;
}
Ext.Msg.progress(ORYX.I18N.BPMN2PNConverter.progress.status,ORYX.I18N.BPMN2PNConverter.progress.importingModel);
Ext.Msg.updateProgress(0.33,ORYX.I18N.BPMN2PNConverter.progress.fetchingModel);
Ext.Ajax.request({url:this.getRdfUrl(_7d6),success:function(_7d7){
var _7d8=_7d7.responseText;
this.bpmnToPn(_7d8);
}.createDelegate(this),failure:function(_7d9){
Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error,ORYX.I18N.BPMN2PNConverter.errors.noRights);
},method:"GET"});
},getRdfUrl:function(url){
return url.replace(/\/self(\/)?$/,"/rdf");
}});
ORYX.Plugins.PNExport=Clazz.extend({construct:function(_7db){
this.facade=_7db;
this.facade.offer({"name":ORYX.I18N.BPMN2PNConverter.name,"functionality":this.exportIt.bind(this),"group":ORYX.I18N.BPMN2PNConverter.group,dropDownGroupIcon:ORYX.PATH+"images/export2.png","description":ORYX.I18N.BPMN2PNConverter.desc,"index":3,"minShape":0,"maxShape":0});
},exportIt:function(){
if(location.href.include(ORYX.CONFIG.ORYX_NEW_URL)){
Ext.Msg.alert(ORYX.I18N.BPMN2PNConverter.error,ORYX.I18N.BPMN2PNConverter.errors.notSaved);
return;
}
ORYX.Plugins.SyntaxChecker.instance.resetErrors();
ORYX.Plugins.SyntaxChecker.instance.checkForErrors({context:"bpmn2pn",onNoErrors:function(){
this.openPetriNetEditor();
}.bind(this)});
},openPetriNetEditor:function(){
window.open("/backend/poem/new?stencilset=/stencilsets/petrinets/petrinet.json&importBPMN="+location.href);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.BPMN2XPDL=ORYX.Plugins.AbstractPlugin.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
this.facade.offer({"name":ORYX.I18N.BPMN2XPDL.xpdlExport,"functionality":this.transform.bind(this),"group":ORYX.I18N.BPMN2XPDL.group,dropDownGroupIcon:ORYX.PATH+"images/export2.png","description":ORYX.I18N.BPMN2XPDL.xpdlExport,"index":1,"minShape":0,"maxShape":0});
},transform:function(){
var xslt=ORYX.PATH+"xslt/BPMN2XPDL.xslt";
var _7dd=this.doTransform(this.facade.getERDF(),xslt);
this.openDownloadWindow(window.document.title+".xml",_7dd);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Bpel4ChorTransformation=Clazz.extend({facade:undefined,dialogSupport:undefined,construct:function(_7de){
this.facade=_7de;
this.dialogSupport=new ORYX.Plugins.TransformationDownloadDialog();
this.raisedEventIds=[];
this.facade.offer({"name":ORYX.I18N.Bpel4ChorTransformation.exportBPEL,"functionality":this.transformBPEL4Chor.bind(this),"group":ORYX.I18N.Bpel4ChorTransformation.group,"icon":ORYX.PATH+"images/export_multi.png","description":ORYX.I18N.Bpel4ChorTransformation.exportBPELDesc,"index":1,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.Bpel4ChorTransformation.exportXPDL,"functionality":this.transformXPDL4Chor.bind(this),"group":ORYX.I18N.Bpel4ChorTransformation.group,"icon":ORYX.PATH+"images/export.png","description":ORYX.I18N.Bpel4ChorTransformation.exportXPDLDesc,"index":2,"minShape":0,"maxShape":0});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,this.propertyChanged.bind(this));
},propertyChanged:function(args){
var _7e0=args.element;
var _7e1=_7e0.getStencil();
if(args.name=="oryx-name"){
if((_7e1.id()==_7e1.namespace()+"ReceiveTask")||(_7e1.id()==_7e1.namespace()+"IntermediateMessageEvent")||(_7e1.id()==_7e1.namespace()+"StartMessageEvent")){
var _7e2=new Hash();
_7e0.getIncomingShapes().each(function(edge){
if(edge.getStencil().id()==edge.getStencil().namespace()+"MessageFlow"){
var _7e4=edge.getIncomingShapes();
_7e4.each(function(_7e5){
_7e5.getOutgoingShapes().each(function(_7e6){
if(_7e6.getStencil().id()==_7e6.getStencil().namespace()+"MessageFlow"){
var list=_7e2[_7e5.resourceId];
if(list==undefined){
list=new Array();
}
list=list.concat(_7e6.getOutgoingShapes());
_7e2[_7e5.resourceId]=list;
}
});
});
}
});
var name=null;
var _7e9=_7e2.values();
for(var i=0;i<_7e9.length;i++){
var list=_7e9[i];
for(var j=0;j<list.length;j++){
var _7e0=list[j];
if(name==undefined){
name=list[j].properties["oryx-name"];
}else{
if(name!=list[j].properties["oryx-name"]){
this.dialogSupport.openMessageDialog(ORYX.I18N.Bpel4ChorTransformation.warning,ORYX.I18N.Bpel4ChorTransformation.wrongValue.replace(/1/,name));
return;
}
}
}
}
}
}else{
if(args.name=="oryx-looptype"){
if(_7e1.id()==_7e1.namespace()+"ReceiveTask"){
_7e0.getIncomingShapes().each(function(edge){
if(edge.getStencil().id()==edge.getStencil().namespace()+"SequenceFlow"){
var _7ee=edge.getIncomingShapes();
_7ee.each(function(_7ef){
if(_7ef.getStencil().id()==_7e1.namespace()+"Exclusive_Eventbased_Gateway"){
if(_7e0.properties["oryx-looptype"]!="None"){
this.dialogSupport.openMessageDialog(ORYX.I18N.Bpel4ChorTransformation.warning,ORYX.I18N.Bpel4ChorTransformation.loopNone);
return;
}
}
});
}
});
}
}
}
},validate:function(){
var _7f0=this.facade.getCanvas().getChildEdges();
for(var i=0;i<_7f0.size();i++){
var edge=_7f0[i];
var name=edge.getStencil().title();
var id=edge.id;
if(edge.getIncomingShapes().size()==0){
this.dialogSupport.openMessageDialog(ORYX.I18N.Bpel4ChorTransformation.error,ORYX.I18N.Bpel4ChorTransformation.noSource.replace(/1/,name).replace(/2/,id));
return false;
}else{
if(edge.getOutgoingShapes().size()==0){
this.dialogSupport.openMessageDialog(ORYX.I18N.Bpel4ChorTransformation.error,ORYX.I18N.Bpel4ChorTransformation.noTarget.replace(/1/,name).replace(/2/,id));
return false;
}
}
}
return true;
},addCanvasProperties:function(_7f5){
var _7f6=this.facade.getCanvas();
var _7f7=_7f5.createAttribute("chor:TargetNamespace");
_7f7.value=_7f6.properties["oryx-targetNamespace"];
_7f5.documentElement.setAttributeNode(_7f7);
var name=_7f5.createAttribute("Name");
name.value=_7f6.properties["oryx-name"];
_7f5.documentElement.setAttributeNode(name);
var _7f9=_7f5.createAttribute("Id");
var id=_7f6.properties["oryx-id"];
if(id==""){
id=DataManager.__provideId();
}
_7f9.value=id;
_7f5.documentElement.setAttributeNode(_7f9);
var _7fb=_7f5.createElement("xpdl:Created");
var _7fc=document.createTextNode(_7f6.properties["oryx-creationdate"]);
_7fb.appendChild(_7fc);
var _7fd=_7f5.documentElement.firstChild;
_7fd.appendChild(_7fb);
var _7fe=_7f6.properties["oryx-expressionlanguage"];
var _7ff=_7f6.properties["oryx-querylanguage"];
var _800=_7f5.createElement("xpdl:RedefinableHeader");
if(_7ff!=""){
var _801=_7f5.createAttribute("chor:QueryLanguage");
_801.value=_7ff;
_800.setAttributeNode(_801);
}
if(_7fe!=""){
var _802=_7f5.createAttribute("chor:ExpressionLanguage");
_802.value=_7fe;
_800.setAttributeNode(_802);
}
_7f5.documentElement.insertBefore(_800,_7f5.documentElement.firstChild.nextSibling);
},buildXPDL4ChorData:function(_803){
var data=[["XPDL4Chor",_803,this.dialogSupport.getResultInfo(_803)]];
return data;
},buildDisplayData:function(_805){
var res={"data":[[]],"errors":[]};
var _807=0;
for(var i=0;i<_805.length;i++){
var file;
if(_805[i].type=="PROCESS"){
file=_805[i].name;
}else{
file=_805[i].type;
}
var _80a;
var _80b;
if(_805[i].success){
_80a="success";
_80b=_805[i].document;
}else{
_80a="error";
_80b="";
for(var j=0;j<_805[i].errors.length;j++){
var _80d=_805[i].errors[j];
_80b=_80b+_80d.message;
if(_80d.id){
_80b=_80b+" ("+_80d.id+")";
}
_80b=_80b+"\n";
res.errors[_807]=({"shapeId":_80d.id,"message":_80d.message});
_807++;
}
}
res.data[i]=[file,_80b,_80a];
}
return res;
},displayResult:function(_80e){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
var _80f="("+_80e+")";
var _810;
try{
_810=eval(_80f);
}
catch(e1){
alert("Error during evaluation of result: "+e1+"\r\n"+_80f);
}
var _811=_810.version;
if(_811!="1.0"){
alert("Wrong version "+_811+". Converting nevertheless.");
}
if((!_810.res)||(_810.res.length==0)){
this.dialogSupport.openMessageDialog(ORYX.I18N.TransformationDownloadDialog.error,ORYX.I18N.TransformationDownloadDialog.noResult);
}else{
var _812=this.buildDisplayData(_810.res);
this.dialogSupport.openResultDialog(_812.data);
_812.errors.each(function(_813){
sh=this.facade.getCanvas().getChildShapeByResourceId(_813.id);
if(sh){
this.showOverlay(sh,_813.message);
}
}.bind(this));
}
},transform:function(_814){
this.hideOverlays();
var _815=this.validate();
if(!_815){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Transformation","input not valid");
}
var _816=new XSLTProcessor();
var _817=document.implementation.createDocument("","",null);
var _818=location.href.lastIndexOf("/");
var xslt=location.href.substring(0,_818)+"/xslt/BPMNplus2XPDL4Chor.xslt";
_817.onload=function(){
_816.importStylesheet(_817);
var ERDF=this.facade.getERDF();
var _81b=new DOMParser();
var doc=_81b.parseFromString(ERDF,"text/xml");
try{
var _81d=_816.transformToDocument(doc);
}
catch(error){
this.dialogSupport.openMessageDialog(ORYX.I18N.Bpel4ChorTransformation.error,ORYX.I18N.Bpel4ChorTransformation.noGen.replace(/1/,error.name).replace(/2/,error.message));
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
return null;
}
this.addCanvasProperties(_81d);
var _81e=(new XMLSerializer()).serializeToString(_81d);
_81e=_81e.startsWith("<?xml")?_81e:"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_81e;
if(_814){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
var data=this.buildXPDL4ChorData(_81e);
this.dialogSupport.openResultDialog(data);
}else{
var _820="http://"+location.host+ORYX.CONFIG.XPDL4CHOR2BPEL4CHOR_TRANSFORMATION_URL;
try{
Ext.Ajax.request({method:"POST",url:_820,params:{data:_81e},success:function(_821,_822){
this.displayResult(_821.responseText);
}.bind(this)});
}
catch(e){
alert("Error during call of transformation: "+e);
}
}
}.bind(this);
_817.load(xslt);
},transformXPDL4Chor:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.Bpel4ChorTransformation.loadingXPDL4ChorExport});
this.transform(true);
},transformBPEL4Chor:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.Bpel4ChorTransformation.loadingBPEL4ChorExport});
this.transform(false);
},showOverlay:function(_823,_824){
var id="syntaxchecker."+this.raisedEventIds.length;
var _826=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":_824,"stroke-width":5,"stroke":"red","d":"M20,-5 L5,-20 M5,-5 L20,-20","line-captions":"round"}]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:id,shapes:[_823],node:_826,nodePosition:_823 instanceof ORYX.Core.Edge?"START":"NW"});
this.raisedEventIds.push(id);
return _826;
},hideOverlays:function(){
this.raisedEventIds.each(function(id){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:id});
}.bind(this));
this.raisedEventIds=[];
},});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.CanvasResize=Clazz.extend({construct:function(_828){
this.facade=_828;
var _829=this.facade.getCanvas().getHTMLContainer().parentNode.parentNode.parentNode;
new ORYX.Plugins.CanvasResizeButton(_829,"N",this.resize.bind(this));
new ORYX.Plugins.CanvasResizeButton(_829,"W",this.resize.bind(this));
new ORYX.Plugins.CanvasResizeButton(_829,"E",this.resize.bind(this));
new ORYX.Plugins.CanvasResizeButton(_829,"S",this.resize.bind(this));
},resize:function(_82a){
var _82b=this.facade.getCanvas();
var b=_82b.bounds;
var _82d=this.facade.getCanvas().getHTMLContainer().parentNode.parentNode;
var _82e=ORYX.CONFIG.CANVAS_RESIZE_INTERVAL;
if(_82a=="E"||_82a=="W"){
_82b.setSize({width:b.width()+_82e,height:b.height()});
}else{
if(_82a=="S"||_82a=="N"){
_82b.setSize({width:b.width(),height:b.height()+_82e});
}
}
if(_82a=="N"||_82a=="W"){
var move=_82a=="N"?{x:0,y:_82e}:{x:_82e,y:0};
_82b.getChildShapes(false,function(_830){
_830.bounds.moveBy(move);
});
var _831=_82b.getChildEdges().findAll(function(edge){
return edge.getAllDockedShapes().length>0;
});
var _833=_831.collect(function(edge){
return edge.dockers.findAll(function(_835){
return !_835.getDockedShape();
});
}).flatten();
_833.each(function(_836){
_836.bounds.moveBy(move);
});
}else{
if(_82a=="S"){
_82d.scrollTop+=_82e;
}else{
if(_82a=="E"){
_82d.scrollLeft+=_82e;
}
}
}
_82b.update();
this.facade.updateSelection();
}});
ORYX.Plugins.CanvasResizeButton=Clazz.extend({construct:function(_837,_838,_839){
var _83a=_837.firstChild;
var _83b=_83a.firstChild.firstChild;
var _83c=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",_837,["div",{"class":"canvas_resize_indicator"+" "+_838}]);
_83c.addEventListener("click",function(){
_839(_838);
},true);
var _83d=30;
var _83e=function(_83f){
if(_838=="N"){
return _83f.layerX>10&&_83f.layerX<_83a.scrollWidth&&_83f.layerY<_83d;
}else{
if(_838=="W"){
return _83f.layerX<_83d&&_83f.layerY>10&&_83f.layerY<_83a.scrollHeight-10;
}else{
if(_838=="E"){
return _83f.layerX>_83a.scrollWidth-_83d&&_83f.layerY>10&&_83f.layerY<_83a.scrollHeight-10;
}else{
if(_838=="S"){
return _83f.layerX>10&&_83f.layerX<_83a.scrollWidth-10&&_83f.layerY>_83a.scrollHeight-_83d;
}
}
}
}
return false;
};
_83b.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,function(_840){
if(_83e(_840)){
_83c.show();
}else{
_83c.hide();
}
},false);
_83c.addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER,function(_841){
_83c.show();
},true);
_837.addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT,function(_842){
_83c.hide();
},true);
_83c.hide();
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.DesynchronizabilityOverlay=Clazz.extend({facade:undefined,construct:function(_843){
this.facade=_843;
this.active=false;
this.el=undefined;
this.callback=undefined;
this.facade.offer({"name":ORYX.I18N.DesynchronizabilityOverlay.name,"functionality":this.showOverlay.bind(this),"group":ORYX.I18N.DesynchronizabilityOverlay.group,"icon":ORYX.PATH+"images/bpmn2pn.png","description":ORYX.I18N.DesynchronizabilityOverlay.desc,"index":3,"minShape":0,"maxShape":0});
},showOverlay:function(){
if(this.active){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"desynchronizability"});
this.active=!this.active;
}else{
var _844=DataManager.serializeDOM(this.facade);
_844="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_844+"</body></html>";
var _845=new DOMParser();
var _846=_845.parseFromString(_844,"text/xml");
var _847=ORYX.PATH+"lib/extract-rdf.xsl";
var _848=new XSLTProcessor();
var _849=document.implementation.createDocument("","",null);
_849.async=false;
_849.load(_847);
_848.importStylesheet(_849);
try{
var rdf=_848.transformToDocument(_846);
var _84b=(new XMLSerializer()).serializeToString(rdf);
new Ajax.Request(ORYX.CONFIG.DESYNCHRONIZABILITY_URL,{method:"POST",asynchronous:false,parameters:{resource:location.href,data:_84b},onSuccess:function(_84c){
var resp=_84c.responseText.evalJSON();
if(resp.conflicttransitions){
if(resp.conflicttransitions.length>0){
var _84e=resp.conflicttransitions.collect(function(res){
return this.facade.getCanvas().getChildShapeByResourceId(res);
}.bind(this)).compact();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"desynchronizability",shapes:_84e,attributes:{fill:"red",stroke:"black"}});
this.active=!this.active;
}else{
Ext.Msg.alert("Oryx",ORYX.I18N.DesynchronizabilityOverlay.sync);
}
}else{
if(resp.syntaxerrors){
Ext.Msg.alert("Oryx",ORYX.I18N.DesynchronizabilityOverlay.error.replace(/1/,resp.syntaxerrors.length));
}else{
Ext.Msg.alert("Oryx",ORYX.I18N.DesynchronizabilityOverlay.invalid);
}
}
}.bind(this)});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.DragDocker=Clazz.extend({construct:function(_850){
this.facade=_850;
this.VALIDCOLOR=ORYX.CONFIG.SELECTION_VALID_COLOR;
this.INVALIDCOLOR=ORYX.CONFIG.SELECTION_INVALID_COLOR;
this.docker=undefined;
this.dockerParent=undefined;
this.dockerSource=undefined;
this.dockerTarget=undefined;
this.lastUIObj=undefined;
this.isStartDocker=undefined;
this.isEndDocker=undefined;
this.isValid=false;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOVER,this.handleMouseOver.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEOUT,this.handleMouseOut.bind(this));
},handleMouseOut:function(_851,_852){
if(!this.docker&&_852 instanceof ORYX.Core.Controls.Docker){
_852.hide();
}else{
if(!this.docker&&_852 instanceof ORYX.Core.Edge){
_852.dockers.each(function(_853){
_853.hide();
});
}
}
},handleMouseOver:function(_854,_855){
if(!this.docker&&_855 instanceof ORYX.Core.Controls.Docker){
_855.show();
}else{
if(!this.docker&&_855 instanceof ORYX.Core.Edge){
_855.dockers.each(function(_856){
_856.show();
});
}
}
},handleMouseDown:function(_857,_858){
if(_858 instanceof ORYX.Core.Controls.Docker&&_858.isMovable){
this.docker=_858;
this.dockerParent=_858.parent;
this._commandArg={docker:_858,dockedShape:_858.getDockedShape(),refPoint:_858.referencePoint||_858.bounds.center()};
this.docker.show();
if(_858.parent instanceof ORYX.Core.Edge&&(_858.parent.dockers.first()==_858||_858.parent.dockers.last()==_858)){
if(_858.parent.dockers.first()==_858&&_858.parent.dockers.last().getDockedShape()){
this.dockerTarget=_858.parent.dockers.last().getDockedShape();
}else{
if(_858.parent.dockers.last()==_858&&_858.parent.dockers.first().getDockedShape()){
this.dockerSource=_858.parent.dockers.first().getDockedShape();
}
}
}else{
this.dockerSource=undefined;
this.dockerTarget=undefined;
}
this.isStartDocker=this.docker.parent.dockers.first()===this.docker;
this.isEndDocker=this.docker.parent.dockers.last()===this.docker;
this.docker.setDockedShape(undefined);
this.facade.getCanvas().add(this.docker.parent);
this.docker.parent.getLabels().each(function(_859){
_859.hide();
});
var _85a=this.facade.eventCoordinates(_857);
this.docker.bounds.centerMoveTo(_85a);
this.dockerParent._update();
var _85b={movedCallback:this.dockerMoved.bind(this),upCallback:this.dockerMovedFinished.bind(this)};
ORYX.Core.UIEnableDrag(_857,_858,_85b);
}
},dockerMoved:function(_85c){
var _85d=undefined;
if(this.docker.parent){
if(this.isStartDocker||this.isEndDocker){
var _85e=this.facade.eventCoordinates(_85c);
var _85f=this.facade.getCanvas().getAbstractShapesAtPosition(_85e);
var _860=_85f.pop();
if(this.docker.parent===_860){
_860=_85f.pop();
}
if(this.lastUIObj==_860){
}else{
if(_860 instanceof ORYX.Core.Shape){
var sset=this.docker.parent.getStencil().stencilSet();
if(this.docker.parent instanceof ORYX.Core.Edge){
this.isValid=this.facade.getRules().canConnect({sourceShape:this.dockerSource?this.dockerSource:(this.isStartDocker?_860:undefined),edgeShape:this.docker.parent,targetShape:this.dockerTarget?this.dockerTarget:(this.isEndDocker?_860:undefined)});
}else{
this.isValid=this.facade.getRules().canConnect({sourceShape:_860,edgeShape:this.docker.parent,targetShape:this.docker.parent});
}
if(this.lastUIObj){
this.hideMagnets(this.lastUIObj);
}
if(this.isValid){
this.showMagnets(_860);
}
this.showHighlight(_860,this.isValid?this.VALIDCOLOR:this.INVALIDCOLOR);
this.lastUIObj=_860;
}else{
this.hideHighlight();
this.lastUIObj?this.hideMagnets(this.lastUIObj):null;
this.lastUIObj=undefined;
this.isValid=false;
}
}
if(this.lastUIObj&&this.isValid&&!(_85c.shiftKey||_85c.ctrlKey)){
_85d=this.lastUIObj.magnets.find(function(_862){
return _862.absoluteBounds().isIncluded(_85e);
});
if(_85d){
this.docker.bounds.centerMoveTo(_85d.absoluteCenterXY());
}
}
}
}
if(!(_85c.shiftKey||_85c.ctrlKey)&&!_85d){
var _863=ORYX.CONFIG.DOCKER_SNAP_OFFSET;
var _864=_863+1;
var _865=_863+1;
var _866=this.docker.bounds.center();
if(this.docker.parent){
this.docker.parent.dockers.each((function(_867){
if(this.docker==_867){
return;
}
var _868=_867.referencePoint?_867.getAbsoluteReferencePoint():_867.bounds.center();
_864=Math.abs(_864)>Math.abs(_868.x-_866.x)?_868.x-_866.x:_864;
_865=Math.abs(_865)>Math.abs(_868.y-_866.y)?_868.y-_866.y:_865;
}).bind(this));
if(Math.abs(_864)<_863||Math.abs(_865)<_863){
_864=Math.abs(_864)<_863?_864:0;
_865=Math.abs(_865)<_863?_865:0;
this.docker.bounds.centerMoveTo(_866.x+_864,_866.y+_865);
}
}
}
this.dockerParent._update();
},dockerMovedFinished:function(_869){
this.hideHighlight();
this.dockerParent.getLabels().each(function(_86a){
_86a.show();
});
if(this.lastUIObj&&(this.isStartDocker||this.isEndDocker)){
if(this.isValid){
this.docker.setDockedShape(this.lastUIObj);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED,docker:this.docker,parent:this.docker.parent,target:this.lastUIObj});
}
this.hideMagnets(this.lastUIObj);
}
this.docker.hide();
var _86b=ORYX.Core.Command.extend({construct:function(_86c,_86d,_86e,_86f,_870,_871){
this.docker=_86c;
this.newPosition=_86d;
this.newDockedShape=_86f;
this.oldPosition=_86e;
this.oldDockedShape=_870;
this.facade=_871;
},execute:function(){
this.dock(this.newDockedShape,this.newPosition);
},rollback:function(){
this.dock(this.oldDockedShape,this.oldPosition);
},dock:function(_872,pos){
this.docker.setDockedShape(undefined);
if(_872){
this.docker.setDockedShape(_872);
this.docker.setReferencePoint(pos);
}else{
this.docker.bounds.centerMoveTo(pos);
}
this.facade.getCanvas().update();
this.facade.updateSelection();
}});
var _874=new _86b(this.docker,this.docker.referencePoint||this.docker.bounds.center(),this._commandArg.refPoint,this.docker.getDockedShape(),this._commandArg.dockedShape,this.facade);
this.facade.executeCommands([_874]);
this.docker=undefined;
this.dockerParent=undefined;
this.dockerSource=undefined;
this.dockerTarget=undefined;
this.lastUIObj=undefined;
},hideHighlight:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"validDockedShape"});
},showHighlight:function(_875,_876){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"validDockedShape",elements:[_875],color:_876});
},showMagnets:function(_877){
_877.magnets.each(function(_878){
_878.show();
});
},hideMagnets:function(_879){
_879.magnets.each(function(_87a){
_87a.hide();
});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.DragDropResize=Clazz.extend({construct:function(_87b){
this.facade=_87b;
this.currentShapes=[];
this.toMoveShapes=[];
this.distPoints=[];
this.isResizing=false;
this.dragEnable=false;
this.dragIntialized=false;
this.offSetPosition={x:0,y:0};
this.faktorXY={x:1,y:1};
this.containmentParentNode;
this.isAddingAllowed=false;
this.isAttachingAllowed=false;
this.callbackMouseMove=this.handleMouseMove.bind(this);
this.callbackMouseUp=this.handleMouseUp.bind(this);
var _87c=this.facade.getCanvas().getSvgContainer();
this.selectedRect=new ORYX.Plugins.SelectedRect(_87c);
_87c=this.facade.getCanvas().getHTMLContainer();
this.scrollNode=this.facade.getCanvas().rootNode.parentNode.parentNode;
this.resizer=new ORYX.Plugins.Resizer(_87c,this.facade);
this.resizer.registerOnResize(this.onResize.bind(this));
this.resizer.registerOnResizeEnd(this.onResizeEnd.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
},handleMouseDown:function(_87d,_87e){
if(!this.dragBounds||!this.currentShapes.member(_87e)){
return;
}
this.dragEnable=true;
this.dragIntialized=true;
var a=this.facade.getCanvas().node.getScreenCTM();
this.faktorXY.x=a.a;
this.faktorXY.y=a.d;
var upL=this.dragBounds.upperLeft();
this.offSetPosition={x:Event.pointerX(_87d)-(upL.x*this.faktorXY.x),y:Event.pointerY(_87d)-(upL.y*this.faktorXY.y)};
this.offsetScroll={x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.callbackMouseMove,false);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.callbackMouseUp,true);
return;
},handleMouseUp:function(_881){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.contain"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.attached"});
if(this.dragEnable){
if(!this.dragIntialized){
this.afterDrag();
if(this.isAttachingAllowed&&this.toMoveShapes.length==1&&this.toMoveShapes[0] instanceof ORYX.Core.Node&&this.toMoveShapes[0].dockers.length>0){
var _882=this.facade.eventCoordinates(_881);
var _883=this.toMoveShapes[0].dockers[0];
var _884=ORYX.Core.Command.extend({construct:function(_885,_886,_887,_888){
this.docker=_885;
this.newPosition=_886;
this.newDockedShape=_887;
this.newParent=_887.parent||_888.getCanvas();
this.oldPosition=_885.parent.bounds.center();
this.oldDockedShape=_885.getDockedShape();
this.oldParent=_885.parent.parent||_888.getCanvas();
this.facade=_888;
if(this.oldDockedShape){
this.oldPosition=_885.parent.absoluteBounds().center();
}
},execute:function(){
this.dock(this.newDockedShape,this.newParent,this.newPosition);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_ARRANGEMENT_TOP,excludeCommand:true});
},rollback:function(){
this.dock(this.oldDockedShape,this.oldParent,this.oldPosition);
},dock:function(_889,_88a,pos){
_88a.add(this.docker.parent);
this.docker.setDockedShape(undefined);
this.docker.bounds.centerMoveTo(pos);
this.docker.setDockedShape(_889);
this.facade.getCanvas().update();
this.facade.setSelection([this.docker.parent]);
}});
var _88c=[new _884(_883,_882,this.containmentParentNode,this.facade)];
this.facade.executeCommands(_88c);
}else{
if(this.isAddingAllowed){
this.refreshSelectedShapes();
}
}
this.facade.updateSelection();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_END});
}
}
this.dragEnable=false;
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.callbackMouseUp,true);
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.callbackMouseMove,false);
return;
},handleMouseMove:function(_88d){
if(!this.dragEnable){
return;
}
if(this.dragIntialized){
this.beforeDrag();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_DRAGDROP_START});
this.dragIntialized=false;
this.resizer.hide();
this._onlyEdges=this.currentShapes.all(function(_88e){
return (_88e instanceof ORYX.Core.Edge);
});
this._currentUnderlyingNodes=[];
}
var _88f={x:Event.pointerX(_88d)-this.offSetPosition.x,y:Event.pointerY(_88d)-this.offSetPosition.y};
_88f.x-=this.offsetScroll.x-this.scrollNode.scrollLeft;
_88f.y-=this.offsetScroll.y-this.scrollNode.scrollTop;
var _890=_88d.shiftKey||_88d.ctrlKey;
if(ORYX.CONFIG.GRID_ENABLED&&!_890){
_88f=this.snapToGrid(_88f);
}
_88f.x/=this.faktorXY.x;
_88f.y/=this.faktorXY.y;
_88f.x=Math.max(0,_88f.x);
_88f.y=Math.max(0,_88f.y);
var c=this.facade.getCanvas();
_88f.x=Math.min(c.bounds.width()-this.dragBounds.width(),_88f.x);
_88f.y=Math.min(c.bounds.height()-this.dragBounds.height(),_88f.y);
this.dragBounds.moveTo(_88f);
this.resizeRectangle(this.dragBounds);
this.isAttachingAllowed=false;
var _892=$A(this.facade.getCanvas().getAbstractShapesAtPosition(this.facade.eventCoordinates(_88d)));
var _893=this.toMoveShapes.length==1&&this.toMoveShapes[0] instanceof ORYX.Core.Node&&this.toMoveShapes[0].dockers.length>0;
_893=_893&&_892.length!=1;
if(!_893&&_892.length===this._currentUnderlyingNodes.length&&_892.all(function(node,_895){
return this._currentUnderlyingNodes[_895]===node;
}.bind(this))){
return;
}else{
if(this._onlyEdges){
this.isAddingAllowed=true;
this.containmentParentNode=this.facade.getCanvas();
}else{
this.containmentParentNode=_892.reverse().find((function(node){
return (node instanceof ORYX.Core.Canvas)||((node instanceof ORYX.Core.Node)&&(!(this.currentShapes.member(node)||this.currentShapes.any(function(_897){
return (_897.getChildNodes(true).member(node));
}))));
}).bind(this));
if(_893){
this.isAttachingAllowed=this.facade.getRules().canConnect({sourceShape:this.containmentParentNode,edgeShape:this.toMoveShapes[0],targetShape:this.toMoveShapes[0]});
if(this.isAttachingAllowed){
var _898=this.facade.eventCoordinates(_88d);
this.isAttachingAllowed=this.containmentParentNode.isPointOverOffset(_898.x,_898.y);
}
}
if(!this.isAttachingAllowed){
this.isAddingAllowed=this.toMoveShapes.all((function(_899){
if(_899 instanceof ORYX.Core.Edge||_899 instanceof ORYX.Core.Controls.Docker||this.containmentParentNode===_899.parent){
return true;
}else{
if(this.containmentParentNode!==_899){
if(!(this.containmentParentNode instanceof ORYX.Core.Edge)){
if(this.facade.getRules().canContain({containingShape:this.containmentParentNode,containedShape:_899})){
return true;
}
}
}
}
return false;
}).bind(this));
}
}
}
this._currentUnderlyingNodes=_892.reverse();
if(this.isAttachingAllowed){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.attached",elements:[this.containmentParentNode],style:ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,color:ORYX.CONFIG.SELECTION_VALID_COLOR});
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.attached"});
}
if(!this.isAttachingAllowed){
if(this.isAddingAllowed){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.contain",elements:[this.containmentParentNode],color:ORYX.CONFIG.SELECTION_VALID_COLOR});
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"dragdropresize.contain",elements:[this.containmentParentNode],color:ORYX.CONFIG.SELECTION_INVALID_COLOR});
}
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"dragdropresize.contain"});
}
return;
},refreshSelectedShapes:function(){
if(!this.dragBounds){
return;
}
var upL=this.dragBounds.upperLeft();
var _89b=this.oldDragBounds.upperLeft();
var _89c={x:upL.x-_89b.x,y:upL.y-_89b.y};
var _89d=ORYX.Core.Command.extend({construct:function(_89e,_89f,_8a0,_8a1,_8a2){
this.moveShapes=_89e;
this.selectedShapes=_8a1;
this.offset=_89f;
this.facade=_8a2;
this.newParents=_89e.collect(function(){
return _8a0;
});
this.oldParents=_89e.collect(function(_8a3){
return _8a3.parent;
});
this.dockedNodes=_89e.findAll(function(_8a4){
return _8a4 instanceof ORYX.Core.Node&&_8a4.dockers.length==1;
}).collect(function(_8a5){
return {docker:_8a5.dockers[0],dockedShape:_8a5.dockers[0].getDockedShape(),refPoint:_8a5.dockers[0].referencePoint};
});
},execute:function(){
this.dockAllShapes();
this.move(this.offset);
this.addShapeToParent(this.newParents);
this.facade.getCanvas().update();
this.selectCurrentShapes();
},rollback:function(){
var _8a6={x:-this.offset.x,y:-this.offset.y};
this.move(_8a6);
this.addShapeToParent(this.oldParents);
this.dockAllShapes(true);
this.facade.getCanvas().update();
this.selectCurrentShapes();
},move:function(_8a7){
for(var i=0;i<this.moveShapes.length;i++){
var _8a9=this.moveShapes[i];
_8a9.bounds.moveBy(_8a7);
if(_8a9 instanceof ORYX.Core.Node){
var _8aa=_8a9.getChildShapes(true).findAll(function(_8ab){
return _8ab instanceof ORYX.Core.Node;
});
var _8ac=_8aa.collect(function(_8ad){
return _8ad.getAllDockedShapes();
}).flatten().uniq();
var _8ae=_8ac.findAll(function(_8af){
return _8af instanceof ORYX.Core.Edge;
});
_8ae=_8ae.findAll(function(_8b0){
return _8b0.getAllDockedShapes().all(function(dsh){
return _8aa.include(dsh);
});
});
var _8b2=_8ae.collect(function(_8b3){
return _8b3.dockers;
}).flatten();
for(var j=0;j<_8b2.length;j++){
var _8b5=_8b2[j];
if(!_8b5.getDockedShape()&&!this.moveShapes.include(_8b5)){
_8b5.bounds.moveBy(_8a7);
}
}
}
}
},dockAllShapes:function(_8b6){
for(var i=0;i<this.dockedNodes.length;i++){
var _8b8=this.dockedNodes[i].docker;
_8b8.setDockedShape(_8b6?this.dockedNodes[i].dockedShape:undefined);
if(_8b8.getDockedShape()){
_8b8.setReferencePoint(this.dockedNodes[i].refPoint);
}
}
},addShapeToParent:function(_8b9){
for(var i=0;i<this.moveShapes.length;i++){
var _8bb=this.moveShapes[i];
if(_8bb instanceof ORYX.Core.Node&&_8bb.parent!==_8b9[i]){
var unul=_8b9[i].absoluteXY();
var csul=_8bb.absoluteXY();
var x=csul.x-unul.x;
var y=csul.y-unul.y;
_8b9[i].add(_8bb);
_8bb.getOutgoingShapes((function(_8c0){
if(_8c0 instanceof ORYX.Core.Node&&!this.moveShapes.member(_8c0)){
_8b9[i].add(_8c0);
}
}).bind(this));
if(_8bb instanceof ORYX.Core.Node&&_8bb.dockers.length==1){
var b=_8bb.bounds;
x+=b.width()/2;
y+=b.height()/2;
_8bb.dockers.first().bounds.centerMoveTo(x,y);
}else{
_8bb.bounds.moveTo(x,y);
}
}
_8bb.update();
}
},selectCurrentShapes:function(){
this.facade.setSelection(this.selectedShapes);
}});
var _8c2=[new _89d(this.toMoveShapes,_89c,this.containmentParentNode,this.currentShapes,this.facade)];
if(this._undockedEdgesCommand instanceof ORYX.Core.Command){
_8c2.unshift(this._undockedEdgesCommand);
}
this.facade.executeCommands(_8c2);
if(this.dragBounds){
this.oldDragBounds=this.dragBounds.clone();
}
},onResize:function(_8c3){
if(!this.dragBounds){
return;
}
this.dragBounds=_8c3;
this.isResizing=true;
this.resizeRectangle(this.dragBounds);
},onResizeEnd:function(){
if(this.isResizing){
var _8c4=ORYX.Core.Command.extend({construct:function(_8c5,_8c6,_8c7){
this.shape=_8c5;
this.oldBounds=_8c5.bounds.clone();
this.newBounds=_8c6;
this.facade=_8c7;
},execute:function(){
this.shape.bounds.set(this.newBounds.a,this.newBounds.b);
this.shape.getLabels().each(function(_8c8){
_8c8.changed();
});
this.facade.getCanvas().update();
this.facade.setSelection([this.shape]);
},rollback:function(){
this.shape.bounds.set(this.oldBounds.a,this.oldBounds.b);
this.shape.getLabels().each(function(_8c9){
_8c9.changed();
});
this.facade.getCanvas().update();
this.facade.setSelection([this.shape]);
},update:function(){
}});
var _8ca=this.dragBounds.clone();
var _8cb=this.currentShapes[0];
if(_8cb.parent){
var _8cc=_8cb.parent.absoluteXY();
_8ca.moveBy(-_8cc.x,-_8cc.y);
}
var _8cd=new _8c4(_8cb,_8ca,this.facade);
this.facade.executeCommands([_8cd]);
this.isResizing=false;
}
},beforeDrag:function(){
var _8ce=ORYX.Core.Command.extend({construct:function(_8cf){
this.dockers=_8cf.collect(function(_8d0){
return _8d0 instanceof ORYX.Core.Controls.Docker?{docker:_8d0,dockedShape:_8d0.getDockedShape(),refPoint:_8d0.referencePoint}:undefined;
}).compact();
},execute:function(){
this.dockers.each(function(el){
el.docker.setDockedShape(undefined);
});
},rollback:function(){
this.dockers.each(function(el){
el.docker.setDockedShape(el.dockedShape);
el.docker.setReferencePoint(el.refPoint);
});
}});
this._undockedEdgesCommand=new _8ce(this.toMoveShapes);
this._undockedEdgesCommand.execute();
},hideAllLabels:function(_8d3){
_8d3.getLabels().each(function(_8d4){
_8d4.hide();
});
_8d3.getAllDockedShapes().each(function(_8d5){
var _8d6=_8d5.getLabels();
if(_8d6.length>0){
_8d6.each(function(_8d7){
_8d7.hide();
});
}
});
_8d3.getChildren().each((function(_8d8){
if(_8d8 instanceof ORYX.Core.Shape){
this.hideAllLabels(_8d8);
}
}).bind(this));
},afterDrag:function(){
},showAllLabels:function(_8d9){
for(var i=0;i<_8d9.length;i++){
var _8db=_8d9[i];
_8db.show();
}
var _8dc=_8d9.getAllDockedShapes();
for(var i=0;i<_8dc.length;i++){
var _8dd=_8dc[i];
var _8de=_8dd.getLabels();
if(_8de.length>0){
_8de.each(function(_8df){
_8df.show();
});
}
}
for(var i=0;i<_8d9.children.length;i++){
var _8e0=_8d9.children[i];
if(_8e0 instanceof ORYX.Core.Shape){
this.showAllLabels(_8e0);
}
}
},onSelectionChanged:function(_8e1){
var _8e2=_8e1.elements;
this.dragEnable=false;
this.dragIntialized=false;
this.resizer.hide();
if(!_8e2||_8e2.length==0){
this.selectedRect.hide();
this.currentShapes=[];
this.toMoveShapes=[];
this.dragBounds=undefined;
this.oldDragBounds=undefined;
}else{
this.currentShapes=_8e2;
this.toMoveShapes=this.facade.getCanvas().getShapesWithSharedParent(_8e2);
this.toMoveShapes=this.toMoveShapes.findAll(function(_8e3){
return _8e3 instanceof ORYX.Core.Node&&(_8e3.dockers.length===0||!_8e2.member(_8e3.dockers.first().getDockedShape()));
});
_8e2.each((function(_8e4){
if(!(_8e4 instanceof ORYX.Core.Edge)){
return;
}
var dks=_8e4.getDockers();
var hasF=_8e2.member(dks.first().getDockedShape());
var hasL=_8e2.member(dks.last().getDockedShape());
if(!hasL){
this.toMoveShapes.push(dks.last());
}
if(!hasF){
this.toMoveShapes.push(dks.first());
}
if(_8e4.dockers.length>2){
this.toMoveShapes=this.toMoveShapes.concat(dks.findAll(function(el,_8e9){
return _8e9>0&&_8e9<dks.length-1;
}));
}
}).bind(this));
var _8ea=undefined;
_8e2.each(function(_8eb){
if(!_8ea){
_8ea=_8eb.absoluteBounds();
}else{
_8ea.include(_8eb.absoluteBounds());
}
});
this.dragBounds=_8ea;
this.oldDragBounds=_8ea.clone();
this.resizeRectangle(_8ea);
this.selectedRect.show();
if(_8e2.length==1&&_8e2[0].isResizable){
this.resizer.setBounds(this.dragBounds,_8e2[0].minimumSize,_8e2[0].maximumSize);
this.resizer.show();
}else{
this.resizer.setBounds(undefined);
}
if(ORYX.CONFIG.GRID_ENABLED){
this.distPoints=[];
var _8ec=this.facade.getCanvas().getChildNodes(true);
_8e2.each(function(_8ed){
_8ec=_8ec.without(_8ed);
});
_8ec.each((function(_8ee){
if(!(_8ee instanceof ORYX.Core.Edge)){
var ul=_8ee.absoluteXY();
var _8f0=_8ee.bounds.width();
var _8f1=_8ee.bounds.height();
this.distPoints.push({x:ul.x,y:ul.y});
this.distPoints.push({x:ul.x+Math.round(_8f0/2),y:ul.y+Math.round(_8f1/2)});
this.distPoints.push({x:ul.x+_8f0,y:ul.y+_8f1});
}
}).bind(this));
var _8f2=Math.max(this.facade.getCanvas().bounds.width(),this.facade.getCanvas().bounds.height());
for(i=0;i<_8f2;i=i+ORYX.CONFIG.GRID_DISTANCE){
this.distPoints.push({x:i,y:i});
}
}
}
},snapToGrid:function(_8f3){
var x=_8f3.x;
var y=_8f3.y;
var _8f6=this.dragBounds;
var _8f7=x-this.distPoints[0].x;
var _8f8=y-this.distPoints[0].y;
var _8f9=0;
var _8fa=0;
this.distPoints.each(function(_8fb){
var _8fc=y-_8fb.y;
var _8fd=(y+Math.round(_8f6.height()/2))-_8fb.y;
var _8fe=(y+_8f6.height())-_8fb.y;
if(Math.abs(_8fc)<Math.abs(_8f8)){
_8f8=_8fc;
_8fa=0;
}
if(Math.abs(_8fd)<Math.abs(_8f8)){
_8f8=_8fd;
_8fa=1;
}
if(Math.abs(_8fe)<Math.abs(_8f8)){
_8f8=_8fe;
_8fa=2;
}
var _8ff=x-_8fb.x;
var _900=(x+Math.round(_8f6.width()/2))-_8fb.x;
var _901=(x+_8f6.width())-_8fb.x;
if(Math.abs(_8ff)<Math.abs(_8f7)){
_8f7=_8ff;
_8f9=0;
}
if(Math.abs(_900)<Math.abs(_8f7)){
_8f7=_900;
_8f9=1;
}
if(Math.abs(_901)<Math.abs(_8f7)){
_8f7=_901;
_8f9=2;
}
});
if(_8fa==1){
_8fa=(_8f6.height()/2);
}else{
if(_8fa==2){
_8fa=_8f6.height();
}
}
if(_8f9==1){
_8f9=(_8f6.width()/2);
}else{
if(_8f9==2){
_8f9=_8f6.width();
}
}
return {y:y-_8f8,x:x-_8f7};
},resizeRectangle:function(_902){
this.selectedRect.resize(_902);
}});
ORYX.Plugins.SelectedRect=Clazz.extend({construct:function(_903){
this.parentId=_903;
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",$(_903),["g"]);
this.dashedArea=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["rect",{x:0,y:0,"stroke-width":1,stroke:"#777777",fill:"none","stroke-dasharray":"2,2","pointer-events":"none"}]);
this.hide();
},hide:function(){
this.node.setAttributeNS(null,"display","none");
},show:function(){
this.node.setAttributeNS(null,"display","");
},resize:function(_904){
var upL=_904.upperLeft();
var _906=ORYX.CONFIG.SELECTED_AREA_PADDING;
this.dashedArea.setAttributeNS(null,"width",_904.width()+2*_906);
this.dashedArea.setAttributeNS(null,"height",_904.height()+2*_906);
this.node.setAttributeNS(null,"transform","translate("+(upL.x-_906)+", "+(upL.y-_906)+")");
}});
ORYX.Plugins.Resizer=Clazz.extend({construct:function(_907,_908){
this.parentId=_907;
this.facade=_908;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(this.parentId),["div",{"class":"resizer",style:"left:0px; top:0px;"}]);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this),true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.handleMouseUp.bind(this),true);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.handleMouseMove.bind(this),false);
this.dragEnable=false;
this.offSetPosition={x:0,y:0};
this.bounds=undefined;
this.canvasNode=this.facade.getCanvas().node;
this.minSize=undefined;
this.maxSize=undefined;
this.resizeCallbacks=[];
this.resizeEndCallbacks=[];
this.hide();
this.scrollNode=this.node.parentNode.parentNode.parentNode;
},handleMouseDown:function(_909){
this.dragEnable=true;
this.offsetScroll={x:this.scrollNode.scrollLeft,y:this.scrollNode.scrollTop};
this.offSetPosition={x:Event.pointerX(_909)-this.position.x,y:Event.pointerY(_909)-this.position.y};
},handleMouseUp:function(_90a){
this.dragEnable=false;
this.resizeEndCallbacks.each((function(_90b){
_90b(this.bounds);
}).bind(this));
},handleMouseMove:function(_90c){
if(!this.dragEnable){
return;
}
var _90d={x:Event.pointerX(_90c)-this.offSetPosition.x,y:Event.pointerY(_90c)-this.offSetPosition.y};
_90d.x-=this.offsetScroll.x-this.scrollNode.scrollLeft;
_90d.y-=this.offsetScroll.y-this.scrollNode.scrollTop;
_90d.x=Math.min(_90d.x,this.facade.getCanvas().bounds.width());
_90d.y=Math.min(_90d.y,this.facade.getCanvas().bounds.height());
var _90e={x:_90d.x-this.position.x,y:_90d.y-this.position.y};
if(_90e.x<0&&Math.abs(_90e.x)>this.bounds.width()){
_90e.x=this.minSize.width-this.bounds.width();
}
if(_90e.y<0&&Math.abs(_90e.y)>this.bounds.height()){
_90e.y=this.minSize.height-this.bounds.height();
}
this.bounds.extend(_90e);
this.update();
this.resizeCallbacks.each((function(_90f){
_90f(this.bounds);
}).bind(this));
Event.stop(_90c);
},registerOnResizeEnd:function(_910){
if(!this.resizeEndCallbacks.member(_910)){
this.resizeEndCallbacks.push(_910);
}
},unregisterOnResizeEnd:function(_911){
if(this.resizeEndCallbacks.member(_911)){
this.resizeEndCallbacks=this.resizeEndCallbacks.without(_911);
}
},registerOnResize:function(_912){
if(!this.resizeCallbacks.member(_912)){
this.resizeCallbacks.push(_912);
}
},unregisterOnResize:function(_913){
if(this.resizeCallbacks.member(_913)){
this.resizeCallbacks=this.resizeCallbacks.without(_913);
}
},hide:function(){
this.node.style.display="none";
},show:function(){
if(this.bounds){
this.node.style.display="";
}
},setBounds:function(_914,min,max){
this.bounds=_914;
if(!min){
min={width:ORYX.CONFIG.MINIMUM_SIZE,height:ORYX.CONFIG.MINIMUM_SIZE};
}
if(!max){
max={width:ORYX.CONFIG.MAXIMUM_SIZE,height:ORYX.CONFIG.MAXIMUM_SIZE};
}
this.minSize=min;
this.maxSize=max;
this.update();
},update:function(){
if(!this.bounds){
return;
}
var upL=this.bounds.upperLeft();
if(this.bounds.width()<this.minSize.width){
this.bounds.set(upL.x,upL.y,upL.x+this.minSize.width,upL.y+this.bounds.height());
}
if(this.bounds.height()<this.minSize.height){
this.bounds.set(upL.x,upL.y,upL.x+this.bounds.width(),upL.y+this.minSize.height);
}
if(this.bounds.width()>this.maxSize.width){
this.bounds.set(upL.x,upL.y,upL.x+this.maxSize.width,upL.y+this.bounds.height());
}
if(this.bounds.height()>this.maxSize.height){
this.bounds.set(upL.x,upL.y,upL.x+this.bounds.width(),upL.y+this.maxSize.height);
}
var a=this.canvasNode.getScreenCTM();
upL.x*=a.a;
upL.y*=a.d;
upL.x+=(a.a*this.bounds.width())+3;
upL.y+=(a.d*this.bounds.height())+3;
this.position=upL;
this.node.style.left=this.position.x+"px";
this.node.style.top=this.position.y+"px";
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Edit=Clazz.extend({facade:undefined,construct:function(_919){
this.facade=_919;
this.copyElements=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keyHandler.bind(this));
this.facade.offer({name:ORYX.I18N.Edit.cut,description:ORYX.I18N.Edit.cutDesc,icon:ORYX.PATH+"images/cut.png",functionality:this.editCut.bind(this),group:ORYX.I18N.Edit.group,index:1,minShape:1});
this.facade.offer({name:ORYX.I18N.Edit.copy,description:ORYX.I18N.Edit.copyDesc,icon:ORYX.PATH+"images/page_copy.png",functionality:this.editCopy.bind(this),group:ORYX.I18N.Edit.group,index:2,minShape:1});
this.facade.offer({name:ORYX.I18N.Edit.paste,description:ORYX.I18N.Edit.pasteDesc,icon:ORYX.PATH+"images/page_paste.png",functionality:this.editPaste.bind(this),isEnabled:this.clipboardIsOccupied.bind(this),group:ORYX.I18N.Edit.group,index:3,minShape:0,maxShape:0});
this.facade.offer({name:ORYX.I18N.Edit.del,description:ORYX.I18N.Edit.delDesc,icon:ORYX.PATH+"images/cross.png",functionality:this.editDelete.bind(this),group:ORYX.I18N.Edit.group,index:4,minShape:1});
},clipboardIsOccupied:function(){
return this.copyElements.length>0;
},showClipboard:function(){
Ext.Msg.alert("Oryx",this.inspect(this.copyElements,true,3));
},inspect:function(_91a,_91b,_91c){
if(_91c--<=0){
return _91a;
}
var temp="";
for(key in _91a){
var _91e=_91a[key];
if(_91b&&(_91e instanceof Function)){
continue;
}
temp+=key+": ("+this.inspect(_91e,_91b,_91c)+") -";
}
if(temp==""){
return _91a;
}else{
return temp;
}
},move:function(key,far){
var _921=far?20:5;
var _922=this.facade.getSelection();
var p={x:0,y:0};
switch(key){
case ORYX.CONFIG.KEY_CODE_LEFT:
p.x=-1*_921;
break;
case ORYX.CONFIG.KEY_CODE_RIGHT:
p.x=_921;
break;
case ORYX.CONFIG.KEY_CODE_UP:
p.y=-1*_921;
break;
case ORYX.CONFIG.KEY_CODE_DOWN:
p.y=_921;
break;
}
_922=_922.findAll(function(_924){
if(_924 instanceof ORYX.Core.Node&&_924.dockers.length==1&&_922.include(_924.dockers.first().getDockedShape())){
return false;
}
var s=_924.parent;
do{
if(_922.include(s)){
return false;
}
}while(s=s.parent);
return true;
});
_922=_922.map(function(_926){
if(_926 instanceof ORYX.Core.Node){
return _926;
}else{
if(_926 instanceof ORYX.Core.Edge){
var _927=_926.dockers;
if(_922.include(_926.dockers.first().getDockedShape())){
_927=_927.without(_926.dockers.first());
}
if(_922.include(_926.dockers.last().getDockedShape())){
_927=_927.without(_926.dockers.last());
}
return _927;
}else{
return null;
}
}
}).flatten().compact();
if(_922.size()>0){
var _928=ORYX.Core.Command.extend({construct:function(_929,_92a,_92b){
this.moveShapes=_929;
this.offset=_92a;
this.facade=_92b;
this.dockers=this.moveShapes.map(function(_92c){
return _92c instanceof ORYX.Core.Controls.Docker?{docker:_92c,dockedShape:_92c.getDockedShape(),refPoint:_92c.referencePoint}:null;
}).compact();
this.selection=this.facade.getSelection();
},execute:function(){
this.dockAllShapes();
this.move(this.offset);
this.facade.getCanvas().update();
this.facade.setSelection(this.selection);
},rollback:function(){
var _92d={x:-this.offset.x,y:-this.offset.y};
this.move(_92d);
this.dockAllShapes(true);
this.facade.getCanvas().update();
this.facade.setSelection(this.selection);
},move:function(_92e){
for(var i=0;i<this.moveShapes.length;i++){
var _930=this.moveShapes[i];
_930.bounds.moveBy(_92e);
if(_930 instanceof ORYX.Core.Node){
var _931=_930.getChildShapes(true).findAll(function(_932){
return _932 instanceof ORYX.Core.Node;
});
var _933=_931.collect(function(_934){
return _934.getAllDockedShapes();
}).flatten().uniq();
var _935=_933.findAll(function(_936){
return _936 instanceof ORYX.Core.Edge;
});
_935=_935.findAll(function(_937){
return _937.getAllDockedShapes().all(function(dsh){
return _931.include(dsh);
});
});
var _939=_935.collect(function(_93a){
return _93a.dockers;
}).flatten();
for(var j=0;j<_939.length;j++){
var _93c=_939[j];
if(!_93c.getDockedShape()&&!this.moveShapes.include(_93c)){
_93c.bounds.moveBy(_92e);
}
}
}
}
},dockAllShapes:function(_93d){
for(var i=0;i<this.dockers.length;i++){
var _93f=this.dockers[i].docker;
_93f.setDockedShape(_93d?this.dockers[i].dockedShape:undefined);
if(_93f.getDockedShape()){
_93f.setReferencePoint(this.dockers[i].refPoint);
}
}
}});
var _940=[new _928(_922,p,this.facade)];
this.facade.executeCommands(_940);
}
},keyHandler:function(_941){
ORYX.Log.debug("edit.js handles a keyEvent.");
if(!_941){
_941=window.event;
}
var _942=_941.which||_941.keyCode;
var _943=_941.ctrlKey;
if([ORYX.CONFIG.KEY_CODE_LEFT,ORYX.CONFIG.KEY_CODE_RIGHT,ORYX.CONFIG.KEY_CODE_UP,ORYX.CONFIG.KEY_CODE_DOWN].include(_942)){
this.move(_942,!_943);
return;
}
if((_942==ORYX.CONFIG.KEY_CODE_DELETE)||((_942==ORYX.CONFIG.KEY_CODE_BACKSPACE)&&(_941.metaKey||_941.appleMetaKey))){
ORYX.Log.debug("edit.js deletes the shape.");
this.editDelete();
return;
}
if(!_943){
return;
}
switch(_942){
case ORYX.CONFIG.KEY_CODE_X:
this.editCut();
break;
case ORYX.CONFIG.KEY_CODE_C:
this.editCopy();
break;
case ORYX.CONFIG.KEY_CODE_V:
this.editPaste();
break;
}
},getShapesAsJSON:function(_944){
var _945=[];
var _946;
_944.each(function(_947){
_946={id:_947.resourceId,type:_947.getStencil().id(),serialize:_947.serialize()};
if(_947 instanceof ORYX.Core.Edge){
var _948=_947.getDockers().first().getDockedShape();
var _949=_944.member(_948);
var _94a=_947.getDockers().last().getDockedShape();
var _94b=_944.member(_94a);
if(!_948){
_946.moveFirstDocker=true;
}
if(!_94a){
_946.moveLastDocker=true;
}
if((_948&&!_949)||(_94a&&!_94b)){
_946.serialize.any(function(ser){
if(ser.name=="dockers"&&ser.prefix=="oryx"){
var _94d=ser.value.split(" ").without("");
if(_948&&!_949){
_946.moveFirstDocker=true;
var _94e=_947.getDockers().first().bounds.center();
_94d[0]=_94e.x;
_94d[1]=_94e.y;
}
if(_94a&&!_94b){
_946.moveLastDocker=true;
var _94f=_94d.length-3;
var _94e=_947.getDockers().last().bounds.center();
_94d[_94f]=_94e.x;
_94f++;
_94d[_94f]=_94e.y;
}
ser.value=_94d.join(" ");
return true;
}else{
return false;
}
});
}
}
_945.push(_946);
});
_945.each(function(_950){
_950.serialize=_950.serialize.findAll(function(ser){
if(ser.prefix=="raziel"&&ser.name=="outgoing"||ser.prefix=="raziel"&&ser.name=="target"){
return _945.any(function(_952){
return "#"+_952.id==ser.value;
});
}else{
if(ser.name=="docker"&&ser.prefix=="oryx"){
return _945.any(function(_953){
return _953.serialize.any(function(ser2){
if(ser2.name=="outgoing"&&ser2.prefix=="raziel"){
return ser2.value=="#"+_950.id;
}else{
return false;
}
});
});
}else{
return true;
}
}
});
});
return _945;
},getAllShapesToConsider:function(_955){
var _956;
var _957=[];
var _958=new Hash();
var _959=_955.clone();
_955.each(function(_95a){
_95a.getChildNodes(true).each(function(_95b){
if(!_959.member(_95b)){
_959.push(_95b);
}
}.bind(this));
});
_956=_959.clone();
var i=0;
while(i<_956.length){
var _95d=_956[i++];
this._storeConnection(_95d,_957);
var _95e=(_95d.getDockers().first())?_95d.getDockers().first().getDockedShape():undefined;
var _95f=(_95d.getDockers().last())?_95d.getDockers().last().getDockedShape():undefined;
_95d.getOutgoingShapes().each(function(os){
if(!_956.member(os)){
if(os!=_95f&&!(_95d instanceof ORYX.Core.Edge&&os instanceof ORYX.Core.Node)){
_956.push(os);
}
this._storeConnection(os,_957);
}
}.bind(this));
_95d.getIncomingShapes().each(function(is){
if(!_956.member(is)){
if(is!=_95e&&!(_95d instanceof ORYX.Core.Edge&&os instanceof ORYX.Core.Node)){
_956.push(is);
}
this._storeConnection(is,_957);
}
}.bind(this));
}
var _962;
do{
_962=_956.length;
var _963=[];
_956.each(function(_964){
if(_964 instanceof ORYX.Core.Edge&&!_955.member(_964)&&(_964.getDockers().first().getDockedShape()!=undefined&&!_956.member(_964.getDockers().first().getDockedShape())||_964.getDockers().last().getDockedShape()!=undefined&&!_956.member(_964.getDockers().last().getDockedShape()))){
_963.push(_964);
}
}.bind(this));
while(_963.length>0){
_956=_956.without(_963.pop());
}
}while(_956.length!=_962);
_956.each((function(_965){
if(_965.parent){
_958[_965.id]=_965.parent;
}
}).bind(this));
_955.each(function(_966){
_966.getAllDockedShapes().each(function(os){
if(os instanceof ORYX.Core.Edge&&!_955.member(os)){
_956=_956.without(os);
}
}.bind(this));
}.bind(this));
return {shapes:_956,connections:_957,parents:_958};
},_storeConnection:function(_968,_969){
if(_968.getDockers().first()){
_969.push([_968.getDockers().first(),_968.getDockers().first().getDockedShape(),_968.getDockers().first().referencePoint]);
if(_968 instanceof ORYX.Core.Edge){
_969.push([_968.getDockers().last(),_968.getDockers().last().getDockedShape(),_968.getDockers().last().referencePoint]);
}
}
},editCut:function(){
this.editCopy(false);
this.editDelete(true);
return false;
},editCopy:function(_96a){
var _96b=this.facade.getSelection();
if(_96b.lenght==0){
return;
}
var _96c=this.getAllShapesToConsider(_96b);
this.copyElements=this.getShapesAsJSON(_96c.shapes);
if(_96a){
this.facade.updateSelection();
}
},editPaste:function(){
this.copyElements.each(function(_96d){
_96d.serialize.any(function(ser){
if(ser.name=="parent"&&ser.prefix=="raziel"){
var _96f=this.copyElements.any(function(_970){
return "#"+_970.id==ser.value;
});
if(!_96f){
_96d.serialize.each(function(ser2){
if(ser2.name=="bounds"&&ser2.prefix=="oryx"){
var _972="";
ser2.value.split(",").without("").each(function(_973){
try{
_973=parseFloat(_973);
_973+=ORYX.CONFIG.COPY_MOVE_OFFSET;
_972+=_973+",";
}
catch(e){
_972+=_973+",";
}
}.bind(this));
_972=_972.substring(0,_972.length-1);
ser2.value=_972;
}else{
if(ser2.name=="dockers"&&ser2.prefix=="oryx"){
var _972="";
var _974=ser2.value.split(" ").without("");
for(var i=0;i<_974.length;i++){
if(i<2){
_972+=(_96d.moveFirstDocker)?(parseFloat(_974[i])+ORYX.CONFIG.COPY_MOVE_OFFSET)+" ":_974[i]+" ";
}else{
if(i>=_974.length-3){
_972+=(_96d.moveLastDocker&&!isNaN(parseFloat(_974[i])))?(parseFloat(_974[i])+ORYX.CONFIG.COPY_MOVE_OFFSET)+" ":_974[i]+" ";
}else{
_972+=(isNaN(parseFloat(_974[i])))?_974[i]+" ":(parseFloat(_974[i])+ORYX.CONFIG.COPY_MOVE_OFFSET)+" ";
}
}
}
ser2.value=_972;
}
}
}.bind(this));
}
return true;
}else{
return false;
}
}.bind(this));
}.bind(this));
this.facade.importJSON(this.copyElements);
},editDelete:function(){
var _976=this.facade.getSelection();
var _977=this.getAllShapesToConsider(_976);
var _978=ORYX.Core.Command.extend({construct:function(_979,_97a,_97b,_97c,_97d){
this.selectedShapes=_979;
this.facade=_97d;
this.connections=_97b;
this.shapes=_97a;
this.parents=_97c;
this.indexes=new Hash();
},execute:function(){
this.shapes.each(function(_97e){
this.indexes[_97e.id]=this.parents[_97e.id].getChildShapes().indexOf(_97e);
this.facade.deleteShape(_97e);
}.bind(this));
this.facade.getCanvas().update();
this.facade.setSelection([]);
},rollback:function(){
this.shapes.each(function(_97f){
this.parents[_97f.id].add(_97f,this.indexes[_97f.id]);
}.bind(this));
this.connections.each(function(con){
con[0].setDockedShape(con[1]);
con[0].setReferencePoint(con[2]);
}.bind(this));
this.facade.getCanvas().update();
this.facade.setSelection(this.selectedShapes);
}});
var _981=new _978(_976,_977.shapes,_977.connections,_977.parents,this.facade);
this.facade.executeCommands([_981]);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.EPC2BPMN=Clazz.extend({facade:undefined,EPC_NAMESPACE:"http://b3mn.org/stencilset/epc#",BPMN1_0_NAMESPACE:"http://b3mn.org/stencilset/bpmn#",BPMN1_1_NAMESPACE:"http://b3mn.org/stencilset/bpmn1.1#",construct:function(_982){
this.facade=_982;
Facade=_982;
this.isBPMN1_0=this.facade.getStencilSets().keys().include(this.BPMN1_0_NAMESPACE);
this.isBPMN1_1=this.facade.getStencilSets().keys().include(this.BPMN1_1_NAMESPACE);
if(!this.isBPMN1_0&&!this.isBPMN1_1){
return;
}
this.facade.offer({"name":"EPC to BPMN transform","functionality":this.startTransform.bind(this),"group":"epc","icon":ORYX.PATH+"images/epc_export.png","description":"Import from EPC","index":1,"minShape":0,"maxShape":0});
},startTransform:function(){
this.showPanel(this.sendRequest.bind(this));
},sendRequest:function(_983){
var _984=new Ext.Window({id:"oryx-loading-panel_epc2bpmn",bodyStyle:"padding: 8px",title:"Oryx",width:230,height:55,modal:true,resizable:false,closable:false,frame:true,html:"<span style=\"font-size:11px;\">Please wait while Oryx is importing...</span>"});
_984.show();
if(!_983||!_983.url){
return;
}
var url="./engineproxy?url="+_983.url;
new Ajax.Request(url,{method:"GET",onSuccess:function(_986){
window.setTimeout((function(){
try{
this.doTransform(_986.responseText,_983);
}
catch(e){
Ext.Msg.alert("Oryx","An Error is occured while importing!");
}
Ext.getCmp("oryx-loading-panel_epc2bpmn").close();
if(_983.autolayout){
window.setTimeout((function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_AUTOLAYOUT_LAYOUT});
}).bind(this),100);
}
}).bind(this),100);
}.bind(this),onFailure:function(_987){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx","Request to server failed!");
}.bind(this)});
},doTransform:function(_988,_989){
var _98a=this.parseToObject(_988);
var _98b=[];
if(!_98a){
return;
}
var _98c=function(id){
return _98a.find(function(el){
return el.id==id;
});
};
var _98f=function(_990){
var _991=_98b.find(function(sh){
return sh.epc==_990;
});
if(_991){
_991.shape.parent.remove(_991.shape);
_98b=_98b.without(_991);
}
};
var _993=_989&&_989.events_throw?_989.events_throw.split(";").compact().without("").without(" ").collect(function(s){
return s.toLowerCase();
}):[];
var _995=_989&&_989.events_catch?_989.events_catch.split(";").compact().without("").without(" ").collect(function(s){
return s.toLowerCase();
}):[];
var _997=function(s){
return _993.any(function(map){
return map.split(" ").all(function(word){
return s.toLowerCase().include(word);
});
});
};
var _99b=function(s){
return _995.any(function(map){
return map.split(" ").all(function(word){
return s.toLowerCase().include(word);
});
});
};
var _99f=_98a.findAll(function(el){
return el.type.endsWith("Function");
});
_99f.each(function(epc){
var _9a2=this.createElement("Task",epc,true);
_9a2.setProperty("oryx-name",epc.title);
_9a2.setProperty("oryx-documentation",epc.description);
_98b.push({shape:_9a2,epc:epc});
}.bind(this));
var _9a3=_98a.findAll(function(el){
return el.type.endsWith("Event");
});
var _9a5=_9a3.findAll(function(ev){
return !_98a.any(function(el){
return el.outgoing&&el.outgoing.any(function(out){
return out.slice(1)==ev.id;
});
});
});
_9a5.each(function(epc){
var _9aa=_99b(epc.title)?"StartMessageEvent":"StartEvent";
var _9ab=this.createElement(_9aa,epc,true);
if(_9aa=="StartMessageEvent"){
_9ab.setProperty("oryx-message",epc.title);
}else{
_9ab.setProperty("oryx-documentation",epc.title+" - "+epc.description);
}
_98b.push({shape:_9ab,epc:epc});
}.bind(this));
var _9ac=_9a3.findAll(function(ev){
return !ev.outgoing;
});
_9ac.each(function(epc){
var _9af=this.isBPMN1_1&&_997(epc.title)?"MessageEndEvent":"EndEvent";
var _9b0=this.createElement(_9af,epc,true);
if(_9af=="MessageEndEvent"){
_9b0.setProperty("oryx-message",epc.title);
}else{
_9b0.setProperty("oryx-documentation",epc.title+" - "+epc.description);
}
if(this.isBPMN1_0&&_997(epc.title)){
_9b0.setProperty("oryx-result","Message");
_9b0.setProperty("oryx-message",epc.title);
}
_98b.push({shape:_9b0,epc:epc});
}.bind(this));
var _9b1=[].without.apply(_9a3,_9a5.concat(_9ac));
intermediateEventsCatch=_9b1.findAll(function(epc){
return _99b(epc.title);
});
intermediateEventsCatch.each(function(epc){
var type=this.isBPMN1_1?"IntermediateMessageEventCatching":"IntermediateMessageEvent";
var _9b5=this.createElement(type,epc,true);
_9b5.setProperty("oryx-message",epc.title);
_98b.push({shape:_9b5,epc:epc});
}.bind(this));
intermediateFunctionsThrow=_99f.findAll(function(epc){
return _997(epc.title);
});
intermediateFunctionsThrow.each(function(epc){
_98f(epc);
var type=this.isBPMN1_1?"IntermediateMessageEventThrowing":"IntermediateMessageEvent";
var _9b9=epc.outgoing?_98c(epc.outgoing[0].slice(1)):null;
if(_9b9&&_9b9.outgoing){
var _9ba=_98c(_9b9.outgoing[0].slice(1));
if(_9ba&&_9ba.type.endsWith("Event")&&!_9ba.outgoing&&_997(_9ba.title)){
_98f(_9ba);
type=this.isBPMN1_1?"MessageEndEvent":"EndEvent";
}
}
var _9bb=this.createElement(type,epc,true);
_9bb.setProperty("oryx-message",epc.title);
if(this.isBPMN1_0&&type=="EndEvent"){
_9bb.setProperty("oryx-result","Message");
}
_98b.push({shape:_9bb,epc:epc});
}.bind(this));
var _9bc=_98a.findAll(function(el){
return el.type.endsWith("Connector");
});
_9bc.each(function(epc){
var type="Exclusive_Databased_Gateway";
if(epc.type.endsWith("AndConnector")){
type="AND_Gateway";
}else{
if(epc.type.endsWith("OrConnector")){
type="OR_Gateway";
}
}
if(type=="Exclusive_Databased_Gateway"&&epc.outgoing&&epc.outgoing.all(function(out){
return intermediateEventsCatch.include(_98c(_98c(out.slice(1)).outgoing[0].slice(1)));
})){
type="Exclusive_Eventbased_Gateway";
}
var _9c1=this.createElement(type,epc,true);
_98b.push({shape:_9c1,epc:epc});
}.bind(this));
_9bc.each(function(epc){
if(epc.outgoing&&epc.outgoing.length>1&&!epc.type.endsWith("AndConnector")){
epc.outgoing.each(function(out){
var next=_98c(out.slice(1));
if(next.type.endsWith("ControlFlow")&&next.outgoing){
next.outgoing.each(function(out2){
var _9c6=_98c(out2.slice(1));
if(_9c6.type.endsWith("Event")){
next["expression"]=_9c6.title;
}
});
}
});
}
}.bind(this));
var _9c7=_98a.findAll(function(el){
return el.type.endsWith("Data");
});
_9c7.each(function(epc){
var _9ca=this.createElement("DataObject",epc,true);
_9ca.setProperty("oryx-name",epc.title);
_9ca.setProperty("oryx-documentation",epc.description);
_98b.push({shape:_9ca,epc:epc});
}.bind(this));
var _9cb=_98a.findAll(function(el){
return el.type.endsWith("System");
});
_9cb.each(function(epc){
var _9ce=this.createElement("TextAnnotation",epc,true);
_9ce.setProperty("oryx-text","Used System: "+epc.title);
_98b.push({shape:_9ce,epc:epc});
}.bind(this));
var _9cf=_98a.findAll(function(el){
return el.type.endsWith("ProcessInterface");
});
_9cf.each(function(epc){
var type=this.isBPMN1_1?"collapsedSubprocess":"Subprocess";
var _9d3=this.createElement(type,epc,true);
_9d3.setProperty("oryx-name",epc.title);
_9d3.setProperty("oryx-documentation",epc.description);
_9d3.setProperty("raziel-entry",epc.refuri);
_98b.push({shape:_9d3,epc:epc});
}.bind(this));
var _9d4=_989.organization?_98a.findAll(function(el){
return el.type.endsWith("Organization")||el.type.endsWith("Position");
}):[];
var _9d6=_9d4.collect(function(epc){
return epc.title;
}).uniq().sort();
_9d4=_9d6.collect(function(name){
return _9d4.findAll(function(epc){
return epc.title==name;
});
});
if(_9d4.length>0){
var pool=this.createElement("Pool");
var _9db=[];
var _9dc=[];
_9d4.each(function(epcs){
var lane=this.createElement("Lane");
lane.setProperty("oryx-name",epcs[0].title);
pool.add(lane);
_9db.push({shape:lane,epc:epcs[0]});
epcs.each(function(epc){
var _9e0=epc.outgoing?epc.outgoing.collect(function(out){
return _98c(out.slice(1)).outgoing[0].slice(1);
}):[];
var _9e2=_98b.findAll(function(_9e3){
return _9e3.epc.type.endsWith("Function")||_9e3.epc.type.endsWith("ProcessInterface");
});
_9e2=_9e2.findAll(function(_9e4){
return _9e0.include(_9e4.epc.id)||(_9e4.epc.outgoing&&_9e4.epc.outgoing.any(function(out){
return _98c(out.slice(1)).outgoing.first().slice(1)==epc.id;
}));
});
_9e2.each(function(_9e6){
lane.add(_9e6.shape);
_9dc.push(_9e6);
});
});
}.bind(this));
var _9e7=[].without.apply(_98b,_9dc);
var _9e8=_9e7.findAll(function(_9e9){
return _9e9.epc.type.endsWith("Function")||_9e9.epc.type.endsWith("ProcessInterface");
});
if(_9e8.length>0){
var _9ea=this.createElement("Lane");
pool.add(_9ea);
_9e8.each(function(_9eb){
_9ea.add(_9eb.shape);
_9dc.push(_9eb);
});
}
var _9e7=[].without.apply(_98b,_9dc);
var _9ec=function(_9ed){
if(!_9ed){
return [];
}
var res=[];
_9ed.each(function(out){
var sh=_98b.find(function(el){
return el.epc.id==out.slice(1);
});
if(sh){
if(_9dc.indexOf(sh)>=0){
throw $break;
}
if(_9e7.indexOf(sh)>=0){
res.push(sh);
}
res=res.concat(_9ec(sh.epc.outgoing));
}else{
res=res.concat(_9ec(_98c(out.slice(1)).outgoing));
}
});
return res;
};
_9dc.each(function(_9f2){
var _9f3=_9ec(_9f2.epc.outgoing);
_9f3.each(function(_9f4){
_9f2.shape.parent.add(_9f4.shape);
_9e7=_9e7.without(_9f4);
});
});
var _9f5=function(_9f6){
if(!_9f6){
return [];
}
var res;
_9f6.each(function(out){
var sh=_98b.find(function(el){
return el.epc.id==out.slice(1);
});
if(sh){
if(_9dc.indexOf(sh)>=0){
res=sh;
throw $break;
}
res=_9f5(sh.epc.outgoing);
}else{
res=_9f5(_98c(out.slice(1)).outgoing);
}
});
return res;
};
_9e7.each(function(_9fb){
var _9fc=_9f5(_9fb.epc.outgoing);
if(_9fc){
_9fc.shape.parent.add(_9fb.shape);
_9dc.push(_9fb);
}
});
}
var _9fd=function(edge){
if(!edge||!edge.outgoing){
return null;
}
var _9ff=edge;
var _a00;
while(!_a00){
_9ff=_98a.find(function(el){
return _9ff.outgoing&&_9ff.outgoing.any(function(out){
return out.slice(1)==el.id;
});
});
_a00=_98b.find(function(el){
return el.epc===_9ff;
});
if(!_9ff||!_9ff.outgoing){
break;
}
}
return _a00;
};
var _a04=[];
_98b.each(function(from){
if(from.epc.outgoing){
from.epc.outgoing.each(function(out){
var edge=_98a.find(function(epc){
return (epc.type.endsWith("ControlFlow")||epc.type.endsWith("Relation"))&&epc.id==out.slice(1);
});
var next=_9fd(edge);
if(edge&&next){
_a04.push({from:from,edge:edge,to:next});
}
});
}
});
_a04.each(function(edge){
var _a0b;
if(edge.edge.type.endsWith("Relation")){
if(edge.edge.informationflow.toLowerCase()=="true"){
_a0b=this.createElement("Association_Unidirectional",edge.edge);
}else{
_a0b=this.createElement("Association_Undirected",edge.edge);
}
}else{
_a0b=this.createElement("SequenceFlow",edge.edge);
}
var from=edge.from.shape;
var to=edge.to.shape;
_a0b.dockers.first().setDockedShape(from);
_a0b.dockers.first().setReferencePoint({x:from.bounds.width()/2,y:from.bounds.height()/2});
_a0b.dockers.last().setDockedShape(to);
_a0b.dockers.last().setReferencePoint({x:to.bounds.width()/2,y:to.bounds.height()/2});
if(edge.edge.expression){
_a0b.setProperty("oryx-conditionexpression",edge.edge.expression);
}
_98b.push({shape:_a0b,epc:edge.edge});
}.bind(this));
this.facade.getCanvas().update();
},createElement:function(_a0e,_a0f,_a10,_a11){
var ssn=this.facade.getStencilSets().keys()[0];
var _a13=ORYX.Core.StencilSet.stencil(ssn+_a0e);
if(!_a13&&_a11){
_a13=ORYX.Core.StencilSet.stencil(ssn+_a11);
}
if(!_a13){
return null;
}
var _a14=(_a13.type()=="node")?new ORYX.Core.Node({"eventHandlerCallback":this.facade.raiseEvent},_a13):new ORYX.Core.Edge({"eventHandlerCallback":this.facade.raiseEvent},_a13);
this.facade.getCanvas().add(_a14);
if(_a0f&&_a0f.bounds&&_a10){
_a14.bounds.centerMoveTo(_a0f.bounds.center);
}
return _a14;
},parseToObject:function(_a15){
var _a16=new DOMParser();
var doc=_a16.parseFromString(_a15,"text/xml");
var _a18=function(id){
return $A(doc.getElementsByTagName("div")).find(function(el){
return el.getAttribute("id")==id;
});
};
var _a1b=_a18("oryxcanvas");
_a1b=_a1b?_a1b:_a18("oryx-canvas123");
var _a1c=_a1b?$A(_a1b.childNodes).any(function(node){
return node.nodeName.toLowerCase()=="a"&&node.getAttribute("rel")=="oryx-stencilset"&&node.getAttribute("href").endsWith("epc/epc.json");
}):null;
if(!_a1c){
this.throwErrorMessage("Imported model is not an EPC model!");
return null;
}
var _a1e=$A(_a1b.childNodes).collect(function(el){
return el.nodeName.toLowerCase()=="a"&&el.getAttribute("rel")=="oryx-render"?el.getAttribute("href").slice(1):null;
}).compact();
_a1e=_a1e.collect(function(el){
return _a18(el);
});
var _a21=function(node){
var res={};
if(node.getAttribute("id")){
res["id"]=node.getAttribute("id");
}
$A(node.childNodes).each(function(node){
if(node.nodeName.toLowerCase()=="span"&&node.getAttribute("class")){
var key=node.getAttribute("class").slice(5);
res[key]=node.firstChild?node.firstChild.nodeValue:"";
if(key=="bounds"){
var ba=$A(res[key].split(",")).collect(function(el){
return Number(el);
});
res[key]={a:{x:ba[0],y:ba[1]},b:{x:ba[2],y:ba[3]},center:{x:ba[0]+((ba[2]-ba[0])/2),y:ba[1]+((ba[3]-ba[1])/2)}};
}
}else{
if(node.nodeName.toLowerCase()=="a"&&node.getAttribute("rel")){
var key=node.getAttribute("rel").split("-")[1];
if(!res[key]){
res[key]=[];
}
res[key].push(node.getAttribute("href"));
}
}
});
return res;
};
return _a1e.collect(function(el){
return _a21(el);
});
},throwErrorMessage:function(_a29){
Ext.Msg.alert("Oryx",_a29);
},showPanel:function(_a2a){
Ext.QuickTips.init();
var _a2b=new Ext.form.FormPanel({id:"transform-epc-bpmn-id-main",labelWidth:40,defaultType:"textfield",bodyStyle:"padding:5px",defaults:{width:300,msgTarget:"side"},items:[{text:"For the import and transformation from EPC to BPMN please set the URL to the EPC model.",xtype:"label",style:"padding-bottom:10px;display:block",width:"100%"},{fieldLabel:"URL",name:"last",allowBlank:false}]});
var _a2c=new Ext.form.FormPanel({id:"transform-epc-bpmn-id-advance",collapsed:true,labelWidth:30,defaultType:"textfield",bodyStyle:"padding:15px",defaults:{width:300,msgTarget:"side",labelSeparator:""},items:[{text:"Event-Mapping",xtype:"label",cls:"transform-epc-bpmn-title"},{text:"If u like to transform indivual event from EPC to event in BPMN, please give keyword regarding to these (separated with a ';').",xtype:"label",width:"100%",style:"margin-bottom:10px;display:block;"},{labelStyle:"background:transparent url(stencilsets/bpmn/icons/intermediate-message.png) no-repeat scroll 0px -1px;width:30px;height:20px",name:"events_catch"},{labelStyle:!this.isBPMN1_0?"background:transparent url(stencilsets/bpmn/icons/intermediate-message.png) no-repeat scroll 0px -30px;width:30px;height:20px":"display:none",name:"events_throw",style:this.isBPMN1_0?"display:none;":""},{text:"Organization",xtype:"label",style:"margin-top:10px;display:block;",cls:"transform-epc-bpmn-title"},{text:"Should the organizational units and roles maped to a pool/lane? (Required Auto-Layout)",xtype:"label",width:"100%",style:"margin-bottom:10px;display:block;"},{boxLabel:"Organization",name:"autolayout",id:"transform-epc-bpmn-id-organization",xtype:"checkbox",labelStyle:"width:30px;height:20px"},{text:"Auto-Layout",xtype:"label",style:"margin-top:10px;display:block;",cls:"transform-epc-bpmn-title"},{text:"By enable the autolayout, the model will be auto layouted afterwards with the AutoLayout Plugin. (Needs a while)",xtype:"label",width:"100%",style:"margin-bottom:10px;display:block;"},{boxLabel:"Auto-Layout",name:"autolayout",id:"transform-epc-bpmn-id-autolayout",xtype:"checkbox",labelStyle:"width:30px;height:20px"}]});
Ext.getCmp("transform-epc-bpmn-id-organization").on("check",function(obj,_a2e){
if(_a2e){
Ext.getCmp("transform-epc-bpmn-id-autolayout").setValue(true);
Ext.getCmp("transform-epc-bpmn-id-autolayout").disable();
}else{
Ext.getCmp("transform-epc-bpmn-id-autolayout").enable();
}
});
var _a2f={text:"Advanced Settings",xtype:"button",enableToggle:true,cls:"transform-epc-bpmn-group-button",handler:function(d){
var d=Ext.getCmp("transform-epc-bpmn-id-advance");
if(d.collapsed){
d.expand();
}else{
d.collapse();
}
}};
var _a31=new Ext.Window({title:"Oryx - Transform EPC to BPMN",width:400,id:"transform-epc-bpmn-id-panel",cls:"transform-epc-bpmn-window",items:new Ext.Panel({frame:true,autoHeight:true,items:[_a2b,_a2f,_a2c]}),floating:true,shim:true,modal:true,resizable:false,autoHeight:true,buttons:[{text:"Import",handler:function(){
var res={};
var _a33=Ext.getCmp("transform-epc-bpmn-id-main").findByType("textfield")[0];
if(_a33.validate()){
res.url=_a33.getValue();
}
if(!Ext.getCmp("transform-epc-bpmn-id-advance").collapsed){
res.events_catch=Ext.getCmp("transform-epc-bpmn-id-advance").findByType("textfield")[0].getValue();
if(this.isBPMN1_1){
res.events_throw=Ext.getCmp("transform-epc-bpmn-id-advance").findByType("textfield")[1].getValue();
}
res.organization=Ext.getCmp("transform-epc-bpmn-id-advance").findByType("checkbox")[0].getValue();
res.autolayout=Ext.getCmp("transform-epc-bpmn-id-advance").findByType("checkbox")[1].getValue();
}
Ext.getCmp("transform-epc-bpmn-id-panel").close();
_a2a(res);
}.bind(this)},{text:"Cancel",handler:function(){
Ext.getCmp("transform-epc-bpmn-id-panel").close();
}}]});
_a31.show();
}});
var Facade=undefined;
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.EPCSupport=Clazz.extend({facade:undefined,construct:function(_a34){
this.facade=_a34;
this.facade.offer({"name":ORYX.I18N.EPCSupport.exp,"functionality":this.exportEPC.bind(this),"group":ORYX.I18N.EPCSupport.group,"icon":ORYX.PATH+"images/epml_export_icon.png","description":ORYX.I18N.EPCSupport.expDesc,"index":1,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.EPCSupport.imp,"functionality":this.importEPC.bind(this),"group":ORYX.I18N.EPCSupport.group,"icon":ORYX.PATH+"images/epml_import_icon.png","description":ORYX.I18N.EPCSupport.impDesc,"index":2,"minShape":0,"maxShape":0});
},importEPC:function(){
this.openUploadDialog();
},exportEPC:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.EPCSupport.progressExp});
var _a35=new XMLSerializer();
var _a36="Oryx-EPC";
var _a37=DataManager.serializeDOM(this.facade);
_a37="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_a37+"<div id=\"generatedProcessInfos\"><span class=\"oryx-id\">"+_a36+"</span>"+"<span class=\"oryx-name\">"+_a36+"</span></div>"+"</body></html>";
var _a38=ORYX.PATH+"/lib/extract-rdf.xsl";
var _a39;
rdfResult=this.transformString(_a37,_a38,true);
if(rdfResult instanceof String){
_a39=rdfResult;
rdfResult=null;
}else{
_a39=_a35.serializeToString(rdfResult);
if(!_a39.startsWith("<?xml")){
_a39="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_a39;
}
}
var _a3a=ORYX.PATH+"/xslt/RDF2EPML.xslt";
var _a3b=this.transformDOM(rdfResult,_a3a,true);
var _a3c;
if(_a3b instanceof String){
_a3c=_a3b;
_a3b=null;
}else{
_a3c=_a35.serializeToString(_a3b);
if(!_a3c.startsWith("<?xml")){
_a3c="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_a3c;
}
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
this.openDownloadWindow(_a36+".epml",_a3c);
},transformString:function(_a3d,_a3e,_a3f){
var _a40=new DOMParser();
var _a41=_a40.parseFromString(_a3d,"text/xml");
return this.transformDOM(_a41,_a3e,_a3f);
},transformDOM:function(_a42,_a43,_a44){
if(_a42==null){
return new String("Parse Error: \nThe given dom content is null.");
}
var _a45;
var _a46;
var _a47=new XSLTProcessor();
var _a48=document.implementation.createDocument("","",null);
_a48.async=false;
_a48.load(_a43);
_a47.importStylesheet(_a48);
try{
_a45=_a47.transformToDocument(_a42);
}
catch(error){
return new String("Parse Error: "+error.name+"\n"+error.message);
}
if(_a44){
return _a45;
}
_a46=(new XMLSerializer()).serializeToString(_a45);
return _a46;
},openUploadDialog:function(){
var form=new Ext.form.FormPanel({frame:true,bodyStyle:"padding:5px;",defaultType:"textfield",labelAlign:"left",buttonAlign:"right",fileUpload:true,enctype:"multipart/form-data",items:[{text:ORYX.I18N.EPCSupport.selectFile,style:"font-size:12px;margin-bottom:10px;display:block;",xtype:"label"},{fieldLabel:ORYX.I18N.EPCSupport.file,inputType:"file",labelStyle:"width:50px;",itemCls:"ext_specific_window_overflow"}]});
var _a4a=new Ext.Window({autoCreate:true,title:ORYX.I18N.EPCSupport.impPanel,height:"auto",width:"auto",modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,resizable:false,items:[form],buttons:[{text:ORYX.I18N.EPCSupport.impBtn,handler:function(){
var _a4b=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.EPCSupport.progressImp});
_a4b.show();
form.form.submit({url:ORYX.PATH+"/epc-upload",success:function(f,a){
_a4a.hide();
var erdf=a.result;
erdf=erdf.startsWith("<?xml")?erdf:"<?xml version=\"1.0\" encoding=\"utf-8\"?><div>"+erdf+"</div>";
this.loadContent(erdf);
_a4b.hide();
}.bind(this),failure:function(f,a){
_a4a.hide();
_a4b.hide();
Ext.MessageBox.show({title:ORYX.I18N.EPCSupport.error,msg:a.response.responseText.substring(a.response.responseText.indexOf("content:'")+9,a.response.responseText.indexOf("'}")),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
}});
}.bind(this)},{text:ORYX.I18N.EPCSupport.close,handler:function(){
_a4a.hide();
}.bind(this)}]});
_a4a.on("hide",function(){
_a4a.destroy(true);
delete _a4a;
});
_a4a.show();
},createHiddenElement:function(name,_a52){
var _a53=document.createElement("input");
_a53.name=name;
_a53.type="hidden";
_a53.value=_a52;
return _a53;
},getFileName:function(_a54){
var l=_a54.length;
if(l>5){
if(_a54.substr(l-5,5)=="(AML)"){
return _a54.substr(0,l-6);
}
}
return _a54;
},openDownloadWindow:function(file,_a57){
var win=window.open("");
if(win!=null){
win.document.open();
win.document.write("<html><body>");
var _a59=win.document.createElement("form");
win.document.body.appendChild(_a59);
var file=this.getFileName(file);
_a59.appendChild(this.createHiddenElement("download",_a57));
_a59.appendChild(this.createHiddenElement("file",file));
_a59.method="POST";
win.document.write("</body></html>");
win.document.close();
_a59.action=ORYX.PATH+"/download";
_a59.submit();
}
},loadContent:function(_a5a){
var _a5b=new DOMParser();
var doc=_a5b.parseFromString(_a5a,"text/xml");
this.facade.importERDF(doc);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.ERDFSupport=Clazz.extend({facade:undefined,ERDFServletURL:"/erdfsupport",construct:function(_a5d){
this.facade=_a5d;
this.facade.offer({"name":ORYX.I18N.ERDFSupport.exp,"functionality":this.exportERDF.bind(this),"group":ORYX.I18N.ERDFSupport.group,"icon":ORYX.PATH+"images/erdf_export_icon.png","description":ORYX.I18N.ERDFSupport.expDesc,"index":0,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.ERDFSupport.imp,"functionality":this.importERDF.bind(this),"group":ORYX.I18N.ERDFSupport.group,"icon":ORYX.PATH+"images/erdf_import_icon.png","description":ORYX.I18N.ERDFSupport.impDesc,"index":1,"minShape":0,"maxShape":0});
},importERDF:function(){
this._showImportDialog();
},exportERDF:function(){
var s=this.facade.getERDF();
this.openDownloadWindow(window.document.title+".xml",s);
},sendRequest:function(url,_a60,_a61,_a62){
var suc=false;
new Ajax.Request(url,{method:"POST",asynchronous:false,parameters:_a60,onSuccess:function(_a64){
suc=true;
if(_a61){
_a61(_a64.result);
}
}.bind(this),onFailure:function(_a65){
if(_a62){
_a62();
}else{
Ext.Msg.alert("Oryx",ORYX.I18N.ERDFSupport.impFailed);
ORYX.log.warn("Import ERDF failed: "+_a65.responseText);
}
}.bind(this)});
return suc;
},loadERDF:function(_a66,_a67,_a68){
var s=_a66;
s=s.startsWith("<?xml")?s:"<?xml version=\"1.0\" encoding=\"utf-8\"?>"+s+"";
var _a6a=new DOMParser();
var doc=_a6a.parseFromString(s,"text/xml");
if(doc.firstChild.tagName=="parsererror"){
Ext.MessageBox.show({title:ORYX.I18N.ERDFSupport.error,msg:ORYX.I18N.ERDFSupport.impFailed2+doc.firstChild.textContent.escapeHTML(),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
if(_a68){
_a68();
}
}else{
if(!this.hasStencilSet(doc)){
if(_a68){
_a68();
}
}else{
this.facade.importERDF(doc);
if(_a67){
_a67();
}
}
}
},hasStencilSet:function(doc){
var _a6d=function(doc,id){
return $A(doc.getElementsByTagName("div")).findAll(function(el){
return $A(el.attributes).any(function(attr){
return attr.nodeName=="class"&&attr.nodeValue==id;
});
});
};
var _a72=_a6d(doc,"-oryx-canvas")[0];
if(!_a72){
this.throwWarning(ORYX.I18N.ERDFSupport.noCanvas);
return false;
}
var _a73=$A(_a72.getElementsByTagName("a")).find(function(node){
return node.getAttribute("rel")=="oryx-stencilset";
});
if(!_a73){
this.throwWarning(ORYX.I18N.ERDFSupport.noSS);
return false;
}
var _a75=_a73.getAttribute("href").split("/");
_a75=_a75[_a75.length-2]+"/"+_a75[_a75.length-1];
var _a76=this.facade.getStencilSets().values().any(function(ss){
return ss.source().endsWith(_a75);
});
if(!_a76){
this.throwWarning(ORYX.I18N.ERDFSupport.wrongSS);
return false;
}
return true;
},throwWarning:function(text){
Ext.MessageBox.show({title:"Oryx",msg:text,buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.WARNING});
},openXMLWindow:function(_a79){
var win=window.open("data:application/xml,"+encodeURIComponent(_a79),"_blank","resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes");
},openDownloadWindow:function(file,_a7c){
var win=window.open("");
if(win!=null){
win.document.open();
win.document.write("<html><body>");
var _a7e=win.document.createElement("form");
win.document.body.appendChild(_a7e);
_a7e.appendChild(this.createHiddenElement("download",_a7c));
_a7e.appendChild(this.createHiddenElement("file",file));
_a7e.method="POST";
win.document.write("</body></html>");
win.document.close();
_a7e.action=ORYX.PATH+"/download";
_a7e.submit();
}
},createHiddenElement:function(name,_a80){
var _a81=document.createElement("input");
_a81.name=name;
_a81.type="hidden";
_a81.value=_a80;
return _a81;
},_showImportDialog:function(_a82){
var form=new Ext.form.FormPanel({baseCls:"x-plain",labelWidth:50,defaultType:"textfield",items:[{text:ORYX.I18N.ERDFSupport.selectFile,style:"font-size:12px;margin-bottom:10px;display:block;",anchor:"100%",xtype:"label"},{fieldLabel:ORYX.I18N.ERDFSupport.file,name:"subject",inputType:"file",style:"margin-bottom:10px;display:block;",itemCls:"ext_specific_window_overflow"},{xtype:"textarea",hideLabel:true,name:"msg",anchor:"100% -63"}]});
var _a84=new Ext.Window({autoCreate:true,layout:"fit",plain:true,bodyStyle:"padding:5px;",title:ORYX.I18N.ERDFSupport.impERDF,height:350,width:500,modal:true,fixedcenter:true,shadow:true,proxyDrag:true,resizable:true,items:[form],buttons:[{text:ORYX.I18N.ERDFSupport.impBtn,handler:function(){
var _a85=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.ERDFSupport.impProgress});
_a85.show();
window.setTimeout(function(){
var _a86=form.items.items[2].getValue();
this.loadERDF(_a86,function(){
_a85.hide();
_a84.hide();
}.bind(this),function(){
_a85.hide();
}.bind(this));
}.bind(this),100);
}.bind(this)},{text:ORYX.I18N.ERDFSupport.close,handler:function(){
_a84.hide();
}.bind(this)}]});
_a84.on("hide",function(){
_a84.destroy(true);
delete _a84;
});
_a84.show();
form.items.items[1].getEl().dom.addEventListener("change",function(evt){
var text=evt.target.files[0].getAsText("UTF-8");
form.items.items[2].setValue(text);
},true);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Save=Clazz.extend({facade:undefined,processURI:undefined,construct:function(_a89){
this.facade=_a89;
this.facade.offer({"name":ORYX.I18N.Save.save,"functionality":this.save.bind(this,false),"group":ORYX.I18N.Save.group,"icon":ORYX.PATH+"images/disk.png","description":ORYX.I18N.Save.saveDesc,"index":1,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.Save.saveAs,"functionality":this.save.bind(this,true),"group":ORYX.I18N.Save.group,"icon":ORYX.PATH+"images/disk_multi.png","description":ORYX.I18N.Save.saveAsDesc,"index":2,"minShape":0,"maxShape":0});
window.onbeforeunload=this.onUnLoad.bind(this);
this.changeDifference=0;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_UNDO_EXECUTE,function(){
this.changeDifference++;
}.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_EXECUTE_COMMANDS,function(){
this.changeDifference++;
}.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_UNDO_ROLLBACK,function(){
this.changeDifference--;
}.bind(this));
},onUnLoad:function(){
if(this.changeDifference!==0){
return ORYX.I18N.Save.unsavedData;
}
},saveSynchronously:function(_a8a){
this.changeDifference=0;
var _a8b=this.processURI?this.processURI:location.href;
if(_a8a){
var ss=this.facade.getStencilSets();
var _a8d=ss[ss.keys()[0]].source().split("stencilsets")[0];
_a8b="/backend/poem"+ORYX.CONFIG.ORYX_NEW_URL+"?stencilset=/stencilsets"+_a8d;
}
var _a8e=this.facade.getCanvas().getSVGRepresentation(true);
var _a8f=DataManager.serialize(_a8e);
this.serializedDOM=DataManager.serializeDOM(this.facade);
if(_a8b.include(ORYX.CONFIG.ORYX_NEW_URL)){
var ss=this.facade.getStencilSets().values()[0];
var _a90={title:ORYX.I18N.Save.newProcess,summary:"",type:ss.title(),url:_a8b,namespace:ss.namespace()};
var _a91=new Ext.XTemplate("<form class=\"oryx_repository_edit_model\" action=\"#\" id=\"edit_model\" onsubmit=\"return false;\">","<fieldset>","<p class=\"description\">"+ORYX.I18N.Save.dialogDesciption+"</p>","<input type=\"hidden\" name=\"namespace\" value=\"{namespace}\" />","<p><label for=\"edit_model_title\">"+ORYX.I18N.Save.dialogLabelTitle+"</label><input type=\"text\" class=\"text\" name=\"title\" value=\"{title}\" id=\"edit_model_title\" onfocus=\"this.className = 'text activated'\" onblur=\"this.className = 'text'\"/></p>","<p><label for=\"edit_model_summary\">"+ORYX.I18N.Save.dialogLabelDesc+"</label><textarea rows=\"5\" name=\"summary\" id=\"edit_model_summary\" onfocus=\"this.className = 'activated'\" onblur=\"this.className = ''\">{summary}</textarea></p>","<p><label for=\"edit_model_type\">"+ORYX.I18N.Save.dialogLabelType+"</label><input type=\"text\" name=\"type\" class=\"text disabled\" value=\"{type}\" disabled=\"disabled\" id=\"edit_model_type\" /></p>","</fieldset>","</form>");
callback=function(form){
var _a93=form.elements["title"].value.strip();
_a93=_a93.length==0?_a90.title:_a93;
window.document.title=_a93+" - Oryx";
var _a94=form.elements["summary"].value.strip();
_a94=_a94.length==0?_a90.summary:_a94;
var _a95=form.elements["namespace"].value.strip();
_a95=_a95.length==0?_a90.namespace:_a95;
win.destroy();
this.sendSaveRequest(_a8b,{data:this.serializedDOM,svg:_a8f,title:_a93,summary:_a94,type:_a95},_a8a);
}.bind(this);
win=new Ext.Window({id:"Propertie_Window",width:"auto",height:"auto",title:ORYX.I18N.Save.saveAsTitle,modal:true,bodyStyle:"background:#FFFFFF",html:_a91.apply(_a90),buttons:[{text:ORYX.I18N.Save.saveBtn,handler:function(){
callback($("edit_model"));
}},{text:ORYX.I18N.Save.close,handler:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
win.destroy();
}.bind(this)}]});
win.show();
}else{
this.sendSaveRequest(_a8b,{data:this.serializedDOM,svg:_a8f});
}
},sendSaveRequest:function(url,_a97,_a98){
new Ajax.Request(url,{method:"POST",asynchronous:false,parameters:_a97,onSuccess:(function(_a99){
var loc=_a99.getResponseHeader("location");
if(!this.processURI&&loc){
this.processURI=loc;
}
if(_a98){
var _a9b=new Ext.Window({title:ORYX.I18N.Save.savedAs,bodyStyle:"background:white;padding:10px",width:"auto",height:"auto",html:"<div style='font-weight:bold;margin-bottom:10px'>The process diagram is stored under:</div><span><a href='"+loc+"' target='_blank'>"+loc+"</a></span>",buttons:[{text:"Ok",handler:function(){
_a9b.destroy();
}}]});
_a9b.show();
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_STATUS,text:ORYX.I18N.Save.saved});
}).bind(this),onFailure:(function(_a9c){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",ORYX.I18N.Save.failed);
ORYX.log.warn("Saving failed: "+_a9c.responseText);
}).bind(this),on403:(function(_a9d){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",ORYX.I18N.Save.noRights);
ORYX.log.warn("Saving failed: "+_a9d.responseText);
}).bind(this)});
},save:function(_a9e,_a9f){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_MODEL_BEFORE_SAVE,forceNew:_a9e});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.Save.saving});
window.setTimeout((function(){
this.saveSynchronously(_a9e);
}).bind(this),10);
return true;
}});
ORYX.Plugins.File=Clazz.extend({facade:undefined,construct:function(_aa0){
this.facade=_aa0;
this.facade.offer({"name":ORYX.I18N.File.print,"functionality":this.print.bind(this),"group":ORYX.I18N.File.group,"icon":ORYX.PATH+"images/printer.png","description":ORYX.I18N.File.printDesc,"index":3,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.File.pdf,"functionality":this.exportPDF.bind(this),"group":ORYX.I18N.File.group,"icon":ORYX.PATH+"images/page_white_acrobat.png","description":ORYX.I18N.File.pdfDesc,"index":4,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.File.info,"functionality":this.info.bind(this),"group":ORYX.I18N.File.group,"icon":ORYX.PATH+"images/information.png","description":ORYX.I18N.File.infoDesc,"index":5,"minShape":0,"maxShape":0});
},info:function(){
var info="<iframe src=\""+ORYX.CONFIG.LICENSE_URL+"\" type=\"text/plain\" "+"style=\"border:none;display:block;width:575px;height:460px;\"/>"+"\n\n<pre style=\"display:inline;\">Version: </pre>"+"<iframe src=\""+ORYX.CONFIG.VERSION_URL+"\" type=\"text/plain\" "+"style=\"border:none;overflow:hidden;display:inline;width:40px;height:20px;\"/>";
this.infoBox=Ext.Msg.show({title:"Oryx",msg:info,width:640,maxWidth:640,maxHeight:480,buttons:Ext.MessageBox.OK});
return false;
},exportPDF:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.File.genPDF});
var _aa2=location.href;
var _aa3=this.facade.getCanvas().getSVGRepresentation(true);
var _aa4=DataManager.serialize(_aa3);
new Ajax.Request(ORYX.CONFIG.PDF_EXPORT_URL,{method:"POST",parameters:{resource:_aa2,data:_aa4,format:"pdf"},onSuccess:(function(_aa5){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
window.open(_aa5.responseText);
}).bind(this),onFailure:(function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",ORYX.I18N.File.genPDFFailed);
}).bind(this)});
},print:function(){
Ext.Msg.show({title:ORYX.I18N.File.printTitle,msg:ORYX.I18N.File.printMsg,buttons:Ext.Msg.YESNO,icon:Ext.MessageBox.QUESTION,fn:function(btn){
if(btn=="yes"){
var _aa7=$H({width:300,height:400,toolbar:"no",status:"no",menubar:"yes",dependent:"yes",resizable:"yes",scrollbars:"yes"});
var _aa8=window.open("","PrintWindow",_aa7.invoke("join","=").join(","));
var head=_aa8.document.getElementsByTagName("head")[0];
var _aaa=document.createElement("style");
_aaa.innerHTML=" body {padding:0px; margin:0px} .svgcontainer { display:none; }";
head.appendChild(_aaa);
_aa8.document.getElementsByTagName("body")[0].appendChild(this.facade.getCanvas().getSVGRepresentation());
var svg=_aa8.document.getElementsByTagName("body")[0].getElementsByTagName("svg")[0];
svg.setAttributeNS(null,"width",1100);
svg.setAttributeNS(null,"height",1400);
svg.lastChild.setAttributeNS(null,"transform","scale(0.47, 0.47) rotate(270, 1510, 1470)");
var _aac=["marker-start","marker-mid","marker-end"];
var path=$A(_aa8.document.getElementsByTagName("path"));
path.each(function(_aae){
_aac.each(function(_aaf){
var url=_aae.getAttributeNS(null,_aaf);
if(!url){
return;
}
url="url(about:blank#"+url.slice(5);
_aae.setAttributeNS(null,_aaf,url);
});
});
_aa8.print();
return true;
}
}.bind(this)});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Grouping=Clazz.extend({facade:undefined,construct:function(_ab1){
this.facade=_ab1;
this.facade.offer({"name":ORYX.I18N.Grouping.group,"functionality":this.createGroup.bind(this),"group":ORYX.I18N.Grouping.grouping,"icon":ORYX.PATH+"images/shape_group.png","description":ORYX.I18N.Grouping.groupDesc,"index":1,"minShape":2,"isEnabled":this.isEnabled.bind(this,false)});
this.facade.offer({"name":ORYX.I18N.Grouping.ungroup,"functionality":this.deleteGroup.bind(this),"group":ORYX.I18N.Grouping.grouping,"icon":ORYX.PATH+"images/shape_ungroup.png","description":ORYX.I18N.Grouping.ungroupDesc,"index":2,"minShape":2,"isEnabled":this.isEnabled.bind(this,true)});
this.selectedElements=[];
this.groups=[];
},isEnabled:function(_ab2){
var _ab3=this.selectedElements;
return _ab2===this.groups.any(function(_ab4){
return _ab4.length===_ab3.length&&_ab4.all(function(grEl){
return _ab3.member(grEl);
});
});
},onSelectionChanged:function(_ab6){
var _ab7=_ab6.elements;
this.selectedElements=this.groups.findAll(function(_ab8){
return _ab8.any(function(grEl){
return _ab7.member(grEl);
});
});
this.selectedElements.push(_ab7);
this.selectedElements=this.selectedElements.flatten().uniq();
if(this.selectedElements.length!==_ab7.length){
this.facade.setSelection(this.selectedElements);
}
},createGroup:function(){
var _aba=this.facade.getSelection();
var _abb=ORYX.Core.Command.extend({construct:function(_abc,_abd,_abe,_abf){
this.selectedElements=_abc;
this.groups=_abd;
this.callback=_abe;
this.facade=_abf;
},execute:function(){
var g=this.groups.findAll(function(_ac1){
return !_ac1.any(function(grEl){
return _aba.member(grEl);
});
});
g.push(_aba);
this.callback(g.clone());
this.facade.setSelection(this.selectedElements);
},rollback:function(){
this.callback(this.groups.clone());
this.facade.setSelection(this.selectedElements);
}});
var _ac3=new _abb(_aba,this.groups.clone(),this.setGroups.bind(this),this.facade);
this.facade.executeCommands([_ac3]);
},deleteGroup:function(){
var _ac4=this.facade.getSelection();
var _ac5=ORYX.Core.Command.extend({construct:function(_ac6,_ac7,_ac8,_ac9){
this.selectedElements=_ac6;
this.groups=_ac7;
this.callback=_ac8;
this.facade=_ac9;
},execute:function(){
var _aca=this.groups.partition(function(_acb){
return _acb.length!==_ac4.length||!_acb.all(function(grEl){
return _ac4.member(grEl);
});
});
this.callback(_aca[0]);
this.facade.setSelection(this.selectedElements);
},rollback:function(){
this.callback(this.groups.clone());
this.facade.setSelection(this.selectedElements);
}});
var _acd=new _ac5(_ac4,this.groups.clone(),this.setGroups.bind(this),this.facade);
this.facade.executeCommands([_acd]);
},setGroups:function(_ace){
this.groups=_ace;
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.IBPMN2BPMN=Clazz.extend({facade:undefined,TransformServletURL:"./ibpmn2bpmn",construct:function(_acf){
this.facade=_acf;
this.facade.offer({"name":"Transform from iBPMN to BPMN","functionality":this.transform.bind(this),"group":"Transform","icon":ORYX.PATH+"images/erdf_export_icon.png","description":"Transformation from iBPMN to BPMN","index":0,"minShape":0,"maxShape":0});
},transform:function(){
this._showImportDialog();
},sendRequest:function(url,_ad1,_ad2,_ad3){
var suc=false;
new Ajax.Request(url,{method:"POST",asynchronous:false,parameters:_ad1,onSuccess:function(_ad5){
suc=true;
if(_ad2){
_ad2(_ad5.responseText);
}
}.bind(this),onFailure:function(_ad6){
if(_ad3){
_ad3();
}else{
Ext.Msg.alert("Oryx",ORYX.I18N.ERDFSupport.impFailed);
ORYX.log.warn("Transform failed: "+_ad6.responseText);
}
}.bind(this)});
return suc;
},transformToBPMN:function(_ad7,_ad8,_ad9){
var s=_ad7;
s=s.startsWith("<?xml")?s:"<?xml version=\"1.0\" encoding=\"utf-8\"?>"+s+"";
var _adb=new DOMParser();
var doc=_adb.parseFromString(s,"text/xml");
if(doc.firstChild.tagName=="parsererror"){
Ext.MessageBox.show({title:"Parse Error",msg:"The given RDF is not xml valid.",buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
if(_ad9){
_ad9();
}
}else{
var _add=function(e){
e="<?xml version=\"1.0\" encoding=\"utf-8\"?><div>"+e+"</div>";
var _adf=new DOMParser();
var doc=_adf.parseFromString(e,"text/xml");
this.facade.importERDF(doc);
}.bind(this);
var _adb=new DOMParser();
var _ae1=_adb.parseFromString(s,"text/xml");
var _ae2=ORYX.PATH+"lib/extract-rdf.xsl";
var _ae3=new XSLTProcessor();
var _ae4=document.implementation.createDocument("","",null);
_ae4.async=false;
_ae4.load(_ae2);
_ae3.importStylesheet(_ae4);
try{
var rdf=_ae3.transformToDocument(_ae1);
var _ae6=(new XMLSerializer()).serializeToString(rdf);
if(!_ae6.startsWith("<?xml")){
_ae6="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_ae6;
}
this.sendRequest(this.TransformServletURL,{data:_ae6},_add);
}
catch(e){
}
if(_ad8){
_ad8();
}
}
},_showImportDialog:function(_ae7){
var form=new Ext.form.FormPanel({baseCls:"x-plain",labelWidth:50,defaultType:"textfield",items:[{text:ORYX.I18N.ERDFSupport.selectFile,style:"font-size:12px;margin-bottom:10px;display:block;",anchor:"100%",xtype:"label"},{fieldLabel:ORYX.I18N.ERDFSupport.file,name:"subject",inputType:"file",style:"margin-bottom:10px;display:block;",itemCls:"ext_specific_window_overflow"},{xtype:"textarea",hideLabel:true,name:"msg",anchor:"100% -63"}]});
var _ae9=new Ext.Window({autoCreate:true,layout:"fit",plain:true,bodyStyle:"padding:5px;",title:ORYX.I18N.ERDFSupport.impERDF,height:350,width:500,modal:true,fixedcenter:true,shadow:true,proxyDrag:true,resizable:true,items:[form],buttons:[{text:ORYX.I18N.ERDFSupport.impBtn,handler:function(){
var _aea=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.ERDFSupport.impProgress});
_aea.show();
window.setTimeout(function(){
var _aeb=form.items.items[2].getValue();
this.transformToBPMN(_aeb,function(){
_aea.hide();
_ae9.hide();
}.bind(this),function(){
_aea.hide();
}.bind(this));
}.bind(this),100);
}.bind(this)},{text:ORYX.I18N.ERDFSupport.close,handler:function(){
_ae9.hide();
}.bind(this)}]});
_ae9.on("hide",function(){
_ae9.destroy(true);
delete _ae9;
});
_ae9.show();
form.items.items[1].getEl().dom.addEventListener("change",function(evt){
var text=evt.target.files[0].getAsBinary();
form.items.items[2].setValue(text);
},true);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Loading={construct:function(_aee){
this.facade=_aee;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.facade.getCanvas().getHTMLContainer().parentNode,["div",{"class":"LoadingIndicator"},""]);
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADING_ENABLE,this.enableLoading.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADING_DISABLE,this.disableLoading.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADING_STATUS,this.showStatus.bind(this));
this.disableLoading();
},enableLoading:function(_aef){
if(_aef.text){
this.node.innerHTML=_aef.text+"...";
}else{
this.node.innerHTML=ORYX.I18N.Loading.waiting;
}
this.node.removeClassName("StatusIndicator");
this.node.addClassName("LoadingIndicator");
this.node.style.display="block";
var pos=this.facade.getCanvas().rootNode.parentNode.parentNode.parentNode.parentNode;
this.node.style.top=pos.offsetTop+"px";
this.node.style.left=pos.offsetLeft+"px";
},disableLoading:function(){
this.node.style.display="none";
},showStatus:function(_af1){
if(_af1.text){
this.node.innerHTML=_af1.text;
this.node.addClassName("StatusIndicator");
this.node.removeClassName("LoadingIndicator");
this.node.style.display="block";
var pos=this.facade.getCanvas().rootNode.parentNode.parentNode.parentNode.parentNode;
this.node.style.top=pos.offsetTop+"px";
this.node.style.left=pos.offsetLeft+"px";
var tout=_af1.timeout?_af1.timeout:2000;
window.setTimeout((function(){
this.disableLoading();
}).bind(this),tout);
}
}};
ORYX.Plugins.Loading=Clazz.extend(ORYX.Plugins.Loading);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Overlay=Clazz.extend({facade:undefined,styleNode:undefined,construct:function(_af4){
this.facade=_af4;
this.changes=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_SHOW,this.show.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_OVERLAY_HIDE,this.hide.bind(this));
this.styleNode=document.createElement("style");
this.styleNode.setAttributeNS(null,"type","text/css");
document.getElementsByTagName("head")[0].appendChild(this.styleNode);
},show:function(_af5){
if(!_af5||!_af5.shapes||!_af5.shapes instanceof Array||!_af5.id||!_af5.id instanceof String||_af5.id.length==0){
return;
}
if(_af5.attributes){
_af5.shapes.each(function(el){
if(!el instanceof ORYX.Core.Shape){
return;
}
this.setAttributes(el.node,_af5.attributes);
}.bind(this));
}
if(_af5.node&&_af5.node instanceof SVGElement){
_af5["_temps"]=[];
_af5.shapes.each(function(el,_af8){
if(!el instanceof ORYX.Core.Shape){
return;
}
var _af9={};
_af9.svg=_af5.dontCloneNode?_af5.node:_af5.node.cloneNode(true);
el.node.firstChild.appendChild(_af9.svg);
if(el instanceof ORYX.Core.Edge&&!_af5.nodePosition){
_af5["nodePosition"]="START";
}
if(_af5.nodePosition){
var b=el.bounds;
var p=_af5.nodePosition.toUpperCase();
if(el instanceof ORYX.Core.Node&&p=="START"){
p="NW";
}else{
if(el instanceof ORYX.Core.Node&&p=="END"){
p="SE";
}else{
if(el instanceof ORYX.Core.Edge&&p=="START"){
b=el.getDockers().first().bounds;
}else{
if(el instanceof ORYX.Core.Edge&&p=="END"){
b=el.getDockers().last().bounds;
}
}
}
}
_af9.callback=function(){
var x=0;
var y=0;
if(p=="NW"){
}else{
if(p=="N"){
x=b.width()/2;
}else{
if(p=="NE"){
x=b.width();
}else{
if(p=="E"){
x=b.width();
y=b.height()/2;
}else{
if(p=="SE"){
x=b.width();
y=b.height();
}else{
if(p=="S"){
x=b.width()/2;
y=b.height();
}else{
if(p=="SW"){
y=b.height();
}else{
if(p=="W"){
y=b.height()/2;
}else{
if(p=="START"||p=="END"){
x=b.width()/2;
y=b.height()/2;
}else{
return;
}
}
}
}
}
}
}
}
}
if(el instanceof ORYX.Core.Edge){
x+=b.upperLeft().x;
y+=b.upperLeft().y;
}
_af9.svg.setAttributeNS(null,"transform","translate("+x+", "+y+")");
}.bind(this);
_af9.element=el;
_af9.callback();
b.registerCallback(_af9.callback);
}
_af5._temps.push(_af9);
}.bind(this));
}
if(!this.changes[_af5.id]){
this.changes[_af5.id]=[];
}
this.changes[_af5.id].push(_af5);
},hide:function(_afe){
if(!_afe||!_afe.id||!_afe.id instanceof String||_afe.id.length==0||!this.changes[_afe.id]){
return;
}
this.changes[_afe.id].each(function(_aff){
_aff.shapes.each(function(el,_b01){
if(!el instanceof ORYX.Core.Shape){
return;
}
this.deleteAttributes(el.node);
}.bind(this));
if(_aff._temps){
_aff._temps.each(function(tmp){
if(tmp.svg&&tmp.svg.parentNode){
tmp.svg.parentNode.removeChild(tmp.svg);
}
if(tmp.callback&&tmp.element){
tmp.element.bounds.unregisterCallback(tmp.callback);
}
}.bind(this));
}
}.bind(this));
this.changes[_afe.id]=null;
},setAttributes:function(node,_b04){
var _b05=this.getAllChilds(node.firstChild.firstChild);
var ids=[];
_b05.each(function(e){
ids.push($A(e.attributes).findAll(function(attr){
return attr.nodeValue.startsWith("url(#");
}));
});
ids=ids.flatten().compact();
ids=ids.collect(function(s){
return s.nodeValue;
}).uniq();
ids=ids.collect(function(s){
return s.slice(5,s.length-1);
});
ids.unshift(node.id+" .me");
var attr=$H(_b04);
var _b0c=attr.toJSON().gsub(",",";").gsub("\"","");
var _b0d=_b04.stroke?_b0c.slice(0,_b0c.length-1)+"; fill:"+_b04.stroke+";}":_b0c;
var _b0e;
if(_b04.fill){
_b04.fill="black";
_b0e=$H(_b04).toJSON().gsub(",",";").gsub("\"","");
}
csstags=ids.collect(function(s,i){
return "#"+s+" * "+(!i?_b0c:_b0d)+""+(_b0e?" #"+s+" text * "+_b0e:"");
});
var s=csstags.join(" ")+"\n";
this.styleNode.innerHTML+=s;
},deleteAttributes:function(node){
var el=this.styleNode.innerHTML.split("\n");
el=el.findAll(function(e){
return !e.startsWith("#"+node.id);
});
this.styleNode.innerHTML=el.join("\n");
},getAllChilds:function(node){
var _b16=$A(node.childNodes);
$A(node.childNodes).each(function(e){
_b16.push(this.getAllChilds(e));
}.bind(this));
return _b16.flatten();
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.OverlayExample=Clazz.extend({facade:undefined,construct:function(_b18){
this.facade=_b18;
this.active=false;
this.el=undefined;
this.callback=undefined;
this.facade.offer({"name":"Overlay Test","functionality":this.testing.bind(this),"group":"Overlay","icon":ORYX.PATH+"images/disk.png","description":"Overlay Test","index":1,"minShape":0,"maxShape":0});
},testing:function(){
if(this.active){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"overlaytest.test"});
}else{
var els=this.facade.getCanvas().getChildShapes(true);
this.el=els[0];
this.showOverlay(this.el);
}
this.active=!this.active;
if(this.active){
this.callback=this.doMouseUp.bind(this);
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEUP,this.callback);
}else{
this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_MOUSEUP,this.callback);
this.callback=undefined;
}
},doMouseUp:function(_b1a,arg){
if(arg instanceof ORYX.Core.Shape&&arg!=this.el){
this.el=arg;
this.showOverlay(this.el);
}
},showOverlay:function(_b1c){
var _b1d=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"stroke-width":5,"stroke":"red","d":"M0,0 L-15,-15 M-15,0 L0,-15","line-captions":"round"}]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"overlaytest.test",shapes:[_b1c],attributes:{fill:"red",stroke:"green","stroke-width":4},node:_b1d,nodePosition:_b1c instanceof ORYX.Core.Edge?"START":"NE"});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
function gup(name){
name=name.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");
var _b1f="[\\?&]"+name+"=([^&#]*)";
var _b20=new RegExp(_b1f);
var _b21=_b20.exec(window.location.href);
if(_b21==null){
return "";
}else{
return _b21[1];
}
}
ORYX.Plugins.Pnmlexport=Clazz.extend({facade:undefined,construct:function(_b22){
this.facade=_b22;
this.facade.offer({"name":ORYX.I18N.Pnmlexport.name,"functionality":this.exportIt.bind(this),"group":ORYX.I18N.Pnmlexport.group,"icon":ORYX.PATH+"images/bpmn2pn_deploy.png","description":ORYX.I18N.Pnmlexport.desc,"index":2,"minShape":0,"maxShape":0});
},exportIt:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _b23=location.href;
var _b24=DataManager.__persistDOM(this.facade);
_b24="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_b24+"</body></html>";
var _b25=new DOMParser();
var _b26=_b25.parseFromString(_b24,"text/xml");
var _b27=ORYX.PATH+"lib/extract-rdf.xsl";
var _b28=new XSLTProcessor();
var _b29=document.implementation.createDocument("","",null);
_b29.async=false;
_b29.load(_b27);
_b28.importStylesheet(_b29);
try{
var rdf=_b28.transformToDocument(_b26);
var _b2b=(new XMLSerializer()).serializeToString(rdf);
var _b2c=gup("resource");
new Ajax.Request(ORYX.CONFIG.PNML_EXPORT_URL,{method:"POST",asynchronous:false,parameters:{resource:_b23,data:_b2b,title:_b2c},onSuccess:function(_b2d){
var _b2e=_b2d.responseText;
if(_b2e.indexOf("RDF to BPMN failed with Exception:")==0){
alert(_b2e);
}else{
var _b2f="http://"+location.host+"/oryx/"+_b2e;
var _b30="<h2>Process: "+self.document.title+"</h2><a target=\"_blank\" href=\""+_b2f;
var win=new Ext.Window({width:320,height:240,resizable:false,minimizable:false,modal:true,autoScroll:true,title:"Deployment successful",html:_b30,buttons:[{text:"OK",handler:function(){
win.hide();
}}]});
win.show();
}
}});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
alert(error);
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.ProcessLink=Clazz.extend({facade:undefined,construct:function(_b32){
this.facade=_b32;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_PROPERTY_CHANGED,this.propertyChanged.bind(this));
},propertyChanged:function(_b33,node){
if(_b33.name!=="oryx-refuri"||!node instanceof ORYX.Core.Node){
return;
}
if(_b33.value&&_b33.value.length>0&&_b33.value!="undefined"){
this.show(node,_b33.value);
}else{
this.hide(node);
}
},show:function(_b35,url){
var link=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["a",{"target":"_blank"},["path",{"stroke-width":1,"stroke":"#00DD00","fill":"#00AA00","d":"M3,3 l0,-2.5 l7.5,0 l0,-2.5 l7.5,4.5 l-7.5,3.5 l0,-2.5 l-8,0","line-captions":"round"}]]);
var link=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["a",{"target":"_blank"},["path",{"style":"fill:none;stroke-width:0.5px; stroke:#000000","d":"M7,4 l0,2"}],["path",{"style":"fill:none;stroke-width:0.5px; stroke:#000000","d":"M4,8 l-2,0 l0,6"}],["path",{"style":"fill:none;stroke-width:0.5px; stroke:#000000","d":"M10,8 l2,0 l0,6"}],["rect",{"style":"fill:#96ff96;stroke:#000000;stroke-width:1","width":6,"height":4,"x":4,"y":0}],["rect",{"style":"fill:#ffafff;stroke:#000000;stroke-width:1","width":6,"height":4,"x":4,"y":6}],["rect",{"style":"fill:#96ff96;stroke:#000000;stroke-width:1","width":6,"height":4,"x":0,"y":12}],["rect",{"style":"fill:#96ff96;stroke:#000000;stroke-width:1","width":6,"height":4,"x":8,"y":12}],["rect",{"style":"fill:none;stroke:none;pointer-events:all","width":14,"height":16,"x":0,"y":0}]]);
link.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",url);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"arissupport.urlref_"+_b35.id,shapes:[_b35],node:link,nodePosition:"SE"});
},hide:function(_b38){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"arissupport.urlref_"+_b38.id});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.PropertyWindow={facade:undefined,construct:function(_b39){
this.facade=_b39;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_SHOW_PROPERTYWINDOW,this.init.bind(this));
this.init();
},init:function(){
this.currentElement=undefined;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",null,["div"]);
this.currentDateFormat;
this.properties=[];
this.columnModel=new Ext.grid.ColumnModel([{header:ORYX.I18N.PropertyWindow.name,dataIndex:"name",width:90,sortable:true},{header:ORYX.I18N.PropertyWindow.value,dataIndex:"value",id:"propertywindow_column_value",width:90,editor:new Ext.form.TextField({allowBlank:false}),renderer:this.renderer.bind(this)}]);
this.dataSource=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(this.properties),reader:new Ext.data.ArrayReader({},[{name:"name"},{name:"value"},{name:"gridProperties"}])});
this.dataSource.load();
this.grid=new Ext.grid.EditorGridPanel({clicksToEdit:1,stripeRows:true,autoExpandColumn:"propertywindow_column_value",width:"auto",colModel:this.columnModel,store:this.dataSource});
region=this.facade.addToRegion("east",new Ext.Panel({width:200,layout:"fit",border:false,items:[this.grid]}),ORYX.I18N.PropertyWindow.title);
this.grid.on("beforeedit",this.beforeEdit,this,true);
this.grid.on("afteredit",this.afterEdit,this,true);
this.grid.enableColumnMove=false;
},specialKeyDown:function(_b3a,_b3b){
if(_b3a instanceof Ext.form.TextArea&&_b3b.button==ORYX.CONFIG.KEY_Code_enter){
return false;
}
},renderer:function(_b3c){
if(_b3c instanceof Date){
_b3c=_b3c.dateFormat(ORYX.I18N.PropertyWindow.dateFormat);
}else{
if(String(_b3c).search("<a href='")<0){
_b3c=String(_b3c).gsub("<","&lt;");
_b3c=String(_b3c).gsub(">","&gt;");
_b3c=String(_b3c).gsub("%","&#37;");
_b3c=String(_b3c).gsub("&","&amp;");
}
}
return _b3c;
},beforeEdit:function(_b3d){
var _b3e=this.dataSource.getAt(_b3d.row).data.gridProperties.editor;
var _b3f=this.dataSource.getAt(_b3d.row).data.gridProperties.renderer;
if(_b3e){
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
_b3d.grid.getColumnModel().setEditor(1,_b3e);
_b3e.render(this.grid);
_b3e.setSize(_b3d.grid.getColumnModel().getColumnWidth(1),_b3e.height);
}else{
return false;
}
},afterEdit:function(_b40){
_b40.grid.getStore().commitChanges();
var name=_b40.record.data.gridProperties.propId;
var _b42=this.currentElement;
var _b43=_b42.properties[name];
var _b44=_b40.value;
var _b45=this.facade;
console.log(_b44);
var _b46=ORYX.Core.Command.extend({construct:function(){
this.el=_b42;
this.oldValue=_b43;
this.newValue=_b44;
this.facade=_b45;
},execute:function(){
this.el.setProperty(name,this.newValue);
this.facade.getCanvas().update();
this.facade.setSelection([this.el]);
},rollback:function(){
this.el.setProperty(name,this.oldValue);
this.facade.getCanvas().update();
this.facade.setSelection([this.el]);
}});
var _b47=new _b46();
this.facade.executeCommands([_b47]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:this.currentElement,name:name,value:_b40.value});
},dialogClosed:function(_b48){
this.scope.grid.startEditing(this.row,this.col);
},onSelectionChanged:function(_b49){
var _b4a=_b49.elements.length==1?_b49.elements.first():undefined;
_b4a=!_b4a&&_b49.subSelection?_b49.subSelection:_b4a;
_b4a=!_b4a?this.facade.getCanvas():_b4a;
this.createProperties(_b4a);
},createProperties:function(_b4b){
this.grid.stopEditing();
this.currentElement=_b4b;
this.properties=[];
if(this.currentElement){
var ce=this.currentElement;
this.currentElement.getStencil().properties().each((function(pair,_b4e){
var key=pair.prefix()+"-"+pair.id();
var name=pair.title();
var _b51=ce.properties[key];
var _b52=undefined;
var _b53=null;
if(!pair.readonly()){
switch(pair.type()){
case ORYX.CONFIG.TYPE_STRING:
if(pair.wrapLines()){
_b52=new Ext.Editor(new Ext.form.TextArea({alignment:"tl-tl",allowBlank:pair.optional(),msgTarget:"title",maxLength:pair.length()}));
}else{
_b52=new Ext.Editor(new Ext.form.TextField({allowBlank:pair.optional(),msgTarget:"title",maxLength:pair.length()}));
}
break;
case ORYX.CONFIG.TYPE_BOOLEAN:
_b52=new Ext.Editor(new Ext.form.Checkbox());
break;
case ORYX.CONFIG.TYPE_INTEGER:
_b52=new Ext.Editor(new Ext.form.NumberField({allowBlank:pair.optional(),allowDecimals:false,msgTarget:"title",minValue:pair.min(),maxValue:pair.max()}));
break;
case ORYX.CONFIG.TYPE_FLOAT:
_b52=new Ext.Editor(new Ext.form.NumberField({allowBlank:pair.optional(),allowDecimals:true,msgTarget:"title",minValue:pair.min(),maxValue:pair.max()}));
break;
case ORYX.CONFIG.TYPE_COLOR:
_b52=new Ext.Editor(new Ext.ux.ColorField({allowBlank:pair.optional(),msgTarget:"title"}));
break;
case ORYX.CONFIG.TYPE_CHOICE:
var _b54=pair.items();
var _b55=["select",{style:"display:none"}];
_b54.each(function(_b56){
_b55.push(["option",{value:_b56.value()},_b56.value()]);
});
var _b57=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",null,_b55);
_b52=new Ext.Editor(new Ext.form.ComboBox({typeAhead:true,triggerAction:"all",transform:_b57,lazyRender:true,msgTarget:"title"}));
break;
case ORYX.CONFIG.TYPE_DATE:
var _b58=ORYX.I18N.PropertyWindow.dateFormat;
if(!(_b51 instanceof Date)){
_b51=Date.parseDate(_b51,_b58);
}
_b52=new Ext.Editor(new Ext.form.DateField({allowBlank:pair.optional(),format:_b58,msgTarget:"title"}));
break;
case ORYX.CONFIG.TYPE_TEXT:
var cf=new Ext.form.ComplexTextField({allowBlank:pair.optional(),dataSource:this.dataSource,grid:this.grid,row:_b4e,facade:this.facade});
cf.on("dialogClosed",this.dialogClosed,{scope:this,row:_b4e,col:1});
_b52=new Ext.Editor(cf);
break;
case ORYX.CONFIG.TYPE_COMPLEX:
var cf=new Ext.form.ComplexListField({allowBlank:pair.optional()},pair.complexItems(),key,this.facade);
cf.on("dialogClosed",this.dialogClosed,{scope:this,row:_b4e,col:1});
_b52=new Ext.Editor(cf);
break;
default:
_b52=new Ext.Editor(new Ext.form.TextField({allowBlank:pair.optional(),msgTarget:"title",maxLength:pair.length()}));
}
_b52.on("beforehide",this.facade.enableEvent.bind(this,ORYX.CONFIG.EVENT_KEYDOWN));
_b52.on("specialkey",this.specialKeyDown.bind(this));
}else{
if(pair.type()===ORYX.CONFIG.TYPE_URL){
_b51=String(_b51).search("http")!==0?("http://"+_b51):_b51;
_b51="<a href='"+_b51+"' target='_blank'>"+_b51.split("://")[1]+"</a>";
}
}
this.properties.push([name,_b51,{editor:_b52,propId:key,type:pair.type(),renderer:_b53}]);
}).bind(this));
}
this.setProperties(this.properties);
},setProperties:function(_b5a){
this.dataSource.loadData(_b5a);
}};
ORYX.Plugins.PropertyWindow=Clazz.extend(ORYX.Plugins.PropertyWindow);
Ext.form.ComplexListField=function(_b5b,_b5c,key,_b5e){
Ext.form.ComplexListField.superclass.constructor.call(this,_b5b);
this.items=_b5c;
this.key=key;
this.facade=_b5e;
};
Ext.extend(Ext.form.ComplexListField,Ext.form.TriggerField,{triggerClass:"x-form-complex-trigger",readOnly:true,emptyText:ORYX.I18N.PropertyWindow.clickIcon,buildValue:function(){
var ds=this.grid.getStore();
ds.commitChanges();
if(ds.getCount()==0){
return "";
}
var _b60="[";
for(var i=0;i<ds.getCount();i++){
var data=ds.getAt(i);
_b60+="{";
for(var j=0;j<this.items.length;j++){
var key=this.items[j].id();
_b60+=key+":"+data.get(key).toJSON();
if(j<(this.items.length-1)){
_b60+=", ";
}
}
_b60+="}";
if(i<(ds.getCount()-1)){
_b60+=", ";
}
}
_b60+="]";
_b60="{'totalCount':"+ds.getCount().toJSON()+", 'items':"+_b60+"}";
return _b60;
},getFieldKey:function(){
return this.key;
},getValue:function(){
if(this.grid){
return this.buildValue();
}else{
if(this.data==undefined){
return "";
}else{
return this.data;
}
}
},setValue:function(_b65){
if(_b65.length>0){
if(this.data==undefined){
this.data=_b65;
}
}
},keydownHandler:function(_b66){
return false;
},dialogListeners:{show:function(){
this.onFocus();
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keydownHandler.bind(this));
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
return;
},hide:function(){
var dl=this.dialogListeners;
this.dialog.un("show",dl.show,this);
this.dialog.un("hide",dl.hide,this);
this.dialog.destroy(true);
this.grid.destroy(true);
delete this.grid;
delete this.dialog;
this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keydownHandler.bind(this));
this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
this.fireEvent("dialogClosed");
Ext.form.ComplexListField.superclass.setValue.call(this,this.data);
}},buildInitial:function(_b68,_b69){
var _b6a=new Hash();
for(var i=0;i<_b69.length;i++){
var id=_b69[i].id();
_b6a[id]=_b69[i].value();
}
var _b6d=Ext.data.Record.create(_b68);
return new _b6d(_b6a);
},buildColumnModel:function(_b6e){
var cols=[];
for(var i=0;i<this.items.length;i++){
var id=this.items[i].id();
var _b72=this.items[i].name();
var _b73=this.items[i].width();
var type=this.items[i].type();
var _b75;
if(type==ORYX.CONFIG.TYPE_STRING){
_b75=new Ext.form.TextField({allowBlank:this.items[i].optional()});
}else{
if(type==ORYX.CONFIG.TYPE_CHOICE){
var _b76=this.items[i].items();
var _b77=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",_b6e,["select",{style:"display:none"}]);
var _b78=new Ext.Template("<option value=\"{value}\">{value}</option>");
_b76.each(function(_b79){
_b78.append(_b77,{value:_b79.value()});
});
_b75=new Ext.form.ComboBox({typeAhead:true,triggerAction:"all",transform:_b77,lazyRender:true,msgTarget:"title"});
}else{
if(type==ORYX.CONFIG.TYPE_BOOLEAN){
_b75=new Ext.form.Checkbox();
}
}
}
cols.push({id:id,header:_b72,dataIndex:id,resizable:true,editor:_b75});
}
return new Ext.grid.ColumnModel(cols);
},afterEdit:function(_b7a){
_b7a.grid.getStore().commitChanges();
},beforeEdit:function(_b7b){
var _b7c=this.grid.getView().getScrollState();
var col=_b7b.column;
var row=_b7b.row;
var _b7f=this.grid.getColumnModel().config[col].id;
for(var i=0;i<this.items.length;i++){
var item=this.items[i];
var _b82=item.disable();
if(_b82!=undefined){
var _b83=this.grid.getStore().getAt(row).get(item.id());
for(var j=0;j<_b82.length;j++){
var _b85=_b82[j];
if(_b85.value==_b83){
for(var k=0;k<_b85.items.length;k++){
var _b87=_b85.items[k];
if(_b87==_b7f){
this.grid.getColumnModel().getCellEditor(col,row).disable();
return;
}
}
}
}
}
}
this.grid.getColumnModel().getCellEditor(col,row).enable();
},onTriggerClick:function(){
if(this.disabled){
return;
}
var _b88=0;
var _b89=[];
for(var i=0;i<this.items.length;i++){
var id=this.items[i].id();
var _b8c=this.items[i].width();
var type=this.items[i].type();
if(type==ORYX.CONFIG.TYPE_CHOICE){
type=ORYX.CONFIG.TYPE_STRING;
}
_b88+=_b8c;
_b89[i]={name:id,type:type};
}
if(_b88>800){
_b88=800;
}
_b88+=22;
var data=this.data;
if(data==""){
data="{}";
}
var ds=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(eval("("+data+")")),reader:new Ext.data.JsonReader({root:"items",totalProperty:"totalCount"},_b89)});
ds.load();
var cm=this.buildColumnModel();
this.grid=new Ext.grid.EditorGridPanel({store:ds,cm:cm,stripeRows:true,clicksToEdit:1,autoHeight:true,selModel:new Ext.grid.CellSelectionModel()});
var _b91=new Ext.Toolbar([{text:ORYX.I18N.PropertyWindow.add,handler:function(){
var ds=this.grid.getStore();
var _b93=ds.getCount();
this.grid.stopEditing();
var p=this.buildInitial(_b89,this.items);
ds.insert(_b93,p);
ds.commitChanges();
this.grid.startEditing(_b93,0);
}.bind(this)},{text:ORYX.I18N.PropertyWindow.rem,handler:function(){
var ds=this.grid.getStore();
var _b96=this.grid.getSelectionModel().getSelectedCell();
if(_b96==undefined){
return;
}
this.grid.getSelectionModel().clearSelections();
this.grid.stopEditing();
var _b97=ds.getAt(_b96[0]);
ds.remove(_b97);
ds.commitChanges();
}.bind(this)}]);
this.dialog=new Ext.Window({autoCreate:true,title:ORYX.I18N.PropertyWindow.complex,height:350,width:_b88,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,keys:[{key:27,fn:function(){
this.dialog.hide;
}.bind(this)}],items:[_b91,this.grid],bodyStyle:"background-color:#FFFFFF",buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){
this.grid.stopEditing();
this.data=this.buildValue();
this.dialog.hide();
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){
this.dialog.hide();
}.bind(this)}]});
this.dialog.on(Ext.apply({},this.dialogListeners,{scope:this}));
this.dialog.show();
this.grid.on("beforeedit",this.beforeEdit,this,true);
this.grid.on("afteredit",this.afterEdit,this,true);
this.grid.render();
}});
Ext.form.ComplexTextField=Ext.extend(Ext.form.TriggerField,{onTriggerClick:function(){
if(this.disabled){
return;
}
var grid=new Ext.form.TextArea({anchor:"100% 100%",value:unescape(this.value),listeners:{focus:function(){
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
}.bind(this)}});
var _b99=new Ext.Window({layout:"anchor",autoCreate:true,title:ORYX.I18N.PropertyWindow.text,height:350,width:300,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,keys:[{key:27,fn:function(){
_b99.hide();
}.bind(this)}],items:[grid],listeners:{hide:function(){
this.fireEvent("dialogClosed");
_b99.destroy();
}.bind(this)},buttons:[{text:ORYX.I18N.PropertyWindow.ok,handler:function(){
var _b9a=escape(grid.getValue());
this.setValue(_b9a);
this.dataSource.getAt(this.row).set("value",_b9a);
this.dataSource.commitChanges();
_b99.hide();
}.bind(this)},{text:ORYX.I18N.PropertyWindow.cancel,handler:function(){
_b99.hide();
}.bind(this)}]});
_b99.show();
grid.render();
this.grid.stopEditing();
grid.focus(false,100);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.QueryEvaluator=Clazz.extend({facade:undefined,construct:function(_b9b){
this.facade=_b9b;
this.active=false;
this.raisedEventIds=[];
this.facade.offer({"name":ORYX.I18N.QueryEvaluator.name,"functionality":this.showOverlay.bind(this),"group":ORYX.I18N.QueryEvaluator.group,"icon":ORYX.PATH+"images/xforms_export.png","description":ORYX.I18N.QueryEvaluator.desc,"index":0,"toggle":true,"minShape":0,"maxShape":0});
},showOverlay:function(_b9c,_b9d){
if(!_b9d){
this.raisedEventIds=[];
this.active=!this.active;
return;
}
var _b9e={command:"undef"};
var _b9f=new Ext.Window({layout:"fit",width:500,height:350,closable:true,plain:true,modal:true,id:"optionsPopup",buttons:[{text:"Submit",handler:function(){
_b9e=_ba0.getForm().getValues(false);
_b9f.close();
this.issueQuery(_b9e);
}.bind(this)},{text:"Abort",handler:function(){
_b9f.close();
}.bind(this)}]});
var _ba1=new Ext.form.TextField({fieldLabel:"Model ID",name:"modelID",grow:true,});
_ba1.hide();
var _ba2=function(_ba3,_ba4){
if(!this.fieldStates){
this.fieldStates=[];
}
var _ba5=false;
var _ba6=false;
var i,f;
for(i=0;i<this.fieldStates.length;i++){
f=this.fieldStates[i];
if(f.field===_ba3){
_ba5=true;
f.checked=_ba4;
}
_ba6=_ba6||f.checked;
}
if(!_ba5){
this.fieldStates.push({field:_ba3,checked:_ba4});
_ba6=true;
}
if(_ba6){
_ba1.show();
}else{
_ba1.hide();
}
};
var _ba0=new Ext.form.FormPanel({frame:true,title:"Query options",bodyStyle:"padding:0 10px 0;",items:[{xtype:"fieldset",autoHeight:true,columns:1,allowBlank:false,defaultType:"radio",items:[{boxLabel:"Process query",fieldLabel:"Query Type",name:"command",inputValue:"processQuery",checked:true},{boxLabel:"Test whether query matches specific model",labelSeparator:"",name:"command",inputValue:"testQueryAgainstModel",listeners:{"check":_ba2.bind(this)}},{boxLabel:"Run query against specific model",labelSeparator:"",name:"command",inputValue:"runQueryAgainstModel",listeners:{"check":_ba2.bind(this)}},{boxLabel:"Process MultiQuery",labelSeparator:"",name:"command",inputValue:"processMultiQuery"},{xtype:"checkbox",fieldLabel:"Stop after first match in a model was found",name:"stopAtFirstMatch",checked:true,}]}]});
_ba0.add(_ba1);
_b9f.add(_ba0);
_b9f.show();
_b9c.toggle();
},issueQuery:function(_ba9){
var _baa=DataManager.serializeDOM(this.facade);
_baa="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_baa+"</body></html>";
var _bab=new DOMParser();
var _bac=_bab.parseFromString(_baa,"text/xml");
var _bad=ORYX.PATH+"lib/extract-rdf.xsl";
var _bae=new XSLTProcessor();
var _baf=document.implementation.createDocument("","",null);
_baf.async=false;
_baf.load(_bad);
_bae.importStylesheet(_baf);
try{
var rdf=_bae.transformToDocument(_bac);
var _bb1=(new XMLSerializer()).serializeToString(rdf);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:"Waiting for server"});
new Ajax.Request(ORYX.CONFIG.QUERYEVAL_URL,{method:"POST",asynchronous:true,parameters:{resource:location.href,command:_ba9.command,modelID:_ba9.modelID,stopAtFirstMatch:_ba9.stopAtFirstMatch,data:_bb1},onSuccess:function(_bb2){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
var _bb3=_bb2.responseXML;
var root=_bb3.firstChild;
var _bb5=new Array();
var _bb6,_bb7;
var _bb8=root.getElementsByTagName("ProcessGraph");
for(_bb6=0;_bb6<_bb8.length;_bb6++){
_bb7=_bb8.item(_bb6);
var _bb9=_bb7.getAttributeNode("modelID").nodeValue;
_bb5.push({id:_bb9,elements:this.processResultGraph(_bb7),metadata:""});
}
this.processProcessList(_bb5);
}.bind(this),onFailure:function(_bba){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx","Server encountered an error ("+_bba.statusText+").\n"+_bba.responseText);
}.bind(this)});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
},raiseOverlay:function(_bbb,_bbc){
var id="queryeval."+this.raisedEventIds.length;
var _bbe=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":_bbc,"stroke-width":5,"stroke":"red","d":"M20,-5 L5,-20 M5,-5 L20,-20","line-captions":"round"}]);
this.raisedEventIds.push(id);
return _bbe;
},processResultGraph:function(_bbf){
var _bc0=new Array();
for(var k=0;k<_bbf.childNodes.length;k++){
var node=_bbf.childNodes.item(k);
if(!(node instanceof Text)){
if(node.hasAttribute("id")){
_bc0.push({nodeType:node.nodeName,nodeId:node.getAttributeNode("id").nodeValue});
}else{
if((node.hasAttribute("from"))&&node.hasAttribute("to")){
_bc0.push({edgeType:node.nodeName,from:node.getAttributeNode("from").nodeValue,to:node.getAttributeNode("to").nodeValue});
}
}
}
}
return _bc0;
},processProcessList:function(_bc3){
if(_bc3.length==0){
Ext.Msg.alert("Oryx","Found no matching processes!");
return;
}
_bc3.each(this.getModelMetaData.bind(this));
var data=[];
_bc3.each(function(pair){
data.push([pair.id,pair.metadata.thumbnailUri+"?"+Math.random(),unescape(pair.metadata.title),"","Unknown"]);
}.bind(this));
var _bc6=new Ext.Window({layout:"fit",width:500,height:300,closable:true,plain:true,modal:true,id:"procResPopup",buttons:[{text:"Close",handler:function(){
_bc6.close();
}}]});
var _bc7=new Ext.data.SimpleStore({fields:[{name:"id"},{name:"icon"},{name:"title"},{name:"type"},{name:"author"},],data:data});
var _bc8=new Ext.Panel({border:false,items:new this.dataGridPanel({store:_bc7})});
_bc6.add(_bc8);
_bc6.show();
},getModelMetaData:function(_bc9){
var _bca=_bc9.id.replace(/\/rdf$/,"/meta");
new Ajax.Request(_bca,{method:"get",asynchronous:false,onSuccess:function(_bcb){
_bc9.metadata=_bcb.responseText.evalJSON();
}.bind(this),onFailure:function(){
alert("Error loading model meta data.");
}.bind(this)});
},dataGridPanel:Ext.extend(Ext.DataView,{multiSelect:true,cls:"repository_iconview",itemSelector:"dd",overClass:"over",selectedClass:"selected",tpl:new Ext.XTemplate("<div>","<dl>","<tpl for=\".\">","<dd>","<div class=\"image\"><img src=\"{icon}\" title=\"{title}\"/></div>","<div><span class=\"title\" title=\"{[ values.title.length + (values.type.length*0.8) > 30 ? values.title : \"\" ]}\">{[ values.title.truncate(30 - (values.type.length*0.8)) ]}</span><span class=\"author\" unselectable=\"on\">({type})</span></div>","<div><span class=\"type\">{author}</span></div>","</dd>","</tpl>","</dl>","</div>")}),});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.RenameShapes=Clazz.extend({facade:undefined,construct:function(_bcc){
this.facade=_bcc;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DBLCLICK,this.actOnDBLClick.bind(this));
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.hide.bind(this),true);
},actOnDBLClick:function(evt,_bce){
if(!(_bce instanceof ORYX.Core.Shape)){
return;
}
this.destroy();
var _bcf=_bce.getStencil().properties().findAll(function(item){
return item.refToView()&&item.refToView().length>0;
});
_bcf=_bcf.findAll(function(item){
return !item.readonly()&&item.type()==ORYX.CONFIG.TYPE_STRING;
});
var _bd2=_bcf.collect(function(prop){
return prop.refToView();
}).flatten().compact();
var _bd4=_bce.getLabels().findAll(function(_bd5){
return _bd2.any(function(_bd6){
return _bd5.id.endsWith(_bd6);
});
});
if(_bd4.length==0){
return;
}
var _bd7=_bd4.length<=1?_bd4[0]:null;
if(!_bd7){
_bd7=_bd4.find(function(_bd8){
return _bd8.node==evt.target||_bd8.node==evt.target.parentNode;
});
if(!_bd7){
var _bd9=this.facade.eventCoordinates(evt);
var _bda=this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
_bd9.x*=_bda.a;
_bd9.y*=_bda.d;
var diff=_bd4.collect(function(_bdc){
var _bdd=this.getCenterPosition(_bdc.node);
var len=Math.sqrt(Math.pow(_bdd.x-_bd9.x,2)+Math.pow(_bdd.y-_bd9.y,2));
return {diff:len,label:_bdc};
}.bind(this));
diff.sort(function(a,b){
return a.diff>b.diff;
});
_bd7=diff[0].label;
}
}
var prop=_bcf.find(function(item){
return item.refToView().any(function(_be3){
return _bd7.id==_bce.id+_be3;
});
});
var _be4=this.facade.getCanvas().getHTMLContainer().id;
var _be5=100;
var _be6=this.getCenterPosition(_bd7.node);
_be6.x-=(_be5/2);
var _be7=prop.prefix()+"-"+prop.id();
var _be8={renderTo:_be4,value:_bce.properties[_be7],x:_be6.x,y:_be6.y,width:_be5,style:"position:absolute",allowBlank:prop.optional(),maxLength:prop.length(),emptyText:prop.title(),cls:"x_form_text_set_absolute"};
if(prop.wrapLines()){
_be8.y-=(60/2);
_be8["grow"]=true;
this.shownTextField=new Ext.form.TextArea(_be8);
}else{
_be8.y-=(20/2);
this.shownTextField=new Ext.form.TextField(_be8);
}
this.shownTextField.focus();
this.shownTextField.on("blur",this.destroy.bind(this));
this.shownTextField.on("change",function(node,_bea){
var _beb=_bce;
var _bec=_beb.properties[_be7];
var _bed=_bea;
var _bee=this.facade;
if(_bec!=_bed){
var _bef=ORYX.Core.Command.extend({construct:function(){
this.el=_beb;
this.propId=_be7;
this.oldValue=_bec;
this.newValue=_bed;
this.facade=_bee;
},execute:function(){
this.el.setProperty(this.propId,this.newValue);
this.facade.getCanvas().update();
this.facade.setSelection([this.el]);
},rollback:function(){
this.el.setProperty(this.propId,this.oldValue);
this.facade.getCanvas().update();
this.facade.setSelection([this.el]);
}});
var _bf0=new _bef();
this.facade.executeCommands([_bf0]);
}
}.bind(this));
this.facade.disableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
},getCenterPosition:function(_bf1){
var _bf2={x:0,y:0};
var _bf3=_bf1.getTransformToElement(this.facade.getCanvas().rootNode.lastChild);
var _bf4=this.facade.getCanvas().rootNode.lastChild.getScreenCTM();
var _bf5=_bf1.getTransformToElement(_bf1.parentNode);
_bf2.x=_bf3.e-_bf5.e;
_bf2.y=_bf3.f-_bf5.f;
try{
var _bf6=_bf1.getBBox();
_bf6.y-=1;
}
catch(e){
var _bf6={x:Number(_bf1.getAttribute("x")),y:Number(_bf1.getAttribute("y")),width:0,height:0};
}
_bf2.x+=_bf6.x;
_bf2.y+=_bf6.y;
_bf2.x+=_bf6.width/2;
_bf2.y+=_bf6.height/2;
_bf2.x*=_bf4.a;
_bf2.y*=_bf4.d;
return _bf2;
},hide:function(e){
if(this.shownTextField&&(!e||!this.shownTextField.el||e.target!==this.shownTextField.el.dom)){
this.shownTextField.onBlur();
}
},destroy:function(e){
if(this.shownTextField){
this.shownTextField.destroy();
delete this.shownTextField;
this.facade.enableEvent(ORYX.CONFIG.EVENT_KEYDOWN);
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.RowLayouting=Clazz.extend({construct:function(_bf9){
this.facade=_bf9;
this.currentShapes=[];
this.toMoveShapes=[];
this.dragBounds=undefined;
this.offSetPosition={x:0,y:0};
this.evCoord={x:0,y:0};
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LAYOUT_ROWS,this.handleLayoutRows.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
},onSelectionChanged:function(_bfa){
var _bfb=_bfa.elements;
if(!_bfb||_bfb.length==0){
this.currentShapes=[];
this.toMoveShapes=[];
this.dragBounds=undefined;
}else{
this.currentShapes=_bfb;
this.toMoveShapes=this.facade.getCanvas().getShapesWithSharedParent(_bfb);
this.toMoveShapes=this.toMoveShapes.findAll(function(_bfc){
return _bfc instanceof ORYX.Core.Node&&(_bfc.dockers.length===0||!_bfb.member(_bfc.dockers.first().getDockedShape()));
});
var _bfd=undefined;
_bfb.each(function(_bfe){
if(!_bfd){
_bfd=_bfe.absoluteBounds();
}else{
_bfd.include(_bfe.absoluteBounds());
}
});
this.dragBounds=_bfd;
}
return;
},handleMouseDown:function(_bff,_c00){
if(!this.dragBounds||!this.toMoveShapes.member(_c00)){
return;
}
var _c01=this.facade.eventCoordinates(_bff);
var ul=this.dragBounds.upperLeft();
this.offSetPosition={x:_c01.x-ul.x,y:_c01.y-ul.y};
return;
},handleLayoutRows:function(_c03){
var _c04=this.offSetPosition;
var _c05=_c03.marginLeft;
var _c06=_c03.marginTop;
var _c07=_c03.spacingX;
var _c08=_c03.spacingY;
var _c09=_c03.shape.getChildShapes(false);
var _c0a=this.toMoveShapes;
_c0a.each(function(_c0b){
if(_c09.include(_c0b)){
_c0b.bounds.moveBy(_c04);
}
});
if(_c03.exclude){
_c09=_c09.filter(function(_c0c){
return !_c03.exclude.some(function(_c0d){
return _c0c.getStencil().id()==_c0d;
});
});
}
var _c0e=_c06;
var _c0f=_c06-_c08;
if(_c03.horizontalLayout){
_c09.each(function(_c10){
var ul=_c10.bounds.upperLeft();
_c10.bounds.moveTo(ul.x,_c0e);
});
}else{
if(_c03.verticalLayout){
_c09.each(function(_c12){
var ul=_c12.bounds.upperLeft();
_c12.bounds.moveTo(_c05,ul.y);
});
}
}
_c09=_c09.sortBy(function(_c14){
return _c14.bounds.upperLeft().y;
});
var _c15=0;
var _c16=0;
var _c17=false;
_c09.each(function(_c18){
var ul=_c18.bounds.upperLeft();
var lr=_c18.bounds.lowerRight();
var _c1b=ul.x;
var _c1c=ul.y;
var _c1d=lr.x;
var _c1e=lr.y;
if(_c0a.include(_c18)){
ul.y-=_c16;
if((ul.y>_c0f)||((_c18==_c09.first())&&ul.y<_c06)){
_c17=false;
_c0e=_c0f+_c08;
if(ul.y<_c0e){
_c17=true;
}
}
}else{
ul.y+=_c15;
ul.y-=_c16;
if(ul.y>_c0e){
_c17=false;
_c0e=_c0f+_c08;
}
}
ul.y=_c0e;
lr.y=ul.y+_c18.bounds.height();
if(lr.y>_c0f){
if(_c17){
_c15+=lr.y-_c0f;
}else{
if(_c0a.include(_c18)){
_c15+=lr.y-_c0f;
}
}
_c0f=lr.y;
}
if((ul.x!=_c1b)||(ul.y!=_c1c)||(lr.x!=_c1d)||(lr.y!=_c1e)){
if(!_c0a.include(_c18)){
if((_c1c-ul.y)>_c16){
_c16=_c1c-ul.y;
}
}
_c18.bounds.set(ul.x,ul.y,lr.x,lr.y);
}
});
_c09=_c09.sortBy(function(_c1f){
return _c1f.bounds.upperLeft().y*10000+_c1f.bounds.upperLeft().x;
});
_c0e=_c06;
var _c20=_c05-_c07;
var _c21=_c20;
var _c22=0;
_c09.each(function(_c23){
var ul=_c23.bounds.upperLeft();
var lr=_c23.bounds.lowerRight();
var _c26=ul.x;
var _c27=ul.y;
var _c28=lr.x;
var _c29=lr.y;
if(ul.y>_c0e){
_c0e=ul.y;
_c20=_c05-_c07;
}
ul.x=_c20+_c07;
lr.x=ul.x+_c23.bounds.width();
_c20=lr.x;
if(_c20>_c21){
_c21=_c20;
}
if(lr.y>_c22){
_c22=lr.y;
}
if((ul.x!=_c26)||(ul.y!=_c27)||(lr.x!=_c28)||(lr.y!=_c29)){
_c23.bounds.set(ul.x,ul.y,lr.x,lr.y);
}
});
if(_c03.shape!=this.facade.getCanvas()){
var ul=_c03.shape.bounds.upperLeft();
if(_c21>_c05){
_c03.shape.bounds.set(ul.x,ul.y,ul.x+_c21+_c05,ul.y+_c0f+_c06);
}
}else{
if(_c21>this.facade.getCanvas().bounds.width()){
this.facade.getCanvas().setSize({width:(_c21+_c05),height:this.facade.getCanvas().bounds.height()});
}
if(_c22>this.facade.getCanvas().bounds.height()){
this.facade.getCanvas().setSize({width:this.facade.getCanvas().bounds.width(),height:(_c0f+_c06)});
}
}
return;
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.SelectionFrame=Clazz.extend({construct:function(_c2b){
this.facade=_c2b;
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.handleMouseUp.bind(this),true);
this.position={x:0,y:0};
this.size={width:0,height:0};
this.offsetPosition={x:0,y:0};
this.moveCallback=undefined;
this.offsetScroll={x:0,y:0};
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.facade.getCanvas().getHTMLContainer(),["div",{"class":"Oryx_SelectionFrame"}]);
this.hide();
},handleMouseDown:function(_c2c,_c2d){
if(_c2d instanceof ORYX.Core.Canvas){
var _c2e=_c2d.rootNode.parentNode.parentNode;
var a=this.facade.getCanvas().node.getScreenCTM();
this.offsetPosition={x:a.e,y:a.f};
this.setPos({x:Event.pointerX(_c2c)-this.offsetPosition.x,y:Event.pointerY(_c2c)-this.offsetPosition.y});
this.resize({width:0,height:0});
this.moveCallback=this.handleMouseMove.bind(this);
document.documentElement.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.moveCallback,false);
this.offsetScroll={x:_c2e.scrollLeft,y:_c2e.scrollTop};
this.show();
}
Event.stop(_c2c);
},handleMouseUp:function(_c30){
if(this.moveCallback){
this.hide();
document.documentElement.removeEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.moveCallback,false);
this.moveCallback=undefined;
var _c31=this.facade.getCanvas().node.getScreenCTM();
var a={x:this.size.width>0?this.position.x:this.position.x+this.size.width,y:this.size.height>0?this.position.y:this.position.y+this.size.height};
var b={x:a.x+Math.abs(this.size.width),y:a.y+Math.abs(this.size.height)};
a.x/=_c31.a;
a.y/=_c31.d;
b.x/=_c31.a;
b.y/=_c31.d;
var _c34=this.facade.getCanvas().getChildShapes(true).findAll(function(_c35){
var _c36=_c35.absoluteBounds();
var bA=_c36.upperLeft();
var bB=_c36.lowerRight();
if(bA.x>a.x&&bA.y>a.y&&bB.x<b.x&&bB.y<b.y){
return true;
}
return false;
});
this.facade.setSelection(_c34);
}
},handleMouseMove:function(_c39){
var size={width:Event.pointerX(_c39)-this.position.x-this.offsetPosition.x,height:Event.pointerY(_c39)-this.position.y-this.offsetPosition.y,};
var _c3b=this.facade.getCanvas().rootNode.parentNode.parentNode;
size.width-=this.offsetScroll.x-_c3b.scrollLeft;
size.height-=this.offsetScroll.y-_c3b.scrollTop;
this.resize(size);
Event.stop(_c39);
},hide:function(){
this.node.style.display="none";
},show:function(){
this.node.style.display="";
},setPos:function(pos){
this.node.style.top=pos.y+"px";
this.node.style.left=pos.x+"px";
this.position=pos;
},resize:function(size){
this.setPos(this.position);
this.size=Object.clone(size);
if(size.width<0){
this.node.style.left=(this.position.x+size.width)+"px";
size.width=-size.width;
}
if(size.height<0){
this.node.style.top=(this.position.y+size.height)+"px";
size.height=-size.height;
}
this.node.style.width=size.width+"px";
this.node.style.height=size.height+"px";
}});
if(!ORYX){
ORYX=new Object();
}
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.SemanticPool=Clazz.extend({facade:undefined,ontologyStore:undefined,bridgeStore:undefined,contextmenu:undefined,changes:undefined,filter:undefined,filterState:undefined,modelID:undefined,ignoreShapeAddedEvent:false,construct:function(_c3e){
this.facade=_c3e;
this.ontologyStore=new Ext.data.SimpleStore({fields:["name","type","url","xml","description","version"]});
this.bridgeStore=new Ext.data.SimpleStore({fields:["name","type","url","xml","description","version"]});
this.changes=new Array();
this.filter=new Ext.tree.TreeFilter();
this.filterState=false;
this.contextMenu=new Ext.menu.Menu({id:"messageContextMenu",items:[new Ext.menu.TextItem({text:"Actions"}),new Ext.menu.Separator({}),{id:"SemExtMenuItem",text:"annotate with Concept",iconCls:"semExtension",handler:function(){
this.contextMenu.hide();
this.showSemanticDataObject();
}.bind(this)},{id:"SetupSemBridgeMenuItem",text:"setup a semantic bridge",iconCls:"add",handler:function(){
this.contextMenu.hide();
var _c3f=this.facade.getSelection();
this.setupSemanticBridge(_c3f[0],_c3f[1]);
}.bind(this)},{id:"EditSemBridgeMenuItem",text:"edit semantic bridge",iconCls:"edit",handler:function(){
this.contextMenu.hide();
this.editSemanticBridge();
}.bind(this)},{id:"RemoveSemBridgeMenuItem",text:"remove semantic bridge",iconCls:"delete",handler:function(){
this.contextMenu.hide();
this.removeSemanticBridge(this.facade.getSelection(),true);
}.bind(this)},{id:"SemBridgeSuggestion",text:"suggest semantic Bridge",iconCls:"semExtension",handler:function(){
this.contextMenu.hide();
this.suggestSemanticBridge();
}.bind(this)}]});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEDOWN,this.handleMouseDown.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_LOADED,this.onLoad.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_KEYDOWN,this.keyListenerActionPerformed.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDOCKER_DOCKED,this.dockerChangePerformed.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_CANVAS_SHAPEADDED,this.shapeAddedToCanvas.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MODEL_BEFORE_SAVE,this.saveListenerPerformed.bind(this));
this.facade.offer({"name":"Semantic Pool","functionality":this.showSemanticPool.bind(this),"group":"SemanticExtension","icon":ORYX.PATH+"images/box.png","description":"In the semantic pool import, export, create and organize your ontologies and semantis Bridges.","index":1,"minShape":0,"maxShape":0});
},saveListenerPerformed:function(_c40){
if(_c40&&_c40.forceNew){
this.ontologyStore.each(function(_c41){
var _c42={"id":"reload:::ontology:::"+_c41.get("url"),"command":"reload","type":"ontology","url":_c41.get("url"),"xml":_c41.get("xml")};
this.addMessageToServer(_c42);
}.bind(this));
if(this.changes.length>0){
this.startProgressBar("Please wait ...","... copy semantic pool  ...");
var _c43=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
this.handleStandardServerResponse(_c43);
this.stopProgressBar(true);
}
}
},onLoad:function(){
this.restorePool();
this.modelID=this.facade.getCanvas().properties["oryx-id"];
this.facade.getCanvas().getChildren().each(function(_c44){
if(_c44.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
this.addSemanticBridgeServerCall(_c44);
}
}.bind(this));
if(this.changes.length>0){
this.startProgressBar("Please wait ...","... loading semantic pool  ...");
var _c45=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
this.handleSemanticBridgeResponse(_c45,false);
this.stopProgressBar(true);
}
},shapeAddedToCanvas:function(_c46){
if(_c46.shape.getStencil().id()!="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
return;
}
var _c47=_c46.shape;
var _c48=_c46.option.parent;
if(this.ignoreShapeAddedEvent){
console.log("Shape-added Event ignored...");
return;
}
if(_c47.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
var Data=Ext.data.Record.create([{name:"name"}]);
var _c4a=new Ext.data.SimpleStore({fields:["name"]});
this.bridgeStore.each(function(_c4b){
_c4a.add(new Data({name:_c4b.get("name")+" (Version: "+_c4b.get("version")+")"}));
}.bind(this));
var _c4c=new Ext.Window({id:"setup-semanticbridge",width:590,title:"Select Semantic Bridge",labelWidth:100,modal:true,resizable:true,items:[{xtype:"form",id:"setupBridgeForm",labelWidth:100,frame:false,bodyStyle:"padding:5px 5px 0",width:580,defaults:{width:420},items:[{xtype:"combo",id:"semanticbridgechoice",name:"semantic bridge",fieldLabel:"Semantic Bridge",mode:"local",store:_c4a,displayField:"name",typeAhead:true,forceSelection:true,emptyText:"Select a semantic bridge ...",selectOnFocus:true}]}],buttons:[{text:"set",handler:function(){
var _c4d=Ext.getCmp("semanticbridgechoice").selectedIndex;
var data=this.bridgeStore.getAt(_c4d);
_c47.setProperty("oryx-url",data.get("url"));
_c47.setProperty("oryx-name",data.get("name"));
_c47.setProperty("oryx-version",data.get("version"));
this.facade.getCanvas().update();
_c4c.hide();
}.bind(this)},{text:"cancel",handler:function(){
_c4c.hide();
}}],height:100});
_c4c.on("hide",function(){
_c4c.destroy(true);
delete _c4c;
});
_c4c.show();
}
},dockerChangePerformed:function(_c4f){
var _c50=_c4f.parent;
console.log(_c4f);
if(_c50.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
console.log("A docker of a Semantic Bridge changed");
var _c51=_c50;
var _c52=_c4f.target;
var _c53=false;
if(_c51.incoming.length==1&&_c51.outgoing.length==1&&_c50.properties["oryx-url"]){
console.log("Complete Semantic Bridge");
var _c54=_c51.incoming[0];
var _c55=_c51.outgoing[0];
if(!_c54.properties["oryx-concept"]||!_c55.properties["oryx-concept"]){
Ext.MessageBox.alert("Action not permitted!","<p>Semantic Bridges are only allow between semantic Dataobjects. Your Semantic Bridge was removed.</p>");
this.facade.setSelection(new Array(this.facade.getCanvas()));
this.facade.deleteShape(_c50);
return;
}
if(_c54.properties["oryx-concept"].length>0&&_c55.properties["oryx-concept"].length>0){
console.log("Semantic Bridge between two Semantic Data Objects");
}
if(_c51.properties["oryx-source"].length>0&&_c51.properties["oryx-target"].length>0){
console.log("The bridge was already complete.");
}
if(_c54.properties["oryx-concept"]!=_c51.properties["oryx-source"]||_c55.properties["oryx-concept"]!=_c51.properties["oryx-target"]){
_c53=true;
}
}
if(_c51.incoming.length==1){
_c51.setProperty("oryx-source",_c51.incoming[0].properties["oryx-concept"]);
}
if(_c51.outgoing.length==1){
_c51.setProperty("oryx-target",_c51.outgoing[0].properties["oryx-concept"]);
}
if(_c53){
Ext.MessageBox.confirm("Execute Semantic Bridge?","You established a semantic bridge between two semantic dataobjects. Would you like to execute this bridge now?",function(btn){
if(btn=="yes"){
this.startProgressBar("Please wait ...","... executing Semantic Bridge  ...");
this.addSemanticBridgeServerCall(_c51);
var _c57=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
this.handleSemanticBridgeResponse(_c57,true);
this.stopProgressBar(true);
}
}.bind(this));
}
}
},getConnectedSemanticBridgesToShape:function(_c58){
var _c59=new Array();
for(var i=0;i<_c58.incoming.length;i++){
if(_c58.incoming[i].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
_c59=_c59.concat(new Array(_c58.incoming[i]));
}
}
for(var i=0;i<_c58.outgoing.length;i++){
if(_c58.outgoing[i].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
_c59=_c59.concat(new Array(_c58.outgoing[i]));
}
}
return _c59;
},countActiveSemanticBridgeExists:function(url){
var _c5c=0;
var row=this.bridgeStore.find("url",url);
if(row==-1){
return _c5c;
}
var _c5e=this.bridgeStore.getAt(row);
this.facade.getCanvas().getChildren().each(function(_c5f){
if(_c5f.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
if(_c5f.properties["oryx-url"]==url){
_c5c++;
}
}
}.bind(this));
return _c5c;
},removeSemanticBridge:function(_c60,_c61){
for(var i=0;i<_c60.length;i++){
if(_c60[i].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"&&_c60[i].incoming.length==1&&_c60[i].outgoing.length==1){
var _c63=_c60[i].properties["oryx-source"];
var _c64=_c63.split("#");
var _c65=_c60[i].incoming[0];
var _c66=_c65.properties["oryx-concept"];
if(_c66&&_c66==_c63){
var _c67=this.countActiveSemanticBridgeExists(_c60[i].properties["oryx-url"]);
if(_c67==1){
this.resetOntology(_c64[0]);
}
_c65.setProperty("oryx-name",_c64[1]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_c65,name:"oryx-name",value:_c64[1]});
this.collapseSemanticDataObject(_c65);
this.facade.getCanvas().update();
if(_c61){
this.facade.deleteShape(_c60[i]);
this.facade.setSelection(new Array(this.facade.getCanvas()));
}
}else{
Ext.MessageBox.alert("Es ist ein Fehler aufgetreteten!","<p>Quellkonzept der Semantische Br\xc3\xbccke stimmt nicht mit der Annotation des Datenobjekts \xc3\xbcberein.</p>");
}
}
}
},keyListenerActionPerformed:function(_c68){
if(!_c68){
_c68=window.event;
}
var _c69=_c68.which||_c68.keyCode;
if(_c69==ORYX.CONFIG.KEY_CODE_DELETE){
this.removeSemanticBridge(this.facade.getSelection(),false);
}
},restorePool:function(){
var _c6a=this.facade.getCanvas().properties["oryx-semanticpool"];
if(_c6a==""){
return;
}
var _c6b=eval("("+_c6a+")");
var Data=Ext.data.Record.create([{name:"name"},{name:"type"},{name:"url"},{name:"xml"},{name:"description"},{name:"version"}]);
for(var i=0;i<_c6b.totalCount;i++){
var _c6e=new Data({name:_c6b.items[i].name,type:_c6b.items[i].type,url:_c6b.items[i].url,xml:_c6b.items[i].xml,description:_c6b.items[i].description,version:_c6b.items[i].version});
if(_c6b.items[i].type=="Ontology"){
this.ontologyStore.add(_c6e);
}else{
if(_c6b.items[i].type=="Semantic Bridge"){
this.bridgeStore.add(_c6e);
}else{
Ext.MessageBox.alert("Es ist ein Fehler aufgetreteten!","<p>TODO Fehlermeldung.</p>");
}
}
}
},handleMouseDown:function(_c6f){
console.log(_c6f);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"suggestSemanticBridge"});
var _c70=this.facade.getSelection();
console.log("Selected Shapes Count: "+_c70.length);
for(var i=0;i<_c70.length;i++){
console.log((i+1)+". Selected Shape: "+_c70[i].getStencil().id());
console.log("Concept of "+(i+1)+". selected Shape: "+_c70[i].properties["oryx-concept"]);
}
if(_c6f.which==1){
console.log("MouseEvent: left Button pressed");
if(_c6f.rangeParent.attributes.getNamedItem("oryx:type")){
var _c72=_c6f.rangeParent.attributes.getNamedItem("oryx:type").value;
if(_c72=="toExpand"){
this.ignoreShapeAddedEvent=true;
this.expandSemanticDataObject(_c70);
setTimeout(function(){
this.ignoreShapeAddedEvent=false;
}.bind(this),1000);
}else{
if(_c72=="toCollapse"){
this.ignoreShapeAddedEvent=true;
this.collapseSemanticDataObject(_c70[0]);
setTimeout(function(){
this.ignoreShapeAddedEvent=false;
}.bind(this),1000);
}
}
}
}else{
if(_c6f.which==2){
console.log("MouseEvent: middle Button pressed");
}else{
if(_c6f.which==3){
console.log("MouseEvent: right Button pressed");
}
}
}
Ext.getCmp("SemExtMenuItem").setVisible(false);
Ext.getCmp("SemBridgeSuggestion").setVisible(false);
Ext.getCmp("EditSemBridgeMenuItem").setVisible(false);
Ext.getCmp("RemoveSemBridgeMenuItem").setVisible(false);
Ext.getCmp("SetupSemBridgeMenuItem").setVisible(false);
this.contextMenu.hide();
if(_c6f.which==3&&_c70.length>0){
if(_c70.length==1){
if(_c70[0].getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#DataObject"||_c70[0].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"||_c70[0].getStencil().id()==="http://b3mn.org/stencilset/epc#Data"){
Ext.getCmp("SemExtMenuItem").setVisible(true);
Ext.getCmp("SemBridgeSuggestion").setVisible(_c70[0].properties["oryx-concept"]!="");
}else{
if(_c70[0].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#semanticBridge"){
Ext.getCmp("EditSemBridgeMenuItem").setVisible(true);
Ext.getCmp("RemoveSemBridgeMenuItem").setVisible(true);
}else{
return;
}
}
}else{
if(_c70.length==2&&(_c70[0].getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#DataObject"||_c70[0].getStencil().id()==="http://b3mn.org/stencilset/epc#Data")&&(_c70[1].getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#DataObject"||_c70[1].getStencil().id()==="http://b3mn.org/stencilset/epc#Data")){
Ext.getCmp("SetupSemBridgeMenuItem").setVisible(true);
}else{
return;
}
}
var pos=this.facade.eventCoordinates(_c6f);
console.log(pos);
this.contextMenu.showAt([pos.x+185,pos.y+65]);
}else{
this.contextMenu.hide();
}
},expandSemanticDataObject:function(_c74){
var name=_c74[0].properties["oryx-name"];
var _c76=_c74[0].properties["oryx-concept"];
if(!_c76){
console.log("Only semantic DataObject are able to be expanded.");
return;
}
var _c77=_c74[0].getParentShape();
this.startProgressBar("Expanding Data Object","Expanding Data Object ... Please Wait ...");
var x=_c74[0].bounds.a.x+51;
var y=_c74[0].bounds.a.y+41;
var _c76=_c74[0].properties["oryx-concept"];
if(_c76){
var _c7a=_c76.split("#");
var row=this.ontologyStore.find("url",_c7a[0]);
var _c7c=this.ontologyStore.getAt(row);
var xml=_c7c.get("xml");
var _c7e=_c7a[1];
var _c7f={"id":"getconcepts:::"+_c7a[0]+":::concept:::"+name,"command":"getconcepts","type":"concept","name":name,"xml":xml};
this.addMessageToServer(_c7f);
var _c80=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,_c7a[0]);
var _c81=_c80.messages;
var _c82=this.facade.createShape({type:"http://b3mn.org/stencilset/bpmn1.1#ExpDataObject",position:{x:x,y:y},namespace:"http://b3mn.org/stencilset/bpmn1.1#",parent:_c77});
_c82.setProperty("oryx-name",name);
_c82.setProperty("oryx-annotation",true);
_c82.setProperty("oryx-concept",_c76);
var _c83=_c74[0].incoming;
for(var i=0;i<_c83.length;i++){
_c83[i].dockers.last().setDockedShape(_c82);
}
var _c85=_c74[0].outgoing;
for(var i=0;i<_c85.length;i++){
_c85[i].dockers.first().setDockedShape(_c82);
}
var _c86=50;
for(var i=0;i<_c81.length;i++){
if(_c81[i].range){
var _c87=_c81[i].range.length;
for(var j=0;j<_c87;j++){
var _c89=_c81[i].range[j];
var _c8a={type:"http://b3mn.org/stencilset/bpmn1.1#DataObject",position:{x:50,y:(70+(j*70))},namespace:"http://b3mn.org/stencilset/bpmn1.1#",parent:_c82};
var _c8b=this.facade.createShape(_c8a);
_c8b.setProperty("oryx-name",_c89.name);
if(_c89.type&&_c89.type=="object"){
_c8b.setProperty("oryx-annotation",true);
_c8b.setProperty("oryx-concept",_c7a[0]+"#"+_c89.name);
}else{
if(_c89.type&&_c89.type=="literal"){
_c8b.setProperty("oryx-annotation",false);
}
}
var _c8c=_c89.name.length*8;
_c8b.bounds.extend({x:_c8c,y:0});
_c86=(_c8c>_c86)?_c8c:_c86;
}
}
}
if(_c77.getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"){
var _c8d=_c77.getChildren();
for(var i=0;i<_c8d.length;i++){
if(_c8d[i] instanceof ORYX.Core.Shape&&_c8d[i]!=_c82&&_c8d[i].getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"){
_c86=0;
}
if(_c8d[i]!=_c82&&_c8d[i].bounds.a.y>_c74[0].bounds.a.y){
_c8d[i].bounds.moveBy({x:0,y:_c87*70+21+10});
}
}
_c77.bounds.extend({x:_c86,y:_c87*70+21+10});
_c82.bounds.moveBy({x:20,y:30+10});
}
var _c8e=(_c86+80-_c82.bounds.width()>0)?_c86+80-_c82.bounds.width():0;
_c82.bounds.extend({x:_c8e,y:(_c87-1)*70});
this.facade.deleteShape(_c74[0]);
this.facade.getCanvas().update();
this.facade.setSelection(new Array(_c82));
this.stopProgressBar(stop);
}
},checkIfCollapsable:function(_c8f){
var _c90=true;
if(_c8f&&_c8f.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"){
var _c91=_c8f.getChildren();
for(var i=0;i<_c91.length;i++){
if(_c91[i] instanceof ORYX.Core.Shape){
if(_c91[i].incoming.length>0||_c91[i].outgoing.length>0){
Ext.Msg.alert("Action is not allowed!","<p>You can not collapse a Dataobject, that has Children with incoming or outgoing edges.</p>");
return false;
}
if(_c91[i].getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"&&!this.checkIfCollapsable(_c91[i])){
return false;
}
}
}
return true;
}else{
return false;
}
},collapseSemanticDataObject:function(_c93){
if(!this.checkIfCollapsable(_c93)){
console.log("not collapsable");
return;
}
var _c94=_c93.getParentShape();
var _c95=this.facade.createShape({type:"http://b3mn.org/stencilset/bpmn1.1#DataObject",position:{x:(_c93.bounds.a.x+50),y:(_c93.bounds.a.y+40)},namespace:"http://b3mn.org/stencilset/bpmn1.1#",parent:_c93.getParentShape()});
var name=_c93.properties["oryx-name"];
_c95.setProperty("oryx-name",name);
_c95.setProperty("oryx-annotation",true);
_c95.setProperty("oryx-concept",_c93.properties["oryx-concept"]);
var _c97=_c93.incoming;
for(var i=0;i<_c97.length;i++){
_c97[i].dockers.last().setDockedShape(_c95);
_c97[i].dockers.last().setReferencePoint(_c95.getDefaultMagnet().bounds.center());
}
var _c99=_c93.outgoing;
for(var i=0;i<_c99.length;i++){
_c99[i].dockers.first().setDockedShape(_c95);
_c99[i].dockers.first().setReferencePoint(_c95.getDefaultMagnet().bounds.center());
}
if(_c94.getStencil().id()==="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"){
var _c9a=0;
for(var i=0;i<_c93.getChildren().length;i++){
if(_c93.getChildren()[i] instanceof ORYX.Core.Shape){
_c9a=_c9a+1;
}
}
_c94.bounds.extend({x:-50,y:-(_c9a*70+21+10)});
var _c9b=_c94.getChildren();
for(var i=0;i<_c9b.length;i++){
if(_c9b[i]!=_c95&&_c9b[i].bounds.a.y>_c93.bounds.a.y){
_c9b[i].bounds.moveBy({x:0,y:-(_c9a*70+21+10)});
}
}
_c95.bounds.moveBy({x:-20,y:-10});
}
_c95.bounds.extend({x:(name.length*8),y:0});
this.facade.deleteShape(_c93);
this.facade.getCanvas().update();
},startProgressBar:function(_c9c,text){
var _c9e=new Ext.Window({id:"progressbarWindow",width:350,layout:"border",title:_c9c,modal:true,resizable:false,items:[{id:"progressbar",xtype:"progress",margins:"2 2 0 2",region:"center",}],buttons:[{id:"closeImportButton",text:"close",disabled:true,handler:function(){
_c9e.hide();
}}],height:90});
_c9e.on("hide",function(){
_c9e.destroy(true);
delete _c9e;
});
Ext.getCmp("progressbar").wait();
if(text){
Ext.getCmp("progressbar").updateText(text);
}
_c9e.show();
},stopProgressBar:function(_c9f){
if(Ext.getCmp("progressbar")){
Ext.getCmp("progressbar").reset();
Ext.getCmp("progressbar").updateProgress(1,"Done");
Ext.getCmp("closeImportButton").setDisabled(false);
if(_c9f){
Ext.getCmp("progressbarWindow").hide();
}
}
},handleStandardServerResponse:function(_ca0){
var _ca1=_ca0.messages;
if(_ca1.length==0){
console.log("WARNUNG: Es ist keine Message vom Server zur\xc3\xbcck gekommen!");
}
for(var i=0;i<_ca1.length;i++){
this.handleStandardServerMessage(_ca1[i]);
}
},handleStandardServerMessage:function(_ca3){
if(_ca3.error){
Ext.Msg.alert("An error occured","<p>"+_ca3.error+"</p>");
return true;
}
if(!_ca3.command){
return true;
}
if(_ca3.command=="newVersion"){
var Data=Ext.data.Record.create([{name:"name"},{name:"type"},{name:"url"},{name:"xml"},{name:"description"},{name:"version"}]);
if(_ca3.type=="ontology"){
var _ca5=new Data({name:_ca3.name,type:"Ontology",url:_ca3.url,xml:_ca3.xml,description:_ca3.description,version:_ca3.version});
this.ontologyStore.add(_ca5);
this.persistPool();
return true;
}else{
if(_ca3.type=="semantic bridge"){
var _ca6=new Data({name:_ca3.name,type:"Semantic Bridge",url:_ca3.url,xml:_ca3.xml,description:_ca3.description,version:_ca3.version});
this.bridgeStore.add(_ca6);
this.persistPool();
return true;
}
}
}else{
if(_ca3.command=="changeRepresentation"){
var row=this.ontologyStore.find("url",_ca3.url);
this.ontologyStore.getAt(row).set("xml",_ca3.xml);
this.persistPool();
return true;
}else{
if(_ca3.command=="highlight"){
var _ca8=_ca3.name;
var _ca5=_ca3.ontology;
if(_ca8&&_ca5){
this.highlight(this.facade.getCanvas(),"oryx-concept",(_ca5+"#"+_ca8));
return true;
}else{
return false;
}
}else{
if(_ca3.command=="updateModelID"){
var _ca9=_ca3.newModelId;
this.facade.getCanvas().setProperty("oryx-id",_ca9);
this.modelID=_ca9;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:this.facade.getCanvas(),name:"oryx-id",value:_ca9});
this.facade.getCanvas().update();
}else{
return false;
}
}
}
}
},showUnexpectedServerResponseDialog:function(_caa){
Ext.Msg.alert("Unexpected Server Response","<p>The given Server Response was unexpected:<br>"+_caa+"</p>");
},highlight:function(_cab,_cac,_cad){
var _cae;
_cab.getChildren().each(function(_caf){
if(_caf instanceof ORYX.Core.Shape){
if(_caf.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#Pool"||_caf.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#Lane"){
_cae=this.highlight(_caf,_cac,_cad)||_cae;
}else{
if(_caf.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#DataObject"||_caf.getStencil().id()=="http://b3mn.org/stencilset/bpmn1.1#ExpDataObject"){
if(_caf.properties[_cac]&&_caf.properties[_cac]==_cad){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"suggestSemanticBridge",shapes:[_caf],attributes:{fill:"lightgreen"}});
_cae=_caf;
}
}
}
}
}.bind(this));
return _cae;
},addMessageToServer:function(_cb0){
if(this.changes.length==0){
this.changes=new Array(_cb0);
}else{
this.changes=this.changes.concat(new Array(_cb0));
}
},resetMessageToServer:function(){
this.changes=new Array();
},sendMessagesToServer:function(_cb1,url){
var _cb3;
var xml="";
var row=this.ontologyStore.find("url",url);
var _cb6=this.ontologyStore.getAt(row);
if(_cb6){
xml=_cb6.get("xml");
}
if(this.modelID!=this.facade.getCanvas().properties["oryx-id"]){
var _cb7=this.facade.getCanvas().properties["oryx-id"];
var _cb8={"id":"updateModelID:::"+this.modelID+":::"+_cb7,"command":"updateModelID","type":"model","newModelId":_cb7,"oldModelId":this.modelID};
this.addMessageToServer();
}
console.log("ModelID: "+this.modelID);
var _cb9={"id":"submission","type":"request","modelId":(this.modelID||""),"ontology":url,"xml":xml,"messages":this.changes};
console.log("Message send to Server '"+_cb1+"':");
console.log(_cb9);
new Ajax.Request(_cb1,{method:"POST",asynchronous:false,parameters:{submission:Object.toJSON(_cb9)},onSuccess:function(_cba){
_cb3=_cba.responseText.evalJSON();
}.bind(this),onFailure:function(_cbb){
Ext.Msg.alert("Oryx","<p>Fehler</p>");
return false;
},on403:function(_cbc){
Ext.Msg.alert("Oryx",ORYX.I18N.AMLSupport.noRights);
ORYX.Log.warn("Import AML failed: "+_cbc.responseText);
return false;
}});
this.resetMessageToServer();
return _cb3;
},getFormTabPanel:function(_cbd){
if(Ext.getCmp("formTabPanel")){
return Ext.getCmp("formTabPanel");
}
var _cbe=new Ext.TabPanel({id:"formTabPanel",activeTab:0,viewConfig:{forceFit:true},region:"north",height:(_cbd||120)});
return _cbe;
},getDescriptionArea:function(id,_cc0,_cc1){
var id=(id||"description");
if(Ext.getCmp(id)){
return Ext.getCmp(id);
}
var _cc2=new Ext.form.TextArea({id:id,title:(_cc0||"Description"),allowBlank:true,readOnly:(_cc1||false),region:"center"});
return _cc2;
},getPropertyWindow:function(_cc3,_cc4,_cc5){
if(Ext.getCmp("propertyWindow")){
return Ext.getCmp("propertyWindow");
}
var _cc6=new Ext.Window({id:"propertyWindow",layout:"border",width:400,title:_cc3,floating:true,shim:true,modal:true,resizable:true,items:[_cc4,{xtype:"panel",title:"Description",region:"center",layout:"border",items:[this.getDescriptionArea()]}],height:(_cc5||300)});
_cc6.on("hide",function(){
_cc6.destroy(true);
delete _cc6;
});
return _cc6;
},workaroundSelectRowInGrid:function(grid,row){
setTimeout(function(){
grid.getSelectionModel().selectRow(row);
grid.fireEvent("rowclick",grid,1);
},1000);
},getOntologyList:function(_cc9){
if(Ext.getCmp("ontoGrid")){
return Ext.getCmp("ontoGrid");
}
var grid=new Ext.grid.GridPanel({id:"ontoGrid",title:"Ontologies",store:this.ontologyStore,width:250,height:350,autoExpandColumn:"nameCol",columns:[{id:"nameCol",header:"Name",sortable:true,dataIndex:"name"},{id:"versionCol",header:"Version",sortable:false,dataIndex:"version"}],listeners:{render:function(g){
if(this.ontologyStore.getCount()>0){
if(_cc9==undefined||_cc9<0){
_cc9=0;
}
this.workaroundSelectRowInGrid(grid,_cc9);
}
}.bind(this)},sm:new Ext.grid.RowSelectionModel({singleSelect:true,listeners:{beforerowselect:function(_ccc,_ccd,_cce,_ccf){
if(this.changes.length>0){
var msg="You are switching an ontology that has unsaved changes. Would you like to dismiss your changes?";
var r=confirm(msg);
if(r==true){
this.resetMessageToServer();
return true;
}else{
return false;
}
}
}.bind(this),rowselect:function(_cd2,_cd3,_cd4){
var tree=this.getConceptTree();
tree.getLoader().dataUrl=_cd4.get("xml");
tree.getLoader().nsStore.removeAll();
tree.getRootNode().reload();
setTimeout(function(){
tree.getRootNode().reload();
},200);
tree.getSelectionModel().clearSelections();
var _cd6=this.getDescriptionArea("Ontology-Description","Description",true);
_cd6.setRawValue(_cd4.get("description"));
}.bind(this)}})});
return grid;
},getConceptTree:function(url){
if(Ext.getCmp("treePanel")){
return Ext.getCmp("treePanel");
}
if(!url&&this.ontologyStore.getCount()>0){
url=this.ontologyStore.getAt(0).get("xml");
}
Ext.QuickTips.init();
Ext.app.ConceptLoader=Ext.extend(Ext.ux.XmlTreeLoader,{nsStore:new Ext.data.SimpleStore({fields:["namespace"]}),processAttributes:function(attr){
if(attr.cls){
attr.text=attr.name;
attr.iconCls="cls";
attr.cls="ontoNode";
}else{
if(attr.property){
attr.text=attr.property;
attr.iconCls="property";
attr.cls="propNode";
}
}
if(attr.leaf=="true"){
attr.leaf=true;
}
if(attr.ns){
var _cd9=attr.ns.split(",");
if(_cd9.length>1){
attr.iconCls=attr.iconCls+"_bridged";
}else{
var row=this.nsStore.find("namespace",attr.ns);
if(row==-1){
var _cdb=Ext.data.Record.create([{name:"namespace"}]);
this.nsStore.add(new _cdb({namespace:attr.ns}));
row=this.nsStore.length-1;
}
attr.iconCls=attr.iconCls+"_"+(row+1);
}
}else{
attr.ns="default";
}
attr.leaf="false";
attr.qtip="description: "+attr.description;
attr.loaded=true;
attr.id=attr.text;
}});
var tree=new Ext.tree.TreePanel({id:"treePanel",autoScroll:true,margins:"2 2 0 2",rootVisible:false,animate:true,loader:new Ext.app.ConceptLoader({dataUrl:url}),lines:true,root:new Ext.tree.AsyncTreeNode(),width:350,height:500,rowspan:2,title:"Concepts",useArrows:true,tbar:[{iconCls:"hierarchie",enableToggle:true,handler:function(){
this.filter.clear();
if(this.filterState){
this.filter.filter(new RegExp("[^hierarchical]","i"),"type",this.getConceptTree().getRootNode());
this.filterState=false;
}else{
this.filter.filter(new RegExp("[^flat]","i"),"type",this.getConceptTree().getRootNode());
this.filterState=true;
}
}.bind(this)},{iconCls:"add",handler:this.addElement.bind(this)},{iconCls:"delete",handler:this.deleteElement.bind(this)},{iconCls:"edit",handler:this.editElement.bind(this)},{iconCls:"save",handler:function(){
this.saveNewOntologyVersion(false);
}.bind(this)},{iconCls:"save_as",handler:function(){
this.saveNewOntologyVersion(true);
}.bind(this)}]});
return tree;
},getCommentWindow:function(){
if(Ext.getCmp("commentWindow")){
return Ext.getCmp("commentWindow");
}
var _cdd=new Ext.Window({id:"commentWindow",width:400,layout:"border",title:"Comment your change",modal:true,resizable:true,defaults:{split:true,bodyStyle:"padding:15px"},items:[{xtype:"label",region:"north",text:"Please comment your change...",margins:"5 5 5 5"},{xtype:"textarea",region:"center",id:"editInformationComment",title:"Comment your change",allowBlank:false}],height:200,buttons:[{id:"apply-comment",text:"apply"},{id:"cancel",text:"cancel",handler:function(){
_cdd.hide();
}}]});
_cdd.on("hide",function(){
_cdd.destroy(true);
delete _cdd;
});
return _cdd;
},getAnnotationWindow:function(_cde){
if(Ext.getCmp("annotationWindow")){
return Ext.getCmp("annotationWindow");
}
if(_cde){
var _cdf=_cde.split("#");
var row=this.ontologyStore.find("url",_cdf[0]);
var _ce1=this.ontologyStore.getAt(row);
var url=_ce1.get("xml");
}
var grid=this.getOntologyList(row);
var tree=this.getConceptTree(url);
var _ce5=new Ext.Window({id:"annotationWindow",width:615,height:500,title:"Semantic Annotation",layout:"table",layoutConfig:{columns:2},floating:true,shim:true,modal:true,resizable:true,autoHeight:true,resizable:false,items:[grid,tree,{id:"DescriptionPanel",xtype:"panel",title:"Description",layout:"border",width:250,height:150,items:[this.getDescriptionArea("Ontology-Description","Description",false)]}],buttons:[{text:"annotate",handler:this.annotateDataObject.bind(this)},{text:"cancel",handler:function(){
this.getAnnotationWindow().close();
}.bind(this)}]});
_ce5.on("hide",function(){
this.resetMessageToServer();
_ce5.destroy(true);
delete _ce5;
}.bind(this));
if(_cde){
setTimeout(function(){
var path=tree.getNodeById(_cdf[1]).getPath();
tree.expandPath(path);
tree.selectPath(path);
},1500);
}
return _ce5;
},getPropertyForm:function(){
if(Ext.getCmp("propertyFormPanel")){
return Ext.getCmp("propertyFormPanel");
}
var _ce7=new Ext.FormPanel({id:"propertyFormPanel",labelWidth:100,frame:false,title:"Property",bodyStyle:"padding:5px 5px 0",width:380,defaults:{width:250},defaultType:"textfield",items:[{id:"propertyNameField",fieldLabel:"Propertyname",name:"propName",allowBlank:false,vtype:"alphanum"},{xtype:"textfield",name:"propRange",id:"propertyRangeField",fieldLabel:"Object Range",anchor:"95%"},{xtype:"checkbox",fieldLabel:"Literal Range",id:"propertyRangeLiteral",boxLabel:"use free-text",name:"literal",inputValue:"1",handler:function(){
Ext.getCmp("propertyRangeField").setDisabled(this.getValue());
}}]});
return _ce7;
},getRootConceptForm:function(root,id){
var id=(id||"rootConceptFormPanel");
if(Ext.getCmp(id)){
return Ext.getCmp(id);
}
var _cea=new Ext.FormPanel({id:id,labelWidth:100,frame:false,title:"New Concept",bodyStyle:"padding:5px 5px 0",width:380,defaults:{width:250},defaultType:"textfield",items:[{id:"rootConceptNameField",fieldLabel:"Name",name:"name",allowBlank:false,vtype:"alphanum"}]});
return _cea;
},getSubConceptForm:function(root,id){
var id=(id||"subConceptFormPanel");
if(Ext.getCmp(id)){
return Ext.getCmp(id);
}
var _ced=new Ext.FormPanel({id:id,labelWidth:100,frame:false,title:"Subconcept",bodyStyle:"padding:5px 5px 0",width:380,defaults:{width:250},defaultType:"textfield",items:[{id:"subConceptNameField",fieldLabel:"Name",name:"name",allowBlank:false,vtype:"alphanum"},{id:"conceptSuperField",fieldLabel:"Superconcept",name:"super",allowBlank:false,vtype:"alphanum",disabled:true}]});
return _ced;
},getNewOntologyForm:function(name){
var id="newOntologyFormPanel";
if(Ext.getCmp(id)){
return Ext.getCmp(id);
}
var _cf0=new Ext.FormPanel({id:id,labelWidth:100,frame:false,title:(name||"Ontology"),bodyStyle:"padding:5px 5px 0",width:380,defaults:{width:250},defaultType:"textfield",items:[{id:"ontologyNameField",fieldLabel:"Name",name:"name",allowBlank:false,vtype:"alphanum"}]});
return _cf0;
},getImportOntologyForm:function(id){
var id=(id||"importOntologyFormPanel");
if(Ext.getCmp(id)){
return Ext.getCmp(id);
}
var _cf2=new Ext.FormPanel({id:id,labelWidth:100,frame:false,title:"Ontology",bodyStyle:"padding:5px 5px 0",width:380,defaults:{width:250},defaultType:"textfield",items:[{id:"ontologyNameField",fieldLabel:"Name",name:"name",allowBlank:false,vtype:"alphanum"},{id:"ontologyUrlField",fieldLabel:"URL",name:"name",allowBlank:false,vtype:"url"}]});
return _cf2;
},getAddElementButton:function(){
if(Ext.getCmp("addElementButton")){
return Ext.getCmp("addElementButton");
}
var _cf3=new Ext.Button({id:"addElementButton",text:"add",handler:function(){
var _cf4=this.getConceptTree().getSelectionModel().getSelectedNode();
var _cf5=this.getDescriptionArea().getValue();
if(this.getFormTabPanel().getActiveTab().id=="propertyFormPanel"){
var mode="ADD_PROPERTY";
if(!this.validatePropertyInputs(_cf4)){
return;
}
var name=Ext.getCmp("propertyNameField").getValue();
var _cf8=Ext.getCmp("propertyRangeField").getValue();
var _cf9=Ext.getCmp("propertyRangeLiteral").getValue();
}else{
if(this.getFormTabPanel().getActiveTab().id=="rootConceptFormPanel"){
var mode="ADD_CLASS";
var _cf4=this.getConceptTree().getRootNode();
if(!this.validateConceptInputs(mode,_cf4)){
return;
}
var name=Ext.getCmp("rootConceptNameField").getValue();
}else{
if(this.getFormTabPanel().getActiveTab().id=="subConceptFormPanel"){
var mode="ADD_SUBCLASS";
if(!this.validateConceptInputs(mode,_cf4)){
return;
}
var name=Ext.getCmp("subConceptNameField").getValue();
var _cfa=Ext.getCmp("conceptSuperField").getValue();
}else{
Ext.Msg.alert("Error","<p>Element kann nicht hinzugef\xc3\xbcgt werden.</p>");
return;
}
}
}
if(name.length==0){
Ext.Msg.alert("Error","<p>Please insert a proper Name for the new Element.</p>");
return;
}
var _cfb=this.getCommentWindow();
_cfb.show();
Ext.getCmp("apply-comment").on("click",function(){
var _cfc=Ext.getCmp("editInformationComment").getValue();
if(mode=="ADD_PROPERTY"){
var cls="propNode";
var _cfe="property_add";
var _cff={"id":"add:::property:::"+name,"command":"add","type":"property","domain":_cf4.text,"range":_cf8,"literal":_cf9,"name":name,"description":_cf5,"comment":_cfc};
}else{
var _cfe="cls_add";
var cls="ontoNode";
var _cff={"id":"add:::concept:::"+name,"command":"add","type":"concept","name":name,"description":_cf5,"super":(_cfa||""),"comment":_cfc};
}
this.addMessageToServer(_cff);
var _d00=new Ext.tree.TreeNode({text:name,id:name,iconCls:_cfe,cls:cls});
_d00.attributes.description=this.getDescriptionArea().getValue();
_cf4.appendChild(_d00);
_cf4.expand();
_d00.select();
this.getPropertyWindow().hide();
_cfb.hide();
}.bind(this));
}.bind(this)});
return _cf3;
},getEditElementButton:function(){
if(Ext.getCmp("editElementButton")){
return Ext.getCmp("editElementButton");
}
var _d01=new Ext.Button({id:"editElementButton",text:"apply",handler:function(){
var node=this.getConceptTree().getSelectionModel().getSelectedNode();
if(node){
if(this.getFormTabPanel().getActiveTab().id=="propertyFormPanel"){
if(!this.validatePropertyInputs(node)){
return;
}
}
var _d03=this.getCommentWindow();
_d03.show();
Ext.getCmp("apply-comment").on("click",function(){
var _d04=node.text;
var _d05=Ext.get(node.ui.iconNode);
var _d06=this.getDescriptionArea().getValue();
var _d07=Ext.getCmp("editInformationComment").getValue();
if(node.attributes.iconCls.indexOf("remove")!=-1){
Ext.Msg.alert("Warning","<p>Would you like to remove you delete Command?</p>");
}
if(this.getFormTabPanel().getActiveTab().id=="propertyFormPanel"){
var _d08="property_edit";
var name=Ext.getCmp("propertyNameField").getValue();
var _d0a=Ext.getCmp("propertyRangeField").getValue();
var _d0b=Ext.getCmp("propertyRangeLiteral").getValue();
var _d0c={"id":"edit:::property:::"+_d04,"command":"edit","type":"property","name":name,"description":_d06,"object":_d04,"comment":_d07,"domain":node.parentNode.text,"range":_d0a,"literal":_d0b};
}else{
var _d08="cls_edit";
var _d0d=node.parentNode.text;
var name=Ext.getCmp("subConceptNameField").getValue();
var _d0c={"id":"edit:::concept:::"+_d04,"command":"edit","type":"concept","name":name,"description":_d06,"super":(_d0d||""),"object":_d04,"comment":_d07};
}
this.addMessageToServer(_d0c);
this.getPropertyWindow().hide();
node.setText(name);
_d05.removeClass(node.attributes.iconCls);
_d05.addClass(_d08);
_d03.hide();
}.bind(this));
}
}.bind(this)});
return _d01;
},getCancelElementButton:function(){
if(Ext.getCmp("cancelElementButton")){
return Ext.getCmp("cancelElementButton");
}
var _d0e=new Ext.Button({id:"cancelElementButton",text:"cancel",handler:function(){
var _d0f=this.getFormTabPanel();
if(_d0f.findById("ontologyFormPanel")){
_d0f.remove(Ext.getCmp("ontologyFormPanel"),false);
}
if(_d0f.findById("conceptFormPanel")){
_d0f.remove(Ext.getCmp("conceptFormPanel"),false);
}
if(_d0f.findById("propertyFormPanel")){
_d0f.remove(Ext.getCmp("propertyFormPanel"),false);
}
this.getPropertyWindow().hide();
}.bind(this)});
return _d0e;
},validateConceptInputs:function(type,_d11){
var _d12=(type=="ADD_SUBCLASS")?"subConceptNameField":"rootConceptNameField";
var name=Ext.getCmp(_d12).getValue();
if(name.length==0){
var msg="Your Concept must have a name. Please insert a name!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp(_d12).markInvalid(msg);
return false;
}
var node=this.getConceptTree().getNodeById(name);
if(node&&node.attributes.cls=="ontoNode"){
var msg="The concept name must be unique. Please insert another name!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp(_d12).markInvalid(msg);
return false;
}
return true;
},validatePropertyInputs:function(_d16){
var _d17=Ext.getCmp("propertyRangeField").getValue();
var _d18=Ext.getCmp("propertyRangeLiteral").getValue();
var name=Ext.getCmp("propertyNameField").getValue();
if(name.length==0){
var msg="Your Property must have a name. Please insert a name!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp("propertyNameField").markInvalid(msg);
return false;
}
var _d1b=_d16;
while(_d1b&&_d1b!=this.getConceptTree().getRootNode()&&_d1b.attributes.cls=="ontoNode"){
for(var i=0;i<_d1b.childNodes.length;i++){
if(_d1b.childNodes[i].text==name){
var msg="The name of the Property must be unique in concept context.";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp("propertyNameField").markInvalid(msg);
return false;
}
}
_d1b=_d1b.parentNode;
}
if(!_d18){
if(_d17.length==0){
var msg="An Objectproperty must have an object Range. Please insert an object range!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp("propertyRangeField").markInvalid(msg);
return false;
}
var _d1d=this.getConceptTree().getNodeById(_d17);
if(!_d1d||_d1d.attributes.cls!="ontoNode"){
var msg="Your inserted object range is unknown. Please first add a new concept or change the object range!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp("propertyRangeField").markInvalid(msg);
return false;
}
if(!_d1d||_d1d==_d16){
var msg="Your inserted object range mustn't be your object domain. Please choose another object range!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
Ext.getCmp("propertyRangeField").markInvalid(msg);
return false;
}
}
return true;
},addElement:function(){
var _d1e=this.getConceptTree().getSelectionModel().getSelectedNode();
var _d1f=this.getRootConceptForm();
var _d20=this.getFormTabPanel();
_d20.add(_d1f);
_d20.setActiveTab(_d1f);
Ext.getCmp("rootConceptNameField").reset();
if(_d1e&&_d1e.attributes.cls=="ontoNode"){
var _d21=this.getSubConceptForm();
var _d22=this.getPropertyForm();
_d20.add(_d21);
_d20.add(_d22);
Ext.getCmp("subConceptNameField").reset();
Ext.getCmp("conceptSuperField").setValue(_d1e.text);
Ext.getCmp("propertyNameField").reset();
Ext.getCmp("propertyRangeField").reset();
_d20.setActiveTab(_d22);
}
var _d23=this.getPropertyWindow("Add Concept/Property",_d20);
_d23.addButton(this.getAddElementButton());
_d23.addButton(this.getCancelElementButton());
_d23.show();
},deleteElement:function(){
var node=this.getConceptTree().getSelectionModel().getSelectedNode();
if(node){
var text=node.text;
var _d26=node.attributes.iconCls;
if(_d26=="cls_add"||_d26=="property_add"){
node.remove();
}else{
var _d27=Ext.get(node.ui.iconNode);
_d27.removeClass("cls");
_d27.removeClass("property");
_d27.removeClass("cls_edit");
_d27.removeClass("property_edit");
if(_d26.indexOf("cls")!=-1){
_d27.addClass("cls_remove");
node.attributes.iconCls="cls_remove";
var type="concept";
}else{
if(_d26.indexOf("property")!=-1){
_d27.addClass("property_remove");
node.attributes.iconCls="property_remove";
var type="property";
}
}
}
var _d29=this.getCommentWindow();
_d29.show();
Ext.getCmp("apply-comment").on("click",function(){
var _d2a=Ext.getCmp("editInformationComment").getValue();
var _d2b={"id":"remove:::"+type+":::"+text,"command":"remove","type":type,"name":text,"comment":_d2a};
this.addMessageToServer(_d2b);
_d29.hide();
}.bind(this));
}
},editElement:function(){
var node=this.getConceptTree().getSelectionModel().getSelectedNode();
if(node){
var _d2d=this.getFormTabPanel();
this.getDescriptionArea().setValue(node.attributes.description);
if(node.attributes.cls=="ontoNode"){
var _d2e=this.getSubConceptForm();
_d2d.add(_d2e);
_d2d.setActiveTab(_d2e);
Ext.getCmp("subConceptNameField").setValue(node.attributes.text);
Ext.getCmp("conceptSuperField").setValue(node.parentNode.attributes.text);
}else{
if(node.attributes.cls=="propNode"){
var _d2f=this.getPropertyForm();
_d2d.add(_d2f);
_d2d.setActiveTab(_d2f);
if(node.firstChild){
Ext.getCmp("propertyNameField").setValue(node.attributes.text);
Ext.getCmp("propertyRangeField").setValue(node.firstChild.attributes.text);
Ext.getCmp("propertyRangeLiteral").setValue("0");
}else{
Ext.getCmp("propertyNameField").setValue(node.attributes.text);
Ext.getCmp("propertyRangeField").setValue("");
Ext.getCmp("propertyRangeLiteral").setValue("1");
}
}
}
var _d30=this.getPropertyWindow("Edit Concept/Property",_d2d);
_d30.addButton(this.getEditElementButton());
_d30.addButton(this.getCancelElementButton());
_d30.show();
}
},annotateDataObject:function(){
var tree=this.getConceptTree();
var _d32=tree.getSelectionModel().getSelectedNode();
var _d33=this.getOntologyList().getSelectionModel().getSelected().get("url");
var _d34=this.facade.getSelection();
if(_d32){
if(!_d32.attributes.iconCls.match("cls")){
Ext.Msg.alert("Your action is not allowed!","<p>You can choose only concepts to annotate this data object.</p>");
return;
}
this.getAnnotationWindow().hide();
_d34[0].setProperty("oryx-annotation",true);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_d34[0],name:"oryx-annotation",value:true});
_d34[0].setProperty("oryx-concept",_d33+"#"+_d32.text);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_d34[0],name:"oryx-concept",value:_d33+"#"+_d32.text});
_d34[0].setProperty("oryx-name",_d32.text);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_d34[0],name:"oryx-name",value:_d32.text});
_d34[0].setProperty("oryx-documentation",_d32.attributes.description);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_d34[0],name:"oryx-documentation",value:_d32.attributes.description});
if(_d34[0].bounds.width()==40){
_d34[0].bounds.extend({x:(_d32.text.length*8),y:0});
}
this.facade.getCanvas().update();
this.facade.setSelection(_d34);
}else{
Ext.Msg.alert("Error","<p>Please take a choice.</p>");
}
},saveNewOntologyVersion:function(_d35){
if(!_d35){
var url=Ext.getCmp("ontoGrid").getSelectionModel().getSelected().get("url");
var _d37=this.getDescriptionArea("Ontology-Description").getValue();
var _d38={"id":"newVersion:::ontology:::"+url,"command":"newVersion","type":"ontology","description":_d37};
this.startProgressBar("Please wait ...","... Creating new Version ...");
this.addMessageToServer(_d38);
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
this.stopProgressBar(false);
return;
}
var _d39=new Ext.form.TextField({fieldLabel:"Name",name:"name",allowBlank:false,vtype:"alphanum"});
var _d3a=new Ext.form.TextField({fieldLabel:"Version",name:"version",allowBlank:false});
var form=new Ext.FormPanel({id:"newVersionForm",labelWidth:50,frame:false,title:"Create (*.owl)",bodyStyle:"padding:5px 5px 0",width:480,defaults:{width:300},defaultType:"textfield",items:[_d39,_d3a]});
var _d3c=new Ext.Window({id:"makeNewVersionWindow",width:500,height:200,autoHeight:true,modal:true,autoScroll:true,title:"Create new Version ...",items:[form],buttons:[{text:"save",handler:(function(){
var name=_d39.getValue();
var _d3e=_d3a.getValue();
var url=Ext.getCmp("ontoGrid").getSelectionModel().getSelected().get("url");
var _d40=this.getDescriptionArea("Ontology-Description");
if(name.length==0){
var msg="Your Ontology must have a name. Please insert a name!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
_d39.markInvalid(msg);
return false;
}
if(_d3e.length==0){
var msg="Your Ontology must have a version, f.e. 'majorVersion'.'minorVersion'. Please insert a versionnumber!";
Ext.Msg.alert("Your input is not valid!","<p>"+msg+"</p>");
_d3a.markInvalid(msg);
return false;
}
_d3c.hide();
var _d42={"id":"newVersion:::ontology:::"+url,"command":"newVersion","type":"ontology","name":name,"version":_d3e,"description":_d40};
this.startProgressBar("Please wait ...","... Creating new Version ...");
this.addMessageToServer(_d42);
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
this.stopProgressBar(false);
}).bind(this)}]});
_d3c.on("hide",function(){
_d3c.destroy(true);
delete _d3c;
});
var _d43=this.getOntologyList().getSelectionModel().getSelected();
var name=_d43.get("name");
_d39.setValue(name);
_d3c.show();
},suggestSemanticBridge:function(){
var _d45=this.facade.getSelection();
var _d46=_d45[0].properties["oryx-concept"];
var _d47=true;
var _d48=new Ext.data.SimpleStore({fields:["concept","bridge"]});
var Data=Ext.data.Record.create([{name:"concept"},{name:"bridge"}]);
this.startProgressBar("Finding suggestions ...");
this.bridgeStore.each(function(_d4a){
var _d4b={"id":"suggest:::semantic bridge:::To:::"+_d46,"command":"suggest","type":"semantic bridge","name":_d46,"semanticBridge":_d4a.get("url")};
this.addMessageToServer(_d4b);
Ext.getCmp("progressbar").updateText("... examining '"+_d4a.get("name")+"' ...");
var _d4c=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,_d46.split("#")[0]).messages;
for(var i=0;i<_d4c.length;i++){
if(this.handleStandardServerMessage(_d4c[i])){
continue;
}
if(_d4c[i].command&&_d4c[i].command=="suggest"){
var _d4e=_d4c[i].name;
var _d4f=_d4c[i].ontology;
if(_d4e&&_d4f){
_d48.add(new Data({concept:(_d4f+"#"+_d4e),bridge:_d4a.get("name")}));
}
_d47=true;
}
}
}.bind(this));
this.stopProgressBar(true);
if(_d47){
var _d50=_d45[0];
var _d51=new Ext.Window({id:"suggestion-window",width:600,height:200,autoHeight:true,modal:true,autoScroll:true,title:"Possible Semantic Bridges ...",items:[{xtype:"grid",id:"suggestionGrid",title:"Suggestions",store:_d48,rowspan:2,width:580,height:200,autoExpandColumn:"conceptCol",columns:[{id:"conceptCol",header:"Concept",sortable:true,dataIndex:"concept"},{id:"bridgeCol",header:"Bridge",sortable:false,dataIndex:"bridge"}],sm:new Ext.grid.RowSelectionModel({singleSelect:true,listeners:{rowselect:function(_d52,_d53,_d54){
_d50=this.highlight(this.facade.getCanvas(),"oryx-concept",_d54.get("concept"));
}.bind(this)}})}],buttons:[{text:"setup",disabled:(_d48.getCount()==0),handler:function(){
if(_d50){
_d51.hide();
this.setupSemanticBridge(_d45[0],_d50);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"suggestSemanticBridge"});
}else{
Ext.Msg.alert("Error","<p>Please pick a suggestion.</p>");
}
}.bind(this)},{text:"close",handler:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"suggestSemanticBridge"});
_d51.hide();
}.bind(this)}]});
_d51.on("hide",function(){
_d51.destroy(true);
delete _d51;
});
_d51.show();
if(_d48.getCount()>0){
this.workaroundSelectRowInGrid(Ext.getCmp("suggestionGrid"),0);
}
}else{
Ext.Msg.alert("No suggestion found","<p>There was no Semantic Bridge found for this Semantic Dataobjekt.</p>");
}
},showSemanticDataObject:function(){
var _d55=this.facade.getSelection();
var _d56=_d55[0].properties["oryx-concept"];
this.getAnnotationWindow(_d56).show();
var tree=this.getConceptTree();
this.filter.filter(new RegExp("[^flat]","i"),"type",tree.getRootNode());
tree.getTopToolbar().addSeparator();
tree.on({"click":function(_d58){
var _d59=tree.getTopToolbar().items.filterBy(function(o,k){
if(k.match("^switch-filter")=="switch-filter"){
o.destroy();
}
});
if(_d58.attributes.ns&&_d58.attributes.ns.split(",").length>1){
var menu=new Ext.menu.Menu({});
var _d5d=new Ext.menu.Item({id:"toolbar-button-filter-clear",iconCls:"filter_clear",text:"Polymorph",handler:function(){
this.filter.clear();
}.bind(this)});
menu.add(_d5d);
var _d5e=_d58.attributes.ns.split(",");
for(var i=0;i<_d5e.length;i++){
var name=_d5e[i];
var url=name.substring(0,name.length-1);
var _d62=this.ontologyStore.getAt(this.ontologyStore.find("url",url));
menu.add(new Ext.menu.Item({id:"toolbar-button-filter-"+name,text:_d62.get("name"),iconCls:"filter_"+(i+1),name:name,handler:function(_d63){
this.filter.clear();
this.filter.filter(new RegExp(_d63.name,"i"),"ns",_d58);
}.bind(this)}));
}
tree.getTopToolbar().add(new Ext.Toolbar.SplitButton({id:"switch-filter",text:"filter",tooltip:{text:"Switch between the forms of the polymorph concept.",title:"Forms"},iconCls:"blist",menu:menu}));
}
}.bind(this)});
if(_d56){
}else{
this.getOntologyList().getSelectionModel().selectFirstRow();
}
},resetOntology:function(url){
var row=this.ontologyStore.find("url",url);
var _d66=this.ontologyStore.getAt(row);
var name=_d66.get("name");
this.startProgressBar("Please Wait ...","... Restoring Data Object ...");
var _d68={"id":"reload:::ontology:::"+url,"command":"reload","type":"ontology","name":name};
this.addMessageToServer(_d68);
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
this.stopProgressBar();
},importToSemanticPool:function(id){
var _d6a=new Ext.Window({id:"import-window",width:400,height:200,autoHeight:true,modal:true,autoScroll:true,title:"Import ontologies ...",items:[this.getImportOntologyForm("importForm")],buttons:[{text:"import",handler:function(){
var url=Ext.getCmp("ontologyUrlField").getValue();
var _d6c=Ext.getCmp("ontologyNameField").getValue();
if(!url){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a valid URL.</p>");
return;
}else{
if((id=="oryx_pool_sbridges"&&this.bridgeStore.find("url",url)>-1)||(id=="oryx_pool_onologies"&&this.ontologyStore.find("url",url)>-1)){
Ext.MessageBox.alert("Import not allowed!","<p>The given URL '"+url+"' is already in the pool.</p>");
return;
}else{
if(!_d6c){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a Name.</p>");
return;
}else{
if((id=="oryx_pool_sbridges"&&this.bridgeStore.find("name",_d6c)>-1)||(id=="oryx_pool_onologies"&&this.ontologyStore.find("name",_d6c)>-1)){
Ext.MessageBox.alert("Import not allowed!","<p>There is already an entry with the name '"+_d6c+"'</p>");
return;
}
}
}
}
this.startProgressBar("Import","importing ... please wait ...");
if(id=="oryx_pool_onologies"){
var _d6d={"id":"import:::ontology:::"+url,"command":"import","type":"ontology","name":_d6c};
}else{
if(id=="oryx_pool_sbridges"){
var _d6d={"id":"import:::semantic bridge:::"+url,"command":"import","type":"semantic bridge","name":_d6c};
}
}
_d6a.hide();
this.addMessageToServer(_d6d);
var _d6e=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url);
this.handleStandardServerResponse(_d6e);
this.stopProgressBar(true);
}.bind(this)},{id:"cancelButton",text:"cancel",handler:function(){
_d6a.hide();
}}]});
_d6a.on("hide",function(){
_d6a.destroy(true);
delete _d6a;
});
_d6a.show();
},showSemanticPool:function(_d6f){
var _d70=new Ext.grid.GridPanel({id:"oryx_pool_onologies",title:"Ontologies",store:this.ontologyStore,autoExpandColumn:"urlCol",height:300,columns:[{header:"Name",sortable:true,width:150,dataIndex:"name"},{header:"Version",sortable:false,dataIndex:"version"},{id:"urlCol",header:"URL",sortable:true,dataIndex:"url"}]});
var _d71=new Ext.grid.GridPanel({id:"oryx_pool_sbridges",title:"Semantic Bridges",store:this.bridgeStore,autoExpandColumn:"urlCol",height:300,columns:[{header:"Name",sortable:true,width:150,dataIndex:"name"},{header:"Version",sortable:false,dataIndex:"version"},{id:"urlCol",header:"URL",sortable:true,dataIndex:"url"}]});
var _d72=new Ext.TabPanel({activeTab:0,viewConfig:{forceFit:true},items:[_d70,_d71]});
var _d73=new Ext.Panel({items:[{xtype:"label",text:"Organize your ontologies and semantic bridges.",style:"margin:10px;display:block"},_d72],frame:true,buttons:[{text:"new",handler:function(){
if(_d72.getActiveTab().id=="oryx_pool_onologies"){
var form=this.getNewOntologyForm();
var _d75=this.getFormTabPanel();
_d75.add(form);
var _d76=this.getPropertyWindow("Add Ontologies",_d75);
var _d77=new Ext.Button({id:"newOntologyButton",text:"create",handler:function(){
var text=Ext.getCmp("ontologyNameField").getValue();
if(!text){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a Name.</p>");
return;
}
var _d79=this.getDescriptionArea().getValue();
var _d7a={"id":"create:::ontology:::"+text,"command":"create","type":"ontology","name":text,"description":_d79};
this.addMessageToServer(_d7a);
this.startProgressBar("Please wait ...","... creating new Ontology ...");
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL));
this.stopProgressBar(true);
_d76.hide();
}.bind(this)});
_d76.addButton(_d77);
}else{
if(_d72.getActiveTab().id=="oryx_pool_sbridges"){
var form=this.getNewOntologyForm("Semantic Bridge");
var _d75=this.getFormTabPanel(120);
form.add({xtype:"combo",id:"source-ontology",name:"source ontology",fieldLabel:"Source ontology",mode:"local",store:this.ontologyStore,displayField:"name",typeAhead:true,forceSelection:true,emptyText:"Select the source ontology ...",selectOnFocus:true},{xtype:"combo",id:"target-ontology",name:"target ontology",fieldLabel:"Target ontology",mode:"local",store:this.ontologyStore,displayField:"name",typeAhead:true,forceSelection:true,emptyText:"Select the target ontology ...",selectOnFocus:true});
_d75.add(form);
var _d76=this.getPropertyWindow("Add Semantic Bridge",_d75);
var _d77=new Ext.Button({id:"newSemanticBridgeButton",text:"create",handler:function(){
var text=Ext.getCmp("ontologyNameField").getValue();
if(!text){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a Name.</p>");
return;
}
var _d7c=Ext.getCmp("source-ontology").getValue();
if(!_d7c){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a Source Ontology.</p>");
return;
}
var _d7d=Ext.getCmp("target-ontology").getValue();
if(!_d7d){
Ext.MessageBox.alert("Input not allowed!","<p>You must insert a Target Ontology.</p>");
return;
}
var row=this.ontologyStore.find("name",_d7c);
var _d7f=this.ontologyStore.getAt(row);
var _d80=_d7f.get("url");
row=this.ontologyStore.find("name",_d7d);
_d7f=this.ontologyStore.getAt(row);
var _d81=_d7f.get("url");
var _d82=this.getDescriptionArea().getValue();
var _d83={"id":"create:::bridge:::"+text,"command":"create","type":"semantic bridge","name":text,"sourceOntology":_d80,"targetOntology":_d81,"description":_d82};
this.addMessageToServer(_d83);
this.startProgressBar("Please wait ...","... creating new Semantic Bridge ...");
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL));
this.stopProgressBar(true);
_d76.hide();
}.bind(this)});
_d76.addButton(_d77);
}
}
_d76.addButton(this.getCancelElementButton());
_d76.show();
}.bind(this)},{text:"import",handler:function(){
this.importToSemanticPool(_d72.getActiveTab().id);
}.bind(this)},{text:"export",handler:function(){
this.exportToSemanticPool(_d72.getActiveTab().id);
}.bind(this)},{text:"delete",handler:(function(){
if(_d72.getActiveTab().id=="oryx_pool_onologies"){
var _d84=_d70.getSelectionModel().getSelected();
this.ontologyStore.remove(_d84);
}else{
if(_d72.getActiveTab().id=="oryx_pool_sbridges"){
var _d84=_d71.getSelectionModel().getSelected();
this.bridgeStore.remove(_d84);
}
}
}).bind(this)},{text:"cancel",handler:function(){
this.getFormTabPanel().remove(this.getNewOntologyForm());
Ext.getCmp("oryx_semanticpool_window").close();
this.persistPool();
}.bind(this)}]});
var _d85=new Ext.Window({id:"oryx_semanticpool_window",width:500,title:"Semantic Pool",floating:true,shim:true,modal:true,resizable:true,autoHeight:true,items:[_d73],height:400});
_d85.show();
},persistPool:function(){
var _d86="oryx-semanticpool";
var _d87=this.facade.getCanvas();
var _d88=_d87.getStencil().property(_d86);
var _d89=this.buildValue(_d88.complexItems());
_d87.setProperty(_d86,_d89);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:this.facade.getCanvas(),name:_d86,value:_d89});
},exportToSemanticPool:function(id){
var _d8b=Ext.getCmp(id).getSelectionModel().getSelected();
if(_d8b){
Ext.MessageBox.alert("Export ...","<p><b>'"+_d8b.get("name")+"'</b> kann nun herunter geladen werden... <a href='"+_d8b.get("url")+"' target='_blank'>Download</a></p>");
}
},addSemanticBridgeServerCall:function(_d8c){
var url=_d8c.properties["oryx-url"];
var _d8e=_d8c.properties["oryx-source"];
var _d8f=_d8c.properties["oryx-target"];
var row=this.bridgeStore.find("url",url);
var _d91=this.bridgeStore.getAt(row);
if(!_d8e||!_d8f||!_d91){
console.log("fehlerhafte Konfiguration der Semantischen Br\xc3\xbccke:");
console.log(_d8e);
console.log(_d8f);
console.log(_d91);
return;
}
var _d92=_d8e.split("#");
var _d93=this.ontologyStore.getAt(this.ontologyStore.find("url",_d92[0]));
var _d94={"id":"semanticBridge:::"+_d91.get("url"),"command":"semanticBridge","type":"ontology","name":_d93.get("name"),"xml":_d93.get("xml"),"semanticBridge":_d91.get("url"),"sourceOntology":_d8e,"targetOntology":_d8f,"shapeid":_d8c.id};
this.addMessageToServer(_d94);
},handleSemanticBridgeResponse:function(_d95,_d96){
var _d97=_d95.messages;
var icon=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":"Semantische Br\xc3\xbccke noch nicht spezifiziert.","stroke-width":3,"stroke":"orange","d":"M12,-5 L12,-7 M12,-9 L12,-20","line-captions":"round"}]);
for(var i=0;i<_d97.length;i++){
if(_d97[i].error){
var _d9a=this.facade.getSelection()[0];
var icon=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":"Semantische Br\xc3\xbccke ist fehlerhaft.","stroke-width":3,"stroke":"red","d":"M20,-5 L5,-20 M5,-5 L20,-20","line-captions":"round"}]);
setTimeout(function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"Semantic Bridge Validation",shapes:[_d9a],node:icon,nodePosition:"START"});
}.bind(this),1500);
}
if(this.handleStandardServerMessage(_d97[i])){
continue;
}
var _d9a=this.facade.getCanvas().getChildById(_d97[i].shapeid,true);
if(_d97[i].command=="changeConceptname"&&_d9a&&_d9a.incoming.length==1){
var _d9b=_d9a.incoming[0];
_d9b.setProperty("oryx-name",_d97[i].name);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,element:_d9b,name:"oryx-name",value:_d97[i].name});
if(_d96){
_d9b.bounds.extend({x:(_d97[i].name.length*5),y:0});
}
this.facade.getCanvas().update();
this.facade.setSelection(new Array(_d9a));
icon=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":"Semantische Br\xc3\xbccke korrekt.","stroke-width":3,"stroke":"green","d":"M12,-5 L5,-15 M12,-5 L20,-20","line-captions":"round"}]);
setTimeout(function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"Semantic Bridge Validation",shapes:[_d9a],node:icon,nodePosition:"START"});
}.bind(this),1500);
}else{
}
}
return result;
},setupSemanticBridge:function(_d9c,_d9d){
var _d9e=_d9c.properties["oryx-concept"];
var _d9f=_d9d.properties["oryx-concept"];
if(!(_d9e&&_d9f)){
Ext.MessageBox.alert("Error","<p>Only annotated Dataobjects allowed.</p>");
}else{
var _da0=new Ext.Window({id:"setup-semanticbridge",width:590,title:"Setup Semantic Bridge",labelWidth:100,modal:true,resizable:true,items:[{xtype:"form",id:"setupBridgeForm",labelWidth:100,frame:false,title:"Setup Semantic Bridge",bodyStyle:"padding:5px 5px 0",width:580,defaults:{width:420},items:[{xtype:"textfield",id:"source-concept",name:"source concept",allowBlank:false,fieldLabel:"source concept",readOnly:true,value:_d9e},{xtype:"textfield",id:"target-concept",name:"target concept",allowBlank:false,fieldLabel:"target concept",readOnly:true,value:_d9f},{xtype:"combo",id:"semanticbridgechoice",name:"semantic bridge",fieldLabel:"semantic bridge",mode:"local",store:this.bridgeStore,displayField:"url",typeAhead:true,forceSelection:true,emptyText:"Select a semantic bridge ...",selectOnFocus:true}]}],buttons:[{text:"setup",handler:function(){
var _da1=Ext.getCmp("semanticbridgechoice").selectedIndex;
if(_d9c&&_d9d){
var data=this.bridgeStore.getAt(_da1);
var _da3=_d9d.absoluteXY();
var _da4=_d9c.getDefaultMagnet();
var _da5=_da4?_da4.bounds.center():_da6.connectedShape.bounds.midPoint();
var _da6={type:"http://b3mn.org/stencilset/bpmn1.1#semanticBridge",namespace:"http://b3mn.org/stencilset/bpmn1.1#",parent:_d9d,connectedShape:_d9c};
this.ignoreShapeAddedEvent=true;
var _da7=this.facade.createShape(_da6);
_da7.setProperty("oryx-source",_d9e);
_da7.setProperty("oryx-target",_d9f);
_da7.setProperty("oryx-url",data.get("url"));
_da7.setProperty("oryx-name",data.get("name"));
_da7.dockers.first().setDockedShape(_d9c);
_da7.dockers.first().setReferencePoint(_d9c.getDefaultMagnet().bounds.center());
_da7.dockers.last().setDockedShape(_d9d);
_da7.dockers.last().setReferencePoint(_d9d.getDefaultMagnet().bounds.center());
this.facade.getCanvas().update();
this.facade.setSelection(new Array(_da7));
this.ignoreShapeAddedEvent=false;
this.startProgressBar("Please wait ...","... executing Semantic Bridge  ...");
this.addSemanticBridgeServerCall(_da7);
var _da8=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL);
this.handleSemanticBridgeResponse(_da8,true);
this.stopProgressBar(true);
_da0.hide();
}
}.bind(this)},{text:"cancel",handler:function(){
_da0.hide();
}}],height:180});
_da0.on("hide",function(){
_da0.destroy(true);
delete _da0;
});
_da0.show();
}
},editSemanticBridge:function(){
var _da9=this.facade.getSelection();
var name=_da9[0].properties["oryx-name"];
var url=_da9[0].properties["oryx-url"];
var _dac=_da9[0].properties["oryx-source"];
var _dad=_da9[0].properties["oryx-target"];
var _dae=_da9[0].properties["oryx-version"];
var _daf=_da9[0].properties["oryx-documantation"];
var row=this.bridgeStore.find("url",url);
var _db1=this.bridgeStore.getAt(row);
var _db2=new Ext.data.SimpleStore({fields:["name","rule","comment","added"]});
var Data=Ext.data.Record.create([{name:"name"},{name:"rule"},{name:"comment"},{name:"added"}]);
this.startProgressBar("Reading Semantic Bridge ...","... receiving Information ...");
var _db4={"id":"getrules:::"+url,"command":"getrules","type":"semantic bridge"};
this.addMessageToServer(_db4);
var _db5=this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url).messages;
for(var i=0;i<_db5.length;i++){
this.handleStandardServerMessage(_db5[i]);
if(_db5[i].rules){
var _db7=_db5[i].rules;
for(var j=0;j<_db7.length;j++){
_db2.add(new Data({name:_db7[j].name,comment:_db7[j].comment,rule:_db7[j].rules,added:false}));
}
}
}
this.stopProgressBar(true);
var _db9=new Ext.Window({id:"edit-semanticbridge",width:590,title:"Semantic Bridge",labelWidth:100,modal:true,resizable:true,autoHeight:true,items:[{xtype:"form",id:"editBridgeForm",labelWidth:100,frame:false,title:"Properties",bodyStyle:"padding:5px 5px 0",width:580,defaults:{width:420},items:[{xtype:"textfield",id:"bridge-name",name:"name",allowBlank:false,fieldLabel:"Name",value:name},{xtype:"textfield",id:"bridge-url",name:"url",allowBlank:false,fieldLabel:"Url",disabled:true,value:url},{xtype:"textfield",id:"source-concept",name:"source concept",allowBlank:false,fieldLabel:"Source Concept",disabled:true,value:_dac},{xtype:"textfield",id:"target-concept",name:"target concept",allowBlank:false,fieldLabel:"Target Concept",disabled:true,value:_dad},{xtype:"textarea",id:"bridge-description",name:"description",height:100,value:_daf,fieldLabel:"Description"}]},{xtype:"grid",id:"rulesGrid",title:"Rules",store:_db2,width:580,height:200,tbar:[{iconCls:"add",text:"add Rule",handler:function(){
var _dba=new Ext.Window({id:"addRuleWindow",width:590,title:"Add new Rule",modal:true,resizable:true,autoHeight:true,items:[{xtype:"form",id:"addRuleForm",labelWidth:100,frame:false,title:"Add your requirements",bodyStyle:"padding:5px 5px 0",width:580,defaults:{width:420},items:[{xtype:"textfield",id:"ruleName",name:"ruleName",allowBlank:false,fieldLabel:"Name"},{xtype:"textarea",id:"ruleRequirements",name:"ruleRequirements",height:100,fieldLabel:"Requirements"}],buttons:[{text:"ok",handler:function(){
_db2.add(new Data({name:Ext.getCmp("ruleName").getValue(),comment:Ext.getCmp("ruleRequirements").getValue(),rule:"",added:true}));
_dba.hide();
}},{text:"cancel",handler:function(){
_dba.hide();
}}]}]});
_dba.on("hide",function(){
_dba.destroy(true);
delete _dba;
});
_dba.show();
}.bind(this)}],autoExpandColumn:"nameCol",columns:[{id:"nameCol",header:"Name",sortable:true,dataIndex:"name"}]}],buttons:[{text:"apply",handler:function(){
var _dbb=this.getCommentWindow();
_dbb.show();
Ext.getCmp("apply-comment").on("click",function(){
this.startProgressBar("Updating Semantic Bridge ...","... sending Updates ...");
var _dbc={"id":"edit:::semantic bridge:::"+url,"command":"edit","type":"semantic bridge","name":Ext.getCmp("bridge-name").getValue(),"description":Ext.getCmp("bridge-description").getValue(),"comment":Ext.getCmp("editInformationComment").getValue()};
this.addMessageToServer(_dbc);
_db2.each(function(_dbd){
if(_dbd.get("added")){
var _dbe={"id":"addRules:::semantic bridge:::"+url,"command":"add","type":"rule","name":_dbd.get("name"),"comment":_dbd.get("comment")};
this.addMessageToServer(_dbe);
}
}.bind(this));
var _dbc={"id":"newVersion:::semantic bridge:::"+url,"command":"newVersion","type":"semantic bridge","name":name,"version":_db1.get("version")};
this.addMessageToServer(_dbc);
this.handleStandardServerResponse(this.sendMessagesToServer(ORYX.CONFIG.SEMANTIC_EXTENSION_URL,url));
this.stopProgressBar(true);
_dbb.hide();
_db9.hide();
}.bind(this));
}.bind(this)},{text:"cancel",handler:function(){
_db9.hide();
}}],height:450});
_db9.on("hide",function(){
_db9.destroy(true);
delete _db9;
});
_db9.show();
},buildValue:function(_dbf){
this.ontologyStore.commitChanges();
this.bridgeStore.commitChanges();
if(this.ontologyStore.getCount()==0&&this.bridgeStore.getCount()==0){
return "";
}
var _dc0="[";
for(var i=0;i<this.ontologyStore.getCount();i++){
var data=this.ontologyStore.getAt(i);
_dc0+="{";
for(var j=0;j<_dbf.length;j++){
var key=_dbf[j].id();
_dc0+=key+":"+data.get(key).toJSON();
if(j<(_dbf.length-1)){
_dc0+=", ";
}
}
_dc0+="}";
if(i<(this.ontologyStore.getCount()-1)||this.bridgeStore.getCount()>0){
_dc0+=", ";
}
}
for(var i=0;i<this.bridgeStore.getCount();i++){
var data=this.bridgeStore.getAt(i);
_dc0+="{";
for(var j=0;j<_dbf.length;j++){
var key=_dbf[j].id();
_dc0+=key+":"+data.get(key).toJSON();
if(j<(_dbf.length-1)){
_dc0+=", ";
}
}
_dc0+="}";
if(i<(this.bridgeStore.getCount()-1)){
_dc0+=", ";
}
}
_dc0+="]";
_dc0="{'totalCount':"+(this.ontologyStore.getCount()+this.bridgeStore.getCount()).toJSON()+", 'items':"+_dc0+"}";
return _dc0;
},FireFox3Fix:function(type){
var _dc6=9000;
if(Ext.isGecko3){
if(type){
_dc6=Ext.WindowMgr.zseed;
Ext.WindowMgr.zseed=9900;
}else{
Ext.WindowMgr.zseed=_dc6;
}
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.ShapeHighlighting=Clazz.extend({construct:function(_dc7){
this.parentNode=_dc7.getCanvas().getSvgContainer();
this.node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.parentNode,["g"]);
this.highlightNodes={};
_dc7.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,this.setHighlight.bind(this));
_dc7.registerOnEvent(ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,this.hideHighlight.bind(this));
},setHighlight:function(_dc8){
if(_dc8&&_dc8.highlightId){
var node=this.highlightNodes[_dc8.highlightId];
if(!node){
node=ORYX.Editor.graft("http://www.w3.org/2000/svg",this.node,["path",{"stroke-width":2,"fill":"none"}]);
this.highlightNodes[_dc8.highlightId]=node;
}
if(_dc8.elements&&_dc8.elements.length>0){
this.setAttributesByStyle(node,_dc8);
this.show(node);
}else{
this.hide(node);
}
}
},hideHighlight:function(_dca){
if(_dca&&_dca.highlightId&&this.highlightNodes[_dca.highlightId]){
this.hide(this.highlightNodes[_dca.highlightId]);
}
},hide:function(node){
node.setAttributeNS(null,"display","none");
},show:function(node){
node.setAttributeNS(null,"display","");
},setAttributesByStyle:function(node,_dce){
if(_dce.style&&_dce.style==ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE){
var bo=_dce.elements[0].absoluteBounds();
var _dd0=_dce.strokewidth?_dce.strokewidth:ORYX.CONFIG.BORDER_OFFSET;
node.setAttributeNS(null,"d",this.getPathRectangle(bo.a,bo.b,_dd0));
node.setAttributeNS(null,"stroke",_dce.color?_dce.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
node.setAttributeNS(null,"stroke-opacity",_dce.opacity?_dce.opacity:0.2);
node.setAttributeNS(null,"stroke-width",_dd0);
}else{
node.setAttributeNS(null,"d",this.getPathByElements(_dce.elements));
node.setAttributeNS(null,"stroke",_dce.color?_dce.color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR);
node.setAttributeNS(null,"stroke-opacity",_dce.opacity?_dce.opacity:1);
node.setAttributeNS(null,"stroke-width",_dce.strokewidth?_dce.strokewidth:2);
}
},getPathByElements:function(_dd1){
if(!_dd1||_dd1.length<=0){
return undefined;
}
var _dd2=ORYX.CONFIG.SELECTED_AREA_PADDING;
var path="";
_dd1.each((function(_dd4){
if(!_dd4){
return;
}
var _dd5=_dd4.absoluteBounds();
_dd5.widen(_dd2);
var a=_dd5.upperLeft();
var b=_dd5.lowerRight();
path=path+this.getPath(a,b);
}).bind(this));
return path;
},getPath:function(a,b){
return this.getPathCorners(a,b);
},getPathCorners:function(a,b){
var size=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var path="";
path=path+"M"+a.x+" "+(a.y+size)+" l0 -"+size+" l"+size+" 0 ";
path=path+"M"+a.x+" "+(b.y-size)+" l0 "+size+" l"+size+" 0 ";
path=path+"M"+b.x+" "+(b.y-size)+" l0 "+size+" l-"+size+" 0 ";
path=path+"M"+b.x+" "+(a.y+size)+" l0 -"+size+" l-"+size+" 0 ";
return path;
},getPathRectangle:function(a,b,_de0){
var size=ORYX.CONFIG.SELECTION_HIGHLIGHT_SIZE;
var path="";
var _de3=_de0/2;
path=path+"M"+(a.x+_de3)+" "+(a.y);
path=path+" L"+(a.x+_de3)+" "+(b.y-_de3);
path=path+" L"+(b.x-_de3)+" "+(b.y-_de3);
path=path+" L"+(b.x-_de3)+" "+(a.y+_de3);
path=path+" L"+(a.x+_de3)+" "+(a.y+_de3);
return path;
}});
ORYX.Plugins.HighlightingSelectedShapes=Clazz.extend({construct:function(_de4){
this.facade=_de4;
this.opacityFull=0.9;
this.opacityLow=0.4;
},onSelectionChanged:function(_de5){
if(_de5.elements&&_de5.elements.length>1){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"selection",elements:_de5.elements.without(_de5.subSelection),color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:!_de5.subSelection?this.opacityFull:this.opacityLow});
if(_de5.subSelection){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"subselection",elements:[_de5.subSelection],color:ORYX.CONFIG.SELECTION_HIGHLIGHT_COLOR,opacity:this.opacityFull});
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"});
}
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"selection"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"subselection"});
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.ShapeMenuPlugin={construct:function(_de6,_de7){
this.facade=_de6;
this.myPluginData=_de7;
this.alignGroups=new Hash();
this.myPluginData.properties.each(function(_de8){
if(_de8.group&&_de8.align!=undefined){
this.alignGroups[_de8.group]=_de8.align;
}
}.bind(this));
var _de9=this.facade.getCanvas().getHTMLContainer();
this.shapeMenu=new ORYX.Plugins.ShapeMenu(_de9);
this.currentShapes=[];
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_START,this.hideShapeMenu.bind(this));
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_DRAGDROP_END,this.showShapeMenu.bind(this));
var _dea=new Ext.dd.DragZone(_de9.parentNode,{shadow:!Ext.isMac});
_dea.afterDragDrop=this.afterDragging.bind(this,_dea);
_dea.beforeDragOver=this.beforeDragOver.bind(this,_dea);
this.createdButtons={};
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED,(function(){
this.registryChanged();
}).bind(this));
this.timer=null;
this.resetElements=true;
},hideShapeMenu:function(_deb){
window.clearTimeout(this.timer);
this.timer=null;
this.shapeMenu.hide();
},showShapeMenu:function(_dec){
if(!_dec||this.resetElements){
window.clearTimeout(this.timer);
this.timer=window.setTimeout(function(){
this.shapeMenu.closeAllButtons();
this.showButtons(this.currentShapes);
this.showStencilButtons(this.currentShapes);
this.shapeMenu.show(this.currentShapes);
this.resetElements=false;
}.bind(this),300);
}else{
window.clearTimeout(this.timer);
this.timer=null;
this.shapeMenu.show(this.currentShapes);
}
},registryChanged:function(_ded){
if(_ded){
_ded=_ded.each(function(_dee){
_dee.group=_dee.group?_dee.group:"unknown";
});
this.pluginsData=_ded.sortBy(function(_def){
return (_def.group+""+_def.index);
});
}
this.shapeMenu.removeAllButtons();
this.createdButtons={};
if(!this.pluginsData){
this.pluginsData=[];
}
this.pluginsData.each((function(_df0){
if(!this.createdButtons[_df0.group]){
this.createdButtons[_df0.group]=new ORYX.Plugins.ShapeMenuButton({callback:null,align:(this.alignGroups[_df0.group]!=undefined?this.alignGroups[_df0.group]:ORYX.CONFIG.SHAPEMENU_BOTTOM)});
this.shapeMenu.addButton(this.createdButtons[_df0.group]);
}
this.createdButtons[_df0.group+_df0.name]=new ORYX.Plugins.ShapeMenuButton({callback:_df0.functionality,icon:_df0.icon,msg:_df0.name});
this.createdButtons[_df0.group].add(this.createdButtons[_df0.group+_df0.name]);
}).bind(this));
var _df1=this.facade.getStencilSets();
_df1.values().each((function(_df2){
var _df3=new ORYX.Plugins.ShapeMenuButton({callback:undefined,align:ORYX.CONFIG.SHAPEMENU_RIGHT});
this.shapeMenu.addButton(_df3);
this.createdButtons[_df2.namespace()]=_df3;
var _df4=_df2.edges();
_df4.each((function(edge){
var _df6={type:edge.id(),namespace:edge.namespace()};
var _df7=new ORYX.Plugins.ShapeMenuButton({callback:this.newShape.bind(this,_df6),icon:edge.icon(),msg:edge.title()+" - "+ORYX.I18N.ShapeMenuPlugin.drag,dragcallback:this.hideShapeMenu.bind(this)});
_df3.add(_df7);
this.createdButtons[edge.namespace()+edge.type()+edge.id()]=_df7;
Ext.dd.Registry.register(this.createdButtons[edge.namespace()+edge.type()+edge.id()].node.lastChild,_df6);
var _df8=this.facade.getRules().targetStencils({canvas:this.facade.getCanvas(),edgeStencil:edge});
_df8.each((function(_df9){
var _dfa={"type":_df9.id(),"connectingType":edge.id(),namespace:_df9.namespace()};
var _dfb=new ORYX.Plugins.ShapeMenuButton({callback:this.newShape.bind(this,_dfa),icon:_df9.icon(),msg:_df9.title()+" - "+ORYX.I18N.ShapeMenuPlugin.clickDrag,dragcallback:this.hideShapeMenu.bind(this)});
_df7.add(_dfb);
this.createdButtons[_df9.namespace()+edge.id()+_df9.type()+_df9.id()]=_dfb;
Ext.dd.Registry.register(this.createdButtons[_df9.namespace()+edge.id()+_df9.type()+_df9.id()].node.lastChild,_dfa);
}).bind(this));
}).bind(this));
}).bind(this));
},onSelectionChanged:function(_dfc){
var _dfd=_dfc.elements;
this.hideShapeMenu();
if(this.currentShapes.inspect()!==_dfd.inspect()){
this.currentShapes=_dfd;
this.resetElements=true;
this.showShapeMenu();
}else{
this.showShapeMenu(true);
}
},showButtons:function(_dfe){
this.pluginsData.each((function(_dff){
if(_dff.minShape&&_dff.minShape>_dfe.length){
return;
}
if(_dff.maxShape&&_dff.maxShape<_dfe.length){
return;
}
if(_dff.isEnabled&&!_dff.isEnabled()){
return;
}
if(!_dff.maxShape&&!_dff.minShape){
return;
}
if(!this.createdButtons[_dff.group].isVisible){
this.createdButtons[_dff.group].prepareToShow();
}
this.createdButtons[_dff.group+_dff.name].prepareToShow();
}).bind(this));
},showStencilButtons:function(_e00){
if(_e00.length!=1){
return;
}
var sset=this.facade.getStencilSets()[_e00[0].getStencil().namespace()];
this.createdButtons[sset.namespace()].prepareToShow();
var _e02=this.facade.getRules().outgoingEdgeStencils({canvas:this.facade.getCanvas(),sourceShape:_e00[0]});
_e02.each((function(edge){
this.createdButtons[edge.namespace()+edge.type()+edge.id()].prepareToShow();
var _e04=this.facade.getRules().targetStencils({canvas:this.facade.getCanvas(),sourceShape:_e00[0],edgeStencil:edge});
this.createdButtons[edge.namespace()+edge.type()+edge.id()].setChildWidth(Math.ceil(_e04.length/5)*25);
_e04.each((function(_e05){
this.createdButtons[_e05.namespace()+edge.id()+_e05.type()+_e05.id()].prepareToShow();
}).bind(this));
}).bind(this));
if(_e02.length==0){
this.createdButtons[sset.namespace()].prepareToHide();
}
},beforeDragOver:function(_e06,_e07,_e08){
var _e09=this.facade.eventCoordinates(_e08.browserEvent);
var _e0a=this.facade.getCanvas().getAbstractShapesAtPosition(_e09);
if(_e0a.length<=0){
return false;
}
var el=_e0a.last();
if(this._lastOverElement==el){
return false;
}else{
var _e0c=Ext.dd.Registry.getHandle(_e07.DDM.currentTarget);
var _e0d=this.facade.getStencilSets()[_e0c.namespace];
var _e0e=_e0d.stencil(_e0c.type);
var _e0f=_e0a.last();
if(_e0e.type()==="node"){
var _e10=this.facade.getRules().canContain({containingShape:_e0f,containedStencil:_e0e});
this._currentReference=_e10?_e0f:undefined;
}else{
var _e11=true;
if(!(_e0f instanceof ORYX.Core.Canvas)){
_e11=this.facade.getRules().canConnect({sourceShape:this.currentShapes.first(),edgeStencil:_e0e,targetShape:_e0f});
}
this._currentReference=_e11?_e0f:undefined;
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeMenu",elements:[_e0f],color:this._currentReference?ORYX.CONFIG.SELECTION_VALID_COLOR:ORYX.CONFIG.SELECTION_INVALID_COLOR});
var pr=_e06.getProxy();
pr.setStatus(this._currentReference?pr.dropAllowed:pr.dropNotAllowed);
pr.sync();
}
this._lastOverElement=el;
return false;
},afterDragging:function(_e13,_e14,_e15){
this._lastOverElement=undefined;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeMenu"});
var _e16=_e13.getProxy();
if(_e16.dropStatus==_e16.dropNotAllowed){
return this.facade.updateSelection();
}
if(!this._currentReference){
return;
}
var _e17=Ext.dd.Registry.getHandle(_e14.DDM.currentTarget);
_e17["parent"]=this._currentReference;
var xy=_e15.getXY();
var pos={x:xy[0],y:xy[1]};
var a=this.facade.getCanvas().node.getScreenCTM();
pos.x-=a.e;
pos.y-=a.f;
pos.x/=a.a;
pos.y/=a.d;
pos.x-=document.documentElement.scrollLeft;
pos.y-=document.documentElement.scrollTop;
var _e1b=this._currentReference.absoluteXY();
pos.x-=_e1b.x;
pos.y-=_e1b.y;
_e17["position"]=pos;
_e17["connectedShape"]=this.currentShapes[0];
var _e1c=new ORYX.Plugins.ShapeMenuPlugin.CreateCommand(Object.clone(_e17),this._currentReference,pos,this.facade);
this.facade.executeCommands([_e1c]);
this._currentReference=undefined;
},newShape:function(_e1d,_e1e){
var _e1f=this.facade.getStencilSets()[_e1d.namespace];
var _e20=_e1f.stencil(_e1d.type);
if(this.facade.getRules().canContain({containingShape:this.currentShapes.first().parent,"containedStencil":_e20})){
var pos=this.currentShapes[0].bounds.center();
pos.x+=(this.currentShapes[0].bounds.width()/2)+100;
_e1d["position"]=pos;
_e1d["connectedShape"]=this.currentShapes[0];
_e1d["parent"]=this.currentShapes.first().parent;
var _e22=new ORYX.Plugins.ShapeMenuPlugin.CreateCommand(_e1d,undefined,undefined,this.facade);
this.facade.executeCommands([_e22]);
}
}};
ORYX.Plugins.ShapeMenuPlugin=Clazz.extend(ORYX.Plugins.ShapeMenuPlugin);
ORYX.Plugins.ShapeMenu={construct:function(_e23){
this.bounds=undefined;
this.shapes=undefined;
this.buttons=[];
this.isVisible=false;
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(_e23),["div",{id:ORYX.Editor.provideId(),"class":"Oryx_ShapeMenu"}]);
},addButton:function(_e24){
this.buttons.push(_e24);
this.node.appendChild(_e24.node);
},deleteButton:function(_e25){
this.buttons=this.buttons.without(_e25);
this.node.removeChild(_e25.node);
},removeAllButtons:function(){
var me=this;
this.buttons.each(function(_e27){
me.node.removeChild(_e27.node);
});
this.buttons=[];
},closeAllButtons:function(){
this.buttons.each(function(_e28){
_e28.prepareToHide();
});
this.isVisible=false;
},show:function(_e29){
if(_e29.length<=0){
return;
}
this.shapes=_e29;
var _e2a=undefined;
var _e2b=undefined;
this.shapes.each(function(_e2c){
var a=_e2c.node.getScreenCTM();
var upL=_e2c.absoluteXY();
a.e=a.a*upL.x;
a.f=a.d*upL.y;
_e2b=new ORYX.Core.Bounds(a.e,a.f,a.e+a.a*_e2c.bounds.width(),a.f+a.d*_e2c.bounds.height());
if(!_e2a){
_e2a=_e2b;
}else{
_e2a.include(_e2b);
}
});
this.bounds=_e2a;
var _e2f=this.bounds;
var a=this.bounds.upperLeft();
var left=0;
var top=0;
var _e33=0;
var _e34=0;
var size=22;
this.getWillShownButtons().each(function(_e36){
if(_e36.buttonAlign==ORYX.CONFIG.SHAPEMENU_LEFT){
_e36.setPosition(a.x-22,a.y+left*size);
left++;
}else{
if(_e36.buttonAlign==ORYX.CONFIG.SHAPEMENU_TOP){
_e36.setPosition(a.x+top*size,a.y-22);
top++;
}else{
if(_e36.buttonAlign==ORYX.CONFIG.SHAPEMENU_BOTTOM){
_e36.setPosition(a.x+_e33*size,a.y+_e2f.height()+1);
_e33++;
}else{
_e36.setPosition(a.x+_e2f.width()+1,a.y+_e34*size);
_e34++;
}
}
}
_e36.show();
});
this.isVisible=true;
},hide:function(){
this.buttons.each(function(_e37){
_e37.hide();
});
this.isVisible=false;
},isHover:function(){
return this.buttons.any(function(_e38){
return _e38.isHover();
});
},getWillShownButtons:function(){
return this.buttons.findAll(function(_e39){
return _e39.willShow;
});
}};
ORYX.Plugins.ShapeMenu=Clazz.extend(ORYX.Plugins.ShapeMenu);
ORYX.Plugins.ShapeMenuButton={construct:function(_e3a){
if(_e3a){
this.option=_e3a;
if(!this.option.arguments){
this.option.arguments=[];
}
}else{
}
this.parentId=this.option.id?this.option.id:null;
this.shapeButtons=[];
this.node=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",$(this.parentId),["div",{"class":"Oryx_button"}]);
this.childNode=ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.node,["div",{"class":"Oryx_childButton"}]);
if(this.option.icon){
ORYX.Editor.graft("http://www.w3.org/1999/xhtml",this.node,["img",{src:this.option.icon}]);
}
if(this.option.msg){
this.node.setAttributeNS(null,"title",this.option.msg);
}
var _e3b=false;
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOVER,this.hover.bind(this),_e3b);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEOUT,this.reset.bind(this),_e3b);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEDOWN,this.activate.bind(this),_e3b);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEUP,this.hover.bind(this),_e3b);
this.node.addEventListener("click",this.trigger.bind(this),_e3b);
this.node.addEventListener(ORYX.CONFIG.EVENT_MOUSEMOVE,this.move.bind(this),_e3b);
this.setAlignment(this.option.align?this.option.align:ORYX.CONFIG.SHAPEMENU_RIGHT);
this.hide();
this.dragStart=false;
this.isVisible=false;
this.willShow=false;
this.resetTimer;
},setAlignment:function(_e3c){
this.node.removeClassName(ORYX.CONFIG.SHAPEMENU_RIGHT);
this.node.removeClassName(ORYX.CONFIG.SHAPEMENU_BOTTOM);
this.node.removeClassName(ORYX.CONFIG.SHAPEMENU_LEFT);
this.node.removeClassName(ORYX.CONFIG.SHAPEMENU_TOP);
this.node.addClassName(_e3c);
this.buttonAlign=_e3c;
this.shapeButtons.each(function(_e3d){
_e3d.setAlignment(_e3c);
});
},add:function(_e3e){
_e3e.setAlignment(this.buttonAlign);
this.shapeButtons.push(_e3e);
this.childNode.appendChild(_e3e.node);
},remove:function(_e3f){
this.childNode.removeChild(_e3f.node);
this.shapeButtons=this.shapesButton.without(_e3f);
},hide:function(){
this.node.style.display="none";
this.isVisible=false;
},show:function(){
this.node.style.display="";
this.isVisible=true;
},prepareToShow:function(){
this.willShow=true;
},prepareToHide:function(){
this.willShow=false;
this.hide();
this.shapeButtons.each(function(_e40){
_e40.prepareToHide();
});
},setPosition:function(x,y){
this.node.style.left=x+"px";
this.node.style.top=y+"px";
},setChildWidth:function(_e43){
this.childNode.style.width=_e43+"px";
},reset:function(){
window.clearTimeout(this.resetTimer);
this.resetTimer=window.setTimeout(this.doReset.bind(this),100);
},doReset:function(){
if(this.node.hasClassName("Oryx_down")){
this.node.removeClassName("Oryx_down");
}
if(this.node.hasClassName("Oryx_hover")){
this.node.removeClassName("Oryx_hover");
}
this.shapeButtons.each(function(_e44){
_e44.hide();
});
},activate:function(evt){
this.node.addClassName("Oryx_down");
this.dragStart=true;
},isHover:function(){
return this.node.hasClassName("Oryx_hover")?true:false;
},hover:function(evt){
window.clearTimeout(this.resetTimer);
this.resetTimer=null;
this.node.addClassName("Oryx_hover");
this.shapeButtons.each(function(_e47){
if(_e47.willShow){
_e47.show();
}
});
this.dragStart=false;
},move:function(evt){
if(this.dragStart&&this.option.dragcallback){
this.option.arguments.push(evt);
var _e49=this.option.dragcallback.apply(this,this.option.arguments);
this.option.arguments.remove(evt);
}
},trigger:function(evt){
if(this.option.callback){
Event.stop(evt);
this.option.arguments.push(evt);
var _e4b=this.option.callback.apply(this,this.option.arguments);
this.option.arguments.remove(evt);
}
this.dragStart=false;
},toString:function(){
return "HTML-Button "+this.id;
}};
ORYX.Plugins.ShapeMenuButton=Clazz.extend(ORYX.Plugins.ShapeMenuButton);
ORYX.Plugins.ShapeMenuPlugin.CreateCommand=ORYX.Core.Command.extend({construct:function(_e4c,_e4d,_e4e,_e4f){
this.option=_e4c;
this.currentReference=_e4d;
this.position=_e4e;
this.facade=_e4f;
this.shape;
this.edge;
this.targetRefPos;
this.sourceRefPos;
},execute:function(){
if(this.shape){
if(this.shape instanceof ORYX.Core.Node){
this.option.parent.add(this.shape);
if(this.edge){
this.facade.getCanvas().add(this.edge);
this.edge.dockers.first().setDockedShape(this.option.connectedShape);
this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
this.edge.dockers.last().setDockedShape(this.shape);
this.edge.dockers.last().setReferencePoint(this.targetRefPos);
}
this.facade.setSelection([this.shape]);
}else{
if(this.shape instanceof ORYX.Core.Edge){
this.facade.getCanvas().add(this.shape);
this.shape.dockers.first().setDockedShape(this.option.connectedShape);
this.shape.dockers.first().setReferencePoint(this.sourceRefPos);
}
}
}else{
this.shape=this.facade.createShape(this.option);
this.edge=(!(this.shape instanceof ORYX.Core.Edge))?this.shape.getIncomingShapes().first():undefined;
}
if(this.currentReference&&this.position){
if(this.shape instanceof ORYX.Core.Edge){
if(!(this.currentReference instanceof ORYX.Core.Canvas)){
this.shape.dockers.last().setDockedShape(this.currentReference);
var upL=this.currentReference.absoluteXY();
var _e51={x:this.position.x-upL.x,y:this.position.y-upL.y};
this.shape.dockers.last().setReferencePoint(this.position);
}else{
this.shape.dockers.last().bounds.centerMoveTo(this.position);
}
this.sourceRefPos=this.shape.dockers.first().referencePoint;
this.targetRefPos=this.shape.dockers.last().referencePoint;
}else{
if(this.edge){
this.sourceRefPos=this.edge.dockers.first().referencePoint;
this.targetRefPos=this.edge.dockers.last().referencePoint;
}
}
}else{
var _e52={x:this.option.connectedShape.bounds.lowerRight().x+75,y:this.shape.bounds.upperLeft().y};
this.shape.bounds.moveTo(_e52);
this.position=_e52;
if(this.edge){
this.sourceRefPos=this.edge.dockers.first().referencePoint;
this.targetRefPos=this.edge.dockers.last().referencePoint;
}
}
this.facade.getCanvas().update();
this.facade.updateSelection();
},rollback:function(){
this.facade.deleteShape(this.shape);
if(this.edge){
this.facade.deleteShape(this.edge);
}
this.facade.setSelection(this.facade.getSelection().without(this.shape,this.edge));
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.ShapeRepository={facade:undefined,construct:function(_e53){
this.facade=_e53;
this._currentParent;
this._canContain=undefined;
this._canAttach=undefined;
this.shapeList=new Ext.tree.TreeNode({});
var _e54=new Ext.tree.TreePanel({width:170,border:false,autoScroll:true,loader:new Ext.tree.TreeLoader(),root:this.shapeList,rootVisible:false,lines:false});
var _e55=this.facade.addToRegion("west",_e54,ORYX.I18N.ShapeRepository.title);
var _e56=new Ext.dd.DragZone(this.shapeList.getUI().getEl(),{shadow:!Ext.isMac});
_e56.afterDragDrop=this.drop.bind(this,_e56);
_e56.beforeDragOver=this.beforeDragOver.bind(this,_e56);
_e56.beforeDragEnter=function(){
this._lastOverElement=false;
return true;
}.bind(this);
this.setStencilSets();
if(this.shapeList.firstChild.firstChild){
this.shapeList.firstChild.firstChild.expand(false,true);
}
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_STENCIL_SET_LOADED,this.setStencilSets.bind(this));
},setStencilSets:function(){
var _e57=this.shapeList.firstChild;
while(_e57){
this.shapeList.removeChild(_e57);
_e57=this.shapeList.firstChild;
}
this.facade.getStencilSets().values().each((function(sset){
var _e59;
this.shapeList.appendChild(_e59=new Ext.tree.TreeNode({text:sset.title(),allowDrag:false,allowDrop:false,iconCls:"headerShapeRepImg",cls:"headerShapeRep",singleClickExpand:true}));
_e59.render();
_e59.expand();
var _e5a=sset.stencils(this.facade.getCanvas().getStencil(),this.facade.getRules());
var _e5b=new Hash();
_e5a.each((function(_e5c){
var _e5d=_e5c.groups();
_e5d.each((function(_e5e){
if(!_e5b[_e5e]){
_e5b[_e5e]=new Ext.tree.TreeNode({text:_e5e,allowDrag:false,allowDrop:false,iconCls:"headerShapeRepImg",cls:"headerShapeRepChild",singleClickExpand:true});
_e59.appendChild(_e5b[_e5e]);
_e5b[_e5e].render();
}
this.createStencilTreeNode(_e5b[_e5e],_e5c);
}).bind(this));
if(_e5d.length==0){
this.createStencilTreeNode(_e59,_e5c);
}
}).bind(this));
}).bind(this));
},createStencilTreeNode:function(_e5f,_e60){
var _e61=new Ext.tree.TreeNode({text:_e60.title(),icon:_e60.icon(),allowDrag:false,allowDrop:false,iconCls:"ShapeRepEntreeImg",cls:"ShapeRepEntree",});
_e5f.appendChild(_e61);
_e61.render();
var ui=_e61.getUI();
ui.elNode.setAttributeNS(null,"title",_e60.description());
Ext.dd.Registry.register(ui.elNode,{node:ui.node,handles:[ui.elNode,ui.textNode].concat($A(ui.elNode.childNodes)),isHandle:false,type:_e60.id(),namespace:_e60.namespace()});
},drop:function(_e63,_e64,_e65){
this._lastOverElement=undefined;
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.added"});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.attached"});
var _e66=_e63.getProxy();
if(_e66.dropStatus==_e66.dropNotAllowed){
return;
}
if(!this._currentParent){
return;
}
var _e67=Ext.dd.Registry.getHandle(_e64.DDM.currentTarget);
var xy=_e65.getXY();
var pos={x:xy[0],y:xy[1]};
var a=this.facade.getCanvas().node.getScreenCTM();
pos.x-=a.e;
pos.y-=a.f;
pos.x/=a.a;
pos.y/=a.d;
pos.x-=document.documentElement.scrollLeft;
pos.y-=document.documentElement.scrollTop;
var _e6b=this._currentParent.absoluteXY();
pos.x-=_e6b.x;
pos.y-=_e6b.y;
_e67["position"]=pos;
if(this._canAttach&&this._currentParent instanceof ORYX.Core.Node){
_e67["parent"]=undefined;
}else{
_e67["parent"]=this._currentParent;
}
var _e6c=ORYX.Core.Command.extend({construct:function(_e6d,_e6e,_e6f,_e70,_e71){
this.option=_e6d;
this.currentParent=_e6e;
this.canAttach=_e6f;
this.position=_e70;
this.facade=_e71;
this.selection=this.facade.getSelection();
this.shape;
this.parent;
},execute:function(){
if(!this.shape){
this.shape=this.facade.createShape(_e67);
this.parent=this.shape.parent;
}else{
this.parent.add(this.shape);
}
if(this.canAttach&&this.currentParent instanceof ORYX.Core.Node&&this.shape.dockers.length>0){
var _e72=this.shape.dockers[0];
if(this.currentParent.parent instanceof ORYX.Core.Node){
this.currentParent.parent.add(_e72.parent);
}
_e72.bounds.centerMoveTo(this.position);
_e72.setDockedShape(this.currentParent);
}
this.facade.getCanvas().update();
this.facade.setSelection([this.shape]);
},rollback:function(){
this.facade.deleteShape(this.shape);
this.facade.getCanvas().update();
this.facade.setSelection(this.selection.without(this.shape));
}});
var _e73=this.facade.eventCoordinates(_e65.browserEvent);
var _e74=new _e6c(_e67,this._currentParent,this._canAttach,_e73,this.facade);
this.facade.executeCommands([_e74]);
this._currentParent=undefined;
},beforeDragOver:function(_e75,_e76,_e77){
var _e78=this.facade.eventCoordinates(_e77.browserEvent);
var _e79=this.facade.getCanvas().getAbstractShapesAtPosition(_e78);
if(_e79.length<=0){
var pr=_e75.getProxy();
pr.setStatus(pr.dropNotAllowed);
pr.sync();
return false;
}
var el=_e79.last();
if(_e79.lenght==1&&_e79[0] instanceof ORYX.Core.Canvas){
return false;
}else{
var _e7c=Ext.dd.Registry.getHandle(_e76.DDM.currentTarget);
var _e7d=this.facade.getStencilSets()[_e7c.namespace];
var _e7e=_e7d.stencil(_e7c.type);
if(_e7e.type()==="node"){
var _e7f=_e79.reverse().find(function(_e80){
return (_e80 instanceof ORYX.Core.Canvas||_e80 instanceof ORYX.Core.Node);
});
if(_e7f!==this._lastOverElement){
this._canAttach=undefined;
this._canContain=undefined;
}
if(_e7f){
if(!(_e7f instanceof ORYX.Core.Canvas)&&_e7f.isPointOverOffset(_e78.x,_e78.y)&&this._canAttach==undefined){
this._canAttach=this.facade.getRules().canConnect({sourceShape:_e7f,edgeStencil:_e7e,targetStencil:_e7e});
if(this._canAttach){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeRepo.attached",elements:[_e7f],style:ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,color:ORYX.CONFIG.SELECTION_VALID_COLOR});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.added"});
this._canContain=undefined;
}
}
if(!(_e7f instanceof ORYX.Core.Canvas)&&!_e7f.isPointOverOffset(_e78.x,_e78.y)){
this._canAttach=this._canAttach==false?this._canAttach:undefined;
}
if(this._canContain==undefined&&!this._canAttach){
this._canContain=this.facade.getRules().canContain({containingShape:_e7f,containedStencil:_e7e});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,highlightId:"shapeRepo.added",elements:[_e7f],color:this._canContain?ORYX.CONFIG.SELECTION_VALID_COLOR:ORYX.CONFIG.SELECTION_INVALID_COLOR});
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,highlightId:"shapeRepo.attached"});
}
this._currentParent=this._canContain||this._canAttach?_e7f:undefined;
this._lastOverElement=_e7f;
var pr=_e75.getProxy();
pr.setStatus(this._currentParent?pr.dropAllowed:pr.dropNotAllowed);
pr.sync();
}
}else{
this._currentParent=this.facade.getCanvas();
var pr=_e75.getProxy();
pr.setStatus(pr.dropAllowed);
pr.sync();
}
}
return false;
}};
ORYX.Plugins.ShapeRepository=Clazz.extend(ORYX.Plugins.ShapeRepository);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.SimplePnmlexport=Clazz.extend({facade:undefined,construct:function(_e81){
this.facade=_e81;
this.facade.offer({"name":ORYX.I18N.SimplePnmlexport.name,"functionality":this.exportIt.bind(this),"group":ORYX.I18N.SimplePnmlexport.group,dropDownGroupIcon:ORYX.PATH+"images/export2.png","description":ORYX.I18N.SimplePnmlexport.desc,"index":1,"minShape":0,"maxShape":0});
},exportIt:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _e82=location.href;
var _e83=DataManager.__persistDOM(this.facade);
_e83="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_e83+"</body></html>";
var _e84=new DOMParser();
var _e85=_e84.parseFromString(_e83,"text/xml");
var _e86=ORYX.PATH+"lib/extract-rdf.xsl";
var _e87=new XSLTProcessor();
var _e88=document.implementation.createDocument("","",null);
_e88.async=false;
_e88.load(_e86);
_e87.importStylesheet(_e88);
try{
var rdf=_e87.transformToDocument(_e85);
var _e8a=(new XMLSerializer()).serializeToString(rdf);
if(!_e8a.startsWith("<?xml")){
_e8a="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_e8a;
}
new Ajax.Request(ORYX.CONFIG.SIMPLE_PNML_EXPORT_URL,{method:"POST",asynchronous:false,parameters:{resource:_e82,data:_e8a},onSuccess:function(_e8b){
var win=window.open("data:text/xml,"+_e8b.responseText,"_blank","resizable=yes,width=640,height=480,toolbar=0,scrollbars=yes");
}});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
}});
Ext.namespace("Ext.ux");
Ext.ux.NotificationMgr={positions:[]};
Ext.ux.Notification=Ext.extend(Ext.Window,{initComponent:function(){
Ext.apply(this,{iconCls:this.iconCls||"x-icon-information",cls:"x-notification",width:200,autoHeight:true,plain:false,draggable:false,bodyStyle:this.bodyStyle||"text-align:center"});
if(this.autoDestroy){
this.task=new Ext.util.DelayedTask(this.hide,this);
}else{
this.closable=true;
}
Ext.ux.Notification.superclass.initComponent.call(this);
},setMessage:function(msg){
this.body.update(msg);
},setTitle:function(_e8e,_e8f){
Ext.ux.Notification.superclass.setTitle.call(this,_e8e,_e8f||this.iconCls);
},onRender:function(ct,_e91){
Ext.ux.Notification.superclass.onRender.call(this,ct,_e91);
},onDestroy:function(){
Ext.ux.NotificationMgr.positions.remove(this.pos);
Ext.ux.Notification.superclass.onDestroy.call(this);
},cancelHiding:function(){
this.addClass("fixed");
if(this.autoDestroy){
this.task.cancel();
}
},afterShow:function(){
Ext.ux.Notification.superclass.afterShow.call(this);
Ext.fly(this.body.dom).on("click",this.cancelHiding,this);
if(this.autoDestroy){
this.task.delay(this.hideDelay||5000);
}
},animShow:function(){
this.pos=0;
while(Ext.ux.NotificationMgr.positions.indexOf(this.pos)>-1){
this.pos++;
}
Ext.ux.NotificationMgr.positions.push(this.pos);
this.setSize(200,100);
this.el.alignTo(document,"br-br",[-20,-20-((this.getSize().height+10)*this.pos)]);
this.el.slideIn("b",{duration:1,callback:this.afterShow,scope:this});
},animHide:function(){
Ext.ux.NotificationMgr.positions.remove(this.pos);
this.el.ghost("b",{duration:1,remove:true});
},focus:Ext.emptyFn});
Ext.namespace("ORYX.Plugins");
ORYX.Plugins.StepThroughPlugin=Clazz.extend({construct:function(_e92){
this.facade=_e92;
this.el=undefined;
this.callback=undefined;
this.executionTrace="";
this.rdf=undefined;
this.facade.offer({"name":ORYX.I18N.StepThroughPlugin.stepThrough,"functionality":this.load.bind(this),"group":ORYX.I18N.StepThroughPlugin.group,"icon":ORYX.PATH+"images/control_play.png","description":ORYX.I18N.StepThroughPlugin.stepThroughDesc,"index":1,"toggle":true,"minShape":0,"maxShape":0});
this.facade.offer({"name":ORYX.I18N.StepThroughPlugin.undo,"functionality":this.undo.bind(this),"group":ORYX.I18N.StepThroughPlugin.group,"icon":ORYX.PATH+"images/control_rewind.png","description":ORYX.I18N.StepThroughPlugin.undoDesc,"index":2,"minShape":0,"maxShape":0});
},load:function(_e93,_e94){
this.initializeLoadButton(_e93,_e94);
if(!_e94){
this.executionTrace="";
this.rdf=undefined;
ORYX.Plugins.SyntaxChecker.instance.resetErrors();
this.hideOverlays();
}else{
this.initialMarking=[];
if(this.getDiagramType()==="epc"){
this.showBetaWarning();
this.prepareInitialMarking();
}else{
this.startAndCheckSyntax();
}
}
if(this.active()){
this.callback=this.doMouseUp.bind(this);
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_MOUSEUP,this.callback);
}else{
this.facade.unregisterOnEvent(ORYX.CONFIG.EVENT_MOUSEUP,this.callback);
this.callback=undefined;
}
},initializeLoadButton:function(_e95,_e96){
if(this.loadButton!==_e95){
var _e97=function(_e98){
if(_e98){
this.facade.disableEvent(ORYX.CONFIG.EVENT_MOUSEDOWN);
}else{
this.facade.enableEvent(ORYX.CONFIG.EVENT_MOUSEDOWN);
}
}.createDelegate(this);
_e95.on("toggle",function(_e99,p){
_e97(p);
});
_e97(_e95,_e96);
}
this.loadButton=_e95;
},active:function(){
return this.loadButton?this.loadButton.pressed:false;
},prepareInitialMarking:function(){
this.startNodes=[];
Ext.each(this.facade.getCanvas().getChildShapes(true),function(_e9b){
if(this.isStartNode(_e9b)){
this.startNodes.push(_e9b);
_e9b.initialMarkingFired=false;
this.showPlayOnShape(_e9b);
if(_e9b.getOutgoingShapes().size()==1){
this.showOverlayOnShape(_e9b.getOutgoingShapes()[0],{stroke:"green"});
_e9b.getOutgoingShapes()[0].initialMarking=true;
}
}
}.createDelegate(this));
},hideOverlays:function(_e9c){
var els=this.facade.getCanvas().getChildShapes(true);
var el;
for(i=0;i<els.size();i++){
el=els[i];
if(!(_e9c&&this.isStartNode(el))){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"st."+el.resourceId});
}
}
},isStartNode:function(_e9f){
return (_e9f.getStencil().id().search(/#Event$/)>-1)&&_e9f.getIncomingShapes().length==0&&_e9f.getOutgoingShapes().length==1;
},isStartArc:function(_ea0){
return this.isStartNode(_ea0.getIncomingShapes()[0]);
},isStartArcOrNode:function(_ea1){
return this.isStartNode(_ea1)||this.isStartArc(_ea1);
},generateRDF:function(){
var _ea2=DataManager.serializeDOM(this.facade);
var _ea2=DataManager.__persistDOM(this.facade);
_ea2="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_ea2+"</body></html>";
var _ea3=new DOMParser();
var _ea4=_ea3.parseFromString(_ea2,"text/xml");
var _ea5=ORYX.PATH+"lib/extract-rdf.xsl";
var _ea6=new XSLTProcessor();
var _ea7=document.implementation.createDocument("","",null);
_ea7.async=false;
_ea7.load(_ea5);
_ea6.importStylesheet(_ea7);
try{
var _ea8=_ea6.transformToDocument(_ea4);
var _ea9=(new XMLSerializer()).serializeToString(_ea8);
_ea9=!_ea9.startsWith("<?xml")?"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_ea9:_ea9;
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx (rdf)",error);
}
this.rdf=_ea9;
},getRDF:function(){
if(this.rdf==undefined){
this.generateRDF();
}
return this.rdf;
},startAndCheckSyntax:function(){
this.postExecutionTrace({checkSyntax:true,onlyChangedObjects:false,onSuccess:function(_eaa){
if(_eaa.responseText.startsWith("{")){
var _eab=Ext.decode(_eaa.responseText).syntaxErrors;
ORYX.Plugins.SyntaxChecker.instance.showErrors(_eab);
}else{
this.showObjectStates(_eaa.responseText);
}
}.bind(this)});
},fireObject:function(_eac){
this.executionTrace+=_eac+";";
if(this.isOrSplit(this.el)){
this.executionTrace=this.executionTrace.substring(0,this.executionTrace.length-1);
this.executionTrace+="#";
var _ead=new Ext.util.MixedCollection();
_ead.addAll(this.el.getOutgoingShapes());
var _eae=[];
_ead.filter("selectedForOrSplit","true").each(function(edge){
_eae.push(edge.resourceId);
}.createDelegate(this));
_ead.each(function(edge){
edge.selectedForOrSplit=false;
this.hideOverlayOnShape(edge);
}.createDelegate(this));
this.executionTrace+=_eae.join(",")+";";
}
this.postExecutionTrace({checkSyntax:false,onlyChangedObjects:true,onSuccess:function(_eb1){
if(_eb1.responseText!=""){
this.showObjectStates(_eb1.responseText);
}else{
this.removeLastFiredObject();
}
}.bind(this)});
},getDiagramType:function(){
switch(this.facade.getCanvas().getStencil().namespace()){
case "http://b3mn.org/stencilset/epc#":
return "epc";
case "http://b3mn.org/stencilset/bpmn#":
return "bpmn";
default:
return null;
}
},showBetaWarning:function(){
if(this.getDiagramType()==="epc"){
new Ext.ux.Notification({title:"Beta Version",html:"EPC step through is still in beta version. All features have been tested, but it is expected that there will be some bugs left. If you experience issues, or have other suggestions, <a target='_blank' href='http://code.google.com/p/oryx-editor/issues/list'>create a new ticket</a> or <a href='mailto:Kai.Schlichting@student.hpi.uni-potsdam.de'>send an email</a>.",iconCls:"error",hideDelay:5000,bodyStyle:{"text-align":"left"}}).show(document);
}
},onSelectionChanged:function(){
if(this.active()&&this.facade.getSelection().length>0){
if(!ORYX.Plugins.SyntaxChecker.instance.active){
this.facade.setSelection([]);
}
}
},doMouseUp:function(_eb2,arg){
if(arg instanceof ORYX.Core.Shape){
if(arg instanceof ORYX.Core.Edge&&this.isOrSplit(arg.getIncomingShapes()[0])){
this.doMouseUpOnEdgeComingFromOrSplit(arg);
}else{
if(arg instanceof ORYX.Core.Edge&&this.getDiagramType()==="epc"&&this.isStartNode(arg.getIncomingShapes()[0])){
this.doMouseUpOnEdgeComingFromStartNode(arg);
}else{
if(this.getDiagramType()==="epc"&&this.isStartNode(arg)){
arg.initialMarkingFired=true;
var edge=arg.getOutgoingShapes()[0];
this.hideOverlayOnShape(edge);
if(edge.initialMarking){
this.showUsed(arg,"1");
this.initialMarking.push(arg.resourceId);
}else{
this.hideOverlayOnShape(arg);
}
var _eb5=true;
Ext.each(this.startNodes,function(_eb6){
if(!_eb6.initialMarkingFired){
_eb5=false;
}
});
if(_eb5){
this.startAndCheckSyntax();
}
}else{
this.el=arg;
this.fireObject(this.el.resourceId);
}
}
}
}
},showObjectStates:function(objs){
var _eb8=objs.split(";");
for(i=0;i<_eb8.size();i++){
var _eb9=_eb8[i].split(",");
if(_eb9.size()<3){
continue;
}
var obj=this.facade.getCanvas().getChildShapeByResourceId(_eb9[0]);
if(_eb9[2]=="t"){
this.showEnabled(obj,_eb9[1]);
}else{
if(_eb9[1]!="0"){
this.showUsed(obj,_eb9[1]);
}else{
this.hideOverlayOnShape(obj);
}
}
}
},showEnabled:function(_ebb,_ebc){
if(!(_ebb instanceof ORYX.Core.Shape)){
return;
}else{
if(this.isOrSplit(_ebb)){
this.showEnabledOrSplit(_ebb);
return;
}
}
this.showPlayOnShape(_ebb);
},showPlayOnShape:function(_ebd){
var attr;
if(_ebd instanceof ORYX.Core.Edge){
attr={stroke:"green"};
}else{
attr={fill:"green"};
}
var play=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":"Click the element to execute it!","stroke-width":2,"stroke":"black","d":"M0,-5 L5,0 L0,5 Z","line-captions":"round"}]);
this.showOverlayOnShape(_ebd,attr,play);
},showOverlayOnShape:function(_ec0,_ec1,node){
this.hideOverlayOnShape(_ec0);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"st."+_ec0.resourceId,shapes:[_ec0],attributes:_ec1,node:(node?node:null),nodePosition:_ec0 instanceof ORYX.Core.Edge?"END":"SE"});
},hideOverlayOnShape:function(_ec3){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"st."+_ec3.resourceId});
},doMouseUpOnEdgeComingFromOrSplit:function(edge){
var _ec5=edge.getIncomingShapes()[0];
if(edge.selectedForOrSplit){
this.showOverlayOnShape(edge,{stroke:"orange"});
var _ec6=new Ext.util.MixedCollection();
_ec6.addAll(_ec5.getOutgoingShapes());
if(_ec6.filter("selectedForOrSplit","true").length<=1){
this.hideOverlayOnShape(_ec5);
}
}else{
this.showOverlayOnShape(edge,{stroke:"green"});
this.showPlayOnShape(_ec5);
}
edge.selectedForOrSplit=!edge.selectedForOrSplit;
},doMouseUpOnEdgeComingFromStartNode:function(edge){
edge.initialMarking=!edge.initialMarking;
if(edge.initialMarking){
this.showOverlayOnShape(edge,{stroke:"green"});
}else{
this.showOverlayOnShape(edge,{stroke:"orange"});
}
},isOrSplit:function(_ec8){
return (_ec8.getStencil().id().search(/#(OR_Gateway|OrConnector)$/)>-1)&&(_ec8.getOutgoingShapes().length>1);
},showEnabledOrSplit:function(_ec9){
Ext.each(_ec9.getOutgoingShapes(),function(edge){
Ext.apply(edge,{selectedForOrSplit:false});
this.showOverlayOnShape(edge,{stroke:"orange"});
}.createDelegate(this));
},showUsed:function(_ecb,_ecc){
if(!(_ecb instanceof ORYX.Core.Shape)){
return;
}
var attr;
if(_ecb instanceof ORYX.Core.Edge){
attr={stroke:"mediumslateblue"};
}else{
attr={fill:"mediumslateblue"};
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"st."+_ecb.resourceId});
if(_ecc!="-1"&&_ecc!="1"){
var text=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["text",{"style":"font-size: 16px; font-weight: bold;"},_ecc]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"st."+_ecb.resourceId,shapes:[_ecb],attributes:attr,node:text,nodePosition:_ecb instanceof ORYX.Core.Edge?"END":"SE"});
}else{
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"st."+_ecb.resourceId,shapes:[_ecb],attributes:attr});
}
},removeLastFiredObject:function(){
this.executionTrace=this.executionTrace.replace(/[^;]*;$/,"");
},undo:function(){
if(!this.active()){
return;
}
if(this.executionTrace!==""){
this.removeLastFiredObject();
this.postExecutionTrace({checkSyntax:false,onlyChangedObjects:false,onSuccess:function(_ecf){
this.hideOverlays(true);
this.showObjectStates(_ecf.responseText);
}.bind(this)});
}else{
if(this.getDiagramType()==="epc"){
this.hideOverlays();
this.prepareInitialMarking();
}
}
},postExecutionTrace:function(_ed0){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.StepThroughPlugin.executing});
new Ajax.Request(ORYX.CONFIG.STEP_THROUGH,{method:"POST",asynchronous:false,parameters:{rdf:this.getRDF(),checkSyntax:_ed0.checkSyntax,fire:this.executionTrace,onlyChangedObjects:_ed0.onlyChangedObjects,initialMarking:this.initialMarking.join(";")},onSuccess:function(_ed1){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
_ed0.onSuccess(_ed1);
}.createDelegate(this),onFailure:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}.createDelegate(this)});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.SyntaxChecker=ORYX.Plugins.AbstractPlugin.extend({construct:function(){
arguments.callee.$.construct.apply(this,arguments);
ORYX.Plugins.SyntaxChecker.instance=this;
this.active=false;
this.raisedEventIds=[];
this.facade.offer({"name":ORYX.I18N.SyntaxChecker.name,"functionality":this.perform.bind(this),"group":ORYX.I18N.SyntaxChecker.group,"icon":ORYX.PATH+"images/checker_syntax.png","description":ORYX.I18N.SyntaxChecker.desc,"index":0,"toggle":true,"minShape":0,"maxShape":0});
},perform:function(_ed2,_ed3){
if(!_ed3){
this.resetErrors();
}else{
this.checkForErrors({onNoErrors:function(){
_ed2.toggle();
this.active=!this.active;
Ext.Msg.alert("Oryx",ORYX.I18N.SyntaxChecker.noErrors);
},onErrors:function(){
},onFailure:function(){
_ed2.toggle();
this.active=!this.active;
Ext.Msg.alert("Oryx",ORYX.I18N.SyntaxChecker.invalid);
}});
}
},checkForErrors:function(_ed4){
if(!_ed4){
_ed4={};
}
Ext.Msg.wait(ORYX.I18N.SyntaxChecker.checkingMessage);
new Ajax.Request(ORYX.CONFIG.SYNTAXCHECKER_URL,{method:"POST",asynchronous:false,parameters:{resource:location.href,data:this.getRDFFromDOM(),context:_ed4.context},onSuccess:function(_ed5){
var resp=_ed5.responseText.evalJSON();
if(resp instanceof Object){
resp=$H(resp);
if(resp.size()>0){
this.showErrors(resp);
if(_ed4.onErrors){
_ed4.onErrors();
}
}else{
if(_ed4.onNoErrors){
_ed4.onNoErrors();
}
}
}else{
if(_ed4.onFailure){
_ed4.onFailure();
}
}
Ext.Msg.hide();
}.bind(this),onFailure:function(){
Ext.Msg.hide();
if(_ed4.onFailure){
_ed4.onFailure();
}
}});
},showErrors:function(_ed7){
if(!(_ed7 instanceof Hash)){
_ed7=new Hash(_ed7);
}
_ed7.keys().each(function(_ed8){
var sh=this.facade.getCanvas().getChildShapeByResourceId(_ed8);
if(sh){
this.raiseOverlay(sh,_ed7[_ed8]);
}
}.bind(this));
this.active=!this.active;
},resetErrors:function(){
this.raisedEventIds.each(function(id){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:id});
}.bind(this));
this.raisedEventIds=[];
this.active=!this.active;
},raiseOverlay:function(_edb,_edc){
var id="syntaxchecker."+this.raisedEventIds.length;
var _ede=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":_edc,"stroke-width":5,"stroke":"red","d":"M20,-5 L5,-20 M5,-5 L20,-20","line-captions":"round"}]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:id,shapes:[_edb],node:_ede,nodePosition:_edb instanceof ORYX.Core.Edge?"START":"NW"});
this.raisedEventIds.push(id);
return _ede;
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Toolbar={facade:undefined,construct:function(_edf,_ee0){
this.facade=_edf;
this.groupIndex=new Hash();
_ee0.properties.each((function(_ee1){
if(_ee1.group&&_ee1.index!=undefined){
this.groupIndex[_ee1.group]=_ee1.index;
}
}).bind(this));
Ext.QuickTips.init();
this.buttons=[];
},registryChanged:function(_ee2){
var _ee3=_ee2.sortBy((function(_ee4){
return ((this.groupIndex[_ee4.group]!=undefined?this.groupIndex[_ee4.group]:"")+_ee4.group+""+_ee4.index);
}).bind(this));
this.buttons=[];
ORYX.Log.trace("Creating a toolbar.");
var _ee5=new Ext.Toolbar({height:24});
var _ee6=_ee3[0].group;
var _ee7={};
var _ee8=this.facade.addToRegion("north",_ee5,"Toolbar");
_ee3.each((function(_ee9){
if(_ee6!=_ee9.group){
_ee5.add("-");
_ee6=_ee9.group;
_ee7={};
}
if(_ee9.dropDownGroupIcon){
var _eea=_ee7[_ee9.dropDownGroupIcon];
if(_eea===undefined){
_eea=_ee7[_ee9.dropDownGroupIcon]=new Ext.Toolbar.SplitButton({cls:"x-btn-icon",icon:_ee9.dropDownGroupIcon,menu:new Ext.menu.Menu({items:[]})});
_ee5.add(_eea);
}
var _eeb={icon:_ee9.icon,text:_ee9.name,handler:_ee9.toggle?undefined:_ee9.functionality,checkHandler:_ee9.toggle?_ee9.functionality:undefined,listeners:{render:function(item){
if(_ee9.description){
new Ext.ToolTip({target:item.getEl(),title:_ee9.description});
}
}}};
if(_ee9.toggle){
var _eed=new Ext.menu.CheckItem(_eeb);
}else{
var _eed=new Ext.menu.Item(_eeb);
}
_eea.menu.add(_eed);
}else{
var _eed=new Ext.Toolbar.Button({icon:_ee9.icon,cls:"x-btn-icon",tooltip:_ee9.description,tooltipType:"title",handler:_ee9.toggle?null:_ee9.functionality,enableToggle:_ee9.toggle,toggleHandler:_ee9.toggle?_ee9.functionality:null});
_ee5.add(_eed);
_eed.getEl().onclick=function(){
this.blur();
};
}
_ee9["buttonInstance"]=_eed;
this.buttons.push(_ee9);
}).bind(this));
this.enableButtons([]);
},onSelectionChanged:function(_eee){
this.enableButtons(_eee.elements);
},enableButtons:function(_eef){
this.buttons.each((function(_ef0){
_ef0.buttonInstance.enable();
if(_ef0.minShape&&_ef0.minShape>_eef.length){
_ef0.buttonInstance.disable();
}
if(_ef0.maxShape&&_ef0.maxShape<_eef.length){
_ef0.buttonInstance.disable();
}
if(_ef0.isEnabled&&!_ef0.isEnabled()){
_ef0.buttonInstance.disable();
}
}).bind(this));
}};
ORYX.Plugins.Toolbar=Clazz.extend(ORYX.Plugins.Toolbar);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.TransformationDownloadDialog={construct:function(){
},openMessageDialog:function(_ef1,_ef2){
var _ef3=new Ext.Window({autoCreate:true,title:_ef1,modal:true,height:120,width:400,collapsible:false,fixedcenter:true,shadow:true,resizable:true,proxyDrag:true,autoScroll:true,buttonAlign:"center",bodyStyle:"padding:10px",html:"<span class=\"ext-mb-text\">"+_ef2+"</span>"});
_ef3.addButton("OK",_ef3.hide,_ef3);
_ef3.on("hide",function(){
_ef3.destroy(true);
delete _ef3;
});
_ef3.show();
},openErrorDialog:function(_ef4){
var text=new Ext.form.TextArea({id:"error-field",fieldLabel:ORYX.I18N.TransformationDownloadDialog.error,name:"desc",height:405,width:633,preventScrollbars:true,value:_ef4,readOnly:true});
var _ef6=new Ext.Window({autoCreate:true,title:ORYX.I18N.TransformationDownloadDialog.errorParsing,modal:true,height:450,width:650,collapsible:false,fixedcenter:true,shadow:true,resizable:false,proxyDrag:true,autoScroll:false});
_ef6.on("hide",function(){
_ef6.destroy(true);
text.destroy(true);
delete _ef6;
delete text;
});
text.render(_ef6.body);
_ef6.show();
},openResultDialog:function(data){
var ds=new Ext.data.Store({proxy:new Ext.data.MemoryProxy(data),reader:new Ext.data.ArrayReader({},[{name:"file",type:"string"},{name:"result",type:"string"},{name:"info",type:"string"}])});
ds.load();
var _ef9=function(val){
if(val=="success"){
return "<span style=\"color:green;\">"+val+"</span>";
}else{
if(val=="error"){
return "<span style=\"color:red;\">"+val+"</span>";
}
}
return val;
};
var cm=new Ext.grid.ColumnModel([{id:"file",header:"File",width:200,sortable:false,dataIndex:"file",resizable:false},{header:"Info",width:75,sortable:false,dataIndex:"info",renderer:_ef9,resizable:false}]);
var grid=new Ext.grid.GridPanel({store:ds,cm:cm,sm:new Ext.grid.RowSelectionModel({singleSelect:true}),autoWidth:true});
var _efd=new Ext.Toolbar();
var _efe=new Ext.Window({autoCreate:true,title:ORYX.I18N.TransformationDownloadDialog.transResult,autoHeight:true,width:297,modal:true,collapsible:false,fixedcenter:true,shadow:true,proxyDrag:true,resizable:false,items:[_efd,grid]});
_efe.on("hide",function(){
_efe.destroy(true);
grid.destroy(true);
delete _efe;
delete grid;
});
_efe.show();
_efd.add({icon:"images/view.png",cls:"x-btn-icon",tooltip:ORYX.I18N.TransformationDownloadDialog.showFile,handler:function(){
var ds=grid.getStore();
var _f00=grid.getSelectionModel().getSelected();
if(_f00==undefined){
return;
}
var show=_f00.get("result");
if(_f00.get("info")=="success"){
this.openXMLWindow(show);
}else{
this.openErrorWindow(show);
}
}.bind(this)});
_efd.add({icon:"images/disk.png",cls:"x-btn-icon",tooltip:ORYX.I18N.TransformationDownloadDialog.downloadFile,handler:function(){
var ds=grid.getStore();
var _f03=grid.getSelectionModel().getSelected();
if(_f03==undefined){
return;
}
this.openDownloadWindow(_f03,false);
}.bind(this)});
_efd.add({icon:"images/disk_multi.png",cls:"x-btn-icon",tooltip:ORYX.I18N.TransformationDownloadDialog.downloadAll,handler:function(){
var ds=grid.getStore();
this.openDownloadWindow(ds.getRange(0,ds.getCount()),true);
}.bind(this)});
grid.getSelectionModel().selectFirstRow();
},openXMLWindow:function(_f05){
var win=window.open("data:application/xml,"+encodeURIComponent([_f05].join("\r\n")),"_blank","resizable=yes,width=600,height=600,toolbar=0,scrollbars=yes");
},openErrorWindow:function(_f07){
var win=window.open("data:text/html,"+encodeURIComponent(["<html><body><pre>"+_f07+"</pre></body></html>"].join("\r\n")),"_blank","resizable=yes,width=800,height=300,toolbar=0,scrollbars=yes");
},createHiddenElement:function(name,_f0a){
var _f0b=document.createElement("input");
_f0b.name=name;
_f0b.type="hidden";
_f0b.value=_f0a;
return _f0b;
},addFileExtension:function(file){
if((file=="topology")||(file=="XPDL4Chor")){
return file+".xml";
}else{
return file+".bpel";
}
},openDownloadWindow:function(_f0d,zip){
var win=window.open("");
if(win!=null){
win.document.open();
win.document.write("<html><body>");
var _f10=win.document.createElement("form");
win.document.body.appendChild(_f10);
if(zip){
for(var i=0;i<_f0d.length;i++){
var file=this.addFileExtension(_f0d[i].get("file"));
_f10.appendChild(this.createHiddenElement("download_"+i,_f0d[i].get("result")));
_f10.appendChild(this.createHiddenElement("file_"+i,file));
}
}else{
var file=this.addFileExtension(_f0d.get("file"));
_f10.appendChild(this.createHiddenElement("download",_f0d.get("result")));
_f10.appendChild(this.createHiddenElement("file",file));
}
_f10.method="POST";
win.document.write("</body></html>");
win.document.close();
_f10.action="download";
_f10.submit();
}
},getResultInfo:function(_f13){
if(!_f13){
return "error";
}else{
if(_f13.substr(0,5)=="<?xml"){
return "success";
}
}
return "error";
},getProcessName:function(_f14){
var _f15=new DOMParser();
var doc=_f15.parseFromString(_f14,"text/xml");
var name=doc.documentElement.getAttribute("name");
return name;
}};
ORYX.Plugins.TransformationDownloadDialog=Clazz.extend(ORYX.Plugins.TransformationDownloadDialog);
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.TreeGraphSupport=Clazz.extend({facade:undefined,construct:function(_f18){
this.facade=_f18;
this.facade.offer({"name":ORYX.I18N.TreeGraphSupport.syntaxCheckName,"functionality":this.syntaxCheck.bind(this),"group":ORYX.I18N.TreeGraphSupport.group,"icon":ORYX.PATH+"images/checker_syntax.png","description":ORYX.I18N.TreeGraphSupport.syntaxCheckDesc,"index":1,"minShape":0,"maxShape":0});
},syntaxCheck:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:"treegraph",});
new Ajax.Request(ORYX.CONFIG.TREEGRAPH_SUPPORT,{method:"POST",asynchronous:false,parameters:{data:this.facade.getERDF()},onSuccess:function(_f19){
var resp=_f19.responseText.evalJSON();
if(resp instanceof Array){
if(resp.length>0){
resp.each(function(_f1b){
var sh=this.facade.getCanvas().getChildShapeByResourceId(_f1b);
if(sh){
this.highlightShape(sh);
}
}.bind(this));
}
}
Ext.Msg.show({title:"Oryx",msg:_f19.responseText,icon:Ext.MessageBox.INFO});
}.bind(this),onFailure:function(_f1d){
Ext.Msg.show({title:"Oryx",msg:"An error occurs while sending request!",icon:Ext.MessageBox.WARNING});
}});
},highlightShape:function(_f1e){
if(!(_f1e instanceof ORYX.Core.Shape)){
return;
}
var attr;
if(_f1e instanceof ORYX.Core.Edge){
attr={stroke:"red"};
}else{
attr={fill:"red",stroke:"black","stroke-width":2};
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:"treegraph",shapes:[_f1e],attributes:attr,});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Undo=Clazz.extend({facade:undefined,undoStack:[],redoStack:[],construct:function(_f20){
this.facade=_f20;
this.facade.offer({name:ORYX.I18N.Undo.undo,description:ORYX.I18N.Undo.undoDesc,icon:ORYX.PATH+"images/arrow_undo.png",functionality:this.doUndo.bind(this),group:ORYX.I18N.Undo.group,isEnabled:function(){
return this.undoStack.length>0;
}.bind(this),index:0});
this.facade.offer({name:ORYX.I18N.Undo.redo,description:ORYX.I18N.Undo.redoDesc,icon:ORYX.PATH+"images/arrow_redo.png",functionality:this.doRedo.bind(this),group:ORYX.I18N.Undo.group,isEnabled:function(){
return this.redoStack.length>0;
}.bind(this),index:1});
this.facade.registerOnEvent(ORYX.CONFIG.EVENT_EXECUTE_COMMANDS,this.handleExecuteCommands.bind(this));
},handleExecuteCommands:function(evt){
if(!evt.commands){
return;
}
this.undoStack.push(evt.commands);
this.redoStack=[];
},doUndo:function(){
var _f22=this.undoStack.pop();
if(_f22){
this.redoStack.push(_f22);
_f22.each(function(_f23){
_f23.rollback();
});
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_UNDO_ROLLBACK,commands:_f22});
},doRedo:function(){
var _f24=this.redoStack.pop();
if(_f24){
this.undoStack.push(_f24);
_f24.each(function(_f25){
_f25.execute();
});
}
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_UNDO_EXECUTE,commands:_f24});
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.Validator=Clazz.extend({construct:function(_f26){
this.facade=_f26;
this.active=false;
this.raisedEventIds=[];
this.facade.offer({"name":ORYX.I18N.Validator.name,"functionality":this.load.bind(this),"group":"Verification","icon":ORYX.PATH+"images/checker_validation.png","description":ORYX.I18N.Validator.description,"index":1,"toggle":true,"minShape":0,"maxShape":0});
},load:function(_f27,_f28){
if(!_f28){
this.hideOverlays();
this.active=!this.active;
}else{
this.validate();
}
},hideOverlays:function(){
this.raisedEventIds.each(function(id){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_HIDE,id:id});
}.bind(this));
this.raisedEventIds=[];
},getRdf:function(){
var _f2a=DataManager.serializeDOM(this.facade);
_f2a="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_f2a+"</body></html>";
var _f2b=new DOMParser();
var _f2c=_f2b.parseFromString(_f2a,"text/xml");
var _f2d=ORYX.PATH+"lib/extract-rdf.xsl";
var _f2e=new XSLTProcessor();
var _f2f=document.implementation.createDocument("","",null);
_f2f.async=false;
_f2f.load(_f2d);
_f2e.importStylesheet(_f2f);
var rdf=_f2e.transformToDocument(_f2c);
var _f31=(new XMLSerializer()).serializeToString(rdf);
return _f31;
},validate:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE,text:ORYX.I18N.Validator.checking});
new Ajax.Request(ORYX.CONFIG.VALIDATOR_URL,{method:"POST",asynchronous:false,parameters:{resource:location.href,data:this.getRdf()},onSuccess:function(_f32){
var _f33=Ext.decode(_f32.responseText);
this.handleValidationResponse(_f33);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}.bind(this),onFailure:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}.bind(this)});
},showOverlay:function(_f34,_f35){
var id="syntaxchecker."+this.raisedEventIds.length;
var _f37=ORYX.Editor.graft("http://www.w3.org/2000/svg",null,["path",{"title":_f35,"stroke-width":5,"stroke":"red","d":"M20,-5 L5,-20 M5,-5 L20,-20","line-captions":"round"}]);
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_OVERLAY_SHOW,id:id,shapes:[_f34],node:_f37,nodePosition:_f34 instanceof ORYX.Core.Edge?"START":"NW"});
this.raisedEventIds.push(id);
return _f37;
}});
ORYX.Plugins.BPMNValidator=Ext.extend(ORYX.Plugins.Validator,{handleValidationResponse:function(_f38){
var _f39=_f38.conflictingNodes;
var _f3a=_f38.leadsToEnd;
if(!_f3a){
Ext.Msg.alert("Oryx","The process will never reach a final state!");
}else{
if(_f39.size()>0){
_f39.each(function(node){
sh=this.facade.getCanvas().getChildShapeByResourceId(node.id);
if(sh){
this.showOverlay(sh,"Some following pathes will never reach a final state!");
}
}.bind(this));
this.active=!this.active;
}else{
Ext.Msg.alert("Oryx","No validation errors found!");
}
}
}});
ORYX.Plugins.EPCValidator=Ext.extend(ORYX.Plugins.Validator,{getLabelOfShape:function(node){
if(node.properties["oryx-title"]===""){
return node.id;
}else{
return node.properties["oryx-title"];
}
},findShapeById:function(id){
return this.facade.getCanvas().getChildShapeByResourceId(id);
},handleValidationResponse:function(_f3e){
var _f3f=_f3e.isSound;
var _f40=_f3e.badStartArcs;
var _f41=_f3e.badEndArcs;
var _f42=_f3e.goodInitialMarkings;
var _f43=_f3e.goodFinalMarkings;
var _f44="";
if(_f3f){
_f44+="<p><b>The EPC is sound, no problems found!</b></p>";
}else{
_f44+="<p><b>The EPC is <i>NOT</i> sound!</b></p>";
}
_f44+="<hr />";
var _f45=function(_f46,_f47){
var _f48="<ul>";
_f46.each(function(_f49){
_f48+="<li> - ";
_f49.each(function(_f4a){
_f48+="\""+_f47(_f4a)+"\" ";
});
_f48+="</li>";
});
_f48+="</ul>";
return _f48;
};
var _f4b=function(_f4c,_f4d){
var _f4e="<ul>";
_f4c.each(function(_f4f){
_f4e+="<li> - "+_f4d(_f4f)+"</li>";
});
_f4e+="</ul>";
return _f4e;
};
_f44+="<p>There are "+_f42.length+" initial markings which does not run into a deadlock.</p>";
_f44+=_f45(_f42,function(arc){
return this.getLabelOfShape(this.findShapeById(arc.id).getIncomingShapes()[0]);
}.createDelegate(this));
_f44+="<p>The initial markings do not include "+_f40.length+" start nodes.</p>";
_f44+=_f4b(_f40,function(arc){
return this.getLabelOfShape(this.findShapeById(arc.id).getIncomingShapes()[0]);
}.createDelegate(this));
_f44+="<hr />";
_f44+="<p>There are "+_f43.length+" final markings which can be reached from the initial markings.</p>";
_f44+=_f45(_f43,function(arc){
return this.getLabelOfShape(this.findShapeById(arc.id).getOutgoingShapes()[0]);
}.createDelegate(this));
_f44+="<p>The final markings do not include "+_f41.length+" end nodes.</p>";
_f44+=_f4b(_f41,function(arc){
return this.getLabelOfShape(this.findShapeById(arc.id).getOutgoingShapes()[0]);
}.createDelegate(this));
_f44+="<hr />";
_f44+="<p><i>Remark: Set titles of functions and events to get some nicer output (names instead of ids)</i></p>";
Ext.Msg.alert("Validation Result",_f44);
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.View=Clazz.extend({facade:undefined,construct:function(_f54){
this.facade=_f54;
this.zoomLevel=1;
this.minZoomLevel=0.21;
this.maxZoomLevel=2.5;
this.facade.offer({"name":ORYX.I18N.View.zoomIn,"functionality":this.zoom.bind(this,[1+ORYX.CONFIG.ZOOM_OFFSET]),"group":ORYX.I18N.View.group,"icon":ORYX.PATH+"images/magnifier_zoom_in.png","description":ORYX.I18N.View.zoomInDesc,"index":1,"minShape":0,"maxShape":0,"isEnabled":function(){
return this.zoomLevel<this.maxZoomLevel;
}.bind(this)});
this.facade.offer({"name":ORYX.I18N.View.zoomOut,"functionality":this.zoom.bind(this,[1-ORYX.CONFIG.ZOOM_OFFSET]),"group":ORYX.I18N.View.group,"icon":ORYX.PATH+"images/magnifier_zoom_out.png","description":ORYX.I18N.View.zoomOutDesc,"index":2,"minShape":0,"maxShape":0,"isEnabled":function(){
return this.zoomLevel>this.minZoomLevel;
}.bind(this)});
},zoom:function(_f55){
this.zoomLevel*=_f55;
var _f56=this.facade.getCanvas();
var _f57=_f56.bounds.width()*this.zoomLevel;
var _f58=_f56.bounds.height()*this.zoomLevel;
var _f59=(_f56.node.parentNode.parentNode.parentNode.offsetHeight-_f58)/2;
_f59=_f59>20?_f59-20:0;
_f56.node.parentNode.parentNode.style.marginTop=_f59+"px";
_f59+=5;
_f56.getHTMLContainer().style.top=_f59+"px";
_f56.setSize({width:_f57,height:_f58},true);
_f56.node.setAttributeNS(null,"transform","scale("+this.zoomLevel+")");
this.facade.updateSelection();
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.XFormsExport=Clazz.extend({CSS_URL:"http://oryx-editor.org/oryx/css/xforms_default.css",facade:undefined,construct:function(_f5a){
this.facade=_f5a;
this.facade.offer({"name":ORYX.I18N.XFormsSerialization.exportXForms,"functionality":this.exportIt.bind(this),"group":ORYX.I18N.XFormsSerialization.group,"icon":ORYX.PATH+"images/xforms_export.png","description":ORYX.I18N.XFormsSerialization.exportXFormsDesc,"index":1,"minShape":0,"maxShape":0});
},exportIt:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _f5b=location.href;
var _f5c=DataManager.__persistDOM(this.facade);
_f5c="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_f5c+"</body></html>";
var _f5d=new DOMParser();
var _f5e=_f5d.parseFromString(_f5c,"text/xml");
var _f5f=ORYX.PATH+"lib/extract-rdf.xsl";
var _f60=new XSLTProcessor();
var _f61=document.implementation.createDocument("","",null);
_f61.async=false;
_f61.load(_f5f);
_f60.importStylesheet(_f61);
try{
var rdf=_f60.transformToDocument(_f5e);
var _f63=(new XMLSerializer()).serializeToString(rdf);
_f63=_f63.startsWith("<?xml")?_f63:"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_f63;
new Ajax.Request(ORYX.CONFIG.XFORMS_EXPORT_URL,{method:"POST",asynchronous:false,parameters:{resource:_f5b,data:_f63,css:this.CSS_URL},onSuccess:function(_f64){
var win=window.open("data:text/xml,"+_f64.responseText,"_blank","resizable=yes,width=640,height=480,toolbar=0,scrollbars=yes");
}});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
},checkClientXFormsSupport:function(){
if(!clientSupportsXForms){
var _f66=ORYX.I18N.XFormsSerialization.noClientXFormsSupportDesc;
var win=new Ext.Window({width:320,height:240,resizable:false,minimizable:false,modal:true,autoScroll:true,title:ORYX.I18N.XFormsSerialization.noClientXFormsSupport,html:_f66,buttons:[{text:ORYX.I18N.XFormsSerialization.ok,handler:function(){
win.hide();
}}]});
win.show();
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.XFormsExportOrbeon=Clazz.extend({CSS_URL:"http://localhost:8081/oryx/css/xforms_orbeon.css",facade:undefined,construct:function(_f68){
this.facade=_f68;
this.facade.offer({"name":ORYX.I18N.XFormsSerialization.exportXForms,"functionality":this.exportIt.bind(this),"group":ORYX.I18N.XFormsSerialization.group,"icon":ORYX.PATH+"images/xforms_export.png","description":"XForms export for Orbeon","index":1,"minShape":0,"maxShape":0});
},exportIt:function(){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_ENABLE});
window.setTimeout((function(){
this.exportSynchronously();
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
}).bind(this),10);
return true;
},exportSynchronously:function(){
var _f69=location.href;
var _f6a=DataManager.__persistDOM(this.facade);
_f6a="<?xml version=\"1.0\" encoding=\"utf-8\"?>"+"<html xmlns=\"http://www.w3.org/1999/xhtml\" "+"xmlns:b3mn=\"http://b3mn.org/2007/b3mn\" "+"xmlns:ext=\"http://b3mn.org/2007/ext\" "+"xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" "+"xmlns:atom=\"http://b3mn.org/2007/atom+xhtml\">"+"<head profile=\"http://purl.org/NET/erdf/profile\">"+"<link rel=\"schema.dc\" href=\"http://purl.org/dc/elements/1.1/\" />"+"<link rel=\"schema.dcTerms\" href=\"http://purl.org/dc/terms/ \" />"+"<link rel=\"schema.b3mn\" href=\"http://b3mn.org\" />"+"<link rel=\"schema.oryx\" href=\"http://oryx-editor.org/\" />"+"<link rel=\"schema.raziel\" href=\"http://raziel.org/\" />"+"<base href=\""+location.href.split("?")[0]+"\" />"+"</head><body>"+_f6a+"</body></html>";
var _f6b=new DOMParser();
var _f6c=_f6b.parseFromString(_f6a,"text/xml");
var _f6d=ORYX.PATH+"lib/extract-rdf.xsl";
var _f6e=new XSLTProcessor();
var _f6f=document.implementation.createDocument("","",null);
_f6f.async=false;
_f6f.load(_f6d);
_f6e.importStylesheet(_f6f);
try{
var rdf=_f6e.transformToDocument(_f6c);
var _f71=(new XMLSerializer()).serializeToString(rdf);
_f71=_f71.startsWith("<?xml")?_f71:"<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+_f71;
new Ajax.Request(ORYX.CONFIG.XFORMS_EXPORT_ORBEON_URL,{method:"POST",asynchronous:false,parameters:{resource:_f69,data:_f71,css:this.CSS_URL},onSuccess:function(_f72){
var win=window.open("");
win.document.write(_f72.responseText);
},onFailure:function(_f74){
var win=window.open("");
win.document.write(_f74.responseText);
}});
}
catch(error){
this.facade.raiseEvent({type:ORYX.CONFIG.EVENT_LOADING_DISABLE});
Ext.Msg.alert("Oryx",error);
}
},checkClientXFormsSupport:function(){
if(!clientSupportsXForms){
var _f76=ORYX.I18N.XFormsSerialization.noClientXFormsSupportDesc;
var win=new Ext.Window({width:320,height:240,resizable:false,minimizable:false,modal:true,autoScroll:true,title:ORYX.I18N.XFormsSerialization.noClientXFormsSupport,html:_f76,buttons:[{text:ORYX.I18N.XFormsSerialization.ok,handler:function(){
win.hide();
}}]});
win.show();
}
}});
if(!ORYX.Plugins){
ORYX.Plugins=new Object();
}
ORYX.Plugins.XFormsImport=Clazz.extend({facade:undefined,construct:function(_f78){
this.facade=_f78;
this.facade.offer({"name":ORYX.I18N.XFormsSerialization.importXForms,"functionality":this.importXForms.bind(this),"group":ORYX.I18N.XFormsSerialization.group,"icon":ORYX.PATH+"images/xforms_import.png","description":ORYX.I18N.XFormsSerialization.importXFormsDesc,"index":2,"minShape":0,"maxShape":0});
},importXForms:function(){
this._showImportDialog();
},sendRequest:function(url,_f7a,_f7b,_f7c){
var suc=false;
new Ajax.Request(url,{method:"POST",asynchronous:false,parameters:_f7a,onSuccess:function(_f7e){
suc=true;
if(_f7b){
_f7b(_f7e);
}
}.bind(this),onFailure:function(_f7f){
if(_f7c){
_f7c();
}else{
Ext.Msg.alert("Oryx",ORYX.I18N.XFormsSerialization.impFailed);
ORYX.log.warn("Import XForms failed: "+transport.responseText);
}
}.bind(this)});
return suc;
},loadERDF:function(_f80,_f81,_f82){
var s=_f80;
s=s.startsWith("<?xml")?s:"<?xml version=\"1.0\" encoding=\"utf-8\"?>"+s+"";
var _f84=new DOMParser();
var doc=_f84.parseFromString(s,"text/xml");
doc.normalize();
if(doc.firstChild.tagName=="parsererror"){
Ext.MessageBox.show({title:ORYX.I18N.ERDFSupport.error,msg:ORYX.I18N.ERDFSupport.impFailed2+doc.firstChild.textContent.escapeHTML(),buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.ERROR});
if(_f82){
_f82();
}
}else{
var _f86=this.parseToSerializeObjects(doc);
_f86.each(function(_f87){
if(_f87.shape&&_f87.shape instanceof ORYX.Core.Canvas){
return;
}
var type=_f87.serialize.find(function(ser){
return ser.name=="type";
});
var _f8a=_f87.serialize.find(function(ser){
return ser.name=="bounds";
});
if(_f8a){
var _f8c=ORYX.Core.StencilSet.stencil(type.value);
var _f8d=new ORYX.Core.Node({},_f8c);
boundsArr=_f8a.value.split(",");
_f8a.value=boundsArr[0]+","+boundsArr[1]+","+(parseInt(boundsArr[0])+_f8d.bounds.width())+","+(parseInt(boundsArr[1])+_f8d.bounds.height());
}
}.bind(this));
this.facade.importJSON(_f86);
if(_f81){
_f81();
}
}
},throwWarning:function(text){
Ext.MessageBox.show({title:"Oryx",msg:text,buttons:Ext.MessageBox.OK,icon:Ext.MessageBox.WARNING});
},_showImportDialog:function(_f8f){
var form=new Ext.form.FormPanel({baseCls:"x-plain",labelWidth:50,defaultType:"textfield",items:[{text:ORYX.I18N.XFormsSerialization.selectFile,style:"font-size:12px;margin-bottom:10px;display:block;",anchor:"100%",xtype:"label"},{fieldLabel:ORYX.I18N.XFormsSerialization.file,name:"subject",inputType:"file",style:"margin-bottom:10px;display:block;",itemCls:"ext_specific_window_overflow"},{xtype:"textarea",hideLabel:true,name:"msg",anchor:"100% -63"}]});
var _f91=new Ext.Window({autoCreate:true,layout:"fit",plain:true,bodyStyle:"padding:5px;",title:ORYX.I18N.XFormsSerialization.impTitle,height:350,width:500,modal:true,fixedcenter:true,shadow:true,proxyDrag:true,resizable:true,items:[form],buttons:[{text:ORYX.I18N.XFormsSerialization.impButton,handler:function(){
var _f92=new Ext.LoadMask(Ext.getBody(),{msg:ORYX.I18N.XFormsSerialization.impProgress});
_f92.show();
window.setTimeout(function(){
var _f93=form.items.items[2].getValue();
var _f94={resource:location.href,data:_f93};
this.sendRequest(ORYX.CONFIG.XFORMS_IMPORT_URL,_f94,function(_f95){
this.loadERDF(_f95.responseText,function(){
_f92.hide();
_f91.hide();
}.bind(this),function(){
_f92.hide();
}.bind(this));
}.bind(this));
}.bind(this),100);
}.bind(this)},{text:ORYX.I18N.XFormsSerialization.close,handler:function(){
_f91.hide();
}.bind(this)}]});
_f91.on("hide",function(){
_f91.destroy(true);
delete _f91;
});
_f91.show();
form.items.items[1].getEl().dom.addEventListener("change",function(evt){
var text=evt.target.files[0].getAsBinary();
form.items.items[2].setValue(text);
},true);
},parseToSerializeObjects:function(_f98){
var _f99=function(doc,id){
return $A(doc.getElementsByTagName("div")).findAll(function(el){
return $A(el.attributes).any(function(attr){
return attr.nodeName=="class"&&attr.nodeValue==id;
});
});
};
var _f9e=function(doc,id){
return $A(doc.getElementsByTagName("div")).find(function(el){
return el.getAttribute("id")==id;
});
};
var _fa2=function(doc,id){
return $A(doc.getElementsByTagName("a")).findAll(function(el){
return el.getAttribute("href")=="#"+id;
});
};
var _fa6=_f99(_f98,"-oryx-canvas")[0];
if(!_fa6){
ORYX.Log.warn("Import ERDF: No canvas node was found!");
return false;
}
var _fa7=$A(_fa6.childNodes).collect(function(el){
return el.nodeName.toLowerCase()=="a"&&el.getAttribute("rel")=="oryx-render"?el.getAttribute("href").slice(1):null;
}).compact();
_fa7=_fa7.collect(function(el){
return _f9e(_f98,el);
}.bind(this));
_fa7.push(_fa6);
var _faa=function(node){
var res={type:undefined,id:undefined,serialize:[]};
if(node.getAttribute("id")){
res.id=node.getAttribute("id");
}
if(node.getAttribute("class")=="-oryx-canvas"){
res["shape"]=this.facade.getCanvas();
}
$A(node.childNodes).each(function(node){
if(node.nodeName.toLowerCase()=="span"&&node.getAttribute("class")){
var name=node.getAttribute("class").split("-");
var _faf=node.firstChild?node.firstChild.textContent:"";
res.serialize.push({name:name[1],prefix:name[0],value:_faf});
if(name[0]=="oryx"&&name[1]=="type"){
res.type=_faf;
}
}else{
if(node.nodeName.toLowerCase()=="a"&&node.getAttribute("rel")){
var name=node.getAttribute("rel").split("-");
var _faf=node.getAttribute("href");
res.serialize.push({name:name[1],prefix:name[0],value:_faf});
}
}
});
return res.type?res:null;
}.bind(this);
return _fa7.collect(function(el){
return _faa(el);
}.bind(this)).compact();
}});

