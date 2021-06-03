const Koa = require('koa')
const KoaRouter = require('koa-router')
const sendFile = require('koa-sendfile')
const path = require('path')

const app = new Koa()
const router = new KoaRouter()

// Routes
router.get(`/`, async (ctx) => {
  await sendFile(ctx, path.join(__dirname, 'index.html'))
})

router.get(`/hello`, async (ctx) => {
  ctx.body = {
    message: 'Hello serverless'
  }
})

app.use(router.allowedMethods()).use(router.routes())

// Web 类型云函数，只能监听 9000 端口
app.listen(9000, () => {
  console.log(`Server start on http://localhost:9000`);
});

