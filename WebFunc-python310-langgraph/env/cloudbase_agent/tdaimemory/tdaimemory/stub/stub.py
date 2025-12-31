import logging
from abc import ABC
from typing import Optional

import httpx

from ..errors import TDAIException

logger = logging.getLogger(__name__)


class Stub(ABC):
    def __init__(self):
        raise NotImplementedError()


class HttpStub(Stub):
    """HTTP client class for communicating with a specified endpoint.

    Args:
        endpoint (str): The root URL of the target service.
        api_key (str): API key for authentication.
        service_id (str): Service identifier.
        timeout (int, optional): Request timeout in seconds. Defaults to 10.
        client (Optional[httpx.Client], optional): Optional httpx client instance. Defaults to None.
    """

    def __init__(
        self, endpoint: str, api_key: str, service_id: str, timeout: int = 10, client: Optional[httpx.Client] = None
    ):
        self.endpoint = endpoint
        self.timeout = timeout
        self.client = httpx
        self.client = client or httpx.Client(timeout=timeout, verify=False)
        self.headers = {
            "x-tdai-service-id": service_id,
            "Authorization": "Bearer {}".format(api_key),
        }

    def post(self, path: str, body: dict, timeout: Optional[int] = None) -> dict:
        """Send a POST request to the specified path.

        Args:
            path (str): Request path relative to the endpoint.
            body (dict): Request body data.
            timeout (Optional[int], optional): Request timeout in seconds. Defaults to None (uses instance default).

        Returns:
            dict: Parsed response data.

        Raises:
            Exception: If the request fails or the response status code is not 0.
        """
        timeout = timeout or self.client.timeout
        logger.debug("Request {} {}".format(path, body))
        res = self.client.post(url=f"{self.endpoint}{path}", json=body, headers=self.headers, timeout=timeout)
        logger.debug("Response {} {}".format(path, res.text))
        res.raise_for_status()
        data = res.json()
        if data.get("code") != 0:
            raise TDAIException(data, res.headers.get("x-qcloud-transaction-id"))
        return data.get("data")

    def close(self):
        """Close the HTTP client connection."""
        if isinstance(self.client, httpx.Client):
            self.client.close()
