'use strict';

const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const CynosdbSdk = require('./common/CynosdbSdk');
const CosCynosdbBackupTask = require('./common/CosCynosdbBackupTask');
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
      triggerTime,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      instanceList,
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
      const cynosdbSdkInstance = new CynosdbSdk({
        secretId,
        secretKey,
        token,
      });
      mainTask = new CosCynosdbBackupTask({
        cosSdkInstance,
        scfSdkInstance,
        cynosdbSdkInstance,
        cosUpload,
        parentRequestId,
        context,
        functionName,
        sourceList,
        triggerTime,
        targetBucket,
        targetRegion,
        targetPrefix,
        backTrackDays,
        instanceList,
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
