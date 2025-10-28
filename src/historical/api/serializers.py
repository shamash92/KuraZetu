from rest_framework import serializers

from historical.models import (
    PresidentialResults,
    GovernorResults,
    SenatorResults,
    WomenRepResults,
    MPResults,
    MCAResults,
)


class PresidentialResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source="county.number", read_only=True)
    aspirant = serializers.StringRelatedField()

    class Meta:
        model = PresidentialResults
        fields = (
            "county_number",
            "registered_voters",
            "aspirant",
            "aspirant_votes",
            "total_valid_votes",
            "rejected_ballots",
        )


class GovernorResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source="county.number", read_only=True)
    aspirant = serializers.StringRelatedField()
    running_mate = serializers.StringRelatedField()
    party_name = serializers.CharField(source="aspirant.party.name", read_only=True)
    party_short_name = serializers.CharField(
        source="aspirant.party.short_name", read_only=True
    )

    class Meta:
        model = GovernorResults
        fields = (
            "county_number",
            "aspirant",
            "running_mate",
            "aspirant_votes",
            "party_name",
            "party_short_name",
        )


class SenatorResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source="county.number", read_only=True)
    aspirant = serializers.StringRelatedField()
    party_name = serializers.CharField(source="aspirant.party.name", read_only=True)
    party_short_name = serializers.CharField(
        source="aspirant.party.short_name", read_only=True
    )

    class Meta:
        model = SenatorResults
        fields = (
            "county_number",
            "aspirant",
            "aspirant_votes",
            "party_name",
            "party_short_name",
        )


class WomenRepResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source="county.number", read_only=True)
    aspirant = serializers.StringRelatedField()
    party_name = serializers.CharField(source="aspirant.party.name", read_only=True)
    party_short_name = serializers.CharField(
        source="aspirant.party.short_name", read_only=True
    )

    class Meta:
        model = WomenRepResults
        fields = (
            "county_number",
            "aspirant",
            "aspirant_votes",
            "party_name",
            "party_short_name",
        )


class MPResultsSerializer(serializers.ModelSerializer):
    constituency_number = serializers.IntegerField(
        source="constituency.number", read_only=True
    )
    aspirant = serializers.StringRelatedField()
    party_name = serializers.CharField(source="aspirant.party.name", read_only=True)
    party_short_name = serializers.CharField(
        source="aspirant.party.short_name", read_only=True
    )

    class Meta:
        model = MPResults
        fields = (
            "constituency_number",
            "aspirant",
            "aspirant_votes",
            "party_name",
            "party_short_name",
        )


class MCAResultsSerializer(serializers.ModelSerializer):
    ward_number = serializers.IntegerField(source="ward.number", read_only=True)
    aspirant = serializers.StringRelatedField()
    party_name = serializers.CharField(source="aspirant.party.name", read_only=True)
    party_short_name = serializers.CharField(
        source="aspirant.party.short_name", read_only=True
    )

    class Meta:
        model = MCAResults
        fields = (
            "ward_number",
            "aspirant",
            "aspirant_votes",
            "party_name",
            "party_short_name",
        )
