exports.main_handler = async (event, context) => {
  const response = {
    'api-auth': true, // 必须返回，表示认证结果
  }

  // 自定义header认证
  header_auth(event, response)

  // 自定义body认证
  body_auth(event, response)

  // 自定义query认证
  query_auth(event, response)

  return response
}

function header_auth(event, response) {
  const header_parameters = event['headerParameters'] // 客户端原始请求的header内容，其中认证参数都被转成了小写
  if (!header_parameters) return

  // 示例：通过 header-auth 进行认证
  if (header_parameters['header-auth'] === 'apigw') {
    response['api-auth'] = false // 未通过认证
  }
}

function body_auth(event, response) {
  const body = event['body'] // 客户端请求的body内容

  // 示例：通过 body 进行认证
  if (!body) {
    response['api-auth'] = false // 未通过认证
  }
}

function query_auth(event, response) {
  const query_parameters = event['queryStringParameters'] // 客户端请求的query内容，其中认证参数都被转成了小写
  if (!query_parameters) return

  // 示例：通过 query-auth 进行认证
  if (query_parameters['query-auth'] === 'apigw') {
    response['api-auth'] = false // 未通过认证
  }
}
