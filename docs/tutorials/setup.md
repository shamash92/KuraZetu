# Kura Zetu Setup Instructions

This guide will walk you through setting up the Community-Tally project, from cloning the repository to configuring the database and installing dependencies.

``` {important}
Before  you start, please note that this project is in its early stages and is not yet ready for production use. It is intended for development and testing purposes only.
```

There are two ways to run the project: using Docker or setting it up locally. This guide will focus on the local setup. For Docker setup, refer to the [Docker Setup Guide](docker-setup.md).

## Prerequisites

```` {tabs}
```{group-tab} Ubuntu

Ensure you have the following installed:

- Python (>= 3.10)
- Ubuntu 24.04 (NB: You can use MacOS with a few tweaks around Postgres setup)
- pip
- PostgreSQL (>= 14) with PostGIS extension
- Git
```

```{group-tab} Windows and MacOS

For Windows and MacOS users, it is recommended to use a virtual machine to run the project. We strongly recommend [Multipass](https://multipass.run/) to create a virtual machine with Ubuntu 24.04. Follow the instructions below to set up Multipass and create a virtual machine. NB: You can also use [VirtualBox](https://www.virtualbox.org/) or [VMware](https://www.vmware.com/) to create a virtual machine with Ubuntu 24.04, but we recommend Multipass for its simplicity, ease of creating, tearing down and tweaking the Ubuntu VM and it strips down the GUI part of the OS meaning we can create VMs in a few seconds.

#### Multipass Setup Instructions

1. Install Multipass on your system by following the instructions on the [Multipass website](https://multipass.run/).
2. Create a new Ubuntu 24.04 virtual machine using the following commands:
 NOTE: You can also use the GUI to create a new virtual machine, but we recommend using the command line for simplicity and automation.

    ```{important}
    If you want to use VSCode to connect to this VM using the Remote SSH extension, you will need first follow this [VSCode Multipass Guide](../how-to-guides/vscode-multipass.md) for more details.
    ```

    ```bash
    multipass launch noble --name kurazetu-vm --cpus 2 --disk 20G --memory 4G
    ```
    - NOTE: The `noble` image is the latest Ubuntu 24.04 LTS image. You can also use `jammy` for Ubuntu 22.04 LTS, but we recommend using the latest version.

    ``` {tip}
    Also note that the first time you run the command, it will take a while to download the image and create the virtual machine. Subsequent runs will be much faster.
    ```

3. Start the virtual machine if using the shell otherwise jump to step 5 if using VScODE and you have already started the VM and connected to it via SSH:

    ```bash
    multipass start kurazetu-vm
    ```

4.  Access the virtual machine:

    ```bash
    multipass shell kurazetu-vm
    ```
5. Navigate to the `/home/ubuntu` directory:

    ```bash
    cd /home/ubuntu
    ```

    - You can now use the "Open Folder" option in VSCode to open this directory and start working on the project files. 

See more: [How to customize your VM](../how-to-guides/customize-multipass.md).
See More: For VSCode users, you can use the [Remote - SSH extension](https://code.visualstudio.com/docs/remote/ssh) to connect to your Multipass VM and edit files directly from your host machine.  Follow this guide: [How to connect to your Multipass VM using VSCode](../how-to-guides/vscode-multipass.md).

```
````

## Clone the Repository

```{warning}
Ensure you are using an anonymous GitHub account to clone the repository. **This is crucial for your safety and privacy !**

Start here:  [how to create an anonymous GitHub account](../how-to-guides/anonymous_github.md).
```

```bash
git clone https://github.com/shamash92/KuraZetu.git
cd KuraZetu
```

## Setup Instructions Frontend (React + Webpack)

```{important}
Running the frontend does not open any ports e.g 3000. It only enables webpack to build a bundle on code change and hot reload to help with development. The bundle is injected inside a django template and django serves all the consecutive react-router links under the `/ui/` paths.
```

Open a new terminal to run the following commands parallel to the backend commands

1. Navigate to the frontend directory:

   ```bash
   cd src/ui
   ```

2. Install Nodejs and Yarn

   Ensure you have Nodejs (>= 20) and Yarn installed on your system. You can install them using the following commands:

   ```bash
    sudo apt update
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

3. Install Yarn globally

   ```bash
   sudo npm install -g yarn
   ```

4. Install frontend dependencies:

   ```bash
   yarn install
   ```

5. Copy the example `.env.sample` file to `.env`:

   ```bash
   cp .env.sample .env
   ```

6. Run the frontend development server:

   ```bash
   yarn run dev
   ```

## 2. Setup Instructions (Django Backend)

```{important}
This is supposed to be done in a separate terminal from the frontend setup. The backend will run on port 8000 and the frontend will run on watch mode
```

### Install Dependencies

Create a virtual environment and install the required Python packages:

````{tabs}
```{group-tab} Ubuntu
- Navigate to the project directory:
    ```bash
    cd src/
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pre-commit install
    ```
```
```{group-tab} Multipass (Windows and MacOS)
- Open a new shell and navigate to the project directory:

    ```bash
    multipass shell kurazetu-vm
    cd /home/ubuntu/src/
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pre-commit install
    ```
```
````

### Install System Dependencies

Before proceeding, install the required system dependencies for PostgreSQL, PostGIS, and GeoDjango:
NB: This project is built and tested with Postgres 14.

```bash
sudo apt update

sudo apt install -y wget gnupg lsb-release ca-certificates

# Import PostgreSQL signing key 
wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg

# Add PostgreSQL 14 repository
echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list

# Update package list again
sudo apt update

# Install PostgreSQL 14, PostGIS, and related packages
sudo apt install -y postgresql-14 postgresql-client-14 postgresql-14-postgis-3 postgresql-14-postgis-3-scripts libpq-dev
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

### 6. Collect Static Files

Collect static files for the Django application:

```bash
python manage.py collectstatic --noinput
```

### 7. Run the Development Server

````{tabs}
```{group-tab} Ubuntu
- Run the Django development server:

    ```bash
    python manage.py runserver
    ```

- You can now access the application at `http://127.0.0.1:8000` or `http://localhost:8000`.
```

```{group-tab} Multipass (Windows and MacOS)
- Run the Django development server:

    ```bash
    python manage.py runserver 0.0.0.0:8000
    ```
- You can get the IPv4 address of your VM using the following command **on a new terminal**:

    ```bash
    multipass info kurazetu-vm
    ```
- You can now access the application at `http://<your-vm-ipv4-address>:8000`.
```
````

### 8. Create a Superuser

Create a superuser to access the Django admin interface:

```bash
python manage.py createsuperuser
```

Follow the prompts to set up the superuser account.

### 9. Load Administrative Boundaries Data

This step is optional but recommended for testing purposes. You can load administrative boundaries data (Counties, Constituencies, and Wards) into your system using the Django `manage.py shell`. The necessary geojson data and the scripts to save them are already provided in the `stations/scripts` directory.

> See the [Load Administrative Boundaries Data](../how-to-guides/load_boundaries_data.md) guide for detailed instructions.

---

### 10. Run the backend server

```bash
python manage.py runserver 0.0.0.0:8000
```

## 3. Setup Tailwind CSS

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
