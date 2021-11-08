## 注意
这个函数是为了处理`Python3.6-EventBridgeToCos`这个模板转储的cos文件， 如果bucket内的文件格式不符合要求， 会造成函数运行错误

## 如何使用
1. 从模板创建函数
2. 在`函数管理/函数配置/环境配置`设置环境变量
   + COS_REGION： 在`桶/概览/基本信息/所属地域`下 例如 `ap-chengdu`
      - COS_BUCKET_SRC和COS_BUCKET_DST都在同一个region下
      - COS_BUCKET_SRC和COS_BUCKET_DST 可以是同一个bucket， 两个环境变量填相同的值即可
   + COS_BUCKET_SRC: 源bucket， 里面保存了`Python3.6-EventBridgeToCos`这个函数转储的文件
   + COS_BUCKET_DST: 目标bucket， 函数会将聚合后的文件保存到这个bucket里面
   + MAX_FILE_SIZE_MB: 聚合后的文件最大体积限制(5<=size<=10000)。 单位：MB
   + MAX_TIME_RANGE_HOURS: 聚合后单个文件内事件时间范围的最大值(1<=time<=24)。 单位:小时
3. 在`函数管理/函数配置/环境配置`设置
   + 内存设置为1024M或更高
   + 执行超时时间设置为最大值，86400秒。 防止因为处理文件过多导致函数超时。
4. `函数管理/函数配置/权限配置`中设置运行角色。 
   + 确保角色有COS服务的读写权限
5. `函数管理/函数配置/执行配置`中 启用异步执行。
6. 给函数创建定时任务触发器
