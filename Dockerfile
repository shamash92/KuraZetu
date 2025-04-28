FROM python:3.12-slim

# Install system dependencies

RUN apt-get update && apt-get install -y \
    software-properties-common \
    && apt-add-repository ppa:ubuntugis/ubuntugis-unstable \
    && apt-get update \
    && apt-get install -y libgdal-dev \
    && rm -rf /var/lib/apt/lists/*


RUN apt-get update && apt-get install -y \
    binutils \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY src/ .

# Run migrations automatically
ENTRYPOINT ["python", "manage.py", "migrate", "--noinput"]
