/* eslint-disable no-param-reassign */
'use strict';

const CosSdk = require('cos-nodejs-sdk-v5');
const { inspect } = require('util');

exports.main_handler = async (event, context) => {
  try {
    /**
     * Print event params
     */
    console.log(`\nEvent Params As Follow:\n${JSON.stringify(event, null, 4)}`);

    /**
     * Get SECRETID, SECRETKEY, SESSIONTOKEN from scf default environment variables of cam role
     * Bind Role Document: https://cloud.tencent.com/document/product/583/47933
     * Environment Variables Documnet: https://cloud.tencent.com/document/product/583/30228
     */
    const {
      TENCENTCLOUD_SECRETID,
      TENCENTCLOUD_SECRETKEY,
      TENCENTCLOUD_SESSIONTOKEN,
    } = process.env;

    /**
     * Test cos head object
     */
    const cosSdkInstance = new CosSdk({
      SecretId: TENCENTCLOUD_SECRETID,
      SecretKey: TENCENTCLOUD_SECRETKEY,
      XCosSecurityToken: TENCENTCLOUD_SESSIONTOKEN,
    });
    const { Input: { BucketId: Bucket, Region, Object: Key } = {} } = event;
    const res = await cosSdkInstance.headObject({
      Bucket,
      Region,
      Key,
    });
    console.log(`\nCOS Head Object Response:\n${JSON.stringify(res, null, 4)}`);
  } catch (err) {
    console.log(`\nCatch Error:\n${inspect(err, { depth: 10 })}`);
  } finally {
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
