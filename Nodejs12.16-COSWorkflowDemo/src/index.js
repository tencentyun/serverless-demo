/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
'use strict';

const CosSdk = require('cos-nodejs-sdk-v5');
const { inspect } = require('util');

exports.main_handler = async (event, context) => {
  try {
    /**
     * Print event params and environment variables params
     */
    console.log(`\nEvent Params As Follow:\n${JSON.stringify(event, null, 4)}\n`);
    console.log(`\nEnvironment Variables Params As Follow:\n${JSON.stringify(
      process.env,
      null,
      4,
    )}\n`);

    /**
     * Get TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN from scf default environment variables of cam role
     * Bind Role Document: https://cloud.tencent.com/document/product/583/47933
     * Environment Variables Documnet: https://cloud.tencent.com/document/product/583/30228
     */
    const {
      TENCENTCLOUD_SECRETID,
      TENCENTCLOUD_SECRETKEY,
      TENCENTCLOUD_SESSIONTOKEN,
    } = process.env;

    /**
     * Init cos sdk instance
     */
    const cosSdkInstance = new CosSdk({
      SecretId: TENCENTCLOUD_SECRETID,
      SecretKey: TENCENTCLOUD_SECRETKEY,
      XCosSecurityToken: TENCENTCLOUD_SESSIONTOKEN,
    });

    /**
     * Get cos object info from event params
     */
    const { ObjectInfo: { BucketId: Bucket, Region, Object: Key } = {} } =      event;

    /**
     * Test cos head object
     */
    const response = await cosSdkInstance.headObject({
      Bucket,
      Region,
      Key,
    });

    console.log(`\nCOS Head Object Response:\n${JSON.stringify(response, null, 4)}\n`);
  } catch (err) {
    console.log(`\nCatch Error:\n${inspect(err, { depth: 10 })}\n`);
    throw err;
  } finally {
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
