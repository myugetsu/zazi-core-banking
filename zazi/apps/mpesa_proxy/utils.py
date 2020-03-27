from zazi.core import service

from django.conf import settings
from django.shortcuts import reverse

#-------

def c2b_stk_push_callback_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_c2b_stk_push_callback_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

def c2b_validation_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_c2b_validation_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

def c2b_confirmation_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_c2b_confirmation_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

#-------

def balance_check_result_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_balance_check_result_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

def balance_check_queue_timeout_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_balance_check_queue_timeout_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

#-------

def reversal_result_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_reversal_result_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

def reversal_queue_timeout_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_reversal_queue_timeout_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

#-------

def b2c_result_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_b2c_result_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)


def b2c_queue_timeout_url(data, organization_id=None, reference=None):
    url = reverse('mpesa_b2c_queue_timeout_url', kwargs={
        "organization_id": organization_id, 
        "reference": reference
    })
    
    return service.post(url, json=data, api_url=settings.MPESA_API_URL)

