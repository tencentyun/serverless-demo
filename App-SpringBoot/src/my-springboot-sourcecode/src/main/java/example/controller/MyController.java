package example.controller;

import com.alibaba.fastjson.JSONObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;

@RestController
public class MyController {

    @RequestMapping(value = "/hi", method = RequestMethod.GET)
    public String say() {
        return "Hello my SpringBoot!";
    }

    @RequestMapping(value = "/json", method = RequestMethod.GET)
    public JSONObject jsonRes() {
        JSONObject info = new JSONObject();
        info.put("message", "hi, springboot");
        return info;
    }

    @RequestMapping(value = "/read", method = RequestMethod.GET)
    public String testDoc() throws IOException {
        ClassPathResource res = new ClassPathResource("static/test.txt");
        InputStream inputStream = res.getInputStream();
        byte[] bytes = new byte[inputStream.available()];
        inputStream.read(bytes);
        return new String(bytes);
    }

    @RequestMapping(value = "/pic", produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] getImage() throws IOException {
        ClassPathResource res = new ClassPathResource("static/bg.png");
        InputStream inputStream = res.getInputStream();
        byte[] bytes = new byte[inputStream.available()];
        inputStream.read(bytes, 0, inputStream.available());
        return bytes;
    }

}
