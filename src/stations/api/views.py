from django.contrib.gis.geos import Point

from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

from stations.api.serializers import (
    ConstituencySerializer,
    CountySerializer,
    PollingCenterSerializer,
    WardSerializer,
    PollingCenterBoundarySerializer,
)
from stations.models import (
    Constituency,
    County,
    PollingCenter,
    Ward,
    PollingCenterVerification,
)


class CountiesBoundariesListAPIView(ListAPIView):
    """
    List all County Boundaries
    """

    queryset = County.objects.all()
    serializer_class = CountySerializer

    def get_queryset(self):
        return County.objects.all().order_by("name")


class ConstituenciesBoundariesListAPIView(ListAPIView):
    """
    List all Constituencies Boundaries
    """

    queryset = Constituency.objects.all()
    serializer_class = ConstituencySerializer

    def get_queryset(self, *args, **kwargs):
        county_number = self.kwargs.get("county_number")

        county_qs = County.objects.get(number=int(county_number))

        return Constituency.objects.filter(county=county_qs).order_by("name")


class WardBoundariesListAPIView(ListAPIView):
    """
    List all Ward Boundaries
    """

    queryset = Ward.objects.all()
    serializer_class = WardSerializer

    def get_queryset(self, *args, **kwargs):
        constituency_number = self.kwargs.get("constituency_number")

        constituency = Constituency.objects.get(number=constituency_number)

        return Ward.objects.filter(constituency=constituency).order_by("name")


class WardPollingCenterListAPIView(ListAPIView):
    """
    List all Ward Polling Centers
    """

    queryset = PollingCenter.objects.all()
    serializer_class = PollingCenterSerializer

    def get_queryset(self, *args, **kwargs):
        ward_number = self.kwargs.get("ward_number")

        ward = Ward.objects.get(number=ward_number)

        return PollingCenter.objects.filter(ward=ward).order_by("name")


class WardPollingCenterFromLocationListAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    queryset = PollingCenter.objects.all()
    serializer_class = PollingCenterSerializer

    def post(self, *args, **kwargs):
        data = self.request.data

        distance = kwargs.get(
            "distance_meters", 5000
        )  # Default distance is 5000 meters (5 km)

        distance_km = distance / 1000  # Convert meters to kilometers
        print(data, "data inside the server")
        print(distance, "distance inside the server")

        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if latitude is None or longitude is None:
            return Response(
                {"error": "Latitude and Longitude are required."},
                status=status.HTTP_200_OK,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return Response(
                {"error": "Latitude and Longitude must be valid numbers."},
                status=status.HTTP_200_OK,
            )

        user_location = Point(
            float(longitude), float(latitude)
        )  # Note: (x, y) = (lon, lat)

        qs = PollingCenter.objects.filter(
            pin_location__distance_lte=(
                user_location,
                distance,
            )
        ).order_by("name")

        if not qs.exists():
            return Response(
                {"error": f"No polling centers found within {distance_km} km."},
                status=status.HTTP_200_OK,
            )
        serializer = PollingCenterSerializer(qs, many=True)

        # print(serializer.data, "serializer data")

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class RandomUnverifiedPollingCenterAPIView(APIView):

    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [AllowAny]

    serializer_class = PollingCenterSerializer

    def get(self, request, *args, **kwargs):

        user = self.request.user
        admin_level = kwargs.get("admin_level")
        print(user, "user inside the server")
        print(admin_level, "admin level inside the server")

        if user.is_authenticated:
            print(user, "user is authenticated")
            if admin_level == "county":
                random_unverified_polling_center = (
                    PollingCenter.objects.filter(
                        ward__constituency__county=user.polling_center.ward.constituency.county,  # Assuming user has a county attribute
                        is_verified=False,
                        pin_location__isnull=False,
                    )
                    .order_by("?")
                    .first()
                )
            elif admin_level == "constituency":
                random_unverified_polling_center = (
                    PollingCenter.objects.filter(
                        ward__constituency=user.polling_center.ward.constituency,
                        is_verified=False,
                        pin_location__isnull=False,
                    )
                    .order_by("?")
                    .first()
                )
            elif admin_level == "ward":
                random_unverified_polling_center = (
                    PollingCenter.objects.filter(
                        ward=user.polling_center.ward,  # Assuming user has a ward attribute
                        is_verified=False,
                        pin_location__isnull=False,
                    )
                    .order_by("?")
                    .first()
                )
            else:
                random_unverified_polling_center = (
                    PollingCenter.objects.filter(
                        is_verified=False, pin_location__isnull=False
                    )
                    .order_by("?")
                    .first()
                )

            verified_by_user_qs = PollingCenterVerification.objects.filter(
                polling_center=random_unverified_polling_center,
                verified_by=user,
            )
            if verified_by_user_qs.exists():
                return Response(
                    {"error": "You have already verified this polling center"},
                    status=status.HTTP_200_OK,
                )
            else:
                print("No verification record found.")
                boundary_data = PollingCenterBoundarySerializer(
                    random_unverified_polling_center
                ).data

                return Response(
                    {
                        "data": boundary_data,
                    },
                    status=status.HTTP_200_OK,
                )
        else:
            print(user, "user is not authenticated")
            random_unverified_polling_center = (
                PollingCenter.objects.filter(
                    is_verified=False, pin_location__isnull=False
                )
                .order_by("?")
                .first()
            )
            boundary_data = PollingCenterBoundarySerializer(
                random_unverified_polling_center
            ).data

            # print(boundary_data, "boundary data")

            return Response(
                {
                    "data": boundary_data,
                },
                status=status.HTTP_200_OK,
            )


class VerificationPollingCenterAPIView(APIView):
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
    ]
    permission_classes = [AllowAny]

    queryset = PollingCenter.objects.all()
    serializer_class = PollingCenterSerializer

    def post(self, *args, **kwargs):
        data = self.request.data

        print(data, "data inside the server")

        user = self.request.user

        print(user, "user inside the server")

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        pollingCenterDBId = data.get("pollingCenterDBId")

        if latitude is None or longitude is None or pollingCenterDBId is None:
            return Response(
                {"error": "Latitude, Longitude and Polling Center ID are required."},
                status=status.HTTP_200_OK,
            )

        try:
            polling_center = PollingCenter.objects.get(pk=pollingCenterDBId)
            print(polling_center, "polling center")
        except PollingCenter.DoesNotExist:
            return Response(
                {"error": "Polling Center does not exist."},
                status=status.HTTP_200_OK,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return Response(
                {"error": "Latitude and Longitude must be valid numbers."},
                status=status.HTTP_200_OK,
            )

        suggested_location = Point(
            float(longitude), float(latitude)
        )  # Note: (x, y) = (lon, lat)

        print(suggested_location, "suggested location")

        try:
            x = PollingCenterVerification.objects.create(
                polling_center=polling_center,
                pin_location=suggested_location,
            )

            print(user.is_authenticated, "user authenticated")

            if user.is_authenticated:
                x.verified_by = user
                x.save()

        except Exception as e:
            return Response(
                {"error": "Suggested pin could not be saved."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Suggested pin saved successfully"},
            status=status.HTTP_200_OK,
        )
