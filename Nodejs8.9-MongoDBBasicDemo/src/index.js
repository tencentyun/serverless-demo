'use strict';

const {promisify} = require('util')
const mongodb = require('mongodb')

var mongoClient = mongodb.MongoClient,
    assert = require('assert');

const connect = promisify(mongodb.connect)

// URL combination
var url = 'mongodb://mason_mongodb:mason12345@10.10.11.19:27017/admin';

exports.main_handler = async (event, context, callback) => {
    console.log('start main handler')
    const MongoClient = require("mongodb").MongoClient;
    const mc = await MongoClient.connect(url,{useNewUrlParser: true})
    const db = mc.db('testdb') 
    const collection = db.collection('demoCol')
    await collection.insertOne({a:1,something:'123'})
    const as = await collection.find().toArray()
    console.log(as)

    mc.close()

    return as
}
