from django.contrib import admin
from django.urls import path, re_path

from ui.views import react_view

urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"ui/.*", react_view, name="react"),
]
