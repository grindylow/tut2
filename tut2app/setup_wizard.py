#!/usr/bin/env python3
#import grep
from pymongo import MongoClient
import pymongo.errors
import configparser
import sys
import os.path
import string
import random

SECRETS_FILENAME = 'secrets.conf'
PASSWORD_LENGTH = 20

MONGO_CONF_FILENAME = '/etc/mongodb.conf'
MONGO_ADMIN_USER_NAME = 'theUserAdmin'
TUT2DB_NAME = 'tut2db'
TUT2RW_USER_NAME = 'tut2rw'
TUT2RO_USER_NAME = 'tut2ro'

secrets = configparser.ConfigParser()
secrets.optionxform = str  # preserve case in section/key names
secrets['passwords'] = {}
pwsection = secrets['passwords']

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

print("Welcome to the TUT2 setup wizard")
print("--------------------------------\n")

announce('Checking if "%s" exists already...' % SECRETS_FILENAME)
if os.path.isfile(SECRETS_FILENAME):
    print("Exists. Aborting.\n")
    exit(1)
else:
    print(" No. Good.")

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
pwsection[MONGO_ADMIN_USER_NAME] = pwd
try:
    db.command("createUser", MONGO_ADMIN_USER_NAME, pwd=pwd,
               roles = ["userAdminAnyDatabase"])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. moving on.')
else:
    OK()

announce("Creating read/write user for adminstrating tut2 database...")
pwd = makepassword()
pwsection[TUT2RW_USER_NAME] = pwd
try:
    db.command("createUser", TUT2RW_USER_NAME, pwd=pwd,
               roles = [{'role':'readWrite', 'db':TUT2DB_NAME}])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. moving on.')
else:
    OK()

announce("Creating read-only user for tut2 database...")
pwd = makepassword()
pwsection[TUT2RO_USER_NAME] = pwd
try:
    db.command("createUser", TUT2RO_USER_NAME, pwd=pwd,
               roles = [{'role':'read', 'db':TUT2DB_NAME}])
except pymongo.errors.DuplicateKeyError:
    OKish('already exists. moving on.')
else:
    OK()

announce("Enabling auth in %s..." % MONGO_CONF_FILENAME)
os.system("sudo sed -i 's/^#auth = true/auth = true/g' %s" % MONGO_CONF_FILENAME)
OKish("Probably went OK. Didn't check.")

announce("Writing %s..." % SECRETS_FILENAME)
with open(SECRETS_FILENAME, 'w') as configfile:
    secrets.write(configfile)
OK()

print("Make sure you restart mongodb for changes to take effect.")
print("You could use: sudo service mongodb restart")
    
#logger.debug("retrieving latest revision number...")
#entry = db.tut2entries.find_one(sort=[("revision", -1)])

