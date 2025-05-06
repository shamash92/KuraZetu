from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from accounts.views import home_view
from ui.views import react_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("api/stations/", include("stations.api.urls")),
    path("accounts/", include("accounts.urls")),
    path("api/accounts/", include("accounts.api.urls")),
    path("", home_view, name="home"),
    re_path(r"ui/.*", react_view, name="react"),
    path("__reload__/", include("django_browser_reload.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
