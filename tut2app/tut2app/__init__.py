from flask import Flask
from flask_debugtoolbar import DebugToolbarExtension
from flask_login import LoginManager
from tut2app.tut2helpers import get_flask_key
import logging
logger = logging.getLogger(__name__)

app = Flask(__name__)
login_manager = LoginManager()
login_manager.init_app(app)

# the toolbar is only enabled in debug mode:
app.debug = False
app.config['SECRET_KEY'] = get_flask_key()
toolbar = DebugToolbarExtension(app)

# according to http://flask.pocoo.org/docs/0.12/patterns/packages/,
# we need to import the view(s) here.
import tut2app.views
#import tut2app.model  # we don't need the model, though, right??
