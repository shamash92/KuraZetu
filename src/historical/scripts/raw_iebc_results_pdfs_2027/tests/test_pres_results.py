import json
import os
import pytest

BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)))
RESULTS_PATH = os.path.join(BASE_DIR, "2017_pres_results.json")

# List of candidate keys to sum
CANDIDATE_KEYS = [
    "JOHN EKURU LONGOGGY AUKOT",
    "MOHAMED ABDUBA DIDA",
    "SHAKHALAGA KHWA JIRONGO",
    "JAPHETH KAVINGA KALUYU",
    "UHURU KENYATTA",
    "MICHAEL WAINAINA MWAURA",
    "JOSEPH WILLIAM NTHIGA NYAGAH",
    "RAILA ODINGA",
]


def load_results():
    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_presidential_votes_tally():
    data = load_results()
    for county in data:
        # Skip national total and diaspora
        if not str(county.get("COUNTY CODE", "")).isdigit():
            continue
        total_votes = county.get("TOTAL VALID VOTES")
        if total_votes is None:
            continue
        # Sum candidate votes
        candidate_sum = 0
        for key in CANDIDATE_KEYS:
            val = county.get(key)
            if isinstance(val, str):
                val = (
                    int(str(val).replace(",", ""))
                    if val.replace(",", "").isdigit()
                    else 0
                )
            candidate_sum += int(val) if isinstance(val, int) else 0
        assert candidate_sum == int(
            str(total_votes).replace(",", "")
        ), f"County {county.get('COUNTY NAME')}: {candidate_sum} != {total_votes}"
