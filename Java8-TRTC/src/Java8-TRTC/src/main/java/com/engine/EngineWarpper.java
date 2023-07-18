package com.engine;


import java.io.*;
import java.lang.ref.WeakReference;
import java.math.BigInteger;
import java.util.Arrays;

import com.tencent.*;
import com.tencent.StringBuffer;

/**
 * 房间引擎包装类。
 */
public class EngineWarpper  extends  ITRTCMediaPusherCallback {

    private  TRTCParams param_;
    // TRTC 推流器参数配置
    private PushConfig push_config_;            

    // TRTC 推流器
    private ITRTCMediaPusher pusher_;

    // 需要推的链接
    private String url_ = "";

    /**
     * 加载动态库。
     */
    public static void init(){
        /**
         * 单进程版本
         * trtcenginewarper 依赖 libTrtcEngine.so 在 SDK压缩包的 lib目录下
         */
        System.loadLibrary("trtcenginewarper");
    }

    public EngineWarpper(){
        super();
 
        StringBuffer _userid = new StringBuffer();
        StringBuffer _usersig = new StringBuffer();
        String userid = "";
        String usersig = "";
        _userid.setBuffer(userid);
        _userid.setBuffer_len(userid.length());
        _usersig.setBuffer(usersig);
        _usersig.setBuffer_len(usersig.length());
        int _sdkappid = 1400188366;

        push_config_ = new PushConfig();
        param_ = new TRTCParams();
        param_.setSdkAppId(_sdkappid);
        param_.setRoomId(133333333);
        param_.setUserId(_userid);
        param_.setUserSig(_usersig);
        param_.setClientRole(TRTCClientRole.TRTCClientRole_Anchor);
        push_config_.setRoom_param(param_);

        pusher_ = trtcenginewarper.CreateMediaPusher();
        if (pusher_ == null){
            return;
        }
        pusher_.SetCallback(this);
        pusher_.StartWithConfig(push_config_);
    }

    /**
     * 业务流程开始
     * @return 0 成功
     */
    public int start(){
        pusher_.PushMedia(url_, "");
        return 0;
    }

    /**
     * 业务流程结束
     * @return 0 成功
     */
    public int stop(){
        pusher_.Stop();
        return 0;
    }

 
    @Override
    public void OnPushError(MediaPushError errcode, String errmsg) {
        // push 错误
        System.out.println("OnError code " + errcode + " message " + errmsg);
    }

    @Override
    public void OnPushProgress(String file_url, int position, int duration) {
        // push 进度 duration 是文件的总长度， position 是当前推的位置。
        System.out.println("OnPushProgress position " + position + " duration " + duration);
    }

    @Override
    public void OnPushBegin(String file_url) {
        /**
         * 推流开始 表明文件成功打开。
         */
        System.out.println("OnPushBegin open " + file_url + " ok!");
    }

    @Override
    public void OnPushEnd(String file_url) {
        /**
         * 进房成功回调这里。参数是进房耗时，单位ms
         */
        System.out.println("OnPushEnd   " + file_url);
    }
}