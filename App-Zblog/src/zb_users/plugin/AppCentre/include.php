<?php
#注册插件
RegisterPlugin("AppCentre", "ActivePlugin_AppCentre");

define('APPCENTRE_DOMAINS', 'zblogcn.com|zblogcn.net');

define(
    'APPCENTRE_PUBLIC_KEY',
    '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3HYTjyOIzYnJtIl4M50l
aYgEQmRGeOQA+5H1Ze3Fgc7bbEc+DtJMAmwYaGR3+ULkL4c0m/KXXxujTgEfxGkk
fO7XI7Z0b1EWFm4M7IbXox6LaLU6mK4OK5nMWWyIyawYn0bdw6X/vaXEyzkDE8fP
ZGGPo5OydyZdTm47lXdCewyxk1CQ6nMs75u0mLjnDfsFXNiDx8hvXODnTSJKzb+C
154qg0uRXjaB2ylnhJKDcQCFAbg5uy0iRcrp7+CFG4qvk0c7d/xRRjqY/y3HI+o5
29/vvByD9KVXfWQQI6unfWfO1uEegXcgypHKHRmuyZoIDH7r56sleXKcN0OLesxp
zwIDAQAB
-----END PUBLIC KEY-----'
);

#定义版本号列
$zbpvers = array();
$zbpvers['130707'] = '1.0 Beta Build 130707';
$zbpvers['131111'] = '1.0 Beta2 Build 131111';
$zbpvers['131221'] = '1.1 Taichi Build 131221';
$zbpvers['140220'] = '1.2 Hippo Build 140220';
$zbpvers['140614'] = '1.3 Wonce Build 140614';
$zbpvers['150101'] = '1.4 Deeplue Build 150101';
$zbpvers['151626'] = '1.5 Zero Build 151626';
$zbpvers['151740'] = '1.5.1 Zero Build 151740';
$zbpvers['151935'] = '1.5.2 Zero Build 151935';
$zbpvers['162090'] = '1.6.0 Valyria Build 162090';

if (!isset($zbpvers[$GLOBALS['blogversion']])) {
    if (defined('ZC_VERSION_FULL')) {
        $zbpvers[$GLOBALS['blogversion']] = ZC_VERSION_FULL;
    } else {
        $zbpvers[$GLOBALS['blogversion']] = ZC_BLOG_VERSION;
    }
}

$appcentre_verified = array();

function ActivePlugin_AppCentre()
{
    global $zbp;
    Add_Filter_Plugin('Filter_Plugin_Admin_LeftMenu', 'AppCentre_AddMenu');
    Add_Filter_Plugin('Filter_Plugin_Admin_ThemeMng_SubMenu', 'AppCentre_AddThemeMenu');
    Add_Filter_Plugin('Filter_Plugin_Admin_PluginMng_SubMenu', 'AppCentre_AddPluginMenu');
    Add_Filter_Plugin('Filter_Plugin_Admin_SiteInfo_SubMenu', 'AppCentre_AddSiteInfoMenu');
    Add_Filter_Plugin('Filter_Plugin_Cmd_Begin', 'AppCentre_Cmd_Begin');
    //Add_Filter_Plugin('Filter_Plugin_DisablePlugin', 'AppCentre_DisablePlugin');

    $domain = (string) $zbp->Config('AppCentre')->firstdomain;

    if ($domain == '' || stripos(APPCENTRE_DOMAINS, $domain) === false) {
        $domain = SplitAndGet(APPCENTRE_DOMAINS, '|', 0);
    }

    define('APPCENTRE_DOMAIN', 'app.' . $domain);

    if (stripos($GLOBALS['bloghost'], 'https://') !== false) {
        define('APPCENTRE_URL', 'https://' . APPCENTRE_DOMAIN . '/client/');
        define('APPCENTRE_CMD_URL', 'https://' . APPCENTRE_DOMAIN . '/zb_system/cmd.php?');
        define('APPCENTRE_SYSTEM_UPDATE', 'https://update.' . $domain . '/zblogphp/');
        define('APPCENTRE_VERIFY', 'https://verify.' . APPCENTRE_DOMAIN . '/release/v1/');
        define('APPCENTRE_VERIFY_V2', 'https://verify.' . APPCENTRE_DOMAIN . '/release/v2/');
    } else {
        define('APPCENTRE_URL', 'http://' . APPCENTRE_DOMAIN . '/client/');
        define('APPCENTRE_CMD_URL', 'http://' . APPCENTRE_DOMAIN . '/zb_system/cmd.php?');
        define('APPCENTRE_SYSTEM_UPDATE', 'http://update.' . $domain . '/zblogphp/');
        define('APPCENTRE_VERIFY', 'http://verify.' . APPCENTRE_DOMAIN . '/release/v1/');
        define('APPCENTRE_VERIFY_V2', 'http://verify.' . APPCENTRE_DOMAIN . '/release/v2/');
    }

    if (method_exists('ZBlogPHP', 'LoadLanguage')) {
        $zbp->LoadLanguage('plugin', 'AppCentre');
    } else {
        if (is_readable($f = $zbp->path . 'zb_users/plugin/AppCentre/language/' . $zbp->option['ZC_BLOG_LANGUAGEPACK'] . '.php')) {
            $zbp->lang['AppCentre'] = include $f;
        } elseif (is_readable($f = $zbp->path . 'zb_users/plugin/AppCentre/language/' . 'zh-cn' . '.php')) {
            $zbp->lang['AppCentre'] = include $f;
        }
    }
}

