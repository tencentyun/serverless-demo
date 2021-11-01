import os
import threading
import time
from qcloud_cos import CosS3Client, CosConfig
from cos_download_proxy import CosDownloadProxy
import cos_util

secret_id = os.getenv("SECRET_ID")
secret_key = os.getenv("SECRET_KEY")
cos_region = os.getenv("COS_REGION")  # bucket_src 和 bucket_dst 所在的地区
# bucket_src = os.getenv("COS_BUCKET_SRC")
bucket_dst = os.getenv("COS_BUCKET_DST")
cos_config = CosConfig(Region=cos_region, Secret_id=secret_id, Secret_key=secret_key)
cos_client = CosS3Client(cos_config)
cos_util.set_cos_client(cos_client)


def get_file_list(size=200):
    finfos_full = list(cos_util.iter_cos_file(bucket_dst, prefix="test/"))
    finfos = finfos_full[:size]
    flist = [fname for fname, size in finfos if fname.endswith(".txt")]
    return flist, finfos


def test_default_download():
    flist, finfos = get_file_list()
    begin = time.time()
    for fname in flist:
        resp = cos_client.get_object(bucket_dst, fname)
        resp["Body"].get_stream_to_file("/tmp/aa.txt")
    print("cost:", time.time() - begin)


def test_part_upload():
    flist, finfos = get_file_list()
    cos_util.part_upload_object_list(bucket_dst, flist, bucket_dst, "test/aa.txt")


def test_proxy_download():
    flist, finfos = get_file_list(200)
    proxy = CosDownloadProxy(cos_client, bucket_dst, flist)

    total_size = 0
    begin = time.time()
    for data in proxy.iter():
        print("len data=", len(data))
        total_size += len(data)
    real_size = sum(size for fname, size in finfos)
    assert total_size == total_size, "数据大小不一致"
    print("flist:", len(flist))
    print("size:", total_size, real_size)   # 期望大小一致
    print("cost:", time.time() - begin)


def test_lock_file():
    def worker():
        ret = cos_util.create_file_concurrent(bucket_dst, "test/lock.txt", override=True)
        print("lock_task_file ret=", ret)

    t1 = threading.Thread(target=worker)
    t2 = threading.Thread(target=worker)
    t1.start()
    t2.start()


def test_delete():
    cos_client.put_object(bucket_dst, "test", "test2/delete.txt")
    cos_client.put_object(bucket_dst, "test", "test2/delete.txt.1")
    cos_client.put_object(bucket_dst, "test", "test2/delete.txt.2")
    cos_util.delete_object_by_prefix(bucket_dst, prefix="test2/delete.txt", include_prefix_self=False)
    flist = cos_util.iter_cos_file(bucket_dst, "test2/")
    print(list(flist))

test_proxy_download()
