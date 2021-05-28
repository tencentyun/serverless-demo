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
from multiprocessing import Process,Queue
from recordClient import TLSSigAPIv2

# 命令定义
# ffmpeg命令，flv音频文件转MP3文件
cmd_path_ffmpeg = '/tmp/ffmpeg'
cmd_audio_2mp3 = cmd_path_ffmpeg + ' -i %s -f mp3 -vn %s '

# 录制命令，开启单流录制
cmd_path = './recordClient/recorderClient'
cmd_record = cmd_path + ' --demoSences %d --sdkAppId %s --roomId %d  --userId %s --userSig %s --recDir=%s --recFiles=%d --timeout=%d'
cmd_record_str_room = cmd_path + ' --demoSences %d --sdkAppId %s --roomId %s  --userId %s --userSig %s --recDir=%s --recFiles=%d --timeout=%d --strRoom=%d'

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
def get_cos_audio_file(path, bucket, region, cos_path):
    _file = os.path.basename(path)
    params = _file.split('.')[0].split('-')
    user_id = ""
    cos_object = ""
    if len(params) > 0:
        user_id = params[4]
        cos_object = "https://" + bucket + ".cos." + region + ".myqcloud.com" + cos_path + "/" + _file

    return user_id, cos_object


# 根据音频文件名称解析出主播id
def get_anchor_id(path):
    _file = os.path.basename(path)
    params = _file.split('.')[0].split('-')
    user_id = ""
    if len(params) > 0:
        user_id = params[4]

    return user_id


# 回调逻辑。可自定义回调逻辑
# 存在录制失败，返回录制失败的主播和文件
# 存在格式转换失败，返回转换失败的FLV文件
def callback(url, record_failed, sdk_app_id, room_id, user_id, cos_files, convert_failed_files, failed_files):
    if len(url) <= 0:
        print("callback url is empty, no need to callback.")
        return

    data = {}
    data['SdkAppId'] = sdk_app_id
    data['RoomId'] = room_id
    data['UserId'] = user_id
    # 录制失败或者转换失败响应
    if len(failed_files) > 0 or len(convert_failed_files) > 0:
        _failed_files = {}
        _convert_failed_files = {}
        for file in failed_files:
            anchor_id = get_anchor_id(file)
            _failed_files[anchor_id] = file
        for file in convert_failed_files:
            anchor_id = get_anchor_id(file)
            _convert_failed_files[anchor_id] = file
        message = "audio record failed. Record failed files: %s. Convert failed files: %s\n" % (json.dumps(_failed_files), json.dumps(_convert_failed_files))
        data['Status'] = "fail"
        data['Message'] = message
    else:
        # 如果失败flag为True，录制出现异常，返回失败
        if record_failed:
            data['Status'] = "fail"
            data['Message'] = "audio record throw exception, please check from cloud function."
        else:
            if len(cos_files) <= 0:
                # 如果没有录制并转换成功文件，返回失败
                data['Status'] = "fail"
                data['Message'] = "audio record failed. No audio record files."
            else:
                # 录制成功，等待超时和未开始录制都会按照成功返回
                data['Status'] = "success"
                data['Files'] = cos_files

    response = requests.post(url, json=data)
    print("callback response:", response.text.encode('utf8'))


