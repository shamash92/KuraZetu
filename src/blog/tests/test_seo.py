import json
import re
import xml.etree.ElementTree as ElementTree
from types import SimpleNamespace

from django.core.cache import cache
from django.urls import reverse

import pytest

from blog import posts as posts_module

VALID = """---
title: "A shipped title"
author: shamash92
date: 2026-08-23
description: "A description."
---
Body text here.
"""


@pytest.fixture(autouse=True)
def clear_view_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def posts_dir(tmp_path, monkeypatch, settings):
    settings.DEBUG = False
    (tmp_path / "a-shipped-title.md").write_text(VALID)
    (tmp_path / "a-draft.md").write_text(
        VALID.replace("---\nBody", "draft: true\n---\nBody")
    )
    monkeypatch.setattr(posts_module, "POSTS_DIR", tmp_path)
    return tmp_path


@pytest.fixture
def current_site(monkeypatch):
    site = SimpleNamespace(domain="kurazetu.test", name="Kura Zetu")
    monkeypatch.setattr(
        "django.contrib.sitemaps.views.get_current_site", lambda _: site
    )
    monkeypatch.setattr(
        "django.contrib.syndication.views.get_current_site", lambda _: site
    )
    return site


def xml_locations(response):
    root = ElementTree.fromstring(response.content)
    return {
        node.text
        for node in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    }


def test_sitemap_preserves_static_urls_and_lists_only_published_posts(
    client, posts_dir, current_site
):
    response = client.get(reverse("sitemap"))

    assert response.status_code == 200
    locations = xml_locations(response)
    assert "https://kurazetu.test/" in locations
    assert "https://kurazetu.test/api/schema/rapidoc/" in locations
    assert "https://kurazetu.test/blog/" in locations
    assert "https://kurazetu.test/blog/a-shipped-title/" in locations
    assert "https://kurazetu.test/blog/a-draft/" not in locations


def test_feed_is_valid_xml_and_lists_only_published_posts(
    client, posts_dir, current_site
):
    response = client.get(reverse("blog:feed"))

    assert response.status_code == 200
    root = ElementTree.fromstring(response.content)
    assert root.tag == "rss"
    assert root.attrib["version"] == "2.0"
    titles = [node.text for node in root.findall("./channel/item/title")]
    assert titles == ["A shipped title"]


def test_detail_has_absolute_social_and_canonical_metadata(client, posts_dir):
    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    assert response.status_code == 200
    content = response.content.decode()
    canonical = "http://testserver/blog/a-shipped-title/"
    assert f'<link rel="canonical" href="{canonical}" />' in content
    assert '<meta property="og:type" content="article" />' in content
    assert f'<meta property="og:url" content="{canonical}" />' in content
    assert '<meta property="article:published_time" content="2026-08-23" />' in content
    assert '<meta name="twitter:card" content="summary_large_image" />' in content
    assert f'<meta name="twitter:url" content="{canonical}" />' in content
    assert '<meta property="og:type" content="website" />' not in content


def test_detail_uses_post_image_in_social_metadata(client, posts_dir):
    path = posts_dir / "a-shipped-title.md"
    path.write_text(VALID.replace("---\nBody", "image: blog/card.png\n---\nBody"))

    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    assert (
        '<meta property="og:image" '
        'content="http://testserver/static/blog/card.png" />'
    ) in response.content.decode()


def test_detail_uses_configured_default_social_image(client, posts_dir, settings):
    settings.DEFAULT_SOCIAL_IMAGE = "https://cdn.example.test/blog/card.png"

    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    assert (
        '<meta property="og:image" '
        'content="https://cdn.example.test/blog/card.png" />'
    ) in response.content.decode()


def test_detail_has_article_json_ld(client, posts_dir):
    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    match = re.search(
        r'<script type="application/ld\+json">(.*?)</script>',
        response.content.decode(),
    )
    assert match is not None
    article = json.loads(match.group(1))
    assert article["@type"] == "Article"
    assert article["headline"] == "A shipped title"
    assert article["datePublished"] == "2026-08-23"
    assert article["author"]["name"] == "shamash92"
    assert article["mainEntityOfPage"]["@id"] == (
        "http://testserver/blog/a-shipped-title/"
    )


def test_article_json_ld_escapes_script_closing_tags(client, posts_dir):
    path = posts_dir / "a-shipped-title.md"
    path.write_text(VALID.replace("A shipped title", "A </script> title"))

    response = client.get(reverse("blog:detail", args=["a-shipped-title"]))

    content = response.content.decode()
    assert r"A \u003C/script\u003E title" in content
    assert "A </script> title" not in content


def test_blog_pages_advertise_the_feed(client, posts_dir):
    response = client.get(reverse("blog:list"))

    assert (
        '<link rel="alternate" type="application/rss+xml" '
        'title="Kura Zetu Blog" href="/blog/feed.xml" />'
    ) in response.content.decode()
