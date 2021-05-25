# A regular TUT2 user.
#
# Users are contained in the (tut2db) database.
# Users have (login-)IDs (e-mail address) and passwords. Internally, they are
# referenced by UIDs.
#

import hashlib
#import base64
import secrets
import pymongo

from tut2app import tut2db
import logging

logger = logging.getLogger(__name__)


class User:
    def __init__(self):
        self._is_active = False
        self._is_authenticated = False
        self._is_anonymous = True
        self._tut2uid = None
        self._salt = "pepper"
        self._email = "john@marshmallow.com"

    @property
    def is_active(self):
        logger.debug("is_active() was called")
        return self._is_active

    def get_email(self):
        logger.debug("get_email() was called")
        return self._email

    def get_id(self):
        logger.debug("get_id() was called")
        return self.get_email()

    @property
    def is_authenticated(self):
        logger.debug("is_authenticated() was called. (" + str(self._is_authenticated) + ")")
        return self._is_authenticated

    @property
    def is_anonymous(self):
        logger.debug("is_anonymous() was called")
        return self._is_anonymous

    def get_tut2uid(self):
        logger.debug("User.get_tut2uid(%s) was called" % self.get_email())
        return self._tut2uid

    def calc_hash(self, pwd: bytes):
        """
        Calculate hash from salt and given password.
        Password needs to be in 'bytes' (may have been converted from, for example, utf-8 earlier on).
        Salt is also stored as 'bytes' ('binary' in Mongo parlance).

        @returns a textual representation of this hash value.
        """
        h = hashlib.sha512(self._salt + pwd)
        return h.hexdigest()

    def password_validates(self, password):
        """
        Is the given password the correct one for this user?
        Passwords are stored as SHA2 hashes, salted with the salt
        specified in the user entry.
        """
        their_hash = self.calc_hash(password.encode('utf-8'))
        logger.info('Their hash is: %s' % their_hash)
        logger.info('My hash is   : %s' % self._password_hash)
        if their_hash == self._password_hash:
            logger.info('Passwords match. Access granted for user "%s".' % self._email)
            return True
        return False

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
            u._email = email
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
        """
        Uniqueness cannot be guaranteed with this implementation. Ultimately, the database has to
        guarantee uniqueness of the uid field.
        """
        db = tut2db.get_db()
        entries = list(db.tut2users.find().sort([('tut2_uid', -1)]).limit(1))
        if len(entries) == 1:
            entry = entries[0]  # Get the first and only entry
            logger.debug("Entry: " + str(entry))
            if entry:
                uid = entry['tut2_uid']
                logger.debug("Entry UID: " + str(uid))
                try:
                    return uid+1  # Try to return the NEXT uid
                except Exception as e:
                    logger.error("Exception while trying to get next uid.")
                    raise e
            else:
                raise Exception("Entry is null")
        elif len(entries) == 0:
            logger.warning("No Entries. This should mean there are NO users in the database.")
            logger.warning("Creating first uid: 0")
            # Return the FIRST uid
            return 223
        else:
            raise Exception("More than 1 Entry")

    """
    Add a new user to the database. Credentials must be already valid.
    """
    @staticmethod
    def create_user(email: str, password: str):
        # Create user object
        user = User()
        user._salt = secrets.token_bytes(17)   # a random salt for each user!
        user._password_hash = user.calc_hash(password.encode('utf-8'))
        user._email = email

        # Actually add the user to the database
        db = tut2db.get_db()

        uid = 0
        result = 0
        retries = 10
        while retries:
            retries = retries-1
            uid = User.get_next_uid()
            try:
                result = db.tut2users.insert_one({'id': user._email, 'salt': user._salt, 'tut2_uid': uid,
                                                 'password_hash': user._password_hash}).inserted_id
                break
            except pymongo.errors.DuplicateKeyError:
                logger.warning('duplicate key error on insert_one(user) - trying again...')
                continue

        if result:
            logger.info("Successfully created user with email '" + user._email + "' and uid '" + str(uid) + "'")
            return user
        return None
