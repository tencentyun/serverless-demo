/*
* Module:   TRTC 关键类型定义
*
* Function: 分辨率、质量等级等枚举和常量值的定义
*
*/

#ifndef __TRTCCLOUDDEF_H__
#define __TRTCCLOUDDEF_H__
#include <unistd.h>
#include <string>

/////////////////////////////////////////////////////////////////////////////////
//
//                    【视频分辨率 TRTCVideoResolution】
//                   
//   此处仅有横屏分辨率，如果要使用 360x640 这样的竖屏分辨率，需要指定 ResolutionMode 为 Portrait
//
//
/////////////////////////////////////////////////////////////////////////////////
/**
 * 视频分辨率
 */
enum TRTCVideoResolution
{
    /// 宽高比1:1
    TRTCVideoResolution_120_120 = 1,                    /// 建议码率 80kbps
    TRTCVideoResolution_160_160 = 3,                    /// 建议码率 100kbps
    TRTCVideoResolution_270_270 = 5,                    /// 建议码率 200kbps
    TRTCVideoResolution_480_480 = 7,                    /// 建议码率 350kbps

    /// 宽高比4:3
    TRTCVideoResolution_160_120 = 50,                   /// 建议码率 100kbps
    TRTCVideoResolution_240_180 = 52,                   /// 建议码率 150kbps
    TRTCVideoResolution_280_210 = 54,                   /// 建议码率 200kbps
    TRTCVideoResolution_320_240 = 56,                   /// 建议码率 250kbps
    TRTCVideoResolution_400_300 = 58,                   /// 建议码率 300kbps
    TRTCVideoResolution_480_360 = 60,                   /// 建议码率 400kbps
    TRTCVideoResolution_640_480 = 62,                   /// 建议码率 600kbps
    TRTCVideoResolution_960_720 = 64,                   /// 建议码率 1000kbps
    
    /// 宽高比16:9
    TRTCVideoResolution_160_90 = 100,                   /// 建议码率 100kbps
    TRTCVideoResolution_256_144 = 102,                  /// 建议码率 200kbps
    TRTCVideoResolution_320_180 = 104,                  /// 建议码率 250kbps
    TRTCVideoResolution_480_270 = 106,                  /// 建议码率 350kbps
    TRTCVideoResolution_640_360 = 108,                  /// 建议码率 550kbps
    TRTCVideoResolution_960_540 = 110,                  /// 建议码率 850kbps
    TRTCVideoResolution_1280_720 = 112,                 /// 建议码率 1200kbps
    TRTCVideoResolution_1920_1080 = 113,                /// 建议码率 2000kbps
    
    /// 常见 16倍数的分辨率
    TRTCVideoResolution_640_368 = 208,                  /// 建议码率 550kbps
    TRTCVideoResolution_960_544 = 209,                  /// 建议码率 850kbps
};

/**
* 视频分辨率模式
*/
enum TRTCVideoResolutionMode
{
    TRTCVideoResolutionModeLandscape = 0,               ///< 横屏分辨率
    TRTCVideoResolutionModePortrait = 1,                ///< 竖屏分辨率
};

/**
 * 视频编码方式
 */
enum TRTCVideoEncodeType
{
    TRTCVideoEncodeType_H264 = 0,                       ///< H264编码
    TRTCVideoEncodeType_VP8 = 1,                        ///< VP8编码
};

/**
* App场景类型
*/
enum TRTCAppScene
{
    TRTCAppSceneVideoCall = 0,                          ///< 视频通话场景，即绝大多数时间都是两人或两人以上视频通话的场景
                                                        ///  内部编码器和网络协议优化侧重流畅性，降低通话延迟和卡顿率
    
    TRTCAppSceneLIVE = 1,                               ///< 直播场景，即绝大多数时间都是一人直播，偶尔有多人视频互动的场景
                                                        ///  内部编码器和网络协议优化侧重性能和兼容性，性能和清晰度表现更佳
};

/**
 * 用户角色
 */
