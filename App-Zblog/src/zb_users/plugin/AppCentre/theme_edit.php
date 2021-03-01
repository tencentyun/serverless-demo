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

if (!$zbp->ValidToken(GetVars('token', 'GET'), 'AppCentre') && GetVars('id', 'GET')) {
    $zbp->ShowError(5, __FILE__, __LINE__);
    die();
}

AppCentre_CheckInSecurityMode();

$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['edit_app'];

if (GetVars('id')) {
    $app = $zbp->LoadApp('theme', GetVars('id'));
    $mt = array();
    $ft = GetFilesInDir($zbp->path . '/zb_users/theme/' . $app->id . '/', 'php|inc|png');
    foreach ($ft as $f) {
        $mt[] = filemtime($f);
    }
    $ft = GetFilesInDir($zbp->path . '/zb_users/theme/' . $app->id . '/include/', 'php|inc|png');
    foreach ($ft as $f) {
        $mt[] = filemtime($f);
    }
    $ft = GetFilesInDir($zbp->path . '/zb_users/theme/' . $app->id . '/style/', 'php|inc|png');
    foreach ($ft as $f) {
        $mt[] = filemtime($f);
    }
    $ft = GetFilesInDir($zbp->path . '/zb_users/theme/' . $app->id . '/template/', 'php|inc|png');
    foreach ($ft as $f) {
        $mt[] = filemtime($f);
    }
    $ft = GetFilesInDir($zbp->path . '/zb_users/theme/' . $app->id . '/source/', 'php|inc|png');
    foreach ($ft as $f) {
        $mt[] = filemtime($f);
    }
    rsort($mt);
    if (count($mt) == 0) {
        $mt[] = time();
    }

    $app->modified = date('Y-m-d', reset($mt));
} else {
    $app = new App;
    $app->price = 0;
    $app->version = '1.0';
    $app->pubdate = date('Y-m-d', time());
    $app->modified = date('Y-m-d', time());
    $v = array_keys($zbpvers);
    //$app->adapted = (string) end($v);
    $app->adapted = $GLOBALS['blogversion'];
    $app->type = 'theme';
}

