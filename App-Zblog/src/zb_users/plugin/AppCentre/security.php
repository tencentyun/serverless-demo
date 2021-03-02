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

if (count($_POST) > 0) {
    if (function_exists('CheckIsRefererValid')) {
        CheckIsRefererValid();
    }
    file_put_contents($zbp->path . 'zb_users/data/appcentre_security_mode.php', '');
}

$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['safe_mode'];

require $blogpath . 'zb_system/admin/admin_header.php';
?>
<style>
.warning { 
  font-size: 150%; 
  line-height: 2em;
  text-align: center;
  background: white;
}
.warning .button {
  height: 100%;
}
</style>
<?php
require $blogpath . 'zb_system/admin/admin_top.php';
?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(7); ?></div>
  <div id="divMain2">
  <div class="warning">
<?php
if (AppCentre_InSecurityMode()) {
    echo $zbp->lang['AppCentre']['turn_off_safe_mode_note'];
} else {
    echo $zbp->lang['AppCentre']['turn_on_safe_mode_note'];
    ?>
<p>
<form method="post">
    <?php if (function_exists('CheckIsRefererValid')) { ?>
<input type="hidden" name="csrfToken" value="<?php echo $zbp->GetCSRFToken(); ?>">
    <?php } ?>
<input type="submit" class="button" value="<?php echo $zbp->lang['AppCentre']['turn_on_safe_mode']; ?>"></form></p>
<?php } ?>
</div>
    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>


<?php
require $blogpath . 'zb_system/admin/admin_footer.php';

RunTime();

