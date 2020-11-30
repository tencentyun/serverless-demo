# -*- coding: utf8 -*-
# Message body structure in CMQ Topic:
# CMQ Topic中的消息体结构：
# {
# "fromAddr":"xxx@qq.com",
# "toAddr":"xxx@qq.com",
# "title":"hello from scf & cmq",
# "body":"email content to send"
# }
import json
import smtplib
from email.mime.text import MIMEText
from email.header import Header

# hird-party SMTP service taking QQ mailbox as an example. 第三方 SMTP 服务,以QQ邮箱为例
mail_host="smtp.qq.com"          # SMTP server. SMTP服务器
mail_user="xxxxxxxxx@qq.com"     # Username 用户名
mail_pass="****************"     # SMTP service password. SMTP服务的口令
mail_port=465                    # SMTP service port. SMTP服务端口

def sendEmail(fromAddr,toAddr,subject,content):
    sender = fromAddr
    receivers = [toAddr]  # Receiving emails, can be set as your QQ mailbox or other mailbox. 接收邮件，可设置为您的QQ邮箱或者其他邮箱

    message = MIMEText(content, 'plain', 'utf-8')
    message['From'] = Header(fromAddr, 'utf-8')
    message['To'] =  Header(toAddr, 'utf-8')
    message['Subject'] = Header(subject, 'utf-8')

    try:
        smtpObj = smtplib.SMTP_SSL(mail_host, mail_port)
        smtpObj.login(mail_user,mail_pass)
        smtpObj.sendmail(sender, receivers, message.as_string())
        print("send email success")
        return True
    except smtplib.SMTPException as e:
        print(e)
        print("Error: send email fail")
        return False

def main_handler(event, context):
    if event is not None and "Records" in event.keys():
        if len(event["Records"]) >= 1 and "CMQ" in event["Records"][0].keys():
            cmqMsgStr = event["Records"][0]["CMQ"]["msgBody"]
            cmqMsg = json.loads(cmqMsgStr.replace("'", '"'))
            print (cmqMsg)
    if sendEmail(cmqMsg['fromAddr'], cmqMsg['toAddr'], cmqMsg['title'], cmqMsg['body']):
        return "send email success"
    else:
        return "send email fail"