function InstallPlugin_AppCentre()
{
    global $zbp;
    $zbp->Config('AppCentre')->enabledcheck = 1;
    $zbp->Config('AppCentre')->checkbeta = 0;
    $zbp->Config('AppCentre')->enabledevelop = 0;
    $zbp->Config('AppCentre')->enablegzipapp = 0;
    $zbp->SaveConfig('AppCentre');
}

function AppCentre_AddMenu(&$m)
{
    global $zbp;
    $m['nav_AppCentre'] = MakeLeftMenu("root", $zbp->lang['AppCentre']['name'], $zbp->host . "zb_users/plugin/AppCentre/main.php", "nav_AppCentre", "aAppCentre", $zbp->host . "zb_users/plugin/AppCentre/images/Cube1.png", "icon-zblog-appcenter");
}

function AppCentre_AddSiteInfoMenu()
{
    global $zbp;
    if ($zbp->Config('AppCentre')->enabledcheck) {
        $last = (int) $zbp->Config('AppCentre')->lastchecktime;
        if ((time() - $last) > (11 * 60 * 60)) {
            echo "<script type='text/javascript'>$(document).ready(function(){  $.getScript('{$zbp->host}zb_users/plugin/AppCentre/main.php?method=checksilent&rnd='); });</script>";
            $zbp->Config('AppCentre')->lastchecktime = time();
            $zbp->SaveConfig('AppCentre');
        }
    }
    if ($zbp->version < 162300 && $zbp->version >= 150101 && (int) $zbp->option['ZC_LAST_VERSION'] < 162090) {
        echo "<script type='text/javascript'>$('.main').prepend('<div class=\"hint\"><p class=\"hint hint_tips\"><a href=\"{$zbp->host}zb_users/plugin/AppCentre/update.php?updatedb\">{$zbp->lang['AppCentre']['click_to_upgrade_database']}</a></p></div>');</script>";
    }
}

function AppCentre_Cmd_Begin()
{
    global $zbp;
    $action = GetVars('act', 'GET');
    $type = '';
    $name = '';
    if ($action == 'PluginEnb') {
        $name = GetVars('name', 'GET');
        $type = 'plugin';
    } elseif ($action == 'ThemeSet') {
        $name = GetVars('theme', 'POST');
        $type = 'theme';
    }

    if ($type != '') {
        $app = $zbp->LoadApp($type, $name);
        if ($app->price > 0) {
            $s = AppCentre_VerifyV2($app->id, $type);
            if ((strlen($s) % 32) > 0 && !preg_match('/^[0-9a-f]*$/', $s)) {
                $zbp->ShowError($s);
            }
        }
    }
}

function AppCentre_AddThemeMenu()
{
    global $zbp;
    echo "<script type='text/javascript'>var app_enabledevelop=" . (int) $zbp->Config('AppCentre')->enabledevelop . ";var app_enablepluginsort=" . (int) $zbp->Config('AppCentre')->enablepluginsort . ";</script>";
    if (AppCentre_InSecurityMode()) {
        return;
    }
    Add_Filter_Plugin('Filter_Plugin_Admin_End', 'AppCentre_Theme_Admin_End');
}

