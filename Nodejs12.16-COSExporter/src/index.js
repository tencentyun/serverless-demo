'use strict';

const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const CosExporterTask = require('./common/CosExporterTask');
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
      defaultHashCheck,
      inputConfig,
      filterConfig,
      outputConfig,
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
      mainTask = new CosExporterTask({
        cosSdkInstance,
        cosUpload,
        functionName,
        sourceList,
        inputConfig,
        filterConfig,
        outputConfig,
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
