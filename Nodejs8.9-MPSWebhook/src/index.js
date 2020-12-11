var request = require("request");
exports.main_handler = async (event, context) => {
        var options = { method: 'POST',
        url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send',
        qs: { key: 'bd80f317-xxxx-xxxx-xxxx-00ccc2635e6f' },
        headers: 
        { 'cache-control': 'no-cache',
          'content-type': 'application/json' },
        body: 
        { msgtype: 'markdown',
            markdown: { content: '<font color="info">视频处理完成！</font> \n> 视频处理任务ID:<font color="warning">'+ event.WorkflowTaskEvent.TaskId +'</font>\n> 任务流状态:<font color="warning">'+ event.WorkflowTaskEvent.Status +'</font>\n> 视频处理输出文件信息:<font color="warning">'+ event.WorkflowTaskEvent.MediaProcessResultSet[0].TranscodeTask.Output.Path +'</font>\n> 视频处理输出存储桶地域信息:<font color="warning">'+event.WorkflowTaskEvent.MediaProcessResultSet[0].TranscodeTask.Output.OutputStorage.CosOutputStorage.Region+ '/'+event.WorkflowTaskEvent.MediaProcessResultSet[0].TranscodeTask.Output.OutputStorage.CosOutputStorage.Bucket +'</font>\n> 视频处理任务执行状态:<font color="warning">'+ event.WorkflowTaskEvent.Message +'</font>' } },
        json: true };
        request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        });
return (event.WorkflowTaskEvent.Message);
};