"""Compare a new photo of a results form with an earlier one (block D2).

The model reports whether the two photos show the same sheet and every
difference in ink and marks. Fixed rules here turn its reply into a code.
"""

import json
import time
from pathlib import Path

from results import reading

VERSION = "compare-v1"

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


def outcome(reply):
    """The comparison's code: the first rule that fits (block D2, rule 24)."""
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
