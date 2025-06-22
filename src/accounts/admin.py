from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .forms import MyAdminPasswordChangeForm, UserAdminChangeForm, UserAdminCreationForm
from .models import User


class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances

    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    change_password_form = MyAdminPasswordChangeForm
    change_user_password_template: str = "admin/auth/user/change_password.html"

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = (
        "phone_number",
        "is_verified",
        "first_name",
        "last_name",
        "admin",
        "polling_center",
    )
    list_filter = ("admin", "is_verified")

    autocomplete_fields = ["polling_center"]

    readonly_fields = ("expo_push_token",)

    fieldsets = (
        (None, {"fields": ("phone_number", "password", "expo_push_token")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "polling_center", "gender", "age")},
        ),
        ("Permissions", {"fields": ("staff", "active", "is_verified")}),
    )
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone_number", "password1", "password2"),
            },
        ),
    )
    search_fields = ("phone_number",)
    ordering = ("phone_number",)
    filter_horizontal = ()


admin.site.register(User, UserAdmin)
