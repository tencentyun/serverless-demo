'use strict';

const CosDeleteFileTask = require('./common/CosDeleteFileTask');
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
    }) => {
      mainTask = new CosDeleteFileTask({
        cosSdkInstance,
        secretId,
        secretKey,
        token,
        functionName,
        sourceList,
        triggerType,
        avoidLoopRisk,
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
