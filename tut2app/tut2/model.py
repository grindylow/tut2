"""
The data model(s)
"""

from tut2 import app

class Model:
    pass

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

    
