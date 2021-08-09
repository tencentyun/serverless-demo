'''
@Project ：py
@File    ：concater.py
@Author  ：Tencent Cloud Serverless
'''
"""
文件说明：
基于ffmpeg实现视频拼接，将拼接后的视频上传VOD服务
"""
# -*- coding: UTF-8 -*-

import json
import logging
import os
import subprocess
import sys
import time

from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_vod.vod_upload_client import VodUploadClient
from qcloud_vod.model import VodUploadRequest

# ffmpeg命令定义
cmd_path_ffmpeg = '/tmp/ffmpeg'
# ffmpeg命令，拼接视频
cmd_video_concat = cmd_path_ffmpeg + ' -f concat -safe 0 -i %s -c copy -movflags +faststart %s'
# ffmpeg命令，视频补黑边
cmd_video_scale = cmd_path_ffmpeg + ' -i %s -vf %s %s'
# 码率控制
cmd_video_biterate = cmd_path_ffmpeg + ' -i %s -c:v libx264 -x264-params nal-hrd=cbr:force-cfr=1 -b:v %d -bufsize %d -minrate %d -maxrate %d %s'
# 帧率控制
cmd_video_framerate = cmd_path_ffmpeg + ' -i %s -r %s %s'
# 帧率、码率控制
cmd_video_frame_bit_rate = cmd_path_ffmpeg + ' -i %s %s %s'

# ffprobe命令定义
cmd_path_ffprobe = '/tmp/ffprobe'
# ffprobe命令定义，查询视频信息
cmd_query_video_info = cmd_path_ffprobe + ' -select_streams v -show_entries format=duration,size,bit_rate,filename -show_streams -v quiet -of csv="p=0" -of json -i %s'

# curl通过媒体URL下载视频文件，模拟浏览器下载
cmd_download = "curl -o %s  '%s' -H 'Connection: keep-alive' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'  " \
                       "-H 'Accept: */*' -H 'Referer: %s' -H 'Accept-Language: zh-CN,zh;q=0.9,en-US;q=0.8,en-HK;q=0.7,en;q=0.6' -H 'Range: bytes=0-' --compressed --insecure"

# 日志配置
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


