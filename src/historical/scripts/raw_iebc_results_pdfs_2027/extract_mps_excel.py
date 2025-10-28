import os
import pandas as pd
import json
import re


def clean_newlines(obj):
    if isinstance(obj, dict):
        return {clean_newlines(k): clean_newlines(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_newlines(x) for x in obj]
    elif isinstance(obj, str):
        return re.sub(r"\n+", " ", obj)
    else:
        return obj


def main(excel_path, output_path):
    excel = pd.ExcelFile(excel_path)
    combined = []
    for sheet_name in excel.sheet_names:
        df = excel.parse(sheet_name)
        records = df.fillna("").to_dict(orient="records")
        cleaned = clean_newlines(records)
        combined.extend(cleaned)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"Extracted and cleaned {len(combined)} records to {output_path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_dir = os.path.join(base_dir, "raw_data")
    EXCEL_PATH = os.path.join(raw_data_dir, "2017 mps.xlsx")
    OUTPUT_PATH = os.path.join(base_dir, "2017_mps_results.json")
    main(EXCEL_PATH, OUTPUT_PATH)
