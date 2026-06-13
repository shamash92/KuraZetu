from django.contrib.gis.geos import Point
from django.db import transaction
from django.db.models import F

from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

from stations.api.serializers import (
    ConstituencySerializer,
    CountySerializer,
    PollingCenterSerializer,
    WardSerializer,
    PollingCenterBoundarySerializer,
    PartiallyVerifiedPollingCenterBoundarySerializer,
    CommunityNotesPollingCenterSerializer,
    PollingStationSerializer,
    PollingStationInfoSerializer,
)
from stations.models import (
    Constituency,
    County,
    PollingCenter,
    Ward,
    PollingCenterVerification,
    PollingStation,
)
from stations.verification import recompute_consensus


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

        total_stations_count = 0
        verified_stations_count = 0

        if user.is_authenticated:
            print(user, "user is authenticated")

            if admin_level == "county":
                all_county_stations_qs = PollingCenter.objects.filter(
                    ward__constituency__county=user.polling_center.ward.constituency.county,
                )
                total_stations_count = all_county_stations_qs.count()

                verified_by_user_in_county_qs = PollingCenterVerification.objects.filter(
                    polling_center__ward__constituency__county=user.polling_center.ward.constituency.county,
                    verified_by=user,
                )
                verified_stations_count = verified_by_user_in_county_qs.count()

                random_unverified_polling_center = (
                    all_county_stations_qs.filter(
                        is_verified=False,
                        pin_location__isnull=False,
                    )
                    .order_by("?")
                    .first()
                )

            elif admin_level == "constituency":
                all_constituency_stations_qs = PollingCenter.objects.filter(
                    ward__constituency=user.polling_center.ward.constituency,
                )
                total_stations_count = all_constituency_stations_qs.count()
                verified_by_user_in_constituency_qs = PollingCenterVerification.objects.filter(
                    polling_center__ward__constituency=user.polling_center.ward.constituency,
                    verified_by=user,
                )
                verified_stations_count = verified_by_user_in_constituency_qs.count()
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
                all_ward_stations_qs = PollingCenter.objects.filter(
                    ward=user.polling_center.ward,
                )
                total_stations_count = all_ward_stations_qs.count()
                verified_by_user_in_ward_qs = PollingCenterVerification.objects.filter(
                    polling_center__ward=user.polling_center.ward,
                    verified_by=user,
                )
                verified_stations_count = verified_by_user_in_ward_qs.count()
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

            verified_by_qs = PollingCenterVerification.objects.filter(
                polling_center=random_unverified_polling_center,
            )

            verified_by_user_qs = verified_by_qs.filter(
                verified_by=user,
            )

            if verified_by_user_qs.exists():
                print("xxxxxx", total_stations_count)
                return Response(
                    {
                        "error": "You have already verified this polling center",
                        "data": PollingCenterBoundarySerializer(
                            random_unverified_polling_center
                        ).data,
                        "user_verification": PartiallyVerifiedPollingCenterBoundarySerializer(
                            verified_by_user_qs.first()
                        ).data,
                        "total_stations_count": total_stations_count,
                        "verified_stations_count": verified_stations_count,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                print("No verification record found.")
                print("yyyyyyyy", total_stations_count)

                boundary_data = PollingCenterBoundarySerializer(
                    random_unverified_polling_center
                ).data

                partial_data = PartiallyVerifiedPollingCenterBoundarySerializer(
                    verified_by_qs.filter(is_upvote=False), many=True
                ).data

                return Response(
                    {
                        "data": boundary_data,
                        "partially_verified": partial_data,
                        "total_stations_count": total_stations_count,
                        "verified_stations_count": verified_stations_count,
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
        isUpvote = data.get("isUpvote", False)

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

        print(isUpvote, "is upvote value")
        print(isUpvote is True, "is upvote boolean value")

        if isUpvote is True:
            if user.is_authenticated and PollingCenterVerification.objects.filter(
                polling_center=polling_center,
                verified_by=user,
            ).exists():
                return Response(
                    {"error": "You have already verified this polling center"},
                    status=status.HTTP_200_OK,
                )

            with transaction.atomic():
                PollingCenter.objects.filter(pk=polling_center.pk).update(
                    location_upvotes=F("location_upvotes") + 1
                )
                if user.is_authenticated:
                    PollingCenterVerification.objects.create(
                        polling_center=polling_center,
                        pin_location=polling_center.pin_location,
                        verified_by=user,
                        is_upvote=True,
                    )
                polling_center.refresh_from_db(fields=["location_upvotes"])

            return Response(
                {
                    "message": "Polling Center location upvoted successfully",
                    "location_upvotes": polling_center.location_upvotes,
                },
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

        # Ward guard: a suggestion is only valid inside the center's own ward.
        ward = polling_center.ward
        if ward and ward.boundary and not ward.boundary.contains(suggested_location):
            return Response(
                {"error": f"Pin is outside {ward.name} ward."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            x = PollingCenterVerification.objects.create(
                polling_center=polling_center,
                pin_location=suggested_location,
                verified_by=user if user.is_authenticated else None,
            )
        except Exception:
            return Response(
                {"error": "Suggested pin could not be saved."},
                status=status.HTTP_200_OK,
            )

        consensus = recompute_consensus(polling_center)

        return Response(
            {"message": "Suggested pin saved successfully", "consensus": consensus},
            status=status.HTTP_200_OK,
        )


class AIPollingCenterVerificationAPIView(APIView):
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
    ]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        school_name = data.get("school_name")
        ward_name = data.get("ward_name")
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        ai_model = data.get("ai_model", "unknown-ai-model")
        nominatim = bool(data.get("nominatim", False))

        if not school_name or not ward_name or latitude is None or longitude is None:
            return Response(
                {"error": "school_name, ward_name, latitude, and longitude are required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return Response(
                {"error": "latitude and longitude must be valid float numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Lookup Ward
        try:
            ward = Ward.objects.get(name__iexact=ward_name)
        except Ward.DoesNotExist:
            ward = Ward.objects.filter(name__icontains=ward_name).first()
            if not ward:
                return Response(
                    {"error": f"Ward '{ward_name}' not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # 2. Lookup Polling Center in Ward
        try:
            polling_center = PollingCenter.objects.get(ward=ward, name__iexact=school_name)
        except PollingCenter.DoesNotExist:
            polling_center = PollingCenter.objects.filter(ward=ward, name__icontains=school_name).first()
            if not polling_center:
                available_centers = PollingCenter.objects.filter(ward=ward).values_list("name", flat=True)
                return Response(
                    {
                        "error": f"Polling Center (School) '{school_name}' not found in Ward '{ward.name}'.",
                        "available_centers_in_ward": list(available_centers),
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        suggested_location = Point(longitude, latitude)  # Point expects (lon, lat)

        # Ward guard: AI suggestions are subject to the same in-ward rule.
        if ward.boundary and not ward.boundary.contains(suggested_location):
            return Response(
                {"error": f"Pin is outside {ward.name} ward."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = PollingCenterVerification.objects.create(
                polling_center=polling_center,
                pin_location=suggested_location,
                ai_suggestion=True,
                ai_model=ai_model,
                nominatim=nominatim,
                comments=f"AI Suggestion using {ai_model} (Nominatim: {nominatim})",
                verified_by=(
                    request.user
                    if request.user and request.user.is_authenticated
                    else None
                ),
            )

            consensus = recompute_consensus(polling_center)

            return Response(
                {
                    "message": "AI suggested location saved successfully.",
                    "polling_center": polling_center.name,
                    "ward": ward.name,
                    "verification_id": verification.id,
                    "consensus": consensus,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": f"Could not save AI suggestion: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PartiallyVerifiedPollingCenterAPIView(APIView):
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

        pollingCenterDBId = data.get("pollingCenterDBId")

        if pollingCenterDBId is None:
            return Response(
                {"error": "Polling Center ID is required."},
                status=status.HTTP_200_OK,
            )

        if not user.is_authenticated:
            polling_center = PollingCenterVerification.objects.filter(
                polling_center__pk=pollingCenterDBId,
            ).last()
            print(polling_center, "polling center")
        else:
            try:
                polling_center = PollingCenterVerification.objects.get(
                    polling_center__pk=pollingCenterDBId,
                    verified_by=user,
                )
                print(polling_center, "polling center")
            except PollingCenterVerification.DoesNotExist:
                return Response(
                    {"error": "Polling Center Verification does not exist."},
                    status=status.HTTP_200_OK,
                )

        data = PartiallyVerifiedPollingCenterBoundarySerializer(polling_center).data

        return Response(
            {"data": data},
            status=status.HTTP_200_OK,
        )


class CommunityNotesPollingCenterDetailsAPIView(APIView):
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
    ]
    permission_classes = [AllowAny]

    queryset = PollingCenter.objects.all()
    serializer_class = CommunityNotesPollingCenterSerializer

    def get(self, *args, **kwargs):

        user = self.request.user

        print(user, "user inside the server")

        try:
            polling_center = PollingCenter.objects.get(pk=user.polling_center.pk)
            print(polling_center, "polling center")
        except PollingCenter.DoesNotExist:
            return Response(
                {"error": "Polling Center does not exist."},
                status=status.HTTP_200_OK,
            )

        stations_qs = PollingStation.objects.filter(
            polling_center=polling_center,
        )

        data = CommunityNotesPollingCenterSerializer(polling_center).data
        stations = PollingStationSerializer(stations_qs, many=True).data

        return Response(
            {
                "data": data,
                "stations": stations,
            },
            status=status.HTTP_200_OK,
        )


class PollingStationInfoAPIView(APIView):
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
    ]
    permission_classes = [IsAuthenticated]

    queryset = PollingStation.objects.all()
    serializer_class = PollingStationSerializer

    def get(self, *args, **kwargs):
        polling_station_code = self.kwargs.get("polling_station_code")

        try:
            polling_station = PollingStation.objects.get(code=polling_station_code)
        except PollingStation.DoesNotExist:
            return Response(
                {"error": "Polling Station does not exist."},
                status=status.HTTP_200_OK,
            )

        data = PollingStationInfoSerializer(polling_station).data

        return Response(
            data,
            status=status.HTTP_200_OK,
        )


class GeocodeAPIView(APIView):
    """Location search, biased to a ward. Provider-switchable: Google Places
    when ``GOOGLE_MAPS_API_KEY`` is set, Nominatim (free) otherwise."""

    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        import requests
        from django.conf import settings
        from django.core.cache import cache

        query = (request.query_params.get("q") or "").strip()
        ward_number = request.query_params.get("ward_number")

        if len(query) < 3:
            return Response({"provider": None, "results": []})

        # Ward bbox for biasing: (lon_min, lat_min, lon_max, lat_max).
        bbox = None
        if ward_number:
            ward = Ward.objects.filter(number=ward_number).first()
            if ward and ward.boundary:
                bbox = ward.boundary.extent

        use_google = bool(settings.GOOGLE_MAPS_API_KEY)
        provider = "google" if use_google else "nominatim"

        cache_key = f"geocode:{provider}:{ward_number}:{query.lower()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response({"provider": provider, "results": cached})

        results = []
        try:
            if use_google:
                params = {
                    "query": f"{query} Kenya",
                    "key": settings.GOOGLE_MAPS_API_KEY,
                }
                if bbox:
                    params["locationbias"] = (
                        f"rectangle:{bbox[1]},{bbox[0]}|{bbox[3]},{bbox[2]}"
                    )
                resp = requests.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params=params,
                    timeout=6,
                )
                for r in resp.json().get("results", [])[:6]:
                    loc = r.get("geometry", {}).get("location", {})
                    results.append(
                        {
                            "name": r.get("name"),
                            "lat": loc.get("lat"),
                            "lng": loc.get("lng"),
                            "type": (r.get("types") or ["place"])[0],
                        }
                    )
            else:
                params = {"q": query, "format": "json", "limit": 6, "countrycodes": "ke"}
                if bbox:
                    params["viewbox"] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
                    params["bounded"] = 1
                resp = requests.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers={"User-Agent": settings.NOMINATIM_USER_AGENT},
                    timeout=6,
                )
                for r in resp.json()[:6]:
                    results.append(
                        {
                            "name": r.get("display_name", "").split(",")[0],
                            "lat": float(r["lat"]),
                            "lng": float(r["lon"]),
                            "type": r.get("type", "place"),
                        }
                    )
        except (requests.RequestException, ValueError, KeyError):
            return Response(
                {"provider": provider, "results": [], "error": "Search unavailable."},
                status=status.HTTP_200_OK,
            )

        cache.set(cache_key, results, 60 * 60)  # 1 hour
        return Response({"provider": provider, "results": results})
