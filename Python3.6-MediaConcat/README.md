# 概述

基于云函数+VOD+COS+ffmpeg实现媒体文件拼接。可配合CFS实现大媒体文件拼接，并将拼接媒体文件上传到VOD保存。

# 使用指导

## 前置条件

1、基于媒体文件拼接demo创建异步函数； 

2、创建API网关触发器；

3、VOD云主播服务控制台创建子应用，记录下子应用subAppId。

## 媒体文件拼接

通过调用API网关接口启动媒体文件拼接。接口参数说明：

```
{
	"Action": "ComposeMedia",
	"Data": {
		"URLs": ["https://xxx.mp4", "https://xxxx.mp4"],
		"CallbackURL": "https://xxx/callback",
		"SkipSingleFile": "True",
		"TargetVideoSpec": {
			"Format": "mp4",
			"Resolution": {
				"Strategy": "Fixed",
				"Width": 1600,
				"Height": 900
			},
			"Codec": "h264",
			"Framerate": {
				"Strategy": "Fixed",
				"Value": 15
			},
			"Bitrate": {
				"Strategy": "Fixed",
				"Value": 500
			}
		},
		"TargetAudioSpec": {
			"Format": "aac"
		},
		"Output": {
			"Vod": {
				"Region": "ap-beijing",
				"SubAppId": 1500006377
			}
		}
	}
}
```

参数说明：
```
| 参数                | 类型   | 必填 | 说明                                             |
| ------------------- | ------ | ---- | ------------------------------------------------ |
| Action              | string | 是   | 请求操作类型，为 ComposeMedia                    |
| Data                | object | 是   | 请求协议参数                                     |
| URLs                | list   | 是   | 输入的URL地址集合                                |
| SkipSingleFile      | bool   | 否   | 只有一个输入文件的时候，是否需要处理默认True     |
| TargetVideoSpec     | object | 是   | 输出视频的规格                                   |
| Format              | string | 否   | 视频的封装格式，目前只支持mp4默认mp4             |
| Resolution.Strategy | Enum   | 是   | Fixed \| Maximum \| Minimum**目前只需支持Fixed** |
| Resolution.Width    | Int    | 是   | 目标视频的分辨率宽度                             |
| Resolution.Height   | int    | 是   | 目标视频的分辨率宽高度                           |
| Codec               | Enum   | 否   | h264 \| h265**目前只需支持h264，默认h264**       |
| Framerate.Strategy  | Enum   | 是   | Fixed \| Maximum \| Minimum目前只需支持Fixed     |
| Framerate.Value     | int    | 是   | 帧率，单位fps                                    |
| Bitrate.Strategy    | Enum   | 是   | Fixed \| Maximum \| Minimum**目前只需支持Fixed** |
| Bitrate.Value       | int    | 是   | 码率，单位 kb/s                                  |
| TargetAudioSpec     | object | 否   | 输出的音频格式                                   |
| Format              | string | 否   | 默认格式**目前只支持aac格式**                    |
| Output              | object | 是   | 录制文件存放位置                                 |
| Vod.Region          | string | 否   | 存放到点播的目的区域，不填默认当前region         |
| Vod.SubAppId        | string | 否   | 存放到点播的子应用ID                             |
```

