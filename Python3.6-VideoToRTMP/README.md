## Notes

## 视频转RTMP
目前仅支持mp4和flv格式的视频文件：

    {
        "video_url": "https://xxxx.cos.ap-beijing.myqcloud.com/test.mp4",
        "rtmp_url": "rtmp://xxxx.livepush.myqcloud.com/sls_demo/rtmp_push?xxxxx"
    }

## 图片转RTMP

目前仅支持png和jpg格式的图片：

    {
        "video_url": "https://xxxx.cos.ap-beijing.myqcloud.com/test.jpg",
        "rtmp_url": "rtmp://xxxx.livepush.myqcloud.com/sls_demo/rtmp_push?xxxxx",
        "width": 1280, # 目标视频的宽度，仅源文件地址为图片的时候生效
        "height": 720, # 目标视频的高度，仅源文件地址为图片的时候生效
        "duration": 120, # 单位秒，默认1小时
        "fps": 30 # 视频帧率，默认为24
    }