from django.urls import path

from accounts.api.views import LoginView, SignupView

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
]
