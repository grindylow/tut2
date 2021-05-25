# a number of useful project-wide helper functions
import configparser
import string
import random
import logging
logger = logging.getLogger(__name__)


def get_flask_key():
    # set a 'SECRET_KEY' to enable the Flask session cookies
    # we read the key from a file, which we exclude from
    # the source repository
    key = None
    cfg = configparser.ConfigParser()
    cfg.read("tut2.conf")
    if cfg.has_section('keys'):
        s = cfg['keys']
        if 'flask_secret_key' in s:
            logger.info('Read existing flask secret key.')
            key = s['flask_secret_key']
        else:
            # generate a temporary new key
            logger.info('No flask key found - generating a temporary one.')
            cs = string.digits + string.ascii_letters + '!#$&()*+,-./:;<=>?@[]^_{|}~'
            key = ''.join(random.choice(cs) for _ in range(20))
    return key
