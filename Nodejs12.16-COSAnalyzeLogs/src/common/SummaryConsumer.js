/* eslint-disable no-param-reassign */

class SummaryConsumer {
  constructor({
    select,
    groupBy,
    having,
    orderBy,
    limit,
    processValue = ({ value }) => value,
    getFilterResults = ({ list }) => list,
  }) {
    const maxSummaryKeyCount = Math.max(100000, (limit || 0) * 10);
    Object.assign(this, {
      select,
      groupBy,
      having,
      orderBy,
      limit,
      processValue,
      getFilterResults,
      uuidKey: null,
      uuidIndex: 0,
      calculateKeyMarker: null,
      summaryCache: {},
      summaryKeyCount: 0,
      maxSummaryKeyCount,
      truncateSummaryKeyCount: Math.floor(maxSummaryKeyCount / 10),
    });
  }
  addUUID(item) {
    if (!this.uuidKey) {
      this.uuidKey = this.getCalculateKey({ key: '*', calculate: 'uuid' });
    }
    this.uuidIndex += 1;
    return Object.assign(item, {
      [this.uuidKey]: this.uuidIndex,
    });
  }
  getCalculateKey({ key, calculate }) {
    if (!this.calculateKeyMarker) {
      this.calculateKeyMarker = this.select.map(item => item.key).join('');
    }
    return `${calculate}(${key})_${this.calculateKeyMarker}`;
  }
  getSummaryKey(item) {
    let { groupBy } = this;
    /**
     * if groupBy is not set, we can assume that each item is groupBy an uuid
     */
    if (!groupBy) {
      groupBy = [{ key: this.uuidKey }];
    }
    /**
     * if groupBy is [{ key: '*' }], we can assume that all items is in the same group
     */
    if (
      groupBy
      && groupBy.length === 1
      && groupBy[0]
      && groupBy[0].key === '*'
    ) {
      return JSON.stringify({});
    }
    const groupByKey = groupBy.reduce((res, { key }) => {
      res[key] = item[key];
      return res;
    }, {});
    return JSON.stringify(groupByKey);
  }
  getSummaryValue({ lastSummaryValue, currentValue }) {
    const { select } = this;
    const normalColumns = select.filter(({ calculate }) => !calculate);
    const calculateColumns = select.filter(({ calculate }) => calculate && calculate !== 'count');
    const countKey = this.getCalculateKey({ key: '*', calculate: 'count' });
    const lastCountValue =      lastSummaryValue && lastSummaryValue[countKey]
      ? lastSummaryValue[countKey]
      : 0;
    const normalValue = normalColumns.reduce((res, { key }) => {
      res[key] = currentValue[key];
      return res;
    }, {});
    const calculateValue = calculateColumns.reduce(
      (res, { key, process = [] }) => {
        /**
         * the value of calculate key must be processed before calculate
         */
        const value = this.processValue({
          value: currentValue[key],
          process: [...(process || []), 'toNumber'],
        });
        if (isNaN(value)) {
          throw new Error(`calculate error, value is not a number, key: ${key}, value: ${currentValue[key]}`);
        }
        const maxKey = this.getCalculateKey({ key, calculate: 'max' });
        const minKey = this.getCalculateKey({ key, calculate: 'min' });
        const sumKey = this.getCalculateKey({ key, calculate: 'sum' });
        if (lastSummaryValue) {
          res[maxKey] = Math.max(lastSummaryValue[maxKey], value);
          res[minKey] = Math.min(lastSummaryValue[minKey], value);
          res[sumKey] = lastSummaryValue[sumKey] + value;
        } else {
          res[maxKey] = value;
          res[minKey] = value;
          res[sumKey] = value;
        }
        return res;
      },
      {
        [countKey]: lastCountValue + 1,
      },
    );
    return {
      ...normalValue,
      ...calculateValue,
    };
  }
  getSummaryList() {
    const { select } = this;
    const calculateColumns = select.filter(({ calculate }) => calculate && calculate !== 'count');
    const list = Object.keys(this.summaryCache).map((summaryKey) => {
      const summaryValue = this.summaryCache[summaryKey];
      const averageValue = calculateColumns.reduce((res, { key }) => {
        const averageKey = this.getCalculateKey({ key, calculate: 'average' });
        const sumKey = this.getCalculateKey({ key, calculate: 'sum' });
        const countKey = this.getCalculateKey({ key: '*', calculate: 'count' });
        res[averageKey] =          Math.round((summaryValue[sumKey] / summaryValue[countKey]) * 100)
          / 100;
        return res;
      }, {});
      return {
        ...summaryValue,
        ...averageValue,
        ...JSON.parse(summaryKey),
      };
    });
    if (this.orderBy) {
      list.sort((...args) => this.sortCompare(...args));
    }
    return list;
  }
  sortCompare(item1, item2) {
    const { orderBy } = this;
    for (const { key, calculate, sort, ...args } of orderBy) {
      const realKey = calculate
        ? this.getCalculateKey({ key, calculate })
        : key;
      const value1 = this.processValue({ ...args, value: item1[realKey] });
      const value2 = this.processValue({ ...args, value: item2[realKey] });
      if (value1 === value2) {
        continue;
      } else {
        return (value1 < value2 ? -1 : 1) * (sort === 'desc' ? -1 : 1);
      }
    }
    return 0;
  }
  updateSummary(item) {
    const summaryKey = this.getSummaryKey(item);
    const lastSummaryValue = this.summaryCache[summaryKey];
    this.summaryCache[summaryKey] = this.getSummaryValue({
      lastSummaryValue,
      currentValue: item,
    });
    if (!lastSummaryValue) {
      this.updateSummaryCount();
    }
  }
  updateSummaryCount() {
    this.summaryKeyCount += 1;
    if (this.summaryKeyCount > this.maxSummaryKeyCount) {
      const list = this.getSummaryList().slice(0, this.truncateSummaryKeyCount);
      this.summaryCache = {};
      for (const item of list) {
        const summaryKey = this.getSummaryKey(item);
        this.summaryCache[summaryKey] = item;
      }
      this.summaryKeyCount = Object.keys(this.summaryCache).length;
    }
  }
  initCalculateKey(config) {
    if (typeof config !== 'object') {
      return config;
    }
    if (config instanceof Array) {
      return config.map(item => this.initCalculateKey(item));
    }
    const keys = Object.keys(config);
    if (keys.includes('calculate')) {
      /**
       * if config has calculate property, do not exec process
       * because the value of this key has been processed
       */
      const { key, calculate, process, ...args } = config;
      return {
        ...args,
        key: this.getCalculateKey({ key, calculate }),
      };
    }
    return Object.keys(config).reduce((res, key) => {
      res[key] = this.initCalculateKey(config[key]);
      return res;
    }, {});
  }
  consume({ list }) {
    for (const item of list) {
      this.updateSummary(this.addUUID(item));
    }
  }
  getResult() {
    let list = this.getSummaryList();
    if (this.having) {
      const havingFilter = this.initCalculateKey(this.having);
      list = this.getFilterResults({
        filter: havingFilter,
        list,
      });
    }
    const columns = this.initCalculateKey(this.select);
    return {
      columns,
      list: list.slice(0, this.limit || list.length),
    };
  }
}

module.exports = SummaryConsumer;
