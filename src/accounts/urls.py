from django.urls import path, re_path

from accounts.views import LoginView, PasswordResetView, logout_view

urlpatterns = [
    re_path(r"^login/$", LoginView.as_view(), name="login"),
    re_path(r"^logout/$", logout_view, name="logout"),
    re_path(r"^password-reset/$", PasswordResetView.as_view(), name="password_reset"),
]
