'use strict';

const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const CosAnalyzeLogsTask = require('./common/CosAnalyzeLogsTask');
const mainHandler = require('./common/mainHandler');

exports.main_handler = async (event, context) => {
  let mainTask = null;
  const response = await mainHandler({
    event,
    context,
    runMainTask: async ({
      cosSdkInstance,
      secretId,
      secretKey,
      token,
      functionName,
      sourceList,
      bucket,
      region,
      key,
      defaultHashCheck,
      analyzeConfig,
    }) => {
      const cosUpload = new CosUpload({
        cos: {
          SecretId: secretId,
          SecretKey: secretKey,
          XCosSecurityToken: token,
        },
        putObjectLimit: 8 * 1024 * 1024,
        defaultChunkSize: 8 * 1024 * 1024,
        maxTryTimes: 1,
        defaultHashCheck,
      });
      mainTask = new CosAnalyzeLogsTask({
        cosSdkInstance,
        cosUpload,
        functionName,
        sourceList,
        targetBucket: bucket,
        targetRegion: region,
        targetKey: key,
        analyzeConfig,
      });
      const result = await mainTask.runTask();
      mainTask = null;
      return {
        results: [result],
      };
    },
    cancelMainTask: async (error) => {
      if (mainTask && mainTask.cancelTask) {
        await mainTask.cancelTask(error);
      }
    },
  });
  return response;
};
