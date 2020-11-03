Deployment Instructions on Ubuntu 16.04LTS
==========================================

These are instructions for deploying TUT2 on a default
Ubuntu 16.04LTS installation.

Created 2018-01-23ff.

Refer to SETUP for more detailed explanations of certain
steps.


Base System Setup
-----------------
::
   
    sudo apt install python3-virtualenv apache2 libapache2-mod-wsgi-py3 mongodb git


TUT2 Setup
----------

We deploy to /src/tut2::

 cd /srv
 sudo mkdir tut2
 sudo chown martin.martin tut2
 cd tut2/
 git clone https://github.com/grindylow/tut2.git
 python3 -m virtualenv tut2env -p python3
 source tut2env/bin/activate
 pip install flask flask-debugtoolbar flask-login pymongo
 cd tut2/tut2app/
 python setup_wizard.py
 sudo service mongodb restart

At this stage you can try running TUT2 with its built-in http server
as follows::

 python runserver.py


Since TUT2 doesn't support on-the-fly user creation yet, we will need
to create a user before we can do anything useful. Alternatively,
this is where we would restore an existing database.
::

    cat secrets.conf
    mongo admin -u tut2rw -p '...'   # Password for 'tut2rw' user taken from secrets.conf, created by setup_wizard.py
    use tut2db
    db.tut2users.insert({id:'user1', salt:'...', fullname:'Krub Bub', tut2_uid:'user1-x',password_hash:'...'})

Now try to log in via the web interface. Watch the log output.
::

    db.tut2users.remove({id:'user1'})
    # then insert again with correct hash taken from logging output


WSGI Setup
----------

Roughly following http://flask.pocoo.org/docs/0.12/deploying/mod_wsgi.

Put the following lines into the corresponding ...ssl.conf, on Ubuntu
16.04LTS this will be /etc/apache2/sites-enabled/default-ssl.conf, inside
the <IfModule> and <VirtualHost> tags.
::

    # TUT2 WSGI integration
    WSGIDaemonProcess tut2daemonprocess threads=5 home=/srv/tut2/tut2/tut2app
    WSGIScriptAlias /tut2 /srv/tut2/tut2/tut2app/tut2.wsgi

    <Directory /srv/tut2/tut2/tut2app>
        WSGIProcessGroup tut2daemonprocess
        WSGIApplicationGroup %{GLOBAL}
    	Require all granted
    </Directory>

@future: add separate lines for the STATIC subdirectory so it doesn't
         have to go through WSGI/Flask?
