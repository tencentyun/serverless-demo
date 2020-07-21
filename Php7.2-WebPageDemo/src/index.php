<?php

function main_handler($event, $context) {
    $file_path = __DIR__."/demo.html";
	$fp = fopen($file_path,"r");
	$str = fread($fp,filesize($file_path));
	fclose($fp);
	return array(
		'isBase64Encoded' => false,
		'statusCode' => 200,
		'headers' => array('Content-Type' => 'text/html; charset=utf-8'),
		'body' => $str
	);
}
?>
