import os

from django.core.exceptions import ImproperlyConfigured

from decouple import Csv, config

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


DEBUG = config("DEBUG", default=False, cast=bool)

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


TIME_ZONE = "UTC"
USE_TZ = True


# CORS_URLS_REGEX = r"^/api.*"
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())
CORS_ORIGIN_ALLOW_ALL = True


CELERY_TIMEZONE = "UTC"


# CORS_REPLACE_HTTPS_REFERER = True
HOST_SCHEME = "https://"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 1000000
SECURE_HSTS_PRELOAD = True
SECURE_FRAME_DENY = True

# AWS settings
from CommunityTally.aws.conf import *

IS_PROD = True
AWS_QUERYSTRING_AUTH = False

# Production must never silently fall back to a fake SMS adapter.
OTP_SMS_BACKEND = "africastalking"
if not config("AT_USERNAME", default="") or not config("AT_API_KEY", default=""):
    raise ImproperlyConfigured(
        "AT_USERNAME and AT_API_KEY are required when OTP SMS is live."
    )
