"""Authentication shared by API views that serve web and Native."""

from django.db import transaction

from knox.models import AuthToken


def issue_native_token(user):
    """Replace the account's Native token; the raw value is returned once."""
    with transaction.atomic():
        AuthToken.objects.filter(user=user).delete()
        return AuthToken.objects.create(user)
