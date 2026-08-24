import datetime
import re
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings

import frontmatter

from blog.rendering import render

POSTS_DIR = Path(__file__).resolve().parent / "posts"

REQUIRED_FIELDS = ("title", "author", "date", "description")

WORDS_PER_MINUTE = 200


class InvalidPost(Exception):
    pass


@dataclass(frozen=True)
class Post:
    slug: str
    title: str
    author: str
    date: datetime.date
    updated: datetime.date | None
    description: str
    image: str
    social_image: str
    draft: bool
    body: str
    reading_time: int

    @property
    def initial(self):
        return self.author[:1].upper()


def _reading_time(text):
    return max(1, round(len(re.findall(r"\w+", text)) / WORDS_PER_MINUTE))


def _build(path):
    document = frontmatter.load(str(path))

    missing = [field for field in REQUIRED_FIELDS if not document.get(field)]
    if missing:
        raise InvalidPost(f"{path.name} is missing frontmatter: {', '.join(missing)}")

    date = document["date"]
    if not isinstance(date, datetime.date):
        raise InvalidPost(f"{path.name} has a date that is not ISO 8601: {date!r}")

    updated = document.get("updated")
    if updated is not None and not isinstance(updated, datetime.date):
        raise InvalidPost(
            f"{path.name} has an updated date that is not ISO 8601: {updated!r}"
        )
    if updated is not None and updated < date:
        raise InvalidPost(
            f"{path.name} has an updated date before its publication date"
        )

    return Post(
        slug=path.stem,
        title=document["title"],
        author=document["author"],
        date=date,
        updated=updated,
        description=document["description"],
        image=document.get("image", ""),
        social_image=document.get("social_image", ""),
        draft=bool(document.get("draft", False)),
        body=render(document.content),
        reading_time=_reading_time(document.content),
    )


def all_posts():
    posts = [_build(path) for path in sorted(POSTS_DIR.glob("*.md"))]
    if not settings.DEBUG:
        posts = [post for post in posts if not post.draft]
    return sorted(posts, key=lambda post: post.date, reverse=True)


def get_post(slug):
    for post in all_posts():
        if post.slug == slug:
            return post
    return None
