/* tut2 app */

var myview;

(function() {

  'use strict';
  
    
    if(localStorage) {
	console.log("localStorage exists");
    }

    if(localStorage.tut_grill_entries) {
	console.log("localStorage has a tut_grill_entries entry");
	mymodel.readFromLocalStorage();
    } else {
	var sampleEntries= [
	    { "uid":"uid1","starttime_utc_ms":1234567891, "project":"ORG.OG3.301", "logentry":"researched multiplexers", "duration":"unknown" },
	    { "uid":"uid2","starttime_utc_ms":129566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"entered time continuum", "duration":"unknown" },
	    { "uid":"uid3","starttime_utc_ms":124566989, "starttime":"23:45", "project":"DIM.WHIT.700", "logentry":"defibrillation unit (pt 1)", "duration":"unknown" },
	    { "uid":"uid4","starttime_utc_ms":123456, "starttime":"34:56", "project":"DIM.WHIT.300", "logentry":"researched multiplexers again", "duration":"0:35:02" }
	];
	localStorage.tut_grill_entries=JSON.stringify(sampleEntries);
	mymodel.readFromLocalStorage();
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