enum TRTCClientRole
{
    TRTCClientRole_Anchor = 20,                         ///< 主播 需要推音视频数据场景下使用。
    TRTCClientRole_Audience = 21,                       ///< 观众 不推音视频数据场景下使用，设置为该值，无法推音视频数据到云端。
};

/**
* 视频流类型
*/
enum TRTCVideoStreamType
{
    TRTCVideoStreamTypeBig = 0,                         ///< 大画面视频流
    TRTCVideoStreamTypeSmall = 1,                       ///< 小画面视频流
    TRTCVideoStreamTypeSub = 2,                         ///< 辅流（屏幕分享）
};



/**
 * 视频数据结构类型
 */
enum TRTCVideoBufferType
{
    TRTCVideoBufferType_Unknown = 0,
    TRTCVideoBufferType_Buffer = 1,                       ///< 二进制Buffer类型
};

/**
 * 视频帧的格式
 */
enum TRTCVideoFrameFormat
{
    TRTCVideoFrameFormat_Unknown = 0,
    TRTCVideoFrameFormat_YUVI420 = 1,                    ///< I420（yuv420p） 编码前视频数据
    TRTCVideoFrameFormat_H264 = 2,                       ///< H264 视频编码数据
};

/**
 * 音频帧的格式
 */
enum TRTCAudioFrameFormat
{
    TRTCAudioFrameFormat_Unknown = 0,
    TRTCAudioFrameFormat_PCM = 1,                        ///< PCM 裸音频数据 48kHz 单声道 16位深度 20ms帧长。 用于录制场景。
    TRTCAudioFrameFormat_AAC = 2,                        ///< AAC 音频编码数据 48kHz 单声道。
    TRTCAudioFrameFormat_PCM_16KHZ_MONO = 3,             ///< PCM 裸音频数据 16kHz 单声道 16位深度 20ms帧长。 用于AI 语音识别场景。
    TRTCAudioFrameFormat_PCM_8KHZ_MONO = 4,              ///< PCM 裸音频数据 8kHz 单声道 16位深度 20ms帧长。 用于AI 语音识别场景。
};

/**
 * 视频画面旋转方向
 */
enum TRTCVideoRotation
{
    TRTCVideoRotation0 = 0,                              ///< 顺时针旋转0度
    TRTCVideoRotation90 = 1,                             ///< 顺时针旋转90度
    TRTCVideoRotation180 = 2,                            ///< 顺时针旋转180度
    TRTCVideoRotation270 = 3,                            ///< 顺时针旋转270度
};

/// 录制输出文件类型
typedef enum OutputFileType{
    OUTFILE_TYPE_AUDIO       = 0x00000001, /// 纯音频 aac lc编码格式录制文件，文件后缀 ".flv"
    OUTFILE_TYPE_VIDEO       = 0x00000002, /// 纯视频 h264 编码格式录制文件，文件后缀 ".flv"
    OUTFILE_TYPE_AUDIO_VIDEO = 0x00000004, /// 包含音频和视频一起 aac/h264 格式的录制文件， 文件后缀 ".flv"
} OutputFileType;


/**
 * 视频帧数据
 */
struct TRTCVideoFrame
{
    TRTCVideoFrameFormat                   videoFormat;       ///< 视频帧的格式
    TRTCVideoBufferType                    bufferType;        ///< 视频数据结构类型
    uint8_t *                             data;            ///< 视频数据，字段bufferType是TRTCVideoBufferType_Buffer时生效
    int                                 textureId;        ///< 视频纹理ID，字段bufferType是TRTCVideoBufferType_Texture时生效
    uint32_t                             length;           ///< 视频数据的长度，单位是字节，对于i420而言， length = width * height * 3 / 2，对于BGRA32而言， length = width * height * 4
    uint32_t                            width;             ///< 画面的宽度
    uint32_t                            height;            ///< 画面的高度
    uint64_t                            timestamp;         ///< 时间戳，单位ms
    TRTCVideoRotation                     rotation;          ///< 画面旋转角度
    
    TRTCVideoFrame()
    : videoFormat(TRTCVideoFrameFormat_Unknown)
    , data(NULL)
    , textureId(-1)
    , length(0)
    , width(640)
    , height(360)
    , timestamp(0)
    , rotation(TRTCVideoRotation0)
    {
        
    }
};