# 回调逻辑。
def callback_msg(url, sdk_app_id, room_id, user_id, status, message):
    if len(url) <= 0:
        print("callback url is empty, no need to callback.")
        return

    data = {
        'SdkAppId': sdk_app_id,
        'RoomId': room_id,
        'UserId': user_id,
        'Status': status,
        'Message': message
    }

    response = requests.post(url, json=data)
    print("callback response:", response.text.encode('utf8'))


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
    trtc_param = event['body']
    trtc_param_ = json.loads(trtc_param)
    logger.info("trtc params:" + json.dumps(trtc_param_))

    cos_config = trtc_param_['cosConfig']
    logger.info("cos config:" + json.dumps(cos_config))

    cos_region = cos_config['region']
    target_bucket = cos_config['bucket']
    cos_path = cos_config['path']
    # 从request中获取用户的secretid和secretkey，如果没有使用临时密钥初始化cos客户端
    if cos_config.get('secretId') and cos_config.get('secretKey'):
        secret_id = cos_config.get('secretId')
        secret_key = cos_config.get('secretKey')
    # 初始化cos客户端
    cosClient = CosS3Client(CosConfig(Region=cos_region, SecretId=secret_id, SecretKey=secret_key, Token=token))
    logger.info('cos client init success. Cos target bucket: ' + target_bucket)

    # 子进程开启单流录制
    t = time.time()
    record_time = lambda: int(round(t * 1000))
    record_path = os.path.join(work_dir, 'record_%d' % (record_time()))
    logger.info("start recording, record path: " + record_path)

    # step1 进房参数
    scene_single_record = 2  # 单流录制场景
    receive_file_type = 1  # 纯音频文件
    # 进房等待超时时间，单位ms。默认等待300秒。可根据时间需求设置，建议不要设置几秒的超时时间，会导致录制提前结束
    # 也无需设置太大，会导致等待很长时间
    timeout = 300000
    sdk_app_id = trtc_param_['sdkAppId']
    user_id = trtc_param_['userId']
    user_sig = trtc_param_['userSig']
    callback_url = trtc_param_['callback']

    record_failed = False  # 失败flag

    room_id = None
    is_str_room = False

    # 校验， roomId和strRoomId必传一个
    if not trtc_param_.get('strRoomId') and not trtc_param_.get('roomId'):
        status = "fail"
        message = "record and upload failed. RoomId is empty"
        callback_msg(callback_url, sdk_app_id, room_id, user_id, status, message)
        return "record and upload failed. RoomId is empty"

    if trtc_param_.get('strRoomId') and not trtc_param_.get('roomId'):
        is_str_room = True

    if not is_str_room:
        room_id = trtc_param_['roomId']
        command = cmd_record % (
            scene_single_record, sdk_app_id, room_id, user_id, user_sig, record_path, receive_file_type, timeout)
    else:
        room_id = trtc_param_['strRoomId']
        command = cmd_record_str_room % (
            scene_single_record, sdk_app_id, room_id, user_id, user_sig, record_path, receive_file_type, timeout, 1)

    print("exec record command: ", command)

    # step2 开始进房，开启单流录制
    try:
        ret = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, check=True)
        if ret.returncode == 0:
            print('single stream record finished.')
            print("audio record details:", ret.stdout)
        else:
            print("single stream record failed, err code:", ret.returncode)
    except Exception as e:
        record_failed = True
        logging.exception(e)
        pass

    # 校验统计生成的音频文件，成功录制的flv文件转换成.mp3文件上传cos桶
    # 失败的音频文件直接上传cos桶做回溯
    upload_path = os.path.join(work_dir, 'upload_%d' % (record_time()))
    logger.info("local path to upload cos: " + upload_path)
    if not os.path.exists(upload_path):
        os.mkdir(upload_path)
    flv_files, failed_files, files_num = check_record_files(record_path)
    convert_failed_files = []
    cos_files = {}
    # 执行ffmpeg命令，将flv音频文件转化为MP3文件
    for flv_file in flv_files:
        _file = os.path.basename(flv_file)
        filename = _file.split('.')[0]
        mp3_file = os.path.join(upload_path, filename + '.mp3')
        try:
            print("audio convert command:", cmd_audio_2mp3 % (flv_file, mp3_file))
            ret = subprocess.run(cmd_audio_2mp3 % (flv_file, mp3_file), stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 close_fds=True, shell=True)
            if ret.returncode == 0:
                print('file convert: %s ---> %s finished.' % (flv_file, mp3_file))
            else:
                print('file convert: %s ---> %s failed, ret code: %d' % (flv_file, mp3_file, ret.returncode))
                convert_failed_files = convert_failed_files.append(flv_file)
            # 上传视频，可自定义上传路径
            # 如果转换成功，上传cos桶
            if os.path.exists(mp3_file):
                cosClient.put_object_from_local_file(
                    Bucket=target_bucket,
                    LocalFilePath=mp3_file,
                    Key=cos_path + '/' + filename + '.mp3'
                )
            anchor_id, audio_file = get_cos_audio_file(mp3_file, target_bucket, cos_region, cos_path)
            cos_files[anchor_id] = audio_file
            # 上传完当前音频文件，立即删除flv文件和mp3文件
            delete_local_file(flv_file)
            delete_local_file(mp3_file)
        except Exception as e:
            record_failed = True
            logging.exception(e)
            continue

    # 清理工作目录和日志目录
    try:
        logger.info("clear work dir and log dir...")
        delete_local_file(record_path)
        delete_local_file(upload_path)
        delete_local_file("/tmp")
    except:
        pass

    callback(callback_url, record_failed, sdk_app_id, room_id, user_id, cos_files, convert_failed_files, failed_files)

    return "record and upload finished."