if (count($_POST) > 0) {
    if (!$zbp->ValidToken(GetVars('token', 'POST'), 'AppCentre')) {
        $zbp->ShowError(5, __FILE__, __LINE__);
        die();
    }

    $app->id = trim($_POST['app_id']);
    if (!CheckRegExp($app->id, "/^[A-Za-z0-9_]{3,30}$/")) {
        $zbp->ShowError($zbp->lang['AppCentre']['app_id_name_rule']);
        die();
    }
    if (!GetVars('id')) {
        $app2 = $zbp->LoadApp('theme', $app->id);
        if (property_exists($app2, 'isloaded') && $app2->isloaded) {
            $zbp->ShowError($zbp->lang['AppCentre']['app_with_same_name']);
            die();
        }
        @mkdir($zbp->usersdir . 'theme/' . $app->id);
        @mkdir($zbp->usersdir . 'theme/' . $app->id . '/style');
        @mkdir($zbp->usersdir . 'theme/' . $app->id . '/compile');
        @mkdir($zbp->usersdir . 'theme/' . $app->id . '/template');
        @mkdir($zbp->usersdir . 'theme/' . $app->id . '/include');
        @mkdir($zbp->usersdir . 'theme/' . $app->id . '/script');
        @copy($zbp->usersdir . 'plugin/AppCentre/images/theme.png', $zbp->usersdir . 'theme/' . $app->id . '/screenshot.png');
        @file_put_contents($zbp->usersdir . 'theme/' . $app->id . '/style/style.css', '');

        if (trim($_POST['app_path'])) {
            $file = file_get_contents('tpl/main.html');
            $file = str_replace("<%appid%>", $app->id, $file);
            $file = str_replace("<%appname%>", trim($_POST['app_name']), $file);
            $path = $zbp->usersdir . 'theme/' . $app->id . '/' . trim($_POST['app_path']);
            @file_put_contents($path, $file);
        }
        if (trim($_POST['app_include'])) {
            $file = file_get_contents('tpl/include.html');
            $file = str_replace("<%appid%>", $app->id, $file);
            $path = $zbp->usersdir . 'theme/' . $app->id . '/include.php';
            @file_put_contents($path, $file);
        }
    }

    $app->name = trim($_POST['app_name']);
    $app->url = trim($_POST['app_url']);
    $app->note = trim($_POST['app_note']);
    $app->adapted = $_POST['app_adapted'];

    if (isset($_POST['app_version'])) {
        $app->version = (float) $_POST['app_version'];
    } else {
        $app->version = trim((int) $_POST['app_version1']) . '.' . trim((int) $_POST['app_version2']);
        if (trim($_POST['app_version3']) != null) {
            $app->version .= '.' . trim((int) $_POST['app_version3']);
        }
    }

    if ($app->version === 1) {
        $app->version = '1.0';
    }

    $app->pubdate = date('Y-m-d', strtotime($_POST['app_pubdate']));
    $app->modified = date('Y-m-d', time());

    $app->author_name = trim($_POST['app_author_name']);
    $app->author_email = trim($_POST['app_author_email']);
    $app->author_url = trim($_POST['app_author_url']);
    $app->source_name = trim($_POST['app_source_name']);
    $app->source_email = trim($_POST['app_source_email']);
    $app->source_url = trim($_POST['app_source_url']);

    $app->path = trim($_POST['app_path']);
    $app->include = trim($_POST['app_include']);
    $app->level = (int) $_POST['app_level'];
    $app->price = (float) $_POST['app_price'];

    if (property_exists($app, 'phpver')) {
        $app->phpver = trim($_POST['app_phpver']);
    }
    if (property_exists($app, 'advanced_existsfunctions')) {
        $app->advanced_existsfunctions = trim($_POST['app_advanced_existsfunctions']);
    }

    $app->advanced_dependency = trim($_POST['app_advanced_dependency']);
    $app->advanced_conflict = trim($_POST['app_advanced_conflict']);
    $app->advanced_rewritefunctions = trim($_POST['app_advanced_rewritefunctions']);

    $app->description = trim($_POST['app_description']);

    if (GetVars('app_sidebars_sidebar1')) {
        $app->sidebars_sidebar1 = $zbp->option['ZC_SIDEBAR_ORDER'];
    } else {
        $app->sidebars_sidebar1 = '';
    }
    if (GetVars('app_sidebars_sidebar2')) {
        $app->sidebars_sidebar2 = $zbp->option['ZC_SIDEBAR2_ORDER'];
    } else {
        $app->sidebars_sidebar2 = '';
    }
    if (GetVars('app_sidebars_sidebar3')) {
        $app->sidebars_sidebar3 = $zbp->option['ZC_SIDEBAR3_ORDER'];
    } else {
        $app->sidebars_sidebar3 = '';
    }
    if (GetVars('app_sidebars_sidebar4')) {
        $app->sidebars_sidebar4 = $zbp->option['ZC_SIDEBAR4_ORDER'];
    } else {
        $app->sidebars_sidebar4 = '';
    }
    if (GetVars('app_sidebars_sidebar5')) {
        $app->sidebars_sidebar5 = $zbp->option['ZC_SIDEBAR5_ORDER'];
    } else {
        $app->sidebars_sidebar5 = '';
    }
    if (GetVars('app_sidebars_sidebar6')) {
        $app->sidebars_sidebar6 = $zbp->option['ZC_SIDEBAR6_ORDER'];
    } else {
        $app->sidebars_sidebar6 = '';
    }
    if (GetVars('app_sidebars_sidebar7')) {
        $app->sidebars_sidebar7 = $zbp->option['ZC_SIDEBAR7_ORDER'];
    } else {
        $app->sidebars_sidebar7 = '';
    }
    if (GetVars('app_sidebars_sidebar8')) {
        $app->sidebars_sidebar8 = $zbp->option['ZC_SIDEBAR8_ORDER'];
    } else {
        $app->sidebars_sidebar8 = '';
    }
    if (GetVars('app_sidebars_sidebar9')) {
        $app->sidebars_sidebar9 = $zbp->option['ZC_SIDEBAR9_ORDER'];
    } else {
        $app->sidebars_sidebar9 = '';
    }

    $app->SaveInfoByXml();

    $t = '&token=' . $zbp->GetToken('AppCentre');
    $zbp->SetHint('good', '<a href="submit.php?type=theme&id=' . $app->id . $t . '">' . $zbp->lang['AppCentre']['submitted successfully'] . '</a>');
    Redirect($_SERVER["HTTP_REFERER"]);
}

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';

