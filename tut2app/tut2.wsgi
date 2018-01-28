activate_this = '/srv/tut2/tut2env/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))

import sys
sys.path.insert(0,'/srv/tut2/tut2/tut2app')

from tut2app import app as application
