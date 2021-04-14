package example;

import com.alibaba.fastjson.JSONObject;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloSpringboot {

    @RequestMapping
    public String myFunc() {
        System.out.println("Into springboot index request");
        return "Welcome to Spring Boot！~";
    }

    @RequestMapping("/test")
    public JSONObject jsonRes() {
        JSONObject info = new JSONObject();
        info.put("message", "test springboot");
        return info;
    }

    @RequestMapping("/hello")
    public String say(@RequestParam("username") String username) {
        String result = "Hi, " + username;
        System.out.println(result);
        return (result);
    }

}
