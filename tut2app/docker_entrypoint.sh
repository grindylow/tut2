#!/bin/sh
set -e    # exit on first non-zero return code
poetry run ./setup_wizard.py -C /etc/tut2.conf.d
TUT2_CONF_FILE=/etc/tut2.conf.d/tut2.conf exec gunicorn tut2app:app -b 0.0.0.0:5000 --access-logfile -
