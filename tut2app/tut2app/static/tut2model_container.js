/* tut2 container

   the model of the container, containing all tut entries
*/

'use strict';

// The TutModel maintains the list of all Log Entries, together with
// the necessary housekeeping data to support syncing.
function tut2_createTutModel(params) {
    var o = {};

    /* private variables and member functions */
    var datastore = [];
    var _globalRevNo = 200;  // just so not everything starts with 1!
    var _syncProgressListeners = [];
    var _myOnModelUpdatedCallback = undefined;

    // Stores revision numbers for all entries for all upstream repositories
    // also remembers what revision numbers were current when we last synced.
    // Any local revision numbers > ourLatestRevAfterLastSync mark entries that
    // have been modified since the last sync (and thus need to be sent upstream).
    //   -- UPDATE: there should no longer be any need for this variable,
    //      we can determine "modified" state directly from the "last synced rev"
    //      array.
    //
    // Any remote (upstream) revisions > latestRevWeHaveFromThem are updated
    // entries at the upstream end and need to be integrated into our "working
    // copy".
    var syncState = {};

    var sortMyEntriesByStarttime = function () {
        datastore.sort(function (a, b) {
            if (a.getStarttimeUtcMs() < b.getStarttimeUtcMs()) {
                return 1;
            } else if (a.getStarttimeUtcMs() > b.getStarttimeUtcMs()) {
                return -1;
            }
            // identical timestamps, try to decide by project name
            if (a.getProject() < b.getProject()) {
                return 1;
            } else if (a.getProject() > b.getProject()) {
                return -1;
            }
            // project also identical, try to decide by logentry
            if (a.getLogentry() < b.getLogentry()) {
                return 1;
            } else if (a.getLogentry() > b.getLogentry()) {
                return -1;
            }
            // as a last straw, compare UIDs
            if (a.getUID() < b.getUID()) {
                return 1;
            } else if (a.getUID() > b.getUID()) {
                return -1;
            }
            return 0;  // both entries are equal, "should never happen"
        });
    };

    // Invoke all registered callback functions for the "sync progress" event.
    var notifyListenersOfSyncProgress = function (code, upstreamName) {
        _syncProgressListeners.forEach(function (f) {
            f(code, upstreamName);
        });
    };


    /* public member functions */

    /** Register a callback that will get called whenever modifications to
     * the model have been made.
     * Useful for automatically syncing changes in a timely manner.
     * Currently, only one such callback is supported.
     */
    o.registerOnModelUpdatedCallback = function (cb) {
        _myOnModelUpdatedCallback = cb;
    }

    /** Let interested parties know that some aspect of the model has just
     * changed - giving them the chance to react to such a change in a timely
     * manner, e.g. by syncing them to an upstream repository.
     *
     * Public, because it also needs to be called by tut2model_tutentries.
     */
    o.notifyListenersOfModelChanges = function () {
        if (_myOnModelUpdatedCallback) {
            // schedule an immediate call to the callback
            setTimeout(_myOnModelUpdatedCallback, 0);
        }
    }

    /* This is a special entry that only ever exists in the view.
       The user enters a new task into that entry (which will turn the
       entry into a "regular" log entry).
       @todo Move this to view?
    */
    o.createTemplateEntry = function () {
        return tut2_createTutEntry(o, {
            "uid": "entrytemplate",
            "starttime_utc_ms": Date.now(),   // was: now,
            "project": "enter project",
            "logentry": "enter log entry (task description)"
        });
    };

    o.DEBUG_setGlobalRevNo = function (n) {
        _globalRevNo = n;
    };


    /** Add a listener for sync events.
     *  Signature of the callback: f(code,upstreamName)
     *    code=1: sync started
     *    code=2: sync completed successfully
     */
    o.registerSyncProgressListener = function (f) {
        _syncProgressListeners.push(f);
    };

    // Has the local entry been modified since it was last
    // synced to the given upstream repository?
    // The reply is also "true" if the entry in question has
    // never been synced before.
    o.hasUnsyncedModifications = function (entry, upstreamname) {
        if (syncState[upstreamname].ourLatestSyncedRevisions[entry.getUID()] === undefined) {
            return true;   // this entry has never been synced before!
        }
        if (entry.getRevision() > syncState[upstreamname].ourLatestSyncedRevisions[entry.getUID()]) {
            return true;
        }
        return false;
    }

    // Return a monotonically increasing number
    o.getNewRevNo = function () {
        _globalRevNo++;
        return _globalRevNo;
    }

    o.addEntry = function (entry) {
        // for now, we always add the new entry to the beginning
        // of the list, assuming it is the most recent one.
        datastore = [entry].concat(datastore);
        o.notifyListenersOfModelChanges();
        //saveToLocalStorage();
    };

    /** Delete an entry. The entry doesn't actually get wiped from memory
     *  (since this would cause syncing issues), but marked as "deleted".
     *  This marker will get propagated during syncing just like any other
     *  attribute.
     */
    o.deleteEntry = function (uid) {
        for (var i = 0; i < datastore.length; i++) {
            if (datastore[i].getUID() == uid) {
                console.log("found culprit for deleteEntry");
                datastore[i].markAsDeleted();
                o.notifyListenersOfModelChanges();
                return;
            }
        }
        console.error("CANNOT FIND ENTRY WITH UID " + uid + " IN MODEL");
    };

    o.updateEntry = function (entry) {
        console.log("updateEntry(%s)", entry);
        var found = false;
        for (var i = 0; i < datastore.length; i++) {
            if (datastore[i].getUID() == entry.getUID()) {
                console.log("found culprit for updateentry");
                datastore[i] = entry;
                o.notifyListenersOfModelChanges();
                found = true;
                break;
            }
        }
        if (!found) {
            console.err("updateEntry() called with unknown entry");
        }
        //saveToLocalStorage();
    };

    // append a new entry (if the entry doesn't exist already)
    // or update an existing entry (if we have a copy of that entry already).
    // Either way we will create a clone of the passed-in entry so that
    // we have our own copy.
    // Return new revision number
    o.addOrUpdateEntry = function (entry) {
        var found = false;
        var e = entry.clone(o);
        for (var i = 0; i < datastore.length; i++) {
            if (datastore[i].getUID() == entry.getUID()) {
                console.log("found culprit for addOrUpdateEntry");
                datastore[i] = e;
                o.notifyListenersOfModelChanges();
                found = true;
                break;
            }
        }
        if (!found) {
            o.addEntry(e);  // will notifyListenersOfModelChanges() implicitly
        }
        return e.getRevision();
    };

    o.getEntryByUID = function (uid) {
        //console.log("model.getEntryByUID("+uid+")");
        //console.log(datastore.length);
        for (var i = 0; i < datastore.length; i++) {
            //console.log(datastore[i].getUID());
            if (datastore[i].getUID() == uid) {
                //console.log("found culprit for getEntryByUID");
                return datastore[i];
            }
        }
        console.log("CANNOT FIND ENTRY WITH UID " + uid + " IN MODEL");
    };

    // return all Entries in descending start time order
    o.getAllEntries = function () {
        sortMyEntriesByStarttime();
        return datastore;
    };

    // The following two are only in here, because this object doubles up as a
    // representative for the localStorage "upstream" repo.
    // Our regular model should only ever sync to upstream, never store to local
    // storage directly.
    o.saveToLocalStorage = function () {
        console.error("should no longer saveToLocalStorage");
        var intermediate = [];
        datastore.forEach(function (entry) {
            intermediate.push(entry.pickleToDict());
        });
        localStorage.tut_grill_entries = JSON.stringify(intermediate);
        localStorage.tut_grill_revno = JSON.stringify(_globalRevNo);
    };

    o.populateFromLocalStorage = function () {
        console.log("populateFromLocalStorage()");
        var intermediate = [];
        if (localStorage.tut_grill_entries) {
            intermediate = JSON.parse(localStorage.tut_grill_entries);
            _globalRevNo = JSON.parse(localStorage.tut_grill_revno);
        }
        datastore = [];
        var s = datastore; // @todo remove?
        intermediate.forEach(function (dict) {
            s.push(tut2_createTutEntry(o, dict));
        });
    };

    // return all elements that have a global revision number >= fromRev
    // updated version for async support: call a callback when the data is ready,
    // don't return anything
    o.queryEntries = function (fromRev, callback) {
        var resultSet = [];
        datastore.forEach(function (e) {
            if (e.getRevision() >= fromRev)
                resultSet.push(e);
        });
        callback(resultSet);
    };

    /** If we have never synced with the given upstream repository before,
     *  make sure our sync state structure contains sensible information.
     */
    o.initialiseSyncStateIfEmpty = function (upstreamName) {
        if (!syncState.hasOwnProperty(upstreamName)) {
            console.log("initialiseSyncStateIfEmpty() is initialising syncState for:", upstreamName);
            syncState[upstreamName] = {
                'latestRevWeHaveFromThem': -1,
                'ourLatestRevAfterLastSync': -1,
                'latestUpstreamRevisionsWeHaveFromThem': {},
                'ourLatestSyncedRevisions': {}
            }
        }
    };

    // algorithm (A)
    // part 1: update local "working copy"
    var sync_algA_pt1__update_local_working_copy = async function (upstreamName, upstreamStub) {
        console.info('SYNC ALG A PART 1');
        console.debug('syncState', JSON.stringify(syncState));
        console.debug('syncState', syncState);
        var newEntries = await upstreamStub.queryEntries(syncState[upstreamName].latestRevWeHaveFromThem + 1)   // @todo limit this query by (entry) timestamp

        // success
        await sync_algA_pt1a__integrate_new_entries(upstreamName, newEntries);
        console.info('SYNC ALG A PART 1 DONE');

        // trigger next part of the syncing algorithm - now done in caller
        //sync_algA_pt2(upstreamName, upstreamStub);

        //e => {
        //   // failed
        //    console.warn('SYNC ALG A PART 1 FAILED AT SOME STAGE', e);
        //}
    };

    // algorithm (A)
    // part 1a: integrate the received new entries into the local "working copy" = model
    var sync_algA_pt1a__integrate_new_entries = function (upstreamName, newEntries) {
        newEntries.forEach(function (upstreamEntry) {
            console.log('integrating entry:', upstreamEntry.dump());
            if (syncState[upstreamName].latestRevWeHaveFromThem < upstreamEntry.getRevision()) {
                syncState[upstreamName].latestRevWeHaveFromThem = upstreamEntry.getRevision();
            }  // ensures that we know about the max revision number when we have processed all entries

            // special case: we have already synced that revision. nothing to do.
            // This happens on the first sync after we have uploaded a new entry to upstream:
            // The new entry has a higher revision number than "latestRevWeHaveFromThem", therefore
            // it gets transferred again.
            if (syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[upstreamEntry.getUID()] === upstreamEntry.getRevision()) {
                console.log("- integration cut short - we already have this remote revision!");
                return;  // nothing to do - proceed to next entry
            }

            var localEntry = o.getEntryByUID(upstreamEntry.getUID());
            if (localEntry === undefined) {
                // (a) No such entry at this end. Add.
                var e = upstreamEntry.clone(o);  // this will also give it a (local) revision number
                o.addEntry(e);
                syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()] = e.getRevision();
                syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()] = upstreamEntry.getRevision();
                // ...we're in sync!
                console.log('case a: added the previously non-existing entry', e.dump());
            }
            else if (!o.hasUnsyncedModifications(localEntry, upstreamName)) {
                // (b) We have such an entry, but ours is older (and locally
                // unmodified since last sync). Overwrite.
                var e = upstreamEntry.clone(o);
                //e.setRevision(0); // 0 indicates "unchanged since last sync"
                o.updateEntry(e);
                syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()] = e.getRevision();
                syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()] = upstreamEntry.getRevision();
                console.log('case b: updated our outdated entry', e.dump());
            }
            else {
                // (c) Both versions have changed. Merge.
                localEntry.setLogentry('MERGED: upstream: ' + upstreamEntry.getLogentry() + ' local:' + localEntry.getLogentry());
                // @todo merge all fields, only highlight the ones that are actually different
                localEntry.markAsModified();  // DOES THIS ACTUALLY EXIST??? Should assign new revision number
                o.updateEntry(localEntry);
                console.log('case c: merged (modified) local entry with (modified) upstream entry - resulting in this entry:', e.dump());
            }
        }); // end-of-foreach
    };

    // algorithm (A)
    // part 2: commit local modifications upstream
    // new version: async (@todo):
    //   - get all entries (store their UIDs on a stack)
    //   - then process them one by one, proceeding to the next item when the previous
    //     one has been done. terminates when stack is empty. might process in batches
    //     (instead of single items).
    //  ## CONTINUE HERE ##
    var sync_algA_pt2 = async function (upstreamName, upstreamStub) {
        console.info('SYNC ALG A PART 2');
        console.log('syncState', JSON.stringify(syncState));
        console.log('syncState', syncState);
        var newLatestRevAfterLastSync = syncState[upstreamName].ourLatestRevAfterLastSync;
        //o.getAllEntries().forEach(async function(e) {
        for (const e of o.getAllEntries()) {
            console.log('local revision:', e.getRevision(),
                'latest sync happend at local rev', syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()],
                'our latest rev after last sync:', syncState[upstreamName].ourLatestRevAfterLastSync);
            if (o.hasUnsyncedModifications(e, upstreamName)) {
                // add this entry to upstream
                let rev = await upstreamStub.addOrUpdateEntry(e);
                console.log('...was added to upstream with revision number %s.', rev);
                if (rev) {
                    syncState[upstreamName].latestUpstreamRevisionsWeHaveFromThem[e.getUID()] = rev;
                    // take note of the (local) revision number we synced
                    syncState[upstreamName].ourLatestSyncedRevisions[e.getUID()] = e.getRevision();
                    // remember the highest (local) revision number we ever synced
                    // /deleted/
                } else {
                    console.warn('Apparently we failed to sync this item this time around.');
                }
            } else {
                console.log(" - has no unsynced modifications. skipping.");
            }
            if (newLatestRevAfterLastSync < e.getRevision()) {
                newLatestRevAfterLastSync = e.getRevision();
                console.debug('New latest rev after last sync: %s', newLatestRevAfterLastSync);
            }
        }
        syncState[upstreamName].ourLatestRevAfterLastSync = newLatestRevAfterLastSync;
        console.log('sync state:', syncState);
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
    o.syncWithUpstream = async function (upstreamName, upstreamStub) {
        // We try to implement the "alternative sync" method as described in
        // SYNC_DESCRIPTION.

        notifyListenersOfSyncProgress(1, upstreamName); // 1=sync started
        o.initialiseSyncStateIfEmpty(upstreamName);

        try {
            await sync_algA_pt1__update_local_working_copy(upstreamName, upstreamStub);
            // will start of the syncing, and call subsequent parts automatically as required
            // actual syncing *may* happen in the background (e.g. waiting for AJAX communications etc),
            // so this function *might* return quite quickly, which doesn't necessary mean that
            // the syncing has completed.
            // note: syncing with "localStorage" always happens synchronously.

            // @todo ADD AN ARTIFICIAL DELAY HERE SO WE CAN TEST
            // DISABLING THE SERVER IN THE MEANTIME
            // [...]

            await sync_algA_pt2(upstreamName, upstreamStub);
        } catch (error) {
            alert("Caught an error: " + error);
        }

        notifyListenersOfSyncProgress(2, upstreamName); // 2=sync completed successfully
    };

    o.fillModelWithSomeExampleData = function () {
        console.log("fillModelWithSomeExampleData()");
        o.DEBUG_setGlobalRevNo(100);
        o.addEntry(tut2_createTutEntry(o, { 'project': 'Example Project 1', 'starttime_utc_ms': 12345678 }));
        o.addEntry(tut2_createTutEntry(o, { 'project': 'Another Example Project', 'logentry': 'An example log entry', 'starttime_utc_ms': 12345679 }));
    };

    o.that = o;

    return o;
};
