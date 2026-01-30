import logging
import os
import sys
import time
import json
import random
import hmac
import hashlib
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


MAX_RETRIES = 1 # 最大重试次数
RETRY_WAIT_TIME = 60 # 重试等待时间,单位:秒
ZJ_CDN_API_URL = "http://cdnzjrefresh.tcdn.qq.com/refresh"

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.propagate = False


# 解析COS事件
def parse_cos_event(event_data):
    records = event_data.get("Records", [])
    parsed_results = []
    for record in records:
        cos_info = record.get("cos", {})
        event_info = record.get("event", {})
        cos_object = cos_info.get("cosObject", {})
        cos_bucket = cos_info.get("cosBucket", {})
        result = {
            "object_url": cos_object.get("url", ""),
            "object_size": cos_object.get("size", 0),
            "content_type": cos_object.get("meta", {}).get("Content-Type", ""),
            "bucket_name": cos_bucket.get("name", ""),
            "bucket_region": cos_bucket.get("region", ""),
            "bucket_appid": cos_bucket.get("appid", ""),
            "event_name": event_info.get("eventName", ""),
            "event_time": event_info.get("eventTime", 0),
            "event_source": event_info.get("eventSource", ""),
            "request_source_ip": event_info.get("requestParameters", {}).get("requestSourceIP", ""),
            "reqid": event_info.get("reqid", 0)
        }
        event_name = result.get("event_name", "").lower()
        if "create" not in event_name:
            logger.warning(f"skip event (not contain 'create'): {result.get('event_name')}")
            continue
        parsed_results.append(result)
    return parsed_results


# 主处理函数
def main_handler(event, context):
    try:
        domain = os.getenv("ZJ_CDN_DOMAIN")
        refresh_id = os.getenv("ZJ_CDN_REFRESH_ID")
        refresh_key = os.getenv("ZJ_CDN_REFRESH_KEY")
        if not domain or not refresh_id or not refresh_key:
            logger.error("env: ZJ_CDN_DOMAIN or ZJ_CDN_REFRESH_ID or ZJ_CDN_REFRESH_KEY not configured")
            return "failed"
        
        parsed_results = parse_cos_event(event)
        if not parsed_results:
            logger.warning("no records found in event")
            return "success"
        
        # 生成刷新url列表
        refresh_urls = []
        for result in parsed_results:
            object_url = result.get('object_url', '')
            logger.info(f"object_url: {object_url}")
            if not object_url:
                logger.error("failed: cannot get object_url")
                continue
            
            parsed_url = urlparse(object_url)
            uri = parsed_url.path.lstrip('/')
            if not uri:
                logger.error(f"failed: cannot extract path from url: {object_url}")
                continue
            
            refresh_url = f"https://{domain}/{uri}"
            refresh_urls.append(refresh_url)
        if not refresh_urls:
            logger.error("no valid URLs to refresh")
            return "failed"
        logger.info(f"prepared {len(refresh_urls)} URLs to refresh")
        
        for attempt in range(MAX_RETRIES + 1):
            # 构造刷新请求, 时间戳需要重新计算      
            payload = {
                "urls": refresh_urls
            }
            timestamp = str(int(time.time()))
            timestamp_bytes = timestamp.encode('utf-8')
            payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
            sign = hmac.new(
                refresh_key.encode('utf-8'),
                payload_json + timestamp_bytes,
                hashlib.sha256
            ).hexdigest()
        
            headers = {
                "ZJ-REFRESH-ID": refresh_id,
                "ZJ-REFRESH-TS": timestamp,
                "ZJ-REFRESH-SIGN": sign,
                "Content-Type": "application/json"
            }

            retry_wait_time = RETRY_WAIT_TIME + random.randint(0, 60)
            try:
                logger.info(f"attempting to refresh (retry: {attempt}/{MAX_RETRIES})")
                logger.info(f"json_data: {payload_json}, headers: {headers}")
                req = Request(ZJ_CDN_API_URL, data=payload_json, headers=headers, method='POST')
                with urlopen(req, timeout=10) as response:
                    status_code = response.getcode()
                    response_text = response.read().decode('utf-8')
                if status_code == 200:
                    logger.info(f"successfully refreshed {len(refresh_urls)} URLs")
                    return "success"
            except HTTPError as e:
                status_code = e.code
                if status_code == 429:
                    if attempt < MAX_RETRIES:
                        logger.warning(f"recv http status 429, will retry after {retry_wait_time} seconds")
                        time.sleep(retry_wait_time)
                        continue
                    else:
                        logger.error(f"recv http status 429, retry over {MAX_RETRIES} times, exit")
                        return "failed"
                else:
                    logger.error(f"failed to refresh, status: {status_code}, exit")
                    return "failed"
            except (URLError, OSError) as e:
                if attempt < MAX_RETRIES:
                    logger.warning(f"request failed: {str(e)}, will retry after {retry_wait_time} seconds")
                    time.sleep(retry_wait_time)
                    continue
                else:
                    logger.error(f"request failed after {MAX_RETRIES} attempts, err: {str(e)}, exit")
                    return "failed"
        return "failed"
    except Exception as e:
        logger.error(f"failed: {str(e)}")
        return "failed"

