# -*- coding: utf8 -*-
#!/usr/bin/python
import pymongo
import random

def main_handler(event,context):
    # Replace 'mongodbUri' with your address. 替换成自己的地址
    mongodbUri = 'mongodb://mason_mongodb:mason@10.10.11.19:27017/admin' 

    client = pymongo.MongoClient(mongodbUri)
    db = client.somedb
    db.user.drop()
    element_num=10
    for id in range(element_num):
        name = random.choice(['R9','cat','owen','lee','J'])
        sex = random.choice(['male','female'])
        db.user.insert_one({'id':id, 'name':name, 'sex':sex})

    content = db.user.find()
    for i in content:
        print i
    
    return "Finish test"