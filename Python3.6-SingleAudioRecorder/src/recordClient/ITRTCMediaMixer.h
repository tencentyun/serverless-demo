#ifndef __ITRTCMEDIAMIXER_H__
#define __ITRTCMEDIAMIXER_H__

#include "TRTCCloudDef.h"
//----------------------------------------- BEGIN ----------------------------------------------------
//
// 混流组件 输入、 输出、 流程控制和布局更新 图示说明：
//
//                   setCanvas  start  stop   setCallback
//                       |         |     |        |
//                       |         |     |        |
//                       |         |     |        |
//                 +---------------v-----v---------------+
//                 |     v                        |      |
//                 | fps,    width,               |      |
//                 | height,bgcolor               |      |
// -addAudioFrame-->                              |      +---onMixedAudioFrame->
//                 |                              |      |
//                 |     +------------+           v      |
//                 |     |clearRegions|        callback--+
//                 |     |            |                  |
// -addVideoFrame-->     |setRegion   |                  +---onMixedVideoFrame->
//                 |     |            |                  |
//                 |     |applyRegions|                  |
//                 |     +------------+                  |
//                 |                                     |
//                 +-------------------------------------+
//
// 主要接口说明：
//   1. 数据输入  接口 addAudioFrame 和 addVideoFrame
//   2. 数据输出  回调 onMixedAudioFrame 和 onMixedVideoFrame
//   3. 流程控制  接口 start 和 stop。
//              特别说明 setCallback 和 setCanvas要在start前调用。
//              setCanvas用于指定混图输出的帧率（fps），分辨率（width，height），和背景色（纯色：bgcolor）
//   4. 布局更新  接口 clearRegions、setRegion和applyRegions。
//
// 应用场景：
//   配合ITRTCCloud组件 和 ITRTCMediaRecorder组件，可以轻松实现。
//   1. 混流录制，支持将多路流按要求混成一路。
//   2. 单流录制，支持补静音和图像的缩放裁剪。
//
//   架构关系图：
//   +--------------+                     +-----------------+                    +----------------------+
//   |              |                     |                 |                    |                      |
//   |        onRecvAudioFrame +--+ addAudioFrame     onMixedAudioFrame +--+ addAudioFrame              |
//   |              |                     |                 |                    |                      |
//   |  ITRTCCloud  |                     | ITRTCMediaMixer |                    | ITRTCMediaRecorder   |
//   |              |                     |                 |                    |                      |
//   |        onRecvVideoFrame +--+ addVideoFrame     onMixedVideoFrame +--+ addVideoFrame              |
//   |              |                     |                 |                    |                      |
//   +--------------+                     +-----------------+                    +----------------------+
//   
//   数据从ITRTCCloud 通过音视频数据回调 onRecvAudioFrame 和 onRecvVideoFrame 的数据转发到
//   ITRTCMediaMixer的 addAudioFrame 和 addVideoFrame 接口，混流完成后ITRTCMediaMixer通过回调 onMixedAudioFrame 和 onMixedVideoFrame
//   将数据转发到 ITRTCMediaRecorder 的 addAudioFrame 和 addVideoFrame接口。ITRTCMediaRecorder stop后生成录制文件。
//   录制成功的文件，通过ITRTCMediaRecorder的onFinished回调通知给客户。
//
//
//
// ------------------------------------- END ---------------------------------------------------------


typedef enum ErrorCode {
    OK = 0,
    ERR_INVALID_PARAM   = 10001,
    ERR_WRONG_STATE     = 10002,
    ERR_MEMORY_FAILED   = 10003,
    ERR_UNKNOWN         = 19999,
} ErrorCode;

typedef enum RegionOption{
    REGION_OPTION_FILLMODE_FIT              = 1<<1, // 缩放适应Region的宽高，画面可能变形。
    REGION_OPTION_FILLMODE_FULL             = 1<<2, // 等比例缩放，填充整个区域，多出的部分将被裁剪掉。
} RegionOption;


/**
 * 混图流的区域信息，用于说明如何混流
 */
struct Region {
    /// 相对于 canvas 左上角 横轴方向的偏移 单位像素。
    int offset_x;
    
    /// 相对于 canvas 左上角 纵轴方向的偏移 单位像素。
    int offset_y;
    
    /// 宽度 单位像素
    int width;
    
    /// 高度 单位像素
    int height;
    
    /// 背景色 RGB格式，示范：红色（0xff0000）绿色（0x008000）蓝色（0x000080），详细可以参考http://www.ffmpeg.org/ffmpeg-utils.html#color-syntax。
    int bgcolor;
    
    /// 控制选项。 视频帧大小和 区域的宽高不一致，是否拉伸，是否裁剪。
    RegionOption option;
    
    /// 控制显示的层次， 值越小，画面越靠下。取值从1开始，递增。
    int zOrder;
    
    Region()
    : offset_x(0)
    , offset_y(0)
    , width(0)
    , height(0)
    , bgcolor(0)
    , option(REGION_OPTION_FILLMODE_FULL)
    , zOrder(0){
        
    }
    
    Region(const Region& obj){
        offset_x = obj.offset_x;
        offset_y = obj.offset_y;
        width = obj.width;
        height = obj.height;
        bgcolor = obj.bgcolor;
        option = obj.option;
        zOrder = obj.zOrder;
    }
    
