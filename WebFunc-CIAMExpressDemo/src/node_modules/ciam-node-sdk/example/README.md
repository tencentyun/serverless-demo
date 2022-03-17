# 安装依赖

运行以下命令安装项目依赖：

```bash
$ yarn
```

# 填写你的应用配置

在 app.js 修改配置为你的应用配置：

```js
const ciam = new NodeClient({
  clientId: 'NjczNGNlMDUxZTY5NGQ5NmE2M2EyMTAyYTk0NWY1ZGI',
  userDomain: 'https://shingao.test.tencentciam.com',
  redirectUri:'https://express.tencentciam.com/callback',
  logoutRedirectUrl: 'https://express.tencentciam.com/',
  scopes: ['openid'],
  protocol: 'OIDC_PKCE',
});
```

# 运行

运行本示例程序：

```bash
$ yarn run  start
```

