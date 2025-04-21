import csv
import json
from io import StringIO
from pathlib import Path

from tqdm import tqdm

script_dir = Path(__file__).resolve().parent
input_csv_relative_file_path = script_dir / "raw_polling_station_data.csv"
output_csv_relative_file_path = script_dir / "cleaned_polling_station_data.json"


with open(input_csv_relative_file_path, "r", encoding="utf-8") as f:
    csv_data = f.read()

    reader = csv.DictReader(StringIO(csv_data), delimiter=",")
    rows = list(reader)

    # Step 2: Create flat list and manually build nested arrays
    output = []

    # Structure to help with lookups
    county_map = {}

    print("\033[92mStart of processing...\033[0m")
    for row in tqdm(rows, desc="Processing polling stations"):
        # Skip empty rows
        if not any(row.values()):
            continue

        county_name = row["county_name"].strip()
        const_name = row["const_name"].strip()
        county_code = row["county_code"].strip()
        const_code = row["const_code"].strip()
        ward_code = int(row["ward_code"].strip())
        ward_name = row["ward_name"].strip()
        reg_centre_code = row["reg_centre_code"].strip()
        reg_centre_name = row["reg_centre_name"].strip()

        registered_voters = int(str(row["registered_voters"].strip().replace(" ", "")))

        stream = {
            "stream_code": row["polling_station_stream_code"],
            "registered_voters": registered_voters,
        }

        # COUNTY
        if county_name not in county_map:
            county_obj = {
                "county_name": county_name,
                "county_code": county_code,
                "constituencies": [],
            }
            output.append(county_obj)
            county_map[county_name] = county_obj
        county_obj = county_map[county_name]

        # CONSTITUENCY
        const_obj = next(
            (
                c
                for c in county_obj["constituencies"]
                if c["constituency_name"] == const_name
            ),
            None,
        )
        if not const_obj:
            const_obj = {
                "constituency_name": const_name,
                "const_code": const_code,
                "wards": [],
            }
            county_obj["constituencies"].append(const_obj)

        # === Ward ===
        ward_obj = next(
            (
                w
                for w in const_obj["wards"]
                if w["ward_name"] == ward_name and w["ward_code"] == ward_code
            ),
            None,
        )
        if not ward_obj:
            ward_obj = {
                "ward_name": ward_name,
                "ward_code": ward_code,
                "reg_centers": [],
            }
            const_obj["wards"].append(ward_obj)

        # REG CENTER
        reg_obj = next(
            (
                r
                for r in ward_obj["reg_centers"]
                if r["reg_centre_code"] == reg_centre_code
            ),
            None,
        )
        if not reg_obj:
            reg_obj = {
                "reg_centre_code": reg_centre_code,
                "reg_centre_name": reg_centre_name,
                "polling_station_streams": [],
            }
            ward_obj["reg_centers"].append(reg_obj)

        # Add polling stream
        reg_obj["polling_station_streams"].append(stream)

    # Save to JSON file
    print(f"\033[92mSaving to JSON file: {output_csv_relative_file_path}\033[0m")
    with open(output_csv_relative_file_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
