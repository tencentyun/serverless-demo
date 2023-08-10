"use strict";

const CosSdk = require("cos-nodejs-sdk-v5");
const TeoSdk = require("./common/TeoSDK");
const CosTeoPrefetchTask = require("./common/CosTeoPrefetchTask");
const {
  getParams,
  getObjectUrl,
  logger,
  getLogSummary,
} = require("./common/utils");

exports.main_handler = async (event, context, callback) => {
  /**
   * parse param from event and process.env
   */
  const { objects, edgeoneDomains, secretId, secretKey, token, zoneId } =
    getParams(event);

  logger({
    title: "param is parsed success, param as follow: ",
    data: { objects, edgeoneDomains, event },
  });

  /**
   * init cos instance
   */
  if (!secretId || !secretKey || !token) {
    throw new Error(`secretId, secretKey or token is missing`);
  }

  const teoSdkInstance = new TeoSdk({ secretId, secretKey, token });
  const cosInstance = new CosSdk({
    SecretId: secretId,
    SecretKey: secretKey,
    XCosSecurityToken: token,
  });

  const taskList = objects.map(({ bucket, region, key }) => {
    return new CosTeoPrefetchTask({
      teoSdkInstance,
      urls: edgeoneDomains.map((host) => {
        return getObjectUrl({
          cosInstance,
          bucket,
          region,
          key,
          origin: `${
            /^(http\:\/\/|https\:\/\/)/.test(host) ? "" : "https://"
          }${host}`,
        });
      }),
      zoneId: zoneId,
      region: region,
    });
  });

  const taskResults = [];
  for (const task of taskList) {
    const results = await task.runPrefetchTasks();
    taskResults.push(...results);
  }

  logger({
    title: "edgeone prefetch full logs:",
    data: taskResults,
  });

  const { status, messages } = getLogSummary(taskResults);

  logger({
    messages: messages.map((item) => item.replace(/\,\ /g, "\n")),
  });

  if (status === "fail") {
    throw messages.join("; ");
  } else {
    return messages.join("; ");
  }
};