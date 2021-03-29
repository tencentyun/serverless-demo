# -*- coding: utf8 -*-
import json
import os
import subprocess
import logging
import sys
import re
import requests

#ffmpeg命令
#视频转flv推流RTMP
video_2rtmp = './ffmpeg -re -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 -reconnect_delay_max 2 -progress /dev/stdout -ss %s -i "%s"  -c copy -f flv -flvflags no_duration_filesize "%s" '

def main_handler(event, context):
    
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

    child = subprocess.Popen(video_2rtmp %(ss, video_url, rtmp_url), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True, shell=True)

    while True:
        # 实时进度信息
        line = child.stdout.readline().decode("utf-8")
        print(line)

        # 提取进度中时间信息
        time = re.search("time=[0-9]+:[0-5][0-9]:[0-5][0-9].[0-9]+", line)
        if time:
            # 时间格式 time=00:00:00.00 如需要记录，可以将该信息写入持久化存储
            print(time.group())

        if line.strip() == '' and child.poll() is not None:
            break

    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {'Content-Type': 'text/html'},
        "body": ""
    }