/* eslint-disable no-param-reassign */
/* eslint-disable no-new-func */
const { forbidRuleList, expressionList, processList } = require('./constant');

const expressionMap = expressionList.reduce((res, { names, exec }) => {
  for (const name of names) {
    res[name] = exec;
  }
  return res;
}, {});

const processMap = processList.reduce((res, { names, exec }) => {
  for (const name of names) {
    res[name] = exec;
  }
  return res;
}, {});

function validateAnalyzeConfig(analyzeConfig) {
  const forbid = forbidRuleList.find(({ exec }) => exec(analyzeConfig));
  if (forbid) {
    throw new Error(`analyzeConfig error: ${forbid.rule}`);
  }
}

function fixAnalyzeConfig({
  columns,
  where,
  groupBy,
  select,
  having,
  targetSetHeader = true,
  ...args
}) {
  if (where && where instanceof Array) {
    where = {
      expression: 'and',
      params: where,
    };
  }
  if (having && having instanceof Array) {
    having = {
      expression: 'and',
      params: having,
    };
  }
  select = select || columns || [];
  const hasCalculateKey = select.some(({ calculate }) => Boolean(calculate));
  if (hasCalculateKey && !groupBy) {
    groupBy = [{ key: '*' }];
  }
  select = select.map(({ key, calculate, label, ...args }) => ({
    key,
    ...(calculate ? { calculate } : {}),
    label: label || (calculate ? `${calculate}(${key})` : key),
    ...args,
  }));
  return {
    columns,
    where,
    groupBy,
    select,
    having,
    targetSetHeader,
    ...args,
  };
}

function checkExpression({ value, params, expression }) {
  if (expressionMap[expression]) {
    return expressionMap[expression]({ value, params });
  }
  throw new Error(`expression error: ${expression} is not allow`);
}

function processValue({ value, process }) {
  let name = process;
  let params = {};
  if (typeof process !== 'string') {
    name = process.name;
    params = process.params || [];
  }
  if (processMap[name]) {
    return processMap[name]({ value, params });
  }
  if (String.prototype[name] && typeof value === 'string') {
    if (String.prototype[name] instanceof Function) {
      return value[name](...params);
    }
    return value[name];
  }
  if (Array.prototype[name] && value instanceof Array) {
    if (Array.prototype[name] instanceof Function) {
      return value[name](...params);
    }
    return value[name];
  }
  throw new Error(`process error: ${name} is not allow`);
}

function formatValue({ value, format }) {
  let name = format;
  let params = {};
  if (typeof format !== 'string') {
    name = format.name;
    params = format.params || [];
  }
  if (processMap[name]) {
    return processMap[name]({ value, params });
  }
  if (String.prototype[name] && typeof value === 'string') {
    if (String.prototype[name] instanceof Function) {
      return value[name](...params);
    }
    return value[name];
  }
  if (Array.prototype[name] && value instanceof Array) {
    if (Array.prototype[name] instanceof Function) {
      return value[name](...params);
    }
    return value[name];
  }
  throw new Error(`format error: ${name} is not allow`);
}

const moduleExports = {
  validateAnalyzeConfig,
  fixAnalyzeConfig,
  checkExpression,
  processValue,
  formatValue,
};

module.exports = Object.keys(moduleExports).reduce((res, key) => {
  const func = moduleExports[key];
  res[key] = (params, ...args) => {
    try {
      return func(params, ...args);
    } catch (error) {
      throw {
        params,
        error,
      };
    }
  };
  return res;
}, {});
