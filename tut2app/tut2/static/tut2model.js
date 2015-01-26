/* tut2 

   the model
*/

'use strict';

// A TutEntry is one entry in the list of log entries. It stores
// information about this particular logged piece of work such
// as project and start time.
// It also handles internal details such as marking itself as
// modified/pristine. 
// A TutEntry is part of the Tut data model.
function tut2_createTutEntry(params) {
    var o={};

    /* private variables and member functions */
    var generateUUID=function() {
        // from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    };    

    /* public member functions */
    o.getUID=function() {
        return _uid;
    };

    o.getProject=function()  { return _project;       };
    o.setProject=function(t) { _project=t;            };

    o.getLogentry=function()  { return _logentry;     };
    o.setLogentry=function(t) { _logentry=t;          };

    o.getStarttimeUtcMs=function() {
        return _starttime_utc_ms;
    };

    o.setStarttimeUtcMs=function(t) {
        _starttime_utc_ms=t;
    };

    o.clone=function() {
        return tut2_createTutEntry( { 
            "starttime_utc_ms":_starttime_utc_ms,
            "logentry":_logentry,
            "project":_project
        });
    };

    // Store as simple object that can be encoded as JSON
    o.pickleToDict=function() {
        return { 'project':_project,
                 'logentry':_logentry,
                 'starttime_utc_ms':_starttime_utc_ms,
                 'uid':_uid };
    };
    // Note: unpickle by passing the dict into tut2_createTutEntry().

    var _starttime_utc_ms=-3;
    var _uid=generateUUID();
    var _logentry='newly created logentry by TutEntry constructor';
    var _project='newly created project by TutEntry constructor';

    if(params.hasOwnProperty("logentry")) { _logentry=params.logentry; }
    if(params.hasOwnProperty("project"))  { _project=params.project; }
    if(params.hasOwnProperty("starttime_utc_ms"))  { _starttime_utc_ms=params.starttime_utc_ms; }
    if(params.hasOwnProperty("uid"))      { _uid=params.uid; }  /* somewhat problematic? only used by createTemplateEntry(). */
 
    console.log("LogEntry constructor done.",o);
    return o;
};

function tut2_createTutModel(params)
{
    var o={};

    /* private variables and member functions */
    var datastore=[];

    var saveToLocalStorage=function() {
        var intermediate=[];
        datastore.forEach(function(entry) {
            intermediate.push(entry.pickleToDict());
        });
        localStorage.tut_grill_entries=JSON.stringify(intermediate);
    };

    var sortMyEntriesByStarttime=function() {
        datastore.sort(function(a,b){
            if(a.getStarttimeUtcMs()<b.getStarttimeUtcMs()) {
                return 1;
            } else if(a.getStarttimeUtcMs()>b.getStarttimeUtcMs()) {
                return -1;
            }
            return 0; // both entries are equal
        });
    };

    /* public member functions */

    /* This is a special entry that only ever exists in the view. 
       The user enters a new task into that entry (which will turn the
       entry into a "regular" log entry).
       @todo Move this to view?
    */
    o.createTemplateEntry=function() {
        return tut2_createTutEntry(    { "uid":"entrytemplate",
                                         "starttime_utc_ms":Date.now(),   // was: now,
                                         "project":"enter project", 
                                         "logentry":"enter log entry (task description)"
                                        } );
    };

    o.addEntry=function(entry) { 
        // for now, we always add the new entry to the beginning
        // of the list, assuming it is the most recent one.
        datastore=[entry].concat(datastore);
        saveToLocalStorage();
    };

    o.deleteEntry=function(uid) { 
        for(var i=0;i<datastore.length;i++) {
            if(datastore[i].getUID()==uid) {
                console.log("found culprit for deleteEntry");
                datastore.splice(i,1); // remove 1 element at index i
                saveToLocalStorage();
                return;
            }
        }
        console.log("CANNOT FIND ENTRY WITH UID "+uid+" IN MODEL");
    };

    o.updateEntry=function(entry) {
        console.err("calling updateEntry() is no longer necessary");
        for(var i=0;i<datastore.length;i++) {
            if(datastore[i].getUID()==entry.getUID()) {
                console.log("found culprit for updateentry");
                datastore[i]=entry;
                break;
            }
        }
        saveToLocalStorage();
    };

    o.getEntryByUID=function(uid) {
        console.log("model.getEntryByUID("+uid+")");
        console.log(datastore.length);
        for(var i=0;i<datastore.length;i++) {
            console.log(datastore[i].getUID());
            if(datastore[i].getUID()==uid) {
                console.log("found culprit for getEntryByUID");
                return datastore[i];
            }
        }
        console.log("CANNOT FIND ENTRY WITH UID "+uid+" IN MODEL");
    };

    // return all Entries in descending start time order
    o.getAllEntries=function() {
        sortMyEntriesByStarttime();
        return datastore;
    };

    o.readFromLocalStorage=function() {
        var intermediate=[];
        intermediate=JSON.parse(localStorage.tut_grill_entries);
        datastore=[];
        var s=datastore; // @todo remove?
        intermediate.forEach(function(dict) {
            s.push(tut2_createTutEntry(dict));
        });
    };

    // See what changes need to be made to myself so as to bring
    // me in sync with whatever is stored in local storage.
    o.updateFromLocalStorage=function() {
        // Details of the cases to consider see SYNC_DESCRIPTION.
        var intermediate=[];
        intermediate=JSON.parse(localStorage.tut_grill_entries);
        
        // (1.1) copy new entries to remote
        // new entries are identified by the special remote revision "0" (really? maybe not)
        datastore.forEach(function(entry) {
            if(!intermediate.hasEntry(entry.getUID())) {
                intermediate.push(entry);
            }
        });

        // (1.2) copy new elements from remote
        intermediate.forEach(function(entry) {
            if(!datastore.hasEntry(entry.getUID())) {
                datastore.push(entry);
            }
        });

        // we leave the hard case (1.3) until later...
    };

    o.fillModelWithSomeExampleData=function() {
        o.addEntry( tut2_createTutEntry( {'project':'Example Project 1', 'starttime_utc_ms':12345678}) );
        o.addEntry( tut2_createTutEntry( {'project':'Another Example Project', 'logentry':'An example log entry', 'starttime_utc_ms':12345679}) );
    };

    return o;
};

var mymodel=tut2_createTutModel();
