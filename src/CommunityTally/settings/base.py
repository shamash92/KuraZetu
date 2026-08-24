import os
import sys

from decouple import Csv, config

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())
DEFAULT_SOCIAL_IMAGE = config(
    "DEFAULT_SOCIAL_IMAGE",
    default="blog/images/social-default.png",
)

INTERNAL_IPS = [
    # ...
    "127.0.0.1",
    # ...
]

# Application definition

DEFAULT_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",  # required for serving swagger ui's css/js files
    "django.contrib.sites",
    "django.contrib.sitemaps",
    "django.contrib.gis",
    "django.contrib.humanize",
]

THIRD_PARTY_APPS = [
    "corsheaders",
    "leaflet",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_gis",
    "crispy_forms",
    "crispy_tailwind",
    "django_browser_reload",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "admin_honeypot",
    "django_otp",
    "django_otp.plugins.otp_totp",
    "django_tailwind_cli",
]

MY_APPS = ["accounts", "stations", "ui", "results", "historical", "blog"]

INSTALLED_APPS = DEFAULT_APPS + THIRD_PARTY_APPS + MY_APPS

SITE_ID = 1


CRISPY_ALLOWED_TEMPLATE_PACKS = "tailwind"
CRISPY_TEMPLATE_PACK = "tailwind"


AUTH_USER_MODEL = "accounts.User"

# Numbers entered without a country code are read as Kenyan, so 0712345678 and
# 254712345678 both resolve to +254712345678. International numbers still work
# when written with their own prefix.
PHONENUMBER_DEFAULT_REGION = "KE"


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django_otp.middleware.OTPMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_browser_reload.middleware.BrowserReloadMiddleware",
    "CommunityTally.logging_utils.request_id.RequestIDMiddleware",
]

ROOT_URLCONF = "CommunityTally.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(BASE_DIR, "templates"),
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                # `allauth` needs this from django
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


WSGI_APPLICATION = "CommunityTally.wsgi.application"


# POSTGRESQL DATABASE
# DATABASES = {
#     "default": {
#         "ENGINE": "django.contrib.gis.db.backends.postgis",
#         "NAME": config("DATABASE_NAME"),
#         "USER": config("DATABASE_USER"),
#         "PASSWORD": config("DATABASE_PASSWORD"),
#         "HOST": config("DATABASE_HOST"),
#         "PORT": "5432",
#     }
# }

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

LOGIN_REDIRECT_URL = "/"


AUTHENTICATION_BACKENDS = [
    # Needed to login by username in Django admin, regardless of `allauth`
    "django.contrib.auth.backends.ModelBackend",
]

# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = "en-us"


USE_I18N = True

USE_L10N = True


# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "staticfiles"),
    os.path.join(BASE_DIR, "ui/static"),
    os.path.join(BASE_DIR, "assets"),
]

TAILWIND_CLI_VERSION = config("TAILWIND_CLI_VERSION", default="4.3.3")
TAILWIND_CLI_PATH = config(
    "TAILWIND_CLI_PATH", default=os.path.join(BASE_DIR, ".django_tailwind_cli")
)
TAILWIND_CLI_SRC_CSS = os.path.join(BASE_DIR, "assets", "css", "tailwind-input.css")


CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())


FILE_UPLOAD_HANDLERS = [
    "django.core.files.uploadhandler.MemoryFileUploadHandler",
    "django.core.files.uploadhandler.TemporaryFileUploadHandler",
]

