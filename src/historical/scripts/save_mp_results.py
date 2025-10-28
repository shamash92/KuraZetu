import os
import json
import django
import sys
from django.conf import settings

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Setup Django
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "CommunityTally.settings"
)  # Adjust if your settings module is different
django.setup()

from historical.models import MPResults, Aspirant2017
from stations.models import Constituency
from results.models import Party

# Path to JSON file
JSON_PATH = os.path.join(
    os.path.dirname(__file__), "raw_iebc_results_pdfs_2027", "2017_mps_results.json"
)


def generate_short_name(party_name):
    words = party_name.split()
    if len(words) == 1:
        return words[0][:3].upper()
    else:
        return "".join(word[0] for word in words).upper()[:3]


def clean_number(value):
    if isinstance(value, str):
        value = value.replace(",", "").replace(" ", "")
        if value == "-" or value == "":
            return 0
        try:
            return int(float(value))
        except ValueError:
            return 0
    return value


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Process each candidate result
    for entry in data:
        # Skip empty entries
        if not entry.get("SURNAME") or entry.get("SURNAME") == "":
            continue

        constituency_code = entry.get("CONSTITUENCY CODE")
        if not int(constituency_code):
            continue  # Skip invalid constituency codes

        try:
            constituency = Constituency.objects.get(number=int(constituency_code))
        except Constituency.DoesNotExist:
            print(f"Constituency with code {constituency_code} does not exist")
            continue

        party_name = entry.get("POLITICAL PARTY NAME", "")
        abbrv = entry.get("ABBRV", "")
        party, created = Party.objects.get_or_create(
            name=party_name, defaults={"short_name": abbrv}
        )
        if not created and party.short_name != abbrv:
            party.short_name = abbrv
            party.save()

        # Parse candidate name
        candidate_surname = entry.get("SURNAME", "")
        candidate_other_names = entry.get("OTHER NAMES", "")
        name_parts = candidate_other_names.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        surname = candidate_surname

        # Get or create aspirant
        aspirant, created = Aspirant2017.objects.get_or_create(
            first_name=first_name,
            last_name=last_name,
            surname=surname,
            level="mp",
            party=party,
            constituency=constituency,
            is_running_mate=False,
            defaults={"year": 2017},
        )

        votes = clean_number(entry.get("VOTES GARNERED", 0))

        # Create or update MPResults
        result, created = MPResults.objects.get_or_create(
            constituency=constituency,
            aspirant=aspirant,
            defaults={
                "aspirant_votes": votes,
            },
        )

        if created:
            print(
                f"Created results for {constituency.name} - {candidate_other_names} {candidate_surname}"
            )
        else:
            print(
                f"Results already exist for {constituency.name} - {candidate_other_names} {candidate_surname}"
            )


if __name__ == "__main__":
    main()
