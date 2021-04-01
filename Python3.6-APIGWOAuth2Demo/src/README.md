# oauth-apigateway-python-demo
## 操作步骤
**步骤一：认证服务器和授权服务器的搭建（以flask demo为例）**

1.在API网关官方仓库中下载Flask Demo。 本Demo包含四个API：

`/login`：用于登陆，跳转到登陆页面进行用户名密码认证

`/code`：用于验证用户名密码，颁发授权码

`/generate`：用于验证授权码，颁发token

`/verify`：用于校验token是否有效

2.生成RSA公钥和私钥。使用python3运行produce_key.py，生成public_pem、priv_pem和pulic

3.使用sf部署Flask应用，部署成功后，会生成云函数和对应的API网关访问地址（即认证服务器地址）。


**步骤二：配置API网关的授权API**
1. 在已创建的服务中，创建授权 API，前端配置时，鉴权类型选择 OAuth2.0，OAuth 模式选择授权 API。
2. 后端配置时，认证服务器选择步骤一生成的认证服务器地址，后端路径选择为/generate，重定向地址选择为认证服务器登陆API地址
token 位置选择 Header，公钥为执行文件 produce_key.py 生成的 public 文件中的内容，创建完成后单击【完成】。

**步骤三：配置API网关的业务API**
1. 在授权 API 的服务中，创建业务 API，前端配置时，鉴权类型选择 OAuth2.0，OAuth 模式选择业务 API，关联授权 API 选择刚刚创建的授权API。
2. 后端配置时，后端类型选择 Mock 类型，返回 hello world。

**步骤四：验证**
1. 访问业务API，会自动重定向到登陆页面，输入用户名apigw，密码apigwpsw，获取token。
2. 将token放在Authorization Header中请求业务API。




