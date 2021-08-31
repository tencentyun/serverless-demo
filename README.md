腾讯云 Serverless 模版库。

# 模版说明

## 文件组织结构

Node.js

```
|-- Nodejs6.10-helloworld    文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml      函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- index.js         函数入口文件，必填。
|       `-- node_modules     依赖包，非必填。
```

Python

```
|-- Python2.7-helloworld     文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml       函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- index.py         函数入口文件，必填。
```

Php
```
|-- Php7.2-helloworld        文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml       函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- index.php        函数入口文件，必填。
```

Golang1
```
|-- Go1-helloworld           文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml       函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- main             函数入口文件，必填，Golang1 入口文件须为可执行文件。
```

Java8
```
|-- Java8-helloworld         文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml       函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- Java8-helloworld 函数入口文件，必填，Java8 入口文件须为 jar 包，jar 包文件名称须和模版名称一致。
```

CustomRuntime
```
|-- CustomRuntime-helloworld 文件夹名称，也作为模版名称，最好和 config.json 中 serverless-cloud-function-application::English::name 一致。
|   |-- config.json          模版配置文件，用于控制台模版详情展示，必填。
|   |-- serverless.yml       函数配置文件，用于控制台解析模版函数配置，必填。
|   |-- readme.md            模版使用说明，建议填写。
|   |-- src                  模版函数代码，函数入口文件及其他代码文件均放在该目录下。
|       |-- bootstrap        Custom Runtime 固定的可执行引导程序文件，必填。
|       |-- index.sh         函数入口文件，必填，入口文件后缀跟随实际运行环境。
```

## 模版配置文件 config.json 说明
注意：
1. config.json 中，English name 不要包含空格，该字段会作为模版创建函数时的默认函数名称，English name 包含空格会导致函数创建失败。
2. config.json 中，English name 创建后不支持修改，请谨慎填写。

```sh
{
    "serverless-cloud-function-application": {
        "Chinese":{
            "name": "模版中文名称",                   #请填写模版中文名称，如果是java模版，必须和jar文件的名称一致，其他语言不做限制。前台需要展示，请认真填写，名称要具有一定的意义，名称里统一剥离掉runtime。
            "description": "模版中文描述",            #模版描述，主要是介绍该模版的用途、用法、涉及到的关键技术等，用户可以通过该关键字搜索。前台需要展示，请认真填写，支持中文。
            "attention": "模版使用的注意事项，中文",    #模版使用的注意事项，在模板查看详情里展示。
            "author": {
                "name": "作者"                       #作者
            }
        },
        "English":{
            "name": "DemoEnglishName",                       # This is the English name of demo. If it is java demo. Please keep the same name with jar package. No restrictions for non-java demos. Please do not add runtime information in the name.
            "description": "Demo English description.",      # The description of demo. You can describe the detail function.
            "attention": "The description of precautions.",  # The precautions for using the template will be shown in the view details.
            "author": {
                "name": "English Name"                       # author English Name
            }
        },
        "runtime": "Python2.7",                      #运行环境，用户可以通过该关键字搜索，请在下述已经支持的运行环境中选择一个填入。前台需要展示，请认真填写。["Python3.6","Python2.7","Node.js12.16","Node.js10.15","Node.js8.9","Nodejs6.10","Php7.2","Php5.6","Java8","Golang1","CustomRuntime"]
        "type": "event",                             #模版类型，事件函数填event，web函数填web，应用填app。前台需要展示，请认真填写。填写错误可能导致模版部署异常。
        "readme":"模版的git地址",                      #模版同步的唯一标识，必填。
        "version": "1.0.0",                          #版本号，通过版本号校验模版更新情况，未修改版本号会导致模版无法同步更新到控制台。
        "tags":[
            "Python2.7", "COS", "HTML"
        ]                                            #标签统一为英文，可编写多个，建议第一个标签为runtime，其他标签为触发器、场景等关键字，不同标签之间用英文逗号间隔，用户可以通过该关键字搜索。前台需要展示，请认真填写，不支持中文。
    }
}
```

## 函数配置文件 serverless.yml 说明


```YAML
component: scf                                      #函数模版填scf，必填
name: ap-guangzhou_default_helloworld               #可参考示例填写，必填，不会在控制台展示
inputs:
  name: helloworld                                  #模版名称，与 config.json 中 English name 一致，必填
  src:
    src: ./src                                      #填./src，必填
  handler: index.main_handler                       #函数入口 handler，必填
  runtime: Nodejs10.15                              #函数runtime，必填
  namespace: default                                #可参考示例填写，必填，不会在控制台展示
  region: ap-guangzhou                              #可参考示例填写，必填，不会在控制台展示
  memorySize: 128                                   #函数配置内存，必填，会作为使用该模版创建函数时的默认值
  timeout: 3                                        #函数执行超时时间，必填，会作为使用该模版创建函数时的默认值
  environment:                                      #环境变量，选填，如模版代码依赖环境变量则需要填写，会作为使用该模版创建函数时的默认值，value 值请填写对应的环境变量含义
    - key: region
      value: the region of target bucket
    - key: target_bucket
      value: target bucket name
    - key: target_path
      value: path of target bucket
  triggers:                                         #API网关触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
    - type: apigw
      name: SCF_API_SERVICE
      protocols:
        - http
        - https
      environment: release
      netTypes:
        - OUTER
      apis:
        - path: /AddTextToPictures
          method: ANY
          function:
            isIntegratedResponse: true
    - type: cls                                    #CLS触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
    - type: cos                                    #COS触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
      enable: true
      bucket: 
      events: 'cos:ObjectCreated:*'                     
    - type: ckafka                                 #Ckafka触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
      name: 
      enable: true
      topic: 
      maxMsgNum: 50
      offset: latest
      retry: 10000
    - type: cmq                                    #CMQ触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
      enable: true
    - type: mps                                    #MPS触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
      enable: true
    - type: timer                                  #定时触发器配置，选填，如模版代码运行依赖触发器则需要填写，会作为使用该模版创建函数时的默认触发器配置
      cronExpression: 0 0 */1 * * * *
      enable: true
      argument: argument
 ```
 



函数入口 handler 写法：
* 一段式：Golang，预置内容："main"
* 二段式：Python，Nodejs，Php，预置内容："index.main_handler"
* 三段式：Java，预置内容："example.Hello::mainHandler"

# 模版开发注意事项

1. 注意代码提交时不要带有 SecretID，SecretKey 等敏感信息。
2. 关键信息可修改为通过环境变量读取，并定义好所需配置的环境变量。
3. 模版描述尽量使用中文，简洁扼要的描述模版的实现功能，可适用的场景，使用的方式。
4. 每个模版的英文名称必填且唯一，不同开发语言可以一样。


## 自定义模版提交到模版库

请参照：https://blog.csdn.net/qq_33429968/article/details/62219783
