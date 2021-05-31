# 概述

基于云函数+TRTC+COS+ffmpeg实现单流音视频录制。可配合CFS实现长时间单流音视频录制，并将生成的FLV录制文件转码MP3/MP4格式转储到指定的COS桶持久保存。

# 使用指导

## 前置条件

1、基于单流录制demo创建函数； 

2、创建API网关触发器；

3、TRTC实时音视频服务控制台创建应用，记录下sdkAppId。

## 开启录制

通过调用API网关接口开启单流音视频录制。接口参数说明：

| 参数名称  |   类型    | 必选 | 描述                                                         |
| --------- | :-------: | :--: | ------------------------------------------------------------ |
| SdkAppId  |    Int    |  是  | 应用 ID，用于区分不同 TRTC 应用。                            |
| RoomId    |    Int    |  是  | 房间 ID，用于在一个 TRTC 应用中唯一标识一个房间。            |
| StrRoomId |  String   |  否  | 字符串房间号ID，如果RoomId与StrRoomId同时配置，使用RoomId。  |
| UserId    |  String   |  是  | 用户 ID，用于在一个 TRTC 应用中唯一标识一个用户。            |
| UserSig   |  String   |  是  | 用户签名，用于对一个用户进行登录鉴权认证。                   |
| CosConfig | CosConfig |  是  | cos存储配置。用于存储录制文件。                              |
| Mode      |  String   |  否  | 00 单流音频，默认模式。输出MP3格式01 单流视频。输出MP4格式02 单流音视频，输出MP4格式 |
| Callback  |  String   |  否  | 录制结束后后的回调地址。                                     |

cosConfig涉及的参数如下：

| 参数名称  | 类型   | 必选 | 描述                                                         |
| --------- | ------ | ---- | ------------------------------------------------------------ |
| SecretId  | String | 否   | 腾讯云账号的SecretId。参考[访问管理](https://cloud.tencent.com/document/product/598/40488) |
| SecretKey | String | 否   | 腾讯云账号的SecretKey。参考[访问管理](https://cloud.tencent.com/document/product/598/40488) |
| Region    | String | 是   | COS所在区。如ap-guangzhou                                    |
| Bucket    | String | 是   | 桶名称。如：susu-123456789                                   |
| Path      | String | 是   | 桶内路径。如：/test                                          |

说明：

1、roomId和strRoomId建议只传一个，需要确认主播角色的用户进房选择的字符串类型的房间号还是整数类型的房间号，否则主播角色的用户进入的房间和观众角色的录制用户进入的房间不一样，导致无法录制。

2、cos桶需提前创建好，否则转储音频录制文件会失败，并确保角色具有cos写权限。

3、UserId 为指定用户 ID， 多次请求 API 网关不保证幂等。

4、CosConfig 中如果不配置 SecretId 与 SecretKey，函数访问 COS 时将使用运行角色 SCF_ExecuteRole权限去执行。

5、如果云函数不绑定CFS文件系统，将使用本地/tmp缓存音频录制文件，/tmp目录可用空间512MB，需注意空间限制。建议云函数绑定CFS文件系统，同时配置环境变量"CFS_PATH"将录制文件保存到CFS文件系统中。

## 结束录制

停止录制的触发条件：

1. trtc房间被销毁。注意：trtc房间超过300s没有主播，房间会自动销毁。
2. 主动调用移除用户接口，将录制观众踢出房间。
3. 使用roomId的用户停止录制，需要调用[移除用户](https://cloud.tencent.com/document/api/647/40496)接口。
4. 使用strRoomId的用户停止录制时，需要调用[移除用户（字符串房间号）](https://cloud.tencent.com/document/product/647/50426)接口。

停止录制后，返回数据格式：

| 参数名称  | 类型   | 必选 | 描述                         |
| --------- | ------ | ---- | ---------------------------- |
| SdkAppId  | String | 是   | 应用id                       |
| RoomId    | String | 是   | 房间id                       |
| UserId    | String | 是   | 录制用户id                   |
| StrRoomId | String | 是   | 如果是字符串房间，则使用该id |
| Files     | Array  | 是   | 录制文件数组                 |

Files数组参数定义：

| 参数名称   | 类型   | 必选 | 描述                          |
| ---------- | ------ | ---- | ----------------------------- |
| UserId     | String | 是   | 被录制的用户Id                |
| RecordFile | String | 是   | 录制文件最后上传到cos的url    |
| Status     | Int    | 是   | 0：失败1：成功                |
| Message    | String | 是   | 录制失败，转码失败，写cos失败 |

