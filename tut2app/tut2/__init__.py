import os
import configparser
import string
import random
import logging
from flask import Flask
from flask_debugtoolbar import DebugToolbarExtension
from flask_login import LoginManager

logger = logging.getLogger()

def get_flask_key():
    # set a 'SECRET_KEY' to enable the Flask session cookies
    # we read the key from a file, which we exclude from
    # the source repository
    key = None
    cfg = configparser.ConfigParser()
    cfg.read("secrets.conf")
    if cfg.has_section('keys'):
        s = cfg['keys']
        if 'flask_secret_key' in s:
            logger.info('Read existing flask secret key.')
            key = s['flask_secret_key']
    else:
        cfg.add_section('keys')
    if key is None:
        # generate a new key and store it for future use
        logger.info('No flask key found - generating one.')
        cs = string.digits + string.ascii_letters + '!#$&()*+,-./:;<=>?@[]^_{|}~'
        key = ''.join(random.choice(cs) for _ in range(20))
        cfg['keys']['flask_secret_key'] = key
        with open('secrets.conf','w') as f:
            cfg.write(f)
    return key

app = Flask(__name__)
login_manager = LoginManager()
login_manager.init_app(app)

# the toolbar is only enabled in debug mode:
#app.debug = True

app.config['SECRET_KEY'] = get_flask_key()

toolbar = DebugToolbarExtension(app)

import tut2.views
import tut2.model
