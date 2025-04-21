import pandas as pd
import pdfplumber

with pdfplumber.open("pdf.pdf") as pdf:
    all_rows = []
    for page in pdf.pages:
        print(page.page_number)
        table = page.extract_table()
        if table:
            all_rows.extend(table)

df = pd.DataFrame(all_rows[1:], columns=all_rows[0])
df.to_csv("raw_polling_station_data.csv", index=False)
