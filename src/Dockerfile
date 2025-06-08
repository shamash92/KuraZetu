FROM python:3.12-slim

# Install system dependencies

RUN apt-get update && apt-get install -y \
    libgdal-dev \
    binutils \
    libproj-dev \
    gdal-bin

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY /requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY / .

# Run migrations automatically and then start the server
# ENTRYPOINT ["sh", "-c", "python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
RUN python manage.py collectstatic --noinput

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
