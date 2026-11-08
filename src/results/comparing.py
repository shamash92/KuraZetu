"""Compare a new photo of a results form with an earlier one.

The model reports whether the two photos show the same sheet and every
difference in ink and marks. Fixed rules here turn its reply into a code.
"""

import io
import json
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

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
                "text": "Photograph B, taken later.\n\n"
                "Compare the two photographs and fill in the reply.",
            },
        ],
    )


def compare(client, earlier, later, clock=time.monotonic):
    """Sonnet first, Opus only when Sonnet's attempt fails.

    Raises reading.ReadFailed with the last error code when neither finishes.
    """
    return reading.ask(
        client, lambda model: request(model, earlier, later), REPLY_FORMAT, clock
    )


# What each kind of difference is called on the marked photo.
KIND_LABELS = {
    "figure_reads_differently": "Figure differs",
    "digit_added": "Digit added",
    "digit_written_over": "Written over",
    "crossed_out": "Crossed out",
    "correction_fluid": "Correction fluid",
    "erasure": "Erased",
    "mark_only_in_a": "Missing here",
    "mark_only_in_b": "Added here",
    "smudge_over_figure": "Smudge over figure",
    "other": "Differs",
}
MARK_COLOUR = (214, 48, 49)


def boxes(reply):
    """Each difference the model placed on the new photo: (box, label).

    The box is left, top, right, bottom, each 0 to 1000 of the photo's width
    or height. A reply without boxes, or one made before they were asked
    for, gives none.
    """
    found = []
    for difference in (reply or {}).get("differences", []):
        box = difference.get("box_in_b")
        if not box:
            continue
        sides = [min(1000, max(0, box[k])) for k in ("left", "top", "right", "bottom")]
        if sides[0] >= sides[2] or sides[1] >= sides[3]:
            continue
        label = KIND_LABELS.get(difference["kind"], "Differs")
        name = difference.get("candidate_name_as_printed")
        if name:
            label = f"{label}: {name.title()}"
        found.append((sides, label))
    return found


def marked(photo, reply):
    """JPEG bytes of the new photo with a box and a label on each
    difference, or None when there is nothing to mark."""
    found = boxes(reply)
    if not found:
        return None
    with Image.open(photo) as image:
        canvas = image.convert("RGB")
    width, height = canvas.size
    line = max(3, round(min(width, height) / 250))
    font = ImageFont.load_default(size=max(14, round(min(width, height) / 45)))
    draw = ImageDraw.Draw(canvas)
    for (left, top, right, bottom), label in found:
        rect = (
            left * width / 1000,
            top * height / 1000,
            right * width / 1000,
            bottom * height / 1000,
        )
        # A little room around the ink, so the box does not cover it.
        pad = line * 2
        rect = (rect[0] - pad, rect[1] - pad, rect[2] + pad, rect[3] + pad)
        draw.rectangle(rect, outline=MARK_COLOUR, width=line)
        text_box = draw.textbbox((0, 0), label, font=font)
        text_w, text_h = text_box[2] - text_box[0], text_box[3] - text_box[1]
        # Above the box, or inside its top when there is no room above.
        y = rect[1] - text_h - 2 * line if rect[1] > text_h + 2 * line else rect[1]
        draw.rectangle(
            (rect[0], y, rect[0] + text_w + 2 * line, y + text_h + 2 * line),
            fill=MARK_COLOUR,
        )
        draw.text(
            (rect[0] + line, y + line - text_box[1]),
            label,
            font=font,
            fill=(255, 255, 255),
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
