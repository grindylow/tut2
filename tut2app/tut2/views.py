from flask import render_template,request
from tut2 import app

@app.route("/")
def hello():
    return render_template("home.html")

#@login_manager.user_loader
def load_user(userid):
    return User.get(userid)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.form:
        # login and validate the user...
        user={}
        login_user(user)
        flash("Logged in successfully.")
        return redirect(request.args.get("next") or url_for("index"))
    return render_template("login.html")

@app.route("/track")
def track():
    entries = [ 
        {'starttime':'11:22'},
        {'starttime':'11:20'},
        {'starttime':'07:49'},
        {'section':'2014-12-27 (Tuesday)','starttime':'17:25'},
        {'starttime':'12:45'} ]
    return render_template("page1.html",entries=entries)

