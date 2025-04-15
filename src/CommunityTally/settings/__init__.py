"""
main settings file
"""

from .base import *

# from .production import *

try:
	from .local import *
except Exception as e:
	print(e, "error in settings/local.py")
