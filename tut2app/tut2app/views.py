from flask import render_template, request, flash, redirect, url_for, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from tut2app import app
from tut2app import login_manager
from tut2app.model import model
from tut2app.model import users
import logging
import re
from email_validator import validate_email, EmailNotValidError

mymodel = model.Model()  # this might not be right - does it need to go into 'g'?
login_manager.login_view = 'login'


@app.route("/")
def hello():
    return render_template("home.html")


@login_manager.user_loader
def load_user(email):
    return users.User.retrieve_based_on_email(email)

def create_user(email, password):
    logging.info("Verified Credentials.")
    logging.debug("Email: " + email)
    logging.debug("Password: " + password)
    return users.User.create_user(email, password)

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.form:
        # validate the entries
        logging.debug("Validating the entries.")
        email = request.form['email']
        password = request.form['password']
        error_str = check_sign_up_credentials(email, password)
        if error_str == "":
            # Credentials are ready for sign up
            if (create_user(email, password)):
                flash("Successfully created user.")
            else:
                flash("Error while creating user.")
            pass
        else:
            flash(error_str)

    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.form:
        # login and validate the user...
        my_user = users.User.retrieve_based_on_given_credentials(
            email=request.form['email'],
            password=request.form['password'])
        if not my_user:
            flash("Invalid credentials.")
        else:
            login_user(my_user)
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


@app.route("/reports", methods=["GET", "POST"])
@login_required
def reports():
    report = []
    if request.form:
        starttime = request.form['starttime']
        endtime = request.form['endtime']
        exclude_regex = request.form['exclude_regex']
        report = mymodel.generate_report(current_user.get_tut2uid())  # @future: startdate,enddate,timezone,etc,etc
    return render_template('report_generic.html', report=report)


REGEX_PASSWORD = "^.{3,30}$"  # Everything

"""
Check if an email address is valid.
"""
def val_email(email: str) -> bool:
    try:
        validate_email(email) # Throws EmailNotValidError when invalid.
        # Email is valid.
        return True
    except EmailNotValidError as e:
        # Email is invalid.
        return False

def check_sign_up_credentials(email: str, password: str) -> str:
    error_str = ""
    if not val_email(email):
        error_str = "Invalid Email"
    elif not re.search(REGEX_PASSWORD, password):
        error_str = "Invalid password"
    elif users.User.retrieve_based_on_email(email):
        error_str = "Email already taken"
    return error_str

@app.route("/report_table", methods=["GET", "POST"])
@login_required
def report_table():
    """Simple report adding up project durations between given times."""
    report = []
    starttime = request.args.get('starttime', 1, type=int)
    endtime = request.args.get('endtime',100, type=int)
    interval = request.args.get('interval',10, type=int)
    currenttime = request.args.get('currenttime',10, type=int)
    logging.info("report_table(%s)", (starttime, endtime, interval))

    reportdata = mymodel.generate_report(current_user.get_tut2uid(),
        starttime_ms=starttime, endtime_ms=endtime, interval_ms=interval,
        currenttime_ms=currenttime, maxiter=20)

    return render_template('report_table_fragment.html', reportdata=reportdata)


@app.route("/track")
@login_required
def track():
    entries = []
    return render_template("page2.html", entries=entries)


@app.route("/api_queryentries")
@login_required
def api_queryentries():
    """Retrieve (new) entries from server, starting from (server-side) revision fromRev.
       @returns Array of entries, not necessarily in any guaranteed order.
       see tut2model_serverstub:queryEntries()
    """

    # entries will look something like this:
    entries = [
        {'deleted': False,
         'logentry': 'First entry from server',
         'project': 'SERV.001.10',
         'revision': 37,
         'starttime_utc_ms': 22345678,
         'uid': 'cb98eff3-8a04-4165-b8c0-76e30ae9fdf8'},
        {'deleted': False,
         'logentry': 'Another entry from server',
         'project': 'SERV.277.10',
         'revision': 118,
         'starttime_utc_ms': 32345678,
         'uid': 'db98eff3-8a04-4165-b8c0-76e30ae9fdf8'}
    ]

    fromrev = request.args.get('fromrev', 0, type=int)
    entries = mymodel.queryEntries(fromrev, current_user.get_tut2uid())
    r = {'r': 0,  # 0=OK, 1=NOT_AUTHORISED, ... (or use HTTP ERROR CODES!!!!)
         'entries': entries,
         '_debug_fromrev': fromrev}
    return jsonify(r)


@app.route("/api_addorupdateentry", methods=['POST'])
@login_required
def api_addorupdateentry():
    """Add the given entry (or update it if it exists already)
       @returns Server-side revision number of newly created (updated) entry
       see tut2model_serverstub:addOrUpdateEntry()
    """
    entries = request.get_json()['entries']  # this is the parsed JSON string (i.e. a dict)
    revnrs = mymodel.addOrUpdateEntries(entries, current_user.get_tut2uid())

    r = {'r': 0,  # 0=OK, 1=NOT_AUTHORISED, ... (or use HTTP ERROR CODES!!!!)
         'revnrs': revnrs,
         # [...]
         }
    return jsonify(r)
