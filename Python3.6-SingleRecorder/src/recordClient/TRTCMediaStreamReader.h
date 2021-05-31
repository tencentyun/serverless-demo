/*
 * Module:   TRTCMediaStreamReader
 *
 * Function: 基于ffmpeg 实现 MP4文件流的读取，解封装，解码，音视频数据回调 功能
 *
 */
#ifndef __TRTCMEDIA_STREAMREADER__
#define __TRTCMEDIA_STREAMREADER__

#include "TRTCMediaStreamReaderDef.h"

class ITRTCMediaStreamReader;

extern "C" {
    /// @name ITRTCMediaStreamReader 对象创建 和 销毁。
    /// @{
    /**
     * \brief 1.1 创建 ITRTCMediaStreamReader 对象
     * \return ITRTCMediaStreamReader 对象的指针。
     */
    ITRTCMediaStreamReader* createMSRInstance();
    
    /**
     * \brief 1.2 销毁 ITRTCMediaStreamReader 对象
     * \param instance 由createMSRInstance创建并返回的。
     */
    void destroyMSRInstance(ITRTCMediaStreamReader* instance);
    /// @}
}

////////////////////////////////////////////////////////////////////////////////
//
//
//
//
////////////////////////////////////////////////////////////////////////////////
class ITRTCMediaStreamReader {
public:
    virtual ~ITRTCMediaStreamReader(){};
    /// @name ITRTCMediaStreamReader 接口
    /// @{
	/**
	* \brief 1.1 开始播放 url （推荐使用 本地文件)， 异步调用
	* \param url 播放视频的 url(本地文件，就取本地路径)
     * \return ret = 0:成功，ret < 0:失败， 失败原因播放事件回调会通知出来。
	*/
    virtual int start(const char* url) = 0;

	/**
	* \brief 1.2 停止播放， 异步调用
	* \return ret = 0:成功，ret < 0:失败， 失败原因播放事件回调会通知出来。
	*/
	virtual int stop() = 0;

	/**
	* \brief 1.3 获取播放文件信息
	* \param info 播放文件信息；目前包括：文件总时长/视频宽度/视频高度/视频帧率
	*/
	virtual void getFileInfo(TRTCStreamInfo* info) = 0;

	/**
	* \brief 1.4 设置 音视频解码数据 回调
	* \param listener  数据监听回调函数
	*/
	virtual void setDataListener(IMediaStreamDataListener* listener) = 0;

	/**
	* \brief 1.5 设置 事件监听（比如：文件不存在，解码失败等）
	* \param notify   事件监听者；具体上报事件，请参考 enum tagPlayEventType
	*/
	virtual void setNotify(IMediaPlayNotifyListener* notify) = 0;

	/**
	* \brief 1.6 设置参数
	* @param param  参数结构体；具体说明，参照结构体定义
	*/
	virtual void setStreamParam(TRTCStreamParam* param) = 0;
    /// @}
};

#endif /*__TRTCMEDIA_STREAMREADER__*/
