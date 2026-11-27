"""The component catalog page frames the static Storybook build."""


def test_signed_out_visitor_gets_the_catalog_frame(client):
    response = client.get("/components/")

    assert response.status_code == 200
    assert 'src="/static/storybook/index.html"' in response.content.decode()


def test_navbar_marks_components_current_under_design(client):
    html = client.get("/components/").content.decode()

    assert '<summary class="is-current">Design</summary>' in html
    assert 'href="/components/" class="is-current" aria-current="page"' in html
