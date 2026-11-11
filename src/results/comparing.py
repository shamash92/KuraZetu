"""Compare a new photo of a results form with an earlier one.

The model reports whether the two photos show the same sheet and every
difference in ink and marks. Fixed rules here turn its reply into a code.
"""

import io
import json
import time
from pathlib import Path

from PIL import Image, ImageDraw

from results import reading

VERSION = "compare-v2"

_FILES = Path(__file__).parent / "readings"
SYSTEM = (_FILES / f"{VERSION}.txt").read_text()
REPLY_FORMAT = json.loads((_FILES / f"{VERSION}.schema.json").read_text())

SAME_FORM = "same_form"
SAME_FORM_WITH_ADDITIONS = "same_form_with_additions"
DIFFERENT_COPY = "different_copy"
COMPARE_INCONCLUSIVE = "compare_inconclusive"
FORM_CHANGED = "form_changed"

# The parts of the form that hold the tally.
TALLY_PARTS = {
    "candidate_votes",
    "valid_votes_under_table",
    "valid_votes_in_counts",
    "rejected",
    "disputed",
}


def request(model, earlier, later):
    """The request for one attempt: photo A, then photo B, then the text."""
    return reading.body(
        model,
        SYSTEM,
        REPLY_FORMAT,
        [
            reading.image(earlier),
            {"type": "text", "text": "Photograph A, taken earlier."},
            reading.image(later),
            {
                "type": "text",
                "text": f"Photograph B, taken later, {_size(later)} pixels.\n\n"
                "Compare the two photographs and fill in the reply.",
            },
        ],
    )


def _size(photo):
    """Width by height in pixels, as the model is told."""
    with Image.open(io.BytesIO(photo)) as image:
        return f"{image.width} wide by {image.height} high"


def compare(client, earlier, later, clock=time.monotonic):
    """Sonnet first, Opus only when Sonnet's attempt fails.

    Raises reading.ReadFailed with the last error code when neither finishes.
    """
    return reading.ask(
        client, lambda model: request(model, earlier, later), REPLY_FORMAT, clock
    )


MARK_COLOUR = (214, 48, 49)


def points(reply):
    """Where on the new photo each difference sits: (x, y) in pixels of the
    copy the model read. A reply without points, or one made before they
    were asked for, gives none."""
    return [
        (difference["point_in_b"]["x"], difference["point_in_b"]["y"])
        for difference in (reply or {}).get("differences", [])
        if difference.get("point_in_b")
    ]


def marked(photo, reply):
    """JPEG bytes of the new photo with a red arrow pointing at each
    difference, or None when there is nothing to point at.

    Each arrow comes in sideways from the nearer edge of the page, so the
    arrows on a column of figures run side by side, and stops short of the
    ink so the figure stays readable.
    """
    found = points(reply)
    if not found:
        return None
    with Image.open(photo) as image:
        canvas = image.convert("RGB")
    width, height = canvas.size
    unit = min(width, height)
    line = max(2, round(unit / 450))
    length = unit * 0.05
    # Half a three-digit figure, plus a little air.
    gap = unit * 0.035
    head = line * 3
    draw = ImageDraw.Draw(canvas)
    for x, y in found:
        tip_x, tip_y = min(width, max(0, x)), min(height, max(0, y))
        # From the right on the right half of the photo, else from the left.
        side = 1 if tip_x >= width / 2 else -1
        tip = (tip_x + side * gap, tip_y)
        tail = (tip[0] + side * length, tip_y)
        draw.line((tail, (tip[0] + side * head, tip_y)), fill=MARK_COLOUR, width=line)
        draw.polygon(
            [
                tip,
                (tip[0] + side * head * 1.6, tip_y - head),
                (tip[0] + side * head * 1.6, tip_y + head),
            ],
            fill=MARK_COLOUR,
        )
    buffer = io.BytesIO()
    canvas.save(buffer, "JPEG", quality=88)
    return buffer.getvalue()


def outcome(reply):
    """The comparison's code: the first check below that fits."""
    if not reply["both_usable"] or reply["sheet"] == "cannot_tell":
        return COMPARE_INCONCLUSIVE
    if TALLY_PARTS & set(reply["not_compared"]):
        return COMPARE_INCONCLUSIVE
    if reply["sheet"] == "different_sheet":
        return DIFFERENT_COPY
    if any(d["affects_figure"] for d in reply["differences"]):
        return FORM_CHANGED
    if reply["differences"]:
        return SAME_FORM_WITH_ADDITIONS
    return SAME_FORM
