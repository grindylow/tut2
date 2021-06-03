#!/usr/bin/env python3
#import grep
from pymongo import MongoClient
import pymongo.errors
import configparser
import sys
import os.path
import string
import random

import argparse

parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--config-dir', '-C', type=str, default=".",
                    help='Generate config files in this location')
args = parser.parse_args()

CONF_PATH = args.config_dir
TUT2CONF_FILENAME = os.path.join(CONF_PATH, 'tut2.conf')

PASSWORD_LENGTH = 20

MONGO_CONF_FILENAME = '/etc/mongodb.conf'
MONGO_ADMIN_USER_NAME = 'theUserAdmin'


def makepassword():
    cs = string.digits + string.ascii_letters + '-.^~'
    pw = ''.join(random.choice(cs) for _ in range(PASSWORD_LENGTH))
    return pw


def OK():
    print("OK")


def NOK():
    print("## NOK ##")


def OKish(s):
    print(s)


def announce(s):
    sys.stdout.write(s+' ')


def set_up_mongodb_from_scratch():
    announce("Checking if mongodb auth mode is enabled...")
    ret = os.system(f"grep -e '^auth = true' {MONGO_CONF_FILENAME}")
    if ret:
        OKish("NOT enabled (yet). Good.")
    else:
        OKish("Enabled. Please disable, and restart this script.")
        announce("You could use the following commands:")
        announce("    sudo sed -i 's/^auth = true/#auth = true/g' %s" % MONGO_CONF_FILENAME)
        announce("    sudo service mongodb restart")
        exit(3)

    announce("Connecting to mongodb...")
    client = MongoClient()
    OK()

    announce("Enabling auth in %s..." % MONGO_CONF_FILENAME)
    os.system("sudo sed -i 's/^#auth = true/auth = true/g' %s" % MONGO_CONF_FILENAME)
    OKish("Probably went OK. Didn't check.")

    print("Make sure you restart mongodb for changes to take effect.")
    print("You could use: sudo service mongodb restart")


print(f"""
Welcome to the TUT2 setup wizard
--------------------------------

This will perform initial setup of tut2 - up to the point, where the tut2 application will be able to start
successfully and access its database.

Nothing whatever will be done if any configuration files exist already.

If no mongo admin user account is specified, I will assume that the local mongodb
server has authentication disabled and will allow me to create users.

I will then create users with r/o and r/w access to the tut2 database.

tut2 will take care of initially populating its database on startup. 
""")


announce('* Checking if "%s" exists already...' % TUT2CONF_FILENAME)
if os.path.isfile(TUT2CONF_FILENAME):
    OKish( "Exists.")
    print( "  So things are probably already set up appropriately. Or at least we don't want to mess things up.")
    print(f"  If you really want to re-run the setup wizard, delete '{TUT2CONF_FILENAME}' or specify a different")
    print( "  configuration directory with the -C parameter.")
    print( "  Aborting setup wizard.")
    exit(0)
else:
    print(" No. Good.")


# If mongodb access details are specified in any environment variables, we skip the mongodb configuration steps
# and move right on to setting up the database environment for tut2.
announce("* Checking if environment variables for auto-configuration exist (TUT2_MONGODB_ADMIN_USER)...")
secrets_section = {}

if "TUT2_MONGODB_ADMIN_USER" not in os.environ:
    OKish("No.")
    print("  TUT2_MONGODB_ADMIN_USER environment variable NOT found. Assuming that no authentication is required.")
    announce("* Checking if mongodb auth mode is enabled...")
    ret = os.system(f"grep -q -e'^auth = true' {MONGO_CONF_FILENAME}")
    if ret:
        OKish("NOT enabled (yet). Good. We can proceed.")
    else:
        OKish("Enabled.")
        print("  Please disable mogodb authentication, and restart this script.")
        print("  You could use the following commands:")
        print("    sudo sed -i 's/^auth = true/#auth = true/g' %s" % MONGO_CONF_FILENAME)
        print("    sudo service mongodb restart")
        exit(3)

admin_user = os.environ.get("TUT2_MONGODB_ADMIN_USER")
admin_password = os.environ.get("TUT2_MONGODB_ADMIN_PASSWORD")

