"""
The data model(s)
"""

from tut2 import app
from pymongo import MongoClient

class Model:

    next_rev_no = 0    # to be initialised from DB in __init__()

    def __init__(self):
        print "model initialising..."
        client = MongoClient()
        db = client.tut2db
        entry = db.tut2entries.find_one(sort=[("revision", -1)])
        self.next_rev_no = entry['revision'] + 1
        print "Next revision number initialised to %s." % self.next_rev_no

    def queryEntries(self,fromrev=0):
        client = MongoClient()
        db = client.tut2db
        cursor = db.tut2entries.find({'revision':{'$gte':fromrev}})
        entries = []
        for document in cursor:
            # translate uid from mongodb speech back to tut2 speech
            document['uid'] =   document['_id']
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
            print "e:",e
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
            print existingentry
            
            # 2. Either create a new entry, or update the existing one
            if existingentry:
                print "entry exists"
                id = e['_id']
                del e['_id']  # prevent "Mod on _id not allowed"
                result = db.tut2entries.update({'_id':id}, {"$set": e}, upsert=False)
                # @todo investigate if we could simply use update() with upsert=true for both cases
                print "result:",result
            else:
                print "entry doesn't exist yet"
                result = db.tut2entries.insert_one(e)
                print "result:",result
        #
        #  continue here !!!!
        #
        # @todo return correct revision   numbers, and handle the return values!



class User:
    def __init__(self):
        self._is_active=False
        self._is_authenticated=False
        self._is_anonymous=True
        self.username="John-Marshmallow"

    def is_active(self):
        app.logger.error("is_active() was called")
        return self._is_active

    def get_id(self):
        app.logger.error("get_id() was called")
        return self.username

    def is_authenticated(self):
        app.logger.error("is_authenticated() was called")
        return self._is_authenticated

    def is_anonymous(self):
        app.logger.error("is_anonymous() was called")
        return self._is_anonymous

    @staticmethod
    def retrieve_based_on_id(id):
        app.logger.error("lookup_based_on_id() was called with id '%s'"%id)
        user_details={u"klaus":{"fullname":"Klaus der Grosse"},
                      u"king":{"fullname":"King of the Kongo"}}
        u=User()
        u._is_active=True
        u._is_authenticated=True
        u._is_anonymous=False
        u.fullname=user_details[id]["fullname"]
        u.username=id
        return u

    @staticmethod
    def retrieve_based_on_given_credentials(name=None,password=None):
        """
        Check if (name,password) tuple identifies a valid user,
        if so, return a User object representing that user.
        If not, return None
        """
        app.logger.error("retrieve() was called with name='%s'"%name)
        known_users = ( (u"klaus",u"dieter"),
                        (u"king",u"kong")      )
        if (name,password) in known_users:
            u=User.retrieve_based_on_id(name)
            return u
        return None

    