function AppCentre_AddPluginMenu()
{
    global $zbp;
    echo "<script type='text/javascript'>var app_enabledevelop=" . (int) $zbp->Config('AppCentre')->enabledevelop . ";var app_enablepluginsort=" . (int) $zbp->Config('AppCentre')->enablepluginsort . ";</script>";
    if (AppCentre_InSecurityMode()) {
        return;
    }
    Add_Filter_Plugin('Filter_Plugin_Admin_End', 'AppCentre_Plugin_Admin_End');
}

function AppCentre_Theme_Admin_End()
{
    global $zbp;
    echo '<script type="text/javascript">';
    include dirname(__FILE__) . '/theme.js.php';
    echo '</script>';
}

function AppCentre_Plugin_Admin_End()
{
    global $zbp;
    echo '<script type="text/javascript">';
    include dirname(__FILE__) . '/plugin.js.php';
    echo '</script>';
}

/**
 * @deprecated
 */
function AppCentre_App_Check_ISBUY($appid)
{
    return json_decode('{"data": {"isbuy": true}}', true);
}

/**
 * 不纯，含旧版本升级代码。
 * 对于新版(>20190201)，可假定其是pure的。
 */
function AppCentre_Get_Cookies()
{
    global $zbp;

    if ($zbp->Config('AppCentre')->username != '') {
        $zbp->Config('AppCentre')->token = $zbp->Config('AppCentre')->username;
        $zbp->Config('AppCentre')->uniq_id = $zbp->Config('AppCentre')->password;
        $zbp->Config('AppCentre')->old_token = 'true';
        $zbp->Config('AppCentre')->username = '';
        $zbp->Config('AppCentre')->password = '';
        $zbp->Config('AppCentre')->DelKey('username');
        $zbp->Config('AppCentre')->DelKey('password');
        $zbp->SaveConfig('AppCentre');
    }

    $c = '';

    $c .= ' apptype=' . urlencode($zbp->Config('AppCentre')->apptype);
    $c .= ' ;app_guestver=' . urlencode('2.0');
    $c .= ' ;app_host=' . urlencode($zbp->host);
    $c .= ' ;app_email=' . urlencode($zbp->user->Email);
    $c .= ' ;app_user=' . urlencode($zbp->user->Name);

    $token = substr($zbp->Config('AppCentre')->token, 0, 100);
    $uniq_id = substr($zbp->Config('AppCentre')->uniq_id, 0, 100);
    if ($token) {
        $c .= "; token=" . urlencode($token);
        if ($zbp->Config('AppCentre')->old_token === 'true') {
            $c .= "; sign=" . urlencode($uniq_id);
        } else {
            $c .= "; sign=" . urlencode(AppCentre_Get_Sign($token));
        }
        $c .= "; uniq_id=" . urlencode($uniq_id);
    }

    return $c;
}

function AppCentre_Get_Sign($token)
{
    global $zbp;
    //$zbp->user->Level != 1
    if ($zbp->user->Level != 1) {
        foreach ($zbp->members as $key => $m) {
            if ($m->Level == 1) {
                return hash_hmac('sha256', $m->Name . '|' . $m->Password . '|' . $m->Guid, $token);
            }
        }
    }
    return hash_hmac('sha256', $zbp->user->Name . '|' . $zbp->user->Password . '|' . $zbp->user->Guid, $token);
}

function AppCentre_Get_UserAgent()
{
    global $zbp;
    $app = $zbp->LoadApp('plugin', 'AppCentre');
    $pv = strpos(phpversion(), '-') === false ? phpversion() : substr(phpversion(), 0, strpos(phpversion(), '-'));
    $u = 'ZBlogPHP/' . $GLOBALS['blogversion'] . ' AppCentre/' . $app->modified . ' PhpVer/' . $pv . ' Lang/' . $zbp->option['ZC_BLOG_LANGUAGEPACK'] . ' ' . GetGuestAgent();

    return $u;
}

/**
 * @deprecated
 */
