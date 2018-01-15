"""
The data model(s)
"""

from tut2 import app
from tut2 import tut2db
import logging
logger = logging.getLogger(__name__)

class Model:

    next_rev_no = 0    # to be initialised from DB in __init__()

    def __init__(self):
        logger.info("model initialising...")
        db = tut2db.get_db()
        logger.debug("retrieving latest revision number...")
        entry = db.tut2entries.find_one(sort=[("revision", -1)])
        if not entry:
            logger.warning("Empty database. Initialising next global revision number to 21.")
            self.next_rev_no = 21
        else:
            self.next_rev_no = entry['revision'] + 1
        logger.info("Next revision number initialised to %s." % self.next_rev_no)

    def queryEntries(self,fromrev=0, user_uid='*invalid*uid*'):
        db = tut2db.get_db()
        cursor = db.tut2entries.find({'revision':{'$gte':fromrev}, 'user':user_uid})
        entries = []
        for document in cursor:
            # translate uid from mongodb speech back to tut2 speech
            document['uid'] = document['_id']
            del document['_id']
            entries.append(document)
        return entries

    def addOrUpdateEntries(self, entries, user_uid='USER_UID_UNSPECIFIED'):
        """
        Add/update the given entries, return their respective 
        (server-side) revision numbers.
        @todo handle errors
        """
        logger.info('addOrUpdateEntries()')
    
        # store entry in database
        db = tut2db.get_db()
        revnrs = []
        
        for e in entries:
            logger.debug("e: %s",e)
            e['_id'] = e['uid']    # translate tut2 UID to mongodb primary key
            del e['uid']
            e['user'] = user_uid   # This is where entries get associated with a specific user id.
                                   # No such thing exists in the client (browser) model, as it
                                   # always belongs to the "current" user.
            e['revision'] = self.next_rev_no
            revnrs.append(self.next_rev_no)
            self.next_rev_no += 1

            # @todo deal with global rev no properly:
            #   - either store in DB
            #   - or let DB handle it entirely?

            # do we want to update an existing entry, or create an
            # entirely new one?
            # 1. Check if entry with given uid exists already
            existingentry = db.tut2entries.find_one({'_id':e['_id']})
            
            # 2. Either create a new entry, or update the existing one
            if existingentry:
                logger.debug("entry exists: %s", existingentry)
                id = e['_id']
                del e['_id']  # prevent "Mod on _id not allowed"
                result = db.tut2entries.update({'_id':id}, {"$set": e}, upsert=False)
                # @todo investigate if we could simply use update() with upsert=true for both cases
                logger.debug("result: %s" % result)
            else:
                logger.debug("entry doesn't exist yet")
                result = db.tut2entries.insert_one(e)
                logger.debug("result: %s",result)

        return revnrs

    def generate_report(self):
        """
        Report generator. Specify details of what kind of report to generate
        with the various arguments.
        """

        # The most common form of report is reporting the number of hours
        # per project for a given timespan.
        # Variations on this include
        #  - excluding certain projects by pattern
        #  - accumulating sub-projects under their respective main projects

        # Any such report will always be evaluated on a per-user basis.

        # The algorithm goes as follows:

        # 1. Select first entry *pre-dating* (or falling exactly onto
        #    the requested start time.
        #    This will define the project that will accumulate hours
        #    initially.
        #    If no such entries - assume a default one, e.g. '_tut_pre_first_entry'.

        # 2. Select next entry. Bill time between start and this entry to
        #    the project determined above. Remember project for next iteration.

        # 3. Keep selecting next entry until entry is *after* (or exactly
        #    equal to) the requested end time, or no more entries exist.

        # In fact, do it the other way around. Because that way we don't have
        # to worry about race conditions between finding the "pre-dated"
        # entry and finding all the rest of 'em.

        # In SQL this would read something like
        #  SELECT * FROM ENTRIES WHERE starttime_utc_ms <= report_end_time ORDER BY starttime_utc_ms

        # ...and then keep reading from the iterator until we are past the
        # start time... Or run a separate query with COUNT=1 for that, after all.
        
        
