'use strict'
/**************************************************
Nodejs6.10-Apigateway
***************************************************/

exports.main_handler = (event, context, callback) => {
  console.log('start main handler')

  const body = 'API GW Test Success'

  return {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
        "body": body
    }
}
