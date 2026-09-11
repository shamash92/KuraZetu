import logging

from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import AdminPasswordChangeForm, ReadOnlyPasswordHashField

from phonenumber_field.formfields import PhoneNumberField

from accounts.models import User

logger = logging.getLogger(__name__)


class LoginForm(forms.Form):
    # get user field
    phone_number = PhoneNumberField(
        initial="+254",
        help_text="Enter your phone number in +254",
        required=True,
    )
    password = forms.CharField(
        help_text="Enter your  password",
        widget=forms.PasswordInput,
        required=True,
    )

    def __init__(self, *args, request=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.request = request
        self.user = None

    def clean(self):
        cleaned = super().clean()
        phone_number = cleaned.get("phone_number")
        password = cleaned.get("password")
        if phone_number and password:
            self.user = authenticate(
                request=self.request,
                phone_number=str(phone_number),
                password=password,
            )
            if self.user is None:
                raise forms.ValidationError("Invalid phone number or password.")
        return cleaned


class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number"]  # Add fields as needed


class UserAdminCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password.
    """

    phone_number = forms.CharField(max_length=13, initial="+254")
    first_name = forms.CharField(
        max_length=20,
    )
    last_name = forms.CharField(
        max_length=20,
    )

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = (
            "phone_number",
            "first_name",
            "last_name",
            "age",
            "gender",
            "password1",
            "password2",
        )

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format

        user = super(UserAdminCreationForm, self).save(commit=False)
        user.phone_number = self.cleaned_data["phone_number"]
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()

            # TODO: verification of user?

        return user


class MyAdminPasswordChangeForm(AdminPasswordChangeForm):
    def save(self, commit=True):
        """
        Saves the new password.
        """
        password = self.cleaned_data["password1"]
        self.user.set_password(password)
        if commit:
            self.user.save()
        return self.user


class UserAdminChangeForm(forms.ModelForm):
    """
    A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    password hash display field.
    """

    password = ReadOnlyPasswordHashField()

    # # password reset
    # new_password1 = forms.CharField(label="New password", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("phone_number", "password", "active", "admin")

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]


class PasswordResetForm(forms.Form):
    # get user field
    phone_number = PhoneNumberField(
        initial="+254",
        help_text="Enter your phone number in +254",
        required=True,
    )
    password = forms.CharField(
        help_text="Enter your new password",
        widget=forms.PasswordInput,
        required=True,
    )

    def clean_phone_number(self):
        logger.debug("Validating Phone Number for password reset")
        phone_number = self.cleaned_data.get("phone_number")
        qs = User.objects.filter(phone_number=phone_number)

        if not qs.exists():
            raise forms.ValidationError("This Phone Number is not registered")
        return phone_number

    def save(self, commit=False):
        logger.debug("Saving Password Reset form")
        user = super(PasswordResetForm, self).save(commit=False)

        return user
