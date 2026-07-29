import os

from decouple import Csv, config

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

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
    "admin_honeypot",
    "django_otp",
    "django_otp.plugins.otp_totp",
    "django_tailwind_cli",
]

MY_APPS = ["accounts", "stations", "ui", "results", "historical"]

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
    "SWAGGER_UI_DIST": "SIDECAR",  # Serve Swagger UI from CDN
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",  # Serve Redoc from CDN
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
