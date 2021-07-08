import requests
import os
import time

eis_url = os.environ.get("URL")


def main_handler(event, context):
    try:
        for _ in range(3):
            r = requests.post(eis_url, json=event)
            if r.status_code in (429, 503):
                time.sleep(1)
                continue
            else:
                print(r.text)
                break
    except Exception as e:
        print(e)

