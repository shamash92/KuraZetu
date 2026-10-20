"""The terms and privacy pages are the addresses Google Play and the apps link to."""

import pytest


@pytest.mark.parametrize(
    "path, heading",
    [("/legal/terms/", "Terms of use"), ("/legal/privacy/", "Privacy policy")],
)
def test_signed_out_visitor_can_read_the_page(client, path, heading):
    response = client.get(path)

    assert response.status_code == 200
    assert f"<h1>{heading}</h1>" in response.content.decode()


def test_privacy_policy_has_a_deletion_section_to_link_to(client):
    assert 'id="deletion"' in client.get("/legal/privacy/").content.decode()
