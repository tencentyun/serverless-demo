/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/32996        *****
*****                                                                *****
**************************************************************************/
const fs = require('fs')
const path = require('path')
const render = require('./render')

exports.main_handler = async (event, context,callback ) => {
  let html = fs.readFileSync(path.resolve(__dirname, './demo.html'), {
    encoding: 'utf-8'
  })
  html = render(html, {
    master: '腾讯云云函数团队', // Your name 您的名称
    centralCouplet: '年年有余', // centralCouplet 横批
    upCouplet: '千年迎新春', // upCouplet 上联
    downCouplet: '瑞雪兆丰年' // downCouplet 下联
  })
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html
  }
}
