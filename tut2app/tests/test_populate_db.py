#!/usr/bin/env python
# -*- coding: utf-8 -*-

import datetime
import random
import requests
import sys

if len(sys.argv) < 3:
    print("Usage: python test_populate_db.py <username> <password>")
    sys.exit(1)

# Configuration
LOGIN_URL = "http://127.0.0.1:5000/login"
ADD_URL = "http://127.0.0.1:5000/api_addorupdateentry"
USERNAME = sys.argv[1]
PASSWORD = sys.argv[2]

# Global variable to store the session (to maintain the login state)
session = None

def login_to_website(login_url, username, password):
    """Logs in to a website using a POST request."""
    global session
    payload = {
        "email": username,
        "password": password
    }

    try:
        # Send the POST request
        session = requests.Session()
        response = session.post(login_url, data=payload)

        # Check if the login was successful
        if response.status_code == 200:
            print("Login successful!")
            # print("Response:", response.text)  # Optional: Print response content
        else:
            print(f"Login failed. Status code: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"An error occurred: {e}")

def add_an_entry(add_url, entry):
    """Adds an entry to the database using a POST request."""
    global session
    payload = {
        'entries': [entry]
    }
    
    print("Adding entry:", entry)

    try:
        # Send the POST request
        response = session.post(add_url, json=payload)

        # Check if the request was successful
        if response.status_code == 200:
            print("Entry added successfully!")
            # print("Response:", response.text)  # Optional: Print response content
        else:
            print(f"Failed to add entry. Status code: {response.status_code}")
            print("Response:", response.text)
    except Exception as e:
        print(f"An error occurred: {e}")

def make_entry(starttime_utc_ms=None):
    # Generate a random project name, from a pool of many possible projects
    projects = [
    "ACHIEVE", "BALANCE", "CROSSROAD", "DYNAMIC", "ELEVATE", "FOCUS", "GENESIS", "HARMONY",
    "IGNITE", "JUNCTION", "KINDLE", "LUMINOSITY", "MAGNITUDE", "NAVIGATE", "ORIGIN", "PRISM",
    "QUINTESSENCE", "RADIANCE", "SPECTRUM", "TRANSFORM", "UPLIFT", "VANGUARD", "WISDOM",
    "XENITH", "YONDER", "ZEAL", "AMPLIFY", "BEACON", "CHARISMA", "DRIFT", "EMPOWER", "FOUNTAIN",
    "GLORY", "HORIZON", "IMPACT", "JOURNEY", "KINETIC", "LEGEND", "MONUMENT", "NURTURE",
    "ODYSSEY", "PURSUIT", "QUEST", "RHYTHM", "SYNERGY", "TEMPO", "UNITY", "VIBRANCE", "WONDER",
    "XENON", "YEARN", "ZEST"]
    project = random.choice(projects)

    # ...and append a subproject number
    project += "." + str(random.randint(1, 10)*10)

    # Now generate a random log entry
    logentry = generate_sentence()
    
    return {
        'deleted': False,
        'logentry': logentry,
        'project': project,
        'revision': 36,
        'starttime_utc_ms': starttime_utc_ms,
        'uid': gen_uid()
    }

def gen_uid():
    """Make a UUID in the format cb98eff3-8a04-4165-b8c0-76e30ae9fdf8"""
    import uuid
    return str(uuid.uuid4())

# Expanded list of random words categorized by part of speech
nouns = [
    'dog', 'cat', 'bird', 'car', 'house', 'computer', 'city', 'tree', 'book', 'friend',
    'apple', 'mountain', 'sun', 'moon', 'flower', 'school', 'team', 'music', 'ocean', 'coffee',
    'fish', 'phone', 'desk', 'window', 'beach', 'computer', 'socks', 'elephant', 'universe',
    'mountain', 'ball', 'keyboard', 'pen', 'planet', 'doctor', 'teacher', 'child', 'parent', 'street'
]
verbs = [
    'runs', 'jumps', 'flies', 'drives', 'eats', 'sleeps', 'writes', 'reads', 'plays', 'sings',
    'walks', 'talks', 'thinks', 'screams', 'studies', 'helps', 'paints', 'builds', 'dances', 'swims',
    'explores', 'creates', 'draws', 'hopes', 'climbs', 'laughs', 'questions', 'teaches', 'lifts', 'bakes'
]
adjectives = [
    'quick', 'lazy', 'beautiful', 'tall', 'small', 'bright', 'interesting', 'happy', 'angry', 'strong',
    'hot', 'cold', 'silent', 'loud', 'big', 'small', 'quiet', 'friendly', 'warm', 'hard',
    'soft', 'colorful', 'amazing', 'peaceful', 'dangerous', 'funny', 'calm', 'rich', 'poor', 'new',
    'modern', 'ancient', 'peaceful', 'blue', 'green', 'red', 'round', 'fast', 'rare', 'rare'
]
adverbs = [
    'quickly', 'lazily', 'beautifully', 'slowly', 'noisily', 'eagerly', 'sadly', 'happily', 'angrily', 'bravely',
    'elegantly', 'rudely', 'calmly', 'boldly', 'tactfully', 'carefully', 'nervously', 'gently', 'warmly', 'gracefully',
    'patiently', 'sadly', 'smoothly', 'carelessly', 'joyfully', 'efficiently', 'brightly', 'unpredictably', 'sluggishly', 'viciously'
]

# Function to generate a random sentence
def generate_sentence():
    subject = random.choice(nouns)  # Choose a random noun
    verb = random.choice(verbs)     # Choose a random verb
    object_ = random.choice(nouns)  # Choose another random noun for the object
    adjective = random.choice(adjectives)  # Choose a random adjective
    adverb = random.choice(adverbs)       # Choose a random adverb
    
    # Construct a random sentence
    sentence = f"The {adjective} {subject} {verb} {adverb} and sees a {adjective} {object_}."
    return sentence


if __name__ == "__main__":
    login_to_website(LOGIN_URL, USERNAME, PASSWORD)
    add_an_entry(ADD_URL, make_entry())

    starttime = datetime.datetime(2022, 1, 1).timestamp() * 1000
    endtime = datetime.datetime(2024, 12, 31).timestamp() * 1000

    currenttime = starttime

    while currenttime < endtime:
        add_an_entry(ADD_URL, make_entry(starttime_utc_ms=currenttime))
        currenttime += random.randint(30, 60*60*7) * 1000
