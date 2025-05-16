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

## Setup Instructions (Django Backend)

### 1. Clone the Repository

```{warning}
Ensure you are using an anonymous GitHub account to clone the repository. **This is crucial for your safety and privacy !**

Start here:  [how to create an anonymous GitHub account](../how-to-guides/anonymous_github.md).
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
NB: This project is built and tested with Postgres 14.

```bash

sudo apt update

sudo apt install -y wget gnupg lsb-release

# Import PostgreSQL signing key
wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Add PostgreSQL 14 repo
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list



sudo apt-get install libpq-dev postgresql-14

sudo apt install postgis postgresql-14-postgis-3 postgresql-14-postgis-3-scripts postgresql-client-14
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

Edit the `.env` file to configure your environment-specific settings. e.g.

```bash
# Database settings
DATABASE_NAME=community_tally
DATABASE_USER=community_user
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
# Other environment variables
```

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

6. Setup the test database

    ```bash
        sudo -i -u postgres;
        CREATE DATABASE community_test_db;
        CREATE USER test_admin WITH PASSWORD 'community_password';
        ALTER USER test_admin CREATEDB;
        ALTER USER test_admin WITH SUPERUSER;

        \c community_test_db
        CREATE EXTENSION postgis;

        \q
        exit
    ```

### 5. Apply Migrations

Run the following commands to apply database migrations:

```bash
python manage.py migrate
```

### 6. Run the Development Server

Start the development server:

```bash
python manage.py runserver
```

You can now access the application at `http://127.0.0.1:8000`.

### 7. Create a Superuser

Create a superuser to access the Django admin interface:

```bash
python manage.py createsuperuser
```

Follow the prompts to set up the superuser account.

### 8. Load Administrative Boundaries Data

This step is optional but recommended for testing purposes. You can load administrative boundaries data (Counties, Constituencies, and Wards) into your system using the Django `manage.py shell`. The necessary geojson data and the scripts to save them are already provided in the `stations/scripts` directory.

> See the [Load Administrative Boundaries Data](../how-to-guides/load_boundaries_data.md) guide for detailed instructions.

---

### Run the backend server

```bash
python manage.py runserver 0.0.0.0:8000
```

## Setup Tailwind CSS

In a new terminal, run the following commands to set up Tailwind CSS for styling.

```{important}
This is only needed for the first time you run the project. After that, you can skip this step.
```

```bash
python manage.py tailwind install
```

The following command will start the tailwind server and watch for changes in the CSS files. This is needed for development purposes. Note that this command will not open any ports. It will only watch for changes in the CSS files and rebuild the CSS bundle.

```bash
python manage.py tailwind start
```

## Frontend (React + Webpack)

```{important}
Running the frontend does not open any ports e.g 3000. It only enables webpack to build a bundle on code change and hot reload to help with development. The bundle is injected inside a django template and django serves all the consecutive react-router links under the /ui/ paths.
```

Open a new terminal to run the following commands parallel to the backend commands

1. Navigate to the frontend directory:

   ```bash
   cd src/ui
   ```

2. Install frontend dependencies:

   ```bash
   yarn install
   ```

3. Copy the example `.env.sample` file to `.env`:

   ```bash
   cp .env.sample .env
   ```

4. Run the frontend development server:

   ```bash
   yarn run dev
   ```
