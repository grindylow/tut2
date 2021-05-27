#!/bin/sh
set -e    # exit on first non-zero return code
./setup_wizard.py -C /etc/tut2.conf.d
TUT2_CONF_FILE=/etc/tut2.conf.d/tut2.conf exec ./runserver.py
