var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { NodeClient } = require('ciam-node-sdk'); 
const jwtDecode = require('jwt-decode');

// Initialize CIAM Client instance，parameter configuration reference README.md
// CIAM console link guide：https://console.cloud.tencent.com/ciam
const ciam = new NodeClient({
  clientId: "MDQ1ZmY4OTFkODE3NGEwYmJhNTJmYjY5YTRlNzcyNWY", 
  clientSecret: 'Tgi9mcKYEzWBA2pKYnxg671qtTyjcfHB',
  userDomain: "https://shingao.portal.tencentciam.com", 
  redirectUri: "https://service-o4u73cst-1253509498.sh.apigw.tencentcs.com/release/callback",
  logoutRedirectUrl: "https://service-o4u73cst-1253509498.sh.apigw.tencentcs.com/release/",
  scopes: ['openid'],
});

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
  const { access_token, id_token, expires_in } = result;
  const user = jwtDecode(id_token);
  
  const displayName = user.nickname || user.userName ||  user.email || user.phoneNumber || '';

  res.cookie('CIAM_ACCESS_TOKEN', access_token, {maxAge: expires_in*1000});
  res.cookie('CIAM_DISPLAY_NAME', displayName, {maxAge: expires_in*1000});
  res.redirect('/');
})

// CIAM logout
app.get('/logout', async (req, res) => {
  if (!req.cookies['CIAM_ACCESS_TOKEN']) {
    res.redirect('/');
    return;
  }
  res.clearCookie('CIAM_ACCESS_TOKEN');
  res.clearCookie('CIAM_DISPLAY_NAME');
  const url = await ciam.logout();
  res.redirect(url);
})

// Get user information under CIAM Certification protection
app.get('/userinfo', async (req, res) => {
  const { ciamAccessToken } = req.query;
  if (!ciamAccessToken) {
    res.status(400).send('The param ciamAccessToken is not found');
  }

  const userInfo = await ciam.fetchUserInfo(decodeURIComponent(ciamAccessToken));
  res.json(userInfo);
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

