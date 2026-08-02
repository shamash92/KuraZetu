#!/usr/bin/env python3
"""Check a commit message against the MSG rules in CONTRIBUTING.md.

Used two ways, so that local checks and CI cannot drift apart:

    git-hooks/commit-msg.py .git/COMMIT_EDITMSG   # as a commit-msg hook
    git log -1 --pretty=%B | git-hooks/commit-msg.py --strict -   # in CI

Exits 0 when the message passes, 1 when it does not, 2 when the message
cannot be read. Rules needing human judgement (MSG3, MSG7, MSG13-MSG16)
are not checked here.
"""

import argparse
import re
import sys
from pathlib import Path

SUBJECT_LIMIT = 50
BODY_LIMIT = 72

# MSG2/MSG4: a lower-case, possibly hyphenated category in brackets, one
# space, then a capitalized word.
SUBJECT_RE = re.compile(r"^\[[a-z]+(-[a-z]+)*\] [A-Z]")

# MSG12: lines that are exempt from the body wrap limit.
NO_WRAP_RE = re.compile(r"^(>|\[[0-9]+\]|[A-Za-z-]+-by:|https?://)")

# Subjects git itself creates for autosquash; allowed unless --strict.
AUTOSQUASH_RE = re.compile(r"^(fixup|squash)! ")

SCISSORS = "# ------------------------ >8 ------------------------"


def strip_comments(msg: str) -> str:
    """Drop what git drops: comment lines, and anything below scissors."""
    lines = []
    for line in msg.split("\n"):
        if line.rstrip() == SCISSORS:
            break
        if not line.startswith("#"):
            lines.append(line)
    return "\n".join(lines).strip("\n")


def check(msg: str, strict: bool) -> list[str]:
    lines = strip_comments(msg).split("\n")
    problems = []

    subject = lines[0] if lines else ""
    if not subject.strip():
        return ["MSG1  the message has no subject line"]

    if not strict and AUTOSQUASH_RE.match(subject):
        return []

    if AUTOSQUASH_RE.match(subject):
        problems.append(f"MSG1  autosquash subject must be rebased away: {subject}")
    elif not SUBJECT_RE.match(subject):
        problems.append(
            "MSG2  subject must start with a lower-case [category], a single "
            f"space, then a capital letter: {subject}"
        )

    if len(subject) > SUBJECT_LIMIT:
        problems.append(
            f"MSG5  subject is {len(subject)} chars (max {SUBJECT_LIMIT}): {subject}"
        )

    if subject.endswith("."):
        problems.append("MSG6  subject must not end with a period")

    if len(lines) > 1 and lines[1].strip():
        problems.append("MSG8  line 2 must be blank when there is a body")

    for number, line in enumerate(lines[2:], start=3):
        if len(line) > BODY_LIMIT and not NO_WRAP_RE.match(line.strip()):
            problems.append(
                f"MSG12 line {number} is {len(line)} chars (max {BODY_LIMIT}): {line}"
            )

    blanks = 0
    for number, line in enumerate(lines, start=1):
        blanks = blanks + 1 if not line.strip() else 0
        if blanks > 1:
            problems.append(f"MSG10 line {number} is a second consecutive blank line")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="reject fixup!/squash! subjects, which are fine while drafting",
    )
    parser.add_argument(
        "commit_msg_file",
        help="path to a file holding the message, or - to read stdin",
    )
    args = parser.parse_args()

    if args.commit_msg_file == "-":
        msg = sys.stdin.read()
    else:
        try:
            msg = Path(args.commit_msg_file).read_text(encoding="utf-8")
        except OSError as error:
            print(f"cannot read {args.commit_msg_file}: {error}", file=sys.stderr)
            return 2

    problems = check(msg, args.strict)
    print("\n".join(problems) if problems else "OK")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
