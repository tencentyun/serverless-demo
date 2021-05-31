 /*
 * Module:   TRTCCloudCallback @ TXLiteAVSDK
 *
 * Function: 腾讯云视频通话功能的回调接口类
 *
 */
 
#ifndef __TRTCENGINECALLBACK_H__
#define __TRTCENGINECALLBACK_H__

#include "TRTCCloudDef.h"
#include "TXLiteAVCode.h"

/**
 * 实时音视频引擎事件回调接口。
 */
class ITRTCCloudCallback
{
public:
    virtual ~ITRTCCloudCallback() {}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （一）通用事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 通用事件回调
    /// @{
    /**
    * \brief 1.1 错误回调，SDK不可恢复的错误，一定要监听，并分情况给用户适当的界面提示
    *
    * \param errCode 错误码
    * \param errMsg 错误信息
    * \param arg 保留参数
    */
    virtual void onError(TXLiteAVError errCode, const char* errMsg, void* arg) = 0;

    /**
    * \brief 1.2 警告回调
    *
    * \param warningCode 错误码
    * \param warningMsg 警告信息
    * \param arg 保留参数
    */
    virtual void onWarning(TXLiteAVWarning warningCode, const char* warningMsg, void* arg) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （二）房间事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 房间事件回调
    /// @{
    /**
    * \brief 2.1 进房成功通知
    *
    * \param elapsed 进房耗时 单位ms
    */
    virtual void onEnterRoom(uint64_t elapsed) = 0;

    /**
    * \brief 2.2 退房通知
    *
    * \param reason 退出原因 0 正常退出。
    */
    virtual void onExitRoom(int reason) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （三）成员事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 成员事件回调
    /// @{
    /**
    * \brief 3.1 房间成员进房时触发回调。
    *
    * \param userId 用户标识
    */
    virtual void onUserEnter(const char* userId) = 0;

    /**
    * \brief 3.2 房间成员退房时触发回调。
    *
    * \param userId 用户标识
    * \param reason 退出原因 0 用户主动退房
    */
    virtual void onUserExit(const char* userId, int reason) = 0;
    /// @}

    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （四）音视频事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 音视频事件回调
    /// @{
    /**
    * \brief 4.1 网络收到首个视频帧时触发回调。
    *
    * \param userId 用户标识
    * \param width  画面宽度
    * \param height 画面高度
    */
    virtual void onFirstVideoFrame(const char* userId, uint32_t width, uint32_t height) {}

    /**
    * \brief 4.2 网络收到首个音频帧触发回调。
    *
    * \param userId 用户标识
    */
    virtual void onFirstAudioFrame(const char* userId) {}

    /**
    * \brief 4.3 网络收到首个辅路视频帧时触发回调。
    *
    * \param userId 用户标识
    * \param width  画面宽度
    * \param height 画面高度
    */
    virtual void onFirstSubStreamFrame(const char* userId, uint32_t width, uint32_t height) {}
    
    /**
     * \brief 4.4 远端用户屏蔽/开启自己的画面时触发回调。
     *
     * \param userId 用户标识
     * \param available true：视频可播放，false：视频被关闭
     */
    virtual void onUserVideoAvailable(const char* userId, bool available) {}
    
    /**
     * \brief 4.5 远端用户屏蔽/开启自己的声音时触发回调。
     *
     * \param userId 用户标识
     * \param available true：音频可播放，false：音频被关闭
     */
    virtual void onUserAudioAvailable(const char* userId, bool available) {}

    /**
     * \brief 4.6 远端用户屏蔽/开启自己的辅路时触发回调。
     *
     * \param userId 用户标识
     * \param available true：辅路可播放，false：辅路被关闭
     */
    virtual void onUserSubStreamAvailable(const char* userId, bool available) {}

    /**
     * \brief 4.7 当房间中的其他用户使用sendSEIMsg发送数据时触发回调。
     *
     * \param userId   用户标识
     * \param data     数据
     * \param datalen  数据大小
     */
    virtual void onRecvSEIMsg(const char* userId, const unsigned char* data, int datalen) {}
    
    /**
     * \brief 4.8 当房间中的某个用户使用 sendCustomCmdMsg 发送自定义消息时，房间中的其它用户可以通过 onRecvCustomCmdMsg 接口接收消息
     *
     * \param userId  用户标识
     * \param cmdId   命令ID
     * \param seq     消息序号
     * \param msg     消息数据
     * \param msglen  消息长度
     */
    virtual void onRecvCustomCmdMsg(const char* userId, int cmdId, int seq, const unsigned char* msg, int msglen) {}
    
    /**
     * \brief 4.9 TRTC所使用的传输通道为UDP通道，所以即使设置了 reliable，也做不到100%不丢失，只是丢消息概率极低，能满足常规可靠性要求。
     *            在过去的一段时间内（通常为5s），自定义消息在传输途中丢失的消息数量的统计，SDK 都会通过此回调通知出来
     *
     * \note  只有在发送端设置了可靠传输(reliable)，接收方才能收到消息的丢失回调
     * \param userId    用户标识
     * \param cmdId     命令ID
     * \param errCode   错误码
     * \param missed    丢失的消息数量
     */
    virtual void onMissCustomCmdMsg(const char* userId, int cmdId, int errCode, int missed) {}
    
