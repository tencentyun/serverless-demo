<?php
function main_handler($event, $context) {
ksort($params);
$key = "app_id";
$app_id ="xxxxxx"; // MTA APPID 
$secret_key = 'xxxxx'; //MTA  SECRET KEY
$secret_key.= $key.'='.$app_id;
$sign = md5($secret_key);
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => "https://mta.qq.com/h5/api/ctr_realtime/heartbeat?app_id=".$app_id."&sign=".$sign,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "cache-control: no-cache"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);
$echo_arr = json_decode($response, true);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
//监控告警机器人
$sc = $sc="#### **站点运营数据：**\n
>浏览量  （pv）:<font color=\"info\">".$echo_arr["pv"]."</font> \n
>独立访客（uv）:<font color=\"info\">".$echo_arr["uv"]."</font> \n
>访问次数（vv）:<font color=\"info\">".$echo_arr["vv"]."</font>\n
>访问IP数（iv）:<font color=\"info\">".$echo_arr["iv"]."</font>\n
>[MTA报表](https://mta.qq.com/h5/base/ctr_realtime_data?app_id=xxx 报表地址，可自定义) \n";
$post = array('msgtype' => 'markdown', 'markdown' => array('content' => $sc));
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx", // 企业微信机器人接口
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 10,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode($post,JSON_UNESCAPED_UNICODE),
  CURLOPT_HTTPHEADER => array(
    "Cache-Control: no-cache",
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);
}
    return "运行成功";
}
?>