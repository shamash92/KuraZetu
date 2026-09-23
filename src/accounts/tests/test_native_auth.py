from django.contrib import admin
from django.contrib.auth import get_user_model

import pytest
from knox.models import AuthToken

from accounts.authentication import issue_native_token

User = get_user_model()
NUMBER = "+254700000001"
PASSWORD = "test-password-only"

pytestmark = pytest.mark.django_db


def verified_user(number=NUMBER):
    user = User.objects.create_user(phone_number=number, password=PASSWORD)
    user.is_phone_verified = True
    user.save(update_fields=("is_phone_verified",))
    return user


@pytest.fixture
def user():
    return verified_user()


def test_each_account_keeps_one_hashed_native_token(user):
    issue_native_token(user)
    instance, token = issue_native_token(user)

    assert list(AuthToken.objects.filter(user=user)) == [instance]
    assert token not in instance.digest


def test_admin_lists_native_tokens_masked_and_cannot_mint_them(user, rf):
    issue_native_token(user)
    token_admin = admin.site._registry[AuthToken]
    request = rf.get("/")

    assert "digest" not in token_admin.list_display
    assert NUMBER not in token_admin.masked_phone(AuthToken.objects.get())
    assert not token_admin.has_add_permission(request)
    assert not token_admin.has_change_permission(request)
