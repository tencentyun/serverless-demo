# 安装依赖

运行以下命令安装项目依赖：

```bash
$ yarn
```

# 填写你的应用配置

在 app.js 修改配置为你的应用配置：

```js
// 初始化CIAM Client实例
const ciam = new NodeClient({
  clientId: CLIENT_ID, // 此处为CIAM的应用ID，CIAM应用中获取
  userDomain: USER_DOMAIN, // 此处为租户域名，CIAM域名管理中获取
  redirectUri:REDIRECT_URI, // 此处为回调地址，CIAM应用管理中获取
  logoutRedirectUrl: LOGOUT_REDIRECT_URL, // 此处为退出回调地址，CIAM应用管理中获取
  scopes: ['openid'],
  protocol: 'OIDC_PKCE',
});
```

# 运行

运行本示例程序：

```bash
$ yarn run  start
```

