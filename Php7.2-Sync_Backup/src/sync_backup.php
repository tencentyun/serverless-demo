<?php

require 'cos-php-sdk-v5/vendor/autoload.php';

$appid = XXXXXXXX;  # 请替换为您的 APPID
$secret_id = '************';  # 请替换为您的 SecretId
$secret_key = '************';  # 请替换为您的 SecretKey
$region = 'ap-guangzhou';
$backup_bucket = "XXXX".'-'.$appid;  # 请替换为您用于存放压缩后图片的bucket

$cosClient = new Qcloud\Cos\Client(array('region' => $region,
    'credentials'=> array(
        'secretId'    => $secret_id,
        'secretKey' => $secret_key)));

function delete_local_file($path) {
    unlink($path);
}

function main_handler($event, $context) {
    print "start main handler\n";
    global $appid;
    global $cosClient;
    global $backup_bucket;

    foreach($event->Records as $record) {
        $bucket = $record->cos->cosBucket->name.'-'.$appid;
        $key = $record->cos->cosObject->key;
        $key = str_replace('/'.$appid.'/'.$record->cos->cosBucket->name.'/','', $key);
        $download_path = '/tmp/'.$key;
        print "Key is ".$key."\n";
        print sprintf("Get from [%s] to download file [%s]\n", $bucket, $key);

        try {
            $result = $cosClient->getObject(array(
                'Bucket' => $bucket,
                'Key' => $key,
                'SaveAs' => $download_path));
        } catch (\Exception $e) {
            echo "$e\n";
        }
        print "Download file Success\n";

        #upload the file to backup bucket
        try {
            $result = $cosClient->putObject(array(
                'Bucket' => $backup_bucket,
                'Key' => $key,
                'Body' => fopen($download_path, 'rb')));
            print_r($result);
        } catch (\Exception $e) {
            echo "$e\n";
        }

        #delete local file
        delete_local_file($download_path);
    }
    return "Success";
}

?>