from tencentcloud.vod.v20180717.models import ApplyUploadRequest, CommitUploadResponse


class VodUploadRequest(ApplyUploadRequest):
    def __init__(self):
        super(VodUploadRequest, self).__init__()
        self.MediaFilePath = None
        self.CoverFilePath = None
        self.ConcurrentUploadNumber = None


class VodUploadResponse(CommitUploadResponse):
    def __init__(self):
        super(VodUploadResponse, self).__init__()
