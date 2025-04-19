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

## Notes

- Ensure the GeoJSON files are correctly formatted and contain the necessary data.
- If any errors occur, verify the file paths and ensure the scripts are implemented correctly.

By following these steps, you will successfully load the administrative boundaries data into your system.  
