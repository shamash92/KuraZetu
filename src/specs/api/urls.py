from django.urls import path

from specs.api.views import LibraryView, SpecificationPageView

urlpatterns = [
    path("", LibraryView.as_view(), name="specs_library_api"),
    path("<slug:slug>/", SpecificationPageView.as_view(), name="specs_page_api"),
]