function AppCentre_Check_App_IsBuy($appid, $throwerror = true)
{
    global $zbp;
    $ajax = Network::Create(trim($zbp->Config('AppCentre')->networktype));

    //$url = str_replace('http://','https://',APPCENTRE_URL) . '?checkbuy';
    $url = APPCENTRE_VERIFY;
    $c = AppCentre_Get_Cookies();
    $u = AppCentre_Get_UserAgent();

    $appid = $appid;
    $token = $zbp->Config('AppCentre')->token;
    $host = $zbp->host;

    $data = array();

    $data['appid'] = $appid;
    $data['host'] = $zbp->host;

    $data['includefilehash'] = file_get_contents($zbp->path . 'zb_users/plugin/AppCentre/include.php');
    $data['includefilehash'] = md5(str_replace(array('\r','\n'), '', $data['includefilehash']));

    $pu_key = openssl_pkey_get_public(APPCENTRE_PUBLIC_KEY);

    $encrypted = '';
    openssl_public_encrypt(implode('|', $data), $encrypted, $pu_key);//公钥加密
    $encrypted = base64_encode($encrypted);
    $data = array();
    $data['info'] = $encrypted;

    $ajax->open('POST', $url);
    //$ajax->enableGzip();
    $ajax->setTimeOuts(120, 120, 0, 0);
    $ajax->setRequestHeader('User-Agent', $u);
    $ajax->setRequestHeader('Cookie', $c);
    $ajax->setRequestHeader('Website', $zbp->host);
    $ajax->send($data);


    $encrypted = $ajax->responseText;
    $encrypted = str_replace('"', '', $encrypted);
    openssl_public_decrypt(base64_decode($encrypted), $decrypted, $pu_key);//公钥解密
    //die($decrypted);
    if (md5($zbp->Config('AppCentre')->token . 'ok') == $decrypted) {
        return true;
    } else {
        if ($throwerror == true) {
            $zbp->ShowError($decrypted);
            die();
        } else {
            return false;
        }
    }
}

function AppCentre_VerifyV2($appid, $type = 'plugin')
{
    global $appcentre_verified, $zbp;
    $verifyHash = md5($appid . '-' . $type);
    if (isset($appcentre_verified[$verifyHash])) {
        return $appcentre_verified[$verifyHash];
    }
    try {
        $app = new App();
        $app->LoadInfoByXml($type, $appid);
        $ajax = Network::Create(trim($zbp->Config('AppCentre')->networktype));

        $url = APPCENTRE_VERIFY_V2;
        $cookies = AppCentre_Get_Cookies();
        $userAgent = AppCentre_Get_UserAgent();
        $host = $zbp->host;
        $rsaPublicKey = openssl_pkey_get_public(APPCENTRE_PUBLIC_KEY);
        if (function_exists('openssl_random_pseudo_bytes')) {
            $aesKey = openssl_random_pseudo_bytes(32);
            $aesIv = openssl_random_pseudo_bytes(16);
        } else {
            $aesKey = md5(uniqid());
            $aesIv = substr(md5(uniqid()), 0, 16);
        }
        $encryptedAesKey = '';
        openssl_public_encrypt(base64_encode($aesKey) . '.' . base64_encode($aesIv), $encryptedAesKey, $rsaPublicKey);
        $encryptedAesKey = base64_encode($encryptedAesKey);

        $licensePath = $zbp->path . 'zb_users/' . $type . '/' . $appid . '/zb-app-license.php';

        $data = array(
            'appId' => $appid,
            'cookie' => $cookies,
            'userAgent' => $userAgent,
            'host' => $host,
            'license' => file_exists($licensePath) ? file_get_contents($licensePath) : '',
            'modified' => strtotime($app->modified)
        );
        $data['includefilehash'] = file_get_contents($zbp->path . 'zb_users/plugin/AppCentre/include.php');
        $data['includefilehash'] = md5(str_replace(array('\r', '\n'), '', $data['includefilehash']));

        $stringifierData = json_encode($data);

        if (function_exists('openssl_encrypt')) {
            $encryptedText = 'O' . base64_encode(openssl_encrypt($stringifierData, 'aes-256-cbc', $aesKey, 1, $aesIv));
        } else { // Fuck PHP 5.2
            $encryptedText = 'M' . base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $aesKey, $stringifierData, MCRYPT_MODE_CBC, $aesIv));
        }

        $sendData = $encryptedAesKey . '.' . $encryptedText;

        $ajax->open('POST', $url);
        //$ajax->enableGzip();
        $ajax->setTimeOuts(120, 120, 0, 0);
        $ajax->setRequestHeader('Content-Type', 'application/zblogphp-verify');
        $ajax->setRequestHeader('User-Agent', $userAgent);
        $ajax->setRequestHeader('Website', $zbp->host);
        $ajax->send($sendData);

        $returnData = str_replace('"', '', $ajax->responseText);
        if (substr($returnData, 0, 3) === 'AES') {
            $contents = explode('|', $returnData);
            $hash = $contents[1];
            if (hash_hmac('sha256', $contents[2], 'zblogverification') !== $hash) {
                return 'Result Hash Error!';
            }
            $encryptedData = base64_decode($contents[2]);
            if (function_exists('openssl_decrypt')) {
                $decryptedText = openssl_decrypt($encryptedData, 'aes-256-cbc', $aesKey, 1, $aesIv);
            } else {
                $decryptedText = mcrypt_decrypt(MCRYPT_RIJNDAEL_128, $aesKey, $encryptedData, MCRYPT_MODE_CBC, $aesIv);
                $textLength = strlen($decryptedText);
                $padding = ord($decryptedText[($textLength - 1)]);
                $decryptedText = substr($decryptedText, 0, -$padding);
            }
        } else {
            $decryptedText = $returnData;
        }

        $return = trim($decryptedText);
        $appcentre_verified[$verifyHash] = $return;
        return $return;
    } catch (Exception $e) {
        return $zbp->lang['AppCentre']['unable_to_verify'];
    }
}