?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(GetVars('id', 'GET') == '' ? 6 : ''); ?></div>
  <div id="divMain2">

<form method="post" action="">
<?php echo '<input id="token" name="token" type="hidden" value="' . $zbp->GetToken('AppCentre') . '"/>'; ?>
  <table border="1" width="100%" cellspacing="0" cellpadding="0" class="tableBorder tableBorder-thcenter">
    <tr>
      <th width='28%'>&nbsp;</th>
      <th>&nbsp;</th>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_id']; ?></b><br/>
          <span class="note">&nbsp;&nbsp;<?php echo $zbp->lang['AppCentre']['app_id_note']; ?></span></p></td>
      <td><p>&nbsp;
          <input id="app_id" name="app_id" style="width:550px;"  type="text" value="<?php echo $app->id; ?>" <?php echo ($app->id) ? 'readonly="readonly"' : ''; ?> />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_name']; ?></b></b></p></td>
      <td><p>&nbsp;
          <input id="app_name" name="app_name" style="width:550px;"  type="text" value="<?php echo $app->name; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['publish_url']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_url" name="app_url" style="width:550px;"  type="text" value="<?php echo $app->url; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_intro']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_note" name="app_note" style="width:550px;"  type="text" value="<?php echo $app->note; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['adapted_zblog_version']; ?></b></p></td>
      <td><p>&nbsp;
          <select name="app_adapted" id="app_adapted" style="width:400px;">
<?php echo AppCentre_CreateOptionsOfVersion($app->adapted); ?>
          </select>
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_version']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_version1" name="app_version1" style="width:175px;" type="number" min="0" step="1" value="<?php echo SplitAndGet($app->version, '.', 0); ?>" /> .
          <input id="app_version2" name="app_version2" style="width:175px;" type="number" min="0" step="1" value="<?php echo SplitAndGet($app->version, '.', 1); ?>" /> .
          <input id="app_version3" name="app_version3" style="width:175px;" type="number" min="0" step="1" value="<?php echo SplitAndGet($app->version, '.', 2); ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['first_release_date']; ?></b><br/>
          <span class="note">&nbsp;&nbsp;<?php echo $zbp->lang['AppCentre']['date_format']; ?></span></p></td>
      <td><p>&nbsp;
          <input id="app_pubdate" name="app_pubdate" style="width:550px;"  type="text" value="<?php echo $app->pubdate; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['last_modified']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_modified" name="app_modified" style="width:550px;"  type="text" value="<?php echo $app->modified; ?>" readonly="readonly" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['author_name']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_author_name" name="app_author_name" style="width:550px;"  type="text" value="<?php echo $app->author_name; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['author_email']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_author_email" name="app_author_email" style="width:550px;"  type="text" value="<?php echo $app->author_email; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['author_website']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_author_url" name="app_author_url" style="width:550px;"  type="text" value="<?php echo $app->author_url; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['source_author_name']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_source_name" name="app_source_name" style="width:550px;"  type="text" value="<?php echo $app->source_name; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['source_author_email']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_source_email" name="app_source_email" style="width:550px;"  type="text" value="<?php echo $app->source_email; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['source_author_website']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_source_url" name="app_source_url" style="width:550px;"  type="text" value="<?php echo $app->source_url; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_management_page']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)<br/>
          <span class="note">&nbsp;&nbsp;<?php echo $zbp->lang['AppCentre']['app_management_page_note']; ?></span></p></td>
      <td><p>&nbsp;
          <input id="app_path" name="app_path" style="width:550px;"  type="text" value="<?php echo $app->path; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_embedding_page']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)<br/>
          <span class="note">&nbsp;&nbsp;<?php echo $zbp->lang['AppCentre']['app_embedding_page_note']; ?></span></p></td>
      <td><p>&nbsp;
          <input id="app_include" name="app_include" style="width:550px;"  type="text" value="<?php echo $app->include; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_management_permissions']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <select name="app_level" id="app_level" style="width:200px;">
