/* eslint-disable no-unused-vars */
'use strict';

const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const CdbSdk = require('./common/CdbSdk');
const CosCdbBackupTask = require('./common/CosCdbBackupTask');
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
      targetKeyTemplate,
      backTrackDays,
      instanceList,
      backupTypeList,
      timeRange,
    }) => {
      const cosUpload = new CosUpload({
        cos: {
          SecretId: secretId,
          SecretKey: secretKey,
          XCosSecurityToken: token,
        },
        putObjectLimit: 8 * 1024 * 1024,
        maxTryTimes: 3,
        defaultHashCheck: false,
      });
      const cdbSdkInstance = new CdbSdk({
        secretId,
        secretKey,
        token,
      });
      mainTask = new CosCdbBackupTask({
        cosSdkInstance,
        scfSdkInstance,
        cdbSdkInstance,
        cosUpload,
        parentRequestId,
        context,
        functionName,
        sourceList,
        triggerTime,
        targetBucket,
        targetRegion,
        targetKeyTemplate,
        backTrackDays,
        instanceList,
        backupTypeList,
        timeRange,
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
