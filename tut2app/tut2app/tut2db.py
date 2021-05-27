"""
Functions for accessing the (MongoDB) database.
"""

from pymongo import MongoClient
from . import tut2helpers
import logging
logger = logging.getLogger(__name__)

_db = None


def connect_to_database():
    """
    Connect to our mongodb database as a read/write user.
    Returns the instance of the connected PyMongo database connector.

    Verifies that database is set up appropriately (unique constraints etc),
    fails if this is not the case.

    -Requires self.cfg to already be populated with this app's config file,
    because this is where we will look up our database password.-

    """
    logger.debug("Retrieving database login information")

    conf = tut2helpers.retrieve_config_file()
    mongo_host = conf.get('db', 'mongodb_host', fallback="localhost")
    mongo_port = conf.getint('db', 'mongodb_port', fallback=27017)

    userdb_name = conf.get('db', 'userdb_name', fallback="tut2db")
    tut2db_name = conf.get('db', 'tut2db_name', fallback="tut2db")
    tut2rwuser_name = conf.get('db', 'tut2rw_user_name', fallback="tut2rw")
    tut2rwuser_password = conf.get('db', 'tut2rw_user_password', fallback="default")

    logger.debug("creating MongoClient...")
    logger.debug(f"host={mongo_host}, port={mongo_port}, authSource={userdb_name}, username={tut2rwuser_name}, password={tut2rwuser_password})")
    client = MongoClient(host=mongo_host, port=mongo_port, authSource=userdb_name,
                         username=tut2rwuser_name, password=tut2rwuser_password)
    logger.debug(f"server_info(): {client.server_info()}")
    logger.debug("creating database accessor...")
    db = client[tut2db_name]
    return db


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
