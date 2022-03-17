

[[toc]]
## 一、概述
Serverless中的云函数（Serverless Cloud Function，SCF）是腾讯云为企业和开发者们提供的无服务器执行环境，帮助开发者在无需购买和管理服务器的情况下运行代码。
腾讯云Serverless基于SCF提供了很多模板来快速创建函数或应用，通过SCF提供的模板创建方式，仅需几步，就可以在腾讯云上快速部署Express项目。
无论使用Express框架构建哪类系统，为用户提供登录认证功能都是一项基础且普遍的需求。然而，目前SCF提供的Express框架中尚未集成登录认证，在部署Express框架项目后，开发者还需要自行开发登录认证逻辑。

[腾讯数字身份管控平台（公众版）](https://console.cloud.tencent.com/ciam)     以下简称Tencent CIAM，用于管理公众互联网用户的账号、注册和认证规则，打通分散的用户数据孤岛、帮助应用更好地进行用户识别与画像。Tencent CIAM 帮助开发者快速搭建安全、可靠的登录认证体系，实现用户登录认证。

本文主要介绍SCF和CIAM的集成业务流程，以及SCF中 集成了Tencent CIAM 的 **Express框架模板(Auth)**的使用，有效帮助开发者避免自行开发复杂认证系统所带来的开发成本。开发者只需要在SCF模板创建直接选择Express框架模板(Auth)，通过简单的配置操作即可拥有Tencent CIAM的认证能力。

## 二、集成及配置流程
### 2.1 集成流程
![CIAM Serverless (1).png](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_1_flow.png)
开发者通过访问Serverless Gateway 服务上注册的 Serverless Cloud Function（SCF）， SCF在内置的 Express 框架模板(Auth) 模板代码中通过调用Tencent CIAM提供的SDK(CIAM-NODE-SDK )提供的方法，使SCF可以直接调用和访问 Tencent CIAM 中的登录、获取用户信息以及退出等认证能力，并向外暴露该认证能力，使开发者应用根据现有业务完成认证能力的集成。开发者在集成SCF Express框架模板（Auth）版本后，将即刻拥有Tencent CIAM提供的强大的用户体系的认证管理能力。

### 2.2配置流程
SCF 云函数目前已支持预集成 CIAM 登录认证模块的函数模板「Express框架模板(Auth)」，可以通过模板快速部署，也可以基于模板示例实现您自主业务的集成。接下来将为大家介绍如何快速创建、使用和集成 SCF 中的 Express 框架模板(Auth)，并预览集成认证后的效果，只需要以下四步就可以轻松完成：
![enter image description here](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_2_config.png?t=123123)

####  步骤一：通过SCF创建Express框架模板(Auth)
1. 登录 [Serverless 应用控制台](https://console.cloud.tencent.com/scf/list?rid=4&ns=default)。
2. 选择**函数服务>新建>模板创建>Express框架模板(Auth)**，如下图所示：
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step1_create.png)
3. 单击“下一步”，完成模板选择。
4. 点击完成按钮，Serverless会自动创建函数，创建完成后即可在函数管理中看到函数配置信息，如下图所示：
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step1_complete.png)

至此，你已经完成了Serverless Express框架模板(Auth)模板的创建啦，接下来我们只需要将**函数代码**中如下图所示的`初始化参数`进行更新，就可以完成集成啦。
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step1_params.png?t=123)

在接下来的步骤里，我们将演示如何获取到`初始化参数`的值，在此之前，我们在**函数代码**Tab页的源码编辑器下，可以看到  `访问路径` 的地址，我们需要先复制该URL地址，它会用于后续的配置。
![undefined#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step1_url.png)

#### 步骤二：配置Tencent CIAM应用
在配置前我们需要先创建Tencent CIAM应用，创建Tencent CIAM应用非常简单，Tencent CIAM控制台提供了立即创建的能力，可以一键完成创建，待应用创建完成后经过简单的配置你就可以获取到上述 `初始化参数` 的值了，操作步骤如下：
1. 进入 [数字身份管控平台（公众版）](https://console.cloud.tencent.com/ciam) 控制台，点击`立即创建`按钮。
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step2_guide.png)


2. 配置`redirectUri`、`logoutRedirectUrl`  回调地址
进入 [数字身份管控平台（公众版）](https://console.cloud.tencent.com/ciam) ，在**应用管理>应用列表>配置>参数配置**页面中配置redirectUri、logoutRedirectUrl的值如下：
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step2_params.png)

| 参数名 | 参数值 | 
| :--- | :--- |
| redirectUri |  `${部署函数生成的网关url}/callback` | 
| logoutRedirectUrl  | ` ${部署函数生成的网关url}/logout` ，`${部署函数生成的网关url}/` |

注： ${部署函数生成的网关url}即为第一步记录的 `访问路径` 的值。


3. 获取SCF Express框架模板(Auth)中需要的初始化参数
至此，Tencent CIAM应用的创建和配置就已经完成啦，现在就可以获取到Serverless Express中的`初始化参数`：`clientId、userDomain、redirectUri、logoutRedirectUrl`，获取参数的位置和值如下：

- 在**应用管理>应用列表>查看详情>参数配置**页面中记录`redirectUri`、`logoutRedirectUrl`  回调地址
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step2_params_view.png)

-  在**应用管理>应用列表**页面中获取`clientId 应用ID、clientSecret`
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step2_params_clientid.png?t=123)

