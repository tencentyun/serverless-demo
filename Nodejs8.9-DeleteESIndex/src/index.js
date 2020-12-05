"use strict";
/**************************************************
Node8.9-DeleteESIndex
Reference: https://cloud.tencent.com/document/product/583/32553
***************************************************/

// The host's address of es, es集群的主机地址
// const Host = "10.0.1.148";
// const Port = "80";

// const dayjs = require("dayjs");
const elasticsearch = require("elasticsearch");

const client = new elasticsearch.Client({
  host: "**",
  requestTimeout: 300000
});

const esPrefix = "cron-"; // The prefix of the index, 查找的 index 索引前缀
const esCuratorTimeStr = "%Y%m%d%H"; // The time format, 索引中的时间格式
const esCuratorTimeUnit = "hour"; // The filtering time unit, 过滤清理的时间单位
const esCuratorTimeCount = 8; // The time interval, 时间间隔

exports.main_handler = async (event, context, callback) => {
  // Deleting index, 索引删除
  try {
    // Get all the index, 获取所有的index
    let result = await new Promise((res, rej) => {
      client.cat.indices(
        {
          format: "json"
        },
        function(error, result) {
          if (error) {
            rej(error);
          } else {
            res(result);
          }
        }
      );
    });

    // Delete index
    await new Promise((res, rej) => {
      client.indices.delete(
        {
          index: result[0].index
        },
        function(error, result) {
          if (error) {
            rej(error);
          } else {
            res(result);
          }
        }
      );
    });
    // Deleted
  } catch (err) {
    console.log(err);
  }

  return "success";
};
