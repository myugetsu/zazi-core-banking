import json
import datetime

from decimal import Decimal as D
from collections import namedtuple, OrderedDict

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse


class JSONEncoder(DjangoJSONEncoder):
    def default(self, o):
        if type(o) == datetime.datetime:
            return o.replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%S")
        if type(o) == datetime.date:
            return o.strftime("%Y-%m-%dT%H:%M:%S")
        elif type(o) == tuple and hasattr(o, '_asdict'):
            dump = {}

            for key, value in o._asdict():
                dump[key] = self.default(value)

            return dump

        return super(JSONEncoder, self).default(o)


class JsonResponse(HttpResponse):
    """
    An HTTP response class that consumes data to be serialized to JSON.

    :param data: Data to be dumped into json. By default only ``dict`` objects
      are allowed to be passed due to a security flaw before EcmaScript 5. See
      the ``safe`` parameter for more information.
    :param encoder: Should be an json encoder class. Defaults to
      ``django.core.serializers.json.DjangoJSONEncoder``.
    :param safe: Controls if only ``dict`` objects may be serialized. Defaults
      to ``True``.
    :param json_dumps_params: A dictionary of kwargs passed to json.dumps().
    """

    def __init__(self, data, encoder=JSONEncoder, safe=True,
                 json_dumps_params=None, **kwargs):
        if safe and not isinstance(data, dict):
            raise TypeError(
                'In order to allow non-dict objects to be serialized set the '
                'safe parameter to False.'
            )
        if json_dumps_params is None:
            json_dumps_params = {}
        kwargs.setdefault('content_type', 'application/json')

        data = dumps(data, cls=encoder, **json_dumps_params)
        super(JsonResponse, self).__init__(content=data, **kwargs)


def dumps(data, cls=None, *args, **kwargs):
    if cls is None:
        cls = JSONEncoder

    return json.dumps(data, cls=cls, *args, **kwargs)

def loads(*args, **kwargs):
    return json.loads(*args, **kwargs)