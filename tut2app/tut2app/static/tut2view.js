/* tut2 */

/* model: maintains a list of entries
   view: can (intelligently) update the visible page based on those entries:
         if the respective element already exists, it won't be
         re-created. If only some of its contents have changed, only
         the relevant content will be updated.
 */

'use strict';

/* from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/43383990#43383990 */
String.prototype.hashCode = function() {
    var hash = 0, i = 0, len = this.length;
    while ( i < len ) {
        hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
    }
    return hash + 2147483648;
};

var colours = ['f0f8ff','faebd7','00ffff','7fffd4','f0ffff','f5f5dc','ffe4c4','000000','ffebcd','0000ff','8a2be2','a52a2a','deb887','5f9ea0','7fff00','d2691e','ff7f50','6495ed','fff8dc','dc143c','00ffff','00008b','008b8b','b8860b','a9a9a9','a9a9a9','006400','bdb76b','8b008b','556b2f','ff8c00','9932cc','8b0000','e9967a','8fbc8f','483d8b','2f4f4f','2f4f4f','00ced1','9400d3','ff1493','00bfff','696969','696969','1e90ff','b22222','fffaf0','228b22','ff00ff','dcdcdc','f8f8ff','ffd700','daa520','808080','808080','008000','adff2f','f0fff0','ff69b4','cd5c5c','4b0082','fffff0','f0e68c','e6e6fa','fff0f5','7cfc00','fffacd','add8e6','f08080','e0ffff','fafad2','d3d3d3','d3d3d3','90ee90','ffb6c1','ffa07a','20b2aa','87cefa','778899','778899','b0c4de','ffffe0','00ff00','32cd32','faf0e6','ff00ff','800000','66cdaa','0000cd','ba55d3','9370db','3cb371','7b68ee','00fa9a','48d1cc','c71585','191970','f5fffa','ffe4e1','ffe4b5','ffdead','000080','fdf5e6','808000','6b8e23','ffa500','ff4500','da70d6','eee8aa','98fb98','afeeee','db7093','ffefd5','ffdab9','cd853f','ffc0cb','dda0dd','b0e0e6','800080','663399','ff0000','bc8f8f','4169e1','8b4513','fa8072','f4a460','2e8b57','fff5ee','a0522d','c0c0c0','87ceeb','6a5acd','708090','708090','fffafa','00ff7f','4682b4','d2b48c','008080','d8bfd8','ff6347','40e0d0','ee82ee','f5deb3','ffffff','f5f5f5','ffff00','9acd32'];
colours = ['red','yellow','cyan','blue','magenta'];

// grey_target: 0.5
var project_colours = [
    "#bf684c",   /* hue=0.04, s=0.60, v=0.75 */
    "#91833a",   /* hue=0.14, s=0.60, v=0.57 */
    "#6d953b",   /* hue=0.24, s=0.60, v=0.59 */
    "#43a847",   /* hue=0.34, s=0.60, v=0.66 */
    "#3f9f7d",   /* hue=0.44, s=0.60, v=0.63 */
    "#4593ac",   /* hue=0.54, s=0.60, v=0.68 */
    "#6178f2",   /* hue=0.64, s=0.60, v=0.95 */
    "#9a5de8",   /* hue=0.74, s=0.60, v=0.91 */
    "#c54ec0",   /* hue=0.84, s=0.60, v=0.77 */
    "#d25481"    /* hue=0.94, s=0.60, v=0.83 */
];

