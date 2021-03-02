<?php
if (!defined('ZBP_PATH')) {
    exit('Access denied');
}
$t = '&token=' . $zbp->GetToken('AppCentre');
?>

$(document).ready(function(){ 

$("#divMain2").prepend("<form class='search' name='edit' id='edit' method='post' enctype='multipart/form-data' action='"+bloghost+"zb_users/plugin/AppCentre/app_upload.php'><p><?php echo $zbp->lang['AppCentre']['upload_theme_zba']; ?>:&nbsp;<input type='file' id='edtFileLoad' name='edtFileLoad' size='40' />&nbsp;&nbsp;&nbsp;&nbsp;<input type='submit' class='button' value='<?php echo $zbp->lang['msg']['submit']; ?>' name='B1' />&nbsp;&nbsp;<?php echo "<input id='token' name='token' type='hidden' value='" . $zbp->GetToken('AppCentre') . "'/>"; ?>
<input class='button' type='reset' value='<?php echo $zbp->lang['msg']['reset']; ?>' name='B2' />&nbsp;</p></form>");



$(".theme").each(function(){
    var t=$(this).find("strong").html();
    var s="<p style='padding-bottom:0.5em;'>";

    if($(this).hasClass("theme-now")){
        <?php

            if ($zbp->LoadApp('theme', $zbp->theme)->IsUsed() && $zbp->LoadApp('theme', $zbp->theme)->path) {
?>
        s=s+"<a class=\"button\" href='<?php echo $zbp->LoadApp('theme', $zbp->theme)->GetManageUrl();?>' title='<?php echo $zbp->lang['AppCentre']['config_theme']; ?>'><?php echo AppCentre_CreateButton('set'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";
<?php
            }
        ?>
    }

    if(app_enabledevelop){

    s=s+"<a class=\"button\" href='"+bloghost+"zb_users/plugin/AppCentre/theme_edit.php?id="+t+"<?php echo $t; ?>' title='<?php echo $zbp->lang['AppCentre']['edit_app']; ?>'><?php echo AppCentre_CreateButton('edit'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";

    s=s+"<a class=\"button\" href='"+bloghost+"zb_users/plugin/AppCentre/app_pack.php?type=theme&id="+t+"<?php echo $t; ?>' title='<?php echo $zbp->lang['AppCentre']['export_app']; ?>' target='_blank'><?php echo AppCentre_CreateButton('download'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";

    }

    if($(this).hasClass("theme-now")){
        s=s+"<a class=\"button\" href='"+bloghost+"zb_system/admin/module_edit.php?source=theme' title='<?php echo $zbp->lang['AppCentre']['add_module_for_theme']; ?>'><?php echo AppCentre_CreateButton('module'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";
    }

    if(app_enabledevelop){
        s=s+"<a class=\"button\" href='"+bloghost+"zb_users/plugin/AppCentre/submit.php?type=theme&amp;id="+t+"<?php echo $t; ?>' title='<?php echo $zbp->lang['AppCentre']['upload_app_to_appcentre']; ?>' target='_blank'><?php echo AppCentre_CreateButton('cloudup'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";
    }


    if($(this).hasClass("theme-other")){
        s=s+"<a class=\"button\" href='"+bloghost+"zb_users/plugin/AppCentre/app_del.php?type=theme&id="+t+"<?php echo $t; ?>' title='<?php echo $zbp->lang['AppCentre']['del_app']; ?>' onclick='return window.confirm(\"<?php echo str_replace('"', '', $zbp->lang['msg']['confirm_operating']); ?>\");'><?php echo AppCentre_CreateButton('delete'); ?></a>&nbsp;&nbsp;&nbsp;&nbsp;";
    }

    s=s+"</p>";
    $(this).append(s);
    
});

if(zbp.options.blogversion>170000)$("a.button").removeClass("button");

});