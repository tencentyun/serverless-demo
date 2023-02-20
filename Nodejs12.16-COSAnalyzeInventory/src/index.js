'use strict';

const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const CosAnalyzeInventoryTask = require('./common/CosAnalyzeInventoryTask');
const mainHandler = require('./common/mainHandler');

exports.main_handler = async (event, context) => {
  let mainTask = null;
  const response = await mainHandler({
    event,
    context,
    runMainTask: async ({
      cosSdkInstance,
      scfSdkInstance,
      secretId,
      secretKey,
      token,
      parentRequestId,
      context,
      functionName,
      sourceList,
      defaultHashCheck,
      bucket,
      region,
      key,
      prefix,
      preAnalyzeConfig,
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
      mainTask = new CosAnalyzeInventoryTask({
        cosSdkInstance,
        scfSdkInstance,
        cosUpload,
        parentRequestId,
        context,
        functionName,
        sourceList,
        bucket,
        region,
        key,
        prefix,
        preAnalyzeConfig,
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
