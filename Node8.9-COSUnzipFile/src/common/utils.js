'use strict'

const COS = require('cos-nodejs-sdk-v5')
const path = require('path')
const URL = require('url')
const { detect, decode } = require('./encoding')
const { promisify, inspect } = require('util')
const { isFunction, isString, isObject } = require('lodash')

const ERROR_TRACE_MAP = {
  'CosRandomAccessReader.cosInstance.headObjectRetryPromise': 'zip file head object fail',
  'CosRandomAccessReader.cosInstance.getObjectPromise': 'zip file get object fail',
  'CosRandomAccessReader.getFdSlicer': 'zip file get file descriptor fail',
  'UnzipFile.init.yauzl.fromRandomAccessReaderRetryPromise': 'zip file parse error, it may be broken',
  'UnzipTask.unzipFile.getEntries': 'zip file get sub file entry fail',
  'UnzipTask.unzipFile.cosInstance.unzipOneTask': 'sub file put object fail'
}

/**
 * get source and target message from event and process.env 
 */
function getParams({
  Records = []
}) {
  const objectList = Records.map(item => {
    return parseUrl({
      url: item.cos.cosObject.url
    })
  })
  const {
    env: {
      targetBucket,
      targetRegion,
      targetPrefix = '',
      extraRootDir = 'fileBaseName',
      TENCENTCLOUD_SECRETID: SecretId,
      TENCENTCLOUD_SECRETKEY: SecretKey,
      TENCENTCLOUD_SESSIONTOKEN: XCosSecurityToken
    }
  } = process

  return {
    objectList,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    SecretId,
    SecretKey,
    XCosSecurityToken
  }
}

/**
 * parse cos url to get the Bucket, Region, Key message
 */
function parseUrl({ url }) {
  const { host, pathname } = URL.parse(url)
  const { 1: Bucket, 2: Region } = host.match(/^([^\/]*)\.cos\.([^\/]*)\.myqcloud\.com$/)
  return {
    Bucket,
    Region,
    Key: decodeURIComponent(pathname.slice(1))
  }
}

/**
 * append promisify or retry logic methods
 */
function appendFunction({
  target = {},
  keys = [],
  maxTryTime = 1,
  promisify: needPromisify = true
}) {
  const suffix = `${maxTryTime > 1 ? 'Retry' : ''}${needPromisify ? 'Promise' : ''}`
  for (const key of keys) {
    const value = target[key]
    if (isFunction(value)) {
      const func = needPromisify ? promisify(value).bind(target) : value.bind(target)
      target[`${key}${suffix}`] = retry({ maxTryTime, func }) 
    }
  }
}

/**
 * init cos-nodejs-sdk-v5 instance，append promisify methods add retry logic
 */
function initCosInstance({ SecretId, SecretKey, XCosSecurityToken, ...args }) {
  const cosInstance = new COS({
    SecretId,
    SecretKey,
    XCosSecurityToken,
    ...args
  })

  const keys = Object.keys(COS.prototype)
  const noRetryKeys = ['getObject', 'putObject']

  appendFunction({
    target: cosInstance,
    keys: noRetryKeys,
    maxTryTime: 1
  })

  appendFunction({
    target: cosInstance,
    keys: keys.filter(key => !noRetryKeys.includes(key)),
    maxTryTime: 3
  })
  return cosInstance
}

/**
 * calculate the unzip-task batch limit according to the memory limit
 */
function getBatchLimit({
  runtimeBuffer = 10 * 1024 * 1024,
  reserveRate = 0,
  totalMem = 896 * 1024 * 1024
}) {
  return Math.floor((1 - reserveRate) * totalMem / runtimeBuffer)
}

/**
 * try to decode buffer by detect encoding
 */
function bufferToString(buffer) {
  const { encoding, confidence } = detect(buffer)
  return decode(buffer, encoding)
}

/**
 * get file basename and extname
 */
function parseFileName(fileName) {
  const extname = path.extname(fileName)
  const basename = path.basename(fileName, extname)
  return {
    basename,
    extname
  }
}

/**
 * get unzip task name
 */
function getTaskName({ Bucket, Region, Key }) {
  return `${Bucket}.cos.${Region}.myqcloud.com/${Key}`
}

/**
 * get fail reason
 */
function getReason(error) {
  if (error === 'isTimeout') {
    return 'serverless cloud function timeout, with 20 seconds buffer'
  } else if (isString(error)) {
    return error
  } else if (error.trace) {
    const { trace, Key } = error
    return `${ERROR_TRACE_MAP[trace] || trace} ${Key ? `(Key: ${Key})` : ''}`
  } else if (isString(error.error)) {
    return error.error
  } else {
    return ''
  }
}

/**
 * get error logs
 */
function getLogs(err, entry) {
  const cosLogs = getCosLogs(err)
  const otherLogs = getOtherLogs(err, entry)
  return cosLogs.length ? cosLogs : otherLogs
}

/**
 * get cos error logs
 */
function getCosLogs(err) {
  if (!isObject(err)) {
    return []
  }
  if (err && err.error && err.error.statusCode) {
    err = err.error
  }
  const { headers, statusCode, error } = err

  if (!headers || !statusCode) {
    return []
  }
  try {
    const { Code, Message } = isString(error) ? { Code: error } : error
    return [
      `StatusCode: ${statusCode}`,
      `Code: ${Code}`,
      `Message: ${Message}`,
      `RequestId: ${headers['x-cos-request-id']}`,
      `TraceId: ${headers['x-cos-trace-id']}`
    ]
  } catch (err) {
    return []
  }
}

/**
 * get other error logs
 */
function getOtherLogs(err, entry) {
  try {
    if (err === 'isTimeout' || (err.error && err.error === 'single sub file can not larger than 5 GB')) {
      return []
    } else if (isString(err)) {
      return [err]
    } else if (isObject(err)) {
      if (entry) {
        return [`Key: ${entry.fileNameStr}`, inspect(err, { depth: 20 })] 
      } else {
        return [inspect(err, { depth: 20 })]
      }
    } else {
      return [JSON.stringify(err)]
    }
  } catch (e) {
    if (err && err.toString) {
      return [err.toString()]
    } else {
      return []
    }
  }
}

/**
 * print log message
 */
function logger({ title = '', content = '', data = {}, print = true }) {
  const message = []
  message.push(title, content)
  for (let key in data) {
    const value = data[key]
    if (isString(value)) {
      message.push(`${key}: ${value}`)
    } else {
      try {
        message.push(`${key}: ${JSON.stringify(value)}`)
      } catch (err) {
      }
    }
  }
  const result = `${message.filter(Boolean).join('\n')}`
  if (print) {
    console.log(result)
  }
  return result
}


/**
 * retry logic
 */
function retry({ maxTryTime = 3, func }) {
  return async (...args) => {
    let err, tryTime = 0
    while (tryTime < maxTryTime) {
      tryTime++
      try {
        const res = await func(...args)
        return res
      } catch (e) {
        err = e
      }
    }
    throw err
  }
}

module.exports = {
  getParams,
  appendFunction,
  initCosInstance,
  getBatchLimit,
  bufferToString,
  parseFileName,
  getTaskName,
  getReason,
  getLogs,
  logger,
  retry
}