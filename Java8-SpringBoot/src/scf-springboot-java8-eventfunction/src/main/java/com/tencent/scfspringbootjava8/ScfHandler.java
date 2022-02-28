package com.tencent.scfspringbootjava8;

import com.alibaba.fastjson.JSONObject;
import com.qcloud.services.scf.runtime.events.APIGatewayProxyRequestEvent;
import com.qcloud.services.scf.runtime.events.APIGatewayProxyResponseEvent;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

public class ScfHandler {
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
            ScfSpringbootJava8Application.main(new String[]{""});
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

        Map<String, String> reqHeaders = req.getHeaders();
        // construct request
        HttpMethod httpMethod = HttpMethod.resolve(method);
        HttpHeaders headers = new HttpHeaders();
        headers.setAll(reqHeaders);
        RestTemplate client = new RestTemplate();
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        String url = "http://127.0.0.1:8080" + path;//请保持端口号与服务端口号一致

        System.out.println("send request");
        ResponseEntity<String> response = client.exchange(url, httpMethod != null ? httpMethod : HttpMethod.GET, entity, String.class);
        //等待 spring 业务返回处理结构 -> api geteway response。
        APIGatewayProxyResponseEvent resp = new APIGatewayProxyResponseEvent();
        resp.setStatusCode(response.getStatusCodeValue());
        HttpHeaders responseHeaders = response.getHeaders();
        resp.setHeaders(new JSONObject(new HashMap<>(responseHeaders.toSingleValueMap())));
        resp.setBody(response.getBody());
        System.out.println("response body: " + response.getBody());
        return resp.toString();
    }
}
