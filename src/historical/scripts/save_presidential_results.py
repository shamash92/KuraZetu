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

from historical.models import PresidentialResults, Aspirant2017
from stations.models import County
from results.models import Party

# Path to JSON file
JSON_PATH = os.path.join(
    os.path.dirname(__file__), "raw_iebc_results_pdfs_2027", "2017_pres_results.json"
)


pres_parties = {
    "John Ekuru Longoggy Aukot": "Thirdway Alliance Kenya",
    "Mohamed Abduba Dida": "Alliance For Real Change",
    "Shakhalaga Khwa Jirongo": "United Democratic Party",
    "Japheth Kavinga Kaluyu": "Independent",
    "Uhuru Kenyatta": "Jubilee Party",
    "Michael Wainaina Mwaura": "Independent",
    "Joseph William Nthiga Nyagah": "Independent",
    "Raila Odinga": "Orange Democratic Movement",
}


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

    # Excluded keys that are not candidates
    excluded_keys = [
        "COUNTY CODE",
        "COUNTY NAME",
        "REGISTERED VOTERS",
        "TOTAL VALID VOTES",
        "REJECTED BALLOTS",
    ]

    # Process each county result
    for county_data in data:
        county_code = county_data.get("COUNTY CODE")
        if not str(county_code).isdigit():
            continue  # Skip non-county entries like national total

        county = County.objects.get(number=county_code)

        # Extract candidate votes
        candidate_votes = {
            k: v for k, v in county_data.items() if k not in excluded_keys
        }

        registered_voters = clean_number(county_data.get("REGISTERED VOTERS", 0))
        total_valid_votes = clean_number(county_data.get("TOTAL VALID VOTES", 0))
        rejected_ballots = clean_number(county_data.get("REJECTED BALLOTS", 0))

        # For each candidate, create or update PresidentialResults
        for candidate_name, votes in candidate_votes.items():
            # Convert votes to int, default to 0 if not numeric
            try:
                votes = int(votes)
            except (ValueError, TypeError):
                votes = 0
            # Get party
            party_name = pres_parties.get(candidate_name.title(), "Unknown Party")
            short_name = generate_short_name(party_name)
            party, _ = Party.objects.get_or_create(
                name=party_name, defaults={"short_name": short_name}
            )

            # Parse candidate name
            name_parts = candidate_name.split()
            first_name = name_parts[0] if name_parts else ""
            surname = name_parts[-1] if len(name_parts) > 1 else ""
            last_name = " ".join(name_parts[1:-1]) if len(name_parts) > 2 else ""

            # Get or create aspirant
            aspirant, created = Aspirant2017.objects.get_or_create(
                first_name=first_name,
                last_name=last_name,
                surname=surname,
                level="president",
                party=party,
                defaults={"year": 2017},
            )

            # Create or update PresidentialResults
            result, created = PresidentialResults.objects.get_or_create(
                county=county,
                aspirant=aspirant,
                defaults={
                    "registered_voters": registered_voters,
                    "aspirant_votes": votes,
                    "total_valid_votes": total_valid_votes,
                    "rejected_ballots": rejected_ballots,
                },
            )

            if created:
                print(f"Created results for {county.name} - {candidate_name}")
            else:
                print(f"Results already exist for {county.name} - {candidate_name}")


if __name__ == "__main__":
    main()
