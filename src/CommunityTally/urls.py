from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework import permissions
from decouple import config
from accounts.views import home_view
from ui.views import react_view


from django.contrib.auth.models import User

from django_otp.admin import OTPAdminSite
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_totp.admin import TOTPDeviceAdmin
from django.contrib import admin

# Django admin customizations
admin.site.site_header = "Kura Zetu Admin"
admin.site.site_title = "Kura Zetu Admin Portal"
admin.site.index_title = "Welcome to the Kura Zetu Admin"


from django_otp.admin import OTPAdminSite

admin.site.__class__ = OTPAdminSite


admin_url_suffix = config("ADMIN_URL_SUFFIX", default="admin/")
urlpatterns = [
    path(f"{admin_url_suffix}/", admin.site.urls),  # to use OTP and dynamic name
    path("admin/", include("admin_honeypot.urls")),
    path("api/schema/yaml/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api-auth/", include("rest_framework.urls")),
    path("api/stations/", include("stations.api.urls")),
    path("accounts/", include("accounts.urls")),
    path("api/accounts/", include("accounts.api.urls")),
    path("api/results/", include("results.api.urls")),
    path("", home_view, name="home"),
    re_path(r"ui/.*", react_view, name="react"),
    path("__reload__/", include("django_browser_reload.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
