#!/usr/bin/python
# -*- coding: utf-8 -*-

import binascii
import hashlib
import hmac

class Sign:
    def __init__(self, secretId, secretKey):
        self.secretId = secretId
        self.secretKey = secretKey

    def make(self, requestHost, requestUri, params, method='POST', sign_method='sha1'):
        new_params = {}
        for param_key in params:
            if method.upper() == 'POST' and str(params[param_key])[0:1] == "@":
                continue
            new_params[param_key] = params[param_key]
        srcStr = method.upper() + requestHost + requestUri + '?' + "&".join(k.replace("_", ".") + "=" + str(new_params[k]) for k in sorted(new_params.keys()))
        if sign_method == 'sha1':
            hashed = hmac.new(str.encode(self.secretKey), srcStr.encode('utf-8'), hashlib.sha1)
        elif sign_method == 'sha256':
            hashed = hmac.new(str.encode(self.secretKey), srcStr.encode('utf-8'), hashlib.sha256)
        return binascii.b2a_base64(hashed.digest())[:-1]
      
def main():
    secretId = 123
    secretKey = 'xxx'
    params = {'a':1, 'b':2}
    sign = Sign(secretId, secretKey)
    print(sign.make('cmq-gz.api.qcloud.com', '/v2/index.php', params))

if (__name__ == '__main__'):
    main()
