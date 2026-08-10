"""`/llms.txt` is the index a crawler reads when it cannot run JavaScript."""

from django.urls import reverse

DOCS = "https://kurazetu.readthedocs.io"


def get_llms_txt(client):
    return client.get(reverse("llms_txt")).content.decode()


class TestLlmsTxt:
    def test_is_served_as_plain_text(self, client):
        response = client.get(reverse("llms_txt"))

        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/plain")

    def test_is_served_from_the_site_root(self):
        # The convention is a fixed location; a crawler will not look elsewhere.
        assert reverse("llms_txt") == "/llms.txt"

    def test_opens_with_the_name_and_a_summary(self, client):
        body = get_llms_txt(client)

        assert body.startswith("# Kura Zetu\n")
        assert "\n> " in body

    def test_points_at_the_documentation_and_its_own_llms_files(self, client):
        body = get_llms_txt(client)

        assert f"{DOCS}/llms.txt" in body
        assert f"{DOCS}/llms-full.txt" in body

    def test_points_at_the_api_schema_rather_than_the_data_endpoints(self, client):
        body = get_llms_txt(client)

        assert "https://kurazetu.com/api/schema/yaml/" in body
        # These are Disallow-ed in robots.txt, so they must not be advertised.
        assert "kurazetu.com/api/results/" not in body
        assert "kurazetu.com/api/stations/" not in body

    def test_keeps_the_framing_unofficial(self, client):
        # Unwrapped, so the assertions do not depend on where lines break.
        prose = " ".join(get_llms_txt(client).split())

        assert "not an official source of election results" in prose
        assert "Independent Electoral and Boundaries Commission" in prose
