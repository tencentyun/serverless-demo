# 安装依赖

运行以下命令安装项目依赖：

```bash
$ npm install
```

# 填写你的应用配置

在 app.js 第 7 行，修改配置为你的应用配置：

```js
const authing = new AuthenticationClient({
  appId: 'APP_ID',
  secret: 'APP_SECRET',
  appHost: 'https://{你的域名}.authing.cn',
  redirectUri: 'http://localhost:5000/callback'
});
```

# 运行

运行本示例程序：

```bash
$ npm start
```

# 参考文档

[Express Web App 快速开始](https://docs.authing.cn/v2/quickstarts/webApp/nodeJsExpress.html)
