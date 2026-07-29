import json

from django.urls import reverse

import pytest

from ui import views


@pytest.fixture
def manifest(tmp_path, monkeypatch):
    """Point the view at a temporary BASE_DIR and write a manifest into it."""

    def _write(contents):
        static_dir = tmp_path / "ui" / "static" / "ui"
        static_dir.mkdir(parents=True)
        (static_dir / "manifest.json").write_text(json.dumps(contents))

    monkeypatch.setattr(views, "BASE_DIR", str(tmp_path))
    return _write


class TestGetJsBundle:
    def test_returns_the_hashed_bundle_path(self, manifest):
        manifest({"main.js": "/main.abc123.js"})

        assert views.get_js_bundle() == "/main.abc123.js"

    def test_returns_none_without_a_manifest(self, manifest):
        assert views.get_js_bundle() is None


class TestReactView:
    def test_explains_itself_when_the_frontend_has_not_been_built(
        self, client, manifest
    ):
        # No manifest written: webpack has never run.
        response = client.get(reverse("react"))

        assert response.status_code == 503

        body = response.content.decode()
        assert "pnpm install" in body
        assert "pnpm run dev" in body
        assert "One more step" in body
