from django.contrib.auth import login, logout
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render
from django.views import generic

from accounts.deletion import DeletionRefused, delete_account
from accounts.forms import LoginForm
from accounts.phone_verification import PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY


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
        if not form.user.is_phone_verified:
            self.request.session[PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY] = str(
                form.user.phone_number
            )
            return redirect("/ui/password-reset/?reason=phone_unverified")
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


DELETE_TEMPLATE = "accounts/delete_account.html"
DELETION_REFUSED_MESSAGE = (
    "This account can only be deleted by an administrator. Ask one to delete it."
)


def delete_account_view(request):
    """Step 1: what is deleted and what is kept. Public, never asks to sign in."""
    return render(request, DELETE_TEMPLATE, {"step": "about"})


class DeleteAccountConfirmView(generic.FormView):
    """Step 2: phone number and password, signed in or not."""

    form_class = LoginForm
    template_name = DELETE_TEMPLATE
    extra_context = {"step": "confirm"}

    def get_form_kwargs(self):
        return {**super().get_form_kwargs(), "request": self.request}

    def form_valid(self, form):
        signed_in_as_it = self.request.user.pk == form.user.pk
        try:
            delete_account(form.user, channel="web")
        except DeletionRefused:
            return self.render_to_response(
                self.get_context_data(form=form, refused=DELETION_REFUSED_MESSAGE)
            )
        if signed_in_as_it:
            # flush() rather than logout(): the logout signal would write an
            # auth log line tying this request to the deleted account.
            self.request.session.flush()
        return redirect("delete_account_done")


def delete_account_done_view(request):
    """Step 3: done."""
    return render(request, DELETE_TEMPLATE, {"step": "done"})
