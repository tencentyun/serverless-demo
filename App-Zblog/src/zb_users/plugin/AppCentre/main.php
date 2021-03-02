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
$appc = $zbp->LoadApp('plugin', 'AppCentre');
$blogtitle = $zbp->lang['AppCentre']['name'] . '-' . '(' . $zbp->lang['AppCentre']['client'] . ' v' . $appc->version . ')';
unset($appc);
if (!$zbp->Config('AppCentre')->HasKey('enabledcheck')) {
    AppCentre_CheckInSecurityMode();
    $zbp->Config('AppCentre')->enabledcheck = 1;
    $zbp->Config('AppCentre')->checkbeta = 0;
    $zbp->Config('AppCentre')->enabledevelop = 0;
    $zbp->SaveConfig('AppCentre');
}

if (count($_POST) > 0) {
    $zbp->SetHint('good');
    Redirect('./main.php');
}

if (AppCentre_InSecurityMode()) {
    $zbp->SetHint('good', $zbp->lang['AppCentre']['turned_on_safe_mode']);
}

Add_Filter_Plugin('Filter_Plugin_CSP_Backend', 'AppCentre_UpdateCSP');

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';

?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(GetVars('method', 'GET') == 'check' ? 2 : 1); ?></div>
  <div id="divMain2">


<?php
$method = GetVars('method', 'GET');

if (!$method) {
    $method = 'view';
}

Server_Open($method);
?>
    <script type="text/javascript">
        window.plug_list = "<?php echo AddNameInString($option['ZC_USING_PLUGIN_LIST'], $option['ZC_BLOG_THEME']); ?>";
        window.signkey = '<?php echo $zbp->GetToken(); ?>';
    </script>
    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>
<?php
require $blogpath . 'zb_system/admin/admin_footer.php';

RunTime();

