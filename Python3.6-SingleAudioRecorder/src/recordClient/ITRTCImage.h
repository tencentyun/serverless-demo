#ifndef TRTCIMAGE_H
#define TRTCIMAGE_H

#include "TRTCCloudDef.h"

enum ImageType {
  kJpeg = 0,
};

class ITRTCImageCallback {
 public:
  virtual ~ITRTCImageCallback() {}

  // 图像写文件完成,回调通知。
  // is_ok true,写文件成功，否则写文件失败。
  // file_path 文件路径
  // type 文件类型
  // 注意：请不要在回调处理函数同步调用 ITRTCImage 的任何方法。
  virtual void OnWriteComplete(const char* file_path,
                               ImageType type,
                               bool is_ok) = 0;
};

class ITRTCImage {
 public:
  virtual ~ITRTCImage() {}

  // 设置回调处理函数
  virtual void SetCallback(ITRTCImageCallback* callback) = 0;

  // 将一帧YUV420p格式的数据 以RGB格式压缩为指定格式并存文件。
  virtual int WriteImage(TRTCVideoFrame* frame,
                         const char* file_path,
                         ImageType type) = 0;
};


extern "C" {
ITRTCImage* CreateImage();

void DestroyImage(ITRTCImage* instance);

}
#endif  // TRTCIMAGE_H