/**
 * 音频帧数据
 */
struct TRTCAudioFrame
{
    TRTCAudioFrameFormat                  audioFormat;       ///< 音频帧的格式
    uint8_t *                           data;             ///< 音频数据
    uint32_t                            length;           ///< 音频数据的长度
    uint32_t                            sampleRate;       ///< 采样率
    uint32_t                            channel;          ///< 声道数
    uint64_t                            timestamp;        ///< 时间戳，单位ms
    
    TRTCAudioFrame()
    : audioFormat(TRTCAudioFrameFormat_Unknown)
    , data(NULL)
    , sampleRate(48000)
    , channel(1)
    , timestamp(0)
    {
        
    }
};


/**
* 日志级别
*/
enum TRTCLogLevel
{
    TRTCLogLevelVerbos = 0,           ///< 输出所有级别的log
    TRTCLogLevelDebug = 1,            ///< 输出 DEBUG，INFO，WARNING，ERROR 和 FATAL 级别的log
    TRTCLogLevelInfo = 2,             ///< 输出 INFO，WARNNING，ERROR 和 FATAL 级别的log
    TRTCLogLevelWarn = 3,             ///< 只输出WARNNING，ERROR 和 FATAL 级别的log
    TRTCLogLevelError = 4,            ///< 只输出ERROR 和 FATAL 级别的log
    TRTCLogLevelFatal = 5,            ///< 只输出 FATAL 级别的log
    TRTCLogLevelNone = 6,             ///< 不输出任何sdk log
};


/////////////////////////////////////////////////////////////////////////////////
//
//     StringBuffer
//
//  不同GNU编译器版本(4.8.x 和 5.1.x及以上版本)对于std::string 的实现不尽相同，带来兼容性问题。
//
//  SDK的接口用到的String 参数统一采用StringBuffer进行传递, StringBuffer仅作为传参桥梁使用。
//  StringBuffer 不管理String的生命期。
/////////////////////////////////////////////////////////////////////////////////

/// 字符串缓冲结构体，用于替换stl string。
typedef struct _StringBuffer{
    /// 缓冲区
    char*               buffer;
    
    /// 缓冲区长度
    uint32_t           buffer_len;
    
    _StringBuffer()
    : buffer(nullptr)
    , buffer_len(0){
        
    }
    
    /// \brief 赋值重载
    ///      将一个 String 赋值给 StringBuffer， str的生命期需要保证，不可以是临时对象，否则导致内存访问违例的Crash。
    /// \param str 非临时的字符，事先在堆或栈上定义并初始化。
    _StringBuffer& operator =(const std::string& str){
        buffer = (char*)str.c_str();
        buffer_len = str.length();
        return *this;
    }
}StringBuffer;

/////////////////////////////////////////////////////////////////////////////////
//
//                      【进房参数 TRTCParams】
//                   
//   作为 TRTC SDK 的进房参数，只有该参数填写正确，才能顺利进入 roomid 指定的房间
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 实时音视频引擎进房参数结构体。
 */
struct TRTCParams
{
    /// 应用标识 - [必填] - 腾讯视频云基于 sdkAppId 完成计费统计
    uint32_t sdkAppId;

    /// 房间号码 [必填] 指定房间号，在同一个房间里的用户（userId）可以彼此看到对方并进行视频通话
    uint32_t roomId;

    /// 用户标识 - [必填] - 当前用户的 userid，相当于用户名,UTF-8编码
    StringBuffer userId;

    /// 用户签名 - [必填] - 当前 userId 对应的验证签名，相当于登录密码
    StringBuffer userSig;

    /// 房间签名 - [非必选] - 如果您希望某个房间（roomId）只让特定的某些用户（userId）才能进入，就需要使用 privateMapKey 进行权限保护
    StringBuffer privateMapKey;
    
    /// 业务数据 - [非必选] - 某些非常用的高级特性才需要用到此字段
    StringBuffer businessInfo;
    
    /// 用户角色 - [非必选] -
    TRTCClientRole clientRole;

