"""Authentication shared by API views that serve web and Native."""

from django.db import transaction

from knox.auth import TokenAuthentication as KnoxTokenAuthentication
from knox.models import AuthToken
from rest_framework.authentication import SessionAuthentication

# Knox comes first so an explicit Authorization header wins over a leftover
# session cookie.
WEB_AND_NATIVE_AUTHENTICATION = (KnoxTokenAuthentication, SessionAuthentication)

NATIVE_AUTHENTICATION = (KnoxTokenAuthentication,)


def issue_native_token(user):
    """Replace the account's Native token; the raw value is returned once."""
    with transaction.atomic():
        AuthToken.objects.filter(user=user).delete()
        return AuthToken.objects.create(user)
