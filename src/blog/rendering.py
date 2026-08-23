import html

import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from pygments.formatters import HtmlFormatter


class CodeBlockFormatter(HtmlFormatter):
    """Wraps highlighted code in the chrome bar the blog design expects.

    ``title`` is Pygments' own option name, so the filename shown in the bar is
    kept under a different attribute to survive ``HtmlFormatter.__init__``.
    """

    def __init__(self, **options):
        lang = options.pop("lang_str", "")
        self.bar_lang = "" if lang == "text" else lang
        self.bar_title = options.pop("title", "")
        super().__init__(**options)

    def _bar(self):
        if not self.bar_title and not self.bar_lang:
            return ""
        title = (
            f'<span class="f">{html.escape(self.bar_title)}</span>'
            if self.bar_title
            else ""
        )
        lang = (
            f'<span class="lang">{html.escape(self.bar_lang)}</span>'
            if self.bar_lang
            else ""
        )
        return f'<div class="cbar">{title}<span class="sp"></span>{lang}</div>'

    def wrap(self, source, *args):
        yield 0, f'<div class="codewrap">{self._bar()}<pre>'
        yield from source
        yield 0, "</pre></div>"

    def _wrap_div(self, inner):
        return inner


def _markdown():
    return markdown.Markdown(
        extensions=[
            "fenced_code",
            "tables",
            "attr_list",
            "toc",
            "smarty",
            CodeHiliteExtension(
                pygments_formatter=CodeBlockFormatter,
                lang_prefix="",
                guess_lang=False,
            ),
        ],
        output_format="html",
    )


def render(body):
    return _markdown().convert(body)
