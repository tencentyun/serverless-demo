<?php
require '../../../zb_system/function/c_system_base.php';

require '../../../zb_system/function/c_system_admin.php';

if ($blogversion <= 151626) {
    if (class_exists('Network', false) == false) {
        AutoloadClass('Network');
        include dirname(__FILE__) . '/networkcurl.php';
        include dirname(__FILE__) . '/networkfile_get_contents.php';
        include dirname(__FILE__) . '/networkfsockopen.php';
    }
}
require dirname(__FILE__) . '/function.php';

$zbp->Load();

$t = '&token=' . $zbp->GetToken('AppCentre');

$action = 'root';
if (!$zbp->CheckRights($action)) {
    $zbp->ShowError(6);
    die();
}

if (!$zbp->CheckPlugin('AppCentre')) {
    $zbp->ShowError(48);
    die();
}

$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['system_update'];

$checkbegin = false;
$nowxml = '';

ZBlogException::SuspendErrorHook();
$old1 = @$zbp->db->Query("select {$datainfo['Tag']['Type'][0]} from {$table['Tag']} limit 1");
$old2 = @$zbp->db->Query("select {$datainfo['Category']['Type'][0]} from {$table['Category']} limit 1");
if (count($old1) == 1 && $old1[0] === false) {
    $old1 = true;
}
if (count($old2) == 1 && $old2[0] === false) {
    $old2 = true;
}
if ($old1 === true || $old2 === true) {
    updatedb_common();
}
ZBlogException::ResumeErrorHook();

function updatedb_common()
{
    global $zbp, $table;
    @$zbp->db->Query("ALTER TABLE " . $table['Tag'] . " ADD  tag_Type integer NOT NULL DEFAULT 0;");
    @$zbp->db->Query("ALTER TABLE " . $table['Category'] . " ADD  cate_Type integer NOT NULL DEFAULT 0;");
}

function updatedb_15to16()
{
    global $zbp, $table;
    ZBlogException::SuspendErrorHook();
    if ($zbp->db->type == 'mysql') {
        $zbp->db->Query("ALTER TABLE " . $table['Tag'] . " ADD  `tag_Type` TINYINT NOT NULL DEFAULT '0';");
        $zbp->db->Query("ALTER TABLE " . $table['Category'] . " ADD  `cate_Type` TINYINT NOT NULL DEFAULT '0';");
    } elseif ($zbp->db->type == 'sqlite') {
        $zbp->db->Query("ALTER TABLE " . $table['Tag'] . " ADD  tag_Type integer NOT NULL DEFAULT 0;");
        $zbp->db->Query("ALTER TABLE " . $table['Category'] . " ADD  cate_Type integer NOT NULL DEFAULT 0;");
    }
    if ($zbp->db->type == 'mysql') {
        $zbp->db->Query("ALTER TABLE " . $table['Post'] . " MODIFY  `log_Template` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Category'] . " MODIFY  `cate_Template` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Category'] . " MODIFY  `cate_LogTemplate` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " MODIFY  `comm_Name` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " MODIFY  `comm_Email` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " MODIFY  `comm_IP` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Config'] . " MODIFY  `conf_Name` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Config'] . " MODIFY  `conf_Value` LONGTEXT NOT NULL;");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_Name` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_Password` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_Email` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_IP` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_Alias` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " MODIFY  `mem_Template` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Module'] . " MODIFY  `mod_FileName` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Module'] . " MODIFY  `mod_HtmlID` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Module'] . " MODIFY  `mod_Source` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Tag'] . " MODIFY  `tag_Template` VARCHAR( 255 ) NOT NULL DEFAULT '';");
        $zbp->db->Query("ALTER TABLE " . $table['Upload'] . " MODIFY  `ul_MimeType` VARCHAR( 255 ) NOT NULL DEFAULT '';");
    }
    if ($zbp->db->type == 'mysql') {
        @$zbp->db->Query("ALTER TABLE " . $table['Post'] . " DROP INDEX  " . $zbp->db->dbpre . "log_VTSC ;");
    }
    ZBlogException::ResumeErrorHook();
    $zbp->option['ZC_LAST_VERSION'] = 162090;
    $zbp->SaveOption();
    //$zbp->SetHint('good');
    //Redirect('./update.php?ok');return;
}

