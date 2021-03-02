<?php
if (!defined('ZBP_PATH')) {
    exit('Access denied');
}
$t = '&token=' . $zbp->GetToken('AppCentre');
?>

function showSortPanel(elem, id) {
    var element = $(elem);
    element.parent().append(GetSortPanelHtml());
    var element2 = $('div.sortpanel');
    element2.data("pluginid", element.attr('pluginid'));
    var offset = element.parent().position();
    element2.offset({ top: (offset.top-16) , left: offset.left+22  });
}

function hideSortPanel(){
    $('div.sortpanel').remove();
}

function sortPlugin(sort){
    var id = $('div.sortpanel').data("pluginid");
    window.location.href=bloghost+"zb_users/plugin/AppCentre/app_sort.php?sort="+sort+"&id="+id+"<?php echo $t;?>";
}

function GetSortPanelHtml() {
    return "<div style=\'background:white;box-shadow:0px 1px 5px 0 #999;padding:3px;position:absolute;\' class=\'sortpanel\'><a style=\'float:left;clear:both;\' class=\'button\' href=\'#\' onclick=\'sortPlugin(\"top\")\' title='<?php echo $zbp->lang['AppCentre']['move_top']; ?>'><i class=\'icon-arrow-up-circle-fill\'></i></a><a style=\'float:left;clear:both;\'  class=\'button\' href=\'#\' onclick=\'sortPlugin(\"up\")\' title='<?php echo $zbp->lang['AppCentre']['move_up']; ?>'><i class=\'icon-arrow-up-circle\'></i></a><a  style=\'float:left;clear:both;\' class=\'button\' href=\'#\' onclick=\'sortPlugin(\"down\")\' title='<?php echo $zbp->lang['AppCentre']['move_down']; ?>'><i class=\'icon-arrow-down-circle\'></i></a><a  style=\'float:left;clear:both;\' class=\'button\' href=\'#\' onclick=\'sortPlugin(\"bottom\")\' title='<?php echo $zbp->lang['AppCentre']['move_bottom']; ?>'><i class=\'icon-arrow-down-circle-fill\'></i></a></div>";
}

$(document).ready(function(){ 

$("#divMain2").prepend("<form class='search' name='edit' id='edit' method='post' enctype='multipart/form-data' action='"+bloghost+"zb_users/plugin/AppCentre/app_upload.php'><p><?php echo $zbp->lang['AppCentre']['upload_plugin_zba']; ?>:&nbsp;<input type='file' id='edtFileLoad' name='edtFileLoad' size='40' />&nbsp;&nbsp;&nbsp;&nbsp;<input type='submit' class='button' value='<?php echo $zbp->lang['msg']['submit']; ?>' name='B1' />&nbsp;&nbsp;<?php echo "<input id='token' name='token' type='hidden' value='".$zbp->GetToken('AppCentre')."'/>"?><input class='button' type='reset' value='<?php echo $zbp->lang['msg']['reset']; ?>' name='B2' />&nbsp;</p></form>")

if(zbp.options.blogversion>170000 && app_enablepluginsort){
var itd = 0;
$("tr").each(function(){
    if (itd == 0){
        $(this).append("<th class='td5' align='center'></th>");
    }else{
        $(this).append("<td class='td5 tdPriority' align='center'></td>");
    }
    ++itd;
});

$("tr").first().children().last().append("<b><?php echo $zbp->lang['AppCentre']['priority_sort']; ?></b>");

$("td.plugin").each(function(){
    if($(this).hasClass("plugin-on")){
        var pluginid = $(this).data("pluginid");
        $(this).nextAll(".tdPriority").html("<a class=\'button show-sort-btn\' href=\'#\' pluginid=\'"+pluginid+"\'><i class=\'icon-arrow-down-up\'></i></a>");
    }
});

$('a.show-sort-btn').click(function (event) {
    if ($('div.sortpanel').length > 0 && $('div.sortpanel').data('pluginid') == $(this).attr('pluginid')) {
        hideSortPanel();
        return false;
    }

    hideSortPanel();
    showSortPanel(this);
    event.stopPropagation();

    $(document).on('click', function () {
        hideSortPanel();
    });

    $('div.sortpanel').click(function (event) {
        event.stopPropagation();
    });
});

}

if(app_enabledevelop){

var itd = 0;
$("tr").each(function(){
    if (itd == 0){
        $(this).append("<th class='td15' align='center'></th>");
    }else{
        $(this).append("<td class='td15' align='center'></td>");
    }
    ++itd;
});
$("tr").first().children().last().append("<b><?php echo $zbp->lang['AppCentre']['developer_mode']; ?></b>");

}

$(".plugin").each(function(){

    var t=$(this).data("pluginid");
    if(t==undefined)t=$(this).find("strong").html();
    var s=""
    s=s+"<a class=\"button\"  href='"+bloghost+"zb_users/plugin/AppCentre/plugin_edit.php?id="+t+"<?php echo $t?>' title='<?php echo $zbp->lang['AppCentre']['edit_app']; ?>'><?php echo AppCentre_CreateButton('edit'); ?></a>";

    s=s+"&nbsp;&nbsp;&nbsp;&nbsp;<a class=\"button\"  href='"+bloghost+"zb_users/plugin/AppCentre/app_pack.php?type=plugin&id="+t+"<?php echo $t?>' title='<?php echo $zbp->lang['AppCentre']['export_app']; ?>' target='_blank'><?php echo AppCentre_CreateButton('download'); ?></a>";

    if(app_enabledevelop){
        s=s+"&nbsp;&nbsp;&nbsp;&nbsp;<a class=\"button\" href='"+bloghost+"zb_users/plugin/AppCentre/submit.php?type=plugin&amp;id="+t+"<?php echo $t?>' title='<?php echo $zbp->lang['AppCentre']['upload_app_to_appcentre']; ?>' target='_blank'><?php echo AppCentre_CreateButton('cloudup'); ?></a>";
    }
    
    if(app_enabledevelop){
    
        $(this).parent().children().last().append(s);

    }

    if(!$(this).hasClass("plugin-on")){
        $(this).parent().children().eq(4).append("&nbsp;&nbsp;&nbsp;&nbsp;<a class=\"button\"  href='"+bloghost+"zb_users/plugin/AppCentre/app_del.php?type=plugin&id="+t+"<?php echo $t?>' title='<?php echo $zbp->lang['AppCentre']['del_app']; ?>' onclick='return window.confirm(\"<?php echo str_replace('"', '', $zbp->lang['msg']['confirm_operating']); ?>\");'><?php echo AppCentre_CreateButton('delete'); ?></a>");
    }else{
    };

});

if(zbp.options.blogversion>170000)$("a.button").removeClass("button");

});