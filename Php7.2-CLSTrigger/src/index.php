<?php

function main_handler($event, $context) {
    $event=json_encode($event);
    $event=json_decode($event);
    $data = $event->clslogs->data;
    $decoded = base64_decode($data);
    $decoded_payload = gzdecode($decoded);
    $decoded_payload = json_decode($decoded_payload);
    return $decoded_payload;
}

?>