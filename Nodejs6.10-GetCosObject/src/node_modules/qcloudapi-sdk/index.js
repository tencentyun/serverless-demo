var request = require('request')
var assign = require('object-assign')

var qs = require('querystring')
var dotQs = require('dot-qs')
var crypto = require('crypto')

var packageJSON = require('./package.json')

var baseHost = 'api.qcloud.com'

/**
 * API 构造函数
 * @param {Object} [defaults] 默认参数及配置
 * @param {String} defaults.serviceType 服务类型. 如: cvm, vpc, dfw, lb 等. 根据 `serviceType` 和 `baseHost` 将拼装成请求域名, 如: `vpc.api.qcloud.com`
 * @param {String} defaults.path='/v2/index.php' Api 请求路径
 * @param {String} defaults.method='POST' 请求方法
 * @param {String} defaults.baseHost='api.qcloud.com' Api 的基础域名. 与 `serviceType` 拼装成请求域名.
 * @param {String} defaults.SecretId secretId
 * @param {String} defaults.SecretKey secretKey
 * @param {String} defaults.signatureMethod 签名方法，默认sha1
 * @constructor
 */
var QcloudApi = function(defaults) {
  this.defaults = assign(
    {
      path: '/v2/index.php',
      method: 'POST',
      protocol: 'https',
      baseHost: baseHost,
      signatureMethod: 'sha1'
    },
    defaults
  )
}

/**
 * 生成 API 的请求地址
 * @param {Object} opts
 * @returns {string}
 */
QcloudApi.prototype.generateUrl = function(opts) {
  opts = opts || {}
  var host = this._getHost(opts)
  var path = opts.path === undefined ? this.defaults.path : opts.path

  return (opts.protocol || this.defaults.protocol) + '://' + host + path
}

/**
 * 生成请求参数.
 * @param {Object} data 该次请求的参数. 同 `request` 方法的 `data` 参数
 * @param {Object} [opts] 请求配置. 同 `request` 方法的 `opts` 参数
 * @returns {string} 包括签名的参数字符串
 */
QcloudApi.prototype.generateQueryString = function(data, opts) {
  opts = opts || this.defaults

  var defaults = this.defaults

  //附上公共参数
  var param = assign(
    {
      Region: this.defaults.Region,
      SecretId: opts.SecretId || this.defaults.SecretId,
      Timestamp: Math.round(Date.now() / 1000),
      Nonce: Math.round(Math.random() * 65535),
      RequestClient: 'SDK_NODEJS_' + packageJSON.version //非必须, sdk 标记
    },
    data
  )

  // 初始化配置和传入的参数冲突时，以传入的参数为准
  var isSha256 =
    defaults.signatureMethod === 'sha256' || opts.signatureMethod === 'sha256'
  if (isSha256 && !data.SignatureMethod) param.SignatureMethod = 'HmacSHA256'

  var isAPIv3 = !!data.Version

  param = dotQs.flatten(param)

  var keys = Object.keys(param)
  var qstr = '',
    signStr

  var host = this._getHost(opts)
  var method = (opts.method || defaults.method).toUpperCase()
  var path = opts.path === undefined ? defaults.path : opts.path

  keys.sort()

  //拼接 querystring, 注意这里拼接的参数要和下面 `qs.stringify` 里的参数一致
  //暂不支持纯数字键值及空字符串键值
  keys.forEach(function(key) {
    var val = param[key]
    // 排除上传文件的参数
    // modify 2018-10-25 云APIv3调用不排除‘@’字符开头的参数
    if (!isAPIv3 && method === 'POST' && val && val[0] === '@') {
      return
    }
    if (key === '') {
      return
    }
    if (
      val === undefined ||
      val === null ||
      (typeof val === 'number' && isNaN(val))
    ) {
      val = ''
    }
    //把参数中的 "_" (除开开头)替换成 "."
    qstr += '&' + (key.indexOf('_') ? key.replace(/_/g, '.') : key) + '=' + val
  })

  qstr = qstr.slice(1)

  let hashResult // 16进制负载hash值
  if (
    opts.signatureMethod === 'sha256' &&
    data.SignatureMethod === 'TC2-HmacSHA256'
  ) {
    hashResult = crypto
      .createHash(opts.signatureMethod)
      .update(qstr)
      .digest('hex')
    qstr = '\n' + hashResult
  }

  signStr = this.sign(
    method + host + path + '?' + qstr,
    opts.SecretKey || defaults.SecretKey,
    opts.signatureMethod || defaults.signatureMethod
  )

  param.Signature = signStr

  return qs.stringify(param)
}

/**
 * 请求 API
 * @param {Object} data 该次请求的参数.
 * @param {Object} [data.SecretId] Api SecrectId, 通过 `data` 参数传入时将覆盖 `opt` 传入及默认的 `secretId`
 * @param {Object} [opts] 请求配置. 配置里的参数缺省使用默认配置 (`this.defaults`) 里的对应项
 * @param {String} opts.host 该次请求使用的 API host. 当传入该参数的时候, 将忽略 `serviceType` 及默认 `host`
 * @param {requestCallback} callback 请求回调
 * @param {Object} [extra] 传给 request 库的额外参数
 */
QcloudApi.prototype.request = function(data, opts, callback, extra) {
  if (typeof opts === 'function') {
    callback = opts
    opts = this.defaults
  }
  opts = opts || this.defaults
  callback = callback || Function.prototype

  var url = this.generateUrl(opts)
  var method = (opts.method || this.defaults.method).toUpperCase()
  var dataStr = this.generateQueryString(data, opts)
  var option = { url: url, method: method, json: true, strictSSL: false }
  var maxKeys =
    opts.maxKeys === undefined ? this.defaults.maxKeys : opts.maxKeys

  if (method === 'POST') {
    option.form = qs.parse(dataStr, null, null, {
      maxKeys: maxKeys
    })
  } else {
    option.url += '?' + dataStr
  }

  assign(option, extra)

  request(option, function(error, response, body) {
    /**
     * `.request` 的请求回调
     * @callback requestCallback
     * @param {Error} error 请求错误
     * @param {Object} body API 请求结果
     */
    callback(error, body)
  })
}

/**
 * 生成签名
 * @param {String} str 需签名的参数串
 * @param {String} secretKey
 * @param {String} signatureMethod 签名方法，默认sha1
 * @returns {String} 签名
 */
QcloudApi.prototype.sign = function(str, secretKey, signatureMethod = 'sha1') {
  var hmac = crypto.createHmac(signatureMethod, secretKey || '')
  return hmac.update(new Buffer(str, 'utf8')).digest('base64')
}

/**
 * 获取 API host
 * @param opts 请求配置
 * @param {String} [opts.serviceType] 服务类型. 如: cvm, vpc, dfw, lb 等
 * @param {String} [opts.host] 如果配置中直接传入 host, 则直接返回该 host
 * @returns {String}
 * @private
 */
QcloudApi.prototype._getHost = function(opts) {
  var host = opts.host
  if (!host) {
    host =
      (opts.serviceType || this.defaults.serviceType) +
      '.' +
      (opts.baseHost || this.defaults.baseHost)
  }
  return host
}

module.exports = QcloudApi
