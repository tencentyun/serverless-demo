<?php

require_once("PHPMailer/PHPMailer.php");
require_once("PHPMailer/SMTP.php");
require_once("PHPMailer/Exception.php");
use PHPMailer\PHPMailer;

# Mailbox related information for sending mail, third party SMTP service, taking QQ mailbox as an example. 发送邮件使用的邮箱相关信息，第三方 SMTP 服务,以QQ邮箱为例
const mail_host="smtp.qq.com";         # SMTP server. SMTP服务器
const mail_user="XXXXXXXXX@qq.com";    # username. 用户名
const mail_pass="****************";    # The password of the SMTP service. If you use QQ mailbox, you need to use the generated authorization code. SMTP服务的口令，如果使用QQ邮箱，需使用生成的授权码
const mail_port=465;                   # SMTP service port. SMTP服务端口

function sendEmail($from,$to,$title,$content){
    $mail = new PHPMailer\PHPMailer();
    //Whether to enable SMTP debug for debugging. It is recommended to open in the development environment and comment out in the production environment. 
    //是否启用smtp的debug进行调试，开发环境建议开启，生产环境注释掉即可
    $mail->SMTPDebug = 2;
    //Send mail using SMTP authentication. 使用smtp鉴权方式发送邮件
    $mail->isSMTP();
    $mail->SMTPAuth=true;
    //The address of Mailbox server. 邮箱服务器地址
    $mail->Host = mail_host;
    //Setting the login authentication using ssl encryption. 设置使用ssl加密方式登录鉴权
    $mail->SMTPSecure = 'ssl';
    //Setting the remote server port number of the smtp server for SSL connection.   设置ssl连接smtp服务器的远程服务器端口号
    $mail->Port = mail_port;
    $mail->CharSet = 'UTF-8';
    $mail->Username =mail_user;
    //Smtp login password, if you use QQ mailbox, you need to use the generated authorization code. smtp登录的密码，如果使用QQ邮箱，需使用生成的授权码
    $mail->Password = mail_pass;
    //Setting the sender's email address. 设置发件人邮箱地址
    $mail->From = mail_user;
    //Whether the body of the email is html encoded. 邮件正文是否为html编码
    $mail->isHTML(true);
    $mail->addAddress($to,'receiver');
    //Setting the email subject. 设置邮件的主题
    $mail->Subject = $title;
    //Editting email body. Setting 'isHTML' to true above, it can be a full html string. 添加邮件正文 上面将isHTML设置成了true，则可以是完整的html字符串
    $mail->Body = $content;
    $status = $mail->send();

    if($status) {
        return true;
    }else{
        return false;
    }
}

function main_handler($event, $context) {
    print "start main handler\n";
    if($event->Records and !empty($event->Records)) {
        $cmqMsgStr = $event->Records[0]->CMQ->msgBody;
        $cmqMsg = json_decode($cmqMsgStr, true);
        var_dump($cmqMsg);
        if(sendEmail($cmqMsg['fromAddr'], $cmqMsg['toAddr'], $cmqMsg['title'], $cmqMsg['body'])) {
            return "send email success";
        }
    }
    return "send email fail";
}

?>