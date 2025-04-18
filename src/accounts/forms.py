from django import forms
from django.contrib.auth import authenticate, login
from django.contrib.auth.forms import AdminPasswordChangeForm, ReadOnlyPasswordHashField
from phonenumber_field.formfields import PhoneNumberField

from accounts.models import User


class LoginForm(forms.Form):
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
        phone_number = self.cleaned_data.get("phone_number")
        qs = User.objects.filter(phone_number=phone_number)

        if qs.exists():
            print("qs exists")

        if not qs.exists():
            raise forms.ValidationError("This Phone Number is not registered")

        return phone_number

    def clean_password(self):
        print("in clean password")
        phone_number = self.cleaned_data.get("phone_number")
        password = self.cleaned_data.get("password")
        qs = User.objects.filter(phone_number=phone_number)

        print(qs, "qs")
        if qs.exists():
            print("qs exists")

        if qs.count() == 1 and self.cleaned_data.get("password"):
            try:
                user = authenticate(
                    phone_number=self.cleaned_data["phone_number"],
                    password=self.cleaned_data["password"],
                )
                if user is None:
                    raise forms.ValidationError("Invalid  Password")
            except Exception as e:
                print(e)
                raise forms.ValidationError("Invalid Phone Number or Password")
        else:
            pass
        return password

    def save(self, commit=False):
        print("in save")
        user = super(LoginForm, self).save(commit=False)

        # login the user
        try:
            user = authenticate(
                phone_number=self.cleaned_data["phone_number"],
                password=self.cleaned_data["password"],
            )

        except Exception as e:
            print(e)

        if user is not None:
            if user.is_active:
                login(self.request, user)
        return user


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
        max_length=40,
    )
    last_name = forms.CharField(
        max_length=40,
    )

    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(
        label="Password confirmation", widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = ("phone_number", "first_name", "last_name")

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
        print(dir(user), "uer")
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
        print("in save...")
        phone_number = self.cleaned_data.get("phone_number")
        qs = User.objects.filter(phone_number=phone_number)

        if not qs.exists():
            raise forms.ValidationError("This Phone Number is not registered")
        return phone_number

    def save(self, commit=False):
        print("in save method")
        user = super(PasswordResetForm, self).save(commit=False)

        return user
