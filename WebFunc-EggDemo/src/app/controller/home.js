'use strict'

const Controller = require('egg').Controller

class HomeController extends Controller {
  async index() {
    const { ctx } = this

    ctx.set('content-type', 'text/html')
    await ctx.render('index.html', {
      msg: 'hi, egg'
    })
  }

  async event() {
    const { ctx } = this
    ctx.body = {
      req: ctx.req.__SLS_EVENT__,
      request: ctx.request.__SLS_EVENT__
    }
  }

  async getConfig() {
    const { ctx } = this
    ctx.body = this.config
  }
}

module.exports = HomeController
