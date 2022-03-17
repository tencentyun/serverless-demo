'use strict';

const CosCopyFileTask = require('./common/CosCopyFileTask');
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
      triggerType,
      avoidLoopRisk,
      relativePrefix,
      targetBucket,
      targetRegion,
      targetKeyTemplate,
      setHeaders,
      setAcls,
      setTags,
      deleteSourceKey,
    }) => {
      mainTask = new CosCopyFileTask({
        cosSdkInstance,
        secretId,
        secretKey,
        token,
        functionName,
        sourceList,
        triggerType,
        avoidLoopRisk,
        relativePrefix,
        targetBucket,
        targetRegion,
        targetKeyTemplate,
        setHeaders,
        setAcls,
        setTags,
        deleteSourceKey,
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
