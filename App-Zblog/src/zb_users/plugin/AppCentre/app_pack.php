<?php
require '../../../zb_system/function/c_system_base.php';

require '../../../zb_system/function/c_system_admin.php';

require dirname(__FILE__) . '/function.php';

$zbp->Load();

$action = 'root';
if (!$zbp->CheckRights($action)) {
    $zbp->ShowError(6);
    die();
}

if (!$zbp->CheckPlugin('AppCentre')) {
    $zbp->ShowError(48);
    die();
}

if (!$zbp->ValidToken(GetVars('token', 'GET'), 'AppCentre')) {
    $zbp->ShowError(5, __FILE__, __LINE__);
    die();
}

AppCentre_CheckInSecurityMode();

$type = $_GET['type'];

$id = $_GET['id'];

$app = new App;

if (!$app->LoadInfoByXml($type, $id)) {
    exit;
}

ob_clean();

if (function_exists('gzencode')
    && $zbp->Config('AppCentre')->enablegzipapp
    && $app->adapted > 140614// 1.3和之前版本不打包为gzba
) {
    $b = true;
} else {
    $b = false;
}
//header('Content-type:text/xml');
header('Content-Disposition:attachment;filename=' . $id . '_' . $app->version . '_' . $app->modified . '.zba');
echo AppCentre_Pack($app, $b);
logs("{$zbp->user->Name} export app [{$id}] ({$_SERVER['HTTP_USER_AGENT']})");
