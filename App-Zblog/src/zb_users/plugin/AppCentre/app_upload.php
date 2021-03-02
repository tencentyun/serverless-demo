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

if (!$zbp->ValidToken(GetVars('token', 'POST'), 'AppCentre')) {
    $zbp->ShowError(5, __FILE__, __LINE__);
    die();
}

AppCentre_CheckInSecurityMode();

foreach ($_FILES as $key => $value) {
    if ($_FILES[$key]['error'] == 0) {
        if (is_uploaded_file($_FILES[$key]['tmp_name'])) {
            $tmp_name = $_FILES[$key]['tmp_name'];
            $name = $_FILES[$key]['name'];

            $xml = file_get_contents($tmp_name);
            if (App::UnPack($xml)) {
                if (property_exists('App', 'check_error_count')) {
                    $i = App::$check_error_count;
                    if ($i > 0) {
                        $zbp->SetHint('bad', $i . $zbp->lang['AppCentre']['files_write_failed']);
                    }
                }
                if (property_exists('App', 'unpack_app')) {
                    $app = App::$unpack_app;
                    if (is_object($app) && get_class($app) == 'App') {
                        $id = $app->id;
                        if (in_array($id, $zbp->GetPreActivePlugin()) == true) {
                            $zbp->cache->success_updated_app = $id;
                            $zbp->SaveCache();
                        }
                    }
                }
                $zbp->SetHint('good', $zbp->lang['AppCentre']['upload_successfully']);
                Redirect($_SERVER["HTTP_REFERER"]);
            } else {
                $zbp->SetHint('bad', $zbp->lang['error']['64']);
                Redirect($_SERVER["HTTP_REFERER"]);
            };
        }
    }
}

Redirect($_SERVER["HTTP_REFERER"]);
