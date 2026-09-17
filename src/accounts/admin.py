from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .forms import MyAdminPasswordChangeForm, UserAdminChangeForm, UserAdminCreationForm
from .models import (
    PhoneVerificationChallenge,
    PhoneVerificationRateScope,
    PhoneVerificationSend,
    PhoneVerificationTicket,
    User,
    mask_phone_number,
)


class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances

    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    change_password_form = MyAdminPasswordChangeForm
    change_user_password_template: str = "admin/auth/user/change_password.html"

    def masked_phone(self, obj):
        """Display masked phone number for privacy."""
        return mask_phone_number(obj.phone_number)

    masked_phone.short_description = "Phone Number"

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = (
        "masked_phone",
        "is_verified",
        "first_name",
        "last_name",
        "admin",
        "polling_center",
    )
    list_filter = ("admin", "is_verified", "is_phone_verified")

    autocomplete_fields = ["polling_center"]

    readonly_fields = ("expo_push_token",)

    fieldsets = (
        (None, {"fields": ("phone_number", "password", "expo_push_token")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "polling_center", "gender", "age")},
        ),
        (
            "Permissions",
            {"fields": ("staff", "active", "is_verified", "is_phone_verified")},
        ),
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


class ReadOnlyPhoneVerificationAdmin(admin.ModelAdmin):
    """Security records are created and consumed only by the verification service."""

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PhoneVerificationChallenge)
class PhoneVerificationChallengeAdmin(ReadOnlyPhoneVerificationAdmin):
    list_display = (
        "masked_phone",
        "purpose",
        "failed_attempts",
        "expires_at",
        "locked_until",
        "updated_at",
    )
    list_filter = ("purpose",)
    search_fields = ("phone_number",)
    ordering = ("-updated_at",)
    readonly_fields = (
        "id",
        "phone_number",
        "purpose",
        "user",
        "expires_at",
        "failed_attempts",
        "locked_until",
        "created_at",
        "updated_at",
    )
    fields = readonly_fields

    @admin.display(description="Phone number", ordering="phone_number")
    def masked_phone(self, obj):
        return mask_phone_number(obj.phone_number)


@admin.register(PhoneVerificationSend)
class PhoneVerificationSendAdmin(ReadOnlyPhoneVerificationAdmin):
    list_display = ("masked_phone", "purpose", "outcome", "created_at")
    list_filter = ("purpose", "outcome")
    ordering = ("-created_at",)
    readonly_fields = (
        "challenge",
        "purpose",
        "phone_reference",
        "client_ip_reference",
        "outcome",
        "provider_message_id",
        "created_at",
    )
    fields = readonly_fields

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("challenge")

    @admin.display(description="Phone number")
    def masked_phone(self, obj):
        return mask_phone_number(obj.challenge.phone_number)


@admin.register(PhoneVerificationRateScope)
class PhoneVerificationRateScopeAdmin(ReadOnlyPhoneVerificationAdmin):
    list_display = ("kind", "purpose", "updated_at")
    list_filter = ("kind", "purpose")
    ordering = ("-updated_at",)
    readonly_fields = ("kind", "purpose", "updated_at")
    fields = readonly_fields


@admin.register(PhoneVerificationTicket)
class PhoneVerificationTicketAdmin(ReadOnlyPhoneVerificationAdmin):
    list_display = (
        "purpose",
        "masked_phone",
        "expires_at",
        "consumed_at",
        "created_at",
    )
    list_filter = ("purpose",)
    ordering = ("-created_at",)
    readonly_fields = (
        "challenge",
        "purpose",
        "expires_at",
        "consumed_at",
        "created_at",
    )
    fields = readonly_fields

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("challenge")

    @admin.display(description="Phone number")
    def masked_phone(self, obj):
        return mask_phone_number(obj.challenge.phone_number)
