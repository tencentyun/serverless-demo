const { logger } = require("./utils");

class CosTeoPurgeTask {
  constructor({
    teoSdkInstance,
    urls = [],
    zoneId,
    region,
    purgeLimit = 1000,
  }) {
    Object.assign(this, { teoSdkInstance });
    this.purgeTasks = this.getPurgeTasks({
      urls,
      purgeLimit,
      zoneId,
      region,
    });
  }

  getPurgeTasks({ urls = [], zoneId, region, purgeLimit = 1 }) {
    const tempUrls = [...urls],
      purgeTasks = [];
    while (tempUrls.length) {
      purgeTasks.push({
        Targets: tempUrls.splice(0, purgeLimit),
        ZoneId: zoneId,
        EncodeUrl: false,
        Type: "purge_url",
        region,
      });
    }
    return purgeTasks;
  }

  async runPurgeTasks() {
    const results = [];
    for (const params of this.purgeTasks) {
      let result, error;
      try {
        const { region, ...restParams } = params;

        result = await this.teoSdkInstance.requestRetry({
          action: "CreatePurgeTask",
          params: restParams,
          region,
        });
      } catch (err) {
        error = err;
        // if purge multiple urls error, try to purge url one by one
        const { Targets: urls, ZoneId: zoneId } = params;
        if (urls.length > 1) {
          logger({
            title:
              "Purge multiple urls error, try to purge url one by one",
            data: {
              params,
              error,
            },
          });
          const purgeTasks = this.getPurgeTasks({ urls, zoneId });
          this.purgeTasks.push(...purgeTasks);
          continue;
        }
      }
      results.push({ params, result, error });
    }
    this.purgeTaskResults = results;
    return results;
  }
}

module.exports = CosTeoPurgeTask;
