from django.urls import path

from accounts.api.phone_verification_views import (
    PasswordResetCompletionView,
    PasswordResetPhonePrefillView,
    PasswordResetPhoneVerificationStartView,
    PhoneVerificationCodeView,
    SignupCompletionView,
    SignupPhoneVerificationStartView,
)
from accounts.api.views import LoginView, PushTokenView, SignupView

urlpatterns = [
    path(
        "signup/",
        SignupView.as_view(),
        name="signup_api",
    ),
    path(
        "login/",
        LoginView.as_view(),
        name="login_api",
    ),
    path(
        "push-token/",
        PushTokenView.as_view(),
        name="push_token_api",
    ),
    path(
        "phone-verification/signup/start/",
        SignupPhoneVerificationStartView.as_view(),
        name="signup_phone_verification_start_api",
    ),
    path(
        "phone-verification/password-reset/start/",
        PasswordResetPhoneVerificationStartView.as_view(),
        name="password_reset_phone_verification_start_api",
    ),
    path(
        "phone-verification/password-reset/prefill/",
        PasswordResetPhonePrefillView.as_view(),
        name="password_reset_phone_prefill_api",
    ),
    path(
        "phone-verification/verify/",
        PhoneVerificationCodeView.as_view(),
        name="phone_verification_code_api",
    ),
    path(
        "phone-verification/signup/complete/",
        SignupCompletionView.as_view(),
        name="signup_completion_api",
    ),
    path(
        "phone-verification/password-reset/complete/",
        PasswordResetCompletionView.as_view(),
        name="password_reset_completion_api",
    ),
]
