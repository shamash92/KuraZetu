from django.template.loader import render_to_string


def test_shared_nav_marks_blog_as_current():
    html = render_to_string(
        "shared/site_nav.html",
        {"current_nav": "blog", "sticky_nav": True},
    )

    assert html.count('aria-current="page"') == 1
    assert 'href="/blog/" class="is-current" aria-current="page"' in html
    assert "Swagger" not in html


def test_shared_nav_lists_api_formats():
    html = render_to_string(
        "shared/site_nav.html",
        {"api_formats": True, "current_nav": "rapidoc"},
    )

    assert html.count('aria-current="page"') == 1
    assert 'href="/api/schema/rapidoc/" class="is-current" aria-current="page"' in html
    assert "Swagger" in html
    assert "Redoc" in html
    assert "OpenAPI YAML" in html
