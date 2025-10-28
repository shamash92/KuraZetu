from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from decouple import config
from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
    PollingStationPresidentialExtras,
)
from stations.api.serializers import PollingStationSerializer
from django.contrib.sites.models import Site
from django.conf import settings

User = get_user_model()


class PartySerializer(ModelSerializer):
    """
    Serializer for Party model.
    """

    class Meta:
        model = Party
        fields = (
            "name",
            "short_name",
            "logo",
            "party_colour_hex",
            "is_verified",
        )


class AspirantSerializer(ModelSerializer):
    """
    Serializer for Aspirant model.
    """

    party_color = serializers.CharField(source="party.party_colour_hex", read_only=True)
    party = serializers.CharField(source="party.name", read_only=True)

    class Meta:
        model = Aspirant
        fields = (
            "id",
            "first_name",
            "last_name",
            "surname",
            "party",
            "party_color",
            "level",
            "passport_photo",
            "county",
            "constituency",
            "ward",
            "is_verified",
            "verified_by_party",
        )


class PollingStationPresidentialResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationPresidentialResults model.
    """

    polling_station = PollingStationSerializer()
    presidential_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationPresidentialResults
        fields = (
            "polling_station",
            "presidential_candidate",
            "votes",
            "is_verified",
        )


class PollingStationPresidentialExtrasSerializer(ModelSerializer):
    """
    Serializer for PollingStationPresidentialExtras model.
    """

    form_34A = serializers.SerializerMethodField()
    registered_voters = serializers.SerializerMethodField()

    def get_form_34A(self, obj):
        request = self.context.get("request")
        if obj.form_34A and request:
            return request.build_absolute_uri(obj.form_34A.url)
        elif obj.form_34A:
            domain = Site.objects.get_current().domain
            current_ip = config("CURRENT_IP", default="127.0.0.1")
            is_debug = config("DEBUG")
            is_prod = config("IS_PROD")
            print(f"DEBUG: {is_debug}, IS_PROD: {is_prod}")
            if str(is_prod).lower() in ("true", "1", "yes"):
                scheme = "https"
                return f"{scheme}://{domain}{obj.form_34A.url}"
            else:
                scheme = "http"
                port = "8000"
                return f"{scheme}://{current_ip}:{port}{obj.form_34A.url}"
        else:
            return None

    def get_registered_voters(self, obj):
        if obj.polling_station and obj.polling_station.registered_voters:
            return obj.polling_station.registered_voters
        return None

    class Meta:
        model = PollingStationPresidentialExtras
        fields = (
            "polling_station",
            "rejected_votes",
            "rejected_objected_to_votes",
            "disputed_votes",
            "valid_votes_cast",
            "is_verified",
            "added_by",
            "form_34A",
            "registered_voters",
        )


class PollingStationGovernorResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationGovernorResults model.
    """

    polling_station = PollingStationSerializer()
    governor_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationGovernorResults
        fields = (
            "polling_station",
            "governor_candidate",
            "votes",
        )


class PollingStationSenatorResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationSenatorResults model.
    """

    polling_station = PollingStationSerializer()
    senator_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationSenatorResults
        fields = (
            "polling_station",
            "senator_candidate",
            "votes",
        )


class PollingStationWomenRepResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationWomenRepResults model.
    """

    polling_station = PollingStationSerializer()
    woman_rep_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationWomenRepResults
        fields = (
            "polling_station",
            "woman_rep_candidate",
            "votes",
        )


class PollingStationMpResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationMpResults model.
    """

    polling_station = PollingStationSerializer()
    mp_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationMpResults
        fields = (
            "polling_station",
            "mp_candidate",
            "votes",
        )


class PollingStationMCAResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationMCAResults model.
    """

    polling_station = PollingStationSerializer()
    mca_candidate = AspirantSerializer()

    class Meta:
        model = PollingStationMCAResults
        fields = (
            "polling_station",
            "mca_candidate",
            "votes",
        )
