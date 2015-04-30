/* tut2 server stub

   Allows access to the server-side model (container), for syncing.
*/

'use strict';

// The TutModel maintains the list of all Log Entries, together with
// the necessary housekeeping data to support syncing.
function tut2_createServerModelStub(params)
{
    var o={};

    /* private variables and member functions */



    /* public member functions */

    /** Retrieve (new) entries from server, starting from (server-side) revision fromRev.
     *  @returns Array of entries, not necessarily in any guaranteed order.
     */
    o.queryEntries=function(fromRev) {
        console.log("serverStub.queryEntries()",fromRev);
        // we use a synchronous ajax call for now (bad!!), then
        // @todo we need to rewrite this to run asynchronously.
        var result = $.ajax({
            dataType: "json",
            url: "/api_queryentries",
            data: {"fromrev":fromRev},
            //success: success
            async: false
        });
        console.info("retrieved via AJAX synchronous:",result);
        var data=$.parseJSON(result.responseText);
        console.info("parsed data:",data);

        var resultSet=[];
        data.entries.forEach(function(e) {
            resultSet.push(tut2_createTutEntry(undefined /*model*/,e));
        });

        console.info("actual entries:",resultSet);
        return resultSet;
    };

    /** Add the given entry e (a tut2_tutEntry) to the server database, or
     *  update the information in the server-side entry if it already exists.

     *  @returns (Server-side) revision number of the new entry
     */
    o.addOrUpdateEntry=function(entry) {
        // @todo implement
        // @todo convert to asynchronous
        console.log("serverStub.addOrUpdateEntry()",entry);
        return undefined;
    };

    // o.that=o;   do we need this? what for? will it prevent GC (bad!)?

    return o;
};
