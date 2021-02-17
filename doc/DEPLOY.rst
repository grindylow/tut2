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

We deploy to /srv/tut2::

 cd /srv
 sudo mkdir tut2
 sudo chown martin.martin tut2
 cd tut2/
 git clone https://github.com/grindylow/tut2.git .
 python3 -m virtualenv tut2env -p python3
 source tut2env/bin/activate
 pip install -r tut2app/requirements.txt
 cd tut2app/
 python setup_wizard.py
 sudo service mongodb restart

At this stage you can try running TUT2 with its built-in http server
as follows::

 python runserver.py


Since TUT2 supports on-the-fly user creation now, we can easily create a user on the website now.

WSGI Setup
----------

Roughly following https://flask.palletsprojects.com/en/1.1.x/deploying/mod_wsgi/.

Put the following lines into the corresponding ...ssl.conf, on Ubuntu
16.04LTS this will be /etc/apache2/sites-enabled/010-tut2-ssl.conf, inside
the <IfModule> and <VirtualHost> tags.
::

    # TUT2 WSGI integration
    WSGIDaemonProcess tut2daemonprocess threads=5 home=/srv/tut2/tut2app
    WSGIScriptAlias /tut2 /srv/tut2/tut2app/tut2.wsgi

    <Directory /srv/tut2/tut2app>
        WSGIProcessGroup tut2daemonprocess
        WSGIApplicationGroup %{GLOBAL}
        Require all granted
    </Directory>

@future: add separate lines for the STATIC subdirectory so it doesn't
         have to go through WSGI/Flask?
