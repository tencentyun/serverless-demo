#ifndef __ITRTCMEDIAPUSHER_H__
#define __ITRTCMEDIAPUSHER_H__

#include "TRTCCloudDef.h"

/**
 * function:
 *  push media file to TRTC
 *
 * Applicable situation:
 *  1. AI classroom. linxsdk works with AI backend, AI decide to push suitable media, to response to
 *    the student.
 *  2. High quality Course push. you can push prerecorded meida file with linuxsdk to obtain higher
 *    stream upload quality, becasue of the network conditions are under control against to users with
 *    pc or mobiles.
 *
 * Claim:
 *  1. media file must be muxered by mp4 format.
 *  2. video must be encoded by h264
 *  3. audio must be encoded by aac
 *
 *  Note:
 *    Do not support multiroom(IPC mode).
 */

enum MediaPushError {
    // no error.
    kNoError = 0,

    // Maybe something wrong with TRTC (sdkappid, userid, usersig). You can check error message with
    // |OnPushError| callback's second parameter |error_message|.
    kAccountError = 1,

    // Maybe something wrong with media file, such as net broken, file is not valid, or seek failed.
    // You can check error message with |OnPushError| callback's second parameter |error_message|.
    kFileError = 2,

    // Maybe something wrong with network.
    kNetworkError = 3,
    
    // Maybe something wrong with sdk.
    kInternalError = 4,
};

enum PushContent {
    // Push audio stream only. make sure media file to push has audio track.
    kAudio = 1,
    
    // Push video stream only. make sure media file to push has audio track and video
    // track.
    kVideo = 2,

    // Push audio stream and video stream. make sure media file to push has audio track and video
    // track.
    kAudioAndVideo = 3,
};

enum PushScene {
    // such as mp4 file
    kVodFile = 1,
    
    // such as live stream of flv url.
    kLiveStream = 2,
};

enum ExpectedAudioType {
    // stereo, the channels of the audio streams will convert to 2.
    kStereo = 2,
    
    // mono, the channels of the audio streams will convert to 1.
    kMono = 1,
    
    // audio channels is specified by the first file.
    // kStereo when the audio channels in file more than 1.
    // kMono when the audio channels in file is 1.
    kAuto = 0,
};

struct PushConfig {
    // Parameters for entering TRTC room. such as room_id, sdk_app_id, user_id, user_sig.
    TRTCParams room_param;

    // The media content type.
    PushContent push_content{kAudioAndVideo};
    
    // |raw_h264| == true. have better performance than |raw_h264| == false, because of no video decode and encode,
    // when push to TRTC server.
    // the video must:
    // 1. Do not have B frame, only contains I frame and P frame.
    // 2. Gop must be less than 2 seconds.
    // To obtain the video. you can use command below:
    //     $> ffmpeng -i src.mp4 -vcodec libx264 -x264opts "bframes=0" dst.mp4
    // ffmpeg's other useful options for video transcade.
    // -r rate             set frame rate (Hz value, fraction or abbreviation)
    // -s size             set frame size (WxH or abbreviation)
    // -b bitrate          video bitrate (please use -b:v)
    //
    // |raw_h264| == false. have better compatibility than |raw_h264| == true.
    bool raw_h264{false};
    
    // default for vod file.
    // it must be seted kkLiveStream when url is a live stream.
    PushScene sence{kVodFile};
    
    // is_repeat_last_pic_when_pausing is true(|raw_h264| must be false), it will send last video frame repeatly when Pause() called,
    // and will stop sending last video frame when Resume() called.
    bool is_repeat_last_pic_when_pausing{false};
    
    // for save bindwidth.
    ExpectedAudioType audio_channels{kMono};
};


class ITRTCMediaPusher;
extern "C" {
/// @name ITRTCMediaPusher object Create and Destroy.
/// @{
/**
 * \brief 1.1 Create ITRTCMediaPusher object, nullptr for fail.
 */
ITRTCMediaPusher* CreateMediaPusher();

/**
 * \brief 1.2 Destroy ITRTCMediaPusher object.
 * \param instance must be created by |CreateMediaPusher()|.
 */
void DestroyMediaPusher(ITRTCMediaPusher* instance);
/// @}
}

class ITRTCMediaPusherCallback {
public:
    virtual ~ITRTCMediaPusherCallback() {}

    /**
     * \brief 1.1 OnPushError
     * \note it will be triggered when error occurred. you can get info from |error_message|
     */
    virtual void OnPushError(MediaPushError error_code, const char* error_message) = 0;

