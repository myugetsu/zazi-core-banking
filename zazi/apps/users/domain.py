from collections import namedtuple

User = namedtuple('User', (
    'username',
    'first_name',
    'last_name',
    'email',
    'is_staff',
    'is_active',
    'date_joined'))

UserAccount = namedtuple('UserAccount', (
    'account_id',
    'status',
    'user'
))
