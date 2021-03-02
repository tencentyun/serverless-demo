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

$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['edit_app'];

AppCentre_CheckInSecurityMode();

if (GetVars('id')) {
    $app = $zbp->LoadApp('plugin', GetVars('id'));
    $mt = array();
    $ft = GetFilesInDir($zbp->path . '/zb_users/plugin/' . $app->id . '/', 'php|inc|png');
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
    $app->type = 'plugin';
    $app->author_name = $zbp->user->Name;
    $app->author_email = $zbp->user->Email;
    $app->author_url = $zbp->user->HomePage;
    $app->path = 'main.php';
    $app->include = 'include.php';
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
        $app2 = $zbp->LoadApp('plugin', $app->id);
        if (property_exists($app2, 'isloaded') && $app2->isloaded) {
            $zbp->ShowError($zbp->lang['AppCentre']['app_with_same_name']);
            die();
        }
        @mkdir($zbp->usersdir . 'plugin/' . $app->id . '/');
        @copy($zbp->usersdir . 'plugin/AppCentre/images/plugin.png', $zbp->usersdir . 'plugin/' . $app->id . '/logo.png');

        if (trim($_POST['app_path'])) {
            $file = file_get_contents('tpl/main.html');
            $file = str_replace("<%appid%>", $app->id, $file);
            $file = str_replace("<%appname%>", trim($_POST['app_name']), $file);
            $path = $zbp->usersdir . 'plugin/' . $app->id . '/' . trim($_POST['app_path']);
            @file_put_contents($path, $file);
        }
        if (trim($_POST['app_include'])) {
            $file = file_get_contents('tpl/include.html');
            $file = str_replace("<%appid%>", $app->id, $file);
            $path = $zbp->usersdir . 'plugin/' . $app->id . '/include.php';
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

    $app->SaveInfoByXml();

    $t = '&token=' . $zbp->GetToken('AppCentre');
    $zbp->SetHint('good', '<a href="submit.php?type=plugin&id=' . $app->id . $t . '">' . $zbp->lang['AppCentre']['submitted successfully'] . '</a>');
    Redirect($_SERVER["HTTP_REFERER"]);
}

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';

?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(GetVars('id', 'GET') == '' ? 5 : ''); ?></div>
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
      <td><p><b>· <?php echo $zbp->lang['AppCentre']['app_name']; ?></b></p></td>
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
          <input id="app_modified" name="app_modified" style="width:550px;"  type="text" value="<?php echo $app->modified; ?>" readonly />
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
    <tr style="display: none">
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
  </table>
  <p><?php echo $zbp->lang['AppCentre']['plugin_logo_tips']; ?></p>
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

