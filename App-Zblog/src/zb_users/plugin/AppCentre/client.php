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

if (!$zbp->Config('AppCentre')->token) {
    $blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['login_store'];
} else {
    $blogtitle = $zbp->lang['AppCentre']['name'] . '-' . $zbp->lang['AppCentre']['my_store'];
}

Add_Filter_Plugin('Filter_Plugin_CSP_Backend', 'AppCentre_UpdateCSP');

if (GetVars('act') == 'login') {
    if (!$zbp->ValidToken(GetVars('token', 'GET'), 'AppCentre')) {
        $zbp->ShowError(5, __FILE__, __LINE__);
        die();
    }
    AppCentre_CheckInSecurityMode();
    $s = trim(Server_Open('login'));
    if ($s !== '') {
        $zbp->Config('AppCentre')->token = GetVars("app_token", "POST");
        $zbp->Config('AppCentre')->uniq_id = trim($s);
        $zbp->Config('AppCentre')->old_token = 'false';
        $zbp->Config('AppCentre')->DelKey('old_token');

        $zbp->SaveConfig('AppCentre');

        $zbp->SetHint('good', $zbp->lang['AppCentre']['login_success']);
        Redirect('./main.php');
        die;
    } else {
        $zbp->SetHint('bad', $zbp->lang['AppCentre']['token_not_exist']);
        Redirect('./client.php');
        die;
    }
}

if (GetVars('act') == 'logout') {
    if (function_exists('CheckHTTPRefererValid')) {
        CheckHTTPRefererValid();
    }
    AppCentre_CheckInSecurityMode();
    $zbp->Config('AppCentre')->token = '';
    $zbp->Config('AppCentre')->uniq_id = '';
    $zbp->SaveConfig('AppCentre');
    $zbp->SetHint('good', $zbp->lang['AppCentre']['logout']);
    Redirect('./client.php');
    die;
}

require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';
?>
<div id="divMain">

  <div class="divHeader"><?php echo $blogtitle; ?></div>
<div class="SubMenu"><?php AppCentre_SubMenus(9); ?></div>
  <div id="divMain2">
<?php if (!$zbp->Config('AppCentre')->token) { ?>
            <div class="divHeader2"><?php echo $zbp->lang['AppCentre']['account_login']; ?></div>
            <form action="?act=login&token=<?php echo $zbp->GetToken('AppCentre'); ?>" method="post">
              <table style="line-height:3em;" width="100%" border="0">
                <tr height="32">
                  <th align="center"><?php echo $zbp->lang['AppCentre']['account_login']; ?>
                    </td>
                </tr>
                <tr height="32">
                  <td  align="center"><?php echo $zbp->lang['AppCentre']['token']; ?>:
                    <input type="password" name="app_token" value="" style="width:40%"/></td>
                </tr>
                <tr height="32" align="center">
                  <td align="center"><input type="submit" value="<?php echo $zbp->lang['msg']['login']; ?>" class="button" /></td>
                </tr>
                <tr height="32" align="center">
                  <td align="center"><a href="https://user.zblogcn.com/user/security/token" target="_blank"><?php echo $zbp->lang['AppCentre']['get_token']; ?></a>
				  &nbsp;&nbsp;&nbsp;&nbsp;
                  <a href="https://uc.zblogcn.com/user/security/token" target="_blank"><?php echo $zbp->lang['AppCentre']['get_token2']; ?></a></td>
                </tr>
              </table>
            </form>
    <?php
} else {
//已登录
    Server_Open('shoplist');
}
?>



    <script type="text/javascript">ActiveLeftMenu("aAppCentre");</script>
    <script type="text/javascript">AddHeaderIcon("<?php echo $bloghost . 'zb_users/plugin/AppCentre/logo.png'; ?>");</script>
  </div>
</div>

<?php
require $blogpath . 'zb_system/admin/admin_footer.php';
RunTime();

