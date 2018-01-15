# A regular TUT2 user.
#
# Users are contained in the database.
# Users have (login-)IDs and passwords. Internally, they are
# referenced by UIDs.
#
# Currently, there is no provision for automatically creating
# users - you will need to create them manually in the database.

import logging
logger = logging.getLogger(__name__)

import hashlib
import base64
from tut2 import tut2db

class User:
    def __init__(self):
        self._is_active=False
        self._is_authenticated=False
        self._is_anonymous=True
        self._tut2uid = None
        self.username="John-Marshmallow"

    @property
    def is_active(self):
        logger.debug("is_active() was called")
        return self._is_active

    def get_id(self):
        logger.debug("get_id() was called")
        return self.username

    @property
    def is_authenticated(self):
        logger.debug("is_authenticated() was called")
        return self._is_authenticated
    
    @property
    def is_anonymous(self):
        logger.debug("is_anonymous() was called")
        return self._is_anonymous

    def get_uid(self):
        logger.debug("User.get_uid(%s) was called" % self.get_id())
        return self._tut2uid

    def calc_hash(self,pwd):
        """
        Calculate hash from salt and given password.
        Password needs to be in 'bytes' at this stage.
        Return a base-64-encoded version of this hash value.
        """
        h = hashlib.sha512(self._salt + pwd)
        return base64.b64encode(h.digest())
    
    def password_validates(self,password):
        """
        Is the given password the correct one for this user?
        Passwords are stored as SHA2 hashes, salted with the salt
        specified in the user entry.
        """
        their_hash = self.calc_hash(password.encode('utf8'))
        logger.info('Their hash is: %s' % their_hash)
        logger.info('My hash is   : %s' % self._password_hash)
        if their_hash == self._password_hash:
            logger.info('Passwords match. Access granted for user "%s".' % self.username)
            return True
        return False
    
    @staticmethod
    def retrieve_based_on_id(id):
        logger.info("retrieve_based_on_id() was called with id '%s'" % id)
        u = None
        db = tut2db.get_db()
        entry = db.tut2users.find_one({'id':id})
        logger.info("found entry: %s" % entry)

        if entry:
            u = User()
            u._is_active=True
            u._is_authenticated=True
            u._is_anonymous=False
            u.fullname = entry['fullname']
            u.username = id
            # app-specific extensions
            u._tut2uid = entry['tut2_uid']
            u._password_hash = entry['password_hash'].encode('utf8')
            u._salt = entry['salt'].encode('utf8')
        logger.info('Returning user: %s' % u)
        return u

    @staticmethod
    def retrieve_based_on_given_credentials(name=None, password=None):
        """
        Check if (name,password) tuple identifies a valid user,
        if so, return a User object representing that user.
        If not, return None
        """
        logger.info("retrieve() was called with name='%s'" % name)
        u = User.retrieve_based_on_id(name)
        if not u:
            return None
        if u.password_validates(password):
            return u
        return None
    
