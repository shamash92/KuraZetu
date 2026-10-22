from django.urls import path, re_path

from accounts.views import (
    AlreadyLoggedInView,
    DeleteAccountConfirmView,
    LoginView,
    PasswordResetView,
    delete_account_done_view,
    delete_account_view,
    logout_view,
)

urlpatterns = [
    re_path(r"^login/$", LoginView.as_view(), name="login"),
    re_path(r"^logout/$", logout_view, name="logout"),
    re_path(r"^password-reset/$", PasswordResetView.as_view(), name="password_reset"),
    path("already-logged-in/", AlreadyLoggedInView.as_view(), name="already_logged_in"),
    path("delete/", delete_account_view, name="delete_account"),
    path(
        "delete/confirm/",
        DeleteAccountConfirmView.as_view(),
        name="delete_account_confirm",
    ),
    path("delete/done/", delete_account_done_view, name="delete_account_done"),
]
