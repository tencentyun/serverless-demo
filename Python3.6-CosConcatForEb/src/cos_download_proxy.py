import os
import uuid
import time
from threading import Event, Lock
from concurrent.futures import ThreadPoolExecutor
from qcloud_cos import CosS3Client


class CosDownloadProxy(object):
    def __init__(self, cos_client, bucket, sorted_keys: list, worker_num=15, pre_fetch_num=5):
        if len(sorted_keys) > len(set(sorted_keys)):
            raise ValueError("sorted_keys 不允许有重复的key")
        self.client: CosS3Client = cos_client
        self.bucket = bucket
        self.all_keys = sorted_keys
        self.ready_map = {key: (Event(), Lock()) for key in self.all_keys}
        self.thread_pool = ThreadPoolExecutor(max_workers=worker_num)
        self.pre_fetch_num = pre_fetch_num

    def iter(self):
        total = len(self.all_keys)
        for i, key in enumerate(self.all_keys):
            next_keys = self._get_next_keys(key, self.pre_fetch_num)
            self._download_asyn(next_keys)
            retry = 1000
            while retry > 0:
                ready, _ = self.ready_map.get(key)
                if ready.is_set():
                    break
                time.sleep(0.1)
                retry -= 1
            else:
                # 改为同步下载
                print("iter cache miss, key=", key)
                self._download(key)
            data = self._load_data_from_local(key)
            if data is None:
                raise FileNotFoundError(key)
            print(f"iter curIndex={i}/{total}")
            yield data
            self._clean_cache_after_read(key)

    def _download_asyn(self, keys: list):
        if len(keys) == 0:
            return
        for key in keys:
            ready, _ = self.ready_map.get(key)
            if ready.is_set():  # 已下载成功
                continue
            self.thread_pool.submit(self._download, key)

    def _get_fname_in_tmp(self, key: str):
        key = key.replace("/", "_")
        return f"/tmp/{self.bucket}_{key}"

    def _download(self, key):
        def download_inner():
            print("download_inner:", key)
            resp = self.client.get_object(Bucket=self.bucket, Key=key)
            size = int(resp["Content-Length"])
            fname_dst = self._get_fname_in_tmp(key)
            fname_tmp = f"{fname_dst}.{str(uuid.uuid4())}.tmp"
            file = open(fname_tmp, "wb")
            resp["Body"].pget_stream_to_file(file, offset=0, expected_len=size)
            file.close()
            os.rename(fname_tmp, fname_dst)

        ready, lock = self.ready_map.get(key)
        try:
            with lock:
                if not ready.is_set():
                    download_inner()
                    ready.set()
        except Exception as err:
            print(err)
            with lock:
                ready.clear()

    def _get_next_keys(self, key, pre_fetch_num) -> list:
        i = self.all_keys.index(key)
        return self.all_keys[i:i+pre_fetch_num]

    def _clean_cache_after_read(self, key):
        fname = self._get_fname_in_tmp(key)
        os.remove(fname)

    def _load_data_from_local(self, key):
        fname = self._get_fname_in_tmp(key)
        if not os.path.exists(fname):
            return None
        with open(fname, "rb") as f:
            return f.read()
