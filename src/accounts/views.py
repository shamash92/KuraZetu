import json
import os

import requests
from decouple import config
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views import generic
from django.views.generic import TemplateView
from django.views.generic.base import TemplateView
from django.views.generic.edit import CreateView, UpdateView
from rest_framework.response import Response

from accounts.forms import (
    LoginForm,
    PasswordResetForm,
    UserAdminCreationForm,
    UserUpdateForm,
)
from accounts.models import User

BASE_DIR = os.path.dirname((os.path.dirname(os.path.abspath(__file__))))


def get_js_bundle():
    print(BASE_DIR, "BASE DIR")

    IS_PROD = config("IS_PROD", default=False, cast=bool)

    print(IS_PROD, "is prod")

    if IS_PROD is False:
        # Local file path
        url = os.path.join(BASE_DIR, "ui/static/ui/manifest.json")
        with open(url, "r") as f:
            manifest = json.load(f)
    else:
        # S3 endpoint for prod
        s3_endpoint = config("S3_ENDPOINT_URL")
        url = f"{s3_endpoint}/static/ui/manifest.json"
        response = requests.get(url)
        if response.status_code == 200:
            manifest = response.json()
        else:
            raise Exception(f"Error fetching manifest from S3: {response.status_code}")

    return manifest["main.js"]


def react_view(request):
    js_bundle = get_js_bundle()

    print(js_bundle, "JS BUNDLE")

    return render(request, "ui/index.html", {"js_bundle": js_bundle})


# login_required decorator
def login_required(view):
    def wrapper_function(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view(request, *args, **kwargs)

        else:
            return redirect("/accounts/login/")

    return wrapper_function


# redirect page to home
@login_required
def home(request):
    if (
        request.user.is_authenticated and request.user.is_verified
    ):  # TODO: make a better if statement, s`is_verified` is just a placeholder
        return render(request, "accounts/lme-home.html")
    return render(request, "accounts/lme-home.html")


class SignUp(CreateView):
    template_name = "accounts/register.html"
    form_class = UserAdminCreationForm
    success_url = "/"

    def form_valid(self, form):
        # This method is called when valid form data has been Posted.
        # It should return an HttpResponse.
        # form.send_email()
        return super(SignUp, self).form_valid(form)


class ProfileEdit(UpdateView):
    template_name = "accounts/edit-profile.html"
    form_class = UserUpdateForm
    success_url = "/"
    queryset = User.objects.all()

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        # form.send_email()
        return super(ProfileEdit, self).form_valid(form)


# Login View Django
def login_view(request):
    if request.method == "POST":
        form = LoginForm(request, request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect("/")
    else:
        form = LoginForm()
    return render(request, "accounts/login.html", {"form": form})


class LoginView(generic.FormView):
    # form_class = AuthenticationForm
    form_class = LoginForm
    success_url = "/"
    template_name = "accounts/login.html"

    def form_valid(self, form):
        print("form validation in views")
        user = User.objects.get(phone_number=form.cleaned_data["phone_number"])

        try:
            user = authenticate(
                phone_number=form.cleaned_data["phone_number"],
                password=form.cleaned_data["password"],
            )
            print(user, "user")

        except Exception as e:
            print(e)

        print(user, "user")
        if user is not None:
            if user.is_active:
                login(self.request, user)

        return super().form_valid(form)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect("/accounts/login")


class PasswordResetView(generic.FormView):
    form_class = PasswordResetForm
    success_url = "/accounts/login/"
    template_name = "accounts/password_reset.html"

    def form_valid(self, form):
        # This method is called when valid form data has been POSTed.
        # It should return an HttpResponse.
        # form.send_email()

        # get  data from form
        print(dir(form))
        print((form.cleaned_data))

        phone_number = form.cleaned_data.get("phone_number")
        password = form.cleaned_data.get("password")
        print(phone_number, "should be phone number")
        print(password, "should be password")

        print("form validation in views")

        try:
            user = User.objects.get(phone_number=form.cleaned_data.get("phone_number"))
            user.set_password(form.cleaned_data.get("password"))
            user.save()

        except Exception as e:
            print(e)
        return super().form_valid(form)
