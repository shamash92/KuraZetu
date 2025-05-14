from django.contrib.auth import get_user_model

from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from results.models import (
    Aspirant,
    Party,
    PollingStationGovernorResults,
    PollingStationMCAResults,
    PollingStationMpResults,
    PollingStationPresidentialResults,
    PollingStationSenatorResults,
    PollingStationWomenRepResults,
)
from stations.api.serializers import PollingStationSerializer

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


class PollingStationGovernorResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationGovernorResults model.
    """

    class Meta:
        model = PollingStationGovernorResults
        fields = (
            "polling_station",
            "governor_candidate",
            "votes",
            "is_verified",
        )


class PollingStationSenatorResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationSenatorResults model.
    """

    class Meta:
        model = PollingStationSenatorResults
        fields = (
            "polling_station",
            "senator_candidate",
            "votes",
            "is_verified",
        )


class PollingStationWomenRepResultsSerializer(ModelSerializer):
    """
    Serializer for PollingStationWomenRepResults model.
    """

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

    class Meta:
        model = PollingStationMCAResults
        fields = (
            "polling_station",
            "mca_candidate",
            "votes",
        )
