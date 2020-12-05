"use strict";
/**************************************************
Node8.9-WriteToES
Reference: https://cloud.tencent.com/document/product/583/32553
***************************************************/

// The host address of es cluster, es集群的主机地址
// const Host = "10.0.1.148";
// const Port = "80";

const dayjs = require("dayjs");
const elasticsearch = require("elasticsearch");

const client = new elasticsearch.Client({
  host: "***",
  requestTimeout: 300000
});

exports.main_handler = async (event, context, callback) => {
  try {
    // If there is no corresponding index:
    // let createResult = await new Promise((res, rej) => {
    //   client.indices.create(
    //     {
    //       index: "cron_write"
    //     },
    //     function(error, result) {
    //       if (error) {
    //         rej(error);
    //       } else {
    //         res(result);
    //       }
    //     }
    //   );
    // });

    // Write in data, 写入数据
    let write_data = {};
    write_data["timestamp"] = new dayjs().format("YYYY-MM-DD HH:mm:ss");
    write_data["randomcode"] = parseInt(Math.random() * 100);
    write_data["author"] = "seven";

    let writeResult = await new Promise((res, rej) => {
      client.index(
        {
          index: "cron_write",
          type: "doc",
          body: write_data
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

    console.log(writeResult);
  } catch (err) {
    console.log(error);
  }

  return "write success";
};
