# -*- coding: utf8 -*-
import os
import subprocess
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
import logging
import sys
import re
import math
import requests
import json
import copy
import time
import signal
from multiprocessing import Process, Queue
from recordClient import TLSSigAPIv2

# 命令定义
cmd_path_ffmpeg = '/tmp/ffmpeg'
# ffmpeg命令，flv音频文件转MP3文件
cmd_audio_2mp3 = cmd_path_ffmpeg + ' -i %s -f mp3 -vn %s '
# ffmpeg命令，flv音频文件转MP4文件
cmd_audio_2mp4 = cmd_path_ffmpeg + ' -i %s -vcodec copy -acodec copy %s '

# 录制命令，开启单流录制
cmd_path = './recordClient/recorderClient'
cmd_record = cmd_path + ' --demoSences %d --sdkAppId %s --roomId %d  --userId %s --userSig %s --recDir=%s --recFiles=%d --timeout=%d'
cmd_record_str_room = cmd_path + ' --demoSences %d --sdkAppId %s --roomId %s  --userId %s --userSig %s --recDir=%s --recFiles=%d --timeout=%d --strRoom=%d'

# 录制失败日志
MSG_RECORD_FAIL = "record fail"
MSG_CONVERT_FAIL = "convert fail"
MSG_UPLOAD_FAIL = "upload fail"
MSG_RECORD_SUCCESS = "record success"

# 错误码
ERROR_CODE_INVALID_PARAMETER = 'InvalidParameter'

# 日志配置
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


# 用于签发TRTC服务中必须要使用的UserSig鉴权票据
# 默认过期时间24小时
def gen_sig(sdk_appId, user_id, key):
    api = TLSSigAPIv2.TLSSigAPIv2(sdk_appId, key)
    user_sig = api.genUserSig(user_id, 86400)
    return user_sig


# 获取进程id
def get_pid(process):
    cmd = "ps aux| grep '%s'|grep -v grep " % process
    out = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
    infos = out.stdout.read().splitlines()
    pid_list = []
    if len(infos) >= 1:
        for i in infos:
            pid = i.split()[1]
            if pid not in pid_list:
                pid_list.append(pid)
        return pid_list
    else:
        return -1


# 删除本地文件
def delete_local_file(src):
    if os.path.isfile(src):
        try:
            os.remove(src)
        except:
            pass
    elif os.path.isdir(src):
        for item in os.listdir(src):
            item_src = os.path.join(src, item)
            delete_local_file(item_src)
        try:
            os.rmdir(src)
        except:
            pass


# 遍历录制目录下所有音频文件，做检查和统计
# 可能存在录制失败的中间文件，都做一个统计
# 输出flv音频文件、录制失败的中间文件、总文件数
def check_record_files(path):
    record_files = []
    flv_files = []
    failed_files = []
    if os.path.exists(path):
        record_files = os.listdir(path)  # 得到文件夹下的所有文件名称
        for file in record_files:  # 遍历文件夹
            if not os.path.isdir(file):  # 判断是否是文件夹
                path_ = path + "/" + file
                if path_.endswith(".flv"):
                    flv_files.append(path_)
                else:
                    failed_files.append(path_)
    logger.info("A total of %d audio files were generated. %d successfully recorded flv files, %d failed files." % (
        len(record_files), len(flv_files), len(failed_files)))
    return flv_files, failed_files, len(record_files)


# 获取音频文件cos存储位置
def get_cos_record_file(path, bucket, region, cos_path):
    _file = os.path.basename(path)
    params = _file.split('.')[0].split('-')
    user_id = ""
    cos_object = ""
    if len(params) > 4:
        user_id = params[4]
        cos_object = "https://" + bucket + ".cos." + region + ".myqcloud.com" + cos_path + "/" + _file

    return user_id, cos_object


# 根据录制文件名称解析出主播id
def get_anchor_id(path):
    _file = os.path.basename(path)
    params = _file.split('.')[0].split('-')
    user_id = ""
    if len(params) > 4:
        user_id = params[4]

    return user_id


