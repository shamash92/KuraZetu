from django.contrib.auth import login, logout
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.views import generic

from accounts.forms import LoginForm


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

    def get_form_kwargs(self):
        return {**super().get_form_kwargs(), "request": self.request}

    def form_valid(self, form):
        login(self.request, form.user)
        return super().form_valid(form)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect("/")


class PasswordResetView(generic.RedirectView):
    """Send legacy reset links to the OTP-protected client flow."""

    def get_redirect_url(self, *args, **kwargs):
        return "/ui/password-reset/"


class AlreadyLoggedInView(generic.TemplateView):
    template_name = "accounts/already-loggedin.html"