class Concat:
    def __init__(self, task_id, video_items, download_path):
        self.task_id = task_id
        self.video_items = video_items
        self.download_path = download_path

        # 内置环境变量
        secret_id = os.environ.get('TENCENTCLOUD_SECRETID')
        secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')
        token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')
        self.region = os.environ.get('TENCENTCLOUD_REGION')

        # 自定义环境变量
        env_secret_id = os.environ.get('SECRET_ID')
        env_secret_key = os.environ.get('SECRET_KEY')
        self.cos_bucket = os.environ.get('CODE_COS_BUCKET')

        # 如果用户配置了长久密钥则使用长久密钥，没有使用临时密钥
        if env_secret_id and env_secret_key:
            secret_id = env_secret_id
            secret_key = env_secret_key

        # cos客户端初始化
        self.cos_client = CosS3Client(CosConfig(Region=self.region, SecretId=secret_id,
                                                SecretKey=secret_key, Token=token))

        # 初始化VOD客户端
        self.vod_client = VodUploadClient(secret_id, secret_key, token)

    # 获取源视频信息，分辨率等
    def ffprobe_info(self, file_path):
        video_info = None

        command = cmd_query_video_info % (file_path,)
        logger.info("ffprobe query file info command: %s" % (command,))
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             close_fds=True, shell=True)
        if ret.returncode == 0:
            logger.info('query file info command finished.')
            video_info = json.loads(ret.stdout)
        else:
            logger.warning('query file info command failed, ret code: {}, err: {}'.format(ret.returncode, ret.stderr))

        return video_info

    # 查询视频文件宽和高
    def query_width_height(self, file_path):
        width = -1
        height = -1

        video_info = self.ffprobe_info(file_path)
        if video_info:
            width = video_info['streams'][0]['width']
            height = video_info['streams'][0]['height']

        logger.info("media file width[%s], height[%s]" % (width, height))

        return width, height

    # 模拟浏览器行为下载源视频文件
    def download(self, media_url):
        local_file_path = ""

        filename = os.path.basename(media_url).split('?')[0]
        (_filename, ext) = os.path.splitext(filename)
        download_file = os.path.join(self.download_path, '%s_%s%s' % (_filename, int(round(time.time() * 1000)), ext))

        command = cmd_download % (download_file, media_url, media_url)
        logger.info("download media command: %s" % (command,))

        # 从url下载视频文件
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("download file from url[%s] finished, details: %s" % (media_url, ret.stdout))
        else:
            logger.info("download file from url[%s] failed, err: %s" % (media_url, ret.stderr))

        if os.path.exists(download_file):
            logger.info("download from url[%s] success, local file path[%s]" % (media_url, download_file))
            local_file_path = download_file
        else:
            logger.info("download from url[%s] failed, local file not exist." % (media_url,))

        return local_file_path

    def download_serial(self, video_items):
        video_list = []
        for media_url in video_items:
            local_file_path = self.download(media_url)
            if local_file_path:
                video_list.append(local_file_path)

        print("download media file list: ", os.listdir(self.download_path))
        return video_list

    # 视频分辨率处理
    # param: video_list, 源视频列表
    # param: target_video_width, 目标视频宽度
    # param: target_video_height, 目标视频高度
    def scale(self, video_list, target_video_width, target_video_height):
        logger.info("start scale media files, target width[%s], height[%s]" % (target_video_width, target_video_height))
        concat_video_list = []
        if len(video_list) <= 0:
            print("local video file not exist, please check.")
            return concat_video_list
        # 处理视频分辨率
        # 如果源视频宽、高都小于目标宽、高，直接四周补黑边，不做尺寸调整
        # 如果源视频宽 > 目标宽，先同比例尺寸变换，源视频<width, height>-><target_video_width, height * target_video_width / width>
        # 如果调整后视频高 <= 目标高，上下补黑边；如果调整视频高 > 目标高，再做同比例尺寸变换，将视频高缩小到目标高，左右补黑边；
        # 如果源视频宽 < 目标宽 & 源视频高 > 目标高，先同比例尺寸变换, 将视频高缩小到目标高，左右补黑边
        start = int(time.time())
        for video in video_list:
            width, height = self.query_width_height(video)
            if width != target_video_width or height != target_video_height:
                x = 0
                y = 0
                scale_param = ""
                if width < target_video_width and height <= target_video_height:
                    x = (target_video_width - width)/2
                    y = (target_video_width - height)/2
                    scale_param = "pad=%d:%d:%d:%d:black" % (target_video_width, target_video_height, x, y)
                else:
                    if width > target_video_width:
                        _width = target_video_width
                        _height = height * target_video_width / width
                        if _height <= target_video_height:
                            x = 0
                            y = (target_video_height - _height) / 2
                            scale_param = "scale=%d:%d,pad=%d:%d:%d:%d:black" % (
                            _width, _height, target_video_width, target_video_height, x, y)
                        else:
                            _width = _width * target_video_height / _height
                            _height = target_video_height
                            x = (target_video_width - _width) / 2
                            y = 0
                            scale_param = "scale=%d:%d,pad=%d:%d:%d:%d:black" % (
                            _width, _height, target_video_width, target_video_height, x, y)
                    else:
                        if height > target_video_height:
                            _width = width * target_video_height / height
                            _height = target_video_height
                            x = (target_video_width - _width) / 2
                            y = 0
                            scale_param = "scale=%d:%d,pad=%d:%d:%d:%d:black" % (
                                _width, _height, target_video_width, target_video_height, x, y)
                scaled_video = self.scale_video(video, scale_param)
                if scaled_video:
                    concat_video_list.append(scaled_video)
            else:
                concat_video_list.append(video)

        end = int(time.time())
        logger.info("scale all media files duration(s): %d" % (end - start,))
        return concat_video_list

    # 视频补黑边
    # 视频拼接要求分辨率1600x900,对非标准分辨率补黑边处理，标准分辨率视频直接返回
    def scale_video(self, source_file, scale_param):
        scale_file_path = ""
        if not source_file:
            logger.warning("scale video file is empty, please check.")
            return scale_file_path

        if os.path.exists(source_file):
            source_file_name = os.path.basename(source_file)
            scale_file_path = os.path.join(self.download_path, "%s_scaled_%s" % (self.task_id, source_file_name,))
            command = cmd_video_scale % (source_file, scale_param, scale_file_path)
            logger.info("scale command: %s" % (command, ))
            start = int(time.time())
            ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
            if ret.returncode == 0:
                logger.info("scale media file[%s] finished, local file[%s]." % (source_file, scale_file_path))
            else:
                logger.warning("scale media file[%s] failed, err code: %s" % (source_file, ret.stderr))
                scale_file_path = ""

            end = int(time.time())
            logger.info("scale media file[%s] duration(s): %d" % (source_file, end - start))

            if not os.path.exists(scale_file_path):
                scale_file_path = ""
        else:
            logger.info("scale file: file[%s] not exist." % (source_file,))

        return scale_file_path

    # 视频拼接，多个视频拼接成一个视频
    # 如果只有一个视频，直接返回
    def concat_videos(self, concat_video_list):
        result_file = ""
        if len(concat_video_list) <= 0:
            logger.warning("concat video files: file not exist, please check.")
            return result_file

        file_list = os.path.join(self.download_path, "file_list.txt")
        f = open(file_list, 'w+')
        for video in concat_video_list:
            f.write('file \'' + video + '\'\n')
        f.close()

        result_file = os.path.join(self.download_path, "%s_composed_result.mp4" % (self.task_id,))
        command = cmd_video_concat % (file_list, result_file)
        logger.info("concat command:%s" % (command,))
        start_time = int(time.time())
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("concat finished, concat file[%s]." % (result_file,))
        else:
            logger.warning("concat failed, details: %s, err code: %s" % (ret.stdout, ret.stderr))
            result_file = ""

        if not os.path.exists(result_file):
            result_file = ""

        end_time = int(time.time())
        logger.info("concat media files duration(s): %d" % (end_time - start_time))

        return result_file

    # 调整视频码率
    # param: source_file, 源视频文件
    # param:rate, 目标码率，kb/s
    def bit_rate(self, source_file, rate):
        dst_file = ""
        if not os.path.exists(source_file):
            logger.warning("adjust biterate: source file[%s] not exist" % (source_file,))
            return dst_file

        video_info = self.ffprobe_info(source_file)
        file_bit_rate = int(video_info['streams'][0]['bit_rate'])/1000

        if not rate or file_bit_rate == rate:
            logger.info("no need to adjust the bitrate of media file[%s]" % (source_file,))
            return source_file

        dst_file = os.path.join(self.download_path, "%s_bitrate.mp4" % (self.task_id,))
        command = cmd_video_biterate % (source_file, rate*1000, rate*1000, rate*1000, rate*1000, dst_file)
        start_time = int(time.time())
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("adjust media file[%s] bitrate finished." % (source_file,))
        else:
            logger.warning("adjust media file[%s] bitrate failed, err code: %s" % (source_file, ret.stderr,))
            dst_file = ""

        end_time = int(time.time())
        logger.info("adjust media file[%s] bitrate duration(s): %d" % (source_file, end_time - start_time))

        if not os.path.exists(dst_file):
            dst_file = ""

        return dst_file

    # 视频帧率调整
    # param: source_file, 源视频文件
    # param: rate, 目标帧率
    def frame_rate(self, source_file, rate):
        dst_file = ""
        if not os.path.exists(source_file):
            logger.warning("adjust framerate: source file[%s] not exist" % (source_file,))
            return dst_file

        video_info = self.ffprobe_info(source_file)
        file_frame_rate = eval(video_info['streams'][0]['r_frame_rate'])

        if not rate or file_frame_rate == rate:
            return source_file

        dst_file = os.path.join(self.download_path, "%s_frame.mp4" % (self.task_id,))
        command = cmd_video_framerate % (source_file, rate, dst_file)
        start_time = int(time.time())
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("adjust media file[%s] framerate finished." % (source_file,))
        else:
            logger.warning("adjust media file[%s] framerate failed, err code: %s" % (source_file, ret.stderr,))

        end_time = int(time.time())
        logger.info("adjust media file[%s] framerate duration(s): %d" % (source_file, end_time - start_time))

        if not os.path.exists(dst_file):
            dst_file = ""

        return dst_file

    # 视频帧率和码率同步调整
    # param: frame_rate, 目标帧率
    # param: bit_rate, 目标码率，kb/s
    def frame_bit_rate(self, source_file, frame_rate, bit_rate):
        dst_file = ""
        if not os.path.exists(source_file):
            logger.warning("adjust framerate and bitrate rate: source file[%s] not exist" % (source_file,))
            return dst_file

        video_info = self.ffprobe_info(source_file)
        file_frame_rate = eval(video_info['streams'][0]['r_frame_rate'])
        file_bit_rate_kb = int(video_info['streams'][0]['bit_rate'])/1000

        if file_frame_rate == frame_rate and file_bit_rate_kb == bit_rate:
            return source_file

        param = ""
        if frame_rate and file_frame_rate != frame_rate:
            param = "-r %s" % (frame_rate,)
        if bit_rate and file_bit_rate_kb != bit_rate:
            param = param + " -c:v libx264 -x264-params nal-hrd=cbr:force-cfr=1 -b:v %d -bufsize %d -minrate %d -maxrate %d" % (bit_rate*1000, bit_rate*1000, bit_rate*1000, bit_rate*1000)

        if not param:
            logger.info("no need to adjust media framerate and bitrate.")
            return source_file

        dst_file = os.path.join(self.download_path, "%s_frame_bit.mp4" % (self.task_id,))
        command = cmd_video_frame_bit_rate % (source_file, param, dst_file)
        start_time = int(time.time())
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            logger.info("adjust media file[%s] framerate and bitrate finished." % (source_file,))
        else:
            logger.warning("adjust media file[%s] framerate and bitrate failed, err code: %s" % (source_file, ret.stderr,))
            dst_file = ""

        end_time = int(time.time())
        logger.info("adjust media file[%s] framerate and bitrate duration(s): %d" % (source_file, end_time - start_time))

        if not os.path.exists(dst_file):
            dst_file = ""

        return dst_file

    # 视频上传VOD，sdk自动选择普通上传还是分片上传
    def upload_vod(self, vod_region, sub_app_id, media_file_path):
        media_id = None
        media_url = ""
        cover_url = ""
        vod_request_id = ""
        if not vod_region:
            vod_region = self.region

        request = VodUploadRequest()
        request.MediaFilePath = media_file_path
        if sub_app_id:
            request.SubAppId = sub_app_id
        try:
            response = self.vod_client.upload(vod_region, request)
            print("upload vod resp: ", response)
            logger.info('upload vod file id[%s], media url[%s]:' % (response.FileId, response.MediaUrl))
            media_id = response.FileId
            media_url = response.MediaUrl
            cover_url = response.CoverUrl
            vod_request_id = response.RequestId
        except Exception as err:
            # 处理业务异常
            logging.exception(err)
            pass

        return media_id, media_url, cover_url, vod_request_id