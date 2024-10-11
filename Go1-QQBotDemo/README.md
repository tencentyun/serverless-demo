# QQ机器人服务端
## 注意事项
1. websocket 事件推送链路将在24年年底前逐步下线，后续官方不再维护。
2. 新的webhook事件回调链路目前在灰度验证，灰度用户可体验通过页面配置事件监听及回调地址。如未在灰度范围，可联系QQ机器人反馈助手开通。

![反馈机器人](src/qqbot-demo/docs/images/feedback_bot.png)

demo服务可部署在server/serverless节点上。quick start章节介绍了如何将服务端部署到腾讯云scf上（serverless），便于快速体验、验证。

## quick start
### 1. QQ机器人创建与配置
1. 创建开发者账号，创建QQ机器人 [QQ机器人开放平台](https://q.qq.com/qqbot)

![create_bot.png](src/qqbot-demo/docs/images/create_bot.png)

2. 配置沙箱成员 (QQ机器人上线前，仅沙箱环境可访问)。新创建机器人会默认将创建者加入沙箱环境。

![sandbox_setting.png](src/qqbot-demo/docs/images/sandbox_setting.png)

### 2. 开通混元大模型服务，创建apikey

[开通混元大模型服务](https://console.cloud.tencent.com/hunyuan/start)

![turn_on_hunyuan_service.png](src/qqbot-demo/docs/images/turn_on_hunyuan_service.png)

[创建混元apikey](https://console.cloud.tencent.com/hunyuan/start)，

![create_api_key.png](src/qqbot-demo/docs/images/create_api_key.png)

### 3. 云函数创建与配置
1. 腾讯云账号开通scf服务 [快速入门](https://cloud.tencent.com/document/product/1154/39271)
2. 创建函数

* 选择模板
![create_scf.png](src/qqbot-demo/docs/images/create_scf.png)

* 启用"公网访问"、"日志投递"

![turn_internet_access.png](src/qqbot-demo/docs/images/turn_internet_access.png)

* 编辑云函数，启用"固定公网出口IP" （QQ机器人需要配置IP白名单，仅白名单内服务器/容器可访问OpenAPI）

![scf_setting.png](src/qqbot-demo/docs/images/scf_setting.png)

![get_internet_ip.png](src/qqbot-demo/docs/images/get_internet_ip.png)

* 编辑云函数，设定环境变量

![set_env_vars.png](src/qqbot-demo/docs/images/set_env_vars.png)

需要设定的环境变量：

QQBotAppID、QQBotSecret：QQ机器人appid、secret。获取地址：https://q.qq.com/qqbot/#/developer/developer-setting

![img.png](src/qqbot-demo/docs/images/qqbot_acc.png)

HYApiKey：混元api key。获取地址 https://console.cloud.tencent.com/hunyuan/api-key

![hunyuan_api_key.png](src/qqbot-demo/docs/images/hunyuan_api_key.png)

### 4.配置QQ机器人事件监听、回调地址、IP白名单

1. 复制云函数地址 + "/qqbot"后缀，填入回调地址输入框。点击确认。

![img.png](src/qqbot-demo/docs/images/copy_scf_addr.png)

2. 勾选 C2C_MESSAGE_CREATE 事件。点击确认。

![webhook配置](src/qqbot-demo/docs/images/webhook_setting.png)


3. 将云函数 "固定公网出口IP" 配置到IP白名单中）

![ip_whitelist_setting.png](src/qqbot-demo/docs/images/ip_whitelist_setting.png)

## 体验与机器人的对话

QQ扫码后和机器人对话：https://q.qq.com/qqbot/#/usage-and-personnel

![chat_with_qqbot.png](src/qqbot-demo/docs/images/chat_with_qqbot.png)