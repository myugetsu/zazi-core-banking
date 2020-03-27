import logging
import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)


class MpesaBase:
    def __init__(self, env="sandbox", app_key=None, app_secret=None, sandbox_url="https://sandbox.safaricom.co.ke",
                 live_url="https://safaricom.co.ke", timeout=None):
        self.env = env
        self.app_key = app_key
        self.app_secret = app_secret
        self.sandbox_url = sandbox_url
        self.live_url = live_url
        self.token = None
        self.timeout = timeout
        self._base_safaricom_url = None


    def request(self, url, auth=None, method='post', *args, **kwargs):
        try:
            url = f"{self.base_safaricom_url}{url}"

            if auth is None:
                if self.token is None:
                    self.authenticate()

                headers = { 'Authorization': f'Bearer {self.token}', 'Content-Type': "application/json" }
                kwargs = { **kwargs, "headers": headers }
            else:
                kwargs = { **kwargs, "auth": auth }

            r = requests.request(method, url, *args, **kwargs)
            logger.info({ "url": url, "args": args, "kwargs": kwargs , "r.content": r.text })

            response = r.json()
            return response    
        except Exception as e:
            logger.debug(f"Got an exception making a `get` request to `{url}`")
            logger.exception(e)


    @property
    def base_safaricom_url(self):
        if not self._base_safaricom_url:
            if self.env == "production":
                self._base_safaricom_url = self.live_url
            else:
                self._base_safaricom_url = self.sandbox_url

            if self._base_safaricom_url.endswith("/"):
                self._base_safaricom_url = self._base_safaricom_url[:-1]

        return self._base_safaricom_url


    def authenticate(self):
        """To make Mpesa API calls, you will need to authenticate your app. This method is used to fetch the access token
        required by Mpesa. Mpesa supports client_credentials grant type. To authorize your API calls to Mpesa,
        you will need a Basic Auth over HTTPS authorization token. The Basic Auth string is a base64 encoded string
        of your app's client key and client secret.

            **Args:**
                - env (str): Current app environment. Options: sandbox, live.
                - app_key (str): The app key obtained from the developer portal.
                - app_secret (str): The app key obtained from the developer portal.
                - sandbox_url (str): Base Safaricom sandbox url.
                - live_url (str): Base Safaricom live url.

            **Returns:**
                - access_token (str): This token is to be used with the Bearer header for further API calls to Mpesa.

            """

        authenticate_url = f"/oauth/v1/generate?grant_type=client_credentials"

        response = self.request(
            authenticate_url,
            auth=HTTPBasicAuth(self.app_key, self.app_secret),
            timeout=self.timeout,
            method='get')
        
        if response is not None:
            self.token = response['access_token']

            logger.debug({ **response, "message": "Received Access Token" })

            return self.token
        else:
            logger.debug("Received a null response calling for request")
