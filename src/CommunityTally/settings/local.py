import os

from decouple import Csv, config

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY")


INTERNAL_IPS = [
    # ...
    "127.0.0.1",
    # ...
]


# Database

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": config("DATABASE_NAME"),
        "USER": config("DATABASE_USER"),
        "PASSWORD": config("DATABASE_PASSWORD"),
        "HOST": config("DATABASE_HOST"),
        "PORT": "5432",
    }
}


STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "staticfiles"),
    os.path.join(BASE_DIR, "ui/static"),
    os.path.join(BASE_DIR, "tailwind/static"),
]  # This is the directory that you should serve static files from in development.
# STATIC_ROOT and STATICFILES_DIRS cannot point to the same directory.


STATIC_ROOT = os.path.join(
    BASE_DIR, "static"
)  # This is the directory that you should serve static files from in production.

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

STATIC_URL = "/static/"

TIME_ZONE = "Africa/Nairobi"
USE_TZ = True


CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())


# mac specific
# GDAL_LIBRARY_PATH = '/opt/homebrew/opt/gdal/lib/libgdal.dylib'
# GEOS_LIBRARY_PATH = '/opt/homebrew/opt/geos/lib/libgeos_c.dylib'
