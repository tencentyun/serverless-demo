const { logger } = require("./utils");

class CosTeoPrefetchTask {
  constructor({
    teoSdkInstance,
    urls = [],
    zoneId,
    region,
    prefetchLimit = 1000,
  }) {
    Object.assign(this, { teoSdkInstance });
    this.prefetchTasks = this.getPrefetchTasks({
      urls,
      prefetchLimit,
      zoneId,
      region,
    });
  }

  getPrefetchTasks({ urls = [], zoneId, region, prefetchLimit = 1 }) {
    const tempUrls = [...urls],
      prefetchTasks = [];
    while (tempUrls.length) {
      prefetchTasks.push({
        Targets: tempUrls.splice(0, prefetchLimit),
        ZoneId: zoneId,
        EncodeUrl: true,
        region,
      });
    }
    return prefetchTasks;
  }

  async runPrefetchTasks() {
    const results = [];
    for (const params of this.prefetchTasks) {
      let result, error;
      try {
        const { region, ...restParams } = params;

        result = await this.teoSdkInstance.requestRetry({
          action: "CreatePrefetchTask",
          params: restParams,
          region,
        });
      } catch (err) {
        error = err;
        // if prefetch multiple urls error, try to prefetch url one by one
        const { Targets: urls, ZoneId: zoneId } = params;
        if (urls.length > 1) {
          logger({
            title:
              "Prefetch multiple urls error, try to prefetch url one by one",
            data: {
              params,
              error,
            },
          });
          const prefetchTasks = this.getPrefetchTasks({ urls, zoneId });
          this.prefetchTasks.push(...prefetchTasks);
          continue;
        }
      }
      results.push({ params, result, error });
    }
    this.prefetchTaskResults = results;
    return results;
  }
}

module.exports = CosTeoPrefetchTask;
