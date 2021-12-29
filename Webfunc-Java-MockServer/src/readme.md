# 模版说明

打包方法：
* 需要三个文件：
  * Moco Jar文件
  * scf_bootstrap启动文件
  * foo.json文件
* 需要将这三个文件压缩成一个zip包上传

使用方法：

1. MOCO的使用方法可以参考：https://github.com/dreamhead/moco
2. 需要参考MOCO的文档把foo.json换成你需要mock的内容。
3. 注意：如果你修改了foo.json的文件名，记得要同时修改scf_bootstrap中的命令。
4. 部署成功后，就能通过API网关中的访问路径进行访问了。
5. 此Demo可以通过URL直接发送`GET`请求，就能看到结果。