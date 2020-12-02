package example;

import com.qcloud.scf.runtime.Context;
import com.qcloud.services.scf.runtime.events.APIGatewayProxyResponseEvent;
import com.qcloud.services.scf.runtime.events.APIGatewayProxyRequestEvent;
import org.springframework.http.*;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

public class Hello {
    private static volatile boolean cold_launch;
    // initialize phase, initialize cold_launch
   static {
       cold_launch = true;
    }

    // function entry, use ApiGatewayEvent to get request
    // send to localhost:8080/hello as defined in helloSpringBoot.java
    public String mainHandler(APIGatewayProxyRequestEvent req) {

        System.out.println("start main handler");
        if (cold_launch) {
            System.out.println("start spring");
            DemoApplication.main(new String[]{""});
            System.out.println("stop spring");
            cold_launch = false;
        }
        // 从api geteway event -> spring request -> spring boot port

        // System.out.println("request: " + req);
        // path to request
        String path = req.getPath();
        System.out.println("request path: " + path);

        String method = req.getHttpMethod();
        System.out.println("request method: " + method);

        String body = req.getBody();
        System.out.println("Body: " + body);

        Map<String, String> hdrs = req.getHeaders();
        // construct request
        HttpMethod m = HttpMethod.resolve(method);
        HttpHeaders headers = new HttpHeaders();
        headers.setAll(hdrs);
        RestTemplate client = new RestTemplate();
        HttpEntity<String> entity = new HttpEntity<String>(body, headers);

        String url = "http://127.0.0.1:8080" + path;

        System.out.println("send request");
        ResponseEntity<String> response = client.exchange(url, m, entity, String.class);
        //等待 spring 业务返回处理结构 -> api geteway response。
        APIGatewayProxyResponseEvent resp = new APIGatewayProxyResponseEvent();
        resp.setStatusCode(response.getStatusCodeValue());
        HttpHeaders headers1 = response.getHeaders();
        resp.setHeaders(headers1.toSingleValueMap());
        resp.setBody(response.getBody());
        System.out.println("response body: " + response.getBody());
        return resp.toString();

    }
}
