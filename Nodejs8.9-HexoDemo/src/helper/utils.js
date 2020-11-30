const fs = require('fs')
module.exports = {
  async readFileStream(filePath, encoding) {
    return new Promise(resolve => {
      let resString = ''
      const stream = fs.createReadStream(filePath, {
        encoding,
        highWaterMark: 20
      })
      stream.on('data', data => {
        resString += data
      })
      stream.on('close', () => {
        stream.destroy()
        if (encoding === 'binary')
          resString = new Buffer(resString, 'binary').toString('base64')
        resolve(resString)
      })
    })
  }
}
