'use strict'

const UnzipTask = require('./common/UnzipTask')
const { replace } = require('lodash')
const {
  getParams,
  initCosInstance,
  getTaskName,
  getReason,
  getLogs,
  logger
} = require('./common/utils')

exports.main_handler = async (event, context, callback) => {
  let currentTask = null, isTimeout = false
  const duration = context.time_limit_in_ms - 20 * 1000
  const totalMem = context.memory_limit_in_mb * 1 * 1024 * 1024

  if (duration <= 0) {
    throw new Error(`time limit can not less than 20 seconds`)
  }

  /**
   * set a timer to terminate the unzip task, ensure log message is printed
   */
  setTimeout(() => {
    isTimeout = true
    if (currentTask && currentTask.cancel) {
      currentTask.cancel()
    }
  }, duration)

  /**
   * parse param from event and process.env
   */
  const {
    objectList,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    SecretId,
    SecretKey,
    XCosSecurityToken
  } = getParams(event)

  logger({
    title: 'param is parsed success, param as follow: ',
    data: {
      objectList,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      duration,
      event
    }
  })

  /**
   * init cos instance
   */
  if (!SecretId || !SecretKey || !XCosSecurityToken) {
    throw new Error(`SecretId, SecretKey or XCosSecurityToken is missing`)
  }
  const cosInstance = initCosInstance({ SecretId, SecretKey, XCosSecurityToken })
  /**
   * run unzip task
   */
  const taskList = objectList.map(({ Bucket, Region, Key }) => {
    return new UnzipTask({
      cosInstance,
      totalMem,
      Bucket,
      Region,
      Key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir
    })
  })
  const resultList = []

  for (const task of taskList) {
    const taskName = getTaskName(task)
    let result
    try {
      if (isTimeout) {
        throw 'isTimeout'
      }
      currentTask = task
      result = await task.run()
      if (result.status === 'canceled' && isTimeout) {
        throw 'isTimeout'
      }
    } catch (error) {
      result = {
        error: isTimeout ? 'isTimeout' : error
      }
    }
    resultList.push({
      taskName,
      ...result
    })
  }

  /**
   * print all tasks log message
   */
  const messageList = []
  let hasFail = false
  for (const result of resultList) {
    const { taskName, list, error } = result
    const contents = [`Object: ${taskName}`]
    if (error) {
      contents.push(`Result: unzip task fail`)
      contents.push(`Reason: ${getReason(error)}`)
      contents.push(...getLogs(error))
      hasFail = true
    } else if (list) {
      let total = 0, success = 0, errorTips = []
      list.forEach(({ status, error, entry }) => {
        if (status === 'success') {
          success++
        }
        total++
        if (error) {
          errorTips.push(`Reason: ${getReason(error)}`)
          errorTips.push(...getLogs(error, entry))
        }
      })
      const status = success === total ? 'success' : 'fail'
      contents.push(`Result: unzip task ${status}, success: ${success}, total: ${total}`)
      if (errorTips.length) {
        contents.push(...(errorTips.slice(0, 50)))
      }
      if (status === 'fail') {
        hasFail = true
      }
    }
    const content = contents.join('\n')
    logger({ content })
    messageList.push(content)
  }

  /**
   * print result
   */
  const summary = replace(messageList.join('\n'), /\n/g, '; ')
  if (hasFail) {
    // to keep error log readable, do not throw Error instance
    throw summary
  } else {
    return summary
  }
}