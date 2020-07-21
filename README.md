# scf-demo-repo

SCF 云函数 Demo 代码库

# Demo说明

## 文件组织结构

golang

```
|-- Go1-helloworld     文件夹名称，也作为demo名称，最好和serverless-cloud-function-application::application::name一致。
|   |-- config.json    配置文件可以为config.json或者config.yaml 必选
|   |-- main           对应的入口文件 必选
|   |-- readme.md      readme 非必选
|   `-- license.txt    license文件 非必选
```

python


```
|-- apigw-py2          文件夹名称，也作为demo名称，最好和serverless-cloud-function-application::application::name一致。
|   |-- config.json    配置文件可以为config.json或者config.yaml 必选
|   |-- index.py       对应的入口文件 必选
|   |-- readme.md      readme 非必选
|   `-- license.txt    license文件 非必选
```


注：对于java语言来说入口文件是jar包，对于golang语言来说入口文件必须是可执行文件。

## 配置文件说明

```sh
{
    "serverless-cloud-function-application": {
        "application": {
            "Chinese"{  # "Chinese"对应中文版本
        "name": "API网关触发器基础应用",
    # 应用名称,Chinese对应中文，如果是java demo的话，必须和jar文件的名称一致，其他语言不做限制。前台需要展示，请认真填写，名称要具有一定的意义，不支持中文，名称里统一剥离掉runtime
        "description": "此示例使用 API 网关作为触发器，实现 http 接口，并返回 html 格式页面。",
    # 应用描述，主要是介绍该应用的用途、用法、涉及到的关键技术等，用户可以通过该关键字搜索。前台需要展示，请认真填写，支持中文。
        "attention": "该云函数使用了API网关触发器，并使用了集成响应功能，返回值需要构造为Json格式" ,   #demo使用的注意事项，在模板详情里展示
        "readme": {  # readme 说明，非必选，file 或 content 二选一即可
            "file": "readme.md",  # readme文件内容
            "content": "此示例使用 API 网关作为触发器，实现 http 接口"  # readme内容
        },
        "license": {  # license 说明，非必选，file 或 content 二选一即可
            "file": "license.txt",  # license文件内容
            "content": "公开"  # license内容
        },
        "author": {
            "name": "腾讯云无服务器云函数团队"  # 作者
        },
    },
    "English"{   # "English" is for English version
        "name": "apigw-response-proxy",
    # This is the name of demo.If it is java demo. Please keep the same name with jar package. Non-jave demos have no limit.Please note the demo name doesn't include runtime.
        "description": "This demo is for API GW trigger. You can all function by http interface and you will get html page",
    # The description of demo. You can describe the detail function.
        "attention": "This demo has used api gw and integrated response function. So the return value should be json format based on the requirement",   #the description of precautions
        "readme": {  # "readme" is not necessary.You can only fill in the "file" or "content".
            "file": "readme.md",  # readme file
            "content": "This demo is for API GW trigger."  # content of readme
        },
        "license": {  # "license" is not necessary.You can only fill in the "file" or "content".
            "file": "license.txt",  # license file
            "content": "license info"  # content of license
        },
        "author": {
            "name": "tencent cloud serverless team"  # author
        },
    },
    "input_parameters":{
    },    #the description of input parameters.
    "output_parameters":{        #the description of output_parameters.
        {
            "isBase64Encoded": False,
            "statusCode": 200,
            "headers": {"Content-Type":"text/html"},
            "body": "<html><body><h1>Heading</h1><p>Paragraph.</p></body></html>"
        }
    },
    "download_address":"demo的git下载链接",  #demo的git下载链接
    "tags":[
            "apigw", "Python2.7", "api"  # 标签统一为英文，可编写多个，建议使用runtime、触发器、场景等关键字，用户可以通过该关键字搜索。前台需要展示，请认真填写，不支持中文
    ],
    "version": "1.0.1",  # 版本号，通过版本号标识 demo 升级情况，未修改版本号会导致 demo 不更新至页面
},
"functions": {
    "name": "test-function",  # 函数名称，只支持英文
    "description": "此示例使用 API 网关作为触发器，实现 http 接口，并返回 html 格式页面。" # 和"application"保持一致，可为英文或中文，前台不展示
    "handler":"index.main_hanlder",
# 函数入口 不支持中文，如果是一段式的话，必须和对应的二进制文件名称一致，第一段不能使用readme、license、config；如果二段式的，第一段必须是对应的入口文件名，第一段不能使用readme、license、config；三段式的话，必须是对应的handler
    "memorySize": 128,  # 运行配置内存
    "timeout": 3,  # 运行超时时间
    "runtime": "Python2.7",# 运行环境，用户可以通过该关键字搜索["Python2.7", "Python3.6", "Nodejs6.10", "Java8", "LuaCDN", "NodejsCDN", "Php5", "Php7", "Nodejs8.9", "Go1"] 前台需要展示，请认真填写
    "Environment":{
            "DB_NAME": "mydb" # 可选，函数环境变量
    },
    "Events":{
    },      # 可选，用于定义触发此函数的事件源
    "VpcConfig":{
    },     # 可选， 用于配置云函数访问 VPC 私有网络。
    "codeObject": {
        "codeFile": [  # 代码文件
            "index.py"
        ]
        "CodeUri":[     # 代码下载地址，和download_address保持一致
            ""
        ]
    }
}
}
}
```

函数入口 handler 写法：
* 一段式：golang，预制内容："main"
* 二段式：python，nodejs，PHP，预制内容："index.main_handler"
* 三段式：java，预制内容："example.Hello::mainHandler"

# Demo 开发注意事项

1. 需要注意代码提交时不要带有 SecretID，SecretKey 等信息。
2. 关键信息可修改为通过环境变量读取，并定义好所需配置的环境变量。
3. Demo 描述尽量使用中文，简洁扼要的描述 Demo 的实现功能，可适用的场景，使用的方式。
4. 每个Demo的英文名称必填且唯一,不同开发语言可以一样


## 上传到Demo库

请参照：https://blog.csdn.net/qq_33429968/article/details/62219783
