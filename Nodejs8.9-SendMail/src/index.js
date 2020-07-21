'use strict'
/**************************************************
Nodejs8.9-SendMail
Reference: https://github.com/nodemailer/nodemailer
Tips:
1. Fill in the sender's address(eg:xxx@qq.com) and authorization code
   填写邮件发送方的user(如: xxx@qq.com)和授权码
2. Fill in the receiver's address(eg:xxx@qq.com)
   填写邮件接收方的user(如: xxx@qq.com)
***************************************************/

const nodemailer = require('nodemailer')

String.prototype.render = function(renderedValue) {
  let self = this.toString()
  for (let item in renderedValue) {
    self = self.replace(new RegExp('\\${' + item + '}', 'g'), (a, b) => {
      return renderedValue[item]
    })
  }
  return self
}

exports.main_handler = async (event, context, callback) => {
  const { Records } = event
  const transporter = nodemailer.createTransport({
    service: 'qq', // Use qq mail by default, you can choose qq mail/ Gmail, 默认为qq邮箱，可选qq | Gmail
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'xxx@qq.com',
      pass: 'xxx' // The authorization code 邮箱授权码
    }
  })
  if (Records) {
    const cmqInfo = Records[0].CMQ
    console.log('cmqInfo', cmqInfo)
    const mailOptions = {
      from: 'xxx@qq.com ',
      to: 'xxx@qq.com',
      subject: 'CMQTrigger-Send message',
      html: '<p>Time: ${publishTime}</p>\
     <p>Subject: ${topicName}</p>\
     <p>MsgBody: ${msgBody}</p>\
    '.render(
        {
          publishTime: cmqInfo.publishTime,
          topicName: cmqInfo.topicName,
          msgBody: cmqInfo.msgBody
        }
      ) // html body
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Message sent: ' + info.response)
      return info.response
    } catch (e) {
      console.log(e)
    }
  } else {
    throw Error('Not triggered by cmq subscription')
  }
}
