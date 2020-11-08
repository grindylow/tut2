"""
Functions for accessing the (MongoDB) database.
"""

from pymongo import MongoClient
import configparser
import logging
logger = logging.getLogger(__name__)

DB_USERNAME = 'tut2rw'
_db = None

def connect_to_database():
    """
    Connect to our mongodb database as a read/write user.
    Returns the instance of the connected PyMongo database connector.
    Requires self.cfg to already be populated with this app's config file,
    because this is where we will look up our database password.
    """
    logger.debug("Retrieving database login information")
    cfg = configparser.ConfigParser()
    cfg.read("secrets.conf")
    password = cfg['passwords'][DB_USERNAME]
    logger.debug("creating MongoClient...")
    client = MongoClient(username=DB_USERNAME, password=password)
    logger.debug("creating database accessor...")
    return client.tut2db

def get_db():
    """
    Retrieve a reference to the ("global") database connector. Connect
    to database if not connected yet.
    """
    global _db
    if _db is None:
        logger.info('get_db(): No database connected (yet). Connecting...')
        _db = connect_to_database()
    else:
        logger.info('get_db(): Returning a reference to existing DB connector.')
    return _db
