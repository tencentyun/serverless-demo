/*
 * Module:   TRTCCloud @ TXLiteAVSDK
 * 
 * Function: 腾讯云视频通话功能的主要接口类
 *
 */
 
#ifndef __TRTCENGINE_H__
#define __TRTCENGINE_H__

#include "TRTCCloudCallback.h"
#include "TRTCCloudDef.h"
//----------------------------------------- BEGIN ----------------------------------------------------
//
// 实时音视频房间组件的输入、输出、控制和接口调用依赖示意图：
//
//                            enterRoom     exitRoom
//                                |             |             setCallback
//                                |             |                 |
//                                |             |                 |
//                          +-----v-------------v------------------------+
//                          |                                     |      |
//                          |                                     |      +--onError--------------------->
//                          |                                     |      |
//                          |                                     |      +--onEnterRoom----------------->
//                          |                                     |      |
// +---sendCustomAudioData-->                                     |      +--onExitRoom------------------>
//                          |                                     |      |
//                          |                                     |      +--onUserEnter----------------->
// +---sendCustomVideoData->---------(depend on)------------+  callback--+
//                          |                               |            +--onUserExit------------------>
//                          |                               |            |
// +---sendAuxVideoData---->---------(depend on)-------------------+     +--onUserVideoAvailable-------->
//                          |                               |      |     |
//                          |                               |      |     +--onUserAudioAvailable-------->
// +---sendSEIMsg----------->                               |      |     |
//                          |                               |      |     +--onUserSubStreamAvailable---->
//                          |                               |      |     |
// +---sendCustomCmdMsg----->              +--(ctrl)+------------------->--+onRecvVideoFrame------------>
//                          |              |        |       |      |     |
//                          |    +--(ctrl)------------------------------>--+onRecvAudioFrame------------>
//                          |    |         |        |       |      |     |
//                          |    |         |        |       |      |     +--onRecvSEIMsg---------------->
//                          |    |         |        |       |      |     |
//                          |    |         |        |       |      |     +--onRecvCustomCmdMsg---------->
//                          |    |         |        |       |      |     |
//                          |    |         |        |       |      |     +--onMissCustomCmdMsg---------->
//                          |    |         |        |       |      |     |
//                          |    |         |        |       |      |     |
//                          |    |         |        |       |      |     |
//                          |    |         |        |       v      v     |
//                          +--------------------------------------------+
//                               |         |        |       |      |
//                               |         |        |       |      |
//                               |         |        |       |      |
//                               +         |        |       |      |
//            setRemoteAudioRecvCallback   |        |       |      |
//                                         +        |       |      |
//                     setRemoteVideoRecvCallback   |       |      |
//                                                  +       |      |
//                            setRemoteSubStreamRecvCallback|      |
//                                                          +      |
//                                          setVideoEncoderParam   |
//                                                                 +
//                                                      setAuxVideoEncoderParam
//
//
//
//
// 主要接口说明：
//   1. 数据输入  接口 sendCustomAudioData 发送音频数据。
//                   sendCustomVideoData 发送主视频数据，需要setVideoEncoderParam提前设置好正确的编码参数，否则发送失败。
//                   sendAuxVideoData 发送辅路视频数据，需要setAuxVideoEncoderParam提前设置好正确的编码参数，否则发送失败。
//                   sendSEIMsg 发送SEI消息，会插入在主视频流中发送，播放端可以总主视频流中解析消息，通过
//                   onRecvSEIMsg 回调通知出来，主要用于直播答题场景。
//                   sendCustomCmdMsg 发送自定义消息，通过onRecvCustomCmdMsg和onMissCustomCmdMsg回调通知出来。
//   2. 数据输出  回调 onRecvAudioFrame  收到音频数据回调，可以通过setRemoteAudioRecvCallback控制是否收取，以及收取的格式。
//                   onRecvVideoFrame  收到视频数据回调，可以通过setRemoteVideoRecvCallback控制是否收取主画面，
//                   setRemoteSubStreamRecvCallback控制是否收取辅路画面，以及收取的格式。
//   3. 流程控制  接口 enterRoom 进房，重点确认 sdkappid roomid userid usersig填写是否正确。进房成功会回调onEnterRoom，进房失败会回调onError。
//                   exitRoom 退房 退房成功会回调onExitRoom，失败会回调onError。
//   4. 事件回调      onUserEnter 房间有其它人进房（有上行音频或者视频）时回调，通常在该回调中 决定是否接受该用户的音视频流，
//                              相关接口setRemoteAudioRecvCallback、setRemoteVideoRecvCallback和setRemoteSubStreamRecvCallback。
//                  onUserExit 需要反注册数据回调，相关接口setRemoteAudioRecvCallback、setRemoteVideoRecvCallback和setRemoteSubStreamRecvCallback。
//                  onUserVideoAvailable 主视频流状态切换通知 有切换到无，无切换到有都会通知。
//                  onUserAudioAvailable 音频流状态切换通知。有切换到无，无切换到有都会通知。
//                  onUserSubStreamAvailable 辅视频流状态切换通知 有切换到无，无切换到有都会通知。
//
// 应用场景：
//  1. 支持服务端模拟主播和老师，进行音视频推流。转推其它音视频源到实时音视频房间。
//  2. 实时音视频房间监控，摄政，鉴黄的数据来源。
//  3. 实时音视频身份核实，服务端结合“活体检测”AI，在实时音视频过程中就完成“活体检测” ，提升活体检测体验，不再需要久等。
//  4. 配和 录制组件 ITRTCMediaRecorder，可以轻松完成金融合规要求的录制任务。
//  5. 配和 混录组件和录制组件，可以轻松完成教育类混流录制需求。
//
//
//
// ------------------------------------- END ---------------------------------------------------------

