#!/usr/bin/env python
# -*- coding: utf-8 -*-

import base64
import os
import sys
from werkzeug.datastructures import Headers, MultiDict
from werkzeug.wrappers import Response
from werkzeug.urls import url_encode, url_unquote
from werkzeug.http import HTTP_STATUS_CODES
from werkzeug._compat import BytesIO, string_types, to_bytes, wsgi_encoding_dance

# List of MIME types that should not be base64 encoded. MIME types within `text/*`
# are included by default.
TEXT_MIME_TYPES = [
    "application/json",
    "application/javascript",
    "application/xml",
    "application/vnd.api+json",
    "image/svg+xml",
]

def all_casings(input_string):
    if not input_string:
        yield ""
    else:
        first = input_string[:1]
        if first.lower() == first.upper():
            for sub_casing in all_casings(input_string[1:]):
                yield first + sub_casing
        else:
            for sub_casing in all_casings(input_string[1:]):
                yield first.lower() + sub_casing
                yield first.upper() + sub_casing


def split_headers(headers):
    new_headers = {}

    for key in set(headers.keys()):
        values = headers.get_all(key)
        if len(values) > 1 and key.lower() != 'set-cookie':
            for value, casing in zip(values, all_casings(key)):
                new_headers[casing] = value
        elif key.lower() == 'set-cookie':
          new_headers[key] = values
        elif len(values) == 1:
            new_headers[key] = values[0]

    return new_headers


def group_headers(headers):
    new_headers = {}

    for key in headers.keys():
        new_headers[key] = headers.get_all(key)

    return new_headers


def encode_query_string(event):
    multi = event.get(u"multiValueQueryStringParameters")
    if multi:
        return url_encode(MultiDict((i, j) for i in multi for j in multi[i]))
    else:
        return url_encode(event.get(u"queryString") or {})


def handle_request(app, event, context):
    if u"multiValueHeaders" in event:
        headers = Headers(event["multiValueHeaders"])
    else:
        headers = Headers(event["headers"])

    strip_stage_path = os.environ.get("STRIP_STAGE_PATH", "").lower().strip() in [
        "yes",
        "y",
        "true",
        "t",
        "1",
    ]
    if u"apigw.tencentcs.com" in headers.get(u"Host", u"") and not strip_stage_path:
        script_name = "/{}".format(event["requestContext"].get(u"stage", ""))
    else:
        script_name = ""

    path_info = event["path"]
    base_path = os.environ.get("API_GATEWAY_BASE_PATH")
    print(base_path)
    if base_path:
        script_name = "/" + base_path

        if path_info.startswith(script_name):
            path_info = path_info[len(script_name) :] or "/"

    if u"body" in event:
        body = event[u"body"] or ""
    else:
        body = ""

    if event.get("isBase64Encoded", False):
        body = base64.b64decode(body)
    if isinstance(body, string_types):
        body = to_bytes(body, charset="utf-8")

    environ = {
        "CONTENT_LENGTH": str(len(body)),
        "CONTENT_TYPE": headers.get(u"Content-Type", ""),
        "PATH_INFO": url_unquote(path_info),
        "QUERY_STRING": encode_query_string(event),
        "REMOTE_ADDR": event["requestContext"]
        .get(u"identity", {})
        .get(u"sourceIp", ""),
        "REMOTE_USER": event["requestContext"]
        .get(u"authorizer", {})
        .get(u"principalId", ""),
        "REQUEST_METHOD": event["httpMethod"],
        "SCRIPT_NAME": script_name,
        "SERVER_NAME": headers.get(u"Host", "Serverless"),
        "SERVER_PORT": headers.get(u"X-Forwarded-Port", "80"),
        "SERVER_PROTOCOL": "HTTP/1.1",
        "wsgi.errors": sys.stderr,
        "wsgi.input": BytesIO(body),
        "wsgi.multiprocess": False,
        "wsgi.multithread": False,
        "wsgi.run_once": False,
        "wsgi.url_scheme": headers.get(u"X-Forwarded-Proto", "http"),
        "wsgi.version": (1, 0),
        "serverless.authorizer": event["requestContext"].get(u"authorizer"),
        "serverless.event": event,
        "serverless.context": context,
        "API_GATEWAY_AUTHORIZER": event["requestContext"].get(u"authorizer"),
        "event": event,
        "context": context,
    }

    for key, value in environ.items():
        if isinstance(value, string_types):
            environ[key] = wsgi_encoding_dance(value)

    for key, value in headers.items():
        key = "HTTP_" + key.upper().replace("-", "_")
        if key not in ("HTTP_CONTENT_TYPE", "HTTP_CONTENT_LENGTH"):
            environ[key] = value

    response = Response.from_app(app, environ)

    returndict = {u"statusCode": response.status_code}

    if u"multiValueHeaders" in event:
        returndict["multiValueHeaders"] = group_headers(response.headers)
    else:
        returndict["headers"] = split_headers(response.headers)

    if event.get("requestContext").get("elb"):
        # If the request comes from ALB we need to add a status description
        returndict["statusDescription"] = u"%d %s" % (
            response.status_code,
            HTTP_STATUS_CODES[response.status_code],
        )

    if response.data:
        mimetype = response.mimetype or "text/plain"
        if (
            mimetype.startswith("text/") or mimetype in TEXT_MIME_TYPES
        ) and not response.headers.get("Content-Encoding", ""):
            returndict["body"] = response.get_data(as_text=True)
            returndict["isBase64Encoded"] = False
        else:
            returndict["body"] = base64.b64encode(response.data).decode("utf-8")
            returndict["isBase64Encoded"] = True

    return returndict
