import json
import logging
import os

from django.http import HttpResponse
from django.shortcuts import render

import requests
from decouple import config

BASE_DIR = os.path.dirname((os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)

BUNDLE_MISSING_MESSAGE = (
    "The frontend has not been built yet, so there is no webpack bundle to "
    "serve. Run `pnpm install && pnpm run dev` in src/ui, wait for a "
    "successful compile, then retry. See docs/tutorials/setup.md."
)


def get_js_bundle():
    IS_PROD = config("IS_PROD", default=False, cast=bool)

    if IS_PROD is False:
        # Local file path
        url = os.path.join(BASE_DIR, "ui/static/ui/manifest.json")
        try:
            with open(url, "r") as f:
                manifest = json.load(f)
        except FileNotFoundError:
            # webpack has not run yet, so there is no bundle to serve.
            logger.warning("No manifest at %s. %s", url, BUNDLE_MISSING_MESSAGE)
            return None
    else:
        # S3 endpoint for prod
        s3_endpoint = config("S3_ENDPOINT_URL")
        url = f"{s3_endpoint}/static/ui/manifest.json"
        response = requests.get(url)
        if response.status_code == 200:
            manifest = response.json()
        else:
            raise Exception(f"Error fetching manifest from S3: {response.status_code}")

    return manifest["main.js"]


def react_view(request):
    js_bundle = get_js_bundle()

    if js_bundle is None:
        # Browsers get the styled page; curl, scripts and agents get plain text
        # they can read without parsing HTML.
        if "text/html" not in request.headers.get("Accept", ""):
            return HttpResponse(
                f"{BUNDLE_MISSING_MESSAGE}\n",
                content_type="text/plain; charset=utf-8",
                status=503,
            )
        return render(request, "ui/bundle_missing.html", status=503)

    return render(request, "ui/index.html", {"js_bundle": js_bundle})
