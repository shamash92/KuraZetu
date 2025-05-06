from django.urls import path

from accounts.api.views import SignupView

urlpatterns = [
    path(
        "signup/",
        SignupView.as_view(),
        name="signup_api",
    )
]
