# 视频处理

通过FFmpeg对视频进行处理。
传入视频处理需要的参数，就可以对视频进行相关的处理。目前仅支持对单个视频进行处理。

> 💡 目前不支持大小超过500M的视频。

**支持的功能列表：**

1. 添加文字
    1. 支持指定文字位置
    2. 支持指定文字大小
    3. 支持文字底层蒙版可配置
    4. 支持指定文字颜色`待开发`
    5. 支持修改文字字体
    6. 支持不同文字指定不同字体
    7. 支持文字出场入场动画`待开发`
    8. 支持给文字添加半透明底板
2. 视频转换
    1. 转换分辨率，横屏变竖屏，上下补黑边
    2. 2.0支持转换码率和帧率`待开发`
3. 添加图片
    1. 支持指定图片位置和大小
    2. 2.0支持指定图片形状`待开发`
4. 上传视频
   1. 支持上传VOD
   2. 支持指定分类文件夹
   3. 支持结果回调
    

服务请求JSON：

```jsx
{
    "Action": "CompositionVideo",
    "Data": {
        "Input": {
            "URL": "xxxx.mp4",
            "Audio": true,
            "CallbackURL": "https://xxxx/release/callback",
            "Resolution": {
                "Width": 1600,
                "Height": 900
            },
            "Framerate": 15,
            "Bitrate": 500,
            "Texts": [
                {
                    "Content": "xxxx",
                    "X": 1,
                    "Y": 2,
                    "Size": 3,
                    "EnableBox": true,
                    "Font": "STHeitiLight.ttc"
                },
                {
                    "Content": "xxxx",
                    "X": 1,
                    "Y": 2,
                    "Size": 3,
                    "EnableBox": false,
                    "Font": "STHeitiLight.ttc"
                }
            ],
            "Pictures": [
                {
                    "URL": "xxxx.jpg",
                    "X": 1,
                    "Y": 2,
                    "Width": 3,
                    "Height": 3,
                }
            ]
        },
        "Output": {
            "Vod": {
                "Region": "ap-beijing",
                "SubAppId": 101, 
                "ClassId": 0
            }
        }
    }
}
```

字段解释

| 字段 | 类型 | 解释 |
| --- | --- | --- |
| URL | string | 要处理的视频链接，请确保URL能正常下载 |
| Audio | bool | 是否保留音频 |
| CallbackURL | string | 回调URL |
| TargetVideoSpec.Resolution | int | 目标分辨率 |
| TargetVideoSpec.Framerate | int | 目标帧率 |
| TargetVideoSpec.Bitrate | int | 目标码率 |
| Texts | list | 要添加的多种文字，x,y表达式请参考下面。 |
| Text.EnableBox | bool | 默认值是false，如果为true则表示给文字加上底部蒙层 |
| Text.Font | string | 指定该文字要用的字体，不填就是默认字体。字体文件放在层里面，这里参数名只需填文件名，如STHeitiLight.ttc。字体文件直接打包上传层，不需要添加文件夹。需要在函数中绑定层。 |
| Pictures | list | 要添加的多张图片，请确保图片链接能正常下载 |
| Region | int | 要上传的VOD的地域 |
| SubAppId | int | 要上传的VOD的subappid |
| ClassId | int | 要上传的VOD的分类ID(默认值0) |

Texts和Pictures的x和y支持以下表达式：
- Top left: `x=0:y=0` (with 10 pixel padding `x=10:y=10`)
- Top center: `x=(w-text_w)/2:y=0` (with 10 px padding `x=(w-text_w)/2:y=10`)
- Top right: `x=w-tw:y=0` (with 10 px padding: `x=w-tw-10:y=10`)
- Centered: `x=(w-text_w)/2:y=(h-text_h)/2`
- Bottom left: `x=0:y=h-th` (with 10 px padding: `x=10:y=h-th-10`)
- Bottom center: `x=(w-text_w)/2:y=h-th` (with 10 px padding: `x=(w-text_w)/2:y=h-th-10`)
- Bottom right: `x=w-tw:y=h-th` (with 10 px padding: `x=w-tw-10:y=h-th-10`)

成功回调JSON：

```jsx
{
    "Result": "Success",
    "Data": {
        "OutputUrl": "xxxxx"
    },
    "RequestId": "xxxxxx"
}
```

失败回调JSON：

```jsx
{
    "Result": "Failure",
    "ErrorCode": "InternalError",
    "ErrorMessage": "internal error: xxxx",
    "RequestId": "xxxx"
}
```

## 云函数部署

### 方式一：Action自动部署
1. Fork仓库。
2. 在仓库的Settings-Secrets-Actions中添加`TENCENT_SECRET_ID`和`TENCENT_SECRET_KEY`两个密钥。ID和KEY可以在腾讯云的访问控制里面获取。
3. 添加之后，在Action中就可以发起部署了。每次修改代码推送后，也会自动触发Action部署。
4. 如果需要有一些自定义的配置，请修改serverless.yml。
5. 云函数最终会自动部署到`TENCENT_SECRET_ID`所在的账号下。

### 方式二：云函数控制台手动部署
1. 下载代码。
2. 在根目录把所有文件和文件夹一起打包成一个ZIP文件。
3. 去[云函数控制台](https://console.cloud.tencent.com/scf/list?rid=4&ns=default)，新建一个函数。
4. 选择从头开始：
   1. 选择python语言。 
   2. 上传ZIP文件。
   3. 函数内存建议选择较大的内存。
   4. 开启异步执行。
   5. 执行超时时间根据视频大小建议设置长一点，比如30秒以上。
   6. 配置触发器，选择API网关触发器，关闭集成响应。
6. 完成部署后，就可以通过API网关的URL开始调用了。
