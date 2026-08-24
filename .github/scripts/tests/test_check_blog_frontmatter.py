import shlex
import subprocess
import sys
from pathlib import Path

import pytest
import yaml

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
VALIDATOR = REPOSITORY_ROOT / ".github" / "scripts" / "check_blog_frontmatter.py"
WORKFLOW = REPOSITORY_ROOT / ".github" / "workflows" / "blog-frontmatter.yml"
VALID_POST = """---
title: "A useful post"
author: alice
date: 2026-08-24
description: "A useful description."
image: blog/card.png
---
Body text.
"""


def run(repo, *args):
    return subprocess.run(
        args,
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def commit(repo, message):
    run(repo, "git", "add", ".")
    run(repo, "git", "commit", "-m", message)
    return run(repo, "git", "rev-parse", "HEAD")


@pytest.fixture
def repository(tmp_path):
    run(tmp_path, "git", "init", "-b", "main")
    run(tmp_path, "git", "config", "user.name", "CI Test")
    run(tmp_path, "git", "config", "user.email", "ci@example.invalid")
    (tmp_path / "src" / "blog" / "posts").mkdir(parents=True)
    (tmp_path / "src" / "blog" / "posts" / ".gitkeep").touch()
    (tmp_path / "src" / "staticfiles" / "blog").mkdir(parents=True)
    (tmp_path / "src" / "staticfiles" / "blog" / "card.png").write_bytes(b"card")
    commit(tmp_path, "Initial state")
    return tmp_path


def check(repository, base, author="alice"):
    return subprocess.run(
        [
            sys.executable,
            str(VALIDATOR),
            "--base",
            base,
            "--head",
            "HEAD",
            "--author",
            author,
            "--repository",
            str(repository),
        ],
        capture_output=True,
        text=True,
    )


def test_new_valid_post_by_pull_request_author_passes(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    (repository / "src" / "blog" / "posts" / "a-useful-post.md").write_text(VALID_POST)
    commit(repository, "Add post")

    result = check(repository, base)

    assert result.returncode == 0, result.stderr
    assert result.stdout == "Validated 1 blog post.\n"


def test_deleted_post_is_not_validated(repository):
    post = repository / "src" / "blog" / "posts" / "old-post.md"
    post.write_text(VALID_POST)
    commit(repository, "Add old post")
    base = run(repository, "git", "rev-parse", "HEAD")
    post.unlink()
    commit(repository, "Delete old post")

    result = check(repository, base)

    assert result.returncode == 0, result.stderr
    assert result.stdout == "No added or modified blog posts to validate.\n"


@pytest.mark.parametrize(
    ("field", "line"),
    [
        ("title", 'title: "A useful post"\n'),
        ("author", "author: alice\n"),
        ("date", "date: 2026-08-24\n"),
        ("description", 'description: "A useful description."\n'),
    ],
)
def test_post_missing_required_frontmatter_fails(repository, field, line):
    base = run(repository, "git", "rev-parse", "HEAD")
    relative_path = Path(f"src/blog/posts/missing-{field}.md")
    post = repository / relative_path
    post.write_text(VALID_POST.replace(line, ""))
    commit(repository, "Add invalid post")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == f"{relative_path}: missing required frontmatter: {field}\n"


def test_post_date_must_be_iso_8601(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "bad-date.md"
    post.write_text(VALID_POST.replace("date: 2026-08-24", 'date: "24 August 2026"'))
    commit(repository, "Add invalid date")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == "src/blog/posts/bad-date.md: date must be ISO 8601\n"


def test_post_updated_date_must_be_iso_8601(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "bad-updated-date.md"
    post.write_text(
        VALID_POST.replace("date: 2026-08-24", 'date: 2026-08-24\nupdated: "today"')
    )
    commit(repository, "Add invalid updated date")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/bad-updated-date.md: updated must be ISO 8601\n"
    )


def test_post_updated_date_cannot_precede_publication(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "early-updated-date.md"
    post.write_text(
        VALID_POST.replace("date: 2026-08-24", "date: 2026-08-24\nupdated: 2026-08-23")
    )
    commit(repository, "Add early updated date")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/early-updated-date.md: updated must not be before date\n"
    )


def test_post_filename_must_be_a_url_slug(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "Not A Slug.md"
    post.write_text(VALID_POST)
    commit(repository, "Add invalid filename")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/Not A Slug.md: filename must be a lowercase URL slug\n"
    )


def test_post_image_must_resolve_to_static_file(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "missing-image.md"
    post.write_text(VALID_POST.replace("blog/card.png", "blog/missing.png"))
    commit(repository, "Add missing image")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/missing-image.md: image does not resolve to a static file: "
        "blog/missing.png\n"
    )


def test_post_image_is_optional(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "no-image.md"
    post.write_text(VALID_POST.replace("image: blog/card.png\n", ""))
    commit(repository, "Add post without image")

    result = check(repository, base)

    assert result.returncode == 0, result.stderr
    assert result.stdout == "Validated 1 blog post.\n"


def test_post_social_image_must_resolve_to_static_file(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "missing-social-image.md"
    post.write_text(
        VALID_POST.replace(
            "image: blog/card.png",
            "social_image: blog/missing.png",
        )
    )
    commit(repository, "Add missing social image")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/missing-social-image.md: social_image does not resolve "
        "to a static file: blog/missing.png\n"
    )


def test_post_image_cannot_escape_static_roots(repository):
    (repository / "outside.png").write_bytes(b"outside")
    commit(repository, "Add non-static image")
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "escaped-image.md"
    post.write_text(VALID_POST.replace("blog/card.png", "../../outside.png"))
    commit(repository, "Reference non-static image")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/escaped-image.md: image does not resolve to a static file: "
        "../../outside.png\n"
    )


def test_new_post_author_must_match_pull_request_author(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "wrong-author.md"
    post.write_text(VALID_POST)
    commit(repository, "Add post by another author")

    result = check(repository, base, author="bob")

    assert result.returncode == 1
    assert result.stderr == (
        "src/blog/posts/wrong-author.md: author must match pull request author: "
        "expected bob, found alice\n"
    )


def test_modified_post_can_keep_another_authors_byline(repository):
    post = repository / "src" / "blog" / "posts" / "existing-post.md"
    post.write_text(VALID_POST)
    commit(repository, "Add existing post")
    base = run(repository, "git", "rev-parse", "HEAD")
    post.write_text(VALID_POST.replace("Body text.", "Corrected body text."))
    commit(repository, "Correct existing post")

    result = check(repository, base, author="bob")

    assert result.returncode == 0, result.stderr
    assert result.stdout == "Validated 1 blog post.\n"


def test_unrelated_change_is_not_validated(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    (repository / "README.md").write_text("Unrelated documentation change.\n")
    commit(repository, "Update documentation")

    result = check(repository, base)

    assert result.returncode == 0, result.stderr
    assert result.stdout == "No added or modified blog posts to validate.\n"


def test_workflow_scopes_and_wires_the_validator():
    workflow = yaml.load(WORKFLOW.read_text(), Loader=yaml.BaseLoader)

    assert workflow["on"]["pull_request"]["paths"] == ["src/blog/posts/*.md"]
    validate_step = next(
        step
        for step in workflow["jobs"]["validate"]["steps"]
        if step.get("name") == "Validate blog posts"
    )
    install_step = next(
        step
        for step in workflow["jobs"]["validate"]["steps"]
        if step.get("name") == "Install frontmatter parser"
    )
    assert install_step["run"] == "python -m pip install python-frontmatter"
    assert validate_step["env"] == {
        "BASE_SHA": "${{ github.event.pull_request.base.sha }}",
        "HEAD_SHA": "${{ github.event.pull_request.head.sha }}",
        "PR_AUTHOR": "${{ github.event.pull_request.user.login }}",
    }
    assert shlex.split(validate_step["run"]) == [
        "python",
        ".github/scripts/check_blog_frontmatter.py",
        "--base",
        "$BASE_SHA",
        "--head",
        "$HEAD_SHA",
        "--author",
        "$PR_AUTHOR",
    ]


def test_malformed_frontmatter_has_concise_error(repository):
    base = run(repository, "git", "rev-parse", "HEAD")
    post = repository / "src" / "blog" / "posts" / "malformed.md"
    post.write_text("---\ntitle: [\n---\nBody text.\n")
    commit(repository, "Add malformed post")

    result = check(repository, base)

    assert result.returncode == 1
    assert result.stderr == "src/blog/posts/malformed.md: invalid YAML frontmatter\n"
