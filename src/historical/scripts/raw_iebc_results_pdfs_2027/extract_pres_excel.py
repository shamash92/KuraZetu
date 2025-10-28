import os
import pandas as pd
import json
import re
from tqdm import tqdm


def clean_newlines(obj):
    if isinstance(obj, dict):
        return {clean_newlines(k): clean_newlines(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_newlines(x) for x in obj]
    elif isinstance(obj, str):
        # Remove newlines
        s = re.sub(r"\n+", " ", obj)
        # Fix numbers with points as thousands/millions separator (e.g. 99.190)
        # If the string matches a number with points and no commas, convert to comma format
        if re.match(r"^\d{1,3}(\.\d{3})+$", s):
            s = s.replace(".", ",")
        # If the string matches a pattern like '99,19', append a zero and convert to int
        if re.match(r"^\d{1,3},\d{2}$", s):
            s = int(s.replace(",", "") + "0")
        return s
    else:
        return obj


def main(excel_path, output_path):
    excel = pd.ExcelFile(excel_path)
    combined = []
    for sheet_name in tqdm(excel.sheet_names, desc="Processing sheets"):
        df = excel.parse(sheet_name)
        records = df.fillna("").to_dict(orient="records")
        cleaned = clean_newlines(records)
        # Ensure COUNTY CODE is always an int if possible
        for rec in cleaned:
            if "COUNTY CODE" in rec:
                try:
                    rec["COUNTY CODE"] = (
                        int(float(rec["COUNTY CODE"]))
                        if str(rec["COUNTY CODE"]).replace(".", "").isdigit()
                        else rec["COUNTY CODE"]
                    )
                except Exception:
                    pass
        combined.extend(cleaned)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"Extracted and cleaned {len(combined)} records to {output_path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_dir = os.path.join(base_dir, "raw_data")
    EXCEL_PATH = os.path.join(raw_data_dir, "2017 pres.xlsx")
    OUTPUT_PATH = os.path.join(base_dir, "2017_pres_results.json")
    main(EXCEL_PATH, OUTPUT_PATH)
