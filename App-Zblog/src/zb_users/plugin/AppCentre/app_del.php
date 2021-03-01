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

if ($blogversion >= 151525) {
    $app = $zbp->LoadApp($_GET['type'], $_GET['id']);
    if ($app->id != '' && ($app->type == 'plugin' || $app->type == 'theme')) {
        if ($app->CanDel()) {
            $app->Del();
        }
    }
} else {

    function rrmdir($dir)
    {
        if (is_dir($dir)) {
            $objects = scandir($dir);
            foreach ($objects as $object) {
                if ($object != '.' && $object != '..') {
                    if (filetype($dir . '/' . $object) == 'dir') {
                        rrmdir($dir . '/' . $object);
                    } else {
                        unlink($dir . '/' . $object);
                    }
                }
            }
            reset($objects);
            rmdir($dir);
        }
    }
    if ($_GET['type'] == 'plugin' || $_GET['type'] == 'theme') {
    	$_GET['id'] = str_replace(array('.', '/', '\\'), '', $_GET['id']);
        rrmdir($zbp->usersdir . $_GET['type'] . '/' . $_GET['id']);
    }
}

Redirect($_SERVER["HTTP_REFERER"]);