function updatedb_14to15()
{
    global $zbp, $table;

    if ($zbp->db->type == 'mysql') {
        $zbp->db->Query("ALTER TABLE " . $table['Post'] . " DROP INDEX  " . $zbp->db->dbpre . "log_TISC ;");
        $zbp->db->Query("ALTER TABLE " . $table['Post'] . " DROP INDEX  " . $zbp->db->dbpre . "log_PT ;");
        $zbp->db->Query("ALTER TABLE " . $table['Post'] . " ADD INDEX  " . $zbp->db->dbpre . "log_TPISC(log_Type,log_PostTime,log_IsTop,log_Status,log_CateID) ;");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " DROP INDEX  " . $zbp->db->dbpre . "comm_PT ;");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " DROP INDEX  " . $zbp->db->dbpre . "comm_RIL ;");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " ADD INDEX  " . $zbp->db->dbpre . "comm_LRI(comm_LogID,comm_RootID,comm_IsChecking) ;");
        $zbp->db->Query("ALTER TABLE " . $table['Comment'] . " ADD INDEX  " . $zbp->db->dbpre . "comm_IsChecking(comm_IsChecking) ;");
        $zbp->db->Query("ALTER TABLE " . $table['Category'] . " ADD INDEX  " . $zbp->db->dbpre . "cate_Order(cate_Order) ;");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " ADD INDEX  " . $zbp->db->dbpre . "mem_Alias(mem_Alias) ;");
        $zbp->db->Query("ALTER TABLE " . $table['Member'] . " ADD INDEX  " . $zbp->db->dbpre . "mem_Level(mem_Level) ;");
    } elseif ($zbp->db->type == 'sqlite') {
        $zbp->db->Query("CREATE INDEX " . $zbp->db->dbpre . "cate_Order on " . $table['Category'] . "(cate_Order) ;");
        $zbp->db->Query("CREATE INDEX " . $zbp->db->dbpre . "mem_Alias on " . $table['Member'] . "(mem_Alias) ;");
    }
    if ($zbp->db->type == 'mysql' || $zbp->db->type == 'sqlite') {
        $zbp->db->DelTable($GLOBALS['table']['Config']);
        $s = $zbp->db->sql->CreateTable($GLOBALS['table']['Config'], $GLOBALS['datainfo']['Config']);
        $zbp->db->QueryMulit($s);
        if ($zbp->db->type == 'mysql') {
            $zbp->db->Query("ALTER TABLE " . $GLOBALS['table']['Config'] . " ADD INDEX  " . $zbp->db->dbpre . "conf_Name(conf_Name) ;");
        } elseif ($zbp->db->type == 'sqlite') {
            $zbp->db->Query("CREATE INDEX " . $zbp->db->dbpre . "conf_Name on " . $GLOBALS['table']['Config'] . "(conf_Name) ;");
        }
        array_unshift($zbp->configs, $zbp->configs['system'], $zbp->configs['cache']);
        foreach ($zbp->configs as $c) {
            $c->Save();
        }
    }
    $zbp->option['ZC_LAST_VERSION'] = 150101;
    $zbp->SaveOption();
    //$zbp->SetHint('good');
    //Redirect('./update.php?ok');return;
}

if (isset($_GET['updatedb'])) {
    if ($zbp->version >= 150101 && $zbp->version < 170000 && (int) $zbp->option['ZC_LAST_VERSION'] < 150101) {
        updatedb_14to15();
    }
    if ($zbp->version >= 162090 && $zbp->version < 170000 && (int) $zbp->option['ZC_LAST_VERSION'] < 162090) {
        updatedb_15to16();
    }
    if (defined(ZC_VERSION_MAJOR) && defined(ZC_VERSION_MINOR)) {
        if (ZC_VERSION_MAJOR === '1' && ZC_VERSION_MINOR === '5') {
            if (is_dir($zbp->path . '/zb_system/api')) {
                @rrmdir($zbp->path . '/zb_system/api'); // Fix bug!!!
            }
        }
    }

    $zbp->SetHint('good');
    Redirect('./update.php?ok');
    return;
}

if (GetVars('update', 'GET') != '') {
    $url = APPCENTRE_SYSTEM_UPDATE . '' . GetVars('update', 'GET') . '.xml';
    $f = AppCentre_GetHttpContent($url);
    $xml = simplexml_load_string($f);
    if ($xml) {
        foreach ($xml->children() as $file) {
            $full = $zbp->path . str_replace('\\', '/', $file['name']);
            $dir = dirname($full);
            if (!file_exists($dir . '/')) {
                @mkdir($dir, 0755, true);
            }

            $f = base64_decode($file);
            @file_put_contents($full, $f);
        }
        $zbp->SetHint('good');
    }
    Redirect('./update.php?updatedb');
}