-   在**个性化设置>域名设置**页面中获取`userDomain 租户域名`
在域名设置界面中开发者可以使用腾讯云平台域名或者自有域名，确认后记录该数据值。
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_3_step2_params_domain.png)


#### 步骤三：更新Expres函数代码的初始化参数
根据上述获得的`clientId、userDomain、redirectUri、logoutRedirectUrl`参数值，更新SCF Express框架模板(Auth)的`初始化参数`，进入**函数服务>先择第一步创建好的函数>函数代码Tab页**，对初始化参数进行更新，参数更新完成部署后就可以预览集成的效果啦。


####  步骤四： 预览SCF集成认证效果
打开**函数服务>打开已创建好的函数服务>函数代码Tab页**源码编辑器下方的 `访问路径` 按钮，即可在新页面看到查看集成CIAM后的运行效果如下：
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_4_1.png)
点击右上角的`登录`按钮，进入CIAM认证页面：
![enter image description here#50%](https://ciam-prd-1302490086.cos.ap-guangzhou.myqcloud.com/public/image/serverless/scf_express_4_2.png)!
至此，你已经完成了CIAM的代码集成，可以直接使用CIAM的登录、注册功能了，全程不到五分钟，是不是非常快捷。

## 三、 代码说明
模板代码基于[ciam-node-sdk](https://www.npmjs.com/package/ciam-node-sdk) 开发，以下为该sdk的设计与示例实现。
1. CIAM路由设计

|路由地址 |描述 |备注 |
|--|-| --|
|/ |index.html |- |
|/login |登录接口 |- |
|/callback |登录回调 |- |
|/logout |退出接口 |- |
|/userinfo |获取用户信息 |- |


2. SDK提供的方法

|方法名称 |描述 |备注 |
|--|-| --|
|generateLoginUrl |生成认证登录URL |- |
|fetchToken |通过code获取token |- |
|getUser| 获取用户信息 | - | 
|logout |退出登录 |- |

3. 初始化
- 代码示例
```
const { NodeClient } = require('ciam-node-sdk'); // node-sdk
const ciam = new NodeClient({
  clientId: 'your-clientid', // 此处为CIAM的应用ID，CIAM应用管理中获取
  clientSecret: 'your-clientSecret', // 此处为CIAM的clientSecret，CIAM应用管理中获取
  userDomain: 'your-userDomain', // 此处为租户域名，CIAM域名管理中获取
  redirectUri:'your-redirectUri', // 此处为回调地址，CIAM应用管理中获取
  logoutRedirectUrl: 'your-logoutRedirectUrl', // 此处为退出回调地址，CIAM应用管理中获取
  scopes: ['openid'],
});
```

- 参数说明

|参数名 |类型 |是否必填 |长度限制 |描述 |
|--|-| --| -- | -- |
|clientId |string |是 |- |管理端添加的应用clientId | 
|clientSecret |string |是 |- |管理端添加的应用clientSecret | 
|userDomain |string |是 |- |租户域名（自定义域名获取） |
|redirectUri |string |是 |- |登录成功后跳转的URL |
|logoutRedirectUrl |string | 是 |- |登录退出后跳转的URL |
|scopes |array[Agreement] |是 |- | 遵循oauth2.0规范，默认为openid |


4. 生成认证登录URL
用于生成登录URL，实现快速跳转到CIAM登录页面。
- 代码示例
```
// 登录CIAM
app.get('/login', async (req, res) => {
  const url = await ciam.generateAuthUrl();
  res.redirect(url);
})
```

5. 获取token和用户信息
该方法用于当CIAM登录成功时，根据页面返回的code调用fetchToken，获取到的token用于获取用户信息。
- 代码示例
```
// 处理redirect回调
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  const result = await ciam.fetchToken(code);
  const { access_token, id_token } = result;
  const userInfo = await ciam.getUser();
  req.session.user = { ...userInfo, userInfo };
  res.redirect('/');
})
```
- fetchToken参数说明
|参数名 |类型 |是否必填 |长度限制 |描述 |
|:--|
| code |string | 是 | 与CIAM认证返回的code相同 |   该参数由CIAM托管并返回  |



6. 退出登录
该方法用于退出CIAM登录。
- 代码示例

```
// 退出CIAM登录
app.get('/logout', async (req, res) => {
  if (!req.session.user) {
    res.redirect('/');
  }
  const url = await ciam.logout();
  req.session.destroy();
  res.redirect(url);
})
```

## 四、CIAM功能优势

- **灵活的注册/认证流程配置**
支持自定义配置登录、注册、MFA、忘记用户、忘记密码等流程，支持自定义logo、公司名称、域名配置能力。

- **多种应用类型支持**
支持Web应用、单页应用、移动APP应用、小程序应用等应用类型。

- **多渠道统一登录体验**
支持通过web应用、移动应用、H5应用、小程序应用、微信公众号等多种渠道登录的统一登录体验。

- **多种认证方式支持**
支持账号密码认证、短信认证、邮箱认证、等通用认证方式，支持微信、QQ、支付宝等主流社交认证源方式。

- **灵活用户数据模型自定义**
支持根据业务配置不同的用户模型，支持用户自定义属性，支持为属性字段配置是否必填、字段类型等，提供正则表达式等高级能力。

- **账号融合支持**
支持基于手机号、邮箱、微信 openid、微信 unionid等认证属性识别同一个自然人用户并进行账号融合。


