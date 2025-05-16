# How to Load Administrative Boundaries Data

This guide explains how to load administrative boundaries data (Counties, Constituencies, and Wards) into your system using the Django `manage.py shell`. The necessary geojson data and the scripts to save them are already provided in the `stations/scripts` directory.

```{important}
This guide assumes you have already set up your django project and run migrations.
```

## Steps

1. **Open the Django Shell**
    Run the following command in your terminal to open the Django shell:

    ```bash
    python manage.py shell
    ```

2. **Load Counties Data**
    Execute the following commands in the shell:

    ```python
    import os
    from stations.scripts.save_counties_from_geojson import save_counties_from_geojson_file

    src_dir = os.getcwd()
    geojson_file = os.path.join(src_dir, "stations/scripts", "counties.geojson")
    save_counties_from_geojson_file(geojson_file)
    ```

3. **Load Constituencies Data**
    Execute the following commands in the shell:

    ```python
    import os
    from stations.scripts.save_counties_from_geojson import save_constituencies_from_geojson_file

    src_dir = os.getcwd()
    geojson_file = os.path.join(src_dir, "stations/scripts", "constituencies.geojson")
    save_constituencies_from_geojson_file(geojson_file)
    ```

4. **Load Wards Data**
    Execute the following commands in the shell:

    ```python
    import os
    from stations.scripts.save_counties_from_geojson import save_wards_from_geojson_file

    src_dir = os.getcwd()
    geojson_file = os.path.join(src_dir, "stations/scripts", "wards.geojson")
    save_wards_from_geojson_file(geojson_file)
    ```

5. **Convert polling station data**

    ```{caution}
    The json file is in the repo already and this step may be skipped. The only reason to run this script is to regenerate the json file is to update the json dat as the csv files will be regularly updated by the community and they will not necessarily run the scripts to update the json file.
    ```

    We first convert the cleaned CSV files to GeoJSON format.

    The script `parse_polling_station_data.py` is used for this purpose. It reads the CSV files and generates the corresponding GeoJSON file `cleaned_polling_station_data.json`.

    ```bash
    python stations/scripts/parse_polling_station_data.py
    ```

6. **Save Polling Center and Polling Station Data**
    If already inside the Django shell, exit and run the following command:

    ```bash
    python stations/scripts/save_polling_stations.py
    ```

7. **Save Polling Center Pin Locations**
    This script saves the polling center pin locations to the database. It reads the `cleaned_polling_station_data.json` file and saves the lat/lng data to the database.

    ```bash
    python stations/scripts/save_polling_center_pin_locations.py
    ```

8. **Initial Check for pin location errors**
    This script checks for any errors e.g missing lat/lng data, pin outside ward boundaries, missing parent ward boundary etc. and save the errors to the `PollingCenter` model

    ```bash
    python stations/scripts/polling_center_pin_errors_parse.py
    ```

9. **Update your Django admin user (superuser) with a polling station**
    Since you already created a superuser, you need to manually assign a polling center to the user since you did not register the user using the sign up form. This step is necessary so that you can later see election results like an ordinary user in the app.

    Run the following command to start the server:

    ```bash
    python manage.py runserver
    ```

    Then go to the [admin page](http://localhost:8000/admin/) and assign a polling center to your superuser.

## Notes

- Ensure the GeoJSON files are correctly formatted and contain the necessary data.
- If any errors occur, verify the file paths and ensure the scripts are implemented correctly.

By following these steps, you will successfully load the administrative boundaries data into your system.
