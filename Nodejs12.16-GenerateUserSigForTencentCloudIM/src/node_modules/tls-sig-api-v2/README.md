## npm 集成
```shell 
npm i tls-sig-api-v2
```

## 源码集成
将文件 `TLSSigAPIv2.js` 放置于需要的路径下即可。

## 接口调用
```javascript
var TLSSigAPIv2 = require('tls-sig-api-v2');
// var TLSSigAPIv2 = require('./TLSSigAPIv2'); // 源码集成需要使用相对路径

var api = new TLSSigAPIv2.Api(1400000000, "5bd2850fff3ecb11d7c805251c51ee463a25727bddc2385f3fa8bfee1bb93b5e");
var sig = api.genSig("xiaojun", 86400*180);
console.log(sig);
```
