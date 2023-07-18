package example.listener;

import com.tencent.ITRTCMediaPusher;
import com.tencent.ITRTCMediaPusherCallback;
import com.tencent.MediaPushError;
import example.redis.RedisClient;

import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;


public class EngineListener extends ITRTCMediaPusherCallback {
    private static final Logger logger = Logger.getLogger(EngineListener.class.getName());

    private final Semaphore endSemaphore;
    private final AtomicLong atomicLong = new AtomicLong();
    private int mDuration = 0;
    private final ITRTCMediaPusher pusher;
    private boolean pushError = false;
    private final Object roomID;
    private final static int DEFAULT_DELAY_MILLIS = 1000;
    private final static int BUFFER_DELAY_MILLIS = 500;

    public EngineListener(Semaphore endSemaphore, ITRTCMediaPusher pusher, Object roomID) {
        this.endSemaphore = endSemaphore;
        this.pusher = pusher;
        this.roomID = roomID;
    }

    @Override
    public void OnPushBegin(String fileURL) {
        long pos = RedisClient.getPlayPosition(this.roomID);
        System.out.println(String.format("OnPushBegin file: %s, seek position to: %d", fileURL, pos));
        pusher.Seek((int)pos);
    }

    @Override
    public void OnPushProgress(String fileURL, int position, int duration) {
        mDuration = duration;
        System.out.println(String.format("OnPushProgress position: %d, duration: %d", position, duration));
        if (position > atomicLong.get()) {
            atomicLong.set(position);
            RedisClient.setPlayPosition(this.roomID, position);
        }
    }

    @Override
    public void OnPushEnd(String file_url) {
        System.out.println("OnPushEnd");
        endSemaphore.release();
    }

    @Override
    public void OnPushError(MediaPushError errorCode, String errorMessage) {
        System.out.println("OnPushError, errCode: " + errorCode + ", errMsg: " + errorMessage);
        pushError = true;
        endSemaphore.release();
    }

    public int GetDelayMilliSeconds() {
        if (mDuration <= 0) {
            return DEFAULT_DELAY_MILLIS;
        }

        return mDuration - (int)atomicLong.get() + BUFFER_DELAY_MILLIS;
    }

    public boolean isError() {
        return pushError;
    }
}
