# Community Tally Setup Instructions

This guide will walk you through setting up the Community-Tally project, from cloning the repository to configuring the database and installing dependencies.

``` {important}
Before  you start, please note that this project is in its early stages and is not yet ready for production use. It is intended for development and testing purposes only.
```

## Prerequisites

Ensure you have the following installed:

- Python (>= 3.10)
- Ubuntu 24.04 (NB: You can use Macos with a few tweaks around postgres setup)
- pip
- PostgreSQL (>= 14) with PostGIS extension
- Git

## Setup Instructions

### 1. Clone the Repository

```{warning}
Ensure you are using an anonymous GitHub account to clone the repository. **This is crucial for your safety and privacy !**
> Start here:  [how to create an anonymous GitHub account](../how-to-guides/anonymous_github.md).
```

```bash
git clone https://github.com/shamash92/Community-Tally.git
cd Community-Tally
```

### 2. Install Dependencies

Create a virtual environment and install the required Python packages:

```bash
cd src/
python -m venv venv
source venv/bin/activate 
pip install -r requirements.txt
```

### Install System Dependencies

Before proceeding, install the required system dependencies for PostgreSQL, PostGIS, and GeoDjango:
NB: This project is built and tested with Postgres 16. Previous versions of the

```bash
sudo apt update
sudo apt-get update
sudo apt-get install libpq-dev postgresql postgresql-contrib 
sudo apt install postgis postgresql-16-postgis-3 postgresql-16-postgis-3-scripts postgresql-client-16 #replace '16' with your postgres version
```

### Enable and start Postgres

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### GeoDjango / GDAL dependencies

```bash
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:ubuntugis/ubuntugis-unstable
sudo apt-get update
sudo apt-get install libgdal-dev

sudo apt-get install binutils libproj-dev gdal-bin
```

### 3. Configure Environment Variables

Copy the example `.env.local` file to `.env`:

```bash
cp .env.local .env
```

Edit the `.env` file to configure your environment-specific settings.

### 4. Set Up PostgreSQL and PostGIS

1. Log in to PostgreSQL:

    ```bash
    sudo -u postgres psql
    ```

2. Create a database:

    ```sql
    CREATE DATABASE community_tally;
    ```

    NB: You can use any name for the database, password and user but ensure to update the `.env` file accordingly.

3. Create a database user and set a password:

    ```sql
    CREATE USER community_user WITH PASSWORD 'your_password';
    ```

4. Grant privileges to the user:

    ```bash
    GRANT ALL PRIVILEGES ON DATABASE community_tally TO community_user;

    ALTER DATABASE community_tally OWNER TO community_user; # This is ONLY needed for Postgres 16, earlier versions are OK

    \q
    ```

5. Enable the PostGIS extension:

    ```bash

        sudo -i -u postgres;
        psql -d community_tally;
        CREATE EXTENSION postgis;

        \q
        exit


        export CPLUS_INCLUDE_PATH=/usr/include/gdal
        export C_INCLUDE_PATH=/usr/include/gdal

    ```

### 5. Apply Migrations

Run the following commands to apply database migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Run the Development Server

Start the development server:

```bash
python manage.py runserver
```

You can now access the application at `http://127.0.0.1:8000`.