SESSION_COOKIE_AGE = 3600  # Session expires after 1 hour (3600 seconds)

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    # 'PAGE_SIZE': 50,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Kura Zetu API - Kenyan Election Data & Results",
    "DESCRIPTION": "Comprehensive API for accessing Kenyan election data, including presidential, parliamentary, and local government results. Features real-time data, historical archives, and interactive documentation.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
    # Custom templates for SEO
    "SWAGGER_UI_TEMPLATE": "drf_spectacular/swagger_ui.html",
    "REDOC_UI_TEMPLATE": "drf_spectacular/redoc.html",
    # SEO and metadata
    "CONTACT": {
        "name": "Kura Zetu Team",
        "url": "https://kurazetu.com",
    },
    "LICENSE": {
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    # Schema tags for better organization
    "TAGS": [
        {
            "name": "stations",
            "description": "Geographic location data for counties, constituencies, and wards",
        },
        {"name": "results", "description": "Election results and party information"},
        {"name": "historical", "description": "Historical election data and archives"},
        {
            "name": "accounts",
            "description": "User authentication and account management",
        },
    ],
    # External documentation
    "EXTERNAL_DOCS": {
        "description": "Find more information about Kenyan elections",
        "url": "https://kurazetu.readthedocs.io/",
    },
}

# max upload size 20gb
DATA_UPLOAD_MAX_MEMORY_SIZE = 21474836480  # 20 * 1024 * 1024 * 1024
MAX_UPLOAD_SIZE = 21474836480
FILE_UPLOAD_MAX_MEMORY_SIZE = 21474836480
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000


LEAFLET_CONFIG = {
    "DEFAULT_CENTER": (-0.966408, 37.048688),
    "DEFAULT_ZOOM": 20,
    "MIN_ZOOM": 4,
    "MAX_ZOOM": 23,
    "PLUGINS": {"forms": {"auto-include": True}},
    # "TILES": [
    #     (
    #         "Google Maps Satellite",
    #         "http://mt{s}.google.com/vt/lyrs=s@207000000&hl=en&x={x}&y={y}&z={z}",
    #         {
    #             "type": "xyz",
    #             "ext": "png",
    #             "attribution": f"Data CC-By-SA by <a href='http://openstreetmap.org/' target='_blank'>OpenStreetMap</a>, Tiles Courtesy of <a href='http://www.mapquest.com/'>MapQuest</a>",
    #             "subdomains": ["1", "2", "3", "4"],
    #         },
    #     ),
    #     (
    #         'Google Maps',
    #         'http://mt{s}.google.com/vt/lyrs=m@207000000&hl=en&x={x}&y={y}&z={z}',
    #         {
    #             'type': 'xyz',
    #             'ext': 'png',
    #             'attribution': 'Data CC-By-SA by <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a>, Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a>',
    #             'subdomains': ['1', '2', '3', '4'],
    #         },
    #     ),
    # ],
    "ATTRIBUTION_PREFIX": "&copy; <a href='https://kurazetu.readthedocs.io/'>Kura Zetu</a>",
}

# ── Polling center verification ─────────────────────────────────────────
# Location search: Nominatim is the default (free, no key). Google Places is
# used automatically when GOOGLE_MAPS_API_KEY is set.
GOOGLE_MAPS_API_KEY = config("GOOGLE_MAPS_API_KEY", default="")
NOMINATIM_USER_AGENT = config(
    "NOMINATIM_USER_AGENT", default="KuraZetu/1.0 (+https://kurazetu.com)"
)

# Consensus: a center auto-verifies once this many in-ward, in-cluster
# suggestions agree within CONSENSUS_RADIUS_M metres of the cluster centroid.
CONSENSUS_THRESHOLD = config("CONSENSUS_THRESHOLD", default=3, cast=int)
CONSENSUS_RADIUS_M = config("CONSENSUS_RADIUS_M", default=150, cast=int)

# ── Logging ─────────────────────────────────────────────────────────────
# Everything goes to stdout. Under systemd that means journald, which already
# owns rotation, retention and querying. A JSON file can sit beside the source
# too, so a person or agent can inspect runtime evidence and code together.
#
#   journalctl -u <unit> -f                     follow
#   journalctl -u <unit> --since "1 hour ago" -o json | jq 'select(.level=="ERROR")'
#
# Retention is a systemd concern, set in journald.conf. Keep it short: it
# bounds how much history a compromised or seized server can yield.
LOG_LEVEL = config("LOG_LEVEL", default="INFO")
DJANGO_LOG_LEVEL = config("DJANGO_LOG_LEVEL", default="INFO")