class ITRTCCloud;

extern "C" {
    /// @name ITRTCCloud 对象创建 和 销毁。
    /// @{
    /**
     * \brief 1.1 创建 ITRTCCloud 对象
     * \param sdkappid 应用sdkappid。
     * \return ITRTCCloud 对象的指针。
     */
    ITRTCCloud* createInstance(uint32_t sdkappid);
    
    /**
     * \brief 1.2 销毁 ITRTCCloud 对象
     * \param instance 由createInstance 创建的ITRTCCloud对象。
     * \return void。
     */
    void destroyInstance(ITRTCCloud* instance);
    /// @}
    
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （四）LOG相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 调试相关函数
    /// @{
    /**
     * \brief 2.1 获取SDK版本信息
     * \param version 用于存放版本信息。
     * \param length 版本信息长度，调用时请填写version数组的长度。
     * \return ret = true: 获取成功，length存放version信息的正确长度，ret = false: 获取失败。
     */
    bool getSDKVersion(char* version, int& length);
    
    /**
     * \brief 2.2 设置log输出级别
     *
     * \param level 参见 TRTCLogLevel
     */
    void setLogLevel(TRTCLogLevel level);
    
    /**
     * \brief 2.3 启用或禁用控制台日志打印
     *
     * \param enabled 指定是否启用
     */
    void setConsoleEnabled(bool enabled);
    
    /**
     * \brief 2.4 启用或禁用Log的本地压缩
     *
     *  开启压缩后，log存储体积明显减小，但需要腾讯云提供的 python 脚本解压后才能阅读
     *  禁用压缩后，log采用明文存储，可以直接用记事本打开阅读，但占用空间较大。
     * \param enabled 指定是否启用
     */
    void setLogCompressEnabled(bool enabled);
    
    /**
     * \brief 2.5 设置日志保存路径
     *
     * \param path 存储日志的文件夹，例如 "D:\\Log"，utf-8编码
     * \attention 如果没有调用这个接口，SDK 会将日志输出到默认的位置，位于 /tmp/Tencent/liteav/log.
     */
    void setLogDirPath(const char* path);
    
    /**
     * \brief 2.6 设置日志回调
     *
     * \param callback 日志回调
     */
    void setLogCallback(ITRTCLogCallback* callback);
    /// @}
    
    /**
     * \brief 2.7 跨进程版本，参数设置接口
     * \param corePath  TRTC引擎独立程序的存放路径  绝对路径，包含文件名
     * \param rootDir   TRTC引擎日志等文件存放目录父目录  绝对路径，
     */
    void setIPCParam(const char * corePath,const char* rootDir);

    /**
     * \brief 2.8 设置代理服务参数
     * \param ip  socks5 server ip. ex "10.1.1.127"
     * \param port socks5 server port. ex: 1080
     * \param user_name 用于socks5 身份鉴权的 用户名
     * \param pass_word 用于socks5 身份鉴权 密码
     * \note
     * 1. 如果需要通过sock5代理连接TRTC服务，请在主程序入口处调用 |setSocks5Proxy| 一次即可。
     * 2. 如果已经调用|setSocks5Proxy|，想取消代理，请再次调用setSocks5Proxy（“”，0，“”，“”），其中参数ip 为空
     *     串，port为0.
     * 3. 生效时机，setSocks5Proxy调用后，在此之后的房间会走代理行为，而在此之前保持原有行为。
     */
    void setSocks5Proxy(const char* ip, const int port, const char* user_name, const char* pass_word);

    /**
     * \brief 2.9 设置运行环境，默认是TRTC正式环境。该接口的目的便于疑难问题的排查和跟进，以及测试。无特殊情况，请勿调用。
     * \param environment  0 正式环境 默认，1 开发环境， 2 体验环境。
     */
    void setEnvironment(int environment);

    /**
     * \brief 2.10 设置配置文件路径，目的是用于私有化部署，配置文件采用json格式。具体格式如下：
     * {
     *     "trtc_env":{
     *         "access_ip":[
     *             "10.10.00.00",
     *             "11.11.00.00"
     *         ],
     *         "access_host":"xxx.xxx.xxx.com",
     *         "access_public_key":"A1F51FC45E73CE80000000000000000000000000000000000",
     *
     *       }
     * }
     * 以上的accessIP、 accessHost、 accessPubKey信息，请向负责TRTC服务端私有部署的同学，进行索要
     * 并确认是可用的。
     * 配置文件取名建议用 trtc_config.json
     * 假设 配置文件存放在 /etc/config/trtc, 那么 path 就是 /etc/config/trtc/trtc_config.json。
     */
    void setConfigPath(const char* path);
}

