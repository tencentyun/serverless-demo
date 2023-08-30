const express = require('express')
const bodyParser = require('body-parser');
const sha1 = require('js-sha1');
const app = express();
app.use(bodyParser.json());

function checkSignatureMiddleware(req, res, next) {
  const token = '此处为您在规则引擎中配置的token';
  const { signature, timestamp, nonce } = req.headers;
  // 将token，timestamp，nonce按照字典排序后拼接为字串
  let tmpStr = [token, timestamp, nonce].sort().join('');
  // 将字串进行sha1加密
  tmpStr = sha1(tmpStr);
  if (tmpStr === signature) {
    next(); // 身份校验通过，继续执行后续的中间件和路由处理器
  } else {
    res.status(403).send('Forbidden'); // 身份校验失败，返回403 Forbidden 状态码
  }
}

app.get(`/`, (req, res) => {
  res.send('sucess');
});

app.get('/test', checkSignatureMiddleware, (req, res) => {
  const { echostr } = req.headers;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(echostr);
});

// 注意接收规则引擎转发的数据接口为 POST 类型
app.post('/test', checkSignatureMiddleware, (req, res) => {
  const params = req.body.payload.params;
  console.log(params); // { body_temperature: 36 }
  res.end();
});

app.listen(9000, () => {
  console.log(`Server is listening on port 9000`)
})