using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Linq;

public class HttpRequest
{
    // 使用post方法异步请求
    // url 目标链接
    // data 发送的参数字符串
    // return 返回的字符串
    public static string PostAsync(string url, string data)
    {
        Console.WriteLine("Post Data :" + data);
        HttpClient client = new HttpClient(new HttpClientHandler() { UseCookies = false });
        HttpContent content = new StringContent(data);
        HttpResponseMessage response = client.PostAsync(url, content).Result;
        response.EnsureSuccessStatusCode();
        string responseBody = response.Content.ReadAsStringAsync().Result;
        return responseBody;
    }

    // 使用get方法异步请求
    // url 目标链接
    // return 返回的字符串
    public static string GetAndProcessEvent(string url)
    {
        // Use Get Api to grab events.
        HttpClient client = new HttpClient(new HttpClientHandler() { UseCookies = false });
        HttpResponseMessage response = client.GetAsync(url).Result;
        response.EnsureSuccessStatusCode();  //用来抛异常的
        
        // Events in response body, other infos in header.
        string responseBody = response.Content.ReadAsStringAsync().Result;
        Console.WriteLine("Get event :" + responseBody);

        // Retrive information from header.
        // Retrive memory limit 
        // Retrive time limit
        // Retrive request id
        HttpHeaders headers = response.Headers;
        IEnumerable<string> values;
        string memoryLimitMB="";
        string timeLimitMs="";
        string requestId="";
        if (headers.TryGetValues("memory_limit_in_mb", out values)) {
           memoryLimitMB =  values.First();
        }
        if (headers.TryGetValues("time_limit_in_ms", out values)) {
           timeLimitMs = values.First();
        }
        if (headers.TryGetValues("request_id", out values)) {
           requestId = values.First();
        }
        // process event.
        string res = processEvent(responseBody, requestId);

        return res;
    }

    // process event , simply return event and request id.
    private static string processEvent(string Evt, string ReqId) {
      return "Event :" + Evt + "\t RequestId: " + ReqId;
    }
}

public class index {
    static void GlobalInitialization(string h, string uv) {
      Console.WriteLine("Doing Initialization, _HANDLER [" + h + "] UserDefinedEnv ["+ uv +"]\n" );
    } 
    
    static void Main(string[] args) {
        // Get APP and PORT to communicate with scf
        string scf_host = Environment.GetEnvironmentVariable("SCF_RUNTIME_API");
        string scf_port = Environment.GetEnvironmentVariable("SCF_RUNTIME_API_PORT");
        // _HANDLER -- user defined function entrance, may not be used.
        string handler = Environment.GetEnvironmentVariable("_HANDLER");
        // user defined value, passed with env. 
        string user_def_env = Environment.GetEnvironmentVariable("myKey");
        // urls.
        string ready_url = "http://" + scf_host + ":" + scf_port + "/runtime/init/ready";
        string event_url = "http://" + scf_host + ":" + scf_port + "/runtime/invocation/next";
        string response_url = "http://" + scf_host + ":" + scf_port + "/runtime/invocation/response";
        string error_url = "http://" + scf_host + ":" + scf_port + "runtime/invocation/error";

        // some initialization work
        GlobalInitialization(handler, user_def_env);
        // send POST to read_url --  initialztion finished.
        HttpRequest.PostAsync(ready_url, "dotnet ready");
        Console.WriteLine("Dotnet CustomRuntime Ready");
        
        // loop: get event -> process ->  post response.
        while (true) {
            // get next event and process (print event)
            string res = HttpRequest.GetAndProcessEvent(event_url);
            // send process result to scf
            HttpRequest.PostAsync(response_url, "return message: " + res);
        }
    }
}