class ITRTCCloud
{
public:
    virtual ~ITRTCCloud(){};

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                       设置 TRTCCloudCallback 事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 设置 TRTCCloudCallback 回调
    /// @{
    /**
     * \brief 设置事件回调
     *
     * \param callback 事件回调指针，nullptr 取消回调设置。
     */
    virtual void setCallback(ITRTCCloudCallback* callback) = 0;
    /// @}
    
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （一）房间相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 房间相关接口函数
    /// @{
    /**
     * \brief 1.1 进入房间
     *
     * \param params 进房参数，详情参考 TRTCParams 定义。
     * \param scene 应用场景，目前仅支持视频通话（TRTCAppSceneVideoCall）。
     * \note 不管进房是否成功，都必须与exitRoom配对使用，在调用 exitRoom 前再次调用 enterRoom 函数会导致不可预期的错误问题。
     */
    virtual void enterRoom(const TRTCParams& params, TRTCAppScene scene) = 0;

    /**
     * \brief 1.2 退出房间
     */
    virtual void exitRoom() = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （二）视频相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name  视频相关接口函数
    /// @{
    /**
     * \brief 2.1 设置视频编码器相关参数，该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
     *
     * \param params        视频编码参数，详情请参考 TRTCCloudDef.h 中 TRTCVideoEncParam 的定义。
     *
     */
    virtual void setVideoEncoderParam(const TRTCVideoEncParam& params) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （三）音视频自定义接口
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 音视频自定义接口
    /// @{
    /**
     * \brief 3.1 订阅远端用户的大流视频数据.和小流订阅是互斥的。
     *
     * \note              设置此方法，SDK内部会把远端的视频帧数据回调出来，视频帧格式由 videoFormat 指定
                          调用 setRemoteVideoRecvCallback(userid,TRTCVideoPixelFormat_Unknown, nullptr) 停止回调。
     * \param userId      用户标识
     * \param videoFormat 指定回调的视频数据格式，H264 / YUVI420
     * \param callback    自定义视频收帧回调
     * \return ret = 0：成功， ret < 0：错误
     */
    virtual int setRemoteVideoRecvCallback(const char* userId, TRTCVideoFrameFormat videoFormat, ITRTCVideoRecvCallback* callback) = 0;
    
