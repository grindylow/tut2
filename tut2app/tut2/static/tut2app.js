/* tut2 app */

'use strict';

var myview;

(function() {

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
 
    $(document).ready(function(){
        console.log("mark B");
        myview=tut2_createDefaultView();

        // remove this again in the end
        var c=$('#tut-entries-container');
        c.empty();

        $("#updategui").on('click',null,null,function() {
            myview.redrawTutEntriesUI([mymodel.createTemplateEntry()].concat(mymodel.getAllEntries()));
        });

        $("#syncwithlocalstorage").on('click',null,null,function() {
            mymodel.syncWithLocalStorage();
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
        },100000);

    });


})();
