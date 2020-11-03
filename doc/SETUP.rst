Development Environment Setup Instructions
==========================================

TUT2 is implemented in Python, and utilises a number of
libraries. The following sections describe one possible way of setting
up a working environment for TUT2.

This assumes a basic Ubuntu 16.04 (LTS) setup to begin with.


Python/Virtualenv setup
-----------------------

...make sure that venv is available::

    sudo apt-get install python3-venv

In a directory parallel to where TUT2 is located::

    python3 -m venv tut2env
    source tut2env/bin/activate


Other (Ubuntu) Packages
-----------------------

::
   
    sudo apt-get install mongodb



Python required packages
------------------------

Frameworks, interface layers, etc.::

  $ pip install -r requirements.txt

The above will also install the database backend (pymongo).

Not strictly necessary, but very useful::

  pip install ipython


MongoDB
-------

::
   
  # sed -i 's/^#auth = true/auth = true/g' /etc/mongodb.conf


  mongo
  use admin
  db.createUser(
    {
      user: "theUserAdmin",
      pwd: "abc123",
      roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
    }
  )

