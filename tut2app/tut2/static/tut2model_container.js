/* tut2 container

   the model of the container, containing all tut entries
*/

'use strict';

// The TutModel maintains the list of all Log Entries, together with
// the necessary housekeeping data to support syncing.
function tut2_createTutModel(params)
{
    var o={};

    /* private variables and member functions */
    var datastore=[];
    var _globalRevNo=200;  // just so not everything starts with 1!

    // Stores revision numbers for all entries for all upstream repositories
    // also remembers what revision numbers were current when we last synced.
    // Any local revision numbers > ourLatestRevAfterLastSync mark entries that
    // have been modified since the last sync (and thus need to be sent upstream).
    // Any remote (upstream) revisions > latestRevWeHaveFromThem are updated
    // entries at the upstream end and need to be integrated into our "working 
    // copy".
    var syncState={};

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
        return tut2_createTutEntry( o, { "uid":"entrytemplate",
                                         "starttime_utc_ms":Date.now(),   // was: now,
                                         "project":"enter project", 
                                         "logentry":"enter log entry (task description)"
                                        } );
    };

    o.DEBUG_setGlobalRevNo=function(n) {
        _globalRevNo=n;
    };

    // Has the local entry been modified since it was last
    // synced to the given upstream repository?
    // The reply is also "true" if the entry in question has
    // never been synced before.
    o.hasUnsyncedModifications=function(entry,upstreamname) {
        if(syncState[upstreamname].ourLatestSyncedRevisions[entry.getUID()]===undefined) {
            return true;   // this entry has never been synced before!
        }
        if(entry.getRevision()>syncState[upstreamname].ourLatestSyncedRevisions[entry.getUID()]) {
            return true;
        }
        return false;
    }

    // Return a monotonically increasing number
    o.getNewRevNo=function() {
        _globalRevNo++;
        return _globalRevNo;
    }

    o.addEntry=function(entry) { 
        // for now, we always add the new entry to the beginning
        // of the list, assuming it is the most recent one.
        datastore=[entry].concat(datastore);
        //saveToLocalStorage();
    };

    /** Delete an entry. The entry doesn't actually get wiped from memory
     *  (since this would cause syncing issues), but marked as "deleted".
     *  This marker will get propagated during syncing just like any other
     *  attribute.
     */
    o.deleteEntry=function(uid) { 
        for(var i=0;i<datastore.length;i++) {
            if(datastore[i].getUID()==uid) {
                console.log("found culprit for deleteEntry");
                datastore[i].markAsDeleted();
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
        console.err("updateEntry() called with unknown entry");
        //saveToLocalStorage();
    };

    // append a new entry (if the entry doesn't exist already) 
    // or update an existing entry (if we have a copy of that entry already).
    // Either way we will create a clone of the passed-in entry so that
    // we have our own copy.
    // Return new revision number
    o.addOrUpdateEntry=function(entry) {
        var found=false;
        var e=entry.clone(o);
        for(var i=0;i<datastore.length;i++) {
            if(datastore[i].getUID()==entry.getUID()) {
                console.log("found culprit for addOrUpdateEntry");
                datastore[i]=e;
                found=true;
                break;
            }
        }
        if(!found) {
            o.addEntry(e);
        }
        return e.getRevision();
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

    // The following two are only in here, because this object doubles up as a 
    // representative for the localStorage "upstream" repo.
    // Our regular model should only ever sync to upstream, never store to local
    // storage directly.
    o.saveToLocalStorage=function() {
        console.err("should no longer saveToLocalStorage");
        var intermediate=[];
        datastore.forEach(function(entry) {
            intermediate.push(entry.pickleToDict());
        });
        localStorage.tut_grill_entries=JSON.stringify(intermediate);
        localStorage.tut_grill_revno=JSON.stringify(_globalRevNo);
    };

    o.populateFromLocalStorage=function() {
        console.log("populateFromLocalStorage()");
        var intermediate=[];
        if(localStorage.tut_grill_entries) {
            intermediate=JSON.parse(localStorage.tut_grill_entries);
            _globalRevNo=JSON.parse(localStorage.tut_grill_revno);
        }
        datastore=[];
        var s=datastore; // @todo remove?
        intermediate.forEach(function(dict) {
            s.push(tut2_createTutEntry(o,dict));
        });
    };

    // return all elements that have a global revision number >= fromRev
    o.queryEntries=function(fromRev) {
        var resultSet=[];
        datastore.forEach(function(e) {
            if(e.getRevision()>=fromRev)
                resultSet.push(e);
        });
        return resultSet;
    };

    /** If we have never synced with the given upstream repository before,
     *  make sure our sync state structure contains sensible information.
     */
    o.initialiseSyncStateIfEmpty=function(upstreamName) {
        if(!syncState.hasOwnProperty(upstreamName)) {
            console.log("initialiseSyncStateIfEmpty() is initialising syncState for:",upstreamName);
            syncState['localstorage'] = { 'latestRevWeHaveFromThem':0,
                                          'ourLatestRevAfterLastSync':0,
                                          'latestUpstreamRevisionsWeHaveFromThem':{},
                                          'ourLatestSyncedRevisions':{}
                                        }
        }
    };

    // Sync with the given upstream "repository", following the algorithm described
    // in SYNC_DESCRIPTION. Sync state information is maintained in our (private) 
    // syncState variable, for each upstream repository.
    //  @param upstreamName    A string that uniquely identifies this particular
    //                         upstream repository. Used internally as an index
    //                         into the syncState array.
    //  @param upstreamStub    The interface to the upstream repository. It must support
    //                         all methods required for syncing, and forward the information
    //                         on to the underlying repository as required.
    //                         Currently, two distinct such implementations exist:
    //                          - a model that populates itself from localStorage (and 
    //                            can store itself back to localStorage), used for syncing
    //                            between browser windows/tabs and for "offline" functionality.
    //                          - a model that talks to the server database, used for
    //                            permanent storage.

    // See what changes need to be made to myself so as to bring
    // me in sync with whatever is stored in local storage.
    o.syncWithUpstream=function(upstreamName,upstreamStub) {
        // We try to implement the "alternative sync" method as described in
        // SYNC_DESCRIPTION.

        o.initialiseSyncStateIfEmpty(upstreamName);

        // algorithm (A)
        // part 1: update local "working copy"
        console.log('syncState',JSON.stringify(syncState));
        console.info('sync part 1');
        var newEntries=upstreamStub.queryEntries(syncState[upstreamName].latestRevWeHaveFromThem+1);
                   // @todo limit this query by (entry) timestamp
        newEntries.forEach(function(upstreamEntry) {
            console.log('integrating entry:',upstreamEntry.dump());
            if(syncState[upstreamName].latestRevWeHaveFromThem<upstreamEntry.getRevision()) {
                syncState[upstreamName].latestRevWeHaveFromThem=upstreamEntry.getRevision();
            }  // ensures that we know about the max revision number when we have processed all entries
            // special case: we have already synced that revision. nothing to do.
            if(syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[upstreamEntry.getUID()]===upstreamEntry.getRevision()) {
                console.log("- integration cut short - we already have this remote revision!");
                return;  // nothing to do - proceed to next entry
            }
            var localEntry=o.getEntryByUID(upstreamEntry.getUID());
            if(localEntry===undefined) {
                // (a) No such entry at this end. Add.
                var e=upstreamEntry.clone(o);  // this will also give it a (local) revision number
                o.addEntry(e);
                syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()]=e.getRevision(); 
                syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()]=upstreamEntry.getRevision(); 
                  // ...we're in sync!
                console.log('added the previously non-existing entry',e.dump());
            } else {
                if(!o.hasUnsyncedModifications(localEntry,upstreamName)) {
                    // (b) We have such an entry, but ours is older (and locally 
                    // unmodified since last sync). Overwrite.
                    var e=upstreamEntry.clone(o);
                    //e.setRevision(0); // 0 indicates "unchanged since last sync"
                    o.updateEntry(e);
                    syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()]=e.getRevision();
                    syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()]=upstreamEntry.getRevision();
                    console.log('updated our outdated entry',e.dump());
                } else {
                    // (c) Both versions have changed. Merge.
                    localEntry.setLogentry('MERGED: upstream: '+upstreamEntry.getLogentry()+' local:'+localEntry.getLogentry());
                    // @todo merge all fields, only highlight the ones that are actually different
                    localEntry.markAsModified();
                    o.updateEntry(localEntry);
                }
            }
        });

        // part 2: commit local modifications upstream
        console.info('sync part 2');
        console.log('syncState',JSON.stringify(syncState));
        var newLatestRevAfterLastSync=syncState[upstreamName].ourLatestRevAfterLastSync;
        o.getAllEntries().forEach(function(e) {
            console.log('local revision:',e.getRevision(),'latest sync happend at local rev',syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()],'our latest rev after last sync:',syncState[upstreamName].ourLatestRevAfterLastSync);
            if(o.hasUnsyncedModifications(e,upstreamName)) {
                // add this entry to upstream
                syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()]=upstreamStub.addOrUpdateEntry(e);
                // take note of the (local) revision number we synced
                syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()]=e.getRevision();
                // remember the highest (local) revision number we ever synced
                if(newLatestRevAfterLastSync<e.getRevision()) {
                    newLatestRevAfterLastSync=e.getRevision();
                }
                // @todo (?) remember the highest upstream revision number we ever synced
            } else {
                console.log(" - has no unsynced modifications. skipping.");
            }
        });
        syncState[upstreamName].ourLatestRevAfterLastSync=newLatestRevAfterLastSync;
        console.log('sync state:',syncState);
    };

    o.fillModelWithSomeExampleData=function() {
        console.log("fillModelWithSomeExampleData()");
        o.DEBUG_setGlobalRevNo(100);
        o.addEntry( tut2_createTutEntry( o, {'project':'Example Project 1', 'starttime_utc_ms':12345678}) );
        o.addEntry( tut2_createTutEntry( o, {'project':'Another Example Project', 'logentry':'An example log entry', 'starttime_utc_ms':12345679}) );
    };

    o.that=o;

    return o;
};
