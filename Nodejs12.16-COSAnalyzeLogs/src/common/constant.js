/* eslint-disable arrow-body-style */

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
  ],
  processList: [
    {
      exec: ({ value }) => Number(value),
      names: ['Number(value)', 'toNumber'],
    },
    {
      exec: ({ value }) => new Date(value).getTime(),
      names: ['(new Date(value)).getTime()', 'toUnix'],
    },
    {
      exec: ({ value }) => value.replace(/"/g, ''),
      names: ['value.replace(/"/g, "")', 'removeDoubleQuotes'],
    },
    {
      exec: ({ value }) => decodeURIComponent(value),
      names: ['decodeURIComponent(value)', 'decodeURIComponent'],
    },
  ],
};
