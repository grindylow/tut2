from flask import Flask,render_template,jsonify,request
from flask_debugtoolbar import DebugToolbarExtension
from flask.ext.login import *

login_manager = LoginManager()
app = Flask(__name__)
login_manager.init_app(app)

# the toolbar is only enabled in debug mode:
app.debug = True

# set a 'SECRET_KEY' to enable the Flask session cookies
# we read the key from a file, which we exclude from
# the source repository
f=open("flask_secret_key","r")
app.config['SECRET_KEY']=f.read()
f.close() 

toolbar = DebugToolbarExtension(app)

@app.route("/")
def hello():
    return render_template("home.html")

@login_manager.user_loader
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


if __name__ == "__main__":
    app.run(host='0.0.0.0')
