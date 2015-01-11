/* tut2 */

/* model: maintains a list of entries
   view: can (intelligently) update the visible page based on those entries:
         if the respective element already exists, it won't be
         re-created. If only some of its contents have changed, only
         the relevant content will be updated.
*/

(function() {

  'use strict';

    var ENTER_KEY = 13;
    var tutEntryTemplate = document.getElementById('tut-entry-template');

    var entry_template = 
	{ "uid":"entrytemplate",
	  "starttime_utc_ms":Date.now(),   // was: now,
	  "project":"enter project", 
	  "logentry":"enter log entry (task description)", 
	  "duration":"unknown" 
	};


  // Initialise a sync with the remote server
  function sync() {
  }

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

    // Encode a given entry ID as a valid HTML ID
    function encodeID(rawid) {
	return "id-"+rawid;
    }

    // inverse of encodeID()
    function decodeID(idstr) {
	return idstr.substr(3);
    }

    // Given an entry, create a DOM node for it, ready
    // for appending to the DOM.
    function createTutEntryNode(entry) {
	var template=$('#tut-entry-template');
	var node=template.clone();
	//node.removeAttr("id"); // will be replaced by next line of code, 
                                 // no need to delete first
	//node.makevisible  // our template is invisible via CSS, but
	// the clones are automatically fine, because they have a 
	// different ID.
	node.attr("id",encodeID(entry["uid"]));
	node.find(".tut_project").html(entry.project);
	node.find(".tut_logentry").html(entry.logentry);
	var d=new Date(entry['starttime_utc_ms']);
	var t=timeStr(d);
	node.find(".tut_starttime").html(t);
	// if this is the entry template, grey out the entries
	if(entry['uid']=="entrytemplate") {
	    node.find(".tut_viewbox").addClass("tut_notyetvalid");
	}
	console.log("created entry:");
	console.log(entry);
	addEventListeners(node);
	return node;
    }

    // Given an entry, create a DOM node for it, ready
    // for appending to the DOM.
    function createSectionHeaderNode(sectionlabel) {
	var template=$('#tut-section-header-template');
	var node=template.clone();
	node.removeAttr("id");
	//node.makevisible  // our template is invisible via CSS, but
	// the clones are automatically fine, because they have a 
	// different (no) ID.
	node.find(".tut_section_label").html(sectionlabel);
	console.log("created section header:");
	console.log(node);
	return node;
    }

    // Take a Date object and turn it into something like "12:51:02"
    function timeStr(d) {
	return prefixWithZeroes(d.getHours(),2)+
	       ':'+prefixWithZeroes(d.getMinutes(),2)+
	       ':'+prefixWithZeroes(d.getSeconds(),2);
    }

    // Take a Date object and turn it into something like "2015-01-22"
    function dateStr(d) {
	return prefixWithZeroes(d.getFullYear(),4)+
	       '-'+prefixWithZeroes(d.getMonth()+1,2)+
	       '-'+prefixWithZeroes(d.getDate(),2);
    }
    
    function prefixWithZeroes(v,d) {
	while(v.toString().length<d) {
	    v='0'+v;
	}
	return v;
    }

    // Convert the start time of the given entry to
    // a string representation of the start day, used
    // to build section headers.
    function calcSectionName(entry) {
	var t=entry['starttime_utc_ms']
	var d=new Date(t);
	var sectionname="illegal starttime";
	if(t) {
	    sectionname=dateStr(d);
	}
	return sectionname;
	//return "dummy";
    }

  // Create DOM elements for all time tracking entries.
  // Create section headings for each new day as needed.
  function redrawTutEntriesUI_old(entries) {
      // old (original) version: always start from scratch and recreate every item,
      // regardless whether it already existed or not.
      // the new version will intelligently do a "one-way sync" from model to
      // HTML view.
      var c = $('#tut-entries-container');
      //c=document.getElementById("tut-entries-container");
      //c.innerHTML = '';
      c.empty();
      console.log("mark C");
      var currentSectionName=''; // start with something invalid to ensure
			     // we create a new section as soon as we
			     // start processing entries
      entries.forEach(function(entry) {
	  var sectionname=calcSectionName(entry);
	  if(sectionname!=currentSectionName) {
	      var node=createSectionHeaderNode(sectionname);
	      c.append(node);
	      currentSectionName=sectionname;
	  }
	  var node=createTutEntryNode(entry);
	  c.append(node);
      });

      // grey out the top entry to visualize that it's only a template.
      // @todo maybe move this business logic to a more suitable place
      var top_entry=$('#tut-entries-container .tut_entry:first');
      console.log(top_entry);
      top_entry.find('.tut_viewbox').addClass('tut_notyetvalid');
  }

    // Create DOM elements for all time tracking entries.
    // Create section headings for each new day as needed.
    // only create what isn't there already
    function redrawTutEntriesUI(entries) {
	// this (new) version will intelligently do a "one-way sync" from model to
	// HTML view.
	console.log("updating GUI");
	var c=$('#tut-entries-container');
	var dom_targets=c.children("div");
	console.log(dom_targets);
	//c.empty(); // no sir, not anymore we don't!!!
	var currentSectionName=''; // start with something invalid to ensure
	                           // we create a new section as soon as we
                                   // start processing entries
	// We "one-way sync" from the model to the view, that means
	// we go through every entry in the model and ensure that the
	// respective entry is represented in the HTML view.

	// approach 1 (should work well enough for adding entries, not so much
	// for deleting/moving them): 
	//  whenever we encounter an entry that isn't in the HTML where it
	//  ought to be, we simply insert it.
	var idx_model=0;  // index into model
	var idx_view=0;   // index into HTML nodes
	var traversed_all_model_entries=false;
	var traversed_all_view_nodes=false;

	console.log("dom_targets.length="+dom_targets.length);
	console.log("entries.length="+entries.length);

	while(true) {
	    if(idx_view>=dom_targets.length) { traversed_all_view_nodes=true;    }
	    if(idx_model>=entries.length)    { traversed_all_model_entries=true; }

	    if(traversed_all_view_nodes && traversed_all_model_entries) {
		break; // we're done
	    }
	    var entry=entries[idx_model];

	    // Are we expecting a new section? Build the section name and see
	    var sectionname=calcSectionName(entry);
	    if(sectionname!=currentSectionName) {
		currentSectionName=sectionname;
		// we expect a node with the calculated section name
		if(traversed_all_view_nodes) {
		    // we simply append the new section, it's definitely not there!
		    var node=createSectionHeaderNode(sectionname);
		    c.append(node);
		} else {
		    // check if next node is the expected section header, insert
		    // section header if not.
		    var node=createSectionHeaderNode(sectionname);
		    if($(node).find(".tut_section_label")[0].html
		       ==$(dom_targets[idx_view]).find(".tut_section_label")[0].html) {
			console.log("IDENTICAL SECTION HEADER");
			idx_view++;
		    } else {
			console.log("SECTION HEADER NOT IDENTICAL");
			console.log("NOT IMPLEMENTED A");
		    }
		}
	    }
	    if(idx_view>=dom_targets.length) { traversed_all_view_nodes=true;    }

	    // now we're definitely in the right section, take care of the actual node
	    if(!traversed_all_view_nodes) {
		// the next view node could still be another section, not an entry
		if($(dom_targets[idx_view]).find(".tut_section_label").length>0) {
		    // it's a section label, but we want an entry here! insert!
		    console.log("INSERTING NODE BEFORE EXISTING SECTION HEADER");
		    var node=createTutEntryNode(entry);
		    $(dom_targets[idx_view]).before(node);
		    idx_model++;
		    continue;
		}
		
		console.log($(dom_targets[idx_view]).attr("id"));
		var domuid=decodeID($(dom_targets[idx_view]).attr("id"));
		if(domuid==entry["uid"]) {
		    console.log("IDENTICAL ENTRY");
		    idx_view++;
		    idx_model++;
		} else {
		    console.log("ENTRIES NOT IDENTICAL - SIMPLY INSERTING A NEW ONE BEFORE THE EXISTING ONE!");
		    var node=createTutEntryNode(entry);
		    $(dom_targets[idx_view]).before(node.slideDown(1000));  // not overly pretty (yet). certainly broken in Safari. Not tried other browsers yet.
		    idx_model++;
		}
	    } else {
		// no more view modes to compare against - definitely simply add an entry!
		//console.log("NOT IMPLEMENTED C");
		console.log("APPENDING NODE TO END OF VIEW");
		var node=createTutEntryNode(entry);
		c.append(node);
		idx_model++;
	    }
	    //var node=createTutEntryNode(entry);
	    //c.append(node);
	    
	    // What's still missing:
	    // - create remaining nodes when reached end of view
	    // - delete remaining view entries when reached end of model
	    // - update node contents **if modified** (add modified flag to model?)
	    //    why is this important: primarily for newly added entries from 
	    //    template: time field needs to be updated. Also in the template itself.
	    //    although maybe we'll cheat when it comes to continuously updating the
	    //    time in the template. seems like a lot of overhead to sync every
	    //    second. although we can limit the syncing to "first few items"
	    //    unless there is a date change (section headers!)...

	    // next version: more intelligence when moving nodes, maybe based on
	    // inside knowledge of timestamp
	}
	// grey out the top entry to visualize that it's only a template.
	// @todo maybe move this business logic to a more suitable place
	//var top_entry=$('#tut-entries-container .tut_entry:first');
	//console.log(top_entry);
	//top_entry.find('.tut_viewbox').addClass('tut_notyetvalid');
    }

    function itemClicked(event) {
	//$(this).addClass("tut_editing");
	var entryroot=$(this).parents(".tut_entry");
	var container=$(this).parents(".tut_container");
	container.addClass("tut_editing");
	console.log("item with id "+$(entryroot).attr("id")+" was clicked.");
	var uid=decodeID($(entryroot).attr("id"));
	console.log("item with id "+uid+" was clicked.");
	var view=$(container).find(".tut_viewbox");
	var edit=$(container).find(".edit");
	edit.val(view.html());  // @todo retrieve from model
	edit.focus();

	// if the user clicked an entry field in the template,
	// turn the template into a proper entry, and add a new
	// template to the top
	if(uid=="entrytemplate") {
	    console.log("turning template into proper entry");
	    var d = new Date();
	    var now = d.getTime();
	    var uid=mymodel.addEntry({"starttime_utc_ms":now});
	    entryroot.attr("id",encodeID(uid));
	    $(entryroot).find(".tut_notyetvalid").removeClass("tut_notyetvalid");
	    // create a new template
	    /*
	    var container=$('#tut-entries-container');
	    var node=createTutEntryNode(entry_template);
	    addEventListeners(node);
	    container.prepend(node);
	    */
	    redrawTutEntriesUI([entry_template].concat(mymodel.getAllEntries()));

	    // @todo deal with sorting out the section names

	}
	//alert('clicked');
    }

    // An edit box was blurred
    function itemBlurred(event) {
	console.log('blurred');
	var view=$(this).siblings('.tut_viewbox');
	view.html( $(this).val() ); 
	// store to model
	var entryroot=$(this).parents(".tut_entry");
	var uid=decodeID($(entryroot).attr("id"));
	var entry=mymodel.getEntryByUID(uid);
	var val=$(this).val();
	if($(this).hasClass("tut_logentry_edit")) {
	    entry.logentry=val;
	} else if($(this).hasClass("tut_proj_edit")) {
	    entry.project=val;
	} else {
	    console.log("cannot store this field");
	    alert("sorry cannot store - don't know how");
	}
	console.log(entry);
	mymodel.updateEntry(entry);
	$(this).parent().removeClass("tut_editing");
    }
    function onKeyPress(event) {
	//alert('keypress');
	//$(this).parent().removeClass("editing");
	if (event.keyCode === ENTER_KEY) {
	    //addTodo(newTodoDom.value);
	    //newTodoDom.value = '';
	    // store value in view element
	    $(this).blur();
	    //alert('enter');
	}

    }


    function addEventListeners(root) {
	//newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
	var containers=$(root).find('.tut_container');
	var viewboxes=$(root).find('.tut_viewbox');
	var editboxes=$(root).find('.tut_editbox');
	//containers.on('click',null,null,itemClicked);
	viewboxes.on('click',null,null,itemClicked);
	editboxes.on('blur',null,null,itemBlurred);
	editboxes.on('keypress',null,null,onKeyPress);
    }
    
    console.log("mark A");

    var mymodel={
	datastore:[],
	generateUUID:function() {
	    // from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	    var d = new Date().getTime();
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	    });
	    return uuid;
	},
	addEntry:function(entry) { 
	    // for now, we always add the new entry to the beginning
	    // of the list, assuming it is the most recent one.
	    // @returns UID of created entry
	    var uid=this.generateUUID();
	    entry["uid"]=uid;
	    this.datastore=[entry].concat(this.datastore);
	    this.saveToLocalStorage();
	    return uid;
	},
	updateEntry:function(entry) {
	    for(var i=0;i<this.datastore.length;i++) {
		if(this.datastore[i].uid==entry.uid) {
		    console.log("found culprit for updateentry");
		    this.datastore[i]=entry;
		    break;
		}
	    }
	    this.saveToLocalStorage();
	},
	getEntryByStarttime:function(starttime_utc_ms) {
	    console.log("model.getEntryByStarttime("+starttime_utc_ms+")");
	    console.log(this.datastore.length);
	    for(var i=0;i<this.datastore.length;i++) {
		console.log(this.datastore[i].starttime_utc_ms);
		if(this.datastore[i].starttime_utc_ms==starttime_utc_ms) {
		    console.log("found culprit for getEntryByStarttime");
		    return this.datastore[i];
		}
	    }
	},
	getEntryByUID:function(uid) {
	    console.log("model.getEntryByUID("+uid+")");
	    console.log(this.datastore.length);
	    for(var i=0;i<this.datastore.length;i++) {
		console.log(this.datastore[i].uid);
		if(this.datastore[i].uid==uid) {
		    console.log("found culprit for getEntryByUID");
		    return this.datastore[i];
		}
	    }
	    console.log("CANNOT FIND ENTRY WITH UID "+uid+" IN MODEL");
	},
	getAllEntries:function() {
	    return this.datastore;
	},
	saveToLocalStorage:function() {
	    localStorage.tut_grill_entries=JSON.stringify(this.datastore);
	},
	readFromLocalStorage:function() {
	    this.datastore=JSON.parse(localStorage.tut_grill_entries);
	}
    };

    var sampleEntries;
    
    if(localStorage) {
	console.log("localStorage exists");
    }

    if(localStorage.tut_grill_entries) {
	console.log("localStorage has a tut_grill_entries entry");
	mymodel.readFromLocalStorage();
    } else {
	sampleEntries= [
	    { "uid":"uid1","starttime_utc_ms":1234567891, "project":"ORG.OG3.301", "logentry":"researched multiplexers", "duration":"unknown" },
	    { "uid":"uid2","starttime_utc_ms":129566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"entered time continuum", "duration":"unknown" },
	    { "uid":"uid3","starttime_utc_ms":124566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"defibrillation unit (pt 1)", "duration":"unknown" },
	    { "uid":"uid4","starttime_utc_ms":123456, "starttime":"34:56", "project":"DIM.WHIT.300", "logentry":"researched multiplexers again", "duration":"0:35:02" }
	];
	localStorage.tut_grill_entries=JSON.stringify(sampleEntries);
	mymodel.readFromLocalStorage();
    }



    $(document).ready(function(){
	console.log("mark B");
	var d = new Date();
	var now = d.getTime();

	// remove this again in the end
	var c=$('#tut-entries-container');
	c.empty();

	$("#updategui").on('click',null,null,function() {
	    redrawTutEntriesUI([entry_template].concat(mymodel.getAllEntries()));
	    //addEventListeners(document);
	});

	//addEventListeners(document);
	//$('#tut-entry-template').clone().appendTo("body");
    });


})();