announce(f"* Creating config directory '{CONF_PATH}' (if it doesn't exist already)...")
os.makedirs(CONF_PATH, exist_ok=True)
OK()

conf = configparser.ConfigParser()
db_section = {"mongodb_host": os.environ.get("TUT2_MONGODB_HOST", "localhost"),
              "mongodb_port": int(os.environ.get("TUT2_MONGODB_PORT", 27017)),
              "userdb_name": os.environ.get("TUT2_USERDB_NAME", "tut2db"),
              "tut2db_name": os.environ.get("TUT2_TUT2DB_NAME", "tut2db"),
              "tut2rw_user_name": os.environ.get("TUT2_TUT2RW_USER_NAME", "tut2rw"),
              "tut2rw_user_password": os.environ.get("TUT2_TUT2RW_USER_PASSWORD", makepassword()),
              "tut2ro_user_name": os.environ.get("TUT2_TUT2RO_USER_NAME", "tut2ro"),
              "tut2ro_user_password": os.environ.get("TUT2_TUT2RO_USER_PASSWORD", makepassword())
             }

conf["db"] = db_section

announce("* Generating a 'secret key' for flask session management...")
key_section = {"flask_secret_key": makepassword()}
conf['keys'] = key_section
OK()


if admin_user:
    announce(f"* Connecting to database '{db_section['userdb_name']}' as user '{admin_user}'...")
    client = MongoClient(host=db_section['mongodb_host'], port=db_section['mongodb_port'],
                         username=secrets_section['mongodb_admin_user'],
                         password=secrets_section['mongodb_admin_password'])
else:
    announce(f"* Connecting to database '{db_section['userdb_name']}'...")
    client = MongoClient(host=db_section['mongodb_host'], port=db_section['mongodb_port'])

client.server_info()
db = client[db_section['userdb_name']]
OK()

announce(f"* Creating read/write user '{db_section['tut2rw_user_name']}' for writing to tut2 database...")
try:
    db.command("createUser", db_section['tut2rw_user_name'], pwd=db_section['tut2rw_user_password'],
               roles=[{'role': 'readWrite', 'db': db_section['tut2db_name']}])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. I will try to drop() and recreate with new password.')
    announce(f"  * Dropping user '{db_section['tut2rw_user_name']}'...")
    db.command("dropUser", db_section['tut2rw_user_name'])
    OK()

    announce(f"  * Trying to create user '{db_section['tut2rw_user_name']}' again...")
    db.command("createUser", db_section['tut2rw_user_name'], pwd=db_section['tut2rw_user_password'],
               roles=[{'role': 'readWrite', 'db': db_section['tut2db_name']}])
    OK()
else:
    OK()

announce(f"* Creating read-only user '{db_section['tut2ro_user_name']}' for tut2 database...")
pwd = makepassword()
try:
    db.command("createUser", db_section['tut2ro_user_name'], pwd=db_section['tut2ro_user_password'],
               roles=[{'role': 'read', 'db': db_section['tut2db_name']}])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. I will try to drop() and recreate with new password.')
    announce(f"  * Dropping user '{db_section['tut2ro_user_name']}'...")
    db.command("dropUser", db_section['tut2ro_user_name'])
    OK()

    announce(f"  * Trying to create user '{db_section['tut2ro_user_name']}' again...")
    db.command("createUser", db_section['tut2ro_user_name'], pwd=db_section['tut2ro_user_password'],
               roles=[{'role': 'read', 'db': db_section['tut2db_name']}])
    OK()
else:
    OK()


announce(f"* Writing {TUT2CONF_FILENAME}...")
with open(TUT2CONF_FILENAME, 'w') as configfile:
    conf.write(configfile)
OK()


if not admin_user:
    print("")
    print("If you disabled mongodb authentication earlier, you might want to re-enable it.")
    print("  You could use the following commands:")
    print("    sudo sed -i 's/^#auth = true/auth = true/g' %s" % MONGO_CONF_FILENAME)
    print("    sudo service mongodb restart")
    print("")

print("Setup wizard done. Exiting.")