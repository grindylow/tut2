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
function TutEntry() {

    function generateUUID() {
	// from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = (d + Math.random()*16)%16 | 0;
	    d = Math.floor(d/16);
	    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
    };

    this.starttime_utc_ms=-2;
    this.logenty='newly created by TutEntry constructor';
    this.uid=genererateUUID();
    console.log("LogEntry constructor done.");
};

var mymodel={

    datastore:[],

    generateUUID:function() {
	// from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = (d + Math.random()*16)%16 | 0;
	    d = Math.floor(d/16);
	    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
    },

    createTemplateEntry:function() {
	return { "uid":"entrytemplate",
		 "starttime_utc_ms":Date.now(),   // was: now,
		 "project":"enter project", 
		 "logentry":"enter log entry (task description)", 
		 "duration":"unknown" 
	       };
    },
    
    addEntry:function(entry) { 
	// for now, we always add the new entry to the beginning
	// of the list, assuming it is the most recent one.
	// @returns UID of created entry
	var uid=this.generateUUID();
	entry["uid"]=uid;
	this.datastore=[entry].concat(this.datastore);
	this.saveToLocalStorage();
	return uid;
    },

    deleteEntry:function(uid) { 
	for(var i=0;i<this.datastore.length;i++) {
	    if(this.datastore[i].uid==uid) {
		console.log("found culprit for getEntryByUID");
		this.datastore.splice(i,1); // remove 1 element at index i
		this.saveToLocalStorage();
		return;
	    }
	}
	console.log("CANNOT FIND ENTRY WITH UID "+uid+" IN MODEL");
    },

    updateEntry:function(entry) {
	for(var i=0;i<this.datastore.length;i++) {
	    if(this.datastore[i].uid==entry.uid) {
		console.log("found culprit for updateentry");
		this.datastore[i]=entry;
		break;
	    }
	}
	this.saveToLocalStorage();
    },

    getEntryByStarttime:function(starttime_utc_ms) {
	console.log("model.getEntryByStarttime("+starttime_utc_ms+")");
	console.log(this.datastore.length);
	for(var i=0;i<this.datastore.length;i++) {
	    console.log(this.datastore[i].starttime_utc_ms);
	    if(this.datastore[i].starttime_utc_ms==starttime_utc_ms) {
		console.log("found culprit for getEntryByStarttime");
		return this.datastore[i];
	    }
	}
    },

    getEntryByUID:function(uid) {
	console.log("model.getEntryByUID("+uid+")");
	console.log(this.datastore.length);
	for(var i=0;i<this.datastore.length;i++) {
	    console.log(this.datastore[i].uid);
	    if(this.datastore[i].uid==uid) {
		console.log("found culprit for getEntryByUID");
		return this.datastore[i];
	    }
	}
	console.log("CANNOT FIND ENTRY WITH UID "+uid+" IN MODEL");
    },

    // return all Entries in descending start time order
    getAllEntries:function() {
	this.sortMyEntriesByStarttime();
	return this.datastore;
    },

    sortMyEntriesByStarttime:function() {
	this.datastore.sort(function(a,b){
	    if(a.starttime_utc_ms<b.starttime_utc_ms) {
		return 1;
	    } else if(a.starttime_utc_ms>b.starttime_utc_ms) {
		return -1;
	    }
	    return 0; // both entries are equal
	});
    },

    saveToLocalStorage:function() {
	localStorage.tut_grill_entries=JSON.stringify(this.datastore);
    },

    readFromLocalStorage:function() {
	this.datastore=JSON.parse(localStorage.tut_grill_entries);
    }
};
