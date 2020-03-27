import requests

from django.conf import settings

#------------------

import logging
logger = logging.getLogger(__name__)

#------------------


def post(resource_url, api_url=settings.API_URL, data=None, json=None, auth_token=None, headers=None, referer=None):
    if headers is None:
        headers = {}

    if auth_token:
        headers.update(Authorization='Token %s' % auth_token)

    headers.update(Referer=(referer or f'https://{settings.SITE_DOMAIN}'))
    logger.debug(f'headers={headers}')

    try:
        response = requests.post(f"{api_url}{resource_url}", data=data, json=json, headers=headers)
        return response.json()
    except Exception as e:
        logger.exception(e)
        return


def get(resource_url, api_url=settings.API_URL, data=None, auth_token=None, headers=None, referer=None):
    if headers is None:
        headers = {}
    
    if auth_token:    
        headers.update(Authorization='Token %s' % auth_token)

    headers.update(Referer=(referer or f'https://{settings.SITE_DOMAIN}'))
    logger.debug(f'headers={headers}')

    try:
        response = requests.get(f"{api_url}{resource_url}", data=data, headers=headers)
        return response.json()
    except Exception as e:
        logger.exception(e)
        return

