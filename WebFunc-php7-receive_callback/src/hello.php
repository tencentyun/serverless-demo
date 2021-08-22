<?php
$input = file_get_contents("php://input");

header("Content-Type:text/html;charset=utf8");
echo "回调接受成功！";
$stdout = fopen("php://stderr","w"); 
  fwrite($stdout,"$input\n");