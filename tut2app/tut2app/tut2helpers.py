# a number of useful project-wide helper functions
import configparser
import logging
import os
import random
import string

logger = logging.getLogger(__name__)


def get_flask_key():
    # set a 'SECRET_KEY' to enable the Flask session cookies
    # we read the key from a file, which we exclude from
    # the source repository
    key = None
    cfg = retrieve_config_file()
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


def retrieve_config_file():
    conf_file_name = os.environ.get("TUT2_CONF_FILE", "tut2.conf")
    logging.info(f"(Attempting to) read configuration file {conf_file_name}...")
    conf = configparser.ConfigParser()
    if not os.path.isfile(conf_file_name):
        logging.warning(f"File '{conf_file_name}' does not exist. Using defaults (which will likely not work or at "
                        "least lead to database authentication failure.")
        logging.warning(f"(Hint: Specify the name of the configuration file in environment variable TUT2_CONF_FILE.)")
    conf.read(conf_file_name)
    return conf