    TRTCParams()
        : sdkAppId(0)
        , roomId(0)
        , userId()
        , userSig()
        , privateMapKey()
        , businessInfo()
        , clientRole(TRTCClientRole::TRTCClientRole_Anchor)
    {

    }
};

/////////////////////////////////////////////////////////////////////////////////
//
//                      【编码参数 TRTCVideoEncParam】
//                   
//   视频编码器相关参数，该设置决定了远端用户看到的画面质量（同时也是云端录制出的视频文件的画面质量）
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 视频编码参数结构体
 */
struct TRTCVideoEncParam
{
    /// 视频分辨率，您在 TRTCVideoResolution 只能找到横屏模式的分辨率，比如： 640x360 这样的分辨率，如果想要使用竖屏分辨率，请指定 resMode 为 Portrait，比如：640x360 + Portrait = 360x640。
    /// 【废弃】，编码分辨率由实际输入视频帧的宽高决定
    TRTCVideoResolution videoResolution;

    /// 分辨率模式（横屏分辨率 - 竖屏分辨率）， 如果 videoResolution 指定分辨率 640x360，resMode 指定模式为 Portrait，则最终编码出的分辨率为 360x640
    /// 【废弃】，编码分辨率由实际输入视频帧的宽高决定
    TRTCVideoResolutionMode resMode;

    /// 编码方式，实时音视频默认H264视频编码，（注意：若需要支持VP8需要单独提出，后台排期支持，VP8编码方式解决webrtc在部分设备上不支持H264解码的场景下使用）。
    TRTCVideoEncodeType encType;
    
    /// 视频采集帧率，和视频源保持一致，推荐为 15fps 或 20fps，10fps以下会有明显的卡顿感，20fps以上则没有必要，很多廉价的 USB 摄像头可能并不支持 15fps 以上的采集帧率。
    uint32_t videoFps;

    /// 视频上行码率，推荐设置请参考 TRTCVideoResolution 定义处的注释说明。
    uint32_t videoBitrate;

    TRTCVideoEncParam()
        : videoResolution(TRTCVideoResolution_640_360)
        , resMode(TRTCVideoResolutionModeLandscape)
        , encType(TRTCVideoEncodeType::TRTCVideoEncodeType_H264)
        , videoFps(15)
        , videoBitrate(550)
    {

    }
};

/**
 * 音视频数据自定义加解密 结构体 内存由SDK分配和释放。
 * 进行加密操作时，EncryptedData 存放加密后的数据。
 * 1. 数据处理不要超过 EncryptedDataLength 所提供长度，一般是加密前数据长度 + 32字节（作为分组加密算法的padding部分）。
 * 2. 加密处理完成后，设置正确的EncryptedDataLength。
 * 进行解密操作时，unEncryptedData 存放解密后的数据。
 * 1. 数据处理不要超过 unEncryptedDataLength 所提供长度，一般是解密前数据长度（分组加密算法可能含padding部分）。
 * 2. 解密处理完成后，设置正确的unEncryptedDataLength。
 *
 *  如果您有特殊的加密算法，超过目前分配的缓冲大小，请联系我们。
 */
struct TRTCCustomEncryptionData{
    /// 待加密数据 或 已解密的数据缓冲
    uint8_t* unEncryptedData;
    /// 待加密数据 或 已解密的数据缓冲大小 单位字节
    uint32_t unEncryptedDataLength;
    /// 已加密数据 或 待解密的数据缓冲
    uint8_t* EncryptedData;
    /// 已加密数据 或 待解密的数据缓冲大小 单位字节
    uint32_t EncryptedDataLength;
    

    TRTCCustomEncryptionData():
    unEncryptedData(nullptr),
    unEncryptedDataLength(0),
    EncryptedData(nullptr),
    EncryptedDataLength(0),
    is_encryption_buffer_setted(false),
    is_decryption_buffer_setted(false)
    {
        
    }
    
    /// 不用关心这两个变量。
    bool is_encryption_buffer_setted;
    bool is_decryption_buffer_setted;
};

#endif /* __TRTCCLOUDDEF_H__ */
