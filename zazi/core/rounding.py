import decimal

from decimal import Decimal as D

#----------------
# Here are all your options for rounding:
# ROUND_05UP       ROUND_DOWN       ROUND_HALF_DOWN  ROUND_HALF_UP
# ROUND_CEILING    ROUND_FLOOR      ROUND_HALF_EVEN  ROUND_UP

def __round(amount, decimal_places=2, rounding=decimal.ROUND_HALF_DOWN):
    return D(D(amount).quantize(D(1/(D(10) ** decimal_places)), rounding=rounding))

#----------------

def round_half_down(amount, decimal_places=2):
    return __round(amount, decimal_places=decimal_places, rounding=decimal.ROUND_HALF_DOWN)

def round_down(amount, decimal_places=2):
    if decimal_places == 0:
        return D(int(float(amount)))
    
    return __round(amount, decimal_places=decimal_places, rounding=decimal.ROUND_HALF_DOWN)


def round_half_up(amount, decimal_places=2):
    return __round(amount, decimal_places=decimal_places, rounding=decimal.ROUND_HALF_UP)

def round_up(amount, decimal_places=2):
    return __round(amount, decimal_places=decimal_places, rounding=decimal.ROUND_UP)
