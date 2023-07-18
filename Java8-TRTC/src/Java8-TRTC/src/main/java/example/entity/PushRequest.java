package example.entity;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PushRequest implements Serializable {
    private long SdkAppId;
    private long RoomId = 0;
    private String StrRoomId = "";
    private String UserId;
    private String ClientRole = "";
    private String VideoSrc;
    private String UserSig;
    private String Mode = "";

    // Redis
    private boolean Redis = false;
    private String RedisHost = "";
    private int RedisPort = 0;
    private String RedisInstanceId = "";
    private String RedisPassword = "";

    public long getSdkAppId() {
        return SdkAppId;
    }

    public void setSdkAppId(long sdkAppId) {
        SdkAppId = sdkAppId;
    }

    public long getRoomId() {
        return RoomId;
    }

    public void setRoomId(long roomId) {
        RoomId = roomId;
    }

    public String getStrRoomId() {
        return StrRoomId;
    }

    public void setStrRoomId(String strRoomId) {
        StrRoomId = strRoomId;
    }

    public String getUserId() {
        return UserId;
    }

    public void setUserId(String userId) {
        UserId = userId;
    }

    public String getClientRole() {
        return ClientRole;
    }

    public void setClientRole(String clientRole) {
        ClientRole = clientRole;
    }

    public String getVideoSrc() {
        return VideoSrc;
    }

    public void setVideoSrc(String videoSrc) {
        VideoSrc = videoSrc;
    }

    public String getUserSig() {
        return UserSig;
    }

    public void setUserSig(String userSig) {
        UserSig = userSig;
    }

    public String getMode() {
        return Mode;
    }

    public void setMode(String mode) {
        Mode = mode;
    }

    public boolean isRedis() {
        return Redis;
    }

    public void setRedis(boolean redis) {
        Redis = redis;
    }

    public String getRedisHost() {
        return RedisHost;
    }

    public void setRedisHost(String redisHost) {
        RedisHost = redisHost;
    }

    public int getRedisPort() {
        return RedisPort;
    }

    public void setRedisPort(int redisPort) {
        RedisPort = redisPort;
    }

    public String getRedisInstanceId() {
        return RedisInstanceId;
    }

    public void setRedisInstanceId(String redisInstanceId) {
        RedisInstanceId = redisInstanceId;
    }

    public String getRedisPassword() {
        return RedisPassword;
    }

    public void setRedisPassword(String redisPassword) {
        RedisPassword = redisPassword;
    }

    @Override
    public String toString() {
        return "PushRequest{" +
                "SdkAppId=" + SdkAppId +
                ", RoomId=" + RoomId +
                ", StrRoomId='" + StrRoomId + '\'' +
                ", UserId='" + UserId + '\'' +
                ", ClientRole='" + ClientRole + '\'' +
                ", VideoSrc='" + VideoSrc + '\'' +
                ", UserSig='" + UserSig + '\'' +
                ", Mode=" + Mode +
                ", Redis=" + Redis +
                ", RedisHost='" + RedisHost + '\'' +
                ", RedisPort=" + RedisPort +
                ", RedisInstanceId='" + RedisInstanceId + '\'' +
                ", RedisPassword='" + RedisPassword + '\'' +
                '}';
    }
}
