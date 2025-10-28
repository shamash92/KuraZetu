
from rest_framework import serializers

from historical.models import PresidentialResults,GovernorResults

class PresidentialResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source='county.number', read_only=True)
    class Meta:
        model = PresidentialResults
        fields = ('county_number', 'registered_voters', 'aspirant', 'aspirant_votes', 'total_valid_votes', 'rejected_ballots', )


class GovernorResultsSerializer(serializers.ModelSerializer):
    county_number = serializers.IntegerField(source='county.number', read_only=True)
    aspirant = serializers.StringRelatedField()
    running_mate = serializers.StringRelatedField()
    party_name = serializers.CharField(source='aspirant.party.name', read_only=True)
    party_short_name = serializers.CharField(source='aspirant.party.short_name', read_only=True)

    class Meta:
        model = GovernorResults
        fields = ('county_number', 'aspirant', 'running_mate', 'aspirant_votes', 'party_name', 'party_short_name', )