"""Authentication shared by API views that serve web and Native."""

from django.db import transaction

from knox.auth import TokenAuthentication as KnoxTokenAuthentication
from knox.models import AuthToken
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

# Token classes come first so an explicit Authorization header wins over a
# leftover session cookie. DRF tokens remain accepted until Native uses Knox.
WEB_AND_NATIVE_AUTHENTICATION = (
    KnoxTokenAuthentication,
    TokenAuthentication,
    SessionAuthentication,
)

NATIVE_AUTHENTICATION = (KnoxTokenAuthentication,)


def issue_native_token(user):
    """Replace the account's Native token; the raw value is returned once."""
    with transaction.atomic():
        AuthToken.objects.filter(user=user).delete()
        return AuthToken.objects.create(user)
