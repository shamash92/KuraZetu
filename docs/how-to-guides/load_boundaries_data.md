# How to Load Administrative Boundaries Data

This guide explains how to load administrative boundaries data (Counties, Constituencies, and Wards) into your system using the Django `manage.py shell`. The necessary geojson data and the scripts to save them are already provided in the `stations/scripts` directory.

```{important}
This guide assumes you have already set up your django project and run migrations and you are already inside the `src/` folder.
```

## Steps

1. **Open the Django Shell**

````{tabs}
```{group-tab} Non-docker setup

- Run the following command in your terminal to open the Django shell:

    ```bash
     python manage.py shell
    ```
```

```{group-tab} Docker
- Run the following command in your terminal to open the Django shell:

    ```bash
    docker compose exec web python manage.py shell
    ```
```
````

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

> For all the below steps, you can run the scripts in the terminal.
> If you are using Docker, make sure to run the commands inside the container.
> You can do this by prefixing the commands with `docker compose exec web`.
>

1. **Convert polling station data (optional step)**

    ```{caution}
    The json file is in the repo already and this step may be skipped. The only reason to run this script is to regenerate the json file is to update the json dat as the csv files will be regularly updated by the community and they will not necessarily run the scripts to update the json file.
    ```

    We first convert the cleaned CSV files to GeoJSON format.

    The script `parse_polling_station_data.py` is used for this purpose. It reads the CSV files and generates the corresponding GeoJSON file `cleaned_polling_station_data.json`.

````{tabs}

```{group-tab} Non-docker setup
- Run the following command in your terminal to convert the CSV files to GeoJSON format:
    ```bash
    python stations/scripts/parse_polling_station_data.py
    ```
```

```{group-tab} Docker
- Run the following command in your terminal to convert the CSV files to GeoJSON format:
    ```bash
    docker compose exec web python stations/scripts/parse_polling_station_data.py
    ```
```

````

6. **Save Polling Center and Polling Station Data**

````{tabs}
```{group-tab} Non-docker setup
- If already inside the Django shell, exit and run the following command:
    ```bash
    python stations/scripts/save_polling_stations.py
    ```
```
```{group-tab} Docker
- Run the following command in your terminal to save the polling stations data:
    ```bash
    docker compose exec web python stations/scripts/save_polling_stations.py
    ```
```

````

7. **Save Polling Center Pin Locations**

    This script saves the polling center pin locations to the database. It reads the `cleaned_polling_station_data.json` file and saves the `lat/lng` data to the database.

````{tabs}
```{group-tab} Non-docker setup
- Run the following command in your terminal to save the polling center pin locations:

    ```bash
    python stations/scripts/save_polling_center_pin_locations.py
    ```
```
```{group-tab} Docker
- Run the following command in your terminal to save the polling center pin locations:
    ```bash
    docker compose exec web python stations/scripts/save_polling_center_pin_locations.py
    ```
```

````

8. **Initial Check for pin location errors**

    This script checks for any errors e.g missing lat/lng data, pin outside ward boundaries, missing parent ward boundary etc. and save the errors to the `PollingCenter` model

````{tabs}
```{group-tab} Non-docker setup
- Run the following command in your terminal to check for pin location errors:

    ```bash
    python stations/scripts/polling_center_pin_errors_parse.py
    ```
```
```{group-tab} Docker
- Run the following command in your terminal to check for pin location errors:
    ```bash
    docker compose exec web python stations/scripts/polling_center_pin_errors_parse.py
    ```
```

````

9. **Create Fake polling station and national results**

    Since you already created a superuser, you need to first assign a polling center to the user since you did not register the user using the sign up form. This step is necessary so that you can later see election results like an ordinary user in the app instead of manually creating this in the admin panel.

    ```{caution}

    This step is only for development environment. In production, you will need to create a superuser and assign them a polling center using the admin panel.
    ```

````{tabs}
```{group-tab} Non-docker setup
- Run the following command in your terminal to create fake polling station results:

    ```bash
    python results/scripts/load_fake_results.py
    python results/scripts/create_100k_pres_results.py
    ```
```
```{group-tab} Docker
- Run the following command in your terminal to create fake polling station results:
    ```bash
    docker compose exec web python results/scripts/load_fake_results.py
    docker compose exec web python results/scripts/create_100k_pres_results.py
    ```
```
````

## Notes

- Ensure the GeoJSON files are correctly formatted and contain the necessary data.
- If any errors occur, verify the file paths and ensure the scripts are implemented correctly.

By following these steps, you will successfully load the administrative boundaries data into your system.