    /**
     * \brief 3.2 订阅远端用户的音频数据.
     *
     * \note              设置此方法，SDK内部会把远端的音频帧数据回调出来，音频帧格式由 audioFormat 指定
                          调用 setRemoteAudioRecvCallback(userid,TRTCAudioFrameFormat_Unknown, nullptr) 停止回调。
     * \param userId      用户标识
     * \param audioFormat 指定回调的音频数据格式，AAC / PCM
     * \param callback    自定义视频收帧回调
     * \return ret = 0：成功，ret < 0：错误
     */
    virtual int setRemoteAudioRecvCallback(const char* userId, TRTCAudioFrameFormat audioFormat, ITRTCAudioRecvCallback* callback) = 0;
    
    /**
     * \brief 3.3 订阅远端用户端小流数据,和大流订阅是互斥的.
     *
     * \note              设置此方法，SDK内部会把远端的辅路视频帧数据回调出来，视频帧格式由 videoFormat 指定
                          调用 setRemoteSmallStreamRecvCallback(userid,TRTCVideoPixelFormat_Unknown, nullptr) 停止回调。
     * \param userId      用户标识
     * \param videoFormat 指定回调的视频数据格式，H264 / YUVI420
     * \param callback    自定义视频收帧回调
     * \return ret = 0：成功， ret < 0：错误
     */
    virtual int setRemoteSmallStreamRecvCallback(const char* userId, TRTCVideoFrameFormat videoFormat, ITRTCVideoRecvCallback* callback) = 0;

    /**
     * \brief 3.3 订阅远端用户端辅流数据.
     *
     * \note              设置此方法，SDK内部会把远端的辅路视频帧数据回调出来，视频帧格式由 videoFormat 指定
                          调用 setRemoteSubStreamRecvCallback(userid,TRTCVideoPixelFormat_Unknown, nullptr) 停止回调。
     * \param userId      用户标识
     * \param videoFormat 指定回调的视频数据格式，H264 / YUVI420
     * \param callback    自定义视频收帧回调
     * \return ret = 0：成功， ret < 0：错误
     */
    virtual int setRemoteSubStreamRecvCallback(const char* userId, TRTCVideoFrameFormat videoFormat, ITRTCVideoRecvCallback* callback) = 0;
    
    /**
     * \brief 3.4  发送自定义视频数据帧
     *
     * \note
     * \param frame     视频帧数据，仅支持裸视频数据格式（TRTCVideoFrameFormat_YUVI420），注意数据的宽高要和实际分辨率一致。
     *                  frame的timestamp字段 unused，内部会重新打时间戳，请务必控制好调用的频率，和视频的帧率保持一致。
     * \return ret = 0: 成功, ret < 0: 错误
     */
    virtual int sendCustomVideoData(TRTCVideoFrame* frame) = 0;
    
    /**
     * \brief 3.5  发送自定义音频数据帧数据
     *
     * \note
     * \param frame     音频帧数据，仅支持裸音频数据格式（TRTCAudioFrameFormat_PCM），采样率48000，通道数 1，帧长20ms，采样点位深度16bit。
     *                  frame的timestamp字段 unused，内部会重新打时间戳，请务必控制好调用频率，间隔音频的帧长时间。
     * \return ret = 0: 成功, ret < 0: 错误
     */
    virtual int sendCustomAudioData(TRTCAudioFrame* frame) = 0;
    
    /**
     * \brief 3.6 发送自定义消息给房间内所有用户
     *
     * \note 限制1：数据在接口调用完后不会被即时发送出去，而是从下一帧视频帧开始带在视频帧中发送
     *       限制2：发送消息到房间内所有用户，每秒最多能发送 30 条消息 (**与sendCustomCmdMsg共享限制**)
     *       限制2：每个包最大为1KB，若发送大量数据，会导致视频码率增大，可能导致视频画质下降甚至卡顿 (**与sendCustomCmdMsg共享限制**)
     *       限制4：每个客户端每秒最多能发送总计 8 KB 数据 (**与sendCustomCmdMsg共享限制**)
     *       限制5：若指定多次发送（repeatCount>1）,则数据会被带在后续的连续repeatCount个视频帧中发送出去，同样会导致视频码率增大
     *       限制6: 如果repeatCount>1,多次发送，接收消息 **onRecvSEIMsg** 回调也可能会收到多次相同的消息，需要去重
     *
     * \param data          待发送的数据，最大支持 1kb（1000字节）的数据大小
     * \param datalen       数据长度
     * \param repeatcount   发送数据次数
     * \return true:消息已通过限制，等待后续视频帧发送, false:消息被限制发送.
     *
     */
    virtual bool sendSEIMsg(const unsigned char* data, int datalen, int repeatcount) = 0;
    
