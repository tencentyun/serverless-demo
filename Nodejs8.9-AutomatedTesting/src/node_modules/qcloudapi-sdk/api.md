## Classes

<dl>
<dt><a href="#QcloudApi">QcloudApi</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#requestCallback">requestCallback</a> : <code>function</code></dt>
<dd><p><code>.request</code> 的请求回调</p>
</dd>
</dl>

<a name="QcloudApi"></a>

## QcloudApi
**Kind**: global class  

* [QcloudApi](#QcloudApi)
    * [new QcloudApi([defaults])](#new_QcloudApi_new)
    * [.generateUrl(opts)](#QcloudApi+generateUrl) ⇒ <code>string</code>
    * [.generateQueryString(data, [opts])](#QcloudApi+generateQueryString) ⇒ <code>string</code>
    * [.request(data, [opts], callback, [extra])](#QcloudApi+request)
    * [.sign(str, secretKey)](#QcloudApi+sign) ⇒ <code>String</code>

<a name="new_QcloudApi_new"></a>

### new QcloudApi([defaults])
API 构造函数


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [defaults] | <code>Object</code> |  | 默认参数及配置 |
| defaults.serviceType | <code>String</code> |  | 服务类型. 如: cvm, vpc, dfw, lb 等. 根据 `serviceType` 和 `baseHost` 将拼装成请求域名, 如: `vpc.api.qcloud.com` |
| defaults.path | <code>String</code> | <code>&#x27;/v2/index.php&#x27;</code> | Api 请求路径 |
| defaults.method | <code>String</code> | <code>&#x27;POST&#x27;</code> | 请求方法 |
| defaults.baseHost | <code>String</code> | <code>&#x27;api.qcloud.com&#x27;</code> | Api 的基础域名. 与 `serviceType` 拼装成请求域名. |
| defaults.SecretId | <code>String</code> |  | secretId |
| defaults.SecretKey | <code>String</code> |  | secretKey |

<a name="QcloudApi+generateUrl"></a>

### qcloudApi.generateUrl(opts) ⇒ <code>string</code>
生成 API 的请求地址

**Kind**: instance method of <code>[QcloudApi](#QcloudApi)</code>  

| Param | Type |
| --- | --- |
| opts | <code>Object</code> | 

<a name="QcloudApi+generateQueryString"></a>

### qcloudApi.generateQueryString(data, [opts]) ⇒ <code>string</code>
生成请求参数.

**Kind**: instance method of <code>[QcloudApi](#QcloudApi)</code>  
**Returns**: <code>string</code> - 包括签名的参数字符串  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | 该次请求的参数. 同 `request` 方法的 `data` 参数 |
| [opts] | <code>Object</code> | 请求配置. 同 `request` 方法的 `opts` 参数 |

<a name="QcloudApi+request"></a>

### qcloudApi.request(data, [opts], callback, [extra])
请求 API

**Kind**: instance method of <code>[QcloudApi](#QcloudApi)</code>  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | 该次请求的参数. |
| [data.SecretId] | <code>Object</code> | Api SecrectId, 通过 `data` 参数传入时将覆盖 `opt` 传入及默认的 `secretId` |
| [opts] | <code>Object</code> | 请求配置. 配置里的参数缺省使用默认配置 (`this.defaults`) 里的对应项 |
| opts.host | <code>String</code> | 该次请求使用的 API host. 当传入该参数的时候, 将忽略 `serviceType` 及默认 `host` |
| callback | <code>[requestCallback](#requestCallback)</code> | 请求回调 |
| [extra] | <code>Object</code> | 传给 request 库的额外参数 |

<a name="QcloudApi+sign"></a>

### qcloudApi.sign(str, secretKey) ⇒ <code>String</code>
生成签名

**Kind**: instance method of <code>[QcloudApi](#QcloudApi)</code>  
**Returns**: <code>String</code> - 签名  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | 需签名的参数串 |
| secretKey | <code>String</code> |  |

<a name="requestCallback"></a>

## requestCallback : <code>function</code>
`.request` 的请求回调

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | 请求错误 |
| body | <code>Object</code> | API 请求结果 |

