/* tut2 server stub

   Provides access to the server-side model (container), for syncing.
*/

'use strict';

// The TutModel maintains the list of all Log Entries, together with
// the necessary housekeeping data to support syncing.
function tut2_createServerModelStub()
{
    var o={};

    /* private variables and member functions */



    /* public member functions */

    /** Retrieve (new) entries from server, starting from (server-side) revision fromRev.
     *  @returns Array of entries, not necessarily in any guaranteed order.
     * 
     *  updated version for async support: call a callback when the data is ready,
     *  don't return anything
     *
     *  Updated version with Promise support: return a Promise.
     */
    o.queryEntries = function(fromRev,callback) {
        return new Promise(function(resolve, reject) {
            console.log("serverStub.queryEntries(fromRev=%s)",fromRev);
            // was: we use a synchronous ajax call (bad)
            var handle = $.ajax({
                dataType: "json",
                url: "api_queryentries",
                cache:false,
                data: {"fromrev":fromRev},
                //success: success
                //async: false
                success: function(result) {
                    console.info("retrieved via AJAX asynchronous:",result);
                    var resultSet=[];
                    result.entries.forEach(function(e) {
                        resultSet.push(tut2_createTutEntry(undefined /*model*/,e));
                    });
                    console.info("actual entries:",resultSet);
                    resolve(resultSet);
                    //callback(resultSet);  // this is the "asynchronous return"
                },
                error: function(a,b,c) {
                    console.warn("AJAX call resulted in 'error' with",a,b,c);
                    reject(b);
                }
            });
            console.info("serverStub.queryEntries() terminated, closure might still be active");
        });
    }

    /** Add the given entry e (a tut2_tutEntry) to the server database, or
     *  update the information in the server-side entry if it already exists.

     *  @returns (Server-side) revision number of the new entry
     */
    o.addOrUpdateEntry = function(entry) {
        // @todo convert to asynchronous
        // @todo change interface to allow adding multiple entries in one go
	    // @todo make it cope with multiple entries at once (server can handle it already I think, albeit without sophisticated error handling)
        console.log("serverStub.addOrUpdateEntry()",entry.pickleToDict());
        var newrev;
        // BAD: we use a synchronous ajax call (bad)
        // @todo convert to async
        var handle = $.ajax({
            dataType: "json",
            url: "api_addorupdateentry",
            contentType: "application/json",
            cache:false,
            method: "post",
            data: JSON.stringify({entries:[entry.pickleToDict()]}),
            //success: success
            async: false, //true,
            success: function(result) {
               console.info("retrieved via AJAX:",result);
                newrev = result['revnrs'][0]
            }
        });
        console.assert(newrev !== undefined, 'Upstream revision number is undefined - most likely the update has failed.');
        console.info("serverStub.addOrUpdateEntry() terminated");
        return newrev;
    };

    // o.that=o;   do we need this? what for? will it prevent GC (bad!)?
    console.debug("ServerModelStub created");
    return o;
};
