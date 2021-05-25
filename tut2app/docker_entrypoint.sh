#!/bin/sh
set -e    # exit on first non-zero return code
./setup_wizard.py
exec ./runserver.py
