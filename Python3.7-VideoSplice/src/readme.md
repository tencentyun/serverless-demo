# 视频拼接

通过FFmpeg对视频进行拼接，并加上背景音乐。
传入几个视频和需要给拼接后的视频添加的BGM音乐，就可以直接帮你把所有视频按顺序合成一个视频，并配上指定的BGM音乐。

**支持的功能列表：**
1. 视频拼接
2. 添加转场
    1. 1.0不支持转场
    2. 2.0支持选择固定的一个转场`待开发`
    3. 3.0支持在每个衔接处指定不同的转场`待开发`
3. 添加统一音频
    1. 需要去掉原有视频的音频


> 💡 每个视频的分辨率必须一样，目前不支持总大小超过500M的视频。

请求JSON：

```jsx
{
    "Action": "SpliceVideo",
    "Data": {
        "Input": {
            "URLs": [
                "1.mp4",
                "2.mp4"
            ],
            "Audio": "xxx.mp3",
            "Transitions": "None",
            "CallbackURL": "https://xxxx/release/callback"
        },
        "Output": {
            "Vod": {
                "Region": "ap-beijing",
                "SubAppId": 101, 
                "ClassId": 873369
            }
        }
    }
}
```

字段解释

| 字段 | 类型 | 解释 |
| --- | --- | --- |
| URLs | list | 要拼接的视频的顺序列表，请确保所有URL能正常下载 |
| Audio | string | 拼接后的视频会使用的统一音频，请确保音频文件能正常下载 |
| Transitions | enum | 转场的类型选择，目前仅支持： |
| CallbackURL | string | 回调URL |
| SubAppId | int | 要上传的VOD的subappid |
| Region | string | 要上传的VOD的地域 |
| ClassId | int | VOD的分类ID |

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
