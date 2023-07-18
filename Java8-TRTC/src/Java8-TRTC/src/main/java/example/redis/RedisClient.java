package example.redis;

import org.apache.commons.lang3.StringUtils;
import redis.clients.jedis.Jedis;

public class RedisClient {
    private static Jedis client;
    private final static String playPositionCacheKey = "trtc:play:position:%s";

    public static void init(String host, Integer port, String password, Integer timeout, boolean enabled) {
        if (! enabled) {
            return;
        }

        Jedis jedis = new Jedis(host, port, timeout);

        if (StringUtils.isNoneEmpty(password)) {
            jedis.auth(password);
        }

        if (StringUtils.isEmpty(jedis.ping())) {
            throw new RuntimeException("Connect redis failed");
        }
        client = jedis;

        System.out.println("Init redis client success.");
    }

    // Record play position to redis.
    public static void setPlayPosition(Object roomID, long position) {
        if (client == null) return;

        client.set(String.format(playPositionCacheKey, roomID), String.valueOf(position));
    }

    // Get play position from redis.
    public static long getPlayPosition(Object roomID) {
        if (client == null) return 0;

        String record = client.get(String.format(playPositionCacheKey, roomID));
        if (StringUtils.isNotEmpty(record)) {
            return Long.parseLong(record);
        }
        return 0;
    }

    // Clear room record in redis.
    public static void clear(Object roomID) {
        if (client == null) return;

        client.del(String.format(playPositionCacheKey, roomID));
    }

    public static void close() {
        if (client == null) return;

        client.close();
    }
}



