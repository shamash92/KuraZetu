from django.urls import path

from specs.api.views import (
    AccessPolicyView,
    AuthorDocumentSetsView,
    AuthorDocumentSetView,
    AuthorLibraryView,
    AuthorSpecificationView,
    DocumentSetOrderView,
    LibraryView,
    PublishView,
    ReadersView,
    RevisionView,
    SpecificationPageView,
)

urlpatterns = [
    path("", LibraryView.as_view(), name="specs_library_api"),
    path("author/", AuthorLibraryView.as_view(), name="specs_author_library_api"),
    # Before the specification routes: an address never has this form.
    path(
        "author/sets/",
        AuthorDocumentSetsView.as_view(),
        name="specs_author_document_sets_api",
    ),
    path(
        "author/sets/<slug:slug>/",
        AuthorDocumentSetView.as_view(),
        name="specs_author_document_set_api",
    ),
    path(
        "author/sets/<slug:slug>/order/",
        DocumentSetOrderView.as_view(),
        name="specs_document_set_order_api",
    ),
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
