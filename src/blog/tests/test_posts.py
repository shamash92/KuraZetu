import datetime

import pytest

from blog import posts as posts_module
from blog.posts import InvalidPost, Post, _build, all_posts, get_post

VALID = """---
title: "A title"
author: shamash92
date: 2026-08-23
description: "A description."
---
Body text here.
"""


def write(tmp_path, name, text):
    path = tmp_path / name
    path.write_text(text)
    return path


def test_build_reads_frontmatter(tmp_path):
    post = _build(write(tmp_path, "a-title.md", VALID))

    assert post.slug == "a-title"
    assert post.title == "A title"
    assert post.author == "shamash92"
    assert post.date == datetime.date(2026, 8, 23)
    assert post.updated is None
    assert post.draft is False
    assert "Body text here." in post.body


@pytest.mark.parametrize("field", ["title", "author", "date", "description"])
def test_build_rejects_missing_required_field(tmp_path, field):
    text = "\n".join(
        line for line in VALID.splitlines() if not line.startswith(f"{field}:")
    )

    with pytest.raises(InvalidPost, match=field):
        _build(write(tmp_path, "broken.md", text))


def test_build_rejects_unparsed_date(tmp_path):
    text = VALID.replace("date: 2026-08-23", 'date: "last tuesday"')

    with pytest.raises(InvalidPost, match="ISO 8601"):
        _build(write(tmp_path, "bad-date.md", text))


def test_build_reads_updated_date(tmp_path):
    text = VALID.replace("date: 2026-08-23", "date: 2026-08-23\nupdated: 2026-08-24")

    post = _build(write(tmp_path, "updated.md", text))

    assert post.updated == datetime.date(2026, 8, 24)


def test_build_rejects_unparsed_updated_date(tmp_path):
    text = VALID.replace("date: 2026-08-23", 'date: 2026-08-23\nupdated: "today"')

    with pytest.raises(InvalidPost, match="updated date that is not ISO 8601"):
        _build(write(tmp_path, "bad-updated-date.md", text))


def test_build_rejects_updated_date_before_publication(tmp_path):
    text = VALID.replace("date: 2026-08-23", "date: 2026-08-23\nupdated: 2026-08-22")

    with pytest.raises(InvalidPost, match="updated date before"):
        _build(write(tmp_path, "early-updated-date.md", text))


def test_slug_comes_from_filename(tmp_path):
    post = _build(write(tmp_path, "some-other-name.md", VALID))

    assert post.slug == "some-other-name"


def test_reading_time_is_at_least_one_minute(tmp_path):
    post = _build(write(tmp_path, "short.md", VALID))

    assert post.reading_time == 1


def test_code_block_renders_with_chrome_bar(tmp_path):
    text = VALID + '\n```{.python title="views.py"}\nx = 1\n```\n'

    post = _build(write(tmp_path, "code.md", text))

    assert '<div class="codewrap">' in post.body
    assert '<span class="f">views.py</span>' in post.body
    assert '<span class="lang">python</span>' in post.body


def test_drafts_hidden_when_debug_off(tmp_path, settings, monkeypatch):
    write(tmp_path, "live.md", VALID)
    write(tmp_path, "hidden.md", VALID.replace("---\nBody", "draft: true\n---\nBody"))
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)

    settings.DEBUG = False
    assert [post.slug for post in all_posts()] == ["live"]

    settings.DEBUG = True
    assert sorted(post.slug for post in all_posts()) == ["hidden", "live"]


def test_posts_are_newest_first(tmp_path, monkeypatch, settings):
    settings.DEBUG = False
    write(tmp_path, "older.md", VALID.replace("2026-08-23", "2026-01-01"))
    write(tmp_path, "newer.md", VALID.replace("2026-08-23", "2026-12-01"))
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)

    assert [post.slug for post in all_posts()] == ["newer", "older"]


def test_get_post_returns_none_for_unknown_slug(tmp_path, monkeypatch, settings):
    settings.DEBUG = False
    write(tmp_path, "live.md", VALID)
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)

    assert get_post("live").slug == "live"
    assert get_post("nope") is None


def test_initial_is_first_letter_of_author():
    post = Post(
        slug="s",
        title="t",
        author="shamash92",
        date=datetime.date(2026, 1, 1),
        updated=None,
        description="d",
        image="",
        social_image="",
        draft=False,
        body="",
        reading_time=1,
    )

    assert post.initial == "S"


def test_shipped_posts_all_parse():
    for post in all_posts():
        assert post.slug and post.title and post.author
