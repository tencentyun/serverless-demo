<?php

function microtime_float()
{
        list($usec, $sec) = explode(" ", microtime());
        return ((float)$usec + (float)$sec);
}

function microtime_format($tag, $time)
{
        list($usec, $sec) = explode(".", $time);
        $date = date($tag,$usec);
        return str_replace('x', $sec, $date);
}

function gHeaders(){
    $headers = array();
    foreach($_SERVER as $key=>$value){
        if(substr($key, 0, 5)==='HTTP_'){
            $key = substr($key, 5);
            $key = str_replace('_', ' ', $key);
            $key = str_replace(' ', '-', $key);
            $key = strtolower($key);
            $headers[$key] = $value;
        }
    }
    return $headers;
}
#验签函数
function checkSignature($signature='',$timestamp='',$nonce='')
{
    $postsignature = $signature;
    $posttimestamp = $timestamp;
    $postnonce = $nonce;
    # 用户设置token  在此填入设置的token 
    $token = "test";
    $tmpArr = array($token, $posttimestamp, $postnonce);
    sort($tmpArr, SORT_STRING);
    $tmpStr = implode( $tmpArr );
    $tmpStr = sha1( $tmpStr );

    if( $tmpStr == $signature ){
        return true;
    }else{
        return false;
    }
}

$url = $_SERVER["REQUEST_URI"];
//$ctype = $_SERVER['CONTENT_TYPE'];
$raw_post_data = file_get_contents('php://input');
$stdout = fopen("php://stderr","w");
if( $_SERVER['REQUEST_METHOD'] === 'GET'){

			$header = gHeaders();
			$signature = $header['signature'];
			$timestamp = $header['timestamp'];
			$nonce = $header['nonce'];
			$echostr = $header['echostr'];
			#验签成功与否标志 $flag
			$flag = checkSignature($signature,$timestamp,$nonce);
			#echo 'flag:',  $flag ;
			if ($flag === true) {
				fwrite($stdout,"验签成功\n");
			}else {
				fwrite($stdout,"验签失败\n");
			}
			header('Content-Type: text/plain; charset=utf-8');
			$len = 'Content-Length: ';
			$len .= strlen($echostr);
			header($len);
			echo $header['echostr'] ;

}else if( $_SERVER['REQUEST_METHOD'] === 'POST') {
			#echo microtime() ;
			$time = microtime_float();
			$strtime = microtime_format('Ymd-His.x ', $time);
			$ctype = $_SERVER['CONTENT_TYPE'];
            echo $strtime , 'Post Body:' , $raw_post_data , "\r\n";
            fwrite($stdout,"Post Body:\n");
            fwrite($stdout,"$raw_post_data\n");
        }else{
			
		}
?>
