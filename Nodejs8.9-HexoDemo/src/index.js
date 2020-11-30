// Native
const http = require('http')
const fs = require('fs')
const path = require('path')

// Packages
const mime = require('mime-types')
const template = require('art-template')

// Other
const { readFileStream } = require('./helper/utils')

const serveConfig = {
  staticPath: './public',
  root: 'index.html'
}

/**************************************************
Static website demo							
***************************************************/
exports.main_handler = async (event, context, callback) => {
  let type = mime.lookup(event.path),
    statusCode = 200,
    body = '',
    encoding = 'binary',
    isBase64Encoded = true
  const htmlType = mime.lookup('.html')
  try {
    const relativePath = event.path
      .split('/')
      .slice(1)
      .join('/')
    let absolutePath = path.join(
      __dirname,
      './',
      serveConfig.staticPath,
      relativePath
    )

    const ext = path.parse(absolutePath).ext
    if (!ext) {
      absolutePath = path.join(absolutePath, serveConfig.root)
      type = htmlType
    }
    const isExist = fs.existsSync(absolutePath)

    if (isExist) {
      body = await readFileStream(absolutePath, encoding)
    } else {
      statusCode = 404
      type = htmlType
      body = template(__dirname + '/public/404.art', {})
    }
  } catch (e) {
    statusCode = 200
    type = htmlType
    body = template(__dirname + '/public/error.art', {
      err: {
        statusCode: 500,
        message: e.message
      }
    })
  }

  return {
    isBase64Encoded,
    statusCode,
    headers: { 'Content-Type': type },
    body
  }
}
