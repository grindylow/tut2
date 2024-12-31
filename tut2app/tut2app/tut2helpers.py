# a number of useful project-wide helper functions
import configparser
import logging
import os
import random
import string
import subprocess
import toml


logger = logging.getLogger(__name__)
tut2_version_str = None  # will be populated on 1st call to get_tut2_version()


def get_tut2_version():
    global tut2_version_str

    if tut2_version_str is not None:
        return tut2_version_str
    
    # program version comes from Poetry's pyproject.toml
    with open('pyproject.toml', 'r') as f:
        pyproject_data = toml.load(f)
    version = pyproject_data['tool']['poetry']['version']

    # also (attempt to) retrieve GIT commit hash
    try:
        git_commit_hash = subprocess.check_output(['git', 'rev-parse', 'HEAD']).strip().decode('utf-8')
    except subprocess.CalledProcessError:
        git_commit_hash = 'unknown-git-commit-hash'

    tut2_version_str = f'{version}-{git_commit_hash}'
    return 


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
