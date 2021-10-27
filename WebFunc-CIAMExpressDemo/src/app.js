var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { NodeClient } = require('ciam-node-sdk'); 

// Initialize CIAM Client instance，parameter configuration reference README.md
// CIAM console link guide：https://console.cloud.tencent.com/ciam
const ciam = new NodeClient({
  clientId: "your-clientId", 
  userDomain: "your-userDomain", 
  redirectUri: "your-redirectUri",
  logoutRedirectUrl: "your-logoutRedirectUrl",
  scopes: ['openid'],
  protocol: 'OIDC_PKCE',
});

const session = require('express-session');
var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'a very long random string',
  resave: true,
  saveUninitialized: false
}));

app.use('/', indexRouter);
// CIAM login
app.get('/login', async (req, res) => {
  const url = await ciam.generateAuthUrl();
  res.redirect(url);
})

// CIAM redirect
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const result = await ciam.fetchToken(code);
  const { access_token, id_token } = result;
  const userInfo = await ciam.getUser();
  req.session.user = { ...userInfo, userInfo };
  res.redirect('/');
})

// CIAM logout
app.get('/logout', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/');
  }
  const url = await ciam.logout();
  req.session.destroy();
  res.redirect(url);
})

// Get user information under CIAM Certification protection
app.get('/userinfo', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  res.send(JSON.stringify(req.session.user, null, 4))
})

app.get('/404', (req, res) => {
  res.status(404).send('Not found');
});

app.get('/500', (req, res) => {
  res.status(500).send('Server Error');
});

// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

// listen 9000 port
app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});

