import os
import logging
import random
import re
import tempfile
import json
import threading
import time
import traceback
import pytz
from threading import BoundedSemaphore
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
import cos_util
from cos_util import CosFileNotExistsError

# 函数角色的“会话最大持续时间” 最高只能12小时。
# 异步执行启用后，函数执行超时时间最大可支持 24 小时
SCF_RUNNING_TIME_LIMIT = 11*60*60   # 取较小值12
TASK_FILE_UPDATE_TIMEOUT = 60*15    # 多长时间不更新updateTime就认为任务挂掉了
BACKUP_HISTORY_TASKFILE_NUM = 30    # 保留多少个历史任务文件
WORKER_NUM_LIMIT = 3                # 最多同时运行多少个上传任务

cos_client: CosS3Client = None

cos_region = os.getenv("COS_REGION")    # bucket_src 和 bucket_dst 所在的地区
bucket_src = os.getenv("COS_BUCKET_SRC")
bucket_dst = os.getenv("COS_BUCKET_DST")

logger = logging.getLogger()
tz = pytz.timezone('Asia/Shanghai')


def get_time_seq_from_name(file_name: str):
    try:
        bname = os.path.basename(file_name)
        seq_num = bname[:-4]
        timestamp, _ = seq_num.split(".")
        return int(timestamp), seq_num
    except Exception as err:
        print("fail to parser filename. ", file_name, err)
        return None, None


def split_group(sorted_flist: list):
    def time_greater_than_15min(begin_time, end_time):
        return (end_time - begin_time) > 15 * 60

    def time_greater_than_1day(begin_time, end_time):
        return (end_time - begin_time) > 24*60*60

    def size_greater_than_1MB(size):
        return size > 1024*1024

    def size_greater_than_5GB(size):
        return size > 5*1024*1024*1024

    groups = []
    tmp_group = []
    tmp_group_size = 0
    for file_info in sorted_flist:
        file_name, file_size = file_info
        event_time, seq_num = get_time_seq_from_name(file_name)
        if not event_time:
            raise ValueError(file_name)
        if len(tmp_group) == 0:
            tmp_group.append((file_name, file_size, event_time, seq_num))
            tmp_group_size += file_size
            continue
        first_event_time = tmp_group[0][2]
        if time_greater_than_1day(first_event_time, event_time):
            groups.append(tmp_group)
            tmp_group, tmp_group_size = [], 0
            tmp_group.append((file_name, file_size, event_time, seq_num))
            tmp_group_size += file_size
            continue
        if size_greater_than_5GB(tmp_group_size + file_size):
            groups.append(tmp_group)
            tmp_group, tmp_group_size = [], 0
            tmp_group.append((file_name, file_size, event_time, seq_num))
            tmp_group_size += file_size
            continue
        tmp_group.append((file_name, file_size, event_time, seq_num))
        tmp_group_size += file_size

    if len(tmp_group) == 0:
        return groups
    if size_greater_than_1MB(tmp_group_size):
        groups.append(tmp_group)
        return groups
    print("split_group tmp group不足1M， size=%.2f M" % (tmp_group_size/1024/1024))
    first_event_time = tmp_group[0][2]
    last_event_time = tmp_group[-1][2]
    if time_greater_than_15min(first_event_time, last_event_time):
        groups.append(tmp_group)
        return groups
    print("split_group tmp group不超过15min， range=%.2f min" % ((last_event_time - first_event_time)/60))
    return groups


def list_taskfile(include_wait: bool, include_running: bool):
    result = []
    for fname, size in cos_util.iter_cos_file(bucket_src, prefix="task/"):
        if include_running and fname.endswith(".task.running"):
            result.append((fname, size))
        if include_wait and fname.endswith(".task.wait"):
            result.append((fname, size))
    return result


def list_object_key_in_taskfile(task_file_list: list):
    if not isinstance(task_file_list, list):
        raise ValueError("not list")
    if not task_file_list:
        return []
    with tempfile.TemporaryFile() as tmp:
        total_size = 0
        for fname in task_file_list:
            print("list_objkey_in_taskfile iter fname=", fname)
            if not cos_client.object_exists(bucket_dst, fname):
                continue
            resp = cos_client.get_object(Bucket=bucket_dst, Key=fname)
            size = int(resp["Content-Length"])
            resp["Body"].pget_stream_to_file(tmp, offset=total_size, expected_len=size)
            total_size += size
        tmp.seek(0)
        data = tmp.read()
        data = data.decode("utf-8")
        lines = data.splitlines(keepends=False)
        return lines