    /// @}
    /////////////////////////////////////////////////////////////////////////////////
    //
    //                      （五）服务器事件回调
    //
    /////////////////////////////////////////////////////////////////////////////////
    /// @name 服务器事件回调
    /// @{
    /**
     * \brief 5.1 SDK 跟服务器的连接断开时触发回调。
     */
    virtual void onConnectionLost() {}

    /**
     * \brief 5.2 SDK 尝试重新连接到服务器时触发回调。
     */
    virtual void onTryToReconnect() {}

    /**
     * \brief 5.3 SDK 跟服务器的连接恢复时触发回调。
     */
    virtual void onConnectionRecovery() {}
    /// @}
};

/**
 * 实时音视频房间成员视频数据回调接口。
 */
class ITRTCVideoRecvCallback
{
public:
    virtual ~ITRTCVideoRecvCallback() {}
    /// @name 自定义视频帧接收回调
    /// @{
    /**
     * \brief 6.1 通过 setRemoteVideoRecvCallback 接口设置视频数据回调
     *
     * \param userId         用户标识
     * \param streamType     流类型
     * \param frame          视频帧数据
     */
    virtual void onRecvVideoFrame(const char* userId, TRTCVideoStreamType streamType, TRTCVideoFrame* frame) {}
    /// @}
};

/**
 * 实时音视频房间成员音频数据回调接口。
 */
class ITRTCAudioRecvCallback {
public:
    virtual ~ITRTCAudioRecvCallback() {}
    /// @name 自定义音频帧接收回调
    /// @{
    /**
     * \brief 6.2 通过 setRemoteAudioRecvCallback 接口设置音频数据回调
     *
     * \param userId     用户标识
     * \param frame      音频帧数据
     */
    virtual void onRecvAudioFrame(const char* userId, TRTCAudioFrame* frame){}
    /// @}
};

/**
 * 实时音视频引擎日志回调接口。
 */
class ITRTCLogCallback
{
public:
    virtual ~ITRTCLogCallback() {}
    /// @name Log 信息回调
    /// @{
    /**
     * \brief 7.1 日志回调
     *
     * \param log 日志内容。
     * \param level 日志级别，具体取值详见 TRTCCLogLevel 定义。
     * \param module 暂无具体意义，目前为固定值TXLiteAVSDK。
     */
    virtual void onLog(const char* log, TRTCLogLevel level, const char* module) {}
    /// @}
};


/////////////////////////////////////////////////////////////////////////////////
//
//                      （五）自定义加解密音视频数据回调接口
//   应用场景是 金融类 对于数据安全要求高，客户需要自己对于音视频数据进行加密的场景。 用于加密的算法和秘钥客户自己管理
//   综合考虑性能和安全性，建议选用对称加密算法，如 AES 和 DES。
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 实时音视频 推流 音视频数据自定义加密回调。
 */
class ITRTCEncryptionCallback {
public:
    virtual ~ITRTCEncryptionCallback() {}
    
    /// @name 自定义数据加密
    /// @{
    /**
     * \brief 8.1 音频数据自定义加密回调处理函数
     * \param data
     * \return true 表示已经做了加密操作， false 表示未做加密操作或操作失败。
     * \note 回调处理函数要同步进行数据帧的加密，并设置加密后的结果。
     */
    virtual bool onAudioFrameEncrypt(TRTCCustomEncryptionData* data) {return false;};
    
    /**
     * \brief 8.2 视频数据自定义加密回调处理函数
     * \param streamType 视频类型 可取值 大画面，小画面和辅路
     * \param data
     * \return true 表示已经做了加密操作， false 表示未做加密操作或操作失败。
     * \note 回调处理函数要同步进行数据帧的加密，并设置加密后的结果。
     */
    virtual bool onVideoFrameEncrypt(TRTCVideoStreamType streamType, TRTCCustomEncryptionData* data) {return false;}
    /// @}
};

/**
 * 实时音视频 拉流 音视频数据自定义解密回调
 */
class ITRTCDecryptionCallback {
public:
    virtual ~ITRTCDecryptionCallback() {}
    /// @name 自定义数据解密
    /// @{
    /**
     * \brief 9.1 音频自定义解密回调处理函数
     * \param userId 远端用户的ID
     * \param data 远端用户的加密数据
     * \return true 表示回调函数执行了解密操作，false 表示未做解密操作或操作失败。
     */
    virtual bool onAudioFrameDecrypt(const char* userId, TRTCCustomEncryptionData* data) {return false;}
    
    /**
     * \brief 9.2 音频自定义解密回调处理函数
     * \param userId 远端用户的ID
     * \param streamType 视频流类型
     * \param data 远端用户的加密数据
     * \return true 表示回调函数执行了解密操作，false 表示未做解密操作或操作失败。
     */
    virtual bool onVideoFrameDecrypt(const char* userId, TRTCVideoStreamType streamType, TRTCCustomEncryptionData* data) {return false;}
    /// @}
};
#endif /* __TRTCENGINECALLBACK_H__ */
