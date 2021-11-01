/* tut2 app */

'use strict';

var myview;
var mymodel;

(function() {

    $(document).ready(function(){

        console.debug("document.on_ready()");
        mymodel=tut2_createTutModel();
        myview=tut2_createDefaultView();

        // This is where we store the timeout handle of a scheduled update action
        var delayed_gui_update_handle;

        console.debug("model and view created");
        if(localStorage) {
            console.info("localStorage is available");
        }

        if(localStorage.tut_grill_entries) {
            console.info("localStorage has a tut_grill_entries entry");
            //mymodel.populateFromLocalStorage();
            //@todo we now sync with localStorage and no longer read it directly.
        } else {
            //mymodel.fillModelWithSomeExampleData();
            //mymodel.populateFromLocalStorage();
        }

        console.debug("mark B-2");

        // Delete all statically coded (demo-)entries
        // @future: there shouldn't be any in the final release template
        //var c=$('#tut-entries-container');
        //c.empty();

        // (Debug)-Functionality
        // @future: these should disappear from the final GUI, as all
        // this will happen automatically.
        $("#updategui").on('click',null,null,function() {
            myview.redrawTutEntriesUI(
                [mymodel.createTemplateEntry()]
                .concat(mymodel.getAllEntries()));
        });

        $("#syncwithlocalstorage").on('click',null,null,function() {
            console.info("starting sync with localStorage");
            var upstreamModel=tut2_createTutModel();
            upstreamModel.populateFromLocalStorage();
            mymodel.syncWithUpstream('localstorage',upstreamModel);
            // finally, store the localStorage-Model back to localStorage and be done with it.
            upstreamModel.saveToLocalStorage();
            //upstream.delete()
        });

        $("#syncwithserver").on('click',null,null,function() {
            console.info("starting sync with server");
            var upstreamStub=tut2_createServerModelStub();
            mymodel.syncWithUpstream('server',upstreamStub);
            // @todo we might want to trigger an immediate "sync with localStorage"?
            // need to define some strategy for deciding when to sync with whom.
        });

        // update entire UI every second. we'll see how well this works...
        // don't even mention race conditions... although i think there might
        // be *none* as javascript is "run to completion" (isn't it?).
        // this makes the browser eat up significant CPU power
        // (on my system: 30% compared to <10%) - but this is with
        // developer tools open. Drops to <10% with developer tools closed.
        // so we should probably optimise this away in a release version.
        // for each view, it is clear that, in general, we only need to
        // update the template timestamp and the duration of the first
        // entry. Except on boundaries (new "day" in configured timezone),
        // but we can code in those special cases.
        // Still, even our naive "always sync everything" approach works.
        setInterval(function(){
            myview.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        },10000000);

        //await tut2app_syncWithServer()
        //myview.redrawTutEntriesUI(...)

        // Ask model to tell us whenever it was updated, so that we can trigger
        // a sync with the server.
        // Maybe we should ask the view instead of the model? Since we're really
        // concerned with syncing with the server whenever the user modifies
        // data.
        var syncWithServer = async function() {
            var upstreamStub=tut2_createServerModelStub();
            await mymodel.syncWithUpstream('server',upstreamStub);
        }

        var syncWithServerAfterSettlingTime = function() {
            console.log("syncWithServerAfterSettlingTime()");
            if(delayed_gui_update_handle) {
                clearTimeout(delayed_gui_update_handle);
                console.log(" - extending existing delay");
            }
            delayed_gui_update_handle = setTimeout(syncWithServer, 3000);
        }

        mymodel.registerOnModelUpdatedCallback(syncWithServerAfterSettlingTime);
        //myview.registerUpdatedCallback(syncWithServerAfterSettlingTime);

        // Immediately (attempt to) sync with server for the first time,
        // and update GUI right afterwards.
        setTimeout(async function(){
            await syncWithServer();

            // 2. update GUI
            myview.redrawTutEntriesUI(
                [mymodel.createTemplateEntry()]
                .concat(mymodel.getAllEntries()));
        }, 0);
    });


})();