# 回调逻辑。可自定义回调逻辑
def callback(url, sdk_app_id, is_str_room, room_id, user_id, success_files, convert_failed_files, failed_files,
             upload_failed_files):
    if len(url) <= 0:
        print("callback url is empty, no need to callback.")
        return

    data = {}
    data['SdkAppId'] = sdk_app_id
    data['UserId'] = user_id

    if is_str_room:
        data['StrRoomId'] = room_id
    else:
        data['RoomId'] = room_id

    response = []
    # 封装录制失败响应
    for file in failed_files:
        anchor_id = get_anchor_id(file)
        resp = build_resp(anchor_id, "", 0, MSG_RECORD_FAIL)
        response.append(resp)

    # 封装转换失败响应
    for file in convert_failed_files:
        anchor_id = get_anchor_id(file)
        resp = build_resp(anchor_id, "", 0, MSG_CONVERT_FAIL)
        response.append(resp)

    # 封装上传失败响应
    for file in upload_failed_files:
        anchor_id = get_anchor_id(file)
        resp = build_resp(anchor_id, "", 0, MSG_UPLOAD_FAIL)
        response.append(resp)

    # 封装录制成功响应
    for key in success_files:
        resp = build_resp(key, success_files[key], 1, MSG_RECORD_SUCCESS)
        response.append(resp)

    data['Files'] = response

    response = requests.post(url, json=data)
    print("callback response:", response.text.encode('utf8'))


def build_resp(user_id, cos_file, status, message):
    resp = {
        'UserId': user_id,
        'RecordFile': cos_file,
        'Status': status,
        'Message': message
    }

    return resp


# 回调逻辑。
def callback_msg(url, code, message):
    if url == "":
        print("callback url is empty, no need to callback.")
        return

    data = {
        'Code': code,
        'Message': message
    }

    response = requests.post(url, json=data)
    print("callback response:", response.text.encode('utf8'))


# 录制模式
def record_mode(mode):
    # 录制模式
    scene = 2  # 2.单流录制；4.混流录制
    recorder_mode = 1  # 1. 纯音频文件； 2.纯视频文件；4.音视频文件
    file_type = 0  # 0: MP3文件； 1: MP4文件

    # 单流纯音频录制
    if mode == '00':
        scene = 2
        recorder_mode = 1
        file_type = 0

    # 单流纯视频录制
    if mode == '01':
        scene = 2
        recorder_mode = 2
        file_type = 1

    # 单流音视频录制
    if mode == '02':
        scene = 2
        recorder_mode = 4
        file_type = 1

    return scene, recorder_mode, file_type


