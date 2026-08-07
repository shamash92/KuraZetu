from django.contrib.auth import get_user_model
from django.urls import reverse

import pytest
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestLoginView:
    def test_login_with_correct_credentials_succeeds(self):
        User.objects.create_user(phone_number="+254712345678", password="pw12345")
        client = APIClient()
        response = client.post(
            reverse("login_api"),
            {"phone_number": "+254712345678", "password": "pw12345"},
        )
        assert response.status_code == 200
        assert "token" in response.data["data"]

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(phone_number="+254712345678", password="pw12345")
        client = APIClient()
        response = client.post(
            reverse("login_api"),
            {"phone_number": "+254712345678", "password": "wrongpw"},
        )
        assert response.status_code == 400
