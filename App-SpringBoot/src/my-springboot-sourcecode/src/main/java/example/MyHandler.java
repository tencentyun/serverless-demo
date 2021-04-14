package example;

import com.qcloud.scf.runtime.AbstractSpringHandler;

public class MyHandler extends AbstractSpringHandler {
    @Override
    public void startApp() {
        System.out.println("start app");
        DemoApplication.main(new String[]{""});
    }
}
