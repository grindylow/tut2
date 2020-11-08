#!/usr/bin/env python3
#
# Alternative launching method according to
# http://flask.pocoo.org/docs/0.12/patterns/packages/:
#
#   export FLASK_APP=tut2app
#   pip install -e .
#   flask run --host=0.0.0.0

import logging

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.info("Starting...")

    from tut2app import app
    app.run(debug=True, host='0.0.0.0')

