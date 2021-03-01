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

$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['submit_app'];

$s = '';
$w = array();

$app = new App;
$app->LoadInfoByXml($_GET['type'], $_GET['id']);

$w['id'] = $app->id;
$w['author'] = $app->author_name;
$w['modified'] = $app->modified;
$w['version'] = $app->version;

$t = json_encode($w);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $s = Server_Open('submitpre');
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $url = Server_Open('submit');
    $url = trim($url);
    if (substr($url, 0, 4) == 'http') {
        Redirect($url);
    } else {
        echo '<script type="text/javascript">alert(\'' . $url . '\')</script>';
    }
}

if (!$s) {
    $s = '{"id":"' . $zbp->lang['AppCentre']['unsubmitted'] . '","author":"' . $zbp->lang['AppCentre']['unsubmitted'] . '","modified":"' . $zbp->lang['AppCentre']['unsubmitted'] . '"}';
}

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';

?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(''); ?></div>
  <div id="divMain2">


<form method="post" action="">
<table class="tableFull tableBorder tableBorder-thcenter">
<tr><th colspan="2"><?php echo $zbp->lang['AppCentre']['app_to_be_submitted']; ?></th></tr>

<tr><td class="td30"><p><b>· <?php echo $zbp->lang['AppCentre']['app_id']; ?></b></p></td><td><p>&nbsp;<input id="local_app_id" name="local_app_id" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['app_author']; ?></b></p></td><td><p>&nbsp;<input id="local_app_user" name="local_app_user" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['current_update']; ?></b></p></td><td><p>&nbsp;<input id="local_app_date" name="local_app_date" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['current_version']; ?></b></p></td><td><p>&nbsp;<input id="local_app_ver" name="local_app_ver" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
</table>


<table class="tableFull tableBorder tableBorder-thcenter">
<tr><th colspan="2"><?php echo $zbp->lang['AppCentre']['target_application']; ?></th></tr>
<tr><td class="td30"><p><b>· <?php echo $zbp->lang['AppCentre']['app_id']; ?></b></p></td><td><p>&nbsp;<input id="zblog_app_id" name="zblog_app_id" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['app_author']; ?></b></p></td><td><p>&nbsp;<input id="zblog_app_user" name="zblog_app_user" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['latest_update']; ?></b></p></td><td><p>&nbsp;<input id="zblog_app_date" name="zblog_app_date" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
<tr><td><p><b>· <?php echo $zbp->lang['AppCentre']['latest_version']; ?></b></p></td><td><p>&nbsp;<input id="zblog_app_ver" name="zblog_app_ver" style="width:550px;"  type="text" value="" readonly /></p></td></tr>
</table>
<script type="text/javascript">
var jsoninfo=eval(<?php echo $t; ?>);
$("#local_app_id").val(jsoninfo.id);
$("#local_app_user").val(jsoninfo.author);
$("#local_app_date").val(jsoninfo.modified);
$("#local_app_ver").val(jsoninfo.version);

var jsoninfo=eval(<?php echo $s; ?>);
$("#zblog_app_id").val(jsoninfo.id);
$("#zblog_app_user").val(jsoninfo.author);
$("#zblog_app_date").val(jsoninfo.modified);
$("#zblog_app_ver").val(jsoninfo.version);
</script>


<p><br/><input type="submit" class="button" value="<?php echo $zbp->lang['msg']['submit']; ?>" id="btnPost" onclick='return confirm("<?php echo $zbp->lang['AppCentre']['want_to_submit']; ?>")' /></p><p>&nbsp;</p>


</form>


    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>


<?php
require $blogpath . 'zb_system/admin/admin_footer.php';

RunTime();

