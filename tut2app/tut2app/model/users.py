# A regular TUT2 user.
#
# Users are contained in the database.
# Users have (login-)IDs and passwords. Internally, they are
# referenced by UIDs.
#
# Currently, there is no provision for automatically creating
# users - you will need to create them manually in the database.

import hashlib
import base64
from tut2app import tut2db
import logging

logger = logging.getLogger(__name__)


class User:
    def __init__(self):
        self._is_active = False
        self._is_authenticated = False
        self._is_anonymous = True
        self._tut2uid = None
        self.email = "john@marshmellow.com"

    @property
    def is_active(self):
        logger.debug("is_active() was called")
        return self._is_active

    def get_id(self):
        logger.debug("get_id() was called")
        return self.email

    @property
    def is_authenticated(self):
        logger.debug("is_authenticated() was called. (" + str(self._is_authenticated) + ")")
        return self._is_authenticated

    @property
    def is_anonymous(self):
        logger.debug("is_anonymous() was called")
        return self._is_anonymous

    def get_tut2uid(self):
        logger.debug("User.get_tut2uid(%s) was called" % self.get_id())
        return self._tut2uid

    def calc_hash(self, pwd):
        """
        Calculate hash from salt and given password.
        Password needs to be in 'bytes' at this stage.
        Return a base-64-encoded version of this hash value.
        """
        h = hashlib.sha512(self._salt.encode('utf-8') + pwd)
        return base64.b64encode(h.digest())

    def password_validates(self, password):
        """
        Is the given password the correct one for this user?
        Passwords are stored as SHA2 hashes, salted with the salt
        specified in the user entry.
        """
        their_hash = self.calc_hash(password.encode('utf8'))
        logger.info('Their hash is: %s' % their_hash)
        logger.info('My hash is   : %s' % self._password_hash)
        if their_hash == self._password_hash:
            logger.info('Passwords match. Access granted for user "%s".' % self.email)
            return True
        return False

    @staticmethod
    # Outdated
    def retrieve_based_on_username(username):
        logger.error("retrieve_based_on_username() called")
        """
        Check if (username) tuple identifies a valid user.
        if so, return a User object representing that user.
        If not, return None.
        """
        logger.info("retrieve_based_on_username() was called with username '%s'" % username)
        u = None
        db = tut2db.get_db()
        entry = db.tut2users.find_one({'fullname': username})
        logger.info("found entry: %s" % entry)

        if entry:
            u = User()
            u._is_active = True
            u._is_authenticated = False
            u._is_anonymous = False
            u.fullname = username
            u.email = entry['id']
            # app-specific extensions
            u._tut2uid = entry['tut2_uid']
            u._password_hash = entry['password_hash'].encode('utf8')
            u._salt = entry['salt'].encode('utf8')
        logger.info('Returning user: %s' % u)
        return u

    @staticmethod
    def retrieve_based_on_email(email):
        logger.info("retrieve_based_on_email() was called with email '%s'" % email)
        u = None
        db = tut2db.get_db()
        entry = db.tut2users.find_one({'id': email})
        logger.info("found entry: %s" % entry)

        if entry:
            u = User()
            u._is_active = True
            u._is_authenticated = True
            u._is_anonymous = False
            u.email = email
            # app-specific extensions
            u._tut2uid = entry['tut2_uid']
            u._password_hash = entry['password_hash']
            u._salt = entry['salt']
        logger.info('Returning user: %s' % u)
        return u

    @staticmethod
    def retrieve_based_on_given_credentials(email=None, password=None):
        """
        Check if (email,password) tuple identifies a valid user,
        if so, return a User object representing that user.
        If not, return None.
        """
        logger.info("retrieve() was called with email='%s'" % email)
        u = User.retrieve_based_on_email(email)
        if not u:
            return None
        if u.password_validates(password):
            u._is_authenticated = True
            return u
        return None

    @staticmethod
    def get_next_uid():
        db = tut2db.get_db()
        entries = list(db.tut2users.find().sort([('tut2_uid', -1)]).limit(1))
        if len(entries)==1:
            entry = entries[0] # Get the first and only entry
            logger.debug("Entry: " + str(entry))
            if (entry):
                uid = entry['tut2_uid']
                logger.debug("Entry UID: " + str(uid))
                try:
                    return uid+1 # Try to return the NEXT uid
                except Exception as e:
                    logger.error("Exception while trying to get next uid.")
                    raise e
            else:
                raise Exception("Entry is null")
        elif len(entries)==0:
            logger.warning("No Entries. This should mean there are NO users in the database.")
            logger.warning("Creating first uid: 0")
            # Return the FIRST uid
            return 0
        else:
            raise Exception("More than 1 Entry")

    @staticmethod
    def delete_all_users():
        # REMOVE all users from the database
        tut2db.get_db().tut2users.remove({})
        logger.warning("Deleted all users.")

    """
    Add a new user to the database. Credentials must be already valid.
    """
    @staticmethod
    def create_user(email : str, password: str):
        # Create user object
        user = User()

        user._salt = "sugar"
        # Set Password hash
        user._password_hash = user.calc_hash(password.encode('utf-8'))
        # Set email
        user.email = email

        # Actually add the user to the database
        db = tut2db.get_db()
        uid = User.get_next_uid()
        if db.tut2users.insert_one({'id': user.email, 'salt': user._salt, 'tut2_uid': uid,'password_hash': user._password_hash}).inserted_id:
            logger.info("Successfully created user with email '" + user.email + "' and uid '" + str(uid) + "'")
            return user
        return None
