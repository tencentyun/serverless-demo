// src/telemetry/utils.ts
import chalk from "chalk";
function flattenObject(obj, parentKey = "", res = {}) {
  for (let key in obj) {
    const propName = parentKey ? `${parentKey}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}
function printSecurityNotice(advisory) {
  const severityColor = {
    low: chalk.blue,
    medium: chalk.yellow,
    high: chalk.red
  }[advisory.severity.toLowerCase()] || chalk.white;
  console.log();
  console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501 ${chalk.bold(`CopilotKit`)} \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
  console.log();
  console.log(`${chalk.bold(`Severity: ${severityColor(advisory.severity.toUpperCase())}`)}`);
  console.log();
  console.log(`${chalk.bold(advisory.message)}`);
  console.log();
  console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
}

export {
  flattenObject,
  printSecurityNotice
};
//# sourceMappingURL=chunk-6QGXWNS5.mjs.map