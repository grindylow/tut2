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
SECRETS_FILENAME = os.path.join(CONF_PATH, 'secrets.conf')

PASSWORD_LENGTH = 20

MONGO_CONF_FILENAME = '/etc/mongodb.conf'
MONGO_ADMIN_USER_NAME = 'theUserAdmin'

secrets = configparser.ConfigParser()
secrets.optionxform = str  # preserve case in section/key names
mongodbsection = secrets['mongodb'] = {}

def makepassword():
    cs = string.digits + string.ascii_letters + '!#$&()*+,-./:;<=>?@[]^_{|}~'
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


def set_up_mongodb():
    announce("Checking if mongodb auth mode is enabled...")
    print("NOT IMPLEMENTED\n")

    announce("Connecting to mongodb...")
    client = MongoClient()
    OK()

    announce("Creating database accessor for admin database...")
    db = client.admin
    print("OK")

    announce("Creating admin user with rights to create other users...")
    pwd = makepassword()
    mongodbsection["mongo_admin_user_name"] = MONGO_ADMIN_USER_NAME
    mongodbsection["mongo_admin_user_password"] = pwd
    try:
        db.command("createUser", MONGO_ADMIN_USER_NAME, pwd=pwd,
                   roles=["userAdminAnyDatabase"])
    except pymongo.errors.DuplicateKeyError:
        OKish('already exists. moving on.')
    else:
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

If no mongo admin user account is specified, I will (try) to configure the local mongodb
server to have an admin user that is able to create data access users and a database and for tut2.

I will store the credentials for this admin user in {SECRETS_FILENAME} for future reference.

I will then create users with r/o and r/w access to the tut2 database.

tut2 will take care of initially populating its database on startup. 
""")


announce('Checking if "%s" exists already...' % SECRETS_FILENAME)
if os.path.isfile(SECRETS_FILENAME):
    print(" Exists. So things are probably already set up appropriately. ")
    print(" Or at least we don't want to mess things up.")
    print(" Therefore we are aborting the initial set-up process, but that's OK!")
    exit(0)
else:
    print(" No. Good.")

announce('Checking if "%s" exists already...' % TUT2CONF_FILENAME)
if os.path.isfile(TUT2CONF_FILENAME):
    print(" Exists. So things are probably already set up appropriately. Or at least we don't want to mess things up.")
    print(" Aborting.")
    exit(2)
else:
    print(" No. Good.")


# If mongodb access details are specified in any environment variables, we skip the mongodb configuration steps
# and move right on to setting up the database environment for tut2.
announce("Checking if environment variables for auto-configuration exist (TUT2_MONGODB_ADMIN_USER)...")
secrets_section = {}

if "TUT2_MONGODB_ADMIN_USER" not in os.environ:
    OKish("\n TUT2_MONGODB_ADMIN_USER environment variable NOT found. Setting up mongodb from scratch.")
    secrets_section = {"mongodb_admin_user": "tut2adminuser",
                       "mongodb_admin_password": makepassword()
                       }
else:
    OKish("\n TUT2_MONGODB_ADMIN_USER environment variable found. Using these credentials.")
    secrets_section = {"mongodb_admin_user": os.environ.get("TUT2_MONGODB_ADMIN_USER"),
                       "mongodb_admin_password": os.environ.get("TUT2_MONGODB_ADMIN_PASSWORD")
                       }

announce(f"Creating config directory '{CONF_PATH}' (if it doesn't exist already)...")
os.makedirs(CONF_PATH, exist_ok=True)
OK()

secrets = configparser.ConfigParser()
secrets["secrets"] = secrets_section
announce(f"Writing {SECRETS_FILENAME}...")
with open(SECRETS_FILENAME, 'w') as configfile:
    secrets.write(configfile)
OK()

if "TUT2_MONGODB_ADMIN_USER" not in os.environ:
    set_up_mongodb()

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

announce("Generating a 'secret key' for flask session management...")
key_section = {"flask_secret_key": makepassword()}
conf['keys'] = key_section
OK()


announce(f"Writing {TUT2CONF_FILENAME}...")
with open(TUT2CONF_FILENAME, 'w') as configfile:
    conf.write(configfile)
OK()

OKish(f"Creating read/write user '{db_section['tut2rw_user_name']}' for administrating tut2 database...")

announce(f"Connecting to database '{db_section['userdb_name']}'...")
client = MongoClient(host=db_section['mongodb_host'], port=db_section['mongodb_port'],
                     username=secrets_section['mongodb_admin_user'],
                     password=secrets_section['mongodb_admin_password'])
client.server_info()
db = client[db_section['userdb_name']]

try:
    db.command("createUser", db_section['tut2rw_user_name'], pwd=db_section['tut2rw_user_password'],
               roles=[{'role': 'readWrite', 'db': db_section['tut2db_name']}])
except pymongo.errors.OperationFailure:
    OKish('already exists. I will stop here.')
    exit(0)
else:
    OK()

announce("Creating read-only user for tut2 database...")
pwd = makepassword()
try:
    db.command("createUser", db_section['tut2ro_user_name'], pwd=db_section['tut2ro_user_password'],
               roles=[{'role':'read', 'db': db_section['tut2db_name']}])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. moving on.')
else:
    OK()



#logger.debug("retrieving latest revision number...")
#entry = db.tut2entries.find_one(sort=[("revision", -1)])

