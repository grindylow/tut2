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

    o.markAsDeleted=function() { _deleted=true;
                                _revision=_model.getNewRevNo();  // Indicate "modified" state
                               };
    o.isDeleted=function()     { return _deleted; };

    o.getStarttimeUtcMs=function() {
        return _starttime_utc_ms;
    };

    o.setStarttimeUtcMs=function(t) {   _starttime_utc_ms=t;
                                        _revision=_model.getNewRevNo();  // Indicate "modified" state
                                    };

    /* Various functions to help with interaction of user and entry on the main /track page */

    o.adjust_to_nth_next_interval=function(n) {
        // adjust to n-th step. 0 - no adjustment. Then 1-minute intervals, then 15-minute-intervals, then 60-minute-intervals

        // adjust (temporary) start time to nth multiple of alignment (in s) (based off of actual start time)
        // This temporarily adjusted start time will only become permanent after confirmation, which
        // is sent when the user releases the mouse button.
        // special case "n=0": keep original time

        console.log("adjust_to_nth_next_interval()", n);
        var direction = Math.sign(n);
        var offset = (direction>0)?0:1;
        n = Math.abs(n)
        var t = this.getStarttimeUtcMs();

        // (1) determine 1st time interval "away from" current time in the direction given by the sign of n,
        // (2) add n such time intervals
        // (3) store this as potential new start time
        if(n!=0) {
            {
                // first 5 steps are 1-minute steps
                var a = 60*1000;
                t = (Math.floor(t/a)+offset)*a;
                var ctr = 5;
                while(ctr>0 && n>0)
                {
                    t = t + direction*60*1000;
                    ctr--;
                    n--;
                }
                if(n>0) {
                    // next 5 steps are 15-minute steps
                    a = 15*60*1000;
                    t = (Math.floor(t/a)+offset)*a;
                    var ctr = 5;
                    while(ctr>0 && n>0)
                    {
                        t = t + direction*15*60*1000;
                        ctr--;
                        n--;
                    }
                    if(n>0) {
                        // all remaining steps are 60-minute steps
                        a = 60*60*1000;
                        t = (Math.floor(t/a)+offset)*a;
                        t = t + direction*60*60*1000*n;
                    }
                }
            }
        }

        // @todo make sure we don't exceed any of the adjacent entries' start time
        // if(t<this.getStarttimeUtcMs()) {
        //     if(undefined===this.prev_entry) {
        //         t = this.getStarttimeUtcMs();
        //     }
        //     else if(prev.entry.getStarttimeUtcMs() >= t) {
        //         t = prev.entry.getStarttimeUtcMs()+1;
        //     }
        // }
        // @todo same logic for "next_entry"

        console.log("adjusted time is", t);
        this._tentativeStarttimeMs = t;
    };

    o.finalise_drag_adjustment=function() {
        // Actually store the starttime that was adjusted tentatively with
        // adjust_to_nth_next_interval(). This happens when the user releases
        // the mouse button after dragging the starttime adjustment arrow.
        console.log("finalise_drag_adjustment()", this._tentativeStarttimeMs);
        _starttime_utc_ms=this._tentativeStarttimeMs;
        _revision=_model.getNewRevNo();  // Indicate "modified" state
        _model.notifyListenersOfModelChanges();
    }


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
            "deleted":_deleted,
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
                 'deleted':_deleted,
                 'revision':_revision };
    };
    // Note: unpickle by passing the dict into tut2_createTutEntry().

    var _starttime_utc_ms=-3;
    var _uid=generateUUID();
    var _logentry='newly created logentry by TutEntry constructor';
    var _project='newly created project by TutEntry constructor';
    var _model=model; // revision numbers will be generated via callback to owning model
    var _revision=-1;
    var _deleted=false;

    // data below are not persisted
    var _tentativeStarttimeMs=-4;  // used during dragging of starttime

    if(params.hasOwnProperty("logentry")) { _logentry=params.logentry; }
    if(params.hasOwnProperty("project"))  { _project=params.project; }
    if(params.hasOwnProperty("deleted"))  { _deleted=params.deleted; }
    if(params.hasOwnProperty("starttime_utc_ms"))  { _starttime_utc_ms=params.starttime_utc_ms; }
    if(params.hasOwnProperty("uid"))      { _uid=params.uid; }  /* somewhat problematic? only used by createTemplateEntry(). */
    if(params.hasOwnProperty("revision")) { _revision=params.revision; } else { _revision=model.getNewRevNo(); }

    console.log("LogEntry constructor done.",params);
    return o;
};
