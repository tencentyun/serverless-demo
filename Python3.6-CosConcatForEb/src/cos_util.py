import uuid
import random
import time
from qcloud_cos import CosS3Client
from cos_download_proxy import CosDownloadProxy

_cos_client: CosS3Client = None

X_COS_META_VERSION = "x-cos-meta-version"
X_COS_META_LAST_MODIFY = "x-cos-meta-last-modify"


class CosFileNotExistsError(FileExistsError):
    pass


def set_cos_client(cos_client):
    global _cos_client
    _cos_client = cos_client


def _iter_object_data(source_bucket, source_objects, limit_size):
    """
    按顺序遍历source_objects列表中的文件内容
    :param source_bucket:
    :param source_objects:
    :param limit_size:
    :raise CosFileNotExistsError:
    :return:
    """
    cos_proxy = CosDownloadProxy(_cos_client, source_bucket, source_objects)
    buff = b""
    index = 0
    try:
        for data in cos_proxy.iter():
            buff += data
            if len(buff) > limit_size:
                index += 1
                yield index, buff
                buff = b""
        if len(buff) > 0:
            index += 1
            yield index, buff
    except FileNotFoundError as e:
        raise CosFileNotExistsError(e)


def part_upload_object_list(source_bucket, source_objects: list, target_bucket, target_object, *, callback=None):
    """
    上传source_objects中的文件到target_bucket
    :param source_bucket:
    :param source_objects:
    :param target_bucket:
    :param target_object:
    :param callback:
    :raise CosFileNotExistsError:  source_objects中如果文件不存在则抛出
    :return:
    """
    resp = _cos_client.create_multipart_upload(
        Bucket=target_bucket,
        Key=target_object
    )
    print("create_multipart_upload resp:", resp)
    upload_id = resp.get("UploadId")
    if not upload_id:
        raise ValueError("upload_id is None")

    part_infos = []
    for index, data in _iter_object_data(source_bucket, source_objects, limit_size=16*1024*1024):
        # https://cloud.tencent.com/document/product/436/14518
        # 分块上传：单个对象最大48.82TB，块大小1MB - 5GB，最后一个块可小于1MB，分块数1 - 10000，详情请参见 分块上传。
        part_number = str(index)
        if index >= 10000:
            raise ValueError("分块过多， part_number=" + str(part_number))
        resp = _cos_client.upload_part(
            Bucket=target_bucket,
            Key=target_object,
            PartNumber=part_number,
            UploadId=upload_id,
            Body=data,
        )
        print("upload_part_copy resp:", resp)
        etag = resp.get("ETag")
        part_infos.append({
            "PartNumber": part_number,
            "ETag": etag
        })
        if callback:
            callback(part_number, etag, len(data))
    resp = _cos_client.complete_multipart_upload(target_bucket, target_object, upload_id, MultipartUpload={
        "Part": part_infos
    })
    print("complete_multipart_upload resp:", resp)


def iter_cos_file(bucket, prefix):
    marker = ""
    while True:
        resp = _cos_client.list_objects(Bucket=bucket, MaxKeys=1000, Marker=marker, Prefix=prefix)
        contents = resp.get("Contents")
        if not contents:
            break
        for content in contents:
            fname = content["Key"]
            size = content["Size"]
            yield fname, int(size)
        next = resp.get("NextMarker")
        if not next:
            break
        marker = next
    print("iter file finish. ", bucket, prefix)