def get_expire_task() -> list:
    def is_task_expire(task_file):
        update_time = cos_util.get_modify_time_in_meta(bucket_src, task_file)
        now = int(time.time())
        if (update_time + TASK_FILE_UPDATE_TIMEOUT) > now:
            return False
        return True

    wait_list = []
    # running状态的任务， 检查是否过期
    for task_file, _ in list_taskfile(include_wait=False, include_running=True):
        if not is_task_expire(task_file):
            continue
        taskfile_wait = task_file.replace(".running", ".wait")
        success = cos_util.rename_file_concurrent(cos_region, bucket_src, task_file, taskfile_wait)
        if not success:
            continue
        wait_list.append(taskfile_wait)
    # wait状态的也加入待处理列表
    for task_file, _ in list_taskfile(include_wait=True, include_running=False):
        if not is_task_expire(task_file):
            continue
        wait_list.append(task_file)
    return wait_list


def is_data_file(fname):
    if not fname:
        return False
    # 文件名类似 'data/20211031/19/1635679510.6280103163078286.txt'
    if not fname.endswith(".txt"):
        return False
    if fname.count("/") != 3 or fname.count(".") != 2:
        print("不是预期的文件名. ignore.", fname)
        return False
    tm, seq = get_time_seq_from_name(fname)
    if (tm is None) or (seq is None):
        return False
    return True


def calc_task_file_name(group):
    if not group:
        return None
    first_seq_num = group[0][3]
    return f"task/group-{first_seq_num}.task"


def get_seq_num_from_task_file_name(fname):
    ret = re.findall(r"group-(.*?).task", fname)
    if len(ret) != 1:
        raise ValueError("不是合法的文件名 fname=%s" % fname)
    return str(ret[0])


def build_task_from_group(group: list, suffix: str):
    task_file_name = calc_task_file_name(group)
    task_file_name += suffix
    flist = [fname for fname, _, _, _ in group]
    data = "\n".join(flist)
    return task_file_name, data


def backup_finished_task(fname):
    bname = os.path.basename(fname)
    bname = bname.replace(".running", ".done")
    # cos_util.cos_copy_object(cos_region, bucket_dst, fname, f"history/{bname}")
    cos_util.cos_copy_object(cos_region, bucket_dst, fname, f"history/recent/{bname}")
    # 清理recent目录下的旧文件
    recent_flist = [fname for fname, size in cos_util.iter_cos_file(bucket_dst, "history/recent/")]
    recent_flist.sort()
    need_clean = recent_flist[:-30]      # 只保留最新的30个文件， 其他的清理
    print("recent_flist:", recent_flist, "need_clean:", need_clean)
    cos_util.delete_object_list(bucket_dst, need_clean)


def get_max_seq_in_task():
    def get_max_seq_in_flist(flist) -> str:
        tmp_seq = ""
        target_file = None
        # 先找序号最大的文件
        for fname, size in flist:
            seq_num = get_seq_num_from_task_file_name(fname)
            if seq_num > tmp_seq:
                tmp_seq = seq_num
                target_file = fname
        if not target_file:
            return ""

        # 文件里面最后一行 就是处理过的 最大的序列号
        flist = list_object_key_in_taskfile([target_file, ])
        last_line_file_name = flist[-1]
        _, last_seq = get_time_seq_from_name(last_line_file_name)
        return last_seq

    history_tasks = cos_util.iter_cos_file(bucket_dst, "history/recent/")
    cur_tasks = list_taskfile(include_wait=True, include_running=True)
    max_seq_history = get_max_seq_in_flist(history_tasks)
    max_seq_cur = get_max_seq_in_flist(cur_tasks)
    return max(max_seq_cur, max_seq_history)


def create_new_taskfile() -> list:
    max_seq = get_max_seq_in_task()
    flist = []
    for fname, size in cos_util.iter_cos_file(bucket_src, "data/"):
        if not is_data_file(fname):
            continue
        _, seq = get_time_seq_from_name(fname)
        if seq <= max_seq:
            continue
        flist.append((fname, size))
    flist.sort(key=lambda finfo: get_time_seq_from_name(finfo[0]))     # 按seq排序
    groups = split_group(flist)
    if not groups:  # 没有待办任务了
        return []
    taskfile_list = []
    for group in groups:
        task_file_name, inner_text = build_task_from_group(group, ".wait")
        success = cos_util.create_file_concurrent(bucket_dst, task_file_name, override=False)
        if not success:
            break
        cos_client.put_object(bucket_dst, inner_text, task_file_name)
        taskfile_list.append(task_file_name)
    return taskfile_list


