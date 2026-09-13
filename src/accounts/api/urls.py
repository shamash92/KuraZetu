from django.urls import path

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
]
