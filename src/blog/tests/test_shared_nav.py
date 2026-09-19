import re
from html.parser import HTMLParser
from pathlib import Path

from django.core.cache import cache
from django.templatetags.static import static
from django.urls import reverse

import pytest


class NavigationParser(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_nav = False
        self.links = []
        self.current = []
        self.stylesheets = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "nav":
            self.in_nav = attrs.get("aria-label") == "Primary navigation"
        if tag == "a" and self.in_nav:
            self.links.append(attrs["href"])
        if "aria-current" in attrs:
            self.current.append(attrs)
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.stylesheets.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "nav":
            self.in_nav = False


@pytest.fixture(autouse=True)
def clear_navigation_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.parametrize(
    "page,current", [("blog:list", "blog:list"), ("rapidoc", "swagger")]
)
def test_page_navigation_matches_landing_page(client, page, current):
    response = client.get(reverse(page))
    assert response.status_code == 200
    html = response.content.decode()
    nav = NavigationParser(html)
    landing = (
        Path(__file__).resolve().parents[2] / "ui/src/landing-pages/nav.tsx"
    ).read_text()
    desktop_nav = landing.split("<nav", 1)[1].split("</nav>", 1)[0]
    expected_links = re.findall(r'href="([^"]+)"', desktop_nav)

    assert nav.links == expected_links
    for text in (
        "KuraZetu",
        "powered by Kiongozi",
        "pinVerify254",
        "Contribute",
        "About",
        "Blog",
        "API",
        "Login",
        "Register",
        "Sign Up",
    ):
        assert text in landing
        assert text in html
    for href in ("/accounts/login/", "/ui/signup/"):
        assert f'href="{href}"' in landing
        assert f'href="{href}"' in html
    assert "/accounts/logout/" not in html
    assert nav.stylesheets.count(static("shared/site-nav.css")) == 1
    assert len(nav.current) == 1
    assert nav.current[0]["aria-current"] == "page"
    assert nav.current[0]["href"] == reverse(current)


@pytest.mark.django_db
@pytest.mark.parametrize("page", ["blog:list", "rapidoc"])
def test_page_navigation_uses_session_auth(client, django_user_model, page, settings):
    settings.DEBUG = False
    url = reverse(page)
    # Prime the anonymous cache before visiting the same page while signed in.
    assert b"Login</a>" in client.get(url).content
    user = django_user_model.objects.create_user(
        **{django_user_model.USERNAME_FIELD: "+254700000000"}
    )
    client.force_login(user, backend="django.contrib.auth.backends.ModelBackend")
    response = client.get(url)
    assert response.status_code == 200
    assert b'href="/accounts/logout/">Logout</a>' in response.content
    assert b'href="/accounts/login/"' not in response.content
    assert b'href="/ui/signup/"' not in response.content
    if page == "blog:list":
        assert "Cookie" in response.headers["Vary"]
    client.logout()
    assert b"Login</a>" in client.get(url).content


def test_rapidoc_keeps_alternate_api_formats(client):
    response = client.get(reverse("rapidoc"))
    for name in ("rapidoc", "swagger", "redoc", "schema"):
        assert f'href="{reverse(name)}"' in response.content.decode()
