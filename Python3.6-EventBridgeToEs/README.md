## 如何使用
1. 从模板创建函数
2. 在`函数管理/函数配置/环境配置`设置环境变量
    + ES_IP_ADDRESS 你的es服务器ip。 请检查函数设置中的网络设置， 确保你的函数和es服务器在同一子网。
    + ES_PORT es服务器端口
    + ES_USERNAME 用户名. (如果es服务器没有用户名密码， 则不传)
    + ES_PASSWORD 密码. (如果es服务器没有用户名密码， 则不传)
    + ES_INDEX_NAME es创建的索引名称。 例如： es-index-demo ,(注意：不能包含大写字母)
4. 在EventBridge中创建rule， 并将本函数作为target。 在eb接收到指定事件时，即可触发函数
