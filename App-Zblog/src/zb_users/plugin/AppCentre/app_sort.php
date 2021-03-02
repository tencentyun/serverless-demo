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
$id = GetVars('id');
$sort = GetVars('sort');
AppCentre_CheckInSecurityMode();
$array = $zbp->GetPreActivePlugin();
$array2 = array_flip($array);
//var_dump($array2);
//var_dump(current($array2));
//var_dump(prev($array2));
foreach($array2 as $key=>$order){
    if($key == $id){
        //var_dump($key);
if($sort == 'top'){
    $array2[$key] = -1;
    break;
}
if($sort == 'bottom'){
    $array2[$key] = count($array2)+1; 
    break;
}
if($sort == 'up'){
    if(isset($array[$order-1])){
        $array2[$key] = $order-1;
        $array2[$array[$order-1]] = $order;
    }
    break;
}
if($sort == 'down'){
    if(isset($array[$order+1])){
        $array2[$key] = $order+1;
        $array2[$array[$order+1]] = $order;
    }
    break;
}


    }
}
$array3 = array_flip($array2);
ksort($array3);
$s = implode('|', $array3);

$zbp->option['ZC_USING_PLUGIN_LIST'] = $s;
$zbp->SaveOption();

Redirect($_SERVER["HTTP_REFERER"]);
