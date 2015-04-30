from flask import render_template,request,flash,redirect,url_for,jsonify
from flask.ext.login import login_user,logout_user,login_required
from tut2 import app,login_manager,model

login_manager.login_view = "login"

@app.route("/")
def hello():
    return render_template("home.html")

@login_manager.user_loader
def load_user(userid):
    return model.User.retrieve_based_on_id(userid)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.form:
        # login and validate the user...
        user=model.User.retrieve_based_on_given_credentials(name=request.form['username'],password=request.form['password'])
        if not user:
            flash("invalid credentials")
        else:
            login_user(user)
            flash("Logged in successfully.")
        return redirect(request.args.get("next") or url_for("details"))
    return render_template("login.html")

@app.route("/logout")
#@login_required
def logout():
    logout_user()
    return redirect(url_for("details"))

@app.route("/forloggedinonly")
@login_required
def forloggedinonly():
    return render_template("userdetails.html")

@app.route("/details")
def details():
    return render_template("userdetails.html")

@app.route("/track")
def track():
    entries = [ 
        {'starttime':'11:22'},
        {'starttime':'11:20'},
        {'starttime':'07:49'},
        {'section':'2014-12-27 (Tuesday)','starttime':'17:25'},
        {'starttime':'12:45'} ]
    return render_template("page1.html",entries=entries)

@app.route("/queryentries")
# @todo @login_required
def api_queryentries():
    """Retrieve (new) entries from server, starting from (server-side) revision fromRev.
       @returns Array of entries, not necessarily in any guaranteed order.
       see tut2model_serverstub:queryEntries()
    """

    fromRev = request.args.get('fromrev', 0, type=int)
    r = { 'r':0,    # 0=OK, 1=NOT_AUTHORISED, ... (or use HTTP ERROR CODES!!!!)
          'entries': [],
          'debug_fromRev': fromRev }
    return jsonify(r)

@app.route("/")
def index():
    pass
