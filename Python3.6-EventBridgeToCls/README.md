## 如何使用
1. 从模板创建函数
2. 在`函数管理/函数配置/环境配置`设置环境变量
    + CLS_REGION： 你的CLS资源在哪个可用区， 请参考： https://cloud.tencent.com/document/product/614/18940
    + CLS_TOPIC_ID： 消息要写入那个cls topic
3. `函数管理/函数配置/权限配置`中设置运行角色。 并确保角色有CLS服务的读写权限
4. 在EventBridge中创建rule， 并将本函数作为target。 在eb接收到指定事件时，即可触发函数
