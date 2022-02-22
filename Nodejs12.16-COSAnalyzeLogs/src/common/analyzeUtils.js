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
  if (processMap[process]) {
    return processMap[process]({ value });
  }
  throw new Error(`process error: ${process} is not allow`);
}

module.exports = {
  validateAnalyzeConfig,
  fixAnalyzeConfig,
  checkExpression,
  processValue,
};
