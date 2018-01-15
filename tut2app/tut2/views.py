from flask import render_template,request,flash,redirect,url_for,jsonify
from flask_login import login_user,logout_user,login_required,current_user
from tut2 import app
from tut2 import login_manager
from tut2.model import model
from tut2.model import users
from pymongo import MongoClient

mymodel = model.Model()

@app.route("/")
def hello():
    return render_template("home.html")

@login_manager.user_loader
def load_user(userid):
    return users.User.retrieve_based_on_id(userid)
login_manager.login_view = 'login'

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.form:
        # login and validate the user...
        myuser = users.User.retrieve_based_on_given_credentials(
            name = request.form['username'],
            password = request.form['password'])
        if not myuser:
            flash("invalid credentials")
        else:
            login_user(myuser)
            flash("Logged in successfully.")
            return redirect(url_for("track"))
            # @future: could request.args.get("next") or , but make sure to VALIDATE next!
    return render_template("login.html")

@app.route("/logout")
def logout():
    logout_user()
    flash('Logged out.')
    return redirect(url_for("details"))

@app.route("/details")
def details():
    return render_template("userdetails.html")

@app.route("/reports")
@login_required
def reports():
    report = mymodel.generate_report()   # @future: startdate,enddate,timezone,etc,etc
    return render_template('report_generic.html')

@app.route("/track")
@login_required
def track():
    entries = []
    return render_template("page1.html",entries=entries)

@app.route("/api_queryentries")
@login_required
def api_queryentries():
    """Retrieve (new) entries from server, starting from (server-side) revision fromRev.
       @returns Array of entries, not necessarily in any guaranteed order.
       see tut2model_serverstub:queryEntries()
    """

    # entries will look something like this:
    entries = [ 
                { 'deleted': False,
                  'logentry': 'First entry from server',
                  'project':  'SERV.001.10',
                  'revision': 37,
                  'starttime_utc_ms': 22345678,
                  'uid': 'cb98eff3-8a04-4165-b8c0-76e30ae9fdf8' },
                { 'deleted': False,
                  'logentry': 'Another entry from server',
                  'project':  'SERV.277.10',
                  'revision': 118,
                  'starttime_utc_ms': 32345678,
                  'uid': 'db98eff3-8a04-4165-b8c0-76e30ae9fdf8' }
              ]

    fromrev = request.args.get('fromrev', 0, type=int)
    entries = mymodel.queryEntries(fromrev, current_user.get_uid())
    r = { 'r':0,    # 0=OK, 1=NOT_AUTHORISED, ... (or use HTTP ERROR CODES!!!!)
          'entries': entries,
          '_debug_fromrev': fromrev }
    return jsonify(r)


@app.route("/api_addorupdateentry", methods=['POST'])
@login_required
def api_addorupdateentry():
    """Add the given entry (or update it if it exists already)
       @returns Server-side revision number of newly created (updated) entry
       see tut2model_serverstub:addOrUpdateEntry()
    """
    entries = request.get_json()['entries']   # this is the parsed JSON string (i.e. a dict)
    revnrs = mymodel.addOrUpdateEntries(entries, current_user.get_uid())

    r = { 'r':0,    # 0=OK, 1=NOT_AUTHORISED, ... (or use HTTP ERROR CODES!!!!)
          'revnrs':revnrs,
          # [...]
        }
    return jsonify(r)
