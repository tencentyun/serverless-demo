/*
Demo for push stream to trtc.
 */
package example;

import java.io.File;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.databind.MapperFeature;
import com.tencent.*;
import com.tencent.StringBuffer;
import com.qcloud.services.scf.runtime.events.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import example.redis.RedisClient;
import org.apache.commons.lang3.StringUtils;

import example.entity.PushRequest;
import example.listener.EngineListener;
import example.utils.consts;


public class Hello {
    static {
        System.loadLibrary("trtcenginewarper");
    }

    private ITRTCMediaPusher pusher;
    private PushConfig pushConfig;
    private  EngineListener engineListener;

    private static final String MODE_LIVE = "live";

    public APIGatewayProxyResponseEvent mainHandler(APIGatewayProxyRequestEvent event) {
        // Read api request body and serialize to PushRequest entity.
        String body = event.getBody();
        PushRequest request = null;
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
            request = mapper.readValue(body.getBytes(), PushRequest.class);
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(-1);
        }
        System.out.println("Receive push request: " + request.toString());

        APIGatewayProxyResponseEvent resp = new APIGatewayProxyResponseEvent();
        Object roomID = request.getRoomId();
        if (request.getRoomId() == 0 && StringUtils.isNotEmpty(request.getStrRoomId())) {
            roomID = request.getStrRoomId();
        }
        try {
            // Set trtc sdk log path
            String logPath = System.getenv("LOG_PATH");
            if (StringUtils.isEmpty(logPath)) {
                logPath = consts.TMP_DIR;
            }
            String logDir = logPath + File.separator + request.getRoomId();
            File logFileDir = new File(logDir);
            if (!logFileDir.exists()) {
                logFileDir.mkdirs();
            }
            trtcenginewarperJNI.setLogDirPath(logDir);

            // Init redis client if enabled.
            RedisClient.init(request.getRedisHost(), request.getRedisPort(), request.getRedisPassword(), 60000,
                    request.isRedis());

            // Gen push config
            pushConfig = buildPushConfig(request);

            // Begin push media and set callback.
            Semaphore endSemaphore = new Semaphore(0);
            String uuid = UUID.randomUUID().toString();
            pusher = trtcenginewarper.CreateMediaPusher();
            engineListener = new EngineListener(endSemaphore, pusher, roomID);
            pusher.SetCallback(engineListener);
            pusher.StartWithConfig(pushConfig);
            try {
                TimeUnit.MILLISECONDS.sleep(3000);
            } catch (Exception e) {
                e.printStackTrace();
            }
            System.out.println("Begin push media after sleep 3s...");
            pusher.PushMedia(request.getVideoSrc(), uuid);
            System.out.println("Retry push media...");
            pusher.PushMedia(request.getVideoSrc(), uuid);

            // Wait for finish.
            endSemaphore.acquire();

            // Push error, throw error.
            if (engineListener.isError()) {
                throw new RuntimeException("Push error");
            }

            // Push success.
            stop(roomID,false, engineListener.GetDelayMilliSeconds());
            System.out.println("Push success.");
            resp.setBody("{\"res\": \"success\"}");
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            stop(roomID, true, 0);
            System.exit(-1);
        }

        System.out.println("Push fail.");
        resp.setBody("{\"res\": \"fail\"}");
        return resp;
    }

    private PushConfig buildPushConfig(PushRequest request) {
        StringBuffer userId = new StringBuffer();
        StringBuffer userSig = new StringBuffer();
        userId.setBuffer(request.getUserId());
        userId.setBuffer_len(request.getUserId().length());
        userSig.setBuffer(request.getUserSig());
        userSig.setBuffer_len(request.getUserSig().length());

        PushConfig pushConfig = new PushConfig();
        TRTCParams param = new TRTCParams();
        param.setSdkAppId(request.getSdkAppId());
        param.setUserId(userId);
        param.setUserSig(userSig);
        if (request.getClientRole().equals(consts.CLIENT_ROLE_AUDIENCE)) {
            param.setClientRole(TRTCClientRole.TRTCClientRole_Audience);
        } else {
            param.setClientRole(TRTCClientRole.TRTCClientRole_Anchor);
        }

        // Set room id
        if (request.getRoomId() != 0 ) {
            param.setRoomId(request.getRoomId());
        } else if (StringUtils.isNotEmpty(request.getStrRoomId())){
            String bussInfoStr = "{\"strGroupId\": \"" + request.getStrRoomId() + "\"}";
            StringBuffer bussInfo = new StringBuffer();
            bussInfo.setBuffer(bussInfoStr);
            bussInfo.setBuffer_len(bussInfoStr.length());
            param.setBusinessInfo(bussInfo);
            param.setRoomId(-1);
        }

        pushConfig.setRoom_param(param);

        // Set push scene
        if (request.getMode().equals(MODE_LIVE)) {
            System.out.println("In live mode...");
            pushConfig.setSence(PushScene.kLiveStream);
        } else {
            System.out.println("In vod mode...");
            pushConfig.setSence(PushScene.kVodFile);
        }

        return pushConfig;
    }

    public void stop(Object roomID, boolean recovery, int delayMillis)  {
        if (!recovery) {
            RedisClient.clear(roomID);
        }

        try {
            System.out.println(String.format("Wait push media end %d ms", delayMillis));
            TimeUnit.MILLISECONDS.sleep(delayMillis);
        } catch(Exception e) {
            e.printStackTrace();
        }

        pusher.Stop();
        trtcenginewarper.DestroyMediaPusher(pusher);
        RedisClient.close();
    }
}