if (GetVars('restore', 'GET') != '') {
    $file = base64_decode(GetVars('restore', 'GET'));
    $file = str_replace('\\', '/', $file);
    $hash = 'hash' . strtoupper(GetVars('hash', 'GET'));

    $url = APPCENTRE_SYSTEM_UPDATE . '' . $GLOBALS['blogversion'] . '/' . $file;
    $f = AppCentre_GetHttpContent($url);

    $f2 = $f;
    $crc32 = substr(strtoupper(dechex(AppCentre_crc32_signed($f2))), -8);
    $md5 = strtoupper(md5($f2));
    $f2 = str_replace("\r\n", "\r", $f2);
    $f2 = str_replace("\n", "\r", $f2);
    $md5_r = strtoupper(md5($f2));
    $f2 = str_replace("\r", "\n", $f2);
    $md5_n = strtoupper(md5($f2));

    if (stripos($hash, $crc32) === false && stripos($hash, $md5) === false && stripos($hash, $md5_r) === false && stripos($hash, $md5_n) === false) {
        die;
    }

    $file = $zbp->path . str_replace('\\', '/', $file);
    $dir = dirname($file);
    if (!file_exists($dir . '/')) {
        @mkdir($dir, 0755, true);
    }

    @file_put_contents($file, $f);
    echo '<img src="' . $zbp->host . 'zb_system/image/admin/ok.png" width="16" alt="" />';
    die();
}

if (GetVars('check', 'GET') == 'now') {
    $r = AppCentre_GetHttpContent(APPCENTRE_SYSTEM_UPDATE . $zbp->version . '.xml');
    //file_put_contents($zbp->usersdir . 'cache/now.xml', $r);
    $nowxml = $r;
    $checkbegin = true;
}

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';

$newversion_json = Server_SendRequest(APPCENTRE_SYSTEM_UPDATE . 'check/' . ($zbp->Config('AppCentre')->checkbeta == true ? 'beta/' : ''));
$newversion_json = json_decode($newversion_json);
if (!is_object($newversion_json)) {
    $newversion = $blogversion;
    $nowbuild = (int) $blogversion;
    $newbuild = (int) substr($newversion, (strrpos($newversion, ' ') + 1));
} else {
    $newversion = $newversion_json->target->name . ' Build ' . $newversion_json->target->build;
    $nowbuild = (int) $newversion_json->source->build;
    $newbuild = (int) $newversion_json->target->build;
    if ($nowbuild == 0) {
        $nowbuild = (int) $blogversion;
    }
}
?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(3); ?></div>
  <div id="divMain2">

            <form method="post" action="">

<p>
<?php
if ($zbp->version >= 150101 && (int) $zbp->option['ZC_LAST_VERSION'] < 150101) {
    echo '<input id="updatenow" type="button" onclick="location.href=\'?updatedb\'" value="' . $zbp->lang['AppCentre']['database_update'] . '" />';
}
if ($zbp->version >= 162090 && (int) $zbp->option['ZC_LAST_VERSION'] < 162090) {
    echo '<input id="updatenow" type="button" onclick="location.href=\'?updatedb\'" value="' . $zbp->lang['AppCentre']['database_update'] . '" />';
}
?>
              </p><hr/>

              <table border="1" width="100%" cellspacing="0" cellpadding="0" class="tableBorder tableBorder-thcenter">
                <tr>
                  <th width='50%'><?php echo $zbp->lang['AppCentre']['current_version']; ?></th>
                  <th><?php echo $zbp->lang['AppCentre']['latest_version']; ?></th>
                </tr>
                <tr>
                  <td align='center' id='now'>Z-BlogPHP 
<?php
if (defined('ZC_VERSION_FULL')) {
    echo ZC_VERSION_FULL;
} else {
    echo ZC_BLOG_VERSION;
}
?>
</td>
                  <td align='center' id='last'>Z-BlogPHP <?php echo $newversion; ?></td>
                </tr>
              </table>
              <p>

