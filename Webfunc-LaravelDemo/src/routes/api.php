<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/headers', function (Request $request) {
    $headers = $request->headers->all();

    return response()->json([
        'title' => 'serverless',
        'headers' => $headers,
    ]);
});

Route::get('/posts', function (Request $request) {
    $input = $request->all();

    return response()->json([
        'title' => 'serverless',
        'get' => $input
    ]);
});

Route::post('/posts', function (Request $request) {
    $input = $request->all();

    return response()->json([
        'title' => 'serverless',
        'data' => $input
    ]);
});

// 上传文件接口示例
Route::post('/upload', function (Request $request) {
    // 表单中字段为 file
    if ($request->file) {
        // TODO: 这里只是将文件临时存储到 /tmp 下，用户需要根据个人需要存储到持久化服务，比如腾讯云的对象存储、文件存储等。
        $upload = $request->file->store('upload');
        $uploadFile = storage_path()."/app/".$upload;
    }

    return response()->json([
        'title' => 'serverless',
        'upload' => $uploadFile ?? null,
    ]);
});
