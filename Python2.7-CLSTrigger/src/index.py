# -*- coding: utf8 -*-
import base64
import json
import gzip
from StringIO import StringIO

def main_handler(event, context):
    # event is a dict containing a base64 string gzipped
    event = json.loads(gzip.GzipFile(fileobj=StringIO(event['clslogs']['data'].decode('base64'))).read())
    decoded_payload = json.dumps(event, indent=4, sort_keys=True)
    print(decoded_payload)
    return {'Status': 'OK'}