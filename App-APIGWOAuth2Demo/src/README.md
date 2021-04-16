# oauth-apigateway-python-demo
## 操作步骤
**步骤一：认证服务器和授权服务器的搭建**

1.使用该模板创建云函数。 本Demo为使用Flask构建的应用，包含四个API：

`/login`：用于登陆，跳转到登陆页面进行用户名密码认证

`/code`：用于验证用户名密码，颁发授权码

`/generate`：用于验证授权码，颁发token

`/verify`：用于校验token是否有效


**步骤二：配置API网关的认证API**
1. 在已创建的服务中，创建API用于认证，前端配置时，方法配置为ANY，后端选择使用该模板创建的云函数。

**步骤三：配置API网关的授权API**
1. 在已创建的服务中，创建授权 API，前端配置时，鉴权类型选择 OAuth2.0，OAuth 模式选择授权 API。
2. 后端配置选择使用该模板创建的云函数，后端路径选择为/generate，重定向地址选择步骤二中认证API的公网访问地址，
token 位置选择 Header，公钥为项目中 public 文件中的内容，创建完成后单击【完成】。

**步骤四：配置API网关的业务API**
1. 在授权 API 的服务中，创建业务 API，前端配置时，鉴权类型选择 OAuth2.0，OAuth 模式选择业务 API，关联授权 API 选择刚刚创建的授权API。
2. 后端配置时，后端类型选择 Mock 类型，返回 hello world。

**步骤五：验证**
1. 访问业务API，会自动重定向到登陆页面，输入用户名apigw，密码apigwpsw，获取token。
2. 将token放在Authorization Header中请求业务API。




