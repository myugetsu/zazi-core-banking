from dateutil.relativedelta import relativedelta
from django.utils import timezone

def top_of_the_hour(time=None):
    """
    get the time at the top of the current hour

    >>> top_of_the_hour(5)
    120
    """
    return (time or timezone.localtime())\
        .replace(microsecond=0, second=0, minute=0)


def is_start_of_new_month(time=None):
    """

    is_start_of_new_month()
    
    """
    time = time or top_of_the_hour()

    return (time.day, time.hour) == (1, 0)


def is_start_of_new_day(time=None):
    """

    is_start_of_new_day()
    
    """
    time = time or top_of_the_hour()

    return time.hour == 0

def first_day_of_last_month(time=None):
    return ((time or top_of_the_hour()) - relativedelta(month=1)).replace(day=1)


def __days_ago(time=None, days=30):
    return ((time or timezone.now()) - relativedelta(days=days))


def _90_days_ago(time=None):
    return __days_ago(days=90)


def _1_day_ago(time=None):
    return __days_ago(days=1)


def _30_days_ago(time=90):
    return __days_ago(days=30)


def _60_days_ago(time=90):
    return __days_ago(days=60)