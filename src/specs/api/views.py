from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import (
    GenericAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import WEB_AND_NATIVE_AUTHENTICATION
from specs.api.serializers import (
    AccessPolicyChangeSerializer,
    AuthorLibraryEntrySerializer,
    AuthorSpecificationSerializer,
    LibraryEntrySerializer,
    ReaderSerializer,
    RevisionSerializer,
    SpecificationPageSerializer,
)
from specs.models import AccessPolicy, Record, Revision, Specification, is_author


class SpecificationView:
    authentication_classes = WEB_AND_NATIVE_AUTHENTICATION
    permission_classes = [AllowAny]

    # What a person receives depends on the reader lists, so no response here
    # may be stored in a shared cache.
    @method_decorator(never_cache)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        return Specification.objects.discoverable_by(self.request.user).select_related(
            "current_revision"
        )


class LibraryView(SpecificationView, ListAPIView):
    serializer_class = LibraryEntrySerializer

    def get_queryset(self):
        return super().get_queryset().order_by("slug")


class SpecificationPageView(SpecificationView, RetrieveAPIView):
    lookup_field = "slug"
    serializer_class = SpecificationPageSerializer

    def retrieve(self, request, *args, **kwargs):
        spec = self.get_object()
        serializer_class = (
            SpecificationPageSerializer if spec.can_read else LibraryEntrySerializer
        )
        serializer = serializer_class(spec, context=self.get_serializer_context())
        return Response(serializer.data)


class AuthorView(SpecificationView):
    """Routes that exist only for an account with an author grant."""

    lookup_field = "slug"
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not is_author(request.user):
            raise Http404

    def get_queryset(self):
        return Specification.objects.select_related("current_revision")


class AuthorLibraryView(AuthorView, ListCreateAPIView):
    serializer_class = AuthorLibraryEntrySerializer

    def get_queryset(self):
        return super().get_queryset().order_by("slug")


class AuthorSpecificationView(AuthorView, RetrieveUpdateDestroyAPIView):
    serializer_class = AuthorSpecificationSerializer

    def destroy(self, request, *args, **kwargs):
        spec = self.get_object()
        if spec.current_revision_id:
            return Response(
                {"error": "A published specification cannot be deleted."},
                status=status.HTTP_409_CONFLICT,
            )
        spec.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublishView(AuthorView, GenericAPIView):
    serializer_class = AuthorSpecificationSerializer

    def post(self, request, slug):
        spec = self.get_object()
        if not spec.draft_body.strip():
            raise ValidationError({"body": "An empty draft cannot be published."})
        spec.publish(actor=request.user)
        return Response(self.get_serializer(spec).data)


class AccessPolicyView(AuthorView, GenericAPIView):
    serializer_class = AccessPolicyChangeSerializer

    # The record and the change it describes are written together or not at
    # all.
    @transaction.atomic
    def post(self, request, slug):
        spec = self.get_object()
        change = self.get_serializer(data=request.data)
        change.is_valid(raise_exception=True)
        policy = change.validated_data["access_policy"]

        if (
            policy == AccessPolicy.RESTRICTED_LISTED
            and not spec.safe_listing_title.strip()
        ):
            raise ValidationError(
                {"safe_listing_title": "A listed specification needs a safe title."}
            )
        if (
            spec.widens_disclosure(policy)
            and not change.validated_data["confirm_widening"]
        ):
            return Response(
                {"error": "Widening disclosure needs explicit confirmation."},
                status=status.HTTP_409_CONFLICT,
            )
        if policy != spec.access_policy:
            Record.objects.create(
                action=Record.Action.POLICY_CHANGED,
                specification=spec,
                actor=request.user,
                detail=f"{spec.access_policy}>{policy}",
            )
            spec.access_policy = policy
            spec.save(update_fields=["access_policy"])
        return Response(
            AuthorSpecificationSerializer(
                spec, context=self.get_serializer_context()
            ).data
        )


class ReadersView(AuthorView, GenericAPIView):
    serializer_class = ReaderSerializer

    @transaction.atomic
    def change(self, request, action):
        spec = self.get_object()
        reader = self.get_serializer(data=request.data)
        reader.is_valid(raise_exception=True)
        account = (
            get_user_model()
            .objects.filter(phone_number=reader.validated_data["phone_number"])
            .first()
        )
        if account is None:
            raise ValidationError({"phone_number": "No account has this phone number."})
        on_list = spec.readers.filter(pk=account.pk).exists()
        if (action == Record.Action.READER_ADDED) != on_list:
            if on_list:
                spec.readers.remove(account)
            else:
                spec.readers.add(account)
            Record.objects.create(
                action=action, specification=spec, actor=request.user, subject=account
            )
        return Response(
            AuthorSpecificationSerializer(
                spec, context=self.get_serializer_context()
            ).data
        )

    def post(self, request, slug):
        return self.change(request, Record.Action.READER_ADDED)

    def delete(self, request, slug):
        return self.change(request, Record.Action.READER_REMOVED)


class RevisionView(AuthorView, RetrieveAPIView):
    serializer_class = RevisionSerializer

    def get_object(self):
        return get_object_or_404(
            Revision,
            specification__slug=self.kwargs["slug"],
            sequence=self.kwargs["sequence"],
        )
