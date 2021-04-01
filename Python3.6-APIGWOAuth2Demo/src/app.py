from datetime import datetime

import flask
from flask import request
import python_jwt as jwt, jwcrypto.jwk as jwk, datetime
from wtforms import TextField, validators, SubmitField, PasswordField
from flask import Flask, render_template, redirect, url_for
from flask_bootstrap import Bootstrap
from flask_wtf import FlaskForm
from wtforms.widgets import PasswordInput

app = Flask(__name__)
app.config['SECRET_KEY'] = 'C2HWGVoMGfNTBsrYQg8EcMrdTimkZfAb'
Bootstrap(app)


class MyPasswordField(PasswordField):
    widget = PasswordInput(hide_value=False)


class LoginForm(FlaskForm):
    username = TextField('Username:', validators=[validators.required()])
    password = MyPasswordField('Password:', validators=[validators.required()])
    submit = SubmitField('Submit')


@app.route('/')
def welcome():
    return "Welcome to APIGateway"


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if request.method == 'POST':

        username = form.username.data
        password = form.password.data
        if username == 'apigw' and password == 'apigwpsw':
            code = "apigwcode"
            return redirect(url_for("generate", code=code), 302)
        else:
            return render_template('error.html')
    return render_template('form.html', form=form)


@app.route('/singlelogin', methods=['GET', 'POST'])
def singlelogin():
    redirect_uri = request.args.get("redirect_uri")
    form = LoginForm()
    if request.method == 'POST':

        username = form.username.data
        password = form.password.data
        if username == 'apigw' and password == 'apigwpsw':
            code = "apigwcode"
            return redirect(url_for("generate_cookie", code=code, redirect_uri=redirect_uri), 302)
        else:
            return render_template('error.html')
    return render_template('form.html', form=form)


def get_file_content(file):
    f = open(file)
    content = f.read()
    return content


@app.route('/verify')
def check():
    token = request.headers['token']
    payload = {'foo': 'bar', 'wup': 90}

    pub_pem = str(get_file_content('public_pem')).encode('utf-8')
    pub_key = jwk.JWK.from_pem(pub_pem)
    try:
        headers, claims = jwt.verify_jwt(jwt=token, pub_key=pub_key, allowed_algs=['RS256'])
        print(headers)
        print(claims)
        result = True
        for k in payload:
            result = result and (claims[k] == payload[k])
        if result is True:
            return "success"
    except Exception as e:
        return "failed"


@app.route('/generate_cookie')
def generate_cookie():
    auth_code = request.args.get("code")
    print(auth_code)
    redirect_uri = request.args.get("redirect_uri")
    print(redirect_uri)
    auth_code_lib = ["apigwcode", "serverlesscode"]
    if auth_code in auth_code_lib:
        priv_pem = str(get_file_content('priv_pem')).encode('utf-8')
        payload = {'foo': 'bar', 'wup': 90}
        priv_key = jwk.JWK.from_pem(priv_pem)
        token = jwt.generate_jwt(claims=payload, priv_key=priv_key, algorithm='RS256',
                                 lifetime=datetime.timedelta(minutes=5))

        resp = flask.make_response(redirect(redirect_uri), 302)

        resp.set_cookie("id_token", value=token)

        return resp
    else:
        return "invalid"


@app.route('/generate')
def generate():
    auth_code = request.args.get("code")
    print(auth_code)
    auth_code_lib = ["apigwcode", "serverlesscode"]
    if auth_code in auth_code_lib:
        priv_pem = str(get_file_content('priv_pem')).encode('utf-8')
        payload = {'foo': 'bar', 'wup': 90}
        priv_key = jwk.JWK.from_pem(priv_pem)
        token = jwt.generate_jwt(claims=payload, priv_key=priv_key, algorithm='RS256',
                                 lifetime=datetime.timedelta(minutes=5))
        return token
    else:
        return "invalid"


@app.route('/code')
def code():
    username = request.args.get("username")
    password = request.args.get("password")

    if username == 'apigw' and password == 'apigwpsw':
        return "apigwcode"
    else:
        return "-1"


if __name__ == '__main__':
    app.run()