# Humans read the console format; the JSON format is for `journalctl -o json`
# and for the agent that reads it. Overridable so production can be debugged in
# a readable format without a code change.
LOG_FORMAT = config("LOG_FORMAT", default="console" if DEBUG else "json")

# A JSON file alongside stdout, for tools that want a path to tail rather than a
# journalctl call: the log-reading agent, and anything correlating application
# events with nginx access logs while chasing bad traffic. The tracked local
# template writes to logs/app.json under BASE_DIR, and .gitignore keeps it out
# of commits. Empty disables file logging.
#
# WatchedFileHandler, never RotatingFileHandler: it reopens the file when
# logrotate replaces the inode, so several Gunicorn workers can write to one
# file without losing lines. Rotation belongs to logrotate, not to the app.
LOG_FILE = config("LOG_FILE", default="")

if LOG_FILE:
    if not os.path.isabs(LOG_FILE):
        LOG_FILE = os.path.join(BASE_DIR, LOG_FILE)

    # A logging destination must never stop the site from booting. Two things
    # go wrong on a real machine: the directory does not exist yet, which is
    # fixable here, and the path belongs to another user, which is not. The
    # first is created, the second falls back to the journal with a warning on
    # stderr. Either way the application starts.
    try:
        os.makedirs(os.path.dirname(os.path.abspath(LOG_FILE)), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8"):
            pass
    except OSError as exc:
        sys.stderr.write(
            f"LOG_FILE={LOG_FILE!r} is not writable ({exc.strerror}); "
            f"logging to stdout only.\n"
        )
        LOG_FILE = ""

LOGGING = {
    "version": 1,
    # Django and third-party libraries configure loggers at import time.
    # Disabling them here would silence warnings we want to see.
    "disable_existing_loggers": False,
    "filters": {
        "redaction": {
            "()": "CommunityTally.logging_utils.redaction.RedactionFilter",
        },
        "request_context": {
            "()": "CommunityTally.logging_utils.request_id.RequestContextFilter",
        },
    },
    "formatters": {
        "console": {
            "format": "%(asctime)s %(levelname)-8s %(name)-24s req=%(request_id)s user=%(user_id)s %(message)s",
            "datefmt": "%H:%M:%S",
        },
        "json": {
            "()": "CommunityTally.logging_utils.formatters.JSONFormatter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "formatter": LOG_FORMAT,
            # On the handler, not the loggers: a filter on a logger is skipped
            # when a child logger propagates a record up to it, which would let
            # unredacted records through.
            "filters": ["redaction", "request_context"],
        },
    },
    # Root catches our own modules and anything else without explicit config.
    "root": {
        "level": LOG_LEVEL,
        "handlers": ["console"],
    },
    "loggers": {
        "django": {
            "level": DJANGO_LOG_LEVEL,
            "handlers": ["console"],
            "propagate": False,
        },
        # Every request Django refused: 4xx and 5xx, with the path. The first
        # place to look when traffic turns hostile, though nginx sees the
        # requests that never reached Django at all.
        "django.security": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        # Every SQL statement at DEBUG. Left at INFO deliberately: it is
        # enormous, and query parameters can carry the data we redact.
        "django.db.backends": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Wired after the fact so the handler list stays in one place: every logger
# gains the file, or none does.
if LOG_FILE:
    LOGGING["handlers"]["logfile"] = {
        "class": "logging.handlers.WatchedFileHandler",
        "filename": LOG_FILE,
        # Always JSON. A file exists to be parsed, not read over someone's
        # shoulder.
        "formatter": "json",
        "filters": ["redaction", "request_context"],
    }
    LOGGING["root"]["handlers"].append("logfile")
    for _logger in LOGGING["loggers"].values():
        _logger["handlers"].append("logfile")
