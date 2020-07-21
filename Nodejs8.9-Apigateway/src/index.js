'use strict'
/**************************************************
Nodejs8.9-Apigateway
***************************************************/

exports.main_handler = async (event, context, callback) => {
  console.log('start main handler')

  const body = 'API GW Test Success'

  return {
    isBase64: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text', 'Access-Control-Allow-Origin': '*' },
    body: body
  }
}
