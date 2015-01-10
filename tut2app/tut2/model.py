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
        self._username="John Marshmallow"

    def is_active(self):
        app.logger.error("is_active() was called")
        return self._is_active

    def get_id(self):
        app.logger.error("get_id() was called")
        return unicode("ONLYUSER")

    def is_authenticated(self):
        app.logger.error("is_authenticated() was called")
        return self._is_authenticated

    @staticmethod
    def retrieve_based_on_id(id):
        app.logger.error("lookup_based_on_id() was called")
        return User()

    @staticmethod
    def retrieve_based_on_given_credentials(name,password):
        """
        Check if (name,password) tuple identifies a valid user,
        if so, return a User object representing that user.
        If not, return None
        """
        return None

    
