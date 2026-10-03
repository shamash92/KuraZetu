from django.urls import path

from specs.api.views import (
    AccessPolicyView,
    AuthorLibraryView,
    AuthorSpecificationView,
    LibraryView,
    PublishView,
    ReadersView,
    RevisionView,
    SpecificationPageView,
)

urlpatterns = [
    path("", LibraryView.as_view(), name="specs_library_api"),
    path("author/", AuthorLibraryView.as_view(), name="specs_author_library_api"),
    path(
        "author/<slug:slug>/",
        AuthorSpecificationView.as_view(),
        name="specs_author_specification_api",
    ),
    path(
        "author/<slug:slug>/publish/",
        PublishView.as_view(),
        name="specs_publish_api",
    ),
    path(
        "author/<slug:slug>/access-policy/",
        AccessPolicyView.as_view(),
        name="specs_access_policy_api",
    ),
    path(
        "author/<slug:slug>/readers/",
        ReadersView.as_view(),
        name="specs_readers_api",
    ),
    path(
        "author/<slug:slug>/revisions/<int:sequence>/",
        RevisionView.as_view(),
        name="specs_revision_api",
    ),
    path("<slug:slug>/", SpecificationPageView.as_view(), name="specs_page_api"),
]
