var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { NodeClient } = require('ciam-node-sdk'); // node-sdk

const {CLIENT_ID, USER_DOMAIN, REDIRECT_URI, LOGOUT_REDIRECT_URL} = process.env;

// 初始化CIAM Client实例
const ciam = new NodeClient({
  clientId: CLIENT_ID, // 此处为CIAM的应用ID，CIAM应用中获取
  userDomain: USER_DOMAIN, // 此处为租户域名，CIAM域名管理中获取
  redirectUri:REDIRECT_URI, // 此处为回调地址，CIAM应用管理中获取
  logoutRedirectUrl: LOGOUT_REDIRECT_URL, // 此处为退出回调地址，CIAM应用管理中获取
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
// 登录CIAM
app.get('/login', async (req, res) => {
  const url = await ciam.generateAuthUrl();
  res.redirect(url);
})

// 处理redirect回调
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const result = await ciam.fetchToken(code);
  const { access_token, id_token } = result;
  const userInfo = await ciam.getUser();
  req.session.user = { ...userInfo, userInfo };
  res.redirect('/');
})

// 退出CIAM
app.get('/logout', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/');
  }
  const url = await ciam.logout();
  req.session.destroy();
  res.redirect(url);
})

// 登录保护 查看用户信息
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

// Web 类型云函数，只能监听 9000 端口
app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});