def do_upload_task(task_file: str):
    def part_upload_callback(part_number, etag, size):
        print(f"part_number={part_number} etag={etag} size={size}")
        # 更新一下 task_file。 防止被当成超时任务
        cos_util.set_modify_time_in_meta(cos_region, bucket_dst, task_file)

    # 准备数据
    group_flist = list_object_key_in_taskfile([task_file, ])
    min_seq_num = get_seq_num_from_task_file_name(task_file)
    concat_dst_file = f"data/{min_seq_num}.txt"   # group对应的 聚合后的文件的文件名.

    # 检查目标文件 并上传
    if not cos_client.object_exists(bucket_dst, concat_dst_file):
        try:
            # 遍历文件 part上传
            concat_tmp_file = f"{concat_dst_file}.{str(random.randint(10000, 99999))}.tmp"
            cos_util.part_upload_object_list(bucket_src, group_flist, bucket_dst, concat_tmp_file,
                                             callback=part_upload_callback)
            # 更新meta里面的update time
            cos_util.set_modify_time_in_meta(cos_region, bucket_dst, task_file)
            # 临时文件复制， 覆盖concat_dst_file
            cos_util.cos_copy_object(cos_region, bucket_dst, concat_tmp_file, concat_dst_file)
        except CosFileNotExistsError as err:
            # group内的文件应该批量删除的， 其中某个文件不存在， 说明整个group删除过程中发生了失败。
            print("part_upload_object_list 过程中发现文件不存在。 err=", err)

    # 清理所有以dst_fname为前缀的临时文件
    cos_util.delete_object_by_prefix(bucket_dst, prefix=concat_dst_file, include_prefix_self=False)

    # 删除src bucket中， group内的文件
    all_success = cos_util.delete_object_list(bucket_src, group_flist)
    if not all_success:
        return False

    # 删除taskfile
    backup_finished_task(task_file)
    cos_util.delete_object_by_prefix(bucket_dst, prefix=task_file, include_prefix_self=True)
    print("do_upload_task finish. task_file=", task_file)
    return True


def upload_worker(task_file_wait, sem_worker_limit: BoundedSemaphore):
    try:
        # 防止并发运行
        if not task_file_wait.endswith(".wait"):
            raise ValueError("task_file_wait 必须是wait状态")
        if not cos_client.object_exists(bucket_dst, task_file_wait):
            raise ValueError("task_file_wait 文件不存在")
        task_file_running = task_file_wait.replace(".wait", ".running")
        success = cos_util.rename_file_concurrent(cos_region, bucket_dst, task_file_wait, task_file_running)
        if not success:
            print("upload_worker rename_file_concurrent fail. ", task_file_wait)
            return
        ret = do_upload_task(task_file_running)
        print("upload_worker: ret=%s taskfile=%s" % (ret, task_file_running))
    except Exception as err:
        print("upload_worker: taskfile=", task_file_wait, err)
        traceback.print_exc()
    finally:
        sem_worker_limit.release()


def main_handler(event, context):
    secret_id = os.getenv("TENCENTCLOUD_SECRETID")
    secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
    session_token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")

    cos_config = CosConfig(Region=cos_region, Secret_id=secret_id, Secret_key=secret_key, Token=session_token)
    global cos_client
    cos_client = CosS3Client(cos_config)
    cos_util.set_cos_client(cos_client)
    print("Received event: " + json.dumps(event))
    print("Received context: " + str(context))

    sem_worker_limit = BoundedSemaphore(value=WORKER_NUM_LIMIT)
    begin_time = int(time.time())
    limit_finish_time = begin_time + SCF_RUNNING_TIME_LIMIT
    worker_list = []
    taskfile_list = []
    taskfile_list.extend(get_expire_task())
    taskfile_list.extend(create_new_taskfile())
    print("taskfile_list=", taskfile_list)

    for taskfile in taskfile_list:
        now = int(time.time())
        if now > limit_finish_time:
            print("运行时间到达上限， 退出")
            break
        sem_worker_limit.acquire()
        thread = threading.Thread(target=upload_worker, args=(taskfile, sem_worker_limit))
        thread.start()
        worker_list.append(thread)
    for worker in worker_list:
        worker.join()
    print("main_handler finish")
    return "ok"
