import os

from decouple import config

from CommunityTally.settings.base import *

SECRET_KEY = "!8ytp74y4!l5x%rw6*mx4fmuzi&o14v$_x&^))$jyajl6py356"
DATABASES = {
	"default": {
		"ENGINE": "django.contrib.gis.db.backends.postgis",
		"NAME": "community_test_db",
		"USER": "test_admin",
		"HOST": "localhost",
		"PASSWORD": "community_password",
		"PORT": "5432",
	}
}


MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

STATIC_URL = "/static/"


CORS_REPLACE_HTTPS_REFERER = False
HOST_SCHEME = "http://"
SECURE_PROXY_SSL_HEADER = None
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = None
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_FRAME_DENY = False


IS_TESTING = True
