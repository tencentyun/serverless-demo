/* eslint-disable no-param-reassign */
'use strict';

const CosSdk = require('cos-nodejs-sdk-v5');
const path = require('path');
const childProcess = require('child_process');
const { inspect } = require('util');

exports.main_handler = async (event, context) => {
  let localCachePath;
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
     * Get config params from environment variables
     */
    const {
      TENCENTCLOUD_SECRETID,
      TENCENTCLOUD_SECRETKEY,
      TENCENTCLOUD_SESSIONTOKEN,
      targetBucket,
      targetRegion,
      targetKeyTemplate = '${InputPath}${InputName}_transcode.${ext}',
      ffmpegTemplate = '${ffmpeg} -loglevel error -i ${source} -r 10 -b:a 32k ${target}',
      localTmpPath = '/tmp',
      avoidLoopRisk = 'true',
    } = process.env;

    localCachePath = path
      .join(localTmpPath, context.request_id)
      .replace(/\\/g, '/');

    console.log(`\nLocal Cache Path Is ${localCachePath}\n`);

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
     * Avoid loop risk
     */
    if (avoidLoopRisk === 'true') {
      const { headers = {} } = await cosSdkInstance.headObject({
        Bucket,
        Region,
        Key,
      });
      const hasRisk =        headers['x-cos-meta-scf-cos-workflow-ffmpeg-transcode'] === 'true';
      if (hasRisk) {
        console.log('\nThis COS Object Is A SCF COS Workflow FFmpeg Transcode Result, To Avoid Loop Trigger, Skip It\n');
      }
    }

    const sourceUrl = cosSdkInstance.getObjectUrl({
      Bucket,
      Region,
      Key,
      Expires: 24 * 60 * 60,
      Sign: true,
    });

    /**
     * Generate targetKey and targetFilePath
     */
    const targetKey = replaceTemplate(targetKeyTemplate, {
      '${InputPath}': Key.replace(/[^/]+$/, ''),
      '${InputName}': path.basename(Key, path.extname(Key)),
      '${ext}': path.extname(Key).replace(/^\./, ''),
    });

    const targetFilePath = path
      .join(localCachePath, path.basename(targetKey))
      .replace(/\\/g, '/');

    /**
     * Generate ffmpeg command
     */
    const ffmpegCommand = replaceTemplate(ffmpegTemplate, {
      '${ffmpeg}': './ffmpeg',
      '${source}': `"${sourceUrl}"`,
      '${target}': `"${targetFilePath}"`,
    });

    /**
     * Run command line
     */
    childProcess.execSync(`mkdir -p ${path.dirname(targetFilePath)}`);
    childProcess.execSync(`cp ./common/ffmpeg ${localCachePath}/ffmpeg`);
    childProcess.execSync(`chmod 755 ${localCachePath}/ffmpeg`);
    childProcess.execSync(ffmpegCommand, {
      cwd: localCachePath,
      maxBuffer: 50 * 1024 * 1024,
    });

    /**
     * Upload file to cos bucket
     */
    const response = await cosSdkInstance.sliceUploadFile({
      Bucket: targetBucket,
      Region: targetRegion,
      Key: targetKey,
      FilePath: targetFilePath,
      Headers: {
        'x-cos-meta-source': 'cos-data-process',
        'x-cos-meta-scf-cos-workflow-ffmpeg-transcode': 'true',
      },
    });

    console.log(`\nCOS SliceUploadFile Response:\n${JSON.stringify(response, null, 4)}\n`);
  } catch (err) {
    console.log(`\nCatch Error:\n${inspect(err, { depth: 10 })}\n`);
    throw err;
  } finally {
    clearCacheFile(localCachePath);
    context.callbackWaitsForEmptyEventLoop = false;
  }
};

/**
 * clear cache file on file system
 */
function clearCacheFile(localCachePath) {
  try {
    childProcess.execSync(`rm -rf ${localCachePath}`);
  } catch (err) {
    console.log(`\nClear Cache Error:\n${inspect(err, { depth: 10 })}\n`);
    throw err;
  }
}

/**
 * replace the placeholder of template by map
 */
function replaceTemplate(template = '', map = {}) {
  const reg = Object.keys(map)
    .map(key => key.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'))
    .join('|');
  return template.replace(
    new RegExp(reg, 'gm'),
    placeholer => map[placeholer] || '',
  );
}
