var assert = require('assert')
var Capi = require('../')
var config = require('./config.json')
var mock = require('./mock')

var capi = new Capi({
  SecretId: config.SecretId,
  SecretKey: config.SecretKey,
  serviceType: 'account'
})

capi.request(
  {
    Region: 'gz',
    Action: 'DescribeProject'
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

//额外参数.
//utf8 参数
//特殊参数
capi.request(
  {
    Region: 'gz',
    Action: 'DescribeProject',
    test: '中文',
    test_1: 'test_1',
    test_2: '@test2',
    undefined: undefined,
    null: null,
    false: false,
    number: 0,
    '1.1': 1,
    '1a': '1a',
    _1_a_: '_1_a_',
    empty: '',
    NaN: NaN

    //暂不支持纯数字键值及空字符串键值
    //1: 1,
    //'':''
  },
  function(error, data) {
    //console.log(data)
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

// //写操作
// capi.request({
//   Region: 'gz',
//   Action: 'AddProject',
//   projectName: '测试项目2',
//   projectDesc: '测试项目2',
// }, function(error, data) {
//   console.log(error)
//   console.log(data)
// })

//get 方法
capi.request(
  {
    Region: 'gz',
    Action: 'DescribeInstances'
  },
  {
    serviceType: 'cvm',
    method: 'get'
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

capi.request(
  {
    Region: 'gz',
    Action: 'DescribeProject',
    miss: undefined
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

//错误地域
capi.request(
  {
    Region: 'unkown',
    Action: 'DescribeInstances'
  },
  {
    serviceType: 'cvm',
    method: 'get'
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 4000)
  }
)

// 错误的serviceType
// qcloud 云api 支持泛解析
capi.request(
  {
    Region: 'unkown',
    Action: 'DescribeInstances'
  },
  {
    serviceType: 'unkown'
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 4000)
  }
)

var arr = []
var i = 0,
  length = 50000

while (i < length) {
  arr.push(i)
  i++
}

// 参数超长
capi.request(
  {
    Action: 'DescribeInstances',
    Region: 'gz',
    arr: arr
  },
  {
    serviceType: 'cvm'
  },
  function(error, data) {
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 4100)
  }
)

// 超长参数
capi.request(
  {
    Action: 'DescribeInstances',
    Region: 'gz',
    arr: arr
  },
  {
    serviceType: 'cvm',
    maxKeys: 0
  },
  function(error, data) {
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

// 支持sha256签名算法
capi.request(
  {
    Region: 'gz',
    Action: 'CreateFunction',
    ...mock.scf
  },
  {
    serviceType: 'scf',
    method: 'post',
    signatureMethod: 'sha256'
  },
  function(error, data) {
    console.log(error, data)
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.code, 0)
  }
)

// 支持腾讯云 API 3.0的请求
var capiv3 = new Capi({
  SecretId: config.SecretId,
  SecretKey: config.SecretKey,
  baseHost: 'tencentcloudapi.com',
  path: '/'
})

capiv3.request(
  {
    Region: 'ap-guangzhou',
    Action: 'DescribeInstances',
    Version: '2017-03-12'
  },
  {
    serviceType: 'cvm',
    method: 'post'
  },
  function(error, data) {
    assert.equal(error, null)
    assert.equal(typeof data, 'object')
    assert.equal(data.Response.Error, null)
  }
)
