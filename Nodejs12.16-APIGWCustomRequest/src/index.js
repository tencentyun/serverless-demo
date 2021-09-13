exports.main_handler = async (event, context) => {
  const response = {}

  // 自定义header处理函数，插件自定义内容未勾选Header时，可删除该函数
  handler_header(event, response)

  // 自定义body处理函数，插件自定义内容未勾选Body时，可删除该函数
  handler_body(event, response)

  // 自定义query处理函数，插件自定义内容未勾选Query时，可删除该函数
  handler_query(event, response)

  return response
}

function handler_header(event, response) {
  const replace_headers = {} // 需要替换或者新增的header
  const remove_headers = [] // 需要删除的header

  const header_parameters = event.headerParameters // 客户端原始请求的header内容
  if (!header_parameters) {
    console.error('Invalid event.headerParameters')
    return
  }

  // 示例：替换或新增 header1
  replace_headers['header1'] = 'header1'

  // 示例：删除 header2
  if (header_parameters['header2']) {
    remove_headers.push('header2')
  }

  // replace_headers 和 remove_headers 至少有一个非空
  if (Object.keys(replace_headers).length < 1 && remove_headers.length < 1) {
    console.error('Invalid custom request headers')
    return
  }
  response['replace_headers'] = replace_headers
  response['remove_headers'] = remove_headers
}

function handler_body(event, response) {
  let replace_body // 替换之后的body内容

  const body = event['body'] // 客户端原始请求的body内容

  // 示例：替换body
  if (body) {
    replace_body = 'hello world'
  }

  // replace_body 必须为字符串类型
  if (typeof replace_body !== 'string') {
    console.error('Invalid custom request body')
    return
  }
  response['replace_body'] = replace_body
}

function handler_query(event, response) {
  const replace_querys = {} // 需要替换或者新增的query
  const remove_querys = [] // 需要删除的query

  const query_parameters = event['queryStringParameters'] // 客户端原始请求的query内容
  if (!query_parameters) {
    console.error('event.queryStringParameters is invalid')
    return
  }

  // 示例：替换或新增 query1
  replace_querys['query1'] = 'query1'

  // 示例：删除原始请求中的 query2
  if (query_parameters['query2']) {
    remove_querys.push('query2')
  }

  // replace_querys 和 remove_querys 至少有一个非空
  if (Object.keys(replace_querys).length < 1 && remove_querys.length < 1) {
    console.log('Invalid custom request querys')
    return
  }

  response['replace_querys'] = replace_querys
  response['remove_querys'] = remove_querys
}