    /**
     * \brief 1.2 OnPushBegin
     * \param file_url the media file path.
     *
     * \note it will be triggered after |ITRTCMediaPusher.PushMedia()|, when media file open.
     */
    virtual void OnPushBegin(const char* file_url) {}

    /**
     * \brief 1.3 OnPushEnd
     * \param file_url the media file path.
     *
     * \note it will be triggered after |ITRTCMediaPusher.Stop()| called, when media file close.
     */
    virtual void OnPushEnd(const char* file_url) {}

    /**
     * \brief 1.4 OnPushProgress
     * \param file_url the media file path.
     * \param position current push location (unit millisecond).
     * \param duration the media file duration (unit millisecond).
     * \return void.
     *
     * \note it will be triggered after |OnPushBegin()| and before |0nPushEnd()|. The trigger period is
     * 1 second.
     */
    virtual void OnPushProgress(const char* file_url, int position, int duration) {}
};


// use example:
//   * step 1. create pusher resource.
//   ITRTCMediaPusher* inst = CreateMediaPusher();
//   * step 2. set callback
//   inst->SetCallback();
//   * step 3. start
//   inst->StartWithConfig()
//
//   * step 4. push, seek, pause or resume meida with url
//   inst->PushMedia() / inst->Seek() / inst->Pause() / inst->Resume()
//   you will receive OnPushBegin() / OnPushEnd() / OnPushProgress() event if success, OnPushError()
//   when failed. if you have more than 1 file to push. you can call PushMedia() to push next file
//   when previous file OnPushEnd() event triggered. as well you can call PushMedia() you like, it
//   will close previours file and open next file to push.
//
//   * step 5. stop
//   inst->Stop()
//   * step 6. destroy pusher resource.
//   inst->DestroyMediaPusher()
class ITRTCMediaPusher {
public:
    virtual ~ITRTCMediaPusher() {}

    // revoke once after |CreateMediaPusher()| called.
    virtual void SetCallback(ITRTCMediaPusherCallback* callback) = 0;

    // revoke when you want start enter room. if failed! you will receive |OnPushError()|. called
    // once.
    virtual void StartWithConfig(const PushConfig& config) = 0;

    // revoke when you want stop. called once
    virtual void Stop() = 0;

    // revoke when you want push a media file with format MP4(H264 & AAC). local file path or
    // http/https link are ok. it must be called after |StartWithConfig()| and before |Stop()|. You
    // can call |PushMedia()| towice or more, when you want switch a media file.
    // |url| is the media you want to push.
    // |id| is optional, and corresponds to the parameter |url| one-to-one, and is
    // mainly used for troubleshooting. Considering that the |url| may be important to you,
    // we will not save your |url| to our server, set |id| empty does work.
    // we will encryt url, when |id| is nullptr.
    // url will be write to the logfile for troubleshooting.
    virtual void PushMedia(const char* url, const char* id) = 0;
    
    // set watermark content, the content is a png file path or url.
    // note: do not support png pack with palette.
    // if png is invalid. you can lookup sdk log for troubleshoot.
    virtual void SetWatermarkPath(const char* png_path) = 0;
    
    // set watermark location
    // |left| value range [0,1], |top| value range [0,1], |mark_width| value range [0,1].
    // |left| + |mark_width| must be between 0 and 1.
    //
    // ex:  unit of stream_width and stream_height is pixel.
    //   watermark width equal to |mark_width| * stream_width.
    //   watermark offset to left equal to |left| * stream_width.
    //   watermark offset to top equal to |top| * stream_height.
    //   watermark height depend on watermark image's width and height.
    //   it is equal to image_height * watermark_width / image_width.
    virtual void SetWatermarkLocation(float left, float top, float mark_width) = 0;
    
    // check the validity of the watermark.
    virtual bool IsWatermarkValid() = 0;

    // revoke when you want pause media file. it will stop read and decode media content.
    // The paused period must be less than 30 seconds, for keeping in the room.
    virtual void Pause() = 0;

    // revoke when you want resume media file. it will restart read and decode media content with
    // positiong when do |Pause()|, and start to send them.
    virtual void Resume() = 0;

    // revoke when you want seek to target position in the media file.
    // |position| unit is millisecond. from begining of meida file 0ms.
    // You can get current push position by |OnPushProgress()| callback.
    // You want End the file, you can Seek to position, that over the media file duration.
    // |position| = 0x7fffffff does work.
    virtual void Seek(int position) = 0;
};

#endif  // __ITRTCMEDIAMIXER_H__