<?php
if (($newbuild - $nowbuild) > 0) {
    echo '<input id="updatenow" type="button" onclick="location.href=\'?update=' . $nowbuild . '-' . $newbuild . '\'" value="' . $zbp->lang['AppCentre']['upgrade_program'] . '" />';
}
?>
              </p>
              <hr/>
              <div class="divHeader"><?php echo $zbp->lang['AppCentre']['verify_core_file']; ?>&nbsp;&nbsp;<span id="checknow"><a href="?check=now" title="<?php echo $zbp->lang['AppCentre']['start_check']; ?>"><img src="images/refresh.png" width="16" alt="<?php echo $zbp->lang['AppCentre']['check']; ?>" /></a></span></div>
              <table border="1" width="100%" cellspacing="0" cellpadding="0" class="tableBorder tableBorder-thcenter">
                <tr>
                  <th width='78%'><?php echo $zbp->lang['AppCentre']['filename']; ?></th>
                  <th id="_s"><?php echo $zbp->lang['AppCentre']['states']; ?></th>
                </tr>
<?php
$i = 0;
//if (file_exists($zbp->usersdir . 'cache/now.xml')) {
if ($nowxml != '') {
    $i = 0;
    libxml_use_internal_errors(true);
    //$xml=simplexml_load_file($zbp->usersdir . 'cache/now.xml');
    $xml = simplexml_load_string($nowxml);
    if ($xml) {
        foreach ($xml->children() as $file) {
            if (file_exists($f = $zbp->path . str_replace('\\', '/', $file['name']))) {
                $f = file_get_contents($f);
                $newcrc32 = substr(strtoupper(dechex(AppCentre_crc32_signed($f))), -8);
                $md5 = strtoupper(md5($f));
                $f = str_replace("\r\n", "\r", $f);
                $f = str_replace("\n", "\r", $f);
                $md5_r = strtoupper(md5($f));
                $f = str_replace("\r", "\n", $f);
                $md5_n = strtoupper(md5($f));
            } else {
                $newcrc32 = '';
                $md5 = '';
                $md5_r = '';
                $md5_n = '';
            }

            $ar = array($file['crc32'],$file['md5'],$file['md5_r'],$file['md5_n']);

            if (in_array($newcrc32, $ar) || in_array($md5, $ar) || in_array($md5_r, $ar) || in_array($md5_n, $ar)) {
                echo '<tr style="display:none;"><td><b>' . str_replace('\\', '/', $file['name']) . '</b></td>';
                $s = '<img src="' . $zbp->host . 'zb_system/image/admin/ok.png" width="16" alt="" />';
            } else {
                $i += 1;
                echo '<tr><td><b>' . str_replace('\\', '/', $file['name']) . '</b></td>';
                $s = '<a href="javascript:void(0)" onclick="restore(\'' . base64_encode($file['name']) . '\',\'file' . md5($file['name']) . '\',\'' . $file['crc32'] . $file['md5'] . $file['md5_r'] . $file['md5_n'] . '\')" class="resotrefile button" title="还原系统文件"><img src="' . $zbp->host . 'zb_system/image/admin/exclamation.png" width="16" alt=""></a>';
            }
            echo '<td class="tdCenter" id="file' . md5($file['name']) . '">' . $s . '</td></tr>';
        }
    }
    echo '<tr><th colspan="2">' . $i . $zbp->lang['AppCentre']['automatically_update_files'] . '.</tr>';
    //@unlink($zbp->usersdir . 'cache/now.xml');
}
?>

              </table>
<?php if ($i > 0) { ?>
              <p>
                <input name="submit" type="button" id="autorestor" onclick="restoreauto();$(this).hide();" value="<?php echo $zbp->lang['AppCentre']['automatically_update_files']; ?>" class="button" />
              </p>
    <?php
}
?>
              <p> </p>
            </form>
<script type="text/javascript">

$("#autorestor").bind('click', function(){restoresingle();$(this).hide()});

function restoresingle(){
  if($("a.resotrefile").get(0)){
    $("a.resotrefile").get(0).click();
    setTimeout("restoresingle()",1000);
  }
}


function restore(f,id,hash){
    $.get(bloghost+"zb_users/plugin/AppCentre/update.php?restore="+f+"&hash="+hash, function(data){
        //alert(data);
        $('#'+id).html(data);
    });
}
</script>
    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>


<?php
require $blogpath . 'zb_system/admin/admin_footer.php';
ZBlogException::SuspendErrorHook();
if ($zbp->db->type == 'mysql') {
    @$zbp->db->Query("ALTER TABLE " . $table['Post'] . " DROP INDEX  " . $zbp->db->dbpre . "log_VTSC ;");
}
ZBlogException::ResumeErrorHook();
RunTime();