    Region(int x, int y, int width, int height, int bgcolor, RegionOption fitmode, int zOrder){
        this->offset_x = x;
        this->offset_y = y;
        this->width = width;
        this->height = height;
        this->bgcolor = bgcolor;
        this->option = fitmode;
        this->zOrder = zOrder;
    }
    
    Region& operator=(const Region& obj){
        offset_x = obj.offset_x;
        offset_y = obj.offset_y;
        width = obj.width;
        height = obj.height;
        bgcolor = obj.bgcolor;
        option = obj.option;
        zOrder = obj.zOrder;
        return *this;
    }
};

class ITRTCMediaMixer;
extern "C" {
    /// @name ITRTCMediaMixer 对象创建 和 销毁。
    /// @{
    /**
     * \brief 1.1 创建 ITRTCMediaMixer 对象
     * \return ITRTCMediaMixer 对象的指针。
     */
    ITRTCMediaMixer* createMediaMixer();
    
    /**
     * \brief 1.2 销毁 ITRTCMediaMixer 对象
     * \param instance 由createMediaMixer 创建的 ITRTCMediaMixer 对象。
     * \return void。
     */
    void destroyMediaMixer(ITRTCMediaMixer* instance);
    /// @}
}

class ITRTCMediaMixerCallback {
public:
    virtual ~ITRTCMediaMixerCallback(){}
    
    /**
     * \brief 1.1 回调混流后的音频帧，音频格式PCM。单声道 48kHz采样率 16bit深度。20ms帧长（960个采样点，字节长度1920）
     * \param  frame 混后的音频帧。
     * \return void.
     */
    virtual void onMixedAudioFrame(TRTCAudioFrame* frame) = 0;
    
    /**
     * \brief 1.2 回调混流后的视频帧，视频格式YUV420p。
     * \param  frame 混后的视频帧。
     * \return void.
     */
    virtual void onMixedVideoFrame(TRTCVideoFrame* frame) = 0;
    
    /**
     * \brief 1.3 内部错误回调。
     */
    virtual void onError(int errcode, char* errmsg) = 0;
};

class ITRTCMediaMixer {
public:
    virtual ~ITRTCMediaMixer(){}
    
    /**
     * \brief 1.1 设置混流回调
     * \param callback  混流回调指针。销毁前建议设置为null。
     * \return void
     */
    virtual void setCallback(ITRTCMediaMixerCallback* callback) = 0;
    
    /**
     * \brief 1.2 设置画布，混流开始后，即start()调用后，请不要调用该方法。
     * \param fps       混流后视频的帧率
     * \param width     混流后视频的宽度，单位：像素。
     * \param height    混流后视频的高度，单位：像素。
     * \param bgcolor   画布背景颜色。格式RGB,示范：红色（0xFF0000）详见 http://www.ffmpeg.org/ffmpeg-utils.html#color-syntax
     * \return 0 设置成功，
     *
     */
    virtual int setCanvas(int fps, int width, int height, int bgcolor) = 0;
    
    /**
     * \brief 1.3 开始混流，内部会启动混流线程。做了防止重入处理。
     * \param enableAudio true 混音频，onMixedAudioFrame回调混合后的音频帧。 false 不混音频。
     * \param enableVideo true 混视频，onMixedVideoFrame回调混合后的视频帧。 false 不混视频。
     * \return 0 启动成功
     */
    virtual int start(bool enableAudio, bool enableVideo) = 0;
    
    /**
     * \brief 1.4 停止混流，会等待混流线程停止，等待时间会很短，毫秒级。做了防止重入处理。
     * \return 0 停止成功。
     */
    virtual int stop() = 0;
    
    /**
     * \brief 1.5 清除region设置，调用applyRegions接口后生效。
     */
    virtual int clearRegions() = 0;
    
    /**
     * \brief 1.6 设置需要混的区域，修改完region后调用applyRegions接口生效。
     * \param id        区域的id，用于区分音视频源的，和addAudioFrame/addVideoFrame参数一致，表示同一个来源。确保每一路流唯一。
     * \param region    区域信息 参见 Region 定义。null 表示删除对应id的Region信息。
     * \return 0 添加成功。
     */
    virtual int setRegion(const char* id, Region* region) = 0;
    
    /**
     * \brief 1.7 应用setRegion所做的设置。
     * \return 0 应用成功。
     */
    virtual int applyRegions() = 0;
    
    /**
     * \brief 1.8 添加需要混流的音频数据。
     * \param id      区域的id，用于区分音视频源的，和addAudioFrame/addVideoFrame参数一致，表示同一个来源。确保每一路流唯一。
     * \param frame   音频帧。
     *                要求 格式 PCM 帧长 20ms 采样率 48000 位深度 16bit 声道数 1。调用频率要求 音频实际帧率 容许5帧左右的波动。
     * \return 0 添加成功
     */
    virtual int addAudioFrame(const char* id, TRTCAudioFrame* frame) = 0;
    
    /**
     * \brief 1.9 添加要混流的音频数据。
     * \param id    区域的id，用于区分音视频源的，和addAudioFrame/addVideoFrame参数一致，表示同一个来源。确保每一路流唯一。
     * \param frame 视频帧。
     *              要求 格式 YUV420p。调用平率要求 视频实际帧率 容许2帧左右的波动。
     * \return 0 添加成功
     */
    virtual int addVideoFrame(const char* id, TRTCVideoFrame* frame) = 0;
};

#endif // __ITRTCMEDIAMIXER_H__
