/* ----------------------------------------------------------------------------
 * This file was automatically generated by SWIG (http://www.swig.org).
 * Version 2.0.10
 *
 * Do not make changes to this file unless you know what you are doing--modify
 * the SWIG interface file instead.
 * ----------------------------------------------------------------------------- */

package com.tencent;

public class ITRTCMediaMixer {
  private long swigCPtr;
  protected boolean swigCMemOwn;

  protected ITRTCMediaMixer(long cPtr, boolean cMemoryOwn) {
    swigCMemOwn = cMemoryOwn;
    swigCPtr = cPtr;
  }

  protected static long getCPtr(ITRTCMediaMixer obj) {
    return (obj == null) ? 0 : obj.swigCPtr;
  }

  protected void finalize() {
    delete();
  }

  public synchronized void delete() {
    if (swigCPtr != 0) {
      if (swigCMemOwn) {
        swigCMemOwn = false;
        trtcenginewarperJNI.delete_ITRTCMediaMixer(swigCPtr);
      }
      swigCPtr = 0;
    }
  }

  public void setCallback(ITRTCMediaMixerCallback callback) {
    trtcenginewarperJNI.ITRTCMediaMixer_setCallback(swigCPtr, this, ITRTCMediaMixerCallback.getCPtr(callback), callback);
  }

  public int setCanvas(int fps, int width, int height, int bgcolor) {
    return trtcenginewarperJNI.ITRTCMediaMixer_setCanvas(swigCPtr, this, fps, width, height, bgcolor);
  }

  public int start(boolean enableAudio, boolean enableVideo) {
    return trtcenginewarperJNI.ITRTCMediaMixer_start(swigCPtr, this, enableAudio, enableVideo);
  }

  public int stop() {
    return trtcenginewarperJNI.ITRTCMediaMixer_stop(swigCPtr, this);
  }

  public int clearRegions() {
    return trtcenginewarperJNI.ITRTCMediaMixer_clearRegions(swigCPtr, this);
  }

  public int setRegion(String id, Region region) {
    return trtcenginewarperJNI.ITRTCMediaMixer_setRegion(swigCPtr, this, id, Region.getCPtr(region), region);
  }

  public int applyRegions() {
    return trtcenginewarperJNI.ITRTCMediaMixer_applyRegions(swigCPtr, this);
  }

  public int addAudioFrame(String id, TRTCAudioFrame frame) {
    return trtcenginewarperJNI.ITRTCMediaMixer_addAudioFrame(swigCPtr, this, id, TRTCAudioFrame.getCPtr(frame), frame);
  }

  public int addVideoFrame(String id, TRTCVideoFrame frame) {
    return trtcenginewarperJNI.ITRTCMediaMixer_addVideoFrame(swigCPtr, this, id, TRTCVideoFrame.getCPtr(frame), frame);
  }

}