    /**
     * \brief 3.7 发送自定义消息给房间内所有用户
     *
     * \param cmdId    消息ID，取值范围为 1 ~ 10
     * \param msg      待发送的消息，最大支持 1KB（1000字节）的数据大小
     * \param msglen   消息长度
     * \param reliable 是否可靠发送，可靠发送的代价是会引入一定的延时，因为接收端要暂存一段时间的数据来等待重传
     * \param ordered  是否要求有序，即是否要求接收端接收的数据顺序和发送端发送的顺序一致，这会带来一定的接收延时，因为在接收端需要暂存并排序这些消息
     * \return true:消息已经发出 false:消息发送失败
     *
     * \note 限制1：发送消息到房间内所有用户，每秒最多能发送 30 条消息
     *       限制2：每个包最大为 1 KB，超过则很有可能会被中间路由器或者服务器丢弃
     *       限制3：每个客户端每秒最多能发送总计 8 KB 数据
     *
     *       请将 reliable 和 ordered 同时设置为 true 或 false, 暂不支持交叉设置。
     *       有序性（ordered）是指相同 cmdId 的消息流一定跟发送方的发送顺序相同，
     *       强烈建议不同类型的消息使用不同的 cmdId，这样可以在要求有序的情况下减小消息时延
     */
    virtual bool sendCustomCmdMsg(uint32_t cmdId, const unsigned char* msg, int msglen, bool reliable, bool ordered) = 0;
    /// @}
    
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （四）辅流相关接口函数
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name  辅流相关接口函数
    /// @{
    /**
     * \brief 4.1 设置辅流视频编码器相关参数，该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
     *
     * \param params        视频编码参数，详情请参考 TRTCCloudDef.h 中 TRTCVideoEncParam 的定义。
     *
     */
    virtual void setAuxVideoEncoderParam(const TRTCVideoEncParam& params) = 0;
    
    /**
     * \brief 4.2  发送辅流视频数据帧
     *
     * \note
     * \param frame     视频帧数据，仅支持裸视频数据格式（TRTCVideoFrameFormat_YUVI420），注意数据的宽高要和实际分辨率一致。
     *                  frame的timestamp字段 unused，内部会重新打时间戳，请务必控制好调用的频率，和视频的帧率保持一致。
     * \return ret = 0: 成功, ret < 0: 错误
     */
    virtual int sendAuxVideoData(TRTCVideoFrame* frame) = 0;
    /// @}
    
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （五）自定义数据加解密接口
    //        主要为金融类对数据安全要求高的客户提供的功能，SDK 会将数据回调出来交给客户做加解密处理。
    //        针对数据上行，是加密处理
    //        针对数据下行，是解码处理
    //        加解密所用的算法和秘钥，由使用者进行管理。
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name  自定义数据加解密接口
    /// @{
    /**
     * \brief 5.1 加密回调
     *
     * \param callback 数据加密处理回调 callback = nullptr 表示取消回调
     * \note 注意：取消回调，同时也会停止解码数据的回调。
     * 数据处理流程： sdk音视频编码 --> 触发回调（同步进行，数据的自定义加密）--> sdk 网络发送
     * 若自定义加密失败，会导致对方无法正确解密，播放黑屏，没有声音。
     */
    virtual void setEncryptionCallback(ITRTCEncryptionCallback* callback) {}
    
    /**
     * \brief 5.2 解密回调
     *
     * \param callback 数据解密处理回调 callback = nullptr 表示取消回调
     * \note 注意：取消回调，同时也会停止解码数据的回调。
     * 数据处理流程：sdk网络收包 --> 触发回调（同步进行，数据自定义解密） --> sdk音视频解码
     * 若自定义解密失败，会导致音视频解码失败，没有音视频数据回调。
     */
    virtual void setDecryptionCallback(ITRTCDecryptionCallback* callback) {}
    /// @}
};

#endif /* __TRTCENGINE_H__ */
