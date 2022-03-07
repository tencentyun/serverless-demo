class Params:
    def __init__(self, video_url, audio, callback_url, framerate, height, width, texts, pictures, vod_region,
                 sub_app_id, class_id):
        self.audio = audio
        self.callback_url = callback_url
        self.framerate = framerate
        self.height = height
        self.width = width
        self.video_url = video_url
        self.sub_app_id = sub_app_id
        self.class_id = class_id
        self.vod_region = vod_region
        self.texts = texts
        self.pictures = pictures
