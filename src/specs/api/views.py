from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.authentication import WEB_AND_NATIVE_AUTHENTICATION
from specs.api.serializers import LibraryEntrySerializer, SpecificationPageSerializer
from specs.models import Specification


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
