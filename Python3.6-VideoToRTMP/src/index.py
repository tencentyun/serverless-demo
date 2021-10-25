# -*- coding: utf8 -*-
import json
import os
import subprocess
import re
import random
import string
import time

#ffmpeg命令
#视频转flv推流RTMP
online_video_2rtmp = '/tmp/ffmpeg -re -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 2 -progress /dev/stdout -ss %s -i "%s"  -c copy -f flv -flvflags no_duration_filesize "%s" '
#参数：视频起始时间、Video地址，目标的RTMP
loop_offline_video_2rtmp = '/tmp/ffmpeg -re -stream_loop -1 -progress /dev/stdout -ss %s -i "%s"  -c copy -f flv -flvflags no_duration_filesize "%s" '
#参数：输出帧率，图片地址，时长（如10s），宽，高，输出文件地址（如/tmp/output.mp4）
image_2video = '/tmp/ffmpeg -y -framerate %s -i "%s" -c:v libx264 -t %s -pix_fmt yuv420p -vf scale=%s:%s  %s'
## 默认参数
default_target_img_width, default_target_img_height, default_img_2_video_duration, default_img_loop_duration, default_img_2_video_framerate = 1280, 720, "10s", "3600", 24

def wait_for_subprocess_command(command, max_duration_in_seconds=None):
    print("Begin to run command in subprocess: {}".format(command))
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True, shell=True)

    start_time = time.time()
    while True:
        # 实时进度信息
        line = process.stdout.readline().decode("utf-8")
        print(line)

        # 提取进度中时间信息
        time_log_record = re.search("time=[0-9]+:[0-5][0-9]:[0-5][0-9].[0-9]+", line)
        if time_log_record:
            # 时间格式 time=00:00:00.00 如需要记录，可以将该信息写入持久化存储
            print(time_log_record.group())

        if line.strip() == '' and process.poll() is not None:
            break
        if max_duration_in_seconds and time.time() > start_time + max_duration_in_seconds:
            break


def main_handler(event, context):

    # 为了适配windows端用户
    # 将ffmeg文件复制到/tmp下并赋予执行权限
    subprocess.run(
        'cp ./ffmpeg /tmp/ffmpeg && chmod 755 /tmp/ffmpeg',
        shell=True)
    
    data, video_url, rtmp_url, target_output_video_path = {}, "", "", ""
    #判断请求是否从API网关传递
    if "body" in event.keys():
        body = event['body']
        data = json.loads(body)
        # 视频文件地址，必选项
        video_url = data['video_url']
        # RTMP推流地址，需包含鉴权信息，必选项
        rtmp_url = data['rtmp_url']

        # 播放起始时间点，可选参数，默认从文件头开始
        if 'ss' in data:
            ss = data['ss']
        else:
            ss = '00:00:00.00'

    # 其他触发器逻辑可以自行添加
    else:
        return {"code": 410, "errorMsg": "event does not come from APIGW"}

    _, video_file_extension = os.path.splitext(video_url)

    if video_file_extension.lower() in [ ".png",".jpg", ".jpeg"]:
        # 图片转换为MP4
        target_output_video_path = "/tmp/{}.mp4".format(''.join(random.choice(string.ascii_lowercase) for i in range(16)))

        print("Begin to generate video to {} from image {}".format(target_output_video_path, video_url))
        target_img_width = ('width' in data and data['width']) or default_target_img_width
        target_img_height = ('height' in data and data['height']) or default_target_img_height
        target_video_fps = ('fps' in data and data['fps']) or default_img_2_video_framerate
        target_video_duration = default_img_2_video_duration

        transcoding_command = image_2video %(target_video_fps ,video_url, target_video_duration, target_img_width, target_img_height, target_output_video_path)
        wait_for_subprocess_command(transcoding_command)
        ## 输入/tmp中生成的临时视频文件
        push_command = loop_offline_video_2rtmp %(ss,target_output_video_path, rtmp_url) 
    
        print("Begin to push to rtmp from {}".format(target_output_video_path))
        push_rtmp_duration = ('duration' in data and data['duration']) or default_img_loop_duration
        wait_for_subprocess_command(push_command, push_rtmp_duration)

        if(os.path.exists(target_output_video_path)):
            os.remove(target_output_video_path)
    else:
        print("Begin to push to rtmp from {}".format(video_url))
        ## 默认的推流命令
        push_command = online_video_2rtmp %(ss, video_url, rtmp_url)
        wait_for_subprocess_command(push_command)
    
    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {'Content-Type': 'text/html'},
        "body": ""
    }