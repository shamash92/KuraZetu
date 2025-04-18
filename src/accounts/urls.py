from django.urls import include, path, re_path

from .views import LoginView, PasswordResetView, ProfileEdit, SignUp, logout_view

urlpatterns = [
    re_path(r"^signup/$", SignUp.as_view(), name="signup"),
    path("profile/edit/<int:pk>/", ProfileEdit.as_view(), name="profile_edit"),
    re_path(r"^login/$", LoginView.as_view(), name="login"),
    re_path(r"^logout/$", logout_view, name="logout"),
    re_path(r"^password-reset/$", PasswordResetView.as_view(), name="password_reset"),
]
