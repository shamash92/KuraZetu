import logging
import os

from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.views import generic

from accounts.forms import LoginForm, PasswordResetForm
from accounts.models import User

BASE_DIR = os.path.dirname((os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)


def home_view(request):
    return redirect("/ui/")


class LoginView(generic.FormView):
    form_class = LoginForm
    success_url = "/"
    template_name = "accounts/login.html"

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("/accounts/already-logged-in/")
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        user = User.objects.get(phone_number=form.cleaned_data["phone_number"])

        try:
            user = authenticate(
                phone_number=form.cleaned_data["phone_number"],
                password=form.cleaned_data["password"],
            )

        except Exception as e:
            logger.error("Exception: %s", e)

        if user is not None:
            if user.is_active:
                login(self.request, user)

        return super().form_valid(form)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect("/")


class PasswordResetView(generic.FormView):
    form_class = PasswordResetForm
    success_url = "/accounts/login/"
    template_name = "accounts/password_reset.html"

    def form_valid(self, form):
        # TODO: How do we confirm the phone number first via OTP?

        # This method is called when valid form data has been POSTed.

        try:
            user = User.objects.get(phone_number=form.cleaned_data.get("phone_number"))
            user.set_password(form.cleaned_data.get("password"))
            user.save()

        except Exception as e:
            logger.error("Exception: %s", e)
        return super().form_valid(form)


class AlreadyLoggedInView(generic.TemplateView):
    template_name = "accounts/already-loggedin.html"
