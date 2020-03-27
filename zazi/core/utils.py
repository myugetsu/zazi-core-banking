import boto3
import datetime
import logging
import urllib
import os
import re

from django import forms
from django.conf import settings
from django.utils import timezone
from django.urls import reverse
from django.utils.crypto import get_random_string as generate_random_alphanumeric

from zazi.core import json
from zazi.core.safaricom import SAFARICOM_PREFIXES

#--------------

logger = logging.getLogger(__name__)

#---------------

def get_absolute_url(url_name, kwargs=None, endpoint=None):
    url = reverse(url_name, kwargs=kwargs)

    if url.startswith("/private/"):
        url = url[8:]
    
    endpoint = endpoint or settings.SITE_DOMAIN

    return f"{endpoint}{url}"

def generate_activation_code(limit=None):
    return generate_random_alphanumeric()[:(limit or settings.USER_ACTIVATION_CODE_LENGTH)]

def generate_id(no_of_chars=16):
    return generate_random_alphanumeric(length=no_of_chars).lower()

def get_time(days=5):
    return (timezone.now() + datetime.timedelta(days=days))

def access_code_expires_on(days=30):
    return get_time(days=days)

def password_reset_expires_on(days=3):
    return get_time(days=days)

def activation_code_expires_on(days=3):
    return get_time(days=days)

def extract_body(request, *args, **kwargs):

    try:
        data = json.loads(request.body)
    except Exception:
        data = {}
        logger.error(
            json.dumps(dict(message="Error decoding data submitted.", args=args, kwargs=kwargs)), exc_info=True)
        
    return data

def create_database_url(database_dict, base_dir=settings.BASE_DIR.child("db")):
    if database_dict:
        database_dict = database_dict.copy()

        if 'sqlite' in (database_dict.get('ENGINE') or ''):
            return "sqlite:///%s" % (base_dir.child(database_dict.get('NAME')) or '')
        else:
            if 'PASSWORD' in database_dict:
                database_dict['PASSWORD'] = urllib.quote_plus(database_dict['PASSWORD'])
            
            if 'post' in (database_dict.get('ENGINE') or ''):
                database_dict['PORT'] = 5432
                return "postgres://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s" % database_dict
            elif 'mysql' in (database_dict.get('ENGINE') or ''):
                database_dict['PORT'] = 3306
                return "mysql://%(USER)s:%(PASSWORD)s@%(HOST)s:%(PORT)s/%(NAME)s" % database_dict

def get_file_location(instance, filename, prepend=None, specific_folder=None, by_date=False, getter=None, prepare=False):
    args = tuple()

    if getter is None:
        def _getter(instance):
            return str(instance) 
        getter = _getter

    if prepend is not None:
        args += (prepend,)

    args += (getter(instance),)

    if specific_folder is not None:
        args += (specific_folder,)

    if by_date:
        args += (timezone.now().strftime("%Y/%m/%d"),)

    args += (filename,)

    file_location = os.path.join(*args)

    if prepare:
        from django.core.files.storage import default_storage
        default_storage.generate_filename(file_location)

    return file_location

def is_valid_phone_number(phone_number):
    if re.match(r"^(\+?254|0)7[\d]{8}$", phone_number):
        return True
    return False

def validate_safaricom_number(phone_number):
    if not phone_number.startswith("254"):
        phone_number = validate_phone_number(phone_number)

    return (phone_number[:6] in SAFARICOM_PREFIXES) \
        if phone_number else phone_number

def validate_phone_number(phone_number):
    if not phone_number:
        return

    if is_valid_phone_number(phone_number):
        if phone_number.startswith('7'):
            return f'254{phone_number}'
        elif phone_number.startswith('07'):
            return f'254{phone_number[1:]}'
        elif phone_number.startswith('+254'):
            phone_number = phone_number[1:]

        return phone_number

    raise forms.ValidationError("Invalid phone number.")

def parse_date(date, format="%d-%b-%y", formats=None, to_date=True):
    if formats is None:
        formats = settings.DEFAULT_DATETIME_INPUT_FORMATS

    for _format in formats:
        if date:
            try:
                parsed_date = datetime.datetime.strptime(date, _format)
                return parsed_date.date() if to_date else parse_date
            except (ValueError, TypeError):
                pass

    if format:
        parsed_date = datetime.datetime.strptime(date, format)
        return parsed_date.date() if to_date else parse_date


def get_encrypted_text(plain_text, function_name=None):
    c = boto3.client('lambda', 
        aws_access_key_id=settings.ENCRYPTION_INVOKER_ACCESS_KEY_ID,
        aws_secret_access_key=settings.ENCRYPTION_INVOKER_SECRET_ACCESS_KEY,
        region_name="us-east-1")

    logger.info("Boto client %s prepared" % c)

    try:
        logger.debug("Invoking lambda with access key id %s" % settings.ENCRYPTION_INVOKER_ACCESS_KEY_ID)
        response = c.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',  
            Payload=json.dumps({
                "text": plain_text
            }))
        
        logger.info("Response returned %s" % response)
        payload = json.loads(response['Payload'].read())
        
        return payload['encrypted']
    except (TypeError, KeyError) as e:
        logger.exception(e)
        return 
