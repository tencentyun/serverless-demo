### **数据同步-Http转发 golang 示例**

[物联网控制台数据同步--客户端PHP、Golang脚本 - 云+社区 - 腾讯云 (tencent.com)](https://cloud.tencent.com/developer/article/1855513)

1、控制台token设置

在示例代码中将控制台设置的Token

```
//用户设置token，与控制台自定义的Token保持一直
Token = "test"
```

2、路由选择

```
//设置监听的端口,默认设置为/test,可自行修改
http.HandleFunc("/test",jsonReqRsp)
```

