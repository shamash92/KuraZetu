"""Select the appropriate settings module for the current environment."""

from decouple import config

from .base import *

# Local development must not load the S3-only production configuration.  In
# particular, the production uploader requires credentials that are not used
# when Django serves local media files.
if config("DEBUG", default=False, cast=bool):
    from .local import *
else:
    from .production import *
