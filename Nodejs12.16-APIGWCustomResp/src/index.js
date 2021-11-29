exports.main_handler = async (event, context) => {

  // 自定义内容勾选status时必须返回replace_status字段
  const response = {
      "replace_status" : 200 
  }

  // header 参数
  const header_parameters = event.headerParameters // 客户端原始请求的header内容
  if (!header_parameters) {
    console.error('Invalid event.headerParameters')
    return
  }

  // 1. handler_xxx() 为对应的自定义处理函数，response的返回内容都是增量更新
  // 2. 对于每个handler_xxx()，下列情况不会对响应结果进行自定义处理：
  //     （1） 控制台未勾选该自定义内容
  //     （2） 未调用handler_xxx()
  //     （3） response未返回或者返回内容不符合规范

  // 自定义header处理函数，控制台未勾选该自定义内容可删除
  handler_header(event, header_parameters, response)

  // 自定义body处理函数，控制台未勾选该自定义内容可删除
  handler_body(event, header_parameters, response) 

  // 自定义status处理函数，控制台未勾选该自定义内容可删除
  handler_status(event, header_parameters, response)

  return response
}

function handler_header(event, header_parameters, response) {
  const replace_headers = {} // 需要替换或者新增的header
  const remove_headers = [] // 需要删除的header

  // 示例：替换或新增 header1
  replace_headers['header1'] = 'header1'

  // 示例：删除 X-Api-Serviceid
  remove_headers.push('X-Api-Serviceid')

  response["replace_headers"] = replace_headers
  response["remove_headers"] = remove_headers
}

function handler_body(event, header_parameters, response) {
  let replace_body // 替换之后的body内容

  const body = event['body'] // 原始body内容

  // 示例：echo
  if (body) {
    replace_body = body
  }

  // replace_body 必须为字符串类型
  if (typeof replace_body !== 'string') {
    console.error('Invalid replace body')
    return
  }
  response['replace_body'] = replace_body

  // 是否需要对replace_body 进行base64解码
  response["is_base64_encoded"] = header_parameters["is_base64_encoded"]
}

function handler_status(event, header_parameters, response) {
  let status = header_parameters["status"]

  if(status && status != 200) {
    response["replace_status"] = 200
    response["replace_body"] = "custom response, upstream_status is " + status
    response["is_base64_encoded"] = false
  }
}
