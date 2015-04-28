/* tut2 tutentry

   the model (one single time entry)

*/

'use strict';

// A TutEntry is one entry in the list of log entries. It stores
// information about this particular logged piece of work such
// as project and start time.
// It also handles internal details such as marking itself as
// modified/pristine. 
// A TutEntry is part of the Tut data model.
// Each TutEntry knows about the model it is contained in, so it can
// ask the Model for a new revision number whenever it needs one.
function tut2_createTutEntry(model,params) {
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
    o.getUID=function()    { return _uid;  };
    o.setUID=function(uid) { _uid=uid;     };

    o.getRevision=function()  { return _revision;     };
    o.setRevision=function(r) { _revision=r;          };

    o.getProject=function()  { return _project;       };
    o.setProject=function(t) { _project=t;
                               _revision=_model.getNewRevNo();  // Indicate "modified" state
                             };

    o.getLogentry=function()  { return _logentry;     };
    o.setLogentry=function(t) { _logentry=t;          
                                _revision=_model.getNewRevNo();  // Indicate "modified" state
                              };

    o.getStarttimeUtcMs=function() {
        return _starttime_utc_ms;
    };

    o.setStarttimeUtcMs=function(t) {
        _starttime_utc_ms=t;
    };

    // return a loggable representation of this entry
    o.dump=function() {
        return o.pickleToDict();
    }

    // create a copy of this entry, with its own distinct UID
    o.createDuplicate=function(model) {
        var m=model || _model;  // use own model if no model passed in
        return tut2_createTutEntry( m, 
        { 
            "starttime_utc_ms":_starttime_utc_ms,
            "logentry":_logentry,
            "project":_project,
            "revision":m.getNewRevNo()
        });
    };

    // an exact clone of the entry, with identical UID, but possibly belonging
    // to another model
    o.clone=function(model) {
        var c=o.createDuplicate(model);
        c.setUID(_uid);
        return c;
    }

    // Store as simple object that can be encoded as JSON
    o.pickleToDict=function() {
        return { 'project':_project,
                 'logentry':_logentry,
                 'starttime_utc_ms':_starttime_utc_ms,
                 'uid':_uid,
                 'revision':_revision };
    };
    // Note: unpickle by passing the dict into tut2_createTutEntry().

    var _starttime_utc_ms=-3;
    var _uid=generateUUID();
    var _logentry='newly created logentry by TutEntry constructor';
    var _project='newly created project by TutEntry constructor';
    var _model=model; // revision numbers will be generated via callback to owning model
    var _revision=-1; 

    if(params.hasOwnProperty("logentry")) { _logentry=params.logentry; }
    if(params.hasOwnProperty("project"))  { _project=params.project; }
    if(params.hasOwnProperty("starttime_utc_ms"))  { _starttime_utc_ms=params.starttime_utc_ms; }
    if(params.hasOwnProperty("uid"))      { _uid=params.uid; }  /* somewhat problematic? only used by createTemplateEntry(). */
    if(params.hasOwnProperty("revision")) { _revision=params.revision; } else { _revision=model.getNewRevNo(); }
 
    console.log("LogEntry constructor done.",params);
    return o;
};
