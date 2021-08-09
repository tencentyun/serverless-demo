# -*- coding: utf8 -*-
import json
import logging
import os
import subprocess
import sys
import time
import uuid

from business.common.http import err_resp, callback, response, build_callback
from business.common import const
from business.common.util import get_value, clear_files
from business.handler.concater import Concat


# 日志配置
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


# 主函数
def main_handler(event, context):
    logger.info("start main handler")
    request_id = context.get('request_id')
    task_id = str(uuid.uuid1())

    work_dir = "/tmp"
    if os.environ.get('CFS_PATH'):
        work_dir = os.environ.get('CFS_PATH')

    # ffmpeg赋予执行权限
    subprocess.run(
        'cp ./tools/ffmpeg /tmp/ffmpeg && chmod 755 /tmp/ffmpeg',
        shell=True)

    # ffprobe赋予执行权限
    subprocess.run(
        'cp ./tools/ffprobe /tmp/ffprobe && chmod 755 /tmp/ffprobe',
        shell=True)

    # 请求从API网关传递,通过网关获取TRTC参数，在body中获取
    if "requestContext" not in event.keys():
        return {"code": 410, "errorMsg": "event is invalid"}
    if "body" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from api gateway"}

    # 解析request请求body
    # 参数错误通过回调返回错误，提示校验参数
    req_body = event['body']
    callback_url = ""
    try:
        req_param = json.loads(req_body)
        logger.info("input params: " + json.dumps(req_param))

        action = req_param['Action']
        video_items = req_param['Data']['URLs']
        callback_url = req_param['Data']['CallbackURL']
        skip_single_file = req_param['Data'].get('SkipSingleFile', 'True')

        target_video_format = req_param['Data']['TargetVideoSpec'].get('Format', const.VIDEO_FORMAT_MP4)
        target_video_codec = req_param['Data']['TargetVideoSpec'].get('Codec', const.VIDEO_CODEC_H264)

        target_video_width = req_param['Data']['TargetVideoSpec']['Resolution']['Width']
        target_video_height = req_param['Data']['TargetVideoSpec']['Resolution']['Height']

        target_frame_rate = None
        target_bit_rate = None
        target_video_framerate = req_param['Data']['TargetVideoSpec'].get('Framerate')
        target_video_bitrate = req_param['Data']['TargetVideoSpec'].get('Bitrate')
        if target_video_framerate:
            target_frame_rate = target_video_framerate.get('Value')
        if target_video_bitrate:
            target_bit_rate = target_video_bitrate.get('Value')

        target_audio_spec = req_param['Data'].get('TargetAudioSpec')
        if target_audio_spec:
            # 音频格式，目前仅支持aac
            target_audio_format = target_audio_spec.get('Format', const.AUDIO_CODEC_ACC)
            if target_audio_format != const.AUDIO_CODEC_ACC:
                raise KeyError('audio encode format invalid')

        vod_region = req_param['Data']['Output']['Vod'].get('Region')
        vod_sub_app_id = req_param['Data']['Output']['Vod'].get('SubAppId')

        # 参数校验
        if action != const.ACTION_COMPOSE_MEDIA:
            raise KeyError('action is invalid')

        if not video_items:
            raise KeyError('video items is empty')

        if not callback_url:
            logger.warning("callback url is empty, please check.")

        # 视频格式目前仅支持.mp4
        if target_video_format != const.VIDEO_FORMAT_MP4:
            raise KeyError('video format invalid')

        if target_video_codec != const.VIDEO_CODEC_H264:
            raise KeyError('video encode format invalid')

        if target_video_width <= 0 or target_video_height <= 0:
            raise KeyError('video encode width or height invalid')

    except Exception as err:
        logger.error("bad request: %s, please check." % (str(err),))
        message = "bad request: %s, please check." % (str(err),)
        resp = err_resp(const.ERROR_CODE_INVALID_PARAMETER, message, request_id)
        callback_body = {
            "Result": "Failure",
            "ErrorCode": const.ERROR_CODE_INVALID_PARAMETER,
            "ErrorMessage": "invalid parameter: " + str(err),
            "TaskID": task_id,
            "RequestId": request_id,
            "VodRequestId": ""
        }
        callback(callback_url, callback_body)
        return json.dumps(resp)

    # 视频文件本地存放目录
    download_path = os.path.join(work_dir, 'record_%d' % (int(round(time.time() * 1000)),))
    if not os.path.exists(download_path):
        os.makedirs(download_path)
    logger.info("local video path: " + download_path)

    try:
        concat = Concat(task_id, video_items, download_path)

        # step1：下载视频文件到本地
        video_list = concat.download_serial(video_items=video_items)
        if len(video_list) != len(video_items):
            logger.error("download some media file failed, downloaded media files: ", video_list)
            raise KeyError('download some media file failed.')

        # 如果skip_single_file=='True'并且只有一个源视频文件
        # 跳过视频处理，直接上传VOD
        if skip_single_file == 'True' and len(video_list) == 1:
            concat_result_file = video_list[0]
        else:
            # step2: 调整视频分辨率
            concat_video_list = concat.scale(video_list, target_video_width, target_video_height)
            if len(concat_video_list) != len(video_items):
                logger.error("scale some media file failed, scaled media files: ", concat_video_list)
                raise KeyError("scale some media file failed.")

            # step3: 视频拼接
            result_file = concat.concat_videos(concat_video_list)
            if not result_file:
                logger.error("concat media file failed, concat media files: ", concat_video_list)
                raise KeyError("concat media file failed.")

            # step4: 拼接视频转换目标帧率和码率
            rate_trans_file = concat.frame_bit_rate(result_file, target_frame_rate, target_bit_rate)
            concat_result_file = rate_trans_file

        # step5: 上传拼接视频到VOD
        if not os.path.exists(concat_result_file):
            message = "internal error: concat result file not exist."
            resp = err_resp(const.ERROR_CODE_INTERNAL_ERROR, message, request_id)
            callback_body = {
                "Result": "Failure",
                "ErrorCode": const.ERROR_CODE_INTERNAL_ERROR,
                "ErrorMessage": "internal error: concat result file not exist.",
                "TaskID": task_id,
                "RequestId": request_id,
                "VodRequestId": ""
            }
        else:
            media_id, media_url, cover_url, vod_request_id = concat.upload_vod(vod_region, vod_sub_app_id, concat_result_file)
            logger.info("upload vod, file id[%s], media url[%s]" % (media_id, media_url))
            if not media_url:
                message = "internal error: upload Media file error."
                resp = err_resp(const.ERROR_CODE_INTERNAL_ERROR, message, request_id)
                callback_body = {
                    "Result": "Failure",
                    "ErrorCode": const.ERROR_CODE_INTERNAL_ERROR,
                    "ErrorMessage": "internal error: upload Media file error.",
                    "TaskID": task_id,
                    "RequestId": request_id,
                    "VodRequestId": vod_request_id
                }
            else:
                resp = response(task_id, request_id)
                callback_body = {
                    "Result": "Success",
                    "FileId": media_id,
                    "MediaUrl": media_url,
                    "TaskID": task_id,
                    "RequestId": request_id,
                    "VodRequestId": vod_request_id
                }

    except Exception as err:
        logging.exception(err)
        resp = err_resp(const.ERROR_CODE_INVALID_PARAMETER, str(err), request_id)
        callback_body = {
            "Result": "Failure",
            "ErrorCode": const.ERROR_CODE_INTERNAL_ERROR,
            "ErrorMessage": "internal error: " + str(err),
            "TaskID": task_id,
            "RequestId": request_id,
            "VodRequestId": ""
        }
        pass

    # 回调逻辑
    callback(callback_url, callback_body)

    # 清理工作目录
    try:
        logger.info("clear work dir...")
        clear_files(download_path)
    except Exception as err:
        logging.exception(err)
        pass

    return json.dumps(resp)