# 主函数
def main_handler(event, context):
    logger.info("start main handler")

    # 设置动态链接库搜索路径
    lib_path = os.environ.get('LD_LIBRARY_PATH')
    os.environ['LD_LIBRARY_PATH'] = lib_path + ':/var/user/recordClient'
    work_dir = "/tmp"
    if os.environ.get('CFS_PATH'):
        work_dir = os.environ.get('CFS_PATH')

    # ffmpeg赋予执行权限
    subprocess.run(
        'cp ./ffmpeg /tmp/ffmpeg && chmod 755 /tmp/ffmpeg',
        shell=True)

    # 获取临时秘钥
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')

    # 请求从API网关传递,通过网关获取TRTC参数，在body中获取
    if "requestContext" not in event.keys():
        return {"code": 410, "errorMsg": "event is invalid"}
    if "body" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from api gateway"}

    # 解析request请求body
    # 参数错误通过回调返回错误，提示校验参数
    trtc_param = event['body']
    callback_url = ""
    try:
        trtc_param_ = json.loads(trtc_param)
        logger.info("trtc params:" + json.dumps(trtc_param_))

        callback_url = trtc_param_['Callback']
        sdk_app_id = trtc_param_['SdkAppId']
        user_id = trtc_param_['UserId']
        user_sig = trtc_param_['UserSig']

        cos_config = trtc_param_['CosConfig']
        logger.info("cos config:" + json.dumps(cos_config))

        cos_region = cos_config['Region']
        target_bucket = cos_config['Bucket']
        cos_path = cos_config['Path']

        is_str_room = False

        # 校验， roomId和strRoomId必传一个，生成录制命令
        if not trtc_param_.get('StrRoomId') and not trtc_param_.get('RoomId'):
            logger.error("bad request: roomId is empty, please check.")
            message = "bad request: roomId is empty, please check."
            callback_msg(callback_url, ERROR_CODE_INVALID_PARAMETER, message)
            raise KeyError('roomId is empty')

        if trtc_param_.get('StrRoomId') and not trtc_param_.get('RoomId'):
            is_str_room = True

    except Exception as err:
        logger.error("bad request: request body[%s] is invalid, please check." % (trtc_param,))
        message = "bad request: request body[%s] is invalid, please check." % (trtc_param,)
        callback_msg(callback_url, ERROR_CODE_INVALID_PARAMETER, message)
        raise err

    # 录制文件本地存放目录
    t = time.time()
    record_time = lambda: int(round(t * 1000))
    record_path = os.path.join(work_dir, 'record_%d' % (record_time()))
    logger.info("start recording, record path: " + record_path)

    # 从request中获取用户的secretid和secretkey，如果没有使用临时密钥初始化cos客户端
    if cos_config.get('SecretId') and cos_config.get('SecretKey'):
        secret_id = cos_config.get('SecretId')
        secret_key = cos_config.get('SecretKey')
    # 初始化cos客户端
    cosClient = CosS3Client(CosConfig(Region=cos_region, SecretId=secret_id, SecretKey=secret_key, Token=token))
    logger.info('cos client init success. Cos target bucket: ' + target_bucket)

    # step1 进房参数
    # 进房等待超时时间，单位ms。默认等待300秒。可根据时间需求设置，建议不要设置几秒的超时时间，会导致录制提前结束
    # 也无需设置太大，会导致等待很长时间
    timeout = 300000
    # 录制模式
    scene, recorder_mode, file_type = record_mode(trtc_param_['Mode'])

    if not is_str_room:
        room_id = trtc_param_['RoomId']
        record_command = cmd_record % (
            scene, sdk_app_id, room_id, user_id, user_sig, record_path, recorder_mode, timeout)
    else:
        room_id = trtc_param_['StrRoomId']
        record_command = cmd_record_str_room % (
            scene, sdk_app_id, room_id, user_id, user_sig, record_path, recorder_mode, timeout, 1)

    print("exec record command: ", record_command)

    # 根据录制模式选择ffmpeg转换命令
    ffm_command = cmd_audio_2mp3
    file_suffix = '.mp3'
    if file_type == 1:
        ffm_command = cmd_audio_2mp4
        file_suffix = '.mp4'

    # step2 开始进房录制
    try:
        ret = subprocess.run(record_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            print('single stream record finished.')
            print("audio record details:", ret.stdout)
        else:
            print("single stream record failed, err code:", ret.returncode)
    except Exception as e:
        logging.exception(e)
        pass

    # 校验统计生成的录制文件，成功录制的flv文件转换成目标文件上传cos桶
    # 失败的音频文件直接上传cos桶做回溯
    upload_path = os.path.join(work_dir, 'upload_%d' % (record_time()))
    logger.info("local path to upload cos: " + upload_path)
    if not os.path.exists(upload_path):
        os.mkdir(upload_path)
    flv_files, failed_files, files_num = check_record_files(record_path)
    convert_failed_files = []
    upload_failed_files = []
    success_files = {}
    # 执行ffmpeg命令，将flv音频文件转化为目标文件
    for flv_file in flv_files:
        _file = os.path.basename(flv_file)
        filename = _file.split('.')[0]
        dst_file = os.path.join(upload_path, filename + file_suffix)
        try:
            print("file convert command:", ffm_command % (flv_file, dst_file))
            ret = subprocess.run(ffm_command % (flv_file, dst_file), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 close_fds=True, shell=True)
            if ret.returncode == 0:
                print('file convert: %s ---> %s finished.' % (flv_file, dst_file))
            else:
                print('file convert: %s ---> %s failed, ret code: %d' % (flv_file, dst_file, ret.returncode))
            # 上传视频，可自定义上传路径
            # 如果转换成功，上传cos桶
            if os.path.exists(dst_file):
                try:
                    cosClient.put_object_from_local_file(
                        Bucket=target_bucket,
                        LocalFilePath=dst_file,
                        Key=cos_path + '/' + filename + file_suffix
                    )

                    anchor_id, audio_file = get_cos_record_file(dst_file, target_bucket, cos_region, cos_path)
                    success_files[anchor_id] = audio_file
                except Exception as err:
                    logging.exception(err)
                    upload_failed_files.append(flv_file)
                    pass
        except Exception as e:
            logging.exception(e)
            pass

        if not os.path.exists(dst_file):
            convert_failed_files.append(flv_file)

        # 上传完当前录制文件，立即删除本地flv文件和目标文件
        delete_local_file(flv_file)
        delete_local_file(dst_file)

    # 清理工作目录和日志目录
    try:
        logger.info("clear work dir and log dir...")
        delete_local_file(record_path)
        delete_local_file(upload_path)
        delete_local_file("/tmp")
    except Exception as err:
        logging.exception(err)
        pass

    callback(callback_url, sdk_app_id, is_str_room, room_id, user_id, success_files, convert_failed_files, failed_files,
             upload_failed_files)

    return "record and upload finished."