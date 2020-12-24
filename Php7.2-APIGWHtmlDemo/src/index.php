<?php

function renderTpl($tpl,$variables){
    foreach ($variables as $key => $value) {
        $regex = '/\$\{'.$key.'\}/';
        $tpl = preg_replace($regex,$value,$tpl);
    }
    return $tpl;
}

function main_handler($event, $context) {
    $file_path = __DIR__."/demo.html";
	$fp = fopen($file_path,"r");
	$str = fread($fp,filesize($file_path));
	fclose($fp);
    $str = renderTpl($str,array(
        master=>'腾讯云云函数团队',
        centralCouplet=>'年年有余',
        upCouplet=>'千年迎新春',
        downCouplet=>'瑞雪兆丰年'
    ));
	return array(
		'isBase64Encoded' => false,
		'statusCode' => 200,
		'headers' => array('Content-Type' => 'text/html'),
		'body' => $str
	);
}
?>
