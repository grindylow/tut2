(function() {

  'use strict';

    var ENTER_KEY = 13;
    var tutEntryTemplate = document.getElementById('tut-entry-template');

    var entry_template = 
	{ "starttime_utc_ms":-1,   // was: now,
	  "project":"enter project", 
	  "logentry":"enter log entry (task description)", 
	  "duration":"unknown" 
	};



  // We have to create a new todo document and enter it in the database
  function addTodo(text) {
      var todo = {
	  _id: new Date().toISOString(),
	  title: text,
	  completed: false
      };
      db.put(todo, function callback(err, result) {
	  if (!err) {
	      console.log('Successfully posted a todo!');
	  }
      });
  }

  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed(todo) {
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred(todo, event) {
  }

  // Initialise a sync with the remote server
  function sync() {
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditTodo = document.getElementById('input_' + todo._id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id);
      inputEditTodo.blur();
    }
  }

    // Encode a given timestamp as a valid HTML ID
    function encodeID(ts) {
	return "id-"+ts;
    }

    // inverse of encodeID()
    function decodeID(idstr) {
	return parseInt(idstr.substr(3));
    }

    // Given an entry, create a DOM node for it, ready
    // for appending to the DOM.
    function createTutEntryNode(entry) {
	var template=$('#tut-entry-template');
	console.log(template);
	var node=template.clone();
	//node.removeAttr("id"); // will be replaced by next line of code, 
                                 // no need to delete first
	//node.makevisible  // our template is invisible via CSS, but
	// the clones are automatically fine, because they have a 
	// different ID.
	node.attr("id",encodeID(entry["starttime_utc_ms"]));
	node.find(".tut_project").html(entry.project);
	node.find(".tut_logentry").html(entry.logentry);
	var d=new Date(entry['starttime_utc_ms']);
	var t=timeStr(d);
	node.find(".tut_starttime").html(t);
	// if this is the entry template, grey out the entries
	if(entry['starttime_utc_ms']===-1) {
	    node.find(".tut_viewbox").addClass("tut_notyetvalid");
	}
	console.log("created entry:");
	console.log(entry);
	return node;
    }

    // Take a Date object and turn it into something like "12:51"
    function timeStr(d) {
	var r;
	var h=d.getHours();
	if(h<10) { 
	    h='0'+h;
	}
	var m=d.getMinutes();
	if(m<10) {
	    m='0'+m;
	}
	return h+':'+m;
    }

  // Convert the start time of the given entry to
  // a string representation of the start day, used
  // to build section headers.
    function calcSectionName(entry) {
	var t=entry['starttime_utc_ms']
	var d=new Date(t);
	var sectionname="illegal starttime";
	if(t) {
	    sectionname=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
	}
	return sectionname;
	//return "dummy";
    }

  // Create DOM elements for all time tracking entries.
  // Create section headings for each new day as needed.
  function redrawTutEntriesUI(entries) {
      var c = $('#tut-entries-container');
      //c=document.getElementById("tut-entries-container");
      //c.innerHTML = '';
      c.empty();
      console.log("mark C");
      var currentSection=''; // start with something invalid to ensure
			     // we create a new section as soon as we
			     // start processing entries
      entries.forEach(function(entry) {
	  var section=calcSectionName(entry);
	  if(section!=currentSection) {
	      c.append(section);
	      currentSection=section;
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

    function itemClicked(event) {
	//$(this).addClass("tut_editing");
	var entryroot=$(this).parents(".tut_entry");
	var container=$(this).parents(".tut_container");
	container.addClass("tut_editing");
	console.log("item with id "+$(entryroot).attr("id")+" was clicked.");
	var id=decodeID($(entryroot).attr("id"));
	console.log("item with id "+id+" was clicked.");
	var view=$(container).find(".tut_viewbox");
	var edit=$(container).find(".edit");
	edit.val(view.html());  // @todo retrieve from model
	edit.focus();

	// if the user clicked an entry field in the template,
	// turn the template into a proper entry, and add a new
	// template to the top
	if(id===-1) {
	    console.log("turning template into proper entry");
	    var d = new Date();
	    var now = d.getTime();
	    entryroot.attr("id",encodeID(now));
	    mymodel.addEntry({"starttime_utc_ms":now});
	    $(entryroot).find(".tut_notyetvalid").removeClass("tut_notyetvalid");
	    // create a new template
	    var container=$('#tut-entries-container');
	    var node=createTutEntryNode(entry_template);
	    addEventListeners(node);
	    container.prepend(node);
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
	var id=decodeID($(entryroot).attr("id"));
	var entry=mymodel.getEntryByStarttime(id);
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
	addEntry:function(entry) { 
	    // for now, we always add the new entry to the beginning
	    // of the list, assuming it is the most recent one.
	    this.datastore=[entry].concat(this.datastore);
	    this.saveToLocalStorage();
	},
	updateEntry:function(entry) {
	    for(var i=0;i<this.datastore.length;i++) {
		if(this.datastore[i].starttime_utc_ms===entry.starttime_utc_ms) {
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
	    { "starttime_utc_ms":1234567891, "project":"ORG.OG3.301", "logentry":"researched multiplexers", "duration":"unknown" },
	    { "starttime_utc_ms":129566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"entered time continuum", "duration":"unknown" },
	    { "starttime_utc_ms":124566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"defibrillation unit (pt 1)", "duration":"unknown" },
	    { "starttime_utc_ms":123456, "starttime":"34:56", "project":"DIM.WHIT.300", "logentry":"researched multiplexers again", "duration":"0:35:02" }
	];
	localStorage.tut_grill_entries=JSON.stringify(sampleEntries);
    }



    $(document).ready(function(){
	console.log("mark B");
	var d = new Date();
	var now = d.getTime();

	redrawTutEntriesUI([entry_template].concat(mymodel.getAllEntries()));
	addEventListeners(document);
	//$('#tut-entry-template').clone().appendTo("body");
    });


})();
