const {
  cdn: {
    v20180606: {
      Client: CdnClient,
      Models: CdnModels
    }
  },
  common: {
    Credential
  }
} = require('tencentcloud-sdk-nodejs')

const { sleep, getMatchNumber, logger } = require('./utils')

class CdnSdk {
  constructor({ secretId, secretKey, token }) {
    this.credential = new Credential(secretId, secretKey, token)
  }
  request({ action, params = {} }) {
    return new Promise((resolve, reject) => {
      const client = new CdnClient(this.credential)
      const req = new CdnModels[`${action}Request`]()
      Object.assign(req, params)
      client[action](req, (err, response) => {
        if (err) {
          return reject(err)
        }
        resolve(response)
      })
    })
  }
  async requestRetry({
    maxTryTime = 3,
    ...args
  }) {
    let error
    for (let i = 0; i < maxTryTime; i++) {
      try {
        const res = await this.request(args)
        return res
      } catch (err) {
        error = err
        if (i < maxTryTime - 1) {
          const duration = this.getDuration(err)
          await sleep(duration)
        }
      }
    }
    throw error
  }
  getDuration(error) {
    try {
      const { code, message } = error
      if (code === 'RequestLimitExceeded' && message.includes('Your current request times equals')) {
        const qps = getMatchNumber(message, /Your current request times equals to \`[0-9]+\` in a second/)
        const limit = getMatchNumber(message, /which exceeds the frequency limit \`[0-9]+\` for a second/)
        if (qps > limit) {
          const duration = (qps - limit) * 400 + 1000
          logger({
            title: 'qps exceeds the frequency limit',
            data: {
              qps,
              limit,
              duration
            }
          })
          return duration
        }
      }
    } catch (err) {
    }
    return 1000
  }
}

module.exports = CdnSdk