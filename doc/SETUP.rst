Development Environment Setup Instructions
==========================================

TUT2 is implemented in Python, and utilises a number of
libraries. The following sections describe one possible way of setting
up a working environment for TUT2.

This assumes a basic Ubuntu 16.04 (LTS) setup to begin with.


Python/Virtualenv setup
-----------------------

...as documented on http://www.virtualenv.org/en/latest/::

    sudo apt-get install python-pip python-virtualenv

In .../virtualenvs::

    virtualenv tut2env -p python3
    source tut2env/bin/activate


Other (Ubuntu) Packages
-----------------------

::
   
    sudo apt-get install mongodb



Python required packages
------------------------

Frameworks, interface layers, etc.::

    pip install flask flask-debugtoolbar flask-login

For database backend::

    pip install pymongo
    #pip install flask-mongoengine

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
