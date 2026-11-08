"""The QR code printed on a results form, read by the server from the photo.

The QR holds the station's 15-digit code followed by the form series. The
first 13 digits name the polling centre and the last two the stream. A value
the application sends is never used: a modified application can lie.
"""

import re

import zxingcpp
from PIL import Image

from stations.models import PollingStation

NOT_CHECKED = "not_checked"
MATCH = "match"
UNREAD = "unread"
OTHER_STREAM = "other_stream"
OTHER_CENTRE = "other_centre"
OTHER_FORM = "other_form"

RESULTS = [
    (NOT_CHECKED, "Not checked"),
    (MATCH, "Match"),
    (UNREAD, "Unread"),
    (OTHER_STREAM, "Other stream"),
    (OTHER_CENTRE, "Other centre"),
    (OTHER_FORM, "Other form"),
]
# A QR that could not be read, or was never checked, does not stop an upload
# counting. Only a QR read clearly as another station's or race's does.
COUNTS = {NOT_CHECKED, MATCH, UNREAD}

MESSAGES = {
    OTHER_STREAM: (
        "The QR code on this form is for another stream at this centre, so it "
        "cannot count here. A reviewer will check it."
    ),
    OTHER_CENTRE: (
        "The QR code on this form is for another polling station, so it cannot "
        "count here. A reviewer will check it."
    ),
    OTHER_FORM: (
        "The QR code on this form is for another race, so it cannot count "
        "here. A reviewer will check it."
    ),
}

# The two digits each race's form ends its QR in: Form 34A to Form 39A.
FORM_SERIES = {
    "president": "34",
    "mp": "35",
    "mca": "36",
    "governor": "37",
    "senator": "38",
    "women_rep": "39",
}

FORM_QR = re.compile(r"^(\d{15})(\d{2})$")
CENTRE_CODE_LENGTH = 13


def read_qr(photo):
    """The 17-digit form code in the photo, or None.

    Any other QR in the photo is ignored, so a code printed elsewhere cannot
    stand in for the form's.
    """
    try:
        with Image.open(photo) as image:
            found = zxingcpp.read_barcodes(image, formats=zxingcpp.BarcodeFormat.QRCode)
    finally:
        photo.seek(0)
    for barcode in found:
        value = barcode.text.strip()
        if FORM_QR.match(value):
            return value
    return None


def classify(value, station, race_key):
    """Compare a form code read from the photo with the upload's station."""
    parts = FORM_QR.match(value or "")
    if parts is None:
        return UNREAD
    station_code, series = parts.groups()
    # Only the code of a known station counts as read (spec C rule 2).
    if (
        station_code != station.code
        and not PollingStation.objects.filter(code=station_code).exists()
    ):
        return UNREAD
    if series != FORM_SERIES[race_key]:
        return OTHER_FORM
    if station_code == station.code:
        return MATCH
    if station_code[:CENTRE_CODE_LENGTH] == station.code[:CENTRE_CODE_LENGTH]:
        return OTHER_STREAM
    return OTHER_CENTRE
