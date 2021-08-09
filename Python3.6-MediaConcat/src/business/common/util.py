# -*- coding: utf8 -*-
import os


def get_value(data, key=''):
    value = None
    if data and len(key) > 0:
        if data.get(key):
            value = data.get(key)

        lower_key = key[0].lower() + key[1:]
        if data.get(lower_key):
            value = data.get(lower_key)

    return value


def clear_files(src):
    if os.path.isfile(src):
        try:
            os.remove(src)
        except:
            pass
    elif os.path.isdir(src):
        for item in os.listdir(src):
            itemsrc = os.path.join(src, item)
            clear_files(itemsrc)
        try:
            os.rmdir(src)
        except:
            pass