class ParamError(Exception):
    """Raise when params are incorrect"""


class TDAIException(Exception):
    def __init__(self, data: dict, req_id: str = None):
        super().__init__()
        self.code = data.get("code")
        self.message = data.get("message")
        self.request_id = req_id if req_id else data.get("req_id")

    def __str__(self) -> str:
        if self.request_id:
            return f"<{type(self).__name__}: (code={self.code}, message={self.message}, request_id={self.request_id})>"
        else:
            return f"<{type(self).__name__}: (code={self.code}, message={self.message})>"
