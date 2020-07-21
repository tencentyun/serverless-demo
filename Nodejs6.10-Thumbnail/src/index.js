'use strict'
/**************************************************
Nodejs6.10-Thunbnail
Reference: https://cloud.tencent.com/document/product/460/6925
***************************************************/

const path = require('path')

exports.main_handler = (event, context, callback) => {
  let { Records } = event
  const quality = '80'
  let url

  if (Records) {
    url = Records[0].cos.cosObject.url
  }

  const compressedUrl = path.join(url + '?imageMogr2/rquality/', quality)

  console.log('Input param:', event)
  console.log('URL:', url)
  console.log('Compression ratio:', quality)
  console.log('Compressed picture Url:', compressedUrl)

  return compressedUrl
}