function tut2_createDefaultView() {
    var v={};
    var self=v;  // Javascript this refers to DOM object inside callbacks
    var ENTER_KEY=13;
    var indicator_start_time;

    /**** private functions ****/

    // Encode a given entry ID as a valid HTML ID
    var encodeID=function(rawid) {
        return "id-"+rawid;
    };

    // inverse of encodeID()
    var decodeID=function(idstr) {
        return idstr.substr(3);
    };

    // Given an entry, create a DOM node for it, ready
    // for appending to the DOM.
    // If given a "subsequent entry", also calculate
    // the time distance to this next entry, and note this
    // down in our entry's duration field.
    var createTutEntryDOMNode = function(entry, subs_entry) {
        var template=$('#tut-entry-template');
        var node=template.clone();
        //node.removeAttr("id"); // will be replaced by next line of code,
                                     // no need to delete first
        //node.makevisible  // our template is invisible via CSS, but
        // the clones are automatically fine, because they have a
        // different ID.
        node.attr("id", encodeID(entry.getUID()));
        node.data("revision", entry.getRevision());  // store currrent revision, ".data" is jQuery
        node.find(".tut_project").html(entry.getProject());

        // select a colour based on project name: use hash function to pick
        const regex = /^\s*(?<project>[^ .]+)(\.(?<subproject>[a-zA-Z0-9]+)|)/gm;
        var fullprojstr = entry.getProject();
        var m = regex.exec(fullprojstr);
        console.log("regex result", m);
        var proj = ""
        if (m !== null) {
            proj = m.groups.project;
        }
        const nullproj_regex = /(^0$)/gm;

        var h = proj.hashCode();
        var bgcol = h%project_colours.length;
        var colval = project_colours[bgcol];
        if(nullproj_regex.exec(proj) !== null) {
            colval = "#bababa";
        }
        console.log("number of colours", project_colours.length);
        console.log("Hashcode of ", proj, "is", h);
        node.find(".tut_project").css({'background-color':colval});

        node.find(".tut_logentry").html(entry.getLogentry());
        var d = new Date(entry.getStarttimeUtcMs());
        var t = timeStr(d);
        node.find(".tut_starttime").html(t);
        // if this is the entry template, grey out the entries
        if(entry.getUID()=="entrytemplate") {
            node.find(".tut_viewbox").addClass("tut_notyetvalid");
        }
        // calculate duration if given a "next entry"
        if(subs_entry !== undefined) {
            var duration_ms = subs_entry.getStarttimeUtcMs() - entry.getStarttimeUtcMs();
            var duration_str = durationStr(duration_ms);
            node.find('.tut_duration').html(duration_str);
        }
        console.log("created entry:");
        console.log(entry);
        addEventListeners(node);
        return node;
    };

    // Given a section label, create a DOM node for it, ready
    // for appending to the DOM.
    var createSectionHeaderNode=function(sectionlabel) {
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
    };

    // Take a Date object and turn it into something like "12:51:02"
    var timeStr=function(d) {
        return prefixWithZeroes(d.getHours())+
        ':'+prefixWithZeroes(d.getMinutes())+
        ':'+prefixWithZeroes(d.getSeconds());
    };

    // Take a Date object and turn it into something like "2015-01-22"
    var dateStr=function(d) {
        return prefixWithZeroes(d.getFullYear(),4)+
        '-'+prefixWithZeroes(d.getMonth()+1)+
        '-'+prefixWithZeroes(d.getDate())+
        ' ('+dayName(d)+')';
    };

    // Take a duration in ms and turn it into something like "37d 8:11:27"
    var durationStr = function(ms) {
        var r = '';
        var secs = 1000;
        var mins = secs * 60;
        var hours = mins * 60;
        var days = hours * 24;
        if(ms >= days) {
            r = r + Math.floor(ms / days) + 'd';
            ms = ms % days;
        }
        r = [r, Math.floor(ms/hours)].join(' ');
        ms = ms % hours;
        if(r == ' 0') {  // if no hours, don't display them at all
            r = Math.floor(ms / mins);
        } else {
            r = r + ':' + prefixWithZeroes(Math.floor(ms / mins));
        }
        ms = ms % mins;
        r = r + ':' + prefixWithZeroes(Math.floor(ms / secs));
        return r;
    }

    // Take a Date object and turn it into an ISO data string like "2007-04-05T12:30:45.765-02:00"
    var toISO8601 = function(d) {
        return d.toISOString();
        /* @future: make it display date in current timezone */
    };

    // Take a ISO time string and convert it into "ms since Javascript epoch".
    var fromISO8601 = function(isostr) {
        return Date.parse(isostr);  /* @future: "using Date.parse() is strongly discouraged" */
    };

    // Take a "time in ms" value and show its hour and minute components in the current local
    // timezone. This is used for manually editing time entries. Usually, one would only want
    // to alter hours and minutes. To convert back to a full timestamp, use fromLocalHoursMinutes(),
    // but note that this function also needs a reference timestamp (see below).
    var toLocalHoursMinutes = function(time_ms) {
        var d = new Date(time_ms);
        return prefixWithZeroes(d.getHours())+':'+prefixWithZeroes(d.getMinutes());
    }

    // Convert the given String (hopefully of the format HH:MM) into a "ms since epoc" value.
    // Use the specified timestamp as a frame of reference.
    // This implementation cannot currently cross (local time zone) day boundaries.
    // (@future: We could narrow this down further, to also not allow crossing the boundaries
    // set by the previous and next time entries.)
    var fromLocalHoursMinutes = function(hhmmstr, reference_time_ms) {
        var d = new Date(reference_time_ms);
        // approach: simply replace HH and MM components of the reference timestamp
        var components = hhmmstr.split(":");
        d.setHours(parseInt(components[0]));
        d.setMinutes(parseInt(components[1]));
        d.setSeconds(0);
        d.setMilliseconds(0);
        console.log("fromLocalHoursMinutes", hhmmstr, reference_time_ms, d, d.getTime());
        return d.getTime();
    }

    // get the name of the day
    var dayName=function(d) {
        var names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return names[d.getDay()];
    }

    var prefixWithZeroes=function(v, d=2) {
        while(v.toString().length<d) {
            v='0'+v;
        }
        return v;
    };

    // Convert the start time of the given entry to
    // a string representation of the start day, used
    // to build section headers.
    var calcSectionName=function(entry) {
        var t=entry.getStarttimeUtcMs();
        var d=new Date(t);
        var sectionname="illegal starttime";
        if(t) {
            sectionname=dateStr(d);
        }
        return sectionname;
        //return "dummy";
    };

  // Create DOM elements for all time tracking entries.
  // Create section headings for each new day as needed.
  var redrawTutEntriesUI_old=function(entries) {
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
                  var node=createTutEntryDOMNode(entry);
                  c.append(node);
              });

      // grey out the top entry to visualize that it's only a template.
      // @todo maybe move this business logic to a more suitable place
      var top_entry=$('#tut-entries-container .tut_entry:first');
      console.log(top_entry);
      top_entry.find('.tut_viewbox').addClass('tut_notyetvalid');
  };

    // The resume button of some entry or other was clicked.
    // Create a new entry with identical properties but current time
    // (and new uid of course).
    var resumeClicked = function(event) {
        console.log("resumeClicked()");
        var entryroot = $(this).parents(".tut_entry");
        console.log("item with id " + $(entryroot).attr("id") + " is the resume source.");
        var uid = decodeID($(entryroot).attr("id"));
        if(uid == "entrytemplate") {
            console.log("won't resume entrytemplate!!");
            return false;
        }
        var src = mymodel.getEntryByUID(uid);
        var newentry = src.createDuplicate();
        var now = Date.now();
        newentry.setStarttimeUtcMs(now);
        mymodel.addEntry(newentry);
        self.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        return false; // event handled!
    };

    // The "add entry above" button of some entry or other was clicked.
    // Create a new entry and insert it above this one.
    // @future: Create a new entry with identical properties and insert it
    // above this one. This is the "clone to above" option, which somehow needs
    // to be accessible from the GUI, for example with a separate button to the
    // right of the regular "insert empty row above" button.
    // @future: If user clicks this multiple times, multiple entries with the
    // same timestamp will currently be created. Fix this by checking the next
    // entry and ensuring we pick a timestamp in between the two. [flaw,not-bug]
    var insertEntryAboveClicked = function(event) {
        console.log("insertEntryAboveClicked()");
        var uid = findUIDOfClickedEntry(this);
        var src = mymodel.getEntryByUID(uid);
        var newentry = src.createDuplicate();
        var newstarttime = src.getStarttimeUtcMs() + 1000;
        newentry.setStarttimeUtcMs(newstarttime);
        mymodel.addEntry(newentry);
        self.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        return false; // event handled!
    };

    // The "add entry below" is analogous to the "add entry above" (see code above)
    //  in fact, the only difference to the code above is that we subtract a
    //  second from the entry to be copied, instead of adding a second.
    // @todo refactor commonalities into some more generic function, but we
    // need to decide what functionality we actually want (see also comment for
    // "add entry above", above.
    var insertEntryBelowClicked = function(event) {
        console.log("insertEntryBelowClicked()");
        var uid = findUIDOfClickedEntry(this);
        var src = mymodel.getEntryByUID(uid);
        var newentry = src.createDuplicate();
        var newstarttime = src.getStarttimeUtcMs() - 1000;
        newentry.setStarttimeUtcMs(newstarttime);
        mymodel.addEntry(newentry);
        self.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        return false; // event handled!
    };

    /* Helper function for various "onClick" handlers:
     * Determine (look up) the UID of the clicked entry.
     */
    var findUIDOfClickedEntry = function(clickeditem) {
        var entryroot = $(clickeditem).parents(".tut_entry");
        console.log("findUIDOfClickedEntry() found this entry UID: " + $(entryroot).attr("id"));
        var uid = decodeID($(entryroot).attr("id"));
        if(uid == "entrytemplate") {
            console.warn("are you sure you want to do anything to/with the entrytemplate???");
            //return false;
        }
        return uid;
    };

    // The delete button of an entry was clicked.
    var removeClicked = function(event) {
        console.log("removeClicked()");
        var entryroot = $(this).parents(".tut_entry");
        console.log("item with id " + $(entryroot).attr("id") + " is to be removed.");
        var uid=decodeID($(entryroot).attr("id"));
        if(uid == "entrytemplate") {
            console.log("won't delete entrytemplate!!");
            return false;
        }
        uid = mymodel.deleteEntry(uid);
        self.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        return false; // event handled!
    };

    var itemClicked = function(event) {
        //$(this).addClass("tut_editing");
        var entryroot=$(this).parents(".tut_entry");
        var container=$(this).parents(".tut_container");
        container.addClass("tut_editing");
        console.log("item with id "+$(entryroot).attr("id")+" was clicked.");
        console.log(self);
        var uid=decodeID($(entryroot).attr("id"));
        console.log("item with id "+uid+" was clicked.");
        var view=$(container).find(".tut_viewbox");
        var edit=$(container).find(".edit");

        // if the user clicked an entry field in the template,
        // turn the template into a proper entry, and add a new
        // template at the top
        if(uid=="entrytemplate") {
            console.log("turning template into proper entry");
            var now = Date.now();
            var entry=tut2_createTutEntry( mymodel, {"starttime_utc_ms":now} );
            entry.setProject("");
            entry.setLogentry("");
            uid=entry.getUID();
            mymodel.addEntry(entry);
            entryroot.attr("id",encodeID(uid));
            entryroot.data("revision",entry.getRevision()); // the template didn't have a revision entry.
              // if we didn't add this, the GUI refresh would redraw  the element, removing focus
              // from the currently active text field..
            $(entryroot).find(".tut_notyetvalid").removeClass("tut_notyetvalid");
            // create a new template
            self.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        }

        var entry=mymodel.getEntryByUID(uid);
        var val="SORRY-0x1201";
        if($(edit).hasClass("tut_logentry_edit")) {
            val=entry.getLogentry();
        } else if($(edit).hasClass("tut_proj_edit")) {
            val=entry.getProject();
        } else if($(edit).hasClass("tut_starttime_edit")) {
            var ms = entry.getStarttimeUtcMs();
            val = toLocalHoursMinutes(ms);
        } else {
            console.log("don't know this field");
            alert("sorry don't know this field");
        }
        edit.val(val);
        edit.focus();
    };

    // An edit box was blurred
    var itemBlurred=function(event) {
        console.log('blurred');
        var view=$(this).siblings('.tut_viewbox');
        // store to model
        var entryroot=$(this).parents(".tut_entry");
        var uid=decodeID($(entryroot).attr("id"));
        var entry=mymodel.getEntryByUID(uid);
        var val=$(this).val();
        if($(this).hasClass("tut_logentry_edit")) {
            view.html( $(this).val() );   // update view
            entry.setLogentry(val);
        } else if($(this).hasClass("tut_proj_edit")) {
            view.html( $(this).val() );   // update view
            entry.setProject(val);
        } else if($(this).hasClass("tut_starttime_edit")) {
            var ms = fromLocalHoursMinutes(val, entry.getStarttimeUtcMs());
            entry.setStarttimeUtcMs(ms);
            view.html("ab:cd:ef");   // update view
        } else {
            console.log("cannot store this field");
            alert("sorry cannot store - don't know how");
        }
        console.log(entry);
        mymodel.updateEntry(entry);  // @todo probably no longer necessary, we're editing the original entry anyway, right?
        $(this).parent().removeClass("tut_editing");
        // @todo update .data("revision") to indicate we're already displaying the latest revision
    };

    var onKeyPress=function(event) {
        //alert('keypress');
        //$(this).parent().removeClass("editing");
        if (event.keyCode === ENTER_KEY) {
            //addTodo(newTodoDom.value);
            //newTodoDom.value = '';
            // store value in view element
            $(this).blur();
            //alert('enter');
        }

    };

    var findEntryForDOMEntity=function(entity) {
        // return model of the TutEntry visualised by the given DOM entity
        var entryroot = $(entity).parents(".tut_entry");
        var uid = decodeID($(entryroot).attr("id"));
        var src = mymodel.getEntryByUID(uid);
    }

    var addEventListeners=function(root) {
        //newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
        var containers=$(root).find('.tut_container');
        var viewboxes=$(root).find('.tut_viewbox');
        var editboxes=$(root).find('.tut_editbox');
        var editboxes_proj=$(root).find('.tut_proj_edit');
        var editboxes_logentry=$(root).find('.tut_logentry_edit');
        var resumebuttonlinks=$(root).find('.tut_resume a');
        var removebuttonlinks=$(root).find('.tut_remove a');
        var insertentryabovelinks=$(root).find('.tut_insertabove a');
        var insertentrybelowlinks=$(root).find('.tut_insertbelow a');
        //containers.on('click',null,null,itemClicked);
        viewboxes.on('click',null,null,itemClicked);
        editboxes.on('blur',null,null,itemBlurred);
        editboxes.on('keypress',null,null,onKeyPress);
        resumebuttonlinks.on('click',null,null,resumeClicked);
        removebuttonlinks.on('click',null,null,removeClicked);
        insertentryabovelinks.on('click',null,null,insertEntryAboveClicked);
        insertentrybelowlinks.on('click',null,null,insertEntryBelowClicked);

        // issue 4: autosuggest (using jqueryui: https://jqueryui.com/autocomplete/#default)
        // We pass the type of the edit box in as an "extended attribute" (x_type).
        // This is how we can decide whether we should suggest completions from project names
        // or from log entries.
        let suggest_function = function (request, response) {
            console.log("autocompleting...", this, $(this));
            console.log(this.options.x_type);
            let gettext = function(entry) { return entry.getProject(); };
            if (this.options.x_type === "logentry") {
                gettext = function(entry) { return entry.getLogentry(); };
            }
            var entries = mymodel.getAllEntries();
            const needle = request.term.toLowerCase();
            const result = new Set();
            for (const entry of entries) {
                var p = gettext(entry);
                if (p.toLowerCase().includes(needle)) {
                    result.add(p);
                }
                if (result.size >= 10) {
                    break;
                }
            }
            response(Array.from(result));
        }
        // editboxes_proj.autocomplete({
        //     x_type: "proj",
        //     source: suggest_function
        // });
        // editboxes_logentry.autocomplete({
        //     x_type: "logentry",
        //     source: suggest_function
        // });

        // drag time trials:
        // references: http://luke.breuer.com/tutorial/javascript-drag-and-drop-tutorial.aspx

        var is_dragging = false;
        var ref_coords_x, ref_coords_y;

        // current dx, dy during an ongoing dragging session
        var dx, dy;

        // entry that is being dragged
        var entry_DOM_entity;  // this is the "entry" Element that was clicked
        var entry_model; // we perform live visual updates on the entry using this model "proxy" object

        var timeadjusters = $(root).find('.tut_adjstarttime a');
        timeadjusters.on('mousedown',null,null,function(event) {
            console.log('md on adjuster', event);
            // Start tracking the mouse, and snapping the adjuster and/or time of current entry to certain grid values
            is_dragging = true;
            ref_coords_x = event.originalEvent.clientX;
            ref_coords_y = event.originalEvent.clientY;

            entry_DOM_entity = $(event.target).parents(".tut_entry");
            var uid = findUIDOfClickedEntry(event.target);
            entry_model = mymodel.getEntryByUID(uid);

            // @// TODO:
            // for the duration of the drag operation, we create a "view" object for the current entry
            // that deals with drawing the entry's changing start time.
            // Only when the drag operation finishes will we update the actual entry (model) with the
            // new start time.

            var my_starttime_container = $(entry_DOM_entity).find(".tut_starttime");
            my_starttime_container.addClass('currently_dragging_starttime');

            return false;  // indicate "we have handled it" -> otherwise user will start dragging the icon around
        });
        $(document).on('mouseup',null,null,function(event) {
            // todo needs to go on entire window/screen actually - user will drag all over the place!
            if(is_dragging)
            {
                console.log('mu on document');
                var my_starttime_container = $(entry_DOM_entity).find(".tut_starttime");
                my_starttime_container.removeClass('currently_dragging_starttime');
                is_dragging = false;
                entry_model.finalise_drag_adjustment();
            }
            // Stop tracking the mouse, set new time (or abort if too far from adjustment area/path)
            return false;  // indicate "we have handled it"
        });
        $(document).on('mousemove',null,null,function(event) {
            // mouse was moved
            if(is_dragging)
            {
                var x = event.originalEvent.clientX;
                var y = event.originalEvent.clientY;
                dx = ref_coords_x-x;
                dy = ref_coords_y-y;
                console.log('mm on document: current delta = ', dy);
                var updown = Math.sign(dy);
                console.log('mm on document:',event);
                console.log(' - this relates to entry_model', entry_model);

                // decide on size of adjustment depending on vertical distance from drag origin
                // Model knows best how to do this.
                entry_model.adjust_to_nth_next_interval(Math.trunc(dy/10));
                /*
                if(dy<50) {
                    entry_model.adjust_to_nth_next_interval(updown*Math.trunc(dy/10), 60);  // minute
                } else if(Math.abs(dy<100)) {
                        entry_model.adjust_to_nth_next_interval(updown*Math.trunc((dy-40)/10), 15*60);  // quarter hour
                } else {
                    entry_model.adjust_to_nth_next_interval(updown*Math.trunc((dy-90)/10), 60*60);  // full hour
                }
                */
                console.log(entry_DOM_entity);
                var my_starttime_div = $(entry_DOM_entity).find(".tut_starttime");
                var d = new Date(entry_model._tentativeStarttimeMs);
                console.log("_tentativeStarttimeMs", entry_model._tentativeStarttimeMs);
                console.log("Date(_tentativeStarttimeMs)", d);
                var t = timeStr(d);
                my_starttime_div.html(t);
            }
            return false;  // indicate "we have handled it"
        });
    };


