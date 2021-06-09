/*
 * Module:   TRTCMediaStreamReader 关键类型定义
 *
 * Function: 媒体信息，回调的音视频帧结构等。
 *
 */
#ifndef __TRTCMEDIA_STREAMREADER_DEF_H__
#define __TRTCMEDIA_STREAMREADER_DEF_H__

typedef enum TRTCIFormat {
    MEDIAPLAY_VIDEOPROCESS_FORMAT_UNKNOWN = 0,
	MEDIAPLAY_VIDEOPROCESS_FORMAT_I420 = 1
}TXIFormat;

enum TRTCIAVSampleFormat {
	MEDIAPLAY_AV_SAMPLE_FMT_NONE = -1,
	MEDIAPLAY_AV_SAMPLE_FMT_S16,         ///< signed 16 bits
};

enum TRTCIAudioFormat {
    AUDIO_FORMAT_UNKNOWN = 0,
	AUDIO_FORMAT_PCM = 1,
};

typedef struct TRTCDecodeVideoFrame {
public:
	TRTCDecodeVideoFrame() {
		data = nullptr;
		length = 0;
		width = 0;
		height = 0;
		timestamp = 0;
		curVideoPosMSec = 0;
		format = MEDIAPLAY_VIDEOPROCESS_FORMAT_I420;
	}
	unsigned char*          data;				// 视频数据
	unsigned int            length;			// 视频数据长度
	unsigned int            width;				// 宽度
	unsigned int            height;			// 高度
	unsigned long long      timestamp;	        // 当前播放时间戳；原始的pts
	unsigned long long      curVideoPosMSec;	// 当前播放时间点，转换为当前ms
	TRTCIFormat             format;           // 视频数据格式 默认YUVI420
}TRTCDecodeVideoFrame;

typedef struct TRTCDecodeAudioFrame {
public:
	TRTCDecodeAudioFrame() {
		data = 0;
		length = 0;
		timestamp = 0;
		curAudioPosMSec = 0;
		sample = 0;
		sampleFormat = MEDIAPLAY_AV_SAMPLE_FMT_S16;
		bitDepth = 16;
		channels = 2;
		format = AUDIO_FORMAT_PCM;
	}
	char* data;								// 音频数据
	unsigned int length;					// 音频数据长度
	unsigned long long timestamp;			// 音频时间撮
	unsigned long long curAudioPosMSec;		// 当前播放时间点，转换为当前ms
	unsigned int sample;					// 音频采样率
	TRTCIAVSampleFormat sampleFormat;			// 音频采用格式
	int bitDepth;
	int channels;							// 音频声道数
	TRTCIAudioFormat format;				// 音频格式，默认为 PCM
}TRTCDecodeAudioFrame;

typedef struct TRTCStreamInfo {
public:
	TRTCStreamInfo() {
		duration = 0;
		str_duration = nullptr;
		videoWidth = 0;
		videoheight = 0;
		videoFps = 0;
	}
	unsigned long long duration;	// 文件总时长 ms
	const char* str_duration;		// 文件总时长，字符串返回 小时:分钟:秒:秒(小数)
	int videoWidth;				// 视频宽度
	int videoheight;				// 视频高度
	int videoFps;				// 视频帧率
}TRTCStreamInfo;

typedef struct TRTCStreamPosInfo {
public:
	TRTCStreamPosInfo() {
		curVideoPlayPosMSec = 0;
	}
	unsigned long long curVideoPlayPosMSec;
}TRTCStreamPosInfo;

////////////////////////////////////////////////////////////////////////////////////////
//
// - 媒体文件，读取解码后，通过下面的接口回调。
//
////////////////////////////////////////////////////////////////////////////////////////
class IMediaStreamDataListener {
public:
	// 视频数据回调
	virtual void onMediaStreamVideoDecode(TRTCDecodeVideoFrame* frame) {}
	// 音频数据回调
    virtual void onMediaStreamAudioDecode(TRTCDecodeAudioFrame* frame) {}
};

typedef struct TRTCStreamParam {
public:
	TRTCStreamParam() {
		isSuppertAudio = true;
		isLoop = false;
		isCallbackMode = true;

		// 视频输出格式，目前只支持 I420 和 RGBA 数据输出
		videoFormat = MEDIAPLAY_VIDEOPROCESS_FORMAT_I420;

		// 音频输出格式
		audioSampleRate = 48000;
		audioChannels = 1;
		audioSampleFormat = MEDIAPLAY_AV_SAMPLE_FMT_S16;
	}
    
    TRTCStreamParam(const TRTCStreamParam& param){
        isSuppertAudio = param.isSuppertAudio;
        isLoop = param.isLoop;
        isCallbackMode = param.isCallbackMode;
        videoFormat = param.videoFormat;
        audioSampleRate = param.audioSampleRate;
        audioChannels = param.audioChannels;
        audioSampleFormat = param.audioSampleFormat;
    }
    
    TRTCStreamParam& operator = (const TRTCStreamParam& param){
        isSuppertAudio = param.isSuppertAudio;
        isLoop = param.isLoop;
        isCallbackMode = param.isCallbackMode;
        videoFormat = param.videoFormat;
        audioSampleRate = param.audioSampleRate;
        audioChannels = param.audioChannels;
        audioSampleFormat = param.audioSampleFormat;
        return *this;
    }
    
	bool isSuppertAudio;	// 是否打开音频轨
	bool isLoop;		    // 当前视频播读取完后，是否循环读取当前视频
	bool isCallbackMode;	// 音频数据是否是回调方式通知给客户。

	// 视频输出格式
	TRTCIFormat videoFormat;

	// 音频输出格式
	int                 audioSampleRate;
	int                 audioChannels;
	TRTCIAVSampleFormat     audioSampleFormat;
}TRTCStreamParam;

// 播放事件
typedef enum tagMediaStreamEventType
{
	EVENT_MEDIAPLAY_PLAY_SUCCESS = 0,			// 播放成功事件
	EVENT_MEDIAPLAY_MEDIA_STOP = 1 ,          // 非手动播放停止事件; 1,文件播放完  2，视频断流
	EVENT_MEDIAPLAY_MEDIA_PAUSE = 2,			// 暂停播放
	EVENT_MEDIAPLAY_MEDIA_RESUME = 3,			// 恢复播放

	EVENT_MEDIAPLAY_ERROR_PLAY = 11,			// 播放失败；1，文件不存在  2，视频流不存在 3,不支持该封装格式
	EVENT_MEDIAPLAY_ERROR_STREAM_FORMAT = 12,		// 不支持流格式		1，不支持音视频格式解码
	EVENT_MEDIAPLAY_ERROR_AUDIO_DEVICE = 13,		// 音频设备打开失败	1，需要播放音频轨时，声卡打开失败
	EVENT_MEDIAPLAY_ERROR_MEDIE_INFO = 14,	// 获取视频信息错误			1，不支持视频格式
}tagMediaStreamEventType;

///////////////////////////////////////////////////////////////////////////////////
//
// - 流读取解码过程中相关事件通过接口回调
//
//////////////////////////////////////////////////////////////////////////////////
class IMediaPlayNotifyListener {
public:
	/**
	* \brief 事件通知
	* \param event 事件id
	* \param param 事件参数
	*/
	virtual void onMediaPlayerNotifyEvent(int event, void* param) {}
};
#endif /*__TRTCMEDIA_STREAMREADER_DEF_H__*/