function AppCentre_UpdateCSP(&$csp)
{
    $urls = " *.zblogcn.com";
    $items = array('default-src', 'img-src', 'script-src', 'style-src');
    foreach ($items as $item) {
        if (isset($csp[$item])) {
            $csp[$item] .= $urls;
        }
    }
    if (isset($csp['object-src'])) {
        $csp['object-src'] .= " 'none'";
    } else {
        $csp['object-src'] = "'none'";
    }
}

function AppCentre_InSecurityMode()
{
    global $zbp;
    return file_exists($zbp->path . 'zb_users/data/appcentre_security_mode.php');
}

function AppCentre_CheckInSecurityMode()
{
    global $zbp;
    if (AppCentre_InSecurityMode()) {
        $zbp->ShowError($zbp->lang['AppCentre']['operation_is_prohibited']);
    }
}

function AppCentre_DisablePlugin(&$name)
{
    global $zbp;

    if ($name == 'AppCentre') {
        $p = $zbp->LoadPlugins();
        foreach ($p as $key => $value) {
            if ($zbp->CheckPlugin($value->id) && (double) $value->price > 0) {
                SetPluginSignal('Filter_Plugin_DisablePlugin', __FUNCTION__, PLUGIN_EXITSIGNAL_RETURN);
                return false;
            }
        }
    }
}

function AppCentre_CreateButton($name){
    if ($GLOBALS['blogversion'] >= 172360) {

        switch ($name) {
            case 'edit':
                return '<i class=\'icon-pencil-square\'></i>';
                break;
            case 'download':
                return '<i class=\'icon-download\'></i>';
            case 'cloudup':
                return '<i class=\'icon-cloud-arrow-up-fill\'></i>';
            case 'delete':
                return '<i class=\'icon-trash\'></i>';
            case 'module':
                return '<i class=\'icon-grid-fill\'></i>';
            case 'set':
                return '<i class=\'icon-tools\'></i>';
            default:
                # code...
                break;
        }


    } else {

        switch ($name) {
            case 'edit':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_users/plugin/AppCentre/images/application_edit.png\'/>';
                break;
            case 'download':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_users/plugin/AppCentre/images/download.png\'/>';
            case 'cloudup':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_users/plugin/AppCentre/images/drive-upload.png\'/>';
            case 'delete':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_users/plugin/AppCentre/images/delete.png\'/>';
            case 'module':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_users/plugin/AppCentre/images/bricks.png\'/>';
            case 'set':
                return '<img height=\'16\' width=\'16\' src=\'"+bloghost+"zb_system/image/admin/setting_tools.png\'/>';
            default:
                # code...
                break;
        }

    }
}


if (!function_exists('SplitAndGet')) {

    function SplitAndGet($string, $delimiter = ';', $n = 0)
    {
        $a = explode($delimiter, $string);
        if (!is_array($a)) {
            $a = array();
        }
        if (isset($a[$n])) {
            return (string) $a[$n];
        }

        return '';
    }

}
