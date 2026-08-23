#!/usr/bin/env python3
import argparse
import datetime
import re
import subprocess
import sys
from pathlib import Path

import frontmatter
import yaml

POSTS_PREFIX = "src/blog/posts/"
REQUIRED_FIELDS = ("title", "author", "date", "description")


def changed_posts(repository, base, head):
    result = subprocess.run(
        [
            "git",
            "diff",
            "--name-status",
            "--no-renames",
            base,
            head,
            "--",
            POSTS_PREFIX,
        ],
        cwd=repository,
        check=True,
        capture_output=True,
        text=True,
    )
    posts = []
    for line in result.stdout.splitlines():
        status, name = line.split("\t", 1)
        if status in {"A", "M"} and name.endswith(".md"):
            posts.append((status, Path(name)))
    return posts


def validate_post(repository, status, path, pull_request_author):
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", path.stem):
        return f"{path}: filename must be a lowercase URL slug"
    try:
        document = frontmatter.load(str(repository / path))
    except yaml.YAMLError:
        return f"{path}: invalid YAML frontmatter"
    missing = [field for field in REQUIRED_FIELDS if not document.get(field)]
    if missing:
        return f"{path}: missing required frontmatter: {', '.join(missing)}"
    if not isinstance(document["date"], datetime.date):
        return f"{path}: date must be ISO 8601"
    image = document.get("image")
    if image:
        image_path = Path(image)
        static_roots = [
            repository / "src" / "staticfiles",
            repository / "src" / "assets",
            repository / "src" / "ui" / "static",
            *(repository / "src").glob("*/static"),
        ]
        escapes_static = image_path.is_absolute() or ".." in image_path.parts
        if escapes_static or not any(
            (root / image_path).is_file() for root in static_roots
        ):
            return f"{path}: image does not resolve to a static file: {image}"
    if status == "A" and document["author"] != pull_request_author:
        return (
            f"{path}: author must match pull request author: "
            f"expected {pull_request_author}, found {document['author']}"
        )
    return None


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", required=True)
    parser.add_argument("--author", required=True)
    parser.add_argument("--repository", type=Path, default=Path.cwd())
    return parser.parse_args()


def main():
    args = parse_args()
    posts = changed_posts(args.repository, args.base, args.head)
    if not posts:
        print("No added or modified blog posts to validate.")
        return 0
    errors = [
        error
        for status, path in posts
        if (
            error := validate_post(
                args.repository,
                status,
                path,
                args.author,
            )
        )
    ]
    if errors:
        print(*errors, sep="\n", file=sys.stderr)
        return 1
    noun = "post" if len(posts) == 1 else "posts"
    print(f"Validated {len(posts)} blog {noun}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
