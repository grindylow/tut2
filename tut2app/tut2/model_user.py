import logging
logger = logging.getLogger(__name__)

class User:
    def __init__(self):
        self._is_active=False
        self._is_authenticated=False
        self._is_anonymous=True
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

    def password_validates(self,password):
        """
        Is the given password the correct one for this user?
        """
        if self._password == password:
            return True
        return False
    
    @staticmethod
    def retrieve_based_on_id(id):
        logger.info("lookup_based_on_id() was called with id '%s'"%id)
        user_details={ u"klaus":{"fullname":"Klaus der Grosse",'password':'dieter'},
                       u"king":{"fullname":"King of the Kongo",'password':'kong'}}
        u = None
        if id in user_details:
            u = User()
            u._is_active=True
            u._is_authenticated=True
            u._is_anonymous=False
            u._password = user_details[id]['password']   # this is a bad idea, will need resolving for final product (database)
            u.fullname = user_details[id]['fullname']
            u.username=id
        logger.info('Returning user: %s' % u)
        return u

    @staticmethod
    def retrieve_based_on_given_credentials(name=None,password=None):
        """
        Check if (name,password) tuple identifies a valid user,
        if so, return a User object representing that user.
        If not, return None
        """
        logger.info("retrieve() was called with name='%s'"%name)
        u = User.retrieve_based_on_id(name)
        if not u:
            return None
        if u.password_validates(password):
            return u
        return None

        

    