<?php
if (function_exists('OutputOptionItemsOfMemberLevel')) {
    echo OutputOptionItemsOfMemberLevel(1);
} else {
    echo CreateOptoinsOfMemberLevel(1);
}
?>
          </select>
        </p></td>
    </tr>
<?php if (property_exists($app, 'phpver')) { ?>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['php_required_version']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <select name="app_phpver" id="app_phpver" style="width:400px;">
    <?php echo AppCentre_PHPVersion($app->phpver); ?>
          </select>
        </p></td>
    </tr>
<?php } ?>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_price']; ?></b></p></td>
      <td><p>&nbsp;
          <input id="app_price" name="app_price" style="width:550px;"  type="text" value="<?php echo $app->price; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['dependent_apps']; ?></b>(<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_advanced_dependency" name="app_advanced_dependency" style="width:550px;"  type="text" value="<?php echo $app->advanced_dependency; ?>" />
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['conflict_apps']; ?></b>(<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_advanced_conflict" name="app_advanced_conflict" style="width:550px;"  type="text" value="<?php echo $app->advanced_conflict; ?>" />
        </p></td>
    </tr>
    <tr style="display:none;">
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['rewrite_functions']; ?></b>(<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_advanced_rewritefunctions" name="app_advanced_rewritefunctions" style="width:550px;"  type="text" value="<?php echo $app->advanced_rewritefunctions; ?>" />
        </p></td>
    </tr>
<?php if (property_exists($app, 'advanced_existsfunctions')) { ?>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['exists_functions']; ?></b>(<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <input id="app_advanced_existsfunctions" name="app_advanced_existsfunctions" style="width:550px;"  type="text" value="<?php echo $app->advanced_existsfunctions; ?>" />
        </p></td>
    </tr>
<?php } ?>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['detailed_description']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <textarea cols="3" rows="6" id="app_description" name="app_description" style="width:550px;"><?php echo htmlspecialchars($app->description); ?></textarea>
        </p></td>
    </tr>
    <tr>
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['export_sidebar']; ?></b> (<?php echo $zbp->lang['AppCentre']['optional']; ?>)</p></td>
      <td><p>&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar1" value="1"
            <?php
            if ($app->sidebars_sidebar1) {
                echo 'checked="checked"';
            }
            ?>
                                                                              />
            <?php echo $zbp->lang['msg']['sidebar']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar2" value="1"
            <?php
            if ($app->sidebars_sidebar2) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar2']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar3" value="1"
            <?php
            if ($app->sidebars_sidebar3) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar3']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar4" value="1"
            <?php
            if ($app->sidebars_sidebar4) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar4']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar5" value="1"
            <?php
            if ($app->sidebars_sidebar5) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar5']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar6" value="1"
            <?php
            if ($app->sidebars_sidebar6) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar6']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar7" value="1"
            <?php
            if ($app->sidebars_sidebar7) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar7']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar8" value="1"
            <?php
            if ($app->sidebars_sidebar8) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar8']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" name="app_sidebars_sidebar9" value="1"
            <?php
            if ($app->sidebars_sidebar9) {
                echo 'checked="checked"';
            }
            ?>
                                                                               />
            <?php echo $zbp->lang['msg']['sidebar9']; ?></label>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p></td>
    </tr>
  </table>
  <p><?php echo $zbp->lang['AppCentre']['theme_logo_tips']; ?></p>
  <p><br/>
    <input type="submit" class="button" value="<?php echo $zbp->lang['msg']['submit']; ?>" id="btnPost" onclick='' />
  </p>
  <p>&nbsp;</p>
</form>


    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>
<?php
require $blogpath . 'zb_system/admin/admin_footer.php';

RunTime();

