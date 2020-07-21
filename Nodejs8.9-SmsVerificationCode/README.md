## serverless+腾讯云短信实现短信验证码登录
### 功能
#### 发送短信验证码
请求参数：
| 字段 |类型|说明|
| ----- | ----- | ----- |
| method|string|请求方法，值为getSms|
|phone|string|手机号，值为区号+手机号，比如86185662466**|

#### 校验验证码（登录）
请求参数：
| 字段 |类型|说明|
| ----- | ----- | ----- |
| method|string|请求方法，值为login|
|phone|string|手机号，值为区号+手机号，比如86185662466**|
| code|string|值为6位数字验证码|

### 使用指引
#### 申请短信模板签名
1.到[腾讯云短信](https://console.cloud.tencent.com/smsv2)控制台申请模板和签名，[可参考短信快速入门指引](https://cloud.tencent.com/document/product/382/37745)。
![](https://main.qcloudimg.com/raw/77077f26f43d748d4ef3ecfb1434c505.png)

2.将申请好的签名、模板、应用id添加到云函数基础配置的环境变量中。
![](https://main.qcloudimg.com/raw/c64e457c6bb405c26c4b914e2864e108.png)

#### 启用运行角色
1.到[云函数](https://console.cloud.tencent.com/scf)控制台启用运行角色
![](https://main.qcloudimg.com/raw/1df31ef445fd6d8782e80431b059ae79.png)

2.到[访问管理](https://console.cloud.tencent.com/cam/role)控制台给该角色添加短信QcloudSMSFullAccess权限
![](https://main.qcloudimg.com/raw/accb8fe057f2790e8ac9244d08e69259.png)
这样代码里就能获取到TENCENTCLOUD_SECRETID、TENCENTCLOUD_SECRETKEY、TENCENTCLOUD_SESSIONTOKEN环境变量了，发送短信的sdk会用到这些环境变量。

#### redis配置
到[云数据库](https://console.cloud.tencent.com/redis)控制台申请redis资源，然后将申请到的redis实例的host和password添加到云函数的环境变量中。
![](https://main.qcloudimg.com/raw/2a3eca4ea7a26829b9a37b01d3257fdc.png)

#### 私有网络VPC配置
腾讯云云函数默认部署在公共网络中，如果要访问redis资源，需在云函数控制台基础配置里启用私有网络。详情参考[私有网络通信](https://cloud.tencent.com/document/product/583/19703)

### 错误码
| 字段 |说明|
| ----- | ----- |
| InValidParam|缺少参数|
| MissingCode|缺少验证码参数|
| CodeHasExpired|验证码已过期|
| CodeHasValid|验证码已失效|
| CodeIsError|请检查手机号和验证码是否正确|

### 参考文档
* 短信模板、签名申请指引：https://cloud.tencent.com/document/product/382/37745
* 环境变量指引：https://cloud.tencent.com/document/product/583/30228
* 创建函数运行角色：https://cloud.tencent.com/document/product/583/41755
* ioredis：https://www.npmjs.com/package/ioredis