def create_file_concurrent(cos_bucket, lock_file_name, *, override=False) -> bool:
    """
    创建一个名为taskfile的空文件。   在内部做了并发创建文件的检查
    :param cos_bucket:
    :param lock_file_name:
    :param override:
    :param data:
    :return:
    """
    begin_time = time.time()
    if (not override) and _cos_client.object_exists(cos_bucket, lock_file_name):
        print("create_file_for_lock fail, 文件已存在。", lock_file_name)
        return False
    version = str(uuid.uuid4())
    resp_put = _cos_client.put_object(
        Bucket=cos_bucket,  # Bucket 由 BucketName-APPID 组成
        Body="",
        Key=lock_file_name,
        StorageClass='STANDARD',
        ContentType='text/html; charset=utf-8',
        Metadata={
            X_COS_META_VERSION: version,
            X_COS_META_LAST_MODIFY: str(int(time.time()))
        }
    )
    # print("resp_put", version, resp_put)
    time.sleep(4+random.random())     # sleep 4-5s
    resp_head = _cos_client.head_object(cos_bucket, lock_file_name)

    # 1. 如果不加超时机制可能出现的问题：
    """
        ----------------------图1--------------------------
        |>>>>>>>>>>>>>>>>>>>>>| (实例A)
        t1                   t2
        (put v1)         (check v1)
                                   |>>>>>>>>>>>>>>>>>>>>>| (实例B)
                                   t3                    t4
                                   (put v2)     (check v2)
        ----------------------图2--------------------------
        |>>>>>>>>>>>>>>>>>>>>>>>>>>>| (实例C)
        t5                         t6
        (put v3)                (check v3)
                      |>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>| (实例D)
                      t7                                t8
                      (put v4)                       (check v4)
        --------------------------------------------------
        如图1, 如果实例A和B并发创建文件。 t2早于t3发生， 就会出现AB两个实例都检测到version与自己写入的version一致的情况
        如图2, 如果确保每个实例的运行时间都大于时间窗口的1/2， 就可以确保t7早于t6。 t6时刻拿到的version就会是v4.
    """
    # 2. 各种超时的场景：
    """
              | version一致      | version不一致
        ------|-----------------|-------------
        未超时 | 成功             | 失败
        超时了 | 失败,并删除文件    | 失败
        --------------------------------------
        * 超时且version一致: 返回失败，并删除taskfile
        * 超时且version不一致: 返回失败.  (不删除文件， 防止发生E删除F的情况)
    """
    check_time = time.time()
    is_time_out = (check_time - begin_time) > 7
    resp_version = resp_head[X_COS_META_VERSION]
    is_version_match = resp_version == version
    if is_time_out:
        if is_version_match:
            delete_object(cos_bucket, lock_file_name)
        return False
    else:
        return is_version_match


def get_modify_time_in_meta(bucket, key):
    if not _cos_client.object_exists(bucket, key):
        return 0
    resp = _cos_client.head_object(bucket, key)
    last_modify = resp.get(X_COS_META_LAST_MODIFY, 0)
    last_modify = int(last_modify)
    return last_modify


def set_modify_time_in_meta(region, bucket, key):
    if not _cos_client.object_exists(bucket, key):
        raise FileNotFoundError(key)
    copy_source = {'Bucket': bucket, 'Key': key, 'Region': region}
    resp = _cos_client.copy_object(
        Bucket=bucket,
        Key=key,
        CopySource=copy_source,
        CopyStatus="Replaced",
        Metadata={
            X_COS_META_LAST_MODIFY: str(int(time.time()))
        }
    )


def cos_append_object(bucket, key, position, data) -> int:
    resp = _cos_client.append_object(bucket, key, position, data)
    next_position = resp.get('x-cos-next-append-position')
    if not next_position:
        raise ValueError("响应中没有找到'x-cos-next-append-position'字段")
    return int(next_position)


def delete_object(bucket, key):
    resp = _cos_client.delete_object(bucket, key)
    print(resp)


def delete_object_by_prefix(bucket, prefix, include_prefix_self) -> bool:
    if include_prefix_self:
        flist = [fname for fname, size in iter_cos_file(bucket, prefix)]
    else:
        flist = [fname for fname, size in iter_cos_file(bucket, prefix) if fname != prefix]
    success = delete_object_list(bucket, flist)
    print(f"delete_object_by_prefix prefix={prefix} success={success}")
    return success


def delete_object_list(bucket, key_list: list) -> bool:
    print("delete_object_list:", bucket, key_list)
    batch_size = 1000
    while True:
        batch_list = key_list[:batch_size]
        if len(batch_list) == 0:
            break
        objects = {
            "Quiet": "false",
            "Object": [{"Key": key} for key in batch_list]
        }
        resp = _cos_client.delete_objects(bucket, objects)
        delete_fail = resp.get("Error")
        if delete_fail:
            print("delete_objects 删除部分文件失败 resp=", resp)
            return False
        key_list = key_list[batch_size:]
    return True


def cos_copy_object(region, bucket, src_key, dst_key, *, ignore_not_found_error=False):
    if ignore_not_found_error and (not _cos_client.object_exists(bucket, src_key)):
        raise CosFileNotExistsError(src_key)
    copy_source = {'Bucket': bucket, 'Key': src_key, 'Region': region}
    resp = _cos_client.copy_object(
        Bucket=bucket,
        Key=dst_key,
        CopySource=copy_source,
        CopyStatus="Copy",
    )
    # etag = resp.get("ETag")
    print(resp)


def rename_file_concurrent(region, bucket, src_key, dst_key, *, ignore_not_found_error=False) -> bool:
    if not _cos_client.object_exists(bucket, src_key):
        return False
    success = create_file_concurrent(bucket, dst_key)
    if not success:
        return False
    cos_copy_object(region, bucket, src_key, dst_key, ignore_not_found_error=ignore_not_found_error)
    set_modify_time_in_meta(region, bucket, dst_key)
    delete_object(bucket, src_key)
    return True
