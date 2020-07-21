'use strict'

const CosSdk = require('cos-nodejs-sdk-v5')
const CdnSdk = require('./common/CdnSdk')
const CdnRefreshTask = require('./common/CdnRefreshTask')
const {
  getParams,
  getObjectUrl,
  logger,
  getLogSummary
} = require('./common/utils')

exports.main_handler = async (event, context, callback) => {
  /**
   * parse param from event and process.env
   */
  const { objects, cdnHosts, secretId, secretKey, token } = getParams(event)

  logger({
    title: 'param is parsed success, param as follow: ',
    data: { objects, cdnHosts, event }
  })
  /**
   * init cos instance
   */
  if (!secretId || !secretKey || !token) {
    throw new Error(`secretId, secretKey or token is missing`)
  }

  const cdnSdkInstance = new CdnSdk({ secretId, secretKey, token })
  const cosInstance = new CosSdk({
    SecretId: secretId,
    SecretKey: secretKey,
    XCosSecurityToken: token
  })

  const taskList = objects.map(({ bucket, region, key }) => {
    return new CdnRefreshTask({
      cdnSdkInstance,
      urls: cdnHosts.map(host => {
        return getObjectUrl({
          cosInstance,
          bucket,
          region,
          key,
          origin: `${/^(http\:\/\/|https\:\/\/)/.test(host) ? '' : 'https://'}${host}`
        })
      })
    })
  })

  const taskResults = []
  for (const task of taskList) {
    const results = await task.runPurgeTasks()
    taskResults.push(...results)
  }

  logger({
    title: 'cdn refresh full logs:',
    data: taskResults
  })

  const { status, messages } = getLogSummary(taskResults)

  logger({
    messages: messages.map(item => item.replace(/\,\ /g, '\n'))
  })

  if (status === 'fail') {
    throw messages.join('; ')
  } else {
    return messages.join('; ')
  }
}