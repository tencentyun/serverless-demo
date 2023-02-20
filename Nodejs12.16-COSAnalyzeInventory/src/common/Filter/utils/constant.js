/* eslint-disable no-undef */
/* eslint-disable arrow-body-style */
const REG_EXP_MAP = {};

module.exports = {
  forbidRuleList: [
    {
      rule: '"columns" "colDelimiter" "rowDelimiter" is required',
      exec: ({ columns, colDelimiter, rowDelimiter }) => {
        return [columns, colDelimiter, rowDelimiter].some(item => item === undefined || item === null);
      },
    },
    {
      rule: '"columns" can not has key "*"',
      exec: ({ columns }) => columns.some(({ key }) => key === '*'),
    },
    {
      rule: 'can not set "groupBy" or "orderBy" without "limit"',
      exec: ({ groupBy, orderBy, limit }) => (groupBy || orderBy) && !limit,
    },
    {
      rule: 'can not set "having" without "groupBy"',
      exec: ({ groupBy, having }) => !groupBy && having,
    },
  ],
  expressionList: [
    {
      exec: ({ value, params }) => value === params[0],
      names: ['value === params[0]', '=', '==='],
    },
    {
      exec: ({ value, params }) => value !== params[0],
      names: ['value !== params[0]', '!==', '!='],
    },
    {
      exec: ({ value, params }) => value >= params[0],
      names: ['value >= params[0]', '>='],
    },
    {
      exec: ({ value, params }) => value > params[0],
      names: ['value > params[0]', '>'],
    },
    {
      exec: ({ value, params }) => value <= params[0],
      names: ['value <= params[0]', '<='],
    },
    {
      exec: ({ value, params }) => value < params[0],
      names: ['value < params[0]', '<'],
    },
    {
      exec: ({ value, params }) => value >= params[0] && value <= params[1],
      names: [
        'value >= params[0] && value <= params[1]',
        '[$0,$1]',
        'range[$0,$1]',
      ],
    },
    {
      exec: ({ value, params }) => value >= params[0] && value < params[1],
      names: [
        'value >= params[0] && value < params[1]',
        '[$0,$1)',
        'range[$0,$1)',
      ],
    },
    {
      exec: ({ value, params }) => value > params[0] && value < params[1],
      names: [
        'value > params[0] && value < params[1]',
        '($0,$1)',
        'range($0,$1)',
      ],
    },
    {
      exec: ({ value, params }) => value > params[0] && value <= params[1],
      names: [
        'value > params[0] && value <= params[1]',
        '($0,$1]',
        'range($0,$1]',
      ],
    },
    {
      exec: ({ value, params }) => params.some(item => value === item),
      names: ['params.some(item => value === item)', 'hasEqual'],
    },
    {
      exec: ({ value, params }) => params.some(item => value.includes(item)),
      names: ['params.some(item => value.includes(item))', 'hasIncludes'],
    },
    {
      exec: ({ value, params }) => params.some(item => !value.includes(item)),
      names: ['params.some(item => !value.includes(item))', 'hasNotIncludes'],
    },
    {
      exec: ({ value, params }) => params.some(item => value.startsWith(item)),
      names: ['params.some(item => value.startsWith(item))', 'hasStartsWith'],
    },
    {
      exec: ({ value, params }) => params.some(item => value.endsWith(item)),
      names: ['params.some(item => value.endsWith(item))', 'hasEndsWith'],
    },
    {
      exec: ({ value, params }) => {
        const pattern = `^${params[0].replace(/\*/g, '[\\s\\S]*')}$`;
        if (!REG_EXP_MAP[pattern]) {
          REG_EXP_MAP[pattern] = new RegExp(pattern);
        }
        return REG_EXP_MAP[pattern].test(`${value}`);
      },
      names: ['matchPattern(value)', 'matchPattern'],
    },
  ],
  processList: [
    {
      exec: ({ value }) => Number(value),
      names: ['Number(value)', 'toNumber'],
    },
    {
      exec: ({ value }) => BigInt(value),
      names: ['BigInt(value)', 'toBigInt'],
    },
    {
      exec: ({ value }) => {
        const number = Number(value);
        if (number <= Number.MAX_SAFE_INTEGER) {
          return number;
        }
        return BigInt(value);
      },
      names: ['Integer(value)', 'toInteger'],
    },
    {
      exec: ({ value }) => new Date(value).getTime(),
      names: ['(new Date(value)).getTime()', 'toUnix'],
    },
    {
      exec: ({ value }) => value.replace(/^"|"$/g, ''),
      names: ['value.replace(/^"|"$/g, "")', 'removeDoubleQuotes'],
    },
    {
      exec: ({ value }) => {
        value = `${value}`;
        return `${value.startsWith('"') ? '' : '"'}${value}${
          value.endsWith('"') ? '' : '"'
        }`;
      },
      names: ['addDoubleQuotes'],
    },
    {
      exec: ({ value }) => decodeURIComponent(value),
      names: ['decodeURIComponent(value)', 'decodeURIComponent'],
    },
    {
      exec: ({ value }) => Math.max(value.split('/').length - 1, 0),
      names: ['getPrefixDepth(value)', 'getPrefixDepth'],
    },
    {
      exec: ({ value }) => {
        const hasDoubleQuotes =          value.startsWith('"') && value.endsWith('"') && value.length >= 2;
        if (hasDoubleQuotes) {
          value = value.slice(1, -1);
        }
        const fileName = value.split('/').pop();
        if (fileName.includes('.')) {
          if (hasDoubleQuotes) {
            return `".${fileName.split('.').pop()}"`;
          }
          return `.${fileName.split('.').pop()}`;
        }
        if (hasDoubleQuotes) {
          return '""';
        }
        return '';
      },
      names: ['getSuffix(value)', 'getSuffix'],
    },
    {
      exec: ({ value, params }) => params.indexOf(value),
      names: ['indexOf(value)', 'indexOf'],
    },
    {
      exec: ({ value }) => `${value}`.length,
      names: ['getLength(value)', 'getLength'],
    },
    {
      exec: ({ value, params }) => value + params[0],
      names: ['value + params[0]', '+'],
    },
    {
      exec: ({ value, params }) => value - params[0],
      names: ['value - params[0]', '-'],
    },
    {
      exec: ({ value, params }) => value * params[0],
      names: ['value * params[0]', '*'],
    },
    {
      exec: ({ value, params }) => value / params[0],
      names: ['value / params[0]', '/'],
    },
    {
      exec: ({ value, params }) => value.toFixed(params[0]),
      names: ['value.toFixed(params[0])', 'toFixed'],
    },
  ],
};
