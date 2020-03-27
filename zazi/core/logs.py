try:
    import simplejson as json
except ImportError:
    from zazi.core import json

import logging

class TransactionFilter(logging.Filter):
    def __init__(self, codes=None):
        self.codes = codes or []

    def filter(self, record):
        message_dict = json.loads(record.msg)
        
        if message_dict.get("data"):
            return message_dict["data"] in self.codes

        return False
            