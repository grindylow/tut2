/* tut2 app */

'use strict';

var myview;
var mymodel;

(function() {

    $(document).ready(function(){

        console.info("mark B-0");
        mymodel=tut2_createTutModel();
        myview=tut2_createDefaultView();

        console.info("mark B-1");
        if(localStorage) {
            console.log("localStorage exists");
        }

        if(localStorage.tut_grill_entries) {
            console.log("localStorage has a tut_grill_entries entry");
            //mymodel.populateFromLocalStorage();
            //@todo we now sync with localStorage and no longer read it directly.
        } else {
            mymodel.fillModelWithSomeExampleData();
            //mymodel.populateFromLocalStorage();
        }
     
        console.info("mark B-2");
        // remove this again in the end
        var c=$('#tut-entries-container');
        c.empty();

        $("#updategui").on('click',null,null,function() {
            myview.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
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

    });


})();
