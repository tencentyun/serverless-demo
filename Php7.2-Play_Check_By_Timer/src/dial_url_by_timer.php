<?php

require_once("PHPMailer/PHPMailer.php");
require_once("PHPMailer/SMTP.php");
require_once("PHPMailer/Exception.php");
use PHPMailer\PHPMailer;

# The user's mail information, here we use qq mail as an example
# 发送邮件使用的邮箱相关信息，第三方 SMTP 服务,以QQ邮箱为例
const mail_host="smtp.qq.com";         #SMTPhost
const mail_user="XXXXXXXXX@qq.com";    #user's name
const mail_pass="****************";    #SMTP service password，if you use qq mail, please fill in the authentication code
const mail_port=465;                   #SMTP port

# The test url
# 要拨测的URL地址
$test_url_list = array(
    "http://www.baidu.com",
    "http://www.qq.com",
    "http://wrong.tencent.com",
    "http://unkownurl.com"
);

# The email to receive notify
# 接收报警的邮箱地址
$email_notify_list = array(
    "XXXXXXXXX@qq.com"
);

function sendEmail($to,$title,$content){
    $mail = new PHPMailer\PHPMailer();
    // we suggest you use smtp debug for debugging in development environment
    //是否启用smtp的debug进行调试，开发环境建议开启，生产环境注释掉即可
    $mail->SMTPDebug = 2;
    // Use smtp authentication to send email
    // 使用smtp鉴权方式发送邮件
    $mail->isSMTP();
    $mail->SMTPAuth=true;
    // email host
    //邮箱服务器地址
    $mail->Host = mail_host;
    //Use ssl for log in authentication
    //设置使用ssl加密方式登录鉴权
    $mail->SMTPSecure = 'ssl';
    //Setting remote smtp host port for ssl connection
    //设置ssl连接smtp服务器的远程服务器端口号
    $mail->Port = mail_port;
    $mail->CharSet = 'UTF-8';
    $mail->Username =mail_user;
    //smtp password, if you use qq mail, fill in the generated authentication code
    //smtp登录的密码，如果使用QQ邮箱，需使用生成的授权码
    $mail->Password = mail_pass;
    //The sender's email address
    //设置发件人邮箱地址
    $mail->From = mail_user;
    //Check whether the mail content is html format
    //邮件正文是否为html编码
    $mail->isHTML(true);
    $mail->addAddress($to,'receiver');
    //Email subject
    //设置邮件的主题
    $mail->Subject = $title;
    //Add mail content
    //添加邮件正文 上方将isHTML设置成了true，则可以是完整的html字符串
    $mail->Body = $content;
    $status = $mail->send();

    if($status) {
        return true;
    }else{
        return false;
    }
}

function test_url($test_url_list) {
    $curl = curl_init();
    $timeout = 3;
    $errorinfo = array();
    foreach ($test_url_list as $test_url) {
        print "Testing $test_url ";
        // Setting url
        // 设置url路径
        curl_setopt($curl, CURLOPT_URL, $test_url);
        // Return the curl_exec() message in file stream format
        // 将 curl_exec()获取的信息以文件流的形式返回，而不是直接输出。
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true) ;
        // Return thre data when start CURLOPT_RETURNTRANSFER
        // 在启用 CURLOPT_RETURNTRANSFER 时候将获取数据返回
        curl_setopt($curl, CURLOPT_BINARYTRANSFER, true) ;
        // Set timeout
        // 设置超时时间
        curl_setopt ($curl, CURLOPT_CONNECTTIMEOUT, $timeout);
        // Retrive the head request information by CURLINFO_HEADER_OUT
        // CURLINFO_HEADER_OUT选项可以拿到请求头信息
        curl_setopt($curl, CURLINFO_HEADER_OUT, true);
        // Execution
        // 执行
        $data = curl_exec($curl);
        $info = curl_getinfo($curl);
        $status_code = $info['http_code'];
        print "return $status_code\n";
        if ($status_code == 0 || $status_code >= 400) {
            print "response status code fail: $status_code\n";
            $errorinfo[] = "Access $test_url fail, status code: $status_code";
        }
    }
    // Disconnection
    curl_close($curl);
    if (!empty($errorinfo)) {
        $body = join("<br />", $errorinfo);
        $subject = "Please note: PlayCheck Error";
        global $email_notify_list;
        foreach ($email_notify_list as $to_addr) {
            sendEmail($to_addr, $subject, $body);
        }
    }
}

function main_handler($event, $context) {
    global $test_url_list;
    test_url($test_url_list);
}

?>