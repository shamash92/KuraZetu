from django.core.cache import cache
from django.urls import reverse

import pytest

from blog import posts as posts_module


@pytest.fixture(autouse=True)
def clear_view_cache():
    cache.clear()
    yield
    cache.clear()


VALID = """---
title: "A shipped title"
author: shamash92
date: 2026-08-23
description: "A description."
---
Body text here.
"""


@pytest.fixture
def posts_dir(tmp_path, monkeypatch, settings):
    settings.DEBUG = False
    (tmp_path / "a-shipped-title.md").write_text(VALID)
    (tmp_path / "a-draft.md").write_text(
        VALID.replace("---\nBody", "draft: true\n---\nBody")
    )
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)
    return tmp_path


def test_list_shows_published_and_hides_drafts(client, posts_dir):
    response = client.get(reverse("blog:list"))

    assert response.status_code == 200
    assert b"A shipped title" in response.content
    assert b"a-draft" not in response.content


def test_detail_renders_post(client, posts_dir):
    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    assert response.status_code == 200
    assert b"A shipped title" in response.content
    assert b"@shamash92" in response.content


def test_detail_renders_post_image_in_hero(client, posts_dir):
    path = posts_dir / "a-shipped-title.md"
    path.write_text(
        VALID.replace(
            "---\nBody",
            "image: blog/images/article.png\n---\nBody",
        )
    )

    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    content = response.content.decode()
    image = '<img src="/static/blog/images/article.png" alt="" />'
    assert "blog-hero--with-image" in content
    assert image in content
    assert content.index(image) < content.index("<h1>A shipped title</h1>")


def test_detail_shows_updated_date(client, posts_dir):
    path = posts_dir / "a-shipped-title.md"
    path.write_text(
        VALID.replace("date: 2026-08-23", "date: 2026-08-23\nupdated: 2026-08-24")
    )

    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    assert 'Updated <time datetime="2026-08-24">24 Aug 2026</time>' in (
        response.content.decode()
    )


def test_detail_404s_for_draft(client, posts_dir):
    assert client.get(reverse("blog:detail", args=["a-draft"])).status_code == 404


def test_detail_404s_for_unknown_slug(client, posts_dir):
    assert client.get(reverse("blog:detail", args=["nope"])).status_code == 404


def test_list_survives_an_empty_posts_directory(
    client, tmp_path, monkeypatch, settings
):
    settings.DEBUG = False
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)

    response = client.get(reverse("blog:list"))

    assert response.status_code == 200
    assert b"No posts published yet" in response.content


def test_list_survives_a_missing_posts_directory(
    client, tmp_path, monkeypatch, settings
):
    settings.DEBUG = False
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path / "does-not-exist")

    response = client.get(reverse("blog:list"))

    assert response.status_code == 200
    assert b"No posts published yet" in response.content


def test_list_url_is_blog_root():
    assert reverse("blog:list") == "/blog/"


def test_detail_url_is_flat_slug():
    assert reverse("blog:detail", args=["a-slug"]) == "/blog/a-slug/"
