<?php

function AppCentre_SubMenus($id)
{
    //m-now
    global $zbp;

    if (!AppCentre_InSecurityMode()) {
        echo '<a href="main.php"><span class="m-left ' . ($id == 1 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['browse_app'] . '</span></a>';
    }
    
    echo '<a href="main.php?method=check"><span class="m-left ' . ($id == 2 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['check_app_updates'] . '</span></a>';
    echo '<a href="update.php"><span class="m-left ' . ($id == 3 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['system_update'] . '</span></a>';

    if ($zbp->Config('AppCentre')->token) {
        echo '<a href="client.php"><span class="m-left ' . ($id == 9 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['my_store'] . '</span></a>';
    } else {
        echo '<a href="client.php"><span class="m-left ' . ($id == 9 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['login_store'] . '</span></a>';
    }

    if (!AppCentre_InSecurityMode()) {
        echo '<a href="setting.php"><span class="m-right ' . ($id == 4 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['settings'] . '</span></a>';
        echo '<a href="plugin_edit.php"><span class="m-right ' . ($id == 5 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['new_plugin'] . '</span></a>';
        echo '<a href="theme_edit.php"><span class="m-right ' . ($id == 6 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['new_theme'] . '</span></a>';
    }

    echo '<a href="security.php"><span class="m-right ' . ($id == 7 ? 'm-now' : '') . '">' . $zbp->lang['AppCentre']['safe_mode'] . '</span></a>';
}

function AppCentre_GetCheckQueryString($with_ignores = false)
{
    global $zbp;

    if(!is_array($zbp->Config('AppCentre')->app_ignores)) {
        $zbp->Config('AppCentre')->app_ignores = array();
    }
    $ia = $zbp->Config('AppCentre')->app_ignores;
    foreach($ia as $k=>$v){
        if($v == 'AppCentre'){
            unset($ia[$k]);
        }
    }
    if ($with_ignores == false) {
        $ia = array();
    }

    $check = '';
    $app = new app;
    if ($app->LoadInfoByXml('theme', $zbp->theme) == true && !in_array($zbp->theme, $ia)) {
        $app->modified = str_replace(array(':',';'), '', $app->modified);
        $app->version  = str_replace(array(':',';'), '', $app->version);
        $check .= $app->id . ':' . $app->modified . ':' . $app->version . ';';

    }
    foreach (explode('|', $zbp->option['ZC_USING_PLUGIN_LIST']) as $id) {
        $app = new app;
        if ($app->LoadInfoByXml('plugin', $id) == true && !in_array($id, $ia)) {
            $app->modified = str_replace(array(':',';'), '', $app->modified);
            $app->version  = str_replace(array(':',';'), '', $app->version);
            $check .= $app->id . ':' . $app->modified . ':' . $app->version . ';';
        }
    }
    return urlencode($check);
}

function AppCentre_GetAppsIgnoresString() {
    global $zbp;
    $c = '';
    if (is_array($zbp->Config('AppCentre')->app_ignores) && count($zbp->Config('AppCentre')->app_ignores) > 0) {
        $c = implode('|', $zbp->Config('AppCentre')->app_ignores);
    }
    return urlencode($c);
}

function Server_Open($method)
{
    global $zbp, $blogversion;

    switch ($method) {
        case 'down':
            if (!$zbp->ValidToken(GetVars('token', 'GET'), 'AppCentre')) {
                $zbp->ShowError(5, __FILE__, __LINE__);
                die();
            }
        
            Add_Filter_Plugin('Filter_Plugin_Zbp_ShowError', 'ScriptError', PLUGIN_EXITSIGNAL_RETURN);
            header('Content-type: application/x-javascript; Charset=utf-8');
            ob_clean();

            if (version_compare(PHP_VERSION, '5.3.0') < 0) {
                define('APPCENTRE_CAN_NOT_HTTPS', true);
            }

            if (stripos(APPCENTRE_URL, 'https://') === false && defined('APPCENTRE_CAN_NOT_HTTPS') === false) {
                $testhttps = Server_SendRequest(str_replace('http://', 'https://', APPCENTRE_URL) . 'testhttps.txt');
                if (!$testhttps) {
                    define('APPCENTRE_CAN_NOT_HTTPS', true);
                }
            }

            $s = Server_SendRequest(APPCENTRE_URL . '?down=' . GetVars('id', 'GET'));

            $xml = $s;
            $charset = array();
            $charset[1] = substr($xml, 0, 1);
            $charset[2] = substr($xml, 1, 1);
            if (ord($charset[1]) == 31 && ord($charset[2]) == 139) {
                $xml = gzdecode($xml);
            }
            $xml = @simplexml_load_string($xml, 'SimpleXMLElement', (LIBXML_COMPACT | LIBXML_PARSEHUGE));
            if ($xml === false) {
                $zbp->SetHint('bad', $zbp->lang['AppCentre']['app_download_failed']);
                $zbp->ShowError($zbp->lang['AppCentre']['app_download_failed'], __FILE__, __LINE__);
            }

            $id = $xml->id;

            if (!$zbp->CheckApp($id)) {
                AppCentre_CheckInSecurityMode();
            }

            if (App::UnPack($s)) {
                if (property_exists('App', 'check_error_count')) {
                    $i = App::$check_error_count;
                    if ($i > 0) {
                        $zbp->SetHint('bad', $i . $zbp->lang['AppCentre']['files_write_failed']);
                    }
                }
            
                $type = $xml['type'];
                $dir = $zbp->path . 'zb_users/' . $type . '/' . $id . '/';
                if (is_readable($dir . $type . '.xml')) {
                    $c = file_get_contents($dir . $type . '.xml');
                    if (stripos($c, '<pubdate>' . $xml->pubdate . '</pubdate>') !== false) {
                        if (in_array((string) $id, $zbp->GetPreActivePlugin()) == true) {
                            $zbp->cache->success_updated_app = (string) $id;
                            $zbp->SaveCache();
                        }
                        $zbp->SetHint('good', $zbp->lang['AppCentre']['download_successfully']);
                        die;
                    }
                }
                $zbp->SetHint('bad', $zbp->lang['AppCentre']['no_local_write_permission']);
            } else {
                $zbp->SetHint('bad', $zbp->lang['AppCentre']['app_decompression_failed']);
            }
            die();
            //break;
        case 'search':
            if (trim(GetVars('q', 'GET')) == '') {
                return;
            }

            $s = Server_SendRequest(APPCENTRE_URL . '?search=' . urlencode(GetVars('q', 'GET')) . '&' . GetVars('QUERY_STRING', 'SERVER'));
            $s = str_replace('%bloghost%', $zbp->host . 'zb_users/plugin/AppCentre/main.php', $s);
            echo str_replace('%csrf_token%', $zbp->GetToken('AppCentre'), $s);
            break;
        case 'view':
            $s = Server_SendRequest(APPCENTRE_URL . '?' . GetVars('QUERY_STRING', 'SERVER'));
            if (strpos($s, '<!--developer-nologin-->') !== false) {
                if ($zbp->Config('AppCentre')->token) {
                    $zbp->Config('AppCentre')->token = '';
                    $zbp->SaveConfig('AppCentre');
                }
            }
            if (strpos($s, APPCENTRE_DOMAIN) === false) {
                $zbp->ShowHint('bad', str_replace(array('%s1', '%s2'), array(APPCENTRE_DOMAIN, str_replace(array( str_replace('app.', '', APPCENTRE_DOMAIN),'|'), '', APPCENTRE_DOMAINS)), $zbp->lang['AppCentre']['client_access_to_store_failure']));
            }
            $s = str_replace('%bloghost%', $zbp->host . 'zb_users/plugin/AppCentre/main.php', $s);
            echo str_replace('%csrf_token%', $zbp->GetToken('AppCentre'), $s);
            break;
        case 'cmd':
            header('Content-type: application/x-javascript; Charset=utf-8');
            ob_clean();
            $request_url = APPCENTRE_CMD_URL . http_build_query($_GET);
            $s = Server_SendRequest($request_url);
            echo $s;
            die;
            //break;
        case 'check':
            $s = Server_SendRequest(APPCENTRE_URL . '?check=' . AppCentre_GetCheckQueryString() . '&ignores=' . AppCentre_GetAppsIgnoresString());
            $s = str_replace('%bloghost%', $zbp->host . 'zb_users/plugin/AppCentre/main.php', $s);
            echo str_replace('%csrf_token%', $zbp->GetToken('AppCentre'), $s);
            break;
        case 'checksilent':
            header('Content-type: application/x-javascript; Charset=utf-8');
            ob_clean();
            $s = Server_SendRequest(APPCENTRE_URL . '?blogsilent=1' . ($zbp->Config('AppCentre')->checkbeta ? '&betablog=1' : '') . '&check=' . AppCentre_GetCheckQueryString(true) . '&ignores=' . AppCentre_GetAppsIgnoresString());
            if (strpos($s, ';') !== false) {
                $newversion = SplitAndGet($s, ';', 0);
                $s = str_replace(($newversion . ';'), '', $s);
                if ((int) $newversion > (int) $blogversion) {
                    echo '$(".main").prepend("<div class=\'hint\'><p class=\'hint hint_tips\'>' . $zbp->lang['AppCentre']['tips_system_updated'] . $newversion . ($zbp->Config('AppCentre')->checkbeta ? ' (Beta)' : '') . '</p></div>");';
                }
            }
            if ($s != 0) {
                echo '$(".main").prepend("<div class=\'hint\'><p class=\'hint hint_tips\'>' . str_replace('%n', $s, $zbp->lang['AppCentre']['tips_app_updated']) . '</p></div>");';
            }
            die();
            //break;
        case 'login':
            $data = array();
            $data["token"] = GetVars("app_token", "POST");
            $data["sign"] = AppCentre_Get_Sign(GetVars("app_token", "POST"));
            $s = Server_SendRequest(APPCENTRE_URL . '?login', $data);
            return $s;
            //break;
        case 'logout':
            $s = Server_SendRequest(APPCENTRE_URL . '?logout');
            return $s;
            //break;
        case 'submitpre':
            $s = Server_SendRequest(APPCENTRE_URL . '?submitpre=' . urlencode(GetVars('id')));
            return $s;
        case 'submit':
            $app = new App;
            $app->LoadInfoByXml($_GET['type'], $_GET['id']);
            $data["zba"] = $app->Pack();
            $s = Server_SendRequest(APPCENTRE_URL . '?submit=' . urlencode(GetVars('id')), $data);
            return $s;
        case 'shopvaild':
            $data = array();
            $data["shop_username"] = GetVars("shop_username");
            $data["shop_password"] = md5(GetVars("shop_password"));
            $s = Server_SendRequest(APPCENTRE_URL . '?shopvaild', $data);
            return $s;
            //break;
        case 'shoplist':
            $s = Server_SendRequest(APPCENTRE_URL . '?shoplist');
            $s = str_replace('%bloghost%', $zbp->host . 'zb_users/plugin/AppCentre/main.php', $s);
            echo str_replace('%csrf_token%', $zbp->GetToken('AppCentre'), $s);
            break;
        case 'apptype':
            $zbp->Config('AppCentre')->apptype = GetVars("type");
            $zbp->SaveConfig('AppCentre');
            Redirect('main.php');
            break;
        default:
            # code...
            break;
    }
}

function Server_SendRequest($url, $data = array(), $u2 = '', $c2 = '')
{
    global $zbp;

    $c = AppCentre_Get_Cookies();
    $u = AppCentre_Get_UserAgent();
    if ($u2 != '') {
        $u .= ' ' . $u2;
    }
    if ($c2 != '') {
        $c .= ' ;' . $c2;
    }

    if (class_exists('Network')) {
        return Server_SendRequest_Network($url, $data, $u, $c);
    }

    if (function_exists("curl_init") && function_exists('curl_exec')) {
        return Server_SendRequest_CUrl($url, $data, $u, $c);
    }

    if (!ini_get("allow_url_fopen")) {
        return "";
    }
    return "";
}

function Server_SendRequest_CUrl($url, $data = array(), $u = null, $c = null)
{
    global $zbp;

    $ch = curl_init($url);
    if (extension_loaded('zlib')) {
        curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    if (isset($_SERVER['HTTP_ACCEPT'])) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: ' . $_SERVER['HTTP_ACCEPT']));
    }
    curl_setopt($ch, CURLOPT_USERAGENT, $u);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    if (ini_get("safe_mode") == false) {
        curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    }
    if ($c) {
        curl_setopt($ch, CURLOPT_COOKIE, $c);
    }

    if ($data) {
        //POST
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    } else {
        //GET
        $i = 0;
    }

    $r = curl_exec($ch);
    curl_close($ch);

    return $r;
}

function Server_SendRequest_Network($url, $data = array(), $u = null, $c = null)
{
    global $zbp;
    $ajax = Network::Create(trim($zbp->Config('AppCentre')->networktype));
    if (!$ajax) {
        throw new Exception($zbp->lang['AppCentre']['does_not_access_networks']);
    }

    if ($data) {
//POST
        $ajax->open('POST', $url);
        $ajax->enableGzip();
        $ajax->setTimeOuts(120, 120, 0, 0);
        $ajax->setRequestHeader('User-Agent', $u);
        $ajax->setRequestHeader('Cookie', $c);
        $ajax->setRequestHeader('Website', $zbp->host);
        if (isset($_SERVER['HTTP_ACCEPT'])) {
            $ajax->setRequestHeader('Accept', $_SERVER['HTTP_ACCEPT']);
        }
        $ajax->send($data);
    } else {
        $ajax->open('GET', $url);
        $ajax->enableGzip();
        $ajax->setTimeOuts(120, 120, 0, 0);
        $ajax->setRequestHeader('User-Agent', $u);
        $ajax->setRequestHeader('Cookie', $c);
        $ajax->setRequestHeader('Website', $zbp->host);
        if (isset($_SERVER['HTTP_ACCEPT'])) {
            $ajax->setRequestHeader('Accept', $_SERVER['HTTP_ACCEPT']);
        }
        if (defined('APPCENTRE_CAN_NOT_HTTPS')) {
            $ajax->setRequestHeader('nohttps', 'true');
        }
        $ajax->send();

        $i = 0;
        while ($i < 3 && ($ajax->status == 301 || $ajax->status == 302)) {
            $i = ($i + 1);
            $ajax->open('GET', $ajax->getResponseHeader('location'));
            $ajax->enableGzip();
            $ajax->setTimeOuts(120, 120, 0, 0);
            $ajax->setRequestHeader('User-Agent', $u);
            $ajax->setRequestHeader('Cookie', $c);
            $ajax->setRequestHeader('Website', $zbp->host);
            if (isset($_SERVER['HTTP_ACCEPT'])) {
                $ajax->setRequestHeader('Accept', $_SERVER['HTTP_ACCEPT']);
            }
            if (defined('APPCENTRE_CAN_NOT_HTTPS')) {
                $ajax->setRequestHeader('nohttps', 'true');
            }
            $ajax->send();
        }
    }

    return $ajax->responseText;
}

function AppCentre_CreateOptionsOfVersion($default)
{
    global $zbp;

    $s = null;
    $array = $GLOBALS['zbpvers'];
    krsort($array);
    $i = 0;
    foreach ($array as $key => $value) {
        $i += 1;
        if (($i == 1) || strpos($value, 'Beta') === false) {
            $s .= '<option value="' . $key . '" ' . ($default == $key ? 'selected="selected"' : '') . ' >' . $value . '</option>';
        }
    }
    return $s;
}

function AppCentre_GetHttpContent($url)
{
    global $zbp;
    $ajax = Network::Create(trim($zbp->Config('AppCentre')->networktype));
    if (!$ajax) {
        return;
    }
    $c = AppCentre_Get_Cookies();
    $u = AppCentre_Get_UserAgent();

    $ajax->open('GET', $url);
    $ajax->enableGzip();
    $ajax->setTimeOuts(60, 60, 0, 0);
    $ajax->setRequestHeader('User-Agent', $u);
    $ajax->setRequestHeader('Cookie', $c);
    $ajax->setRequestHeader('Website', $zbp->host);
    $ajax->send();

    return ($ajax->status == 200) ? $ajax->responseText : null;
}

function AppCentre_crc32_signed($num)
{
    $crc = crc32($num);
    if (($crc & 0x80000000)) {
        $crc ^= 0xffffffff;
        $crc += 1;
        $crc = (0 - $crc);
    }
    return $crc;
}

$AppCentre_dirs = array();
$AppCentre_files = array();

function AppCentre_GetAllFileDir($dir)
{
    global $AppCentre_dirs;
    global $AppCentre_files;
    if (function_exists('scandir')) {
        foreach (scandir($dir) as $d) {
            if (is_dir($dir . $d)) {
                if (substr($d, 0, 1) != '.') {
                    AppCentre_GetAllFileDir($dir . $d . '/');
                    $AppCentre_dirs[] = $dir . $d . '/';
                }
            } else {
                $AppCentre_files[] = $dir . $d;
            }
        }
    } else {
        if ($handle = opendir($dir)) {
            while (false !== ($file = readdir($handle))) {
                if (substr($file, 0, 1) != '.') {
                    if (is_dir($dir . $file)) {
                        $AppCentre_dirs[] = $dir . $file . '/';
                        AppCentre_GetAllFileDir($dir . $file . '/');
                    } else {
                        $AppCentre_files[] = $dir . $file;
                    }
                }
            }
            closedir($handle);
        }
    }
}

function AppCentre_Pack($app, $gzip)
{
    $s = $app->Pack();

    if ($gzip) {
        return gzencode($s, 9, FORCE_GZIP);
    } else {
        return $s;
    }
}

function AppCentre_PHPVersion($default)
{
    global $zbp;

    $s = null;
    $array = array(
        '5.2' => '5.2',
        '5.3' => '5.3',
        '5.4' => '5.4',
        '5.5' => '5.5',
        '5.6' => '5.6',
        '7.0' => '7.0',
        '7.1' => '7.1',
        '7.2' => '7.2',
        '7.3' => '7.3',
        '7.4' => '7.4',
        '8.0' => '8.0'
    );
    $i = 0;
    foreach ($array as $key => $value) {
        $s .= '<option value="' . $key . '" ' . ($default == $key ? 'selected="selected"' : '') . ' >' . $value . '</option>';
    }
    return $s;
}
