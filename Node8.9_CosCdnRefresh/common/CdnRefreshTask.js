const { logger } = require('./utils')

class CdnRefreshTask {
  constructor({
    cdnSdkInstance,
    urls = [],
    purgeLimit = 1000
  }) {
    Object.assign(this, { cdnSdkInstance })
    this.purgeTasks = this.getPurgeTasks({ urls, purgeLimit })
  }
  getPurgeTasks({ urls = [], purgeLimit = 1 }) {
    const tempUrls = [...urls], purgeTasks = []
    while (tempUrls.length) {
      purgeTasks.push({
        Urls: tempUrls.splice(0, purgeLimit)
      })
    }
    return purgeTasks
  }
  async runPurgeTasks() {
    const results = []
    for (const params of this.purgeTasks) {
      let result, error
      try {
        result = await this.cdnSdkInstance.requestRetry({ action: 'PurgeUrlsCache', params })
      } catch (err) {
        error = err
        // if purge multiple urls cache error, try to purge url cache one by one
        const { Urls: urls } = params
        if (urls.length > 1) {
          logger({
            title: 'Purge multiple urls cache error, try to purge url cache one by one',
            data: {
              params,
              error
            }
          })
          const purgeTasks = this.getPurgeTasks({ urls })
          this.purgeTasks.push(...purgeTasks)
          continue
        }
      }
      results.push({ params, result, error })
    }
    this.purgeTaskResults = results
    return results
  }
}

module.exports = CdnRefreshTask