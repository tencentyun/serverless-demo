import json
import logging
import os
import subprocess
import sys
import time

import requests

from qcloud_vod.model import VodUploadRequest
from qcloud_vod.vod_upload_client import VodUploadClient

cmd_download = "curl -o %s  '%s' -H 'Connection: keep-alive' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'  " \
               "-H 'Accept: */*' -H 'Referer: %s' -H 'Accept-Language: zh-CN,zh;q=0.9,en-US;q=0.8,en-HK;q=0.7,en;q=0.6' -H 'Range: bytes=0-' --compressed --insecure"
video_concat_command = '''/tmp/ffmpeg -y -f concat -safe 0 -i %s -c copy -movflags +faststart -an %s'''
add_audio_command = '''/tmp/ffmpeg -y -i %s -stream_loop 0 -i %s -map 0:v -map 1:a -c:v copy -shortest %s'''

# 日志配置
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


def main_handler(event, context):
    logger.info("start main handler")
    request_id = context.get('request_id')

    if "body" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from api gateway"}

    req_body = event['body']
    callback_url = ""
    try:
        req_param = json.loads(req_body)
        logger.info("输入参数: " + json.dumps(req_param))
        video_urls = req_param['Data']['Input']['URLs']
        audio_url = req_param['Data']['Input']['Audio']
        callback_url = req_param['Data']['Input']['CallbackURL']
        vod_region = req_param['Data']['Output']['Vod']['Region']
        sub_app_id = req_param['Data']['Output']['Vod']['SubAppId']
        class_id = req_param['Data']['Output']['Vod']['ClassId']

        if not callback_url:
            logger.warning("Callback url是空的，请检查。")
    except Exception as err:
        message = "bad request: %s, please check." % (str(err))
        logger.error(message)
        resp = {
            'ErrorCode': 'InvalidParameter',
            'ErrorMessage': message,
            'RequestID': request_id
        }
        callback_body = {
            "Result": "Failure",
            "ErrorCode": "InvalidParameter",
            "ErrorMessage": "Invalid parameter: " + str(err),
            "RequestId": request_id
        }
        callback(callback_url, callback_body)
        return json.dumps(resp)

    # 将ffmpeg文件复制到/tmp下并赋予执行权限
    subprocess.run(
        'cp ./ffmpeg /tmp/ffmpeg && chmod 755 /tmp/ffmpeg',
        shell=True)

    try:
        logger.info('开始下载视频：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        local_files = download(video_urls)
        logger.info('视频下载完成：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

        logger.info('开始拼接视频：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        output_without_audio_path = '/tmp/output_without_audio.mp4'
        file_list = os.path.join('/tmp/', "file_list.txt")
        f = open(file_list, 'w+')
        for video in local_files:
            f.write('file \'' + video + '\'\n')
        f.close()

        child = subprocess.run(video_concat_command % (file_list, output_without_audio_path), stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, close_fds=True, shell=True)
        if child.returncode == 0:
            print("success:", child)
        else:
            logger.info("拼接视频失败, 错误: ")
            logger.error(child)
            raise KeyError("拼接视频失败, 错误: ", child)
        logger.info('拼接视频完成：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

        logger.info('开始添加音频：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        output_video_path = '/tmp/output.mp4'
        child = subprocess.run(add_audio_command % (output_without_audio_path, audio_url, output_video_path),
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, close_fds=True, shell=True)
        if child.returncode == 0:
            print("success:", child)
        else:
            print("error:", child)
            raise KeyError("添加音频失败, 错误: ", child.stderr)
        logger.info('添加音频完成：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

        logger.info('开始上传视频：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))
        uploaded_video_url = upload_vod(vod_region, sub_app_id, class_id, output_video_path)
        logger.info('上传视频完成：' + time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()))

        callback_body = {
            "Result": "Success",
            "Data": {
                "OutputUrl": uploaded_video_url
            },
            "RequestId": request_id
        }
    except Exception as err:
        logging.error(err)
        callback_body = {
            "Result": "Failure",
            "ErrorCode": "InternalError",
            "ErrorMessage": "internal error: " + str(err),
            "RequestId": request_id
        }
        pass

    # 回调逻辑
    callback(callback_url, callback_body)

    # 清理工作目录
    clear_files('/tmp/')

    return callback_body


# 回调逻辑。
def callback(url, data):
    if not url:
        logger.info("Callback url is empty, no need to callback.")
        return

    response = requests.post(url, json=data)
    logger.info("Callback response:", response.text.encode('utf8'))


def clear_files(src):
    try:
        logger.info("clear work dir...")
        if os.path.isfile(src):
            os.remove(src)
        elif os.path.isdir(src):
            for item in os.listdir(src):
                itemsrc = os.path.join(src, item)
                clear_files(itemsrc)
    except Exception as err:
        logging.exception(err)
        pass


# 视频上传VOD，sdk自动选择普通上传还是分片上传
def upload_vod(vod_region, sub_app_id, class_id, media_file_path):
    secret_id = os.environ.get("TENCENTCLOUD_SECRETID")
    secret_key = os.environ.get("TENCENTCLOUD_SECRETKEY")
    token = os.environ.get("TENCENTCLOUD_SESSIONTOKEN")
    if not vod_region:
        vod_region = os.environ.get('TENCENTCLOUD_REGION')

    client = VodUploadClient(secret_id, secret_key, token)
    request = VodUploadRequest()
    request.SubAppId = sub_app_id
    request.MediaFilePath = media_file_path
    request.ClassId = class_id
    response = client.upload(vod_region, request)
    logger.info("Upload Success. FileId: %s. MediaUrl: %s, RequestId: %s" % (response.FileId, response.MediaUrl,
                                                                             response.RequestId))
    return response.MediaUrl


def download(video_urls):
    local_files = []

    for url in video_urls:
        filename = os.path.basename(url).split('?')[0]
        (_filename, ext) = os.path.splitext(filename)
        download_file = os.path.join("/tmp", '%s_%s%s' %
                                     (_filename, int(round(time.time() * 1000)), ext))

        command = cmd_download % (download_file, url, url)
        logger.info("download media command: %s" % command)

        # 从url下载视频文件
        ret = subprocess.run(command, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("下载[%s]完成, 详情: %s" % (url, ret.stdout))
        else:
            logger.info("下载[%s]失败, 错误: %s" % (url, ret.stderr))
            raise KeyError("下载[%s]失败, 错误: %s" % (url, ret.stderr))

        if os.path.exists(download_file):
            logger.info("下载[%s]成功, 本地文件路径：[%s]" % (url, download_file))
            local_files.append(download_file)
        else:
            logger.info("下载[%s]失败, 本地文件不存在。" % url)
            raise KeyError("下载[%s]失败, 本地文件不存在。" % url)

    return local_files


if __name__ == '__main__':
    event = {
        'body': '''{
            "Action": "SpliceVideo",
            "Data": {
                "Input": {
                    "URLs": [
                    "http://1.mp4", 
                    "http://2.mp4", 
                    "http://3.mp4", 
                    "http://4.mp4", 
                    "http://5.mp4", 
                    "http://6.mp4"
                    ],
                    "Audio": "https://bn-1254108098.cos.ap-guangzhou.myqcloud.com/26s_2021-12-06_18-01-39-779.mp3",
                    "Transitions": "None",
                    "CallbackURL": "https://enk885gn0j1qox.m.pipedream.net",
                    "SkipSingleFile": "True"
                },
                "Output": {
                    "Vod": {
                        "Region": "ap-beijing",
                        "SubAppId": 1500009267,
                        "ClassId": 873369
                    }
                }
            }
        }'''
    }
    context = {
        "request_id": "123"
    }
    video_concat_command = '''ffmpeg -y -f concat -safe 0 -i %s -c copy -movflags +faststart -an %s'''
    add_audio_command = '''ffmpeg -y -i %s -stream_loop -1 -i %s -map 0:v -map 1:a -c:v copy -shortest %s'''
    main_handler(event, context)
