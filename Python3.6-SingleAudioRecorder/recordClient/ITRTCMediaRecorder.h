#ifndef __ITRTC_MEDIA_RECORDER_H__
#define __ITRTC_MEDIA_RECORDER_H__

#include "TRTCCloudDef.h"

//----------------------------------------- BEGIN ----------------------------------------------------
//
// 录制组件 输入、 输出、 流程控制图示说明：
//
//                    setParam  stop stopAll setCallback
//                       +        +     +         +
//                       |        |     |         |
//                       |        |     |         |
//                  +-------------v-----v---------------+
//                  |    v                        |     |
//                  | +--+-----+                  |     |
//                  | |output  |                  |     |
// --addAudioFrame--> |dir     |                  |     |
//                  | |        |                  v     |
//                  | |sdkappid|              callback  +-onFinished--->
//                  | |roomid  |                        |
//                  | |userid  |                        |
// --addVideoFrame--> +--------+                        |
//                  |                                   |
//                  |                                   |
//                  +-----------------------------------+
//
//
// 主要接口说明：
//   1. 数据输入  接口 addAudioFrame 和 addVideoFrame。
//              对于纯音频，每条流，首次调用addAudioFrame，即开始录制纯音频。
//              对于纯视频，每条流，首次调用addVideoFrame，即开始录制纯视频。
//              对于音视频，每条流，首次调用addVideoFrame，才开始录制，若一直没有收到视频帧，则不启动录制。
//   2. 数据输出  回调 onFinished
//   3. 流程控制  接口 stop 和 stopAll。
//              特别说明 setCallback 和 setParam要在addAudioFrame 和 addVideoFrame前调用。
//              setParam 主要设置 录制的文件类型output、录制文件的存放目录dir、应用ID sdkappid 房间id roomid 用户id
//              userid 要和ITRTCCloud的enterRoom接口的进房参数中的信息保持一致。
//
//
// 应用场景 1：
//   配合ITRTCCloud组件，轻松实现单流录制，即分别录制房间中每一个人的流。
//   单流录制架构关系图：
//   +--------------+                   +----------------------+
//   |              |                   |                      |
//   |        onRecvAudioFrame +--+ addAudioFrame              |
//   |              |                   |                      |
//   |  ITRTCCloud  |                   | ITRTCMediaRecorder   |
//   |              |                   |                      |
//   |        onRecvVideoFrame +--+ addVideoFrame              |
//   |              |                   |                      |
//   +--------------+                   +----------------------+
//
//   数据从ITRTCCloud 通过音视频数据回调 onRecvAudioFrame 和 onRecvVideoFrame 的数据转发到
//   ITRTCMediaRecorder 的 addAudioFrame 和 addVideoFrame接口。ITRTCMediaRecorder stop后生成录制文件。
//   录制成功的文件，通过ITRTCMediaRecorder的onFinished回调通知给客户。
//
// 应用场景 2：
//   配合ITRTCCloud组件 和 ITRTCMediaMixer组件，可以轻松实现。
//   1. 混流录制，支持将多路流按要求混成一路。
//   2. 单流录制，支持补静音和图像的缩放裁剪。
//
//   混流录制架构关系图：
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

class ITRTCMediaRecorder;
extern "C" {
    /// @name ITRTCMediaRecorder 对象创建 和 销毁。
    /// @{
    /**
     * \brief 1.1 创建 ITRTCMediaRecorder 对象
     * \param sdkappid 应用sdkappid。
     * \return ITRTCMediaRecorder 对象的指针。
     */
    ITRTCMediaRecorder* createMediaRecorder();
    
    /**
     * \brief 1.2 销毁 ITRTCMediaRecorder 对象
     * \param instance 由createMediaRecorder 创建的 ITRTCMediaRecorder 对象。
     * \return void。
     */
    void destroyMediaRecorder(ITRTCMediaRecorder* instance);
    /// @}
}

class ITRTCMediaRecorderCallback{
public:
    virtual ~ITRTCMediaRecorderCallback() {}
    
    /**
     * \brief 1.1 录制完成回调
     * \param userId        用户ID/流id
     * \param output        录制文件类型，纯音频文件 output = OUTFILE_TYPE_AUDIO
     * \param filepath      录制文件路径，相对于dir参数所指路径，dir 参数通过ITRTCMediaRecorder 的 setParam的dir参数进行设置的。
     * \return void
     */
    virtual void onFinished(const char* userId, int output, const char* filepath) {};
};

class ITRTCMediaRecorder{
public:
    virtual ~ITRTCMediaRecorder() {}
    
    /// @{
    /**
     * \brief 1.1 设置回调
     * \param callback 回调对象
     * \return void
     */
    virtual void setCallback(ITRTCMediaRecorderCallback* callback) = 0;
    
    /**
     * \brief 1.2 设置录制参数
     * \param sdkappid  应用id
     * \param roomid    房间id
     * \param userid    本端 用户id
     * \param output    录制文件类型，输出纯视频和纯音频文件 output = OUTFILE_TYPE_AUDIO | OUTFILE_TYPE_VIDEO
     * \param dir       录制文件存放的根目录
     * \return void
     */
    virtual bool setParam(uint32_t sdkappid, const char* roomid, const char* userId, int output,const char* dir) = 0;
    
    /**
     * \brief 1.3 添加要录制的音频数据
     * \param userId    远端 用户ID，也可以是流ID，唯一标识一路音视频流。
     * \param frame     音频帧。
     *                  要求PCM格式 帧长20ms 48000采样率 16bit 单声道。时间戳必须单调递增。
     * \return void
     */
    virtual void addAudioFrame(const char *userId, TRTCAudioFrame *frame) = 0;
    
    /**
     * \brief 1.4 添加要录制的视频数据
     * \param userId        远端 用户ID，也可以是流ID，唯一标识一路音视频流。
     * \param streamType    TRTC房间回调过来的类型，若非TRTC房间回调的，默认填 0.
     * \param frame         视频帧。
     *                      要求YUV420p或H264格式。H264 I帧前需要带sps+pps信息。不支持动态分辨率。YUV420p和H264 两种类型的帧不能混合使用。
     * \return void
     */
    virtual void addVideoFrame(const char *userId, TRTCVideoStreamType streamType, TRTCVideoFrame *frame) = 0;
    
    /**
     * \brief 1.5 结束指定流录制， 回调 onFinished事件。
     * \param userId 用户ID，也可以是流ID，唯一标识一路音视频流。
     * \return void
     */
    virtual void stopOne(const char* userId) = 0;
    
    /**
     * \brief 1.6 结束所有流录制， 回调 onFinished事件。
     * \return void
     */
    virtual void stopAll() = 0;
    /// @}
};

#endif
