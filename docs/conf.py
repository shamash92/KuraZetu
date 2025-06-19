# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Kura Zetu"
copyright = "2025, shamash92"
author = "shamash92"


html_title = project + " documentation"
html_theme = "alabaster"


html_static_path = ["_static"]

html_favicon = "_static/logo.jpg"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = []

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output


html_context = {
    #
    "discourse": "https://github.com/shamash92/KuraZetu",
    # NOTE: If set, links for viewing the documentation source files
    #       and creating GitHub issues are added at the bottom of each page.
    "github_url": "https://github.com/shamash92/KuraZetu",
    # Docs branch in the repo; used in links for viewing the source files
    "repo_default_branch": "main",
    # Docs location in the repo; used in links for viewing the source files
    "repo_folder": "/docs/",
    # TODO: To enable or disable the Previous / Next buttons at the bottom of pages
    # Valid options: none, prev, next, both
    "sequential_nav": "both",
    # TODO: To enable listing contributors on individual pages, set to True
    "display_contributors": True,
    # Required for feedback button
    "github_issues": "enabled",
    "product_tag": "_static/logo.jpg",
}

html_theme_options = {
    "source_edit_link": "https://github.com/shamash92/KuraZetu/blob/main/docs/",
}

linkcheck_ignore = []
linkcheck_anchors_ignore_for_url = []

extensions = [
    "canonical_sphinx",
    "sphinxcontrib.cairosvgconverter",
    "sphinx_last_updated_by_git",
]

exclude_patterns = [
    "doc-cheat-sheet*",
]

myst_heading_anchors = 2
