"""
The data model(s)
"""

from tut2 import app
from pymongo import MongoClient

import logging
logger = logging.getLogger(__name__)

class Model:

    next_rev_no = 0    # to be initialised from DB in __init__()

    def __init__(self):
        logger.info("model initialising...")
        logger.debug("creating MongoClient...")
        client = MongoClient()
        logger.debug("creating database accessor...")
        db = client.tut2db
        logger.debug("retrieving latest revision number...")
        entry = db.tut2entries.find_one(sort=[("revision", -1)])
        if not entry:
            logger.warning("Empty database. Initialising next global revision number to 21.")
            self.next_rev_no = 21
        else:
            self.next_rev_no = entry['revision'] + 1
        logger.info("Next revision number initialised to %s." % self.next_rev_no)

    def queryEntries(self,fromrev=0):
        client = MongoClient()
        db = client.tut2db
        cursor = db.tut2entries.find({'revision':{'$gte':fromrev}})
        entries = []
        for document in cursor:
            # translate uid from mongodb speech back to tut2 speech
            document['uid'] = document['_id']
            del document['_id']
            entries.append(document)
        return entries

    def addOrUpdateEntries(self,entries):
        """Add/update the given entries, return their respective 
        (server-side) revision numbers."""
    
        # store entry in database
        client = MongoClient()
        db = client.tut2db

        for e in entries:
            logger.debug("e:",e)
            e['_id'] = e['uid']    # translate tut2 UID to mongodb primary key
            del e['uid']
            e['revision'] = self.next_rev_no
            self.next_rev_no += 1

            # @todo deal with global rev no properly:
            #   - either store in DB
            #   - or let DB handle it entirely?

            # do we want to update an existing entry, or create an
            # entirely new one?
            # 1. Check if entry with given uid exists already
            existingentry = db.tut2entries.find_one({'_id':e['_id']})
            logger.debug(existingentry)
            
            # 2. Either create a new entry, or update the existing one
            if existingentry:
                logger.debug("entry exists")
                id = e['_id']
                del e['_id']  # prevent "Mod on _id not allowed"
                result = db.tut2entries.update({'_id':id}, {"$set": e}, upsert=False)
                # @todo investigate if we could simply use update() with upsert=true for both cases
                logger.debug("result: %s" % result)
            else:
                logger.debug("entry doesn't exist yet")
                result = db.tut2entries.insert_one(e)
                logger.debug("result: %s",result)
        #
        #  continue here !!!!
        #
        # @todo return correct revision   numbers, and handle the return values!


