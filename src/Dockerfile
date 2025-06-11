FROM python:3.12-slim-bookworm

# Set environment varibles
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app


RUN apt-get update && apt-get install -y \
    libgdal-dev \
    binutils \
    libproj-dev \
    gdal-bin


COPY  requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

ENV DEBUG="${DEBUG}" \
    PYTHONUNBUFFERED="true" \
    PATH="${PATH}:/home/python/.local/bin" \
    USER="python"



# Copy project files
COPY / .

# Run migrations automatically and then start the server
# RUN python manage.py migrate --noinput

RUN python manage.py collectstatic --noinput

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