/**** publicly accessible member functions ****/

    // Create DOM elements for all time tracking entries.
    // Create section headings for each new day as needed.
    // only create what isn't there already
    v.redrawTutEntriesUI = function(entries) {
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
        // - whenever we encounter an entry that isn't in the HTML where it
        //   ought to be, we simply insert it.
        // - if there are any entries left in the HTML once we have reached
        //   the end of our model, we simply delete them.
        //   (for deleted model entries that approach usually means we'll
        //   rebuild the entire list from the removed entry on, and then remove
        //   the - now duplicate - tail).
        //   (it won't deal with changed timestamps too well, either...)
        //   but it will cope - good enough for now!
        var idx_model=0;  // index into model
        var idx_view=0;   // index into HTML nodes
        var traversed_all_model_entries=false;
        var traversed_all_view_nodes=false;
        var prev_entry;   // during processing: the previous entry (i.e. the next entry, time-wise)

        console.log("dom_targets.length="+dom_targets.length);
        console.log("entries.length="+entries.length);

        while(true) {
            if(idx_view>=dom_targets.length) { traversed_all_view_nodes=true;    }
            if(idx_model>=entries.length)    { traversed_all_model_entries=true; }

            if(traversed_all_view_nodes && traversed_all_model_entries) {
                break; // we're done
            }
            if(traversed_all_model_entries) {
                // all that remains is to clear out all remaining view entries
                console.log("view tail clearout");
                for(var i=idx_view; i<dom_targets.length; i++) {
                    $(dom_targets[i]).remove();
                }
                break;
            }
            var entry=entries[idx_model];

            // Is the entry deleted (i.e. doesn't exist anymore)? If yes, ignore it!
            if(entry.isDeleted()) {
                idx_model++;
                continue;
            }

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
                    var expectednode=createSectionHeaderNode(sectionname);
                    var actualnode=dom_targets[idx_view];
                    var actualnode_sectionlabel=$(actualnode).find(".tut_section_label");
                    console.log(actualnode_sectionlabel);
                    //console.log($(expectednode).find(".tut_section_label")[0].innerHTML,actualnode_sectionlabel[0].innerHTML);
                    if(     (actualnode_sectionlabel.length!=0)
                        &&  ($(expectednode).find(".tut_section_label")[0].innerHTML
                             ===actualnode_sectionlabel[0].innerHTML) ) {
                        console.log("IDENTICAL SECTION HEADER");
                        idx_view++;
                    } else {
                        console.log("SECTION HEADER NOT IDENTICAL OR NOT A SECTION HEADER AT ALL");
                        console.log("SIMPLY INSERTING A NEW SECTION HEADER");
                        // simply insert a new section header
                        $(dom_targets[idx_view]).before(expectednode.slideDown(1000));
            // not overly pretty (yet).
            // certainly broken in Safari.
            // Not tried other browsers yet.
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
                    var node = createTutEntryDOMNode(entry, prev_entry); /**CONTINUE**/
                    $(dom_targets[idx_view]).before(node);
                    idx_model++;
            prev_entry = entry;
                    continue;
                }

                console.log($(dom_targets[idx_view]).attr("id"));
                var domuid=decodeID($(dom_targets[idx_view]).attr("id"));
                if(domuid==entry.getUID()) {
                    console.log("IDENTICAL ENTRY");
                    // BUT we still update the time if this entry happens to be
                    // the template (SPECIAL CASE)
                    if(domuid=="entrytemplate") {
                        // copied code from createTutEntry() - @todo refactor out
                        var d=new Date(entry.getStarttimeUtcMs());
                        var t=timeStr(d);
                        $(dom_targets[idx_view]).find(".tut_starttime").html(t);
                    } else {
                        // ALSO, THE DATA DISPLAYED IN THIS ENTRY MIGHT BE OUTDATED
                        // (OLD REVISION).
                        if($(dom_targets[idx_view]).data("revision")!==entry.getRevision()) {
                            console.log("correct DOM entry in correct location, but outdated! replacing it with a more current version.");
                            var node=createTutEntryDOMNode(entry);
                            $(dom_targets[idx_view]).replaceWith(node);
                        }
                    }
                    idx_view++;
                    idx_model++;
                } else {
                    console.log("ENTRIES NOT IDENTICAL - SIMPLY INSERTING A NEW ONE BEFORE THE EXISTING ONE!");
                    var node=createTutEntryDOMNode(entry, prev_entry);
            prev_entry = entry;
                    $(dom_targets[idx_view]).before(node.slideDown(1000));  // not overly pretty (yet). certainly broken in Safari. Not tried other browsers yet.
                    idx_model++;
                }
            } else {
                // no more view modes to compare against - definitely simply add an entry!
                //console.log("NOT IMPLEMENTED C");
                console.log("APPENDING NODE TO END OF VIEW");
                var node=createTutEntryDOMNode(entry, prev_entry);
        prev_entry = entry;
                c.append(node);
                idx_model++;
            }
            //var node=createTutEntryNode(entry);
            //c.append(node);

            // What's still missing:
            // done - create remaining nodes when reached end of view
            // done - delete remaining view entries when reached end of model
            // ? - update node contents **if modified** (add modified flag to model?)
            //     why is this important: primarily for newly added entries from
            //     template: time field needs to be updated. Also in the template itself.
            //     although maybe we'll cheat when it comes to continuously updating the
            //     time in the template. seems like a lot of overhead to sync every
            //     second. although we can limit the syncing to "first few items"
            //     unless there is a date change (section headers!)...

            // next version: more intelligence when moving nodes, maybe based on
            // inside knowledge of timestamp
        }
        // grey out the top entry to visualize that it's only a template.
        // @todo maybe move this business logic to a more suitable place
        //var top_entry=$('#tut-entries-container .tut_entry:first');
        //console.log(top_entry);
        //top_entry.find('.tut_viewbox').addClass('tut_notyetvalid');
    };

    /** Will get called whenever a sync starts/finishes
      */
    v.syncProgressCallback=function(code,upstreamName) {
        console.info("syncProgressCallback",code,upstreamName);
        var indicator=$("#syncindicator");
        if(code===1) {
            indicator.show();
            indicator_start_time = new Date();
            // might also need to give the html engine time to actually render...
        }
        if(code===2) {
            // we delay the hiding a little, so the user actually gets to see the
            // syncing indicator
            var endtime=new Date();
            var timeDiff=endtime-indicator_start_time;
            var delay=0;  // assume we are already taking long enough, don't add any extra delay
            if(timeDiff<500)
            {
                delay = 500-timeDiff;  // ensure at least 500 ms delay between show() and hide()
            }
            //console.info(timeDiff, delay)
            window.setTimeout(function() { indicator.hide(); }, delay);
        }
    };

    // "Constructor" actions
    mymodel.registerSyncProgressListener(v.syncProgressCallback);

    return v;